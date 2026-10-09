import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendaPendente } from './venda-pendente.entity';
import { VendaPendenteService } from './venda-pendente.service';
import { VendaPendenteController } from './venda-pendente.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VendaPendente])],
  controllers: [VendaPendenteController],
  providers: [VendaPendenteService],
})
export class VendaPendenteModule {}
