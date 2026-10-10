import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { createConnection } from 'mysql2/promise';
import { AppModule } from './../src/app.module';

const TESTE_DB = process.env.DB_NAME || 'teste_pratico_test';
const MYSQL = { host: 'localhost', port: 3306, user: 'root', password: 'root' };

const DDL = `
  CREATE TABLE IF NOT EXISTS venda_pendente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    loja VARCHAR(100) NOT NULL,
    veiculo VARCHAR(100) NOT NULL,
    cliente VARCHAR(100) NOT NULL,
    valorVenda DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    dataVenda DATE NOT NULL,
    dataAtualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`;

// [id, loja, veiculo, cliente, valorVenda, status, dataVenda]
const FIXTURA = [
  [1, 'Loja Centro', 'Corolla 2023', 'Cliente A', 145000, 'PENDENTE', '2026-05-02'],
  [2, 'Loja Norte', 'Onix 2023', 'Cliente B', 82000, 'PENDENTE', '2026-06-01'],
  [3, 'Loja Sul', 'Kicks 2022', 'Cliente C', 95000, 'CANCELADO', '2026-03-30'],
  [4, 'Loja Norte', 'Civic 2021', 'Cliente D', 130000, 'FATURADO', '2026-04-15'],
];

async function criarBancoDeTeste(): Promise<void> {
  const conn = await createConnection(MYSQL);
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${TESTE_DB}\` CHARACTER SET utf8mb4`);
  await conn.end();
}

async function derrubarBancoDeTeste(): Promise<void> {
  try {
    const conn = await createConnection(MYSQL);
    await conn.query(`DROP DATABASE IF EXISTS \`${TESTE_DB}\``);
    await conn.end();
  } catch {
    // se a suíte falhou na inicialização, não temos o que derrubar
  }
}

describe('Vendas Pendentes (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let server: any;

  beforeAll(async () => {
    await criarBancoDeTeste();

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    server = app.getHttpServer();
    dataSource = app.get(DataSource);
    await dataSource.query(DDL);
  });

  beforeEach(async () => {
    await dataSource.query('TRUNCATE TABLE venda_pendente');
    for (const linha of FIXTURA) {
      await dataSource.query(
        `INSERT INTO venda_pendente (id, loja, veiculo, cliente, valorVenda, status, dataVenda)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        linha,
      );
    }
  });

  afterAll(async () => {
    await app.close();
    await derrubarBancoDeTeste();
  });

  describe('Fluxo 1 — Lote de faturamento', () => {
    it('retorna quais ids tiveram sucesso e quais falharam, com motivo', async () => {
      const resposta = await request(server)
        .post('/api/vendas-pendentes/lote/atualizar-status')
        .send({ ids: [1, 3, 999], novoStatus: 'FATURADO' })
        .expect(201);

      expect(resposta.body).toEqual({
        total: 3,
        sucesso: 1,
        falhas: 2,
        atualizados: [1],
        detalhesFalhas: [
          { id: 3, motivo: expect.stringContaining('Transição inválida') },
          { id: 999, motivo: 'Venda não encontrada' },
        ],
      });

      // Regressão: a transição inválida NÃO pode ser persistida.
      const linhas = await dataSource.query(
        'SELECT id, status FROM venda_pendente WHERE id IN (1, 3) ORDER BY id',
      );
      expect(linhas).toEqual([
        { id: 1, status: 'FATURADO' },
        { id: 3, status: 'CANCELADO' },
      ]);
    });

    it('rejeita payloads inválidos com 400', async () => {
      await request(server)
        .post('/api/vendas-pendentes/lote/atualizar-status')
        .send({ ids: [], novoStatus: 'FATURADO' })
        .expect(400);

      await request(server)
        .post('/api/vendas-pendentes/lote/atualizar-status')
        .send({ ids: [1], novoStatus: 'BANANA' })
        .expect(400);

      await request(server)
        .post('/api/vendas-pendentes/lote/atualizar-status')
        .send({
          ids: Array.from({ length: 501 }, (_, i) => i + 1),
          novoStatus: 'FATURADO',
        })
        .expect(400);
    });

    it('PATCH individual: 200, 404 para id inexistente e 400 para payload inválido', async () => {
      await request(server)
        .patch('/api/vendas-pendentes/1/status')
        .send({ status: 'FATURADO' })
        .expect(200);

      await request(server)
        .patch('/api/vendas-pendentes/999/status')
        .send({ status: 'FATURADO' })
        .expect(404);

      await request(server)
        .patch('/api/vendas-pendentes/1/status')
        .send({ status: 'BANANA' })
        .expect(400);

      await request(server)
        .patch('/api/vendas-pendentes/abc/status')
        .send({ status: 'FATURADO' })
        .expect(400);
    });
  });

  describe('Fluxo 2 — Resumo por loja', () => {
    it('agrega no banco apenas pendentes, em array ordenado e com números', async () => {
      const resposta = await request(server)
        .get('/api/vendas-pendentes/resumo')
        .expect(200);

      expect(Array.isArray(resposta.body)).toBe(true);
      expect(resposta.body).toEqual([
        { loja: 'Loja Centro', pendente: 1, valorTotal: 145000 },
        { loja: 'Loja Norte', pendente: 1, valorTotal: 82000 },
      ]);
    });
  });

  describe('Fluxo 3 — Filtro por período', () => {
    it('filtra a listagem por dataDe/dataAte', async () => {
      const resposta = await request(server)
        .get('/api/vendas-pendentes')
        .query({ dataDe: '2026-05-01', dataAte: '2026-06-30' })
        .expect(200);

      expect(resposta.body).toHaveLength(2);
      expect(resposta.body.map((v: any) => v.id).sort((a: number, b: number) => a - b)).toEqual([1, 2]);
    });

    it('aplica o período também no resumo', async () => {
      const resposta = await request(server)
        .get('/api/vendas-pendentes/resumo')
        .query({ dataDe: '2026-05-01', dataAte: '2026-06-30' })
        .expect(200);

      expect(resposta.body).toEqual([
        { loja: 'Loja Centro', pendente: 1, valorTotal: 145000 },
        { loja: 'Loja Norte', pendente: 1, valorTotal: 82000 },
      ]);
    });

    it('rejeita período invertido com 400', async () => {
      await request(server)
        .get('/api/vendas-pendentes')
        .query({ dataDe: '2026-06-30', dataAte: '2026-05-01' })
        .expect(400);
    });

    it('rejeita data fora do formato YYYY-MM-DD com 400', async () => {
      await request(server)
        .get('/api/vendas-pendentes')
        .query({ dataDe: '01/05/2026' })
        .expect(400);
    });
  });
});