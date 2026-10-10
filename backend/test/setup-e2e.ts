// Configura um banco MySQL dedicado para os testes e2e,
// isolado do banco de desenvolvimento (teste_pratico).
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_USER = process.env.DB_USER || 'root';
process.env.DB_PASS = process.env.DB_PASS || 'root';
process.env.DB_NAME = 'teste_pratico_test';