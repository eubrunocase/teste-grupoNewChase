import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VendasPendentesService } from './vendas-pendentes.service';
import {
  ResumoLoja,
  ResultadoLote,
  StatusVenda,
  VendaPendente,
} from './vendas-pendentes.model';

interface FalhaDetalhada {
  id: number;
  motivo: string;
  descricao?: string;
}

@Component({
  selector: 'app-vendas-pendentes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vendas-pendentes.component.html',
  styleUrl: './vendas-pendentes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendasPendentesComponent implements OnInit {
  statusOpcoes: StatusVenda[] = ['PENDENTE', 'FATURADO', 'CANCELADO'];

  vendas: VendaPendente[] = [];
  resumo: ResumoLoja[] = [];
  lojas: string[] = [];
  selecionadas = new Set<number>();
  carregando = false;
  erro?: string;

  // Filtros
  filtroLoja = '';
  statusSelecionado: StatusVenda | '' = 'PENDENTE';
  dataDe = '';
  dataAte = '';

  // Feedback da operação em lote
  ultimaOperacao?: ResultadoLote;
  falhasDetalhadas: FalhaDetalhada[] = [];

  constructor(private readonly service: VendasPendentesService) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    this.erro = undefined;

    this.service.listar(this.montarFiltros()).subscribe({
      next: (vendas) => {
        this.vendas = vendas;
        this.removerSelecoesInexistentes();
        this.carregarResumo();
      },
      error: () => {
        this.carregando = false;
        this.erro = 'Não foi possível carregar as vendas. Confira se a API está no ar.';
      },
    });
  }

  private carregarResumo(): void {
    this.service.resumo(this.montarFiltros()).subscribe({
      next: (resumo) => {
        this.resumo = resumo;
        this.montarLojas();
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
        this.erro = 'Não foi possível carregar o resumo por loja.';
      },
    });
  }

  private montarLojas(): void {
    const dasVendas = this.vendas.map((v) => v.loja);
    const doResumo = this.resumo.map((r) => r.loja);
    this.lojas = [...new Set([...dasVendas, ...doResumo])].sort();
  }

  private montarFiltros(): Record<string, string> {
    const filtros: Record<string, string> = {};
    if (this.filtroLoja.trim()) filtros['loja'] = this.filtroLoja.trim();
    if (this.statusSelecionado) filtros['status'] = this.statusSelecionado;
    if (this.dataDe) filtros['dataDe'] = this.dataDe;
    if (this.dataAte) filtros['dataAte'] = this.dataAte;
    return filtros;
  }

  private removerSelecoesInexistentes(): void {
    const idsVisiveis = new Set(this.vendas.map((v) => v.id));
    this.selecionadas = new Set(
      [...this.selecionadas].filter((id) => idsVisiveis.has(id)),
    );
  }

  toggle(id: number): void {
    if (this.selecionadas.has(id)) {
      this.selecionadas.delete(id);
    } else {
      this.selecionadas.add(id);
    }
  }

  faturarSelecionadas(): void {
    this.processarLote('FATURADO');
  }

  cancelarSelecionadas(): void {
    this.processarLote('CANCELADO');
  }

  private processarLote(novoStatus: StatusVenda): void {
    const ids = [...this.selecionadas];
    if (ids.length === 0) {
      return;
    }

    this.carregando = true;
    this.erro = undefined;

    this.service.atualizarLote(ids, novoStatus).subscribe({
      next: (resultado) => {
        this.carregando = false;
        this.ultimaOperacao = resultado;
        this.falhasDetalhadas = this.detalharFalhas(resultado);

        // Mantém selecionadas apenas as que falharam (para corrigir e tentar de novo).
        const atualizadas = new Set(resultado.atualizados);
        this.selecionadas = new Set(
          [...this.selecionadas].filter((id) => !atualizadas.has(id)),
        );
        this.carregar();
      },
      error: () => {
        this.carregando = false;
        this.erro = 'Falha ao processar o lote. Tente novamente.';
      },
    });
  }

  faturarIndividual(id: number): void {
    this.carregando = true;
    this.service.atualizarStatus(id, 'FATURADO').subscribe({
      next: () => {
        this.carregando = false;
        this.carregar();
      },
      error: () => {
        this.carregando = false;
        this.erro = `Não foi possível faturar a venda ${id}.`;
      },
    });
  }

  private detalharFalhas(resultado: ResultadoLote): FalhaDetalhada[] {
    const descricaoPorId = new Map(
      this.vendas.map((v) => [v.id, `${v.veiculo} · ${v.cliente}`]),
    );
    return resultado.detalhesFalhas.map((falha) => ({
      ...falha,
      descricao: descricaoPorId.get(falha.id),
    }));
  }

  aplicarFiltros(): void {
    this.carregar();
  }

  limparFiltros(): void {
    this.filtroLoja = '';
    this.statusSelecionado = 'PENDENTE';
    this.dataDe = '';
    this.dataAte = '';
    this.carregar();
  }

  formatarValor(venda: VendaPendente): string {
    const numero =
      typeof venda.valorVenda === 'string'
        ? Number(venda.valorVenda)
        : venda.valorVenda;
    return Number.isFinite(numero)
      ? numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : '—';
  }

  statusClasse(status: StatusVenda): string {
    return `status status-${status.toLowerCase()}`;
  }
}