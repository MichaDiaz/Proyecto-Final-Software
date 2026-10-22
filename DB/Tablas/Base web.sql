CREATE DATABASE DB_HomeClass;
GO

USE DB_HomeClass;
GO


CREATE TABLE [SQM_SECURITY].Usuarios (
    UsuarioID INT IDENTITY(1,1) PRIMARY KEY,
    Correo VARCHAR(150) UNIQUE NOT NULL,
    ContrasenaHash VARCHAR(255) NOT NULL,
    Rol VARCHAR(50) NOT NULL,
    FechaRegistro DATETIME DEFAULT GETDATE()
);
GO

CREATE TABLE [SQM_SECURITY].Estudiantes (
    EstudianteID INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioID INT NOT NULL,
    Carnet VARCHAR(50) UNIQUE NOT NULL,
    Nombres VARCHAR(100) NOT NULL,
    Apellidos VARCHAR(100) NOT NULL,
    FechaNacimiento DATE,
    CONSTRAINT FK_Estudiante_Usuario FOREIGN KEY (UsuarioID) 
    REFERENCES [SQM_SECURITY].Usuarios(UsuarioID)
);
GO

CREATE TABLE [SQM_SECURITY].Docentes (
    DocenteID INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioID INT NOT NULL,
    CodigoDocente VARCHAR(50) UNIQUE NOT NULL,
    Nombres VARCHAR(100) NOT NULL,
    Apellidos VARCHAR(100) NOT NULL,
    Especialidad VARCHAR(150),
    CONSTRAINT FK_Docente_Usuario FOREIGN KEY (UsuarioID) 
    REFERENCES [SQM_SECURITY].Usuarios(UsuarioID)
);
GO

CREATE TABLE [SQM_ACADEMIC].Cursos (
    CursoID INT IDENTITY(1,1) PRIMARY KEY,
    NombreCurso VARCHAR(100) NOT NULL,
    Descripcion TEXT,
    DocenteID INT NOT NULL,
    CONSTRAINT FK_Curso_Docente FOREIGN KEY (DocenteID) 
    REFERENCES [SQM_SECURITY].Docentes(DocenteID)
);
GO

CREATE TABLE [SQM_ACADEMIC].Inscripciones (
    InscripcionID INT IDENTITY(1,1) PRIMARY KEY,
    EstudianteID INT NOT NULL,
    CursoID INT NOT NULL,
    FechaInscripcion DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Inscripcion_Estudiante FOREIGN KEY (EstudianteID) 
    REFERENCES [SQM_SECURITY].Estudiantes(EstudianteID),
    CONSTRAINT FK_Inscripcion_Curso FOREIGN KEY (CursoID) 
    REFERENCES [SQM_ACADEMICO].Cursos(CursoID)
);
GO

CREATE TABLE [SQM_EVALUATIONS].Evaluaciones (
    EvaluacionID INT IDENTITY(1,1) PRIMARY KEY,
    CursoID INT NOT NULL,
    TituloEvaluacion VARCHAR(150) NOT NULL,
    PuntajeMaximo DECIMAL(5,2) NOT NULL,
    CONSTRAINT FK_Evaluacion_Curso FOREIGN KEY (CursoID) 
    REFERENCES [SQM_ACADEMIC].Cursos(CursoID)
);
GO

CREATE TABLE [SQM_EVALUATIONS].Calificaciones (
    CalificacionID INT IDENTITY(1,1) PRIMARY KEY,
    InscripcionID INT NOT NULL,
    EvaluacionID INT NOT NULL,
    NotaObtenida DECIMAL(5,2) NOT NULL,
    FechaCalificacion DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Calificacion_Inscripcion FOREIGN KEY (InscripcionID) 
    REFERENCES [SQM_ACADEMIC].Inscripciones(InscripcionID),
    CONSTRAINT FK_Calificacion_Evaluacion FOREIGN KEY (EvaluacionID) 
    REFERENCES [SQM_EVALUATIONS].Evaluaciones(EvaluacionID)
);
GO

CREATE TABLE [SQM_EVALUATIONS].Asistencia (
    AsistenciaID INT IDENTITY(1,1) PRIMARY KEY,
    InscripcionID INT NOT NULL,
    FechaAsistencia DATE NOT NULL,
    EstadoAsistencia VARCHAR(20) NOT NULL, 
    CONSTRAINT FK_Asistencia_Inscripcion FOREIGN KEY (InscripcionID) 
    REFERENCES [SQM_ACADEMIC].Inscripciones(InscripcionID)
);
GO

CREATE TABLE [SQM_EVALUATIONS].Entregas (
    EntregaID INT IDENTITY(1,1) PRIMARY KEY,
    EvaluacionID INT NOT NULL,
    InscripcionID INT NOT NULL,
    FechaEnvio DATETIME DEFAULT GETDATE(),
    RutaArchivo VARCHAR(255),
    CONSTRAINT FK_Entrega_Evaluacion FOREIGN KEY (EvaluacionID) 
    REFERENCES [SQM_EVALUATIONS].Evaluaciones(EvaluacionID),
    CONSTRAINT FK_Entrega_Inscripcion FOREIGN KEY (InscripcionID) 
    REFERENCES [SQM_ACADEMIC].Inscripciones(InscripcionID)
);
GO
