CREATE SCHEMA `inventario`;
Select * from users;
CREATE TABLE gavetas(
id INT AUTO_INCREMENT PRIMARY KEY,
ndp Varchar(100) not null,
articulo varchar(100) not null,
gaveta varchar(100) not null,
nivel int not null,
cantidad int not null,
max int not null,
min int not null,
equipo varchar(100) not null,
tde int not null,
link varchar(200),
-- Precio unitario en pesos mexicanos (MXN). Usar DECIMAL para centavos.
precio DECIMAL(10,2) NOT NULL DEFAULT 0.00
);


CREATE TABLE IF NOT EXISTS users (
  username VARCHAR(50) PRIMARY KEY,
  pass_hash VARBINARY(60) NOT NULL,
  rol ENUM('admin','operador','guest') NOT NULL DEFAULT 'admin',
  nombre VARCHAR(100) NOT NULL
);



drop table cambios;

select * from users;
select * from gavetas;
 
select * from users;
select * from users;



CREATE TABLE IF NOT EXISTS cambios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL, 
  accion VARCHAR(30) NOT NULL,
  adetalle TEXT,
  detalle TEXT,
  fecha_hora DATETIME NOT NULL,
  turno VARCHAR(20) NOT NULL
);



create table solicitudes(
empleado varchar (200),
num_empleado varchar (200),
articulo varchar (200),
cantidad int,
empleado1 varchar (200),
num_empleado1 varchar (200)
);


create table prestamos(
empleado varchar(200),
num_empleado varchar(200),
articulo varchar(200),
empleado1 varchar(200),
num_empleado1 varchar(200)
);