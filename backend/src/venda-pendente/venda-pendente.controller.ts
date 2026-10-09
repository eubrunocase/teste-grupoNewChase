import { Controller, Get, Patch, Post, Param, Body, Query } from '@nestjs/common';
import { VendaPendenteService } from './venda-pendente.service';
import { AtualizarStatusDto } from './dto/atualizar-status.dto';
import { AtualizarLoteDto } from './dto/atualizar-lote.dto';

@Controller('vendas-pendentes')
export class VendaPendenteController {
  constructor(private readonly service: VendaPendenteService) {}

  @Get()
  findAll(@Query('loja') loja?: string, @Query('status') status?: string) {
    return this.service.findAll(loja, status);
  }

  @Get('resumo')
  getResumo() {
    return this.service.getResumoPorLoja();
  }

  @Patch(':id/status')
  atualizarStatus(@Param('id') id: string, @Body() dto: AtualizarStatusDto) {
    return this.service.atualizarStatus(+id, dto.status);
  }

  @Post('lote/atualizar-status')
  atualizarLote(@Body() dto: AtualizarLoteDto) {
    return this.service.atualizarStatusEmLote(dto.ids, dto.novoStatus);
  }
}
