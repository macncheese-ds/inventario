-- Create the prestamos (loans) table if it doesn't exist
-- This table tracks items that have been loaned to employees

CREATE TABLE IF NOT EXISTS prestamos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empleado VARCHAR(100) NOT NULL,           -- Employee name
  num_empleado VARCHAR(50) NOT NULL,        -- Employee number
  articulo VARCHAR(100) NOT NULL,           -- Item name
  ndp VARCHAR(100),                         -- Part number (optional)
  gaveta VARCHAR(50),                       -- Drawer location (optional)
  cantidad INT NOT NULL DEFAULT 1,          -- Quantity loaned
  empleado1 VARCHAR(100),                   -- Name of person who made the loan (lending)
  fecha_prestamo DATETIME DEFAULT CURRENT_TIMESTAMP,  -- Loan date
  area VARCHAR(50) DEFAULT NULL,            -- Area filter
  INDEX idx_num_empleado (num_empleado),
  INDEX idx_articulo (articulo)
);

-- Verify the table was created
DESCRIBE prestamos;
