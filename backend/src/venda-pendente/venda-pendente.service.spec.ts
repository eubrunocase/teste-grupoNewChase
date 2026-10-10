import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VendaPendenteService } from './venda-pendente.service';
import { VendaPendente } from './venda-pendente.entity';
import { statusVenda } from './enums/status-venda.enum';
import { FiltroVendasDto } from './dto/filtro-vendas.dto';
import { MAX_IDS_POR_LOTE } from './dto/atualizar-lote.dto';

function criarQbMock() {
  return {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getRawMany: jest.fn(),
  };
}

describe('VendaPendenteService', () => {
  let service: VendaPendenteService;

  const managerMock = {
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
  };

  const repositoryMock = {
    createQueryBuilder: jest.fn(),
    manager: { transaction: jest.fn() },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repositoryMock.createQueryBuilder.mockReturnValue(criarQbMock());
    (repositoryMock.manager.transaction as jest.Mock).mockImplementation(
      async (cb: (m: typeof managerMock) => Promise<unknown>) => cb(managerMock),
    );
    service = new VendaPendenteService(repositoryMock as any);
  });

  describe('findAll', () => {
    it('retorna as vendas ordenadas por dataVenda desc', async () => {
      const qb = criarQbMock() as any;
      const vendas = [{ id: 1 }, { id: 2 }];
      qb.getMany.mockResolvedValue(vendas);
      repositoryMock.createQueryBuilder.mockReturnValue(qb);

      const resultado = await service.findAll(new FiltroVendasDto());

      expect(resultado).toEqual(vendas);
      expect(qb.orderBy).toHaveBeenCalledWith('v.dataVenda', 'DESC');
    });

    it('aplica filtros de loja, status e período', async () => {
      const qb = criarQbMock() as any;
      qb.getMany.mockResolvedValue([]);
      repositoryMock.createQueryBuilder.mockReturnValue(qb);

      const filtro = new FiltroVendasDto();
      filtro.loja = 'Loja Centro';
      filtro.status = statusVenda.PENDENTE;
      filtro.dataDe = '2026-05-01';
      filtro.dataAte = '2026-06-30';

      await service.findAll(filtro);

      expect(qb.andWhere).toHaveBeenCalledTimes(4);
      expect(qb.andWhere).toHaveBeenCalledWith('v.loja = :loja', { loja: 'Loja Centro' });
      expect(qb.andWhere).toHaveBeenCalledWith('v.status = :status', { status: statusVenda.PENDENTE });
      expect(qb.andWhere).toHaveBeenCalledWith('v.dataVenda >= :dataDe', { dataDe: '2026-05-01' });
      expect(qb.andWhere).toHaveBeenCalledWith('v.dataVenda <= :dataAte', { dataAte: '2026-06-30' });
    });

    it('rejeita período invertido', async () => {
      const filtro = new FiltroVendasDto();
      filtro.dataDe = '2026-06-30';
      filtro.dataAte = '2026-05-01';

      await expect(service.findAll(filtro)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('atualizarStatus', () => {
    it('atualiza o status de uma venda encontrada', async () => {
      const venda = { id: 1, status: statusVenda.PENDENTE, loja: 'X' };
      managerMock.findOne.mockResolvedValue(venda);

      const resultado = await service.atualizarStatus(1, statusVenda.FATURADO);

      expect(resultado).toEqual({ ...venda, status: statusVenda.FATURADO });
      expect(managerMock.update).toHaveBeenCalledWith(
        VendaPendente,
        { id: 1 },
        { status: statusVenda.FATURADO },
      );
    });

    it('lança NotFoundException quando a venda não existe', async () => {
      managerMock.findOne.mockResolvedValue(null);

      await expect(service.atualizarStatus(999, statusVenda.FATURADO)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lança BadRequestException em transição inválida (CANCELADO -> FATURADO)', async () => {
      managerMock.findOne.mockResolvedValue({ id: 3, status: statusVenda.CANCELADO });

      const promessa = service.atualizarStatus(3, statusVenda.FATURADO);

      await expect(promessa).rejects.toBeInstanceOf(BadRequestException);
      expect(managerMock.update).not.toHaveBeenCalled();
    });

    it('aceita transição para o mesmo status (idempotente)', async () => {
      managerMock.findOne.mockResolvedValue({ id: 1, status: statusVenda.PENDENTE });

      const resultado = await service.atualizarStatus(1, statusVenda.PENDENTE);

      expect(resultado.status).toBe(statusVenda.PENDENTE);
      expect(managerMock.update).toHaveBeenCalled();
    });
  });

  describe('atualizarStatusEmLote', () => {
    it('atualiza todos os ids válidos e retorna o contrato de sucesso', async () => {
      managerMock.find.mockResolvedValue([
        { id: 1, status: statusVenda.PENDENTE },
        { id: 2, status: statusVenda.PENDENTE },
      ]);

      const resultado = await service.atualizarStatusEmLote([1, 2], statusVenda.FATURADO);

      expect(resultado).toEqual({
        total: 2,
        sucesso: 2,
        falhas: 0,
        atualizados: [1, 2],
        detalhesFalhas: [],
      });
      expect(managerMock.update).toHaveBeenCalledTimes(1);
      const [, criterio] = managerMock.update.mock.calls[0];
      expect(criterio.id.value).toEqual([1, 2]);
    });

    it('reporta ids inexistentes como falha', async () => {
      managerMock.find.mockResolvedValue([{ id: 1, status: statusVenda.PENDENTE }]);

      const resultado = await service.atualizarStatusEmLote([1, 999], statusVenda.FATURADO);

      expect(resultado.sucesso).toBe(1);
      expect(resultado.falhas).toBe(1);
      expect(resultado.detalhesFalhas).toEqual([{ id: 999, motivo: 'Venda não encontrada' }]);
    });

    it('NÃO atualiza ids com transição inválida (regressão: push fora do if)', async () => {
      managerMock.find.mockResolvedValue([
        { id: 1, status: statusVenda.PENDENTE },
        { id: 3, status: statusVenda.CANCELADO },
      ]);

      const resultado = await service.atualizarStatusEmLote([1, 3], statusVenda.FATURADO);

      expect(resultado.sucesso).toBe(1);
      expect(resultado.atualizados).toEqual([1]);
      expect(resultado.detalhesFalhas).toEqual([
        { id: 3, motivo: expect.stringContaining('Transição inválida') },
      ]);
      expect(managerMock.update).toHaveBeenCalledTimes(1);
      const [, criterio] = managerMock.update.mock.calls[0];
      expect(criterio.id.value).toEqual([1]);
    });

    it('deduplica ids repetidos', async () => {
      managerMock.find.mockResolvedValue([{ id: 1, status: statusVenda.PENDENTE }]);

      const resultado = await service.atualizarStatusEmLote([1, 1], statusVenda.FATURADO);

      expect(resultado.total).toBe(1);
      expect(managerMock.find).toHaveBeenCalledWith(
        VendaPendente,
        expect.objectContaining({ where: expect.anything(), select: ['id', 'status'] }),
      );
    });

    it('rejeita lote acima do limite', async () => {
      const muitosIds = Array.from({ length: MAX_IDS_POR_LOTE + 1 }, (_, i) => i + 1);

      await expect(service.atualizarStatusEmLote(muitosIds, statusVenda.FATURADO)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('propaga falha do update (transação rejeita)', async () => {
      managerMock.find.mockResolvedValue([{ id: 1, status: statusVenda.PENDENTE }]);
      managerMock.update.mockRejectedValue(new Error('deadlock'));

      await expect(service.atualizarStatusEmLote([1], statusVenda.FATURADO)).rejects.toThrow(
        'deadlock',
      );
    });
  });

  describe('getResumoPorLoja', () => {
    it('agrega no formato ResumoLoja com números convertidos', async () => {
      const qb = criarQbMock() as any;
      qb.getRawMany.mockResolvedValue([
        { loja: 'Loja Centro', pendente: '1', valorTotal: '145000.00' },
        { loja: 'Loja Norte', pendente: '2', valorTotal: '240000.00' },
      ]);
      repositoryMock.createQueryBuilder.mockReturnValue(qb);

      const resultado = await service.getResumoPorLoja(new FiltroVendasDto());

      expect(resultado).toEqual([
        { loja: 'Loja Centro', pendente: 1, valorTotal: 145000 },
        { loja: 'Loja Norte', pendente: 2, valorTotal: 240000 },
      ]);
      expect(qb.where).toHaveBeenCalledWith('v.status = :status', { status: statusVenda.PENDENTE });
      expect(qb.groupBy).toHaveBeenCalledWith('v.loja');
      expect(qb.orderBy).toHaveBeenCalledWith('v.loja', 'ASC');
    });

    it('aplica filtros de loja e período', async () => {
      const qb = criarQbMock() as any;
      qb.getRawMany.mockResolvedValue([]);
      repositoryMock.createQueryBuilder.mockReturnValue(qb);

      const filtro = new FiltroVendasDto();
      filtro.loja = 'Loja Centro';
      filtro.dataDe = '2026-05-01';
      filtro.dataAte = '2026-06-30';

      await service.getResumoPorLoja(filtro);

      expect(qb.andWhere).toHaveBeenCalledWith('v.loja = :loja', { loja: 'Loja Centro' });
      expect(qb.andWhere).toHaveBeenCalledWith('v.dataVenda >= :dataDe', { dataDe: '2026-05-01' });
      expect(qb.andWhere).toHaveBeenCalledWith('v.dataVenda <= :dataAte', { dataAte: '2026-06-30' });
    });

    it('rejeita período invertido', async () => {
      const filtro = new FiltroVendasDto();
      filtro.dataDe = '2026-06-30';
      filtro.dataAte = '2026-05-01';

      await expect(service.getResumoPorLoja(filtro)).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});