import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsEnum, IsInt } from 'class-validator';
import { statusVenda } from '../enums/status-venda.enum';

export const MAX_IDS_POR_LOTE: number = 500;

export class AtualizarLoteDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(MAX_IDS_POR_LOTE)
  @Type(() => Number)
  @IsInt({each: true})
  ids: number[];

  @IsEnum(statusVenda)
  novoStatus: statusVenda;
}
