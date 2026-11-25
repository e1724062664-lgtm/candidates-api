-- Crea la tabla de candidatos.
-- Los textos usan TEXT (sin límite) para aceptar cualquier valor que el dominio considere válido.
CREATE TABLE IF NOT EXISTS candidates (

  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  name TEXT NOT NULL,

  email TEXT NOT NULL,

  city TEXT NOT NULL,

  -- Acepta decimales (por ejemplo 2.5 años), igual que la regla del dominio.
  experience_years DOUBLE PRECISION NOT NULL CHECK (experience_years >= 0),

  -- Lista de habilidades: un arreglo de PostgreSQL. Por defecto, lista vacía.
  skills TEXT[] NOT NULL DEFAULT '{}'
);
