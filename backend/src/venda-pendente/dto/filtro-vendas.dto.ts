import { IsEnum, IsOptional, IsString, Matches } from "class-validator";
import { statusVenda } from "../enums/status-venda.enum";


const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class FiltroVendasDto {
    @IsOptional()
    @IsString()
    loja?: string;

    @IsOptional()
    @IsEnum(statusVenda)
    status?: statusVenda;

    @IsOptional()
    @Matches(DATA_REGEX, {message: 'dataDe deve estar no formato YYYY-MM-DD'})
    dataDe?: string;

    @IsOptional()
    @Matches(DATA_REGEX, {message: 'dataAte deve estar no formato YYYY-MM-DD'})
    dataAte?: string;

}