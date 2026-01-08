-- Migration: add orders/notifications table
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  gaveta_id INT NOT NULL,
  ordered TINYINT(1) NOT NULL DEFAULT 0,
  ordered_by VARCHAR(100) DEFAULT NULL,
  ordered_at DATETIME DEFAULT NULL,
  note TEXT DEFAULT NULL,
  UNIQUE KEY uq_gaveta (gaveta_id),
  CONSTRAINT fk_orders_gavetas FOREIGN KEY (gaveta_id) REFERENCES gavetas(id) ON DELETE CASCADE
);
