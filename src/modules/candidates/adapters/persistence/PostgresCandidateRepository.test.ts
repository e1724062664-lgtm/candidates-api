// Carga el .env para tener DATABASE_URL y TEST_DATABASE_URL | Jest no lo carga solo
import 'dotenv/config';

import { Pool } from 'pg';

import { createPostgresPool } from '../../../../shared/database/postgresPool';
import { PostgresCandidateRepository } from './PostgresCandidateRepository';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const developmentDatabaseUrl = process.env.DATABASE_URL;

// Datos de ejemplo (datos de prueba en español).
const sampleCandidate = {
  name: 'María Fernández',
  email: 'maria@example.com',
  city: 'Quito',
  experienceYears: 3,
  skills: ['Node.js', 'SQL'],
};

// Convierte una dirección en "servidor:puerto/base" para comparar BASES DE DATOS y no solo textos.
// Así "postgresql://..." y "postgres://..." apuntando a la misma base cuentan como iguales.
const toDatabaseKey = (url: string): string => {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}:${parsed.port || '5432'}${parsed.pathname}`;
  } catch {
    return url;
  }
};

// Si no hay base de pruebas configurada, se omiten estas pruebas (y se avisa) para no tocar otra base.
if (!testDatabaseUrl) {
  console.warn('TEST_DATABASE_URL no está definida: se omiten las pruebas de integración de PostgreSQL.');
}
const describeWithDatabase = testDatabaseUrl ? describe : describe.skip;

describeWithDatabase('PostgresCandidateRepository', () => {
  let pool: Pool;
  let repository: PostgresCandidateRepository;

  // Se ejecuta UNA vez antes de todas las pruebas: comprueba la protección y abre la conexión.
  beforeAll(() => {
    // PROTECCIÓN: estas pruebas vacían la tabla. Si apuntan a la base de desarrollo, se detiene todo.
    // Está aquí (y no en un "it") para que falle ANTES de que beforeEach borre algún dato.
    if (developmentDatabaseUrl && toDatabaseKey(developmentDatabaseUrl) === toDatabaseKey(testDatabaseUrl as string)) {
      throw new Error('TEST_DATABASE_URL debe ser distinta de DATABASE_URL: estas pruebas borran los datos.');
    }

    pool = createPostgresPool(testDatabaseUrl as string);
    repository = new PostgresCandidateRepository(pool);
  });

  // Se ejecuta antes de CADA prueba: vacía la tabla y reinicia el contador de ids en 1.
  beforeEach(async () => {
    await pool.query('TRUNCATE candidates RESTART IDENTITY');
  });

  // Se ejecuta UNA vez al final: cierra las conexiones para que Jest pueda terminar.
  afterAll(async () => {
    await pool?.end();
  });

  it('starts empty', async () => {
    expect(await repository.findAll()).toEqual([]);
  });

  it('saves a candidate and assigns an id', async () => {
    const saved = await repository.save(sampleCandidate);

    expect(saved).toEqual({ id: 1, ...sampleCandidate });
  });

  it('assigns increasing ids and lists what was saved', async () => {
    await repository.save(sampleCandidate);
    const second = await repository.save(sampleCandidate);

    expect(second.id).toBe(2);
    expect(await repository.findAll()).toHaveLength(2);
  });

  it('finds a candidate by id and returns undefined when it does not exist', async () => {
    const saved = await repository.save(sampleCandidate);

    expect(await repository.findById(saved.id)).toEqual(saved);
    expect(await repository.findById(999)).toBeUndefined();
  });

  it('updates an existing candidate, including its skills, and keeps its id', async () => {
    const saved = await repository.save(sampleCandidate);

    const data = { ...sampleCandidate, city: 'Cuenca', skills: ['Java'] };
    const updated = await repository.update(saved.id, data);

    expect(updated).toEqual({ id: saved.id, ...data });
    expect(await repository.findById(saved.id)).toEqual({ id: saved.id, ...data });
    expect(await repository.update(999, sampleCandidate)).toBeUndefined();
  });

  it('removes a candidate and reports whether it existed', async () => {
    const saved = await repository.save(sampleCandidate);

    expect(await repository.remove(saved.id)).toBe(true);
    expect(await repository.findAll()).toEqual([]);
    expect(await repository.remove(saved.id)).toBe(false);
  });

  it('keeps skills unchanged when saving and reading them back', async () => {
    // Habilidades con comas, comillas y tildes: son los casos donde un arreglo se puede dañar.
    const skills = ['C++', 'Node.js, Express', 'Diseño "UX"', "O'Reilly", 'Comunicación efectiva'];

    const saved = await repository.save({ ...sampleCandidate, skills });

    expect(saved.skills).toEqual(skills);
    expect((await repository.findById(saved.id))?.skills).toEqual(skills);
  });

  it('saves an empty list of skills and reads it back as an empty list', async () => {
    const saved = await repository.save({ ...sampleCandidate, skills: [] });

    expect((await repository.findById(saved.id))?.skills).toEqual([]);
  });

  it('returns experienceYears as a number, including decimals', async () => {
    const saved = await repository.save({ ...sampleCandidate, experienceYears: 2.5 });

    expect(saved.experienceYears).toBe(2.5);
    expect((await repository.findById(saved.id))?.experienceYears).toBe(2.5);
  });
});
