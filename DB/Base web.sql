Create DataBase WED_COSTUMER
GO

USE WED_COSTUMER
GO


CREATE TABLE Usuario(
    UsuarioId INT PRIMARY KEY,
    Nombre VARCHAR(50) NOT NULL,
    Correo NVARCHAR(50) NOT NULL,
    ClaveHash NVARCHAR(20),
    Rol NVARCHAR (10),
    Activo BIT,
	Fecha_Creacion DATETIME,
);
GO

CREATE TABLE Curso (
    CursoId INT PRIMARY KEY,
	Codigo VARCHAR (20),
    Nombre NVARCHAR(150) NOT NULL,
    Periodo VARCHAR(20) NOT NULL,
    Descripcion NVARCHAR (500),
	DocenteId int 
);
GO

CREATE TABLE Inscripciones (
    CursoId INT PRIMARY KEY,
    UsuarioId INT,
    EstudiantesId INT,
	Fecha_Inscripcion INT,
    Estado VARCHAR(20),
	FOREIGN KEY (CursoId) REFERENCES Curso(CursoId),
    FOREIGN KEY (UsuarioId) REFERENCES Usuario(UsuarioId)
);
GO


CREATE TABLE Evaluacion(
EvaluacionId INT PRIMARY KEY,
CursoId int,
Nombre NVARCHAR(120),
Tipo VARCHAR(10),
Peso DECIMAL(5,2),
Fecha DATETIME,
Instrucciones NVARCHAR (100),
RequiereEntrega BIT,
Extensiones VARCHAR(200),
MaxMb TINYINT,
PermiteTardia BIT
);
GO


CREATE TABLE Calificacion(
EvaluacionId INT PRIMARY KEY,
EstudiantesId INT,
UsuarioId INT,
Notas DECIMAL (5,2),
FechaRegistro DATETIME,
FOREIGN KEY (EvaluacionId) REFERENCES Evaluacion(EvaluacionId),
FOREIGN KEY (UsuarioId) REFERENCES Usuario(UsuarioId)
);



CREATE TABLE Asistencia(
CursoId INT,
EstudianteId INT,
Fecha DATETIME,
Presente BIT,
CONSTRAINT FK_Inscripcion_Curso FOREIGN KEY (CursoId) 
        REFERENCES Curso(CursoId) 
        ON DELETE CASCADE,
        
    -- Llave foránea a Usuario (Estudiante)
    CONSTRAINT FK_Inscripcion_Estudiante FOREIGN KEY (EstudianteId) 
        REFERENCES Usuario(UsuarioId)

);
GO


CREATE TABLE Material(
Material_Id INT IDENTITY,
CursoId INT,
Titulo NVARCHAR(150),
NombreOriginal NVARCHAR(255),
RutaInterna NVARCHAR(300),
Tamano BIGINT,
Fecha DATETIME,
);
GO


CREATE TABLE Entrega(
EntregaId INT IDENTITY,
EvaluacionId INT,
EstudianteId INT,
NombreOriginal NVARCHAR(255),
RutaInterna NVARCHAR(300),
Tamano BIGINT,
Fecha DATETIME,
Comentario NVARCHAR(500)
);
GO

CREATE TABLE Auditoria(
AuditoriaId BIGINT IDENTITY,
UsuarioId INT,
Accion NVARCHAR(40),
Entidad VARCHAR(40), 
EntidadId INT,
Detalle NVARCHAR(500),
FECHA DATETIME
);
GO