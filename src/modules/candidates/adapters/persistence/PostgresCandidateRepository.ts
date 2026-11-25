import { Pool } from 'pg';

import { Candidate, NewCandidate } from '../../domain/Candidate';
import { CandidateRepository } from '../../ports/CandidateRepository';

// Cómo llega una fila desde la base de datos (las columnas usan guion bajo).
type CandidateRow = {
  id: number;
  name: string;
  email: string;
  city: string;
  experience_years: number;
  skills: string[];
};

// Columnas solicitadas en cada consulta.
const COLUMNS = 'id, name, email, city, experience_years, skills';

// Convierte una fila de la base de datos en un objeto Candidate (dominio).
// Aquí se traduce experience_years (base de datos) a experienceYears (dominio).
const toCandidate = (row: CandidateRow): Candidate => ({
  id: row.id,
  name: row.name,
  email: row.email,
  city: row.city,
  experienceYears: row.experience_years,
  skills: row.skills,
});

// Adaptador de salida: cumple el contrato CandidateRepository guardando los candidatos en PostgreSQL.
export class PostgresCandidateRepository implements CandidateRepository {
  // Recibe el pool de conexiones desde afuera (inyección de dependencias).
  constructor(private readonly pool: Pool) {}

  // Devuelve todos los candidatos, ordenados por id.
  findAll = async (): Promise<Candidate[]> => {
    const result = await this.pool.query<CandidateRow>(`SELECT ${COLUMNS} FROM candidates ORDER BY id`);

    return result.rows.map(toCandidate);
  };

  // Busca un candidato por id. $1 es un parámetro: el valor viaja aparte, nunca dentro del texto SQL.
  findById = async (id: number): Promise<Candidate | undefined> => {
    const result = await this.pool.query<CandidateRow>(`SELECT ${COLUMNS} FROM candidates WHERE id = $1`, [id]);

    return result.rows[0] ? toCandidate(result.rows[0]) : undefined;
  };

  // Guarda un candidato nuevo. La base asigna el id y RETURNING lo devuelve junto con el resto.
  save = async (newCandidate: NewCandidate): Promise<Candidate> => {
    const result = await this.pool.query<CandidateRow>(
      `INSERT INTO candidates (name, email, city, experience_years, skills)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${COLUMNS}`,
      [newCandidate.name, newCandidate.email, newCandidate.city, newCandidate.experienceYears, newCandidate.skills],
    );

    return toCandidate(result.rows[0]);
  };

  // Reemplaza los datos de un candidato existente. Si el id no existe, no devuelve filas → undefined.
  update = async (id: number, data: NewCandidate): Promise<Candidate | undefined> => {
    const result = await this.pool.query<CandidateRow>(
      `UPDATE candidates
       SET name = $1, email = $2, city = $3, experience_years = $4, skills = $5
       WHERE id = $6
       RETURNING ${COLUMNS}`,
      [data.name, data.email, data.city, data.experienceYears, data.skills, id],
    );

    return result.rows[0] ? toCandidate(result.rows[0]) : undefined;
  };

  // Elimina un candidato. Devuelve true si borró alguna fila, false si no existía.
  remove = async (id: number): Promise<boolean> => {
    const result = await this.pool.query('DELETE FROM candidates WHERE id = $1', [id]);

    return (result.rowCount ?? 0) > 0;
  };
}