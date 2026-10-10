import { IsEnum } from 'class-validator';
import { statusVenda } from '../enums/status-venda.enum';

export class AtualizarStatusDto {
  @IsEnum(statusVenda)
  status: statusVenda
}
