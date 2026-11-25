import cors from 'cors';
import express from 'express';

import { InMemoryVacancyRepository } from './modules/vacancies/adapters/persistence/InMemoryVacancyRepository';
import { VancacyService } from './modules/vacancies/application/VacancyService';
import { createVacancyRouter } from './modules/vacancies/adapters/http/vacancyRoutes';
import { InMemoryCandidateRepository } from './modules/candidates/adapters/persistence/InMemoryCandidateRepository';
import { CandidateService } from './modules/candidates/application/CandidateService';
import { createCandidateRouter } from './modules/candidates/adapters/http/candidateRoutes';
import { PostgresCandidateRepository } from './modules/candidates/adapters/persistence/PostgresCandidateRepository';
import { CandidateRepository } from './modules/candidates/ports/CandidateRepository';
import { createPostgresPool } from './shared/database/postgresPool';
import { errorHandler, notFoundHandler } from './shared/httpErrorHandlers';

const app = express();

// CORS: permite que el navegador deje al frontend (otro origen) llamar a esta API.
// Solo se autoriza un origen concreto, nunca "*". Se registra antes de las rutas.
app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }));

app.use(express.json());

//1) Respositorio donde se guardan las vacantes
const vacancyRepository = new InMemoryVacancyRepository([
    {id: 1, title: 'Desarrollador Backend', company:'Tech Ander', modality: 'remoto', salary: 800},
    {id: 2, title: 'Analista de Datos', company:'DataSur', modality: 'híbrido', salary: 1200},
]);

//2) Servicio (casos de uso)
const vancacyService = new VancacyService(vacancyRepository);

//3) Rutas: se le entrega el servicio y se monta bajo el prefijo /vacancies
app.use('/vacancies', createVacancyRouter(vancacyService));

//4) Datos de ejemplo para el repositorio en memoria
const sampleCandidates = [
    {id: 1, name: 'María Fernández', email: 'maria.fernandez@example.com', city: 'Quito', experienceYears: 3, skills: ['Node.js', 'SQL']},
    {id: 2, name: 'Carlos Andrade', email: 'carlos.andrade@example.com', city: 'Guayaquil', experienceYears: 5, skills: ['Java', 'Trabajo en equipo']},
];

//5) Elige dónde se guardan los candidatos según la variable CANDIDATES_ADAPTER:
//   "sql" → PostgreSQL | cualquier otro valor, o sin variable → memoria (opción por defecto).
const createCandidateRepository = (): CandidateRepository => {
    const adapter = process.env.CANDIDATES_ADAPTER;
    const databaseUrl = process.env.DATABASE_URL;

    if (adapter === 'sql' && databaseUrl) {
        console.log('Candidates persistence: PostgreSQL');
        return new PostgresCandidateRepository(createPostgresPool(databaseUrl));
    }

    // Avisos para que un error de configuración no pase desapercibido.
    if (adapter === 'sql') {
        console.warn('Aviso: CANDIDATES_ADAPTER=sql requiere DATABASE_URL; se usa la memoria.');
    } else if (adapter && adapter !== 'memory') {
        console.warn(`Aviso: CANDIDATES_ADAPTER="${adapter}" no es válido (use "sql" o "memory"); se usa la memoria.`);
    }

    console.log('Candidates persistence: in memory');
    return new InMemoryCandidateRepository(sampleCandidates);
};

//6) Servicio de candidatos (casos de uso)
const candidateService = new CandidateService(createCandidateRepository());

//7) Rutas de candidatos: se monta bajo el prefijo /candidates
app.use('/candidates', createCandidateRouter(candidateService));

app.use(notFoundHandler);

app.use(errorHandler);

export default app;