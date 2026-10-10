# Demanda 1: Saber quais vendas tiveram sucesso ou falha, e por quê

**Arquivo:** `venda-pendente.service.ts`

## Ponderações

- A função `atualizarStatusEmLote` engole todas as exceções e sempre retorna a mensagem `'Lote processado'`.
- Sem verificação, se o ID não existir, o `findOne` devolve `null`. Isso estoura um `TypeError`, que gera uma exceção, mas ela é engolida pelo `catch` de forma inadequada.
- Não há transação: em caso de falha, o lote fica parcialmente completo.
- Problema de N+1 queries: `findOne` + `save` por ID.
- O parâmetro `novoStatus` não é validado.

## Solução

- Definir um Enum de status e validar o payload.
- Classificar os IDs antes de atualizar, dentro de uma transaction.
- Retornar um contrato explícito das operações realizadas.
- Restringir a mudança de estado de `CANCELADO` para `FATURADO`.
- Deduplicar os IDs e impor um limite máximo por lote.

---

# Demanda 2: Resumo por lojas está lento

**Ponto focal:** `getResumoPorLoja()`

## Problema

- A função traz todos os registros do banco de dados e os agrega em memória. Dessa forma, o custo cresce linearmente com o volume de dados e o tráfego de rede.
- Não existem índices em `status` e `loja`.

## Solução

- Fazer a agregação no banco de dados.
- Criar índices.
- Retornar um array tipado no lugar do `Record`.

---

# Demanda 3: Filtro por período

## Problema

- Não existem filtros específicos, apenas o `findAll`, que monta o `where` com loja/status.

## Solução

- Criar um DTO de query para aplicar os filtros.
- Usar `QueryBuilder` com intervalo aberto.
- Validar a ordem dos parâmetros, retornando 400 se estiverem invertidos.
- Aplicar os mesmos filtros em `getResumo`.


 # Observação

  - Devido ao prazo apertado da entrega, pois eu só pude trabalhar na sexta(09/10/26) a noite. Não caprichei muito no frontend, apenas o tornei básico e funcional.
  - Utilizei IA CLI para escritas de testes unitários e auxilio em determinadas funções