CREATE TABLE IF NOT EXISTS venda_pendente (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loja VARCHAR(100) NOT NULL,
  veiculo VARCHAR(100) NOT NULL,
  cliente VARCHAR(100) NOT NULL,
  valorVenda DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
  dataVenda DATE NOT NULL,
  dataAtualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO venda_pendente (loja, veiculo, cliente, valorVenda, status, dataVenda) VALUES
('Loja Centro', 'Corolla 2023', 'Joao Silva', 145000.00, 'PENDENTE', '2026-05-02'),
('Loja Centro', 'HB20 2022', 'Maria Souza', 78000.00, 'PENDENTE', '2026-05-10'),
('Loja Norte', 'Onix 2023', 'Carlos Lima', 82000.00, 'PENDENTE', '2026-06-01'),
('Loja Norte', 'Civic 2021', 'Ana Paula', 130000.00, 'FATURADO', '2026-04-15'),
('Loja Sul', 'Tracker 2023', 'Pedro Alves', 110000.00, 'PENDENTE', '2026-06-20'),
('Loja Sul', 'Kicks 2022', 'Julia Costa', 95000.00, 'CANCELADO', '2026-03-30'),
('Loja Centro', 'Compass 2023', 'Fernando Dias', 175000.00, 'PENDENTE', '2026-07-01'),
('Loja Norte', 'Creta 2023', 'Beatriz Nunes', 118000.00, 'PENDENTE', '2026-07-05');


CREATE INDEX idx_vp_status_data_loja ON venda_pendente (status, dataVenda, loja);
CREATE INDEX idx_vp_loja_status ON venda_pendente (loja, status);