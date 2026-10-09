import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendaPendenteModule } from './venda-pendente/venda-pendente.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: 3306,
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || 'root',
      database: process.env.DB_NAME || 'teste_pratico',
      charset: 'utf8mb4_general_ci',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
    }),
    VendaPendenteModule,
  ],
})
export class AppModule {}
