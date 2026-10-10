import { Controller, Get, Patch, Post, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { VendaPendenteService } from './venda-pendente.service';
import { AtualizarStatusDto } from './dto/atualizar-status.dto';
import { AtualizarLoteDto } from './dto/atualizar-lote.dto';
import { FiltroVendasDto } from './dto/filtro-vendas.dto';

@Controller('vendas-pendentes')
export class VendaPendenteController {
  constructor(private readonly service: VendaPendenteService) {}

  @Get()
  findAll(@Query() filtro: FiltroVendasDto) {
    if(filtro === null || filtro === undefined) return;
    return this.service.findAll(filtro);
  }

  @Get('resumo')
  getResumo(@Query() filtro: FiltroVendasDto) {
    if(filtro === null || filtro === undefined) return;    
    return this.service.getResumoPorLoja(filtro);
  }

  @Patch(':id/status')
  atualizarStatus(@Param('id', ParseIntPipe) id: number, 
                  @Body() dto: AtualizarStatusDto) {
    return this.service.atualizarStatus(+id, dto.status);
  }

  @Post('lote/atualizar-status')
  atualizarLote(@Body() dto: AtualizarLoteDto) {
    return this.service.atualizarStatusEmLote(dto.ids, dto.novoStatus);
  }
}
