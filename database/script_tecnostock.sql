-- ============================================================================
-- BASE DE DATOS: TecnoStockDB
-- Motor: Microsoft SQL Server
-- Proyecto: TecnoStock S.A.C.
-- ============================================================================
USE master;
GO

-- 1. Desconecta a todos los usuarios/backends conectados a la fuerza y elimina la BD
IF EXISTS (SELECT name FROM sys.databases WHERE name = N'TecnoStockDB')
BEGIN
    ALTER DATABASE TecnoStockDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE TecnoStockDB;
END
GO

-- 2. Crea la base de datos desde cero
CREATE DATABASE TecnoStockDB;
GO

USE TecnoStockDB;
GO

-- ============================================================================
-- 1. ELIMINACIÓN DE TABLAS EN ORDEN POR DEPENDENCIAS
-- ============================================================================
DROP TABLE IF EXISTS MovimientosInventario;
DROP TABLE IF EXISTS Productos;
DROP TABLE IF EXISTS Categorias;
DROP TABLE IF EXISTS TiposMovimiento;
DROP TABLE IF EXISTS Usuarios;
GO

-- ============================================================================
-- 2. CREACIÓN DE TABLAS Y RESTRICCIONES DE INTEGRIDAD
-- ============================================================================

-- Tabla: Usuarios (Login y Roles)
CREATE TABLE Usuarios (
    id_usuario INT IDENTITY(1,1) NOT NULL,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(100) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'ALMACENERO',
    activo BIT NOT NULL DEFAULT 1,
    fecha_creacion DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_Usuarios PRIMARY KEY (id_usuario),
    CONSTRAINT UQ_Usuarios_Username UNIQUE (username),
    CONSTRAINT CHK_Usuarios_Rol CHECK (rol IN ('ADMIN', 'ALMACENERO'))
);

-- Tabla: Categorías (RF02)
CREATE TABLE Categorias (
    id_categoria INT IDENTITY(1,1) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255) NULL,
    activo BIT NOT NULL DEFAULT 1,
    CONSTRAINT PK_Categorias PRIMARY KEY (id_categoria),
    CONSTRAINT UQ_Categorias_Nombre UNIQUE (nombre)
);

-- Tabla: Productos (RF01, RN1, RN2)
CREATE TABLE Productos (
    id_producto INT IDENTITY(1,1) NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion VARCHAR(500) NULL,
    id_categoria INT NOT NULL,
    precio_compra DECIMAL(12,2) NOT NULL,
    precio_venta DECIMAL(12,2) NOT NULL,
    stock_actual INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 0,
    activo BIT NOT NULL DEFAULT 1,
    fecha_creacion DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_Productos PRIMARY KEY (id_producto),
    CONSTRAINT UQ_Productos_Codigo UNIQUE (codigo),
    CONSTRAINT FK_Productos_Categorias FOREIGN KEY (id_categoria) REFERENCES Categorias(id_categoria),
    CONSTRAINT CHK_Productos_PrecioCompra CHECK (precio_compra > 0),
    CONSTRAINT CHK_Productos_PrecioVenta CHECK (precio_venta > 0),
    CONSTRAINT CHK_Productos_StockActual CHECK (stock_actual >= 0),
    CONSTRAINT CHK_Productos_StockMinimo CHECK (stock_minimo >= 0)
);

-- Tabla: Tipos de Movimiento
CREATE TABLE TiposMovimiento (
    id_tipo_movimiento INT NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    CONSTRAINT PK_TiposMovimiento PRIMARY KEY (id_tipo_movimiento),
    CONSTRAINT UQ_TiposMovimiento_Nombre UNIQUE (nombre)
);

-- Tabla: Historial de Movimientos (RF03, RF04, RF05, RN3, RN5)
CREATE TABLE MovimientosInventario (
    id_movimiento INT IDENTITY(1,1) NOT NULL,
    id_producto INT NOT NULL,
    id_tipo_movimiento INT NOT NULL,
    cantidad INT NOT NULL,
    fecha DATETIME NOT NULL DEFAULT GETDATE(),
    motivo VARCHAR(255) NOT NULL,
    stock_anterior INT NOT NULL,
    stock_posterior INT NOT NULL,
    id_usuario INT NULL,
    CONSTRAINT PK_MovimientosInventario PRIMARY KEY (id_movimiento),
    CONSTRAINT FK_Movimientos_Productos FOREIGN KEY (id_producto) REFERENCES Productos(id_producto),
    CONSTRAINT FK_Movimientos_TiposMovimiento FOREIGN KEY (id_tipo_movimiento) REFERENCES TiposMovimiento(id_tipo_movimiento),
    CONSTRAINT FK_Movimientos_Usuarios FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario),
    CONSTRAINT CHK_Movimientos_Cantidad CHECK (cantidad > 0)
);
GO

-- ============================================================================
-- 3. DATOS SEMILLA (SEED DATA)
-- ============================================================================

INSERT INTO TiposMovimiento (id_tipo_movimiento, nombre) VALUES 
(1, 'ENTRADA'),
(2, 'SALIDA');

INSERT INTO Usuarios (username, password_hash, nombre_completo, rol, activo) VALUES
('admin', '$2b$12$e87.16Z2p60ER.zY/W640.8r6vH/5XQ0L/S7M.LgM5F5XkK.q3eWG', 'Administrador General', 'ADMIN', 1);

-- Categorías iniciales
INSERT INTO Categorias (nombre, descripcion, activo) VALUES
('Laptops y Notebooks', 'Equipos portátiles de alto rendimiento', 1),
('Periféricos y Accesorios', 'Teclados, mouses y accesorios', 1),
('Almacenamiento', 'Discos sólidos SSD, HDD y memorias', 1);
GO

-- ============================================================================
-- 4. PROCEDIMIENTOS ALMACENADOS: AUTENTICACIÓN
-- ============================================================================

CREATE OR ALTER PROCEDURE sp_ObtenerUsuarioPorUsername
    @username VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        id_usuario, username, password_hash, nombre_completo, rol, activo
    FROM Usuarios
    WHERE username = @username AND activo = 1;
END;
GO

-- ============================================================================
-- 5. PROCEDIMIENTOS ALMACENADOS: GESTIÓN DE CATEGORÍAS (RF02)
-- ============================================================================

CREATE OR ALTER PROCEDURE sp_RegistrarCategoria
    @nombre VARCHAR(100),
    @descripcion VARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM Categorias WHERE nombre = @nombre)
            THROW 50001, 'Ya existe una categoría registrada con el mismo nombre.', 1;

        INSERT INTO Categorias (nombre, descripcion, activo)
        VALUES (@nombre, @descripcion, 1);

        SELECT SCOPE_IDENTITY() AS id_categoria;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_ListarCategorias
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_categoria, nombre, descripcion, activo
    FROM Categorias
    ORDER BY id_categoria ASC;
END;
GO

CREATE OR ALTER PROCEDURE sp_ActualizarCategoria
    @id_categoria INT,
    @nombre VARCHAR(100),
    @descripcion VARCHAR(255) = NULL,
    @activo BIT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Categorias WHERE id_categoria = @id_categoria)
            THROW 50002, 'La categoría no existe.', 1;

        IF EXISTS (SELECT 1 FROM Categorias WHERE nombre = @nombre AND id_categoria <> @id_categoria)
            THROW 50001, 'Ya existe otra categoría con este nombre.', 1;

        UPDATE Categorias
        SET nombre = @nombre, descripcion = @descripcion, activo = @activo
        WHERE id_categoria = @id_categoria;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- ============================================================================
-- 6. PROCEDIMIENTOS ALMACENADOS: GESTIÓN DE PRODUCTOS (RF01, RN1, RN2, RN5, RN7)
-- ============================================================================

CREATE OR ALTER PROCEDURE sp_RegistrarProducto
    @codigo VARCHAR(50),
    @nombre VARCHAR(150),
    @descripcion VARCHAR(500) = NULL,
    @id_categoria INT,
    @precio_compra DECIMAL(12,2),
    @precio_venta DECIMAL(12,2),
    @stock_minimo INT,
    @stock_inicial INT = 0,
    @id_usuario INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF EXISTS (SELECT 1 FROM Productos WHERE codigo = @codigo)
            THROW 50003, 'El código del producto ya existe.', 1;

        IF @precio_compra <= 0 OR @precio_venta <= 0
            THROW 50004, 'Los precios deben ser mayores que cero.', 1;

        IF @stock_minimo < 0 OR @stock_inicial < 0
            THROW 50005, 'El stock no puede ser negativo.', 1;

        IF NOT EXISTS (SELECT 1 FROM Categorias WHERE id_categoria = @id_categoria AND activo = 1)
            THROW 50006, 'La categoría seleccionada no es válida.', 1;

        INSERT INTO Productos (
            codigo, nombre, descripcion, id_categoria, 
            precio_compra, precio_venta, stock_actual, stock_minimo, activo
        )
        VALUES (
            @codigo, @nombre, @descripcion, @id_categoria, 
            @precio_compra, @precio_venta, @stock_inicial, @stock_minimo, 1
        );

        DECLARE @new_id_producto INT = SCOPE_IDENTITY();

        IF @stock_inicial > 0
        BEGIN
            INSERT INTO MovimientosInventario (
                id_producto, id_tipo_movimiento, cantidad, motivo, stock_anterior, stock_posterior, id_usuario
            )
            VALUES (
                @new_id_producto, 1, @stock_inicial, 'Stock inicial al registrar producto', 0, @stock_inicial, @id_usuario
            );
        END

        COMMIT TRANSACTION;
        SELECT @new_id_producto AS id_producto;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_ListarProductosPaginado
    @busqueda VARCHAR(100) = NULL,
    @id_categoria INT = NULL,
    @activo BIT = 1,
    @pagina INT = 1,
    @tamanio_pagina INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @offset INT = (@pagina - 1) * @tamanio_pagina;

    SELECT 
        p.id_producto, p.codigo, p.nombre, p.descripcion, p.id_categoria,
        c.nombre AS categoria_nombre, p.precio_compra, p.precio_venta,
        p.stock_actual, p.stock_minimo, p.activo,
        COUNT(*) OVER() AS total_registros
    FROM Productos p
    INNER JOIN Categorias c ON p.id_categoria = c.id_categoria
    WHERE (@busqueda IS NULL OR p.codigo LIKE '%' + @busqueda + '%' OR p.nombre LIKE '%' + @busqueda + '%')
      AND (@id_categoria IS NULL OR @id_categoria = 0 OR p.id_categoria = @id_categoria)
      AND (@activo IS NULL OR p.activo = @activo)
    ORDER BY p.id_producto ASC
    OFFSET @offset ROWS
    FETCH NEXT @tamanio_pagina ROWS ONLY;
END;
GO

CREATE OR ALTER PROCEDURE sp_ObtenerProductoPorId
    @id_producto INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        p.id_producto, p.codigo, p.nombre, p.descripcion, p.id_categoria,
        c.nombre AS categoria_nombre, p.precio_compra, p.precio_venta,
        p.stock_actual, p.stock_minimo, p.activo
    FROM Productos p
    INNER JOIN Categorias c ON p.id_categoria = c.id_categoria
    WHERE p.id_producto = @id_producto;
END;
GO

CREATE OR ALTER PROCEDURE sp_ActualizarProducto
    @id_producto INT,
    @codigo VARCHAR(50),
    @nombre VARCHAR(150),
    @descripcion VARCHAR(500) = NULL,
    @id_categoria INT,
    @precio_compra DECIMAL(12,2),
    @precio_venta DECIMAL(12,2),
    @stock_minimo INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Productos WHERE id_producto = @id_producto)
            THROW 50007, 'El producto a actualizar no existe.', 1;

        IF EXISTS (SELECT 1 FROM Productos WHERE codigo = @codigo AND id_producto <> @id_producto)
            THROW 50003, 'El código ingresado ya pertenece a otro producto.', 1;

        IF @precio_compra <= 0 OR @precio_venta <= 0
            THROW 50004, 'Los precios deben ser mayores que cero.', 1;

        IF @stock_minimo < 0
            THROW 50005, 'El stock mínimo no puede ser negativo.', 1;

        UPDATE Productos
        SET codigo = @codigo,
            nombre = @nombre,
            descripcion = @descripcion,
            id_categoria = @id_categoria,
            precio_compra = @precio_compra,
            precio_venta = @precio_venta,
            stock_minimo = @stock_minimo
        WHERE id_producto = @id_producto;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_DesactivarProducto
    @id_producto INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Productos WHERE id_producto = @id_producto)
            THROW 50007, 'El producto no existe.', 1;

        UPDATE Productos
        SET activo = 0
        WHERE id_producto = @id_producto;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- ============================================================================
-- 7. PROCEDIMIENTOS ALMACENADOS: MOVIMIENTOS (RF03, RF04, RN3, RN4, RN5, RN6)
-- ============================================================================

CREATE OR ALTER PROCEDURE sp_RegistrarEntrada
    @id_producto INT,
    @cantidad INT,
    @motivo VARCHAR(255),
    @id_usuario INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF @cantidad <= 0
            THROW 50008, 'La cantidad de entrada debe ser mayor a cero.', 1;

        DECLARE @stock_ant INT, @activo BIT;
        SELECT @stock_ant = stock_actual, @activo = activo
        FROM Productos WITH (UPDLOCK, ROWLOCK)
        WHERE id_producto = @id_producto;

        IF @stock_ant IS NULL OR @activo = 0
            THROW 50009, 'El producto no existe o está inactivo.', 1;

        DECLARE @stock_post INT = @stock_ant + @cantidad;

        UPDATE Productos
        SET stock_actual = @stock_post
        WHERE id_producto = @id_producto;

        INSERT INTO MovimientosInventario (
            id_producto, id_tipo_movimiento, cantidad, motivo, stock_anterior, stock_posterior, id_usuario
        )
        VALUES (@id_producto, 1, @cantidad, @motivo, @stock_ant, @stock_post, @id_usuario);

        COMMIT TRANSACTION;
        SELECT @stock_post AS nuevo_stock;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_RegistrarSalida
    @id_producto INT,
    @cantidad INT,
    @motivo VARCHAR(255),
    @id_usuario INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF @cantidad <= 0
            THROW 50008, 'La cantidad de salida debe ser mayor a cero.', 1;

        DECLARE @stock_ant INT, @activo BIT;
        SELECT @stock_ant = stock_actual, @activo = activo
        FROM Productos WITH (UPDLOCK, ROWLOCK)
        WHERE id_producto = @id_producto;

        IF @stock_ant IS NULL OR @activo = 0
            THROW 50009, 'El producto no existe o está inactivo.', 1;

        IF @stock_ant < @cantidad
            THROW 50010, 'Stock insuficiente para procesar la salida.', 1;

        DECLARE @stock_post INT = @stock_ant - @cantidad;

        UPDATE Productos
        SET stock_actual = @stock_post
        WHERE id_producto = @id_producto;

        INSERT INTO MovimientosInventario (
            id_producto, id_tipo_movimiento, cantidad, motivo, stock_anterior, stock_posterior, id_usuario
        )
        VALUES (@id_producto, 2, @cantidad, @motivo, @stock_ant, @stock_post, @id_usuario);

        COMMIT TRANSACTION;
        SELECT @stock_post AS nuevo_stock;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- ============================================================================
-- 8. PROCEDIMIENTOS ALMACENADOS: HISTORIAL E INDICADORES (RF05, RF06)
-- ============================================================================

CREATE OR ALTER PROCEDURE sp_ConsultarMovimientosPaginado
    @id_producto INT = NULL,
    @fecha_inicio DATETIME = NULL,
    @fecha_fin DATETIME = NULL,
    @pagina INT = 1,
    @tamanio_pagina INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @offset INT = (@pagina - 1) * @tamanio_pagina;

    IF @fecha_fin IS NOT NULL
        SET @fecha_fin = DATEADD(SECOND, 86399, DATEDIFF(DAY, 0, @fecha_fin));

    SELECT 
        m.id_movimiento, m.id_producto, p.codigo AS producto_codigo,
        p.nombre AS producto_nombre, tm.nombre AS tipo_movimiento,
        m.cantidad, m.fecha, m.motivo, m.stock_anterior, m.stock_posterior,
        u.username AS usuario_registrador,
        COUNT(*) OVER() AS total_registros
    FROM MovimientosInventario m
    INNER JOIN Productos p ON m.id_producto = p.id_producto
    INNER JOIN TiposMovimiento tm ON m.id_tipo_movimiento = tm.id_tipo_movimiento
    LEFT JOIN Usuarios u ON m.id_usuario = u.id_usuario
    WHERE (@id_producto IS NULL OR @id_producto = 0 OR m.id_producto = @id_producto)
      AND (@fecha_inicio IS NULL OR m.fecha >= @fecha_inicio)
      AND (@fecha_fin IS NULL OR m.fecha <= @fecha_fin)
    ORDER BY m.fecha DESC
    OFFSET @offset ROWS
    FETCH NEXT @tamanio_pagina ROWS ONLY;
END;
GO

CREATE OR ALTER PROCEDURE sp_ObtenerIndicadoresDashboard
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        -- 1. Nombre esperado por FastAPI: total_productos
        (SELECT COUNT(*) 
         FROM Productos 
         WHERE activo = 1) AS total_productos,

        -- 2. Nombre esperado por FastAPI: total_entradas_mes
        (SELECT ISNULL(COUNT(*), 0) 
         FROM MovimientosInventario 
         WHERE id_tipo_movimiento = 1 
           AND MONTH(fecha) = MONTH(GETDATE()) 
           AND YEAR(fecha) = YEAR(GETDATE())) AS total_entradas_mes,

        -- 3. Nombre esperado por FastAPI: total_salidas_mes
        (SELECT ISNULL(COUNT(*), 0) 
         FROM MovimientosInventario 
         WHERE id_tipo_movimiento = 2 
           AND MONTH(fecha) = MONTH(GETDATE()) 
           AND YEAR(fecha) = YEAR(GETDATE())) AS total_salidas_mes,

        -- 4. Nombre esperado por FastAPI: valor_inventario
        ISNULL((SELECT SUM(stock_actual * precio_compra) 
                FROM Productos 
                WHERE activo = 1), 0) AS valor_inventario,

        -- 5. Nombre esperado por FastAPI: productos_stock_bajo
        (SELECT COUNT(*) 
         FROM Productos 
         WHERE activo = 1 AND stock_actual <= stock_minimo) AS productos_stock_bajo;
END;
GO

CREATE OR ALTER PROCEDURE sp_ListarProductosStockBajo
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        p.id_producto, p.codigo, p.nombre, c.nombre AS categoria_nombre,
        p.stock_actual, p.stock_minimo, (p.stock_minimo - p.stock_actual) AS faltante
    FROM Productos p
    INNER JOIN Categorias c ON p.id_categoria = c.id_categoria
    WHERE p.activo = 1 AND p.stock_actual <= p.stock_minimo
    ORDER BY p.stock_actual ASC;
END;
GO


-- ============================================================================
-- 9. Insertar Datos
-- ============================================================================


-- 1. Producto en Categoría 'Laptops y Notebooks' (id_categoria = 1)
EXEC sp_RegistrarProducto 
    @codigo = 'PROD-001', 
    @nombre = 'Laptop Lenovo ThinkPad L14', 
    @descripcion = 'Core i7, 16GB RAM, 512GB SSD', 
    @id_categoria = 1, 
    @precio_compra = 2800.00, 
    @precio_venta = 3500.00, 
    @stock_minimo = 3, 
    @stock_inicial = 10,
    @id_usuario = 1;

-- 2. Producto en Categoría 'Periféricos y Accesorios' (id_categoria = 2)
EXEC sp_RegistrarProducto 
    @codigo = 'PROD-002', 
    @nombre = 'Mouse Inalámbrico Logitech MX Master 3S', 
    @descripcion = 'Mouse ergonómico silencioso', 
    @id_categoria = 2, 
    @precio_compra = 320.00, 
    @precio_venta = 450.00, 
    @stock_minimo = 5, 
    @stock_inicial = 15,
    @id_usuario = 1;

-- 3. Producto en Categoría 'Almacenamiento' (id_categoria = 3)
-- (Este producto se crea con stock_inicial = 2 para probar la alerta de stock bajo RF06)
EXEC sp_RegistrarProducto 
    @codigo = 'PROD-003', 
    @nombre = 'Disco Sólido Kingston NV2 1TB NVMe', 
    @descripcion = 'SSD PCIe 4.0 NVMe M.2', 
    @id_categoria = 3, 
    @precio_compra = 210.00, 
    @precio_venta = 290.00, 
    @stock_minimo = 4, 
    @stock_inicial = 2, 
    @id_usuario = 1;
GO



-- ============================================================================
-- PROCEDIMIENTOS ALMACENADOS: GESTIÓN DE USUARIOS
-- ============================================================================

-- 1. Registrar un nuevo usuario (ADMIN o ALMACENERO)
CREATE OR ALTER PROCEDURE sp_RegistrarUsuario
    @username VARCHAR(50),
    @password_hash VARCHAR(255),
    @nombre_completo VARCHAR(100),
    @rol VARCHAR(20) = 'ALMACENERO'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Validar si el username ya existe
        IF EXISTS (SELECT 1 FROM Usuarios WHERE username = @username)
            THROW 50011, 'El nombre de usuario ya existe.', 1;

        -- Validar rol permitido
        IF @rol NOT IN ('ADMIN', 'ALMACENERO')
            THROW 50012, 'El rol especificado no es válido.', 1;

        INSERT INTO Usuarios (username, password_hash, nombre_completo, rol, activo)
        VALUES (@username, @password_hash, @nombre_completo, @rol, 1);

        SELECT SCOPE_IDENTITY() AS id_usuario;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 2. Listar todos los usuarios
CREATE OR ALTER PROCEDURE sp_ListarUsuarios
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        id_usuario, 
        username, 
        nombre_completo, 
        rol, 
        activo, 
        fecha_creacion
    FROM Usuarios
    ORDER BY id_usuario ASC;
END;
GO







-- ============================================================================
-- PROCEDIMIENTO ALMACENADO: CAMBIAR ESTADO DE USUARIO (ACTIVAR / DESACTIVAR)
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_CambiarEstadoUsuario
    @id_usuario INT,
    @activo BIT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE id_usuario = @id_usuario)
            THROW 50013, 'El usuario no existe.', 1;

        UPDATE Usuarios
        SET activo = @activo
        WHERE id_usuario = @id_usuario;

        SELECT @id_usuario AS id_usuario, @activo AS nuevo_estado;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;

GO
-- ============================================================================
-- VERIFICACIÓN DEL AUTENTICADOR (Solo usuarios activos)
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_ObtenerUsuarioPorUsername
    @username VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        id_usuario, username, password_hash, nombre_completo, rol, activo
    FROM Usuarios
    WHERE username = @username; 
END;
GO


-- ============================================================================
-- PROCEDIMIENTO ALMACENADO: CAMBIAR CONTRASEÑA DE USUARIO 
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_CambiarPasswordUsuario
    @id_usuario INT,
    @nuevo_password_hash VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE id_usuario = @id_usuario)
            THROW 50014, 'El usuario no existe.', 1;

        UPDATE Usuarios
        SET password_hash = @nuevo_password_hash
        WHERE id_usuario = @id_usuario;

        SELECT @id_usuario AS id_usuario, 'Contraseña actualizada correctamente' AS mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

UPDATE Usuarios 
SET password_hash = '$2b$12$Fuac7.JdHNLI3eDmNemBbuxpnr4dRdqfV8YSOI/sC6JcAOM0nFdde'
WHERE username = 'admin';
GO






----- Consultar entrada y salida
SELECT 
    m.id_movimiento,
    m.fecha AS fecha_y_hora,
    p.nombre AS producto,
    tm.nombre AS tipo_movimiento,
    m.cantidad,
    m.stock_anterior,
    m.stock_posterior,
    u.id_usuario,
    ISNULL(u.username, 'Sin usuario') AS registrado_por,
    ISNULL(u.nombre_completo, 'Sin asignar') AS nombre_usuario,
    m.motivo
FROM MovimientosInventario m
INNER JOIN Productos p ON m.id_producto = p.id_producto
INNER JOIN TiposMovimiento tm ON m.id_tipo_movimiento = tm.id_tipo_movimiento
LEFT JOIN Usuarios u ON m.id_usuario = u.id_usuario
ORDER BY m.fecha DESC, m.id_movimiento DESC;
GO


---- Consulta de usuarios (estado)
USE TecnoStockDB;
GO

SELECT 
    id_usuario,
    username,
    nombre_completo,
    rol,
    activo,
    CASE 
        WHEN activo = 1 THEN 'Activo'
        ELSE 'Inactivo'
    END AS estado
FROM Usuarios
ORDER BY id_usuario ASC;



-- A. Ejecución directa del Stored Procedure del Dashboard
EXEC sp_ObtenerIndicadoresDashboard;

-- B. Desglose del valor del inventario por producto (Stock Actual * Precio Compra)
SELECT 
    p.codigo,
    p.nombre,
    c.nombre AS categoria,
    p.stock_actual,
    p.precio_compra,
    (p.stock_actual * p.precio_compra) AS valor_referencial_producto
FROM Productos p
INNER JOIN Categorias c ON p.id_categoria = c.id_categoria
WHERE p.activo = 1
ORDER BY valor_referencial_producto DESC;

-- A. Productos con stock igual o inferior al mínimo
SELECT 
    p.codigo,
    p.nombre,
    c.nombre AS categoria,
    p.stock_actual,
    p.stock_minimo,
    (p.stock_minimo - p.stock_actual) AS unidades_deficitarias,
    CASE 
        WHEN p.stock_actual = 0 THEN 'AGOTADO'
        WHEN p.stock_actual <= p.stock_minimo THEN 'STOCK BAJO'
        ELSE 'NORMAL'
    END AS nivel_alerta
FROM Productos p
INNER JOIN Categorias c ON p.id_categoria = c.id_categoria
WHERE p.activo = 1 AND p.stock_actual <= p.stock_minimo
ORDER BY p.stock_actual ASC;