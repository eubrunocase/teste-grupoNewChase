export type StatusVenda = 'PENDENTE' | 'FATURADO' | 'CANCELADO';

export interface VendaPendente {
  id: number;
  loja: string;
  veiculo: string;
  cliente: string;
  valorVenda: number | string;
  status: StatusVenda;
  dataVenda: string;
  dataAtualizacao?: string;
}

export interface ResumoLoja {
  loja: string;
  pendente: number;
  valorTotal: number;
}

export interface FalhaLote {
  id: number;
  motivo: string;
}

export interface ResultadoLote {
  total: number;
  sucesso: number;
  falhas: number;
  atualizados: number[];
  detalhesFalhas: FalhaLote[];
}