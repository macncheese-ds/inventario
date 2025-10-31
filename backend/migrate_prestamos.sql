-- Migration to add prestamos table
-- Run this SQL in your database

CREATE TABLE IF NOT EXISTS prestamos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empleado VARCHAR(200),
  num_empleado VARCHAR(200),
  articulo VARCHAR(200),
  empleado1 VARCHAR(200),
  num_empleado1 VARCHAR(200),
  fecha_prestamo DATETIME DEFAULT CURRENT_TIMESTAMP,
  item_id INT,
  INDEX idx_item_id (item_id),
  INDEX idx_num_empleado (num_empleado),
  INDEX idx_fecha_prestamo (fecha_prestamo)
);
