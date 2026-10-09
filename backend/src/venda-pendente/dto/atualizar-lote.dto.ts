import { IsArray, IsString } from 'class-validator';

export class AtualizarLoteDto {
  @IsArray()
  ids: number[];

  @IsString()
  novoStatus: string;
}
