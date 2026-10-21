IF DB_ID(N'HomeClass') IS NULL
BEGIN
    CREATE DATABASE HomeClass;
END
GO

USE HomeClass;
GO

IF OBJECT_ID(N'dbo.Usuario', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Usuario (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Usuario PRIMARY KEY,
        Nombre NVARCHAR(100) NOT NULL,
        Correo NVARCHAR(254) NOT NULL CONSTRAINT UQ_Usuario_Correo UNIQUE,
        ClaveHash VARCHAR(120) NOT NULL,
        Rol VARCHAR(20) NOT NULL CONSTRAINT CK_Usuario_Rol CHECK (Rol IN ('admin', 'docente', 'estudiante')),
        Activo BIT NOT NULL CONSTRAINT DF_Usuario_Activo DEFAULT (1)
    );
END
GO

IF OBJECT_ID(N'dbo.Curso', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Curso (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Curso PRIMARY KEY,
        Codigo NVARCHAR(20) NOT NULL CONSTRAINT UQ_Curso_Codigo UNIQUE,
        Nombre NVARCHAR(150) NOT NULL,
        Periodo NVARCHAR(20) NOT NULL,
        Descripcion NVARCHAR(500) NULL,
        DocenteId INT NULL CONSTRAINT FK_Curso_Docente REFERENCES dbo.Usuario(Id)
    );
END
GO

IF OBJECT_ID(N'dbo.Inscripcion', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Inscripcion (
        CursoId INT NOT NULL CONSTRAINT FK_Inscripcion_Curso REFERENCES dbo.Curso(Id) ON DELETE CASCADE,
        EstudianteId INT NOT NULL CONSTRAINT FK_Inscripcion_Estudiante REFERENCES dbo.Usuario(Id) ON DELETE CASCADE,
        Fecha DATETIME2 NOT NULL CONSTRAINT DF_Inscripcion_Fecha DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_Inscripcion PRIMARY KEY (CursoId, EstudianteId)
    );
END
GO

IF OBJECT_ID(N'dbo.Evaluacion', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Evaluacion (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Evaluacion PRIMARY KEY,
        CursoId INT NOT NULL CONSTRAINT FK_Evaluacion_Curso REFERENCES dbo.Curso(Id) ON DELETE CASCADE,
        Nombre NVARCHAR(120) NOT NULL,
        Tipo VARCHAR(20) NOT NULL,
        Peso DECIMAL(5,2) NOT NULL CONSTRAINT CK_Evaluacion_Peso CHECK (Peso > 0 AND Peso <= 100),
        Fecha DATE NOT NULL,
        Instrucciones NVARCHAR(2000) NULL,
        RequiereEntrega BIT NOT NULL CONSTRAINT DF_Evaluacion_RequiereEntrega DEFAULT (0),
        Extensiones NVARCHAR(200) NULL,
        MaxMb TINYINT NOT NULL CONSTRAINT DF_Evaluacion_MaxMb DEFAULT (25),
        PermiteTardia BIT NOT NULL CONSTRAINT DF_Evaluacion_PermiteTardia DEFAULT (0)
    );
END
GO

IF OBJECT_ID(N'dbo.Calificacion', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Calificacion (
        EvaluacionId INT NOT NULL CONSTRAINT FK_Calificacion_Evaluacion REFERENCES dbo.Evaluacion(Id) ON DELETE CASCADE,
        EstudianteId INT NOT NULL CONSTRAINT FK_Calificacion_Estudiante REFERENCES dbo.Usuario(Id) ON DELETE CASCADE,
        Nota DECIMAL(5,2) NULL CONSTRAINT CK_Calificacion_Nota CHECK (Nota IS NULL OR (Nota >= 0 AND Nota <= 100)),
        CONSTRAINT PK_Calificacion PRIMARY KEY (EvaluacionId, EstudianteId)
    );
END
GO

IF OBJECT_ID(N'dbo.Asistencia', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Asistencia (
        CursoId INT NOT NULL CONSTRAINT FK_Asistencia_Curso REFERENCES dbo.Curso(Id) ON DELETE CASCADE,
        EstudianteId INT NOT NULL CONSTRAINT FK_Asistencia_Estudiante REFERENCES dbo.Usuario(Id) ON DELETE CASCADE,
        Fecha DATE NOT NULL,
        Presente BIT NOT NULL,
        CONSTRAINT PK_Asistencia PRIMARY KEY (CursoId, EstudianteId, Fecha)
    );
END
GO

IF OBJECT_ID(N'dbo.Material', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Material (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Material PRIMARY KEY,
        CursoId INT NOT NULL CONSTRAINT FK_Material_Curso REFERENCES dbo.Curso(Id) ON DELETE CASCADE,
        Titulo NVARCHAR(150) NOT NULL,
        NombreOriginal NVARCHAR(255) NOT NULL,
        RutaInterna NVARCHAR(1000) NOT NULL,
        Tamano BIGINT NOT NULL,
        Fecha DATETIME2 NOT NULL CONSTRAINT DF_Material_Fecha DEFAULT (SYSUTCDATETIME())
    );
END
GO

IF OBJECT_ID(N'dbo.Entrega', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Entrega (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Entrega PRIMARY KEY,
        EvaluacionId INT NOT NULL CONSTRAINT FK_Entrega_Evaluacion REFERENCES dbo.Evaluacion(Id) ON DELETE CASCADE,
        EstudianteId INT NOT NULL CONSTRAINT FK_Entrega_Estudiante REFERENCES dbo.Usuario(Id) ON DELETE CASCADE,
        NombreOriginal NVARCHAR(255) NOT NULL,
        RutaInterna NVARCHAR(1000) NOT NULL,
        Tamano BIGINT NOT NULL,
        Fecha DATETIME2 NOT NULL CONSTRAINT DF_Entrega_Fecha DEFAULT (SYSUTCDATETIME()),
        Tardia BIT NOT NULL CONSTRAINT DF_Entrega_Tardia DEFAULT (0),
        Comentario NVARCHAR(500) NULL,
        CONSTRAINT UQ_Entrega_Estudiante UNIQUE (EvaluacionId, EstudianteId)
    );
END
GO

IF OBJECT_ID(N'dbo.Usuario', N'U') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.Usuario WHERE Correo=N'admin@homeclass.com')
    INSERT dbo.Usuario (Nombre, Correo, ClaveHash, Rol, Activo)
    VALUES (N'Administrador', N'admin@homeclass.com', CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', CONVERT(VARBINARY(MAX), 'admin123')), 2), 'admin', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.Usuario WHERE Correo=N'docente@homeclass.com')
    INSERT dbo.Usuario (Nombre, Correo, ClaveHash, Rol, Activo)
    VALUES (N'Docente Uno', N'docente@homeclass.com', CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', CONVERT(VARBINARY(MAX), 'docente123')), 2), 'docente', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.Usuario WHERE Correo=N'estudiante@homeclass.com')
    INSERT dbo.Usuario (Nombre, Correo, ClaveHash, Rol, Activo)
    VALUES (N'Estudiante Uno', N'estudiante@homeclass.com', CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', CONVERT(VARBINARY(MAX), 'estudiante123')), 2), 'estudiante', 1);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Curso WHERE Codigo=N'CS101')
    INSERT dbo.Curso (Codigo, Nombre, Periodo, Descripcion, DocenteId)
    SELECT N'CS101', N'Programación I', N'2026-1', N'Fundamentos de programación.', Id FROM dbo.Usuario WHERE Correo=N'docente@homeclass.com';
IF NOT EXISTS (SELECT 1 FROM dbo.Curso WHERE Codigo=N'DB201')
    INSERT dbo.Curso (Codigo, Nombre, Periodo, Descripcion, DocenteId)
    SELECT N'DB201', N'Bases de Datos', N'2026-1', N'Diseño y consulta de BD.', Id FROM dbo.Usuario WHERE Correo=N'docente@homeclass.com';
IF NOT EXISTS (SELECT 1 FROM dbo.Curso WHERE Codigo=N'ENG301')
    INSERT dbo.Curso (Codigo, Nombre, Periodo, Descripcion, DocenteId)
    SELECT N'ENG301', N'Inglés Técnico', N'2026-1', N'Comunicación técnica.', Id FROM dbo.Usuario WHERE Correo=N'docente@homeclass.com';
GO

INSERT dbo.Inscripcion (CursoId, EstudianteId)
SELECT c.Id, u.Id FROM dbo.Curso c CROSS JOIN dbo.Usuario u
WHERE u.Correo=N'estudiante@homeclass.com' AND c.Codigo IN (N'CS101', N'DB201')
AND NOT EXISTS (SELECT 1 FROM dbo.Inscripcion i WHERE i.CursoId=c.Id AND i.EstudianteId=u.Id);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Evaluacion e JOIN dbo.Curso c ON c.Id=e.CursoId WHERE c.Codigo=N'CS101' AND e.Nombre=N'Tarea 1')
    INSERT dbo.Evaluacion (CursoId,Nombre,Tipo,Peso,Fecha,Instrucciones,RequiereEntrega,Extensiones,MaxMb,PermiteTardia)
    SELECT Id,N'Tarea 1','tarea',40,DATEADD(DAY,5,CAST(GETDATE() AS DATE)),N'Entrega el ejercicio de programación.',1,N'pdf,docx,zip',10,0 FROM dbo.Curso WHERE Codigo=N'CS101';
IF NOT EXISTS (SELECT 1 FROM dbo.Evaluacion e JOIN dbo.Curso c ON c.Id=e.CursoId WHERE c.Codigo=N'DB201' AND e.Nombre=N'Control 1')
    INSERT dbo.Evaluacion (CursoId,Nombre,Tipo,Peso,Fecha,Instrucciones,RequiereEntrega,Extensiones,MaxMb,PermiteTardia)
    SELECT Id,N'Control 1','examen',60,DATEADD(DAY,-3,CAST(GETDATE() AS DATE)),N'Control de conceptos básicos.',0,NULL,25,0 FROM dbo.Curso WHERE Codigo=N'DB201';
GO

INSERT dbo.Calificacion (EvaluacionId,EstudianteId,Nota)
SELECT e.Id,u.Id,85 FROM dbo.Evaluacion e JOIN dbo.Curso c ON c.Id=e.CursoId CROSS JOIN dbo.Usuario u
WHERE c.Codigo=N'DB201' AND e.Nombre=N'Control 1' AND u.Correo=N'estudiante@homeclass.com'
AND NOT EXISTS (SELECT 1 FROM dbo.Calificacion g WHERE g.EvaluacionId=e.Id AND g.EstudianteId=u.Id);
GO

INSERT dbo.Asistencia (CursoId,EstudianteId,Fecha,Presente)
SELECT c.Id,u.Id,DATEADD(DAY,-d.Dia,CAST(GETDATE() AS DATE)),CASE WHEN d.Dia=3 THEN 0 ELSE 1 END
FROM dbo.Curso c CROSS JOIN dbo.Usuario u CROSS JOIN (VALUES(1),(2),(3),(4)) d(Dia)
WHERE c.Codigo IN (N'CS101',N'DB201') AND u.Correo=N'estudiante@homeclass.com'
AND NOT EXISTS (SELECT 1 FROM dbo.Asistencia a WHERE a.CursoId=c.Id AND a.EstudianteId=u.Id AND a.Fecha=DATEADD(DAY,-d.Dia,CAST(GETDATE() AS DATE)));
GO