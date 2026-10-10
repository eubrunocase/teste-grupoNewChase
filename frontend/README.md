# Frontend — Controle de Vendas Pendentes de Faturamento

Aplicação Angular standalone (Angular 21) que consome a API do backend (NestJS)
em `http://localhost:3000/api`.

## Funcionalidades

- **Listagem com filtros**: loja, status e período da venda (`dataDe` / `dataAte`) —
  os mesmos filtros são aplicados à listagem e ao resumo.
- **Resumo por loja**: quantidade e valor total pendentes, agregados no banco.
- **Faturamento em lote**: selecione várias vendas e marque como `FATURADO` (ou
  `CANCELADO`). A tela mostra, por item, `sucesso`/`falha` com o motivo
  (ex.: "Venda não encontrada", "Transição inválida de X para Y").
- **Ação individual**: botão "Faturar" por linha para vendas `PENDENTE`.

## Como rodar

Pré-requisitos: backend rodando em `http://localhost:3000/api` (CORS já habilitado).

```bash
cd frontend
npm install
npm start          # http://localhost:4200
```

## Estrutura

```
src/
  main.ts                       bootstrap + registro do locale pt-BR
  app/
    app.component.*             raiz do app (apenas hospeda o componente)
    app.config.ts               providers (HttpClient)
    vendas-pendentes/
      vendas-pendentes.component.{ts,html,css}   tela principal
      vendas-pendentes.service.ts                chamadas HTTP
      vendas-pendentes.model.ts                  contratos/entidades
```

## Contrato de API consumido

| Endpoint | Método | Uso |
| --- | --- | --- |
| `/api/vendas-pendentes?loja=&status=&dataDe=&dataAte=` | GET | listagem filtrada |
| `/api/vendas-pendentes/resumo?dataDe=&dataAte=` | GET | resumo por loja |
| `/api/vendas-pendentes/lote/atualizar-status` | POST | lote `{ids, novoStatus}` → `{total, sucesso, falhas, atualizados, detalhesFalhas}` |
| `/api/vendas-pendentes/:id/status` | PATCH | status individual `{status}` |

## Build de produção

```bash
npm run build       # saída em dist/
```