# Demanda 1: Saber quais vendas tiveram sucesso ou falha. E porque. 
* Arquivo: venda-pendente.service.ts

* Ponderações:
- Função atualizarStatusEmLote está engolindo todas as exceções e sempre retornando a mensagem 'Lote processado'.
- Sem a verificação, caso o ID não exista o findOne devolverá null. Estourando um type error, gerando exceção mas sendo engolida pelo catch de forma inadequada.
- Sem transação: em casos de falhas o lote fica parcialmente completo.
- Problema de N+1 queries, findOne + save por Id.
- Parâmetro novoStatus não é validado

## Solução para Demanda 1: 

* Definir um Enum de status e validar o payload
- Classificar os IDs antes de atualizar, dentro de uma transaction
- Retornar um contrato explícito das operações realizadas
- Restringir a mudança de estado de CANCELADO -> FATURADO.
- Deduplicar IDs para impor um limite máximo por lote.

## Demanda 2: Resumo por lojas está lento
* Ponto focal: getResumoPorLoja()

- Problema: a função traz todos os registros do banco de dados e os agrega em memória. Desse jeito o crescimento linear foca no volume de dados e na rede. 
- Não existem índices em status/loja

## Solução para demanda 2:

* Agregação no banco de dados
- Criação de índices
- Retornar um array tipado no lugar do record.

## Demanda 3: Filtro por período:
* Problema: Não existem filtros específicos, apenas findAll que monta o where com loja/status

## Solução para demanda 3:
* DTO de query para aplicar os filtros
- QueryBuilder com intervalo aberto
- Validação da ordem dos parâmetros, com retorno 400 se estiverem invertidos
- Aplicar os mesmos filtros para getResumo