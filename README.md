# Teste Prático — Controle de Vendas Pendentes de Faturamento

## Contexto

Você está entrando no time de manutenção de um módulo já em produção: controle de vendas pendentes de faturamento. O módulo funciona, mas foi construído com pressa e tem alguns problemas que você pode encontrar pelo caminho — parte do trabalho aqui é notar isso e decidir o que fazer.

## O que o time de operações pediu

1. Hoje, quando alguém seleciona várias vendas e marca como "faturado" em lote, às vezes algumas não são atualizadas e ninguém sabe quais. Querem saber exatamente **quais tiveram sucesso e quais falharam**, e por quê.
2. A tela de resumo por loja (quantidade pendente e valor total pendente) **está cada vez mais lenta** conforme a base cresce. Precisa melhorar.
3. Nova necessidade: filtrar a listagem e o resumo por **período de data da venda** (data de/até).

## O que entregar

- Código funcionando (backend obrigatório; o front é um esqueleto simples em Angular — capriche mais no back/banco do que em CSS).
- Um `DECISOES.md` (ou seção neste README) explicando:
  - O que você notou de errado no código existente.
  - O que decidiu corrigir agora vs. o que deixaria para depois, e por quê.
  - Quais suposições você assumiu.
  - O que faria com mais tempo.
- Testes automatizados são bem-vindos, mas não obrigatórios.

## Regras

- Uso de IA (Copilot, ChatGPT, Claude etc.) é permitido e não precisa ser escondido — mas você vai precisar explicar e defender qualquer decisão do código numa conversa depois.
- Prazo: 48h corridas a partir do recebimento. Não esperamos 48h de trabalho contínuo — organize seu tempo.
- Entrega: repositório git (zip com histórico de commits, ou link de repositório privado).

## Como rodar o projeto

```bash
# 1. Subir o banco MySQL
docker-compose up -d

# 2. Instalar dependências do backend
cd backend
npm install
npm run start

# API disponível em http://localhost:3000/api
```

O frontend em `frontend/` é apenas um esqueleto de referência (não é um projeto Angular completo) — sinta-se livre para integrá-lo a um projeto Angular novo ou ignorá-lo e focar no backend, conforme orientação recebida.
