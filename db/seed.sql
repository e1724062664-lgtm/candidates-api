-- Datos de ejemplo para desarrollo. Ejecutar UNA sola vez: si se repite, duplica los candidatos.
INSERT INTO candidates (name, email, city, experience_years, skills) VALUES
  ('María Fernández', 'maria.fernandez@example.com', 'Quito', 3, ARRAY['Node.js', 'SQL']),
  ('Carlos Andrade', 'carlos.andrade@example.com', 'Guayaquil', 5, ARRAY['Java', 'Trabajo en equipo']);
