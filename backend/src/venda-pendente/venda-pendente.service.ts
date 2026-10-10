import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { VendaPendente } from './venda-pendente.entity';
import { statusVenda } from './enums/status-venda.enum';
import { FiltroVendasDto } from './dto/filtro-vendas.dto';
import { SelectQueryBuilder } from 'typeorm/query-builder/SelectQueryBuilder';
import { MAX_IDS_POR_LOTE } from './dto/atualizar-lote.dto';

const TRANSACOES_PERMITIDAS: Record<statusVenda, statusVenda[]> = {
  [statusVenda.PENDENTE]: [statusVenda.FATURADO, statusVenda.CANCELADO],
  [statusVenda.FATURADO]: [],
  [statusVenda.CANCELADO]: []
};

export interface ResumoLoja{
  loja: string;
  pendente: number;
  valorTotal: number;
}

export interface ResultadoLote{
  total: number;
  sucesso: number;
  falhas: number;
  atualizados: number[];
  detalhesFalhas: Array<{ id: number; motivo: string }>
}

@Injectable()
export class VendaPendenteService {
  private readonly logger = new Logger(VendaPendenteService.name);

  constructor(
    @InjectRepository(VendaPendente)
    private readonly repository: Repository<VendaPendente>,
  ) {}

  private validarPeriodo(filtro: FiltroVendasDto): void {
    if(filtro.dataDe && filtro.dataAte && filtro.dataDe > filtro.dataAte){
      throw new BadRequestException('dataDe não pode ser maior que dataAte')
    }
  }

  private aplicarFiltros(
    qb: SelectQueryBuilder<VendaPendente>,
    filtro: FiltroVendasDto,
  ): SelectQueryBuilder<VendaPendente> {
    if (filtro.loja) qb.andWhere('v.loja = :loja', { loja: filtro.loja });
    if (filtro.status) qb.andWhere('v.status = :status', { status: filtro.status });
    if (filtro.dataDe) qb.andWhere('v.dataVenda >= :dataDe', { dataDe: filtro.dataDe });
    if (filtro.dataAte) qb.andWhere('v.dataVenda <= :dataAte', { dataAte: filtro.dataAte });
    return qb;
  }

  private motivoTransicao(atual: statusVenda, novo: statusVenda): string | null {
    if(atual === novo) return null;
    if(!TRANSACOES_PERMITIDAS[atual]?.includes(novo)){
      return `Transição inválida de ${atual} para ${novo}`
    }
    return null;
  }

  async findAll(filtro: FiltroVendasDto): Promise<VendaPendente[]> {
    this.validarPeriodo(filtro)
    const qb = this.repository.createQueryBuilder('v');
    this.aplicarFiltros(qb, filtro);
    return qb.orderBy('v.dataVenda', 'DESC').getMany();
  }

  async atualizarStatus(id: number, novoStatus: statusVenda): Promise<VendaPendente> {
    return this.repository.manager.transaction(async (manager) => {
      const venda = await manager.findOne(VendaPendente, { where: { id }});
      if(!venda) throw new NotFoundException(`Venda ${id} não encontrada`);

      const motivo = this.motivoTransicao(venda.status, novoStatus);
      if(motivo) throw new BadRequestException(motivo);

      await manager.update(VendaPendente, { id }, { status: novoStatus});
      return { ...venda, status: novoStatus};
    })
  }

  async atualizarStatusEmLote(ids: number[], novoStatus: statusVenda): Promise<ResultadoLote> {
    const unicos = [...new Set(ids)];
    if(unicos.length > MAX_IDS_POR_LOTE) {
      throw new BadRequestException(`Lote excede o limite de ${MAX_IDS_POR_LOTE} ids`);
    }

    return this.repository.manager.transaction(async (manager) => {
      const existentes = await manager.find(VendaPendente, {
        where: { id: In(unicos) },
        select: ['id', 'status'],
      });
      const statusPorId = new Map(existentes.map((v) => [v.id, v.status]));

      const atualizados: number[] = [];
      const detalhesFalhas: Array<{ id: number, motivo: string}> = [];

      for(const id of unicos) {
        const statusAtual = statusPorId.get(id);
        if(statusAtual === undefined) {
          detalhesFalhas.push({ id, motivo: 'Venda não encontrada'});
          continue;
        }
        const motivo = this.motivoTransicao(statusAtual, novoStatus);
        if(motivo) {
          detalhesFalhas.push({ id, motivo });
          continue;
        }
        atualizados.push(id);
      }

      if(atualizados.length > 0) {
        await manager.update(
          VendaPendente,
          { id: In(atualizados) },
          { status: novoStatus},
        );
      }

      this.logger.log(
        `Lote: ${atualizados.length}/${unicos.length} atualizados, ${detalhesFalhas.length} falhas`,
      );

      return {
        total: unicos.length,
        sucesso: atualizados.length,
        falhas: detalhesFalhas.length,
        atualizados,
        detalhesFalhas
      };
    });
  }

  async getResumoPorLoja(filtro: FiltroVendasDto): Promise<ResumoLoja[]> {
    this.validarPeriodo(filtro);

    const qb = this.repository
      .createQueryBuilder('v')
      .select('v.loja', 'loja')
      .addSelect('COUNT(*)', 'pendente')
      .addSelect('COALESCE(SUM(v.valorVenda), 0)', 'valorTotal')
      .where('v.status = :status', { status: statusVenda.PENDENTE });

    if (filtro.loja) qb.andWhere('v.loja = :loja', { loja: filtro.loja });
    if (filtro.dataDe) qb.andWhere('v.dataVenda >= :dataDe', { dataDe: filtro.dataDe });
    if (filtro.dataAte) qb.andWhere('v.dataVenda <= :dataAte', { dataAte: filtro.dataAte });

    qb.groupBy('v.loja').orderBy('v.loja', 'ASC');

    const rows = await qb.getRawMany<{ loja: string; pendente: string; valorTotal: string }>();

    return rows.map((r) => ({
      loja: r.loja,
      pendente: Number(r.pendente),
      valorTotal: Number(r.valorTotal),
    }));
  }
}
