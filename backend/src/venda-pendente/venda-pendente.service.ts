import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VendaPendente } from './venda-pendente.entity';

@Injectable()
export class VendaPendenteService {
  private readonly logger = new Logger(VendaPendenteService.name);

  constructor(
    @InjectRepository(VendaPendente)
    private readonly repository: Repository<VendaPendente>,
  ) {}

  async findAll(loja?: string, status?: string) {
    const where: any = {};
    if (loja) where.loja = loja;
    if (status) where.status = status;
    return this.repository.find({ where });
  }

  async atualizarStatus(id: number, novoStatus: string) {
    const venda = await this.repository.findOne({ where: { id } });
    venda.status = novoStatus;
    return this.repository.save(venda);
  }

  async atualizarStatusEmLote(ids: number[], novoStatus: string) {
    for (const id of ids) {
      try {
        const venda = await this.repository.findOne({ where: { id } });
        venda.status = novoStatus;
        await this.repository.save(venda);
      } catch (error) {
        this.logger.error(error);
      }
    }
    return { message: 'Lote processado' };
  }

  async getResumoPorLoja() {
    const todasVendas = await this.repository.find();
    const resumo: Record<string, { pendente: number; valorTotal: number }> = {};

    for (const venda of todasVendas) {
      if (venda.status !== 'PENDENTE') continue;
      if (!resumo[venda.loja]) resumo[venda.loja] = { pendente: 0, valorTotal: 0 };
      resumo[venda.loja].pendente += 1;
      resumo[venda.loja].valorTotal += Number(venda.valorVenda);
    }

    return resumo;
  }
}
