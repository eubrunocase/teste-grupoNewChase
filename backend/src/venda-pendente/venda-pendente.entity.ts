import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { statusVenda } from './enums/status-venda.enum';

@Entity('venda_pendente')
export class VendaPendente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  loja: string;

  @Column()
  veiculo: string;

  @Column()
  cliente: string;

  @Column('decimal', { precision: 10, scale: 2 })
  valorVenda: number;

  @Column({ default: 'PENDENTE' })
  status: statusVenda;

  @Column({ type: 'date' })
  dataVenda: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  dataAtualizacao: Date;
}
