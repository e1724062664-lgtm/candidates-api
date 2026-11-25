import { DomainError } from '../../../shared/DomainError';

// Interface: define la estructura de los objetos candidato.
export interface Candidate {
  id: number;
  name: string;
  email: string;
  city: string;
  experienceYears: number;
  skills: string[];
}

// Un candidato nuevo: los datos que se esperan recibir desde el cliente (todavía sin id).
export type NewCandidate = Omit<Candidate, 'id'>;

// Formato básico de correo: texto@dominio.ext, sin espacios.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Valida la lista de habilidades. Es opcional: si no se envía, queda como lista vacía.
const parseSkills = (value: unknown): string[] => {
  if (value === undefined) {
    return [];
  }

  // Si se envía, debe ser una lista y cada elemento un texto no vacío.
  if (!Array.isArray(value) || value.some((skill) => typeof skill !== 'string' || !skill.trim())) {
    throw new DomainError('Las habilidades deben ser una lista de textos');
  }

  // Devuelve las habilidades limpias (sin espacios sobrantes).
  return value.map((skill: string) => skill.trim());
};

// Valida los datos recibidos y devuelve un NewCandidate limpio.
// Se reutiliza para crear y para editar: las reglas son las mismas.
export const parseNewCandidate = (input: unknown): NewCandidate => {
  const { name, email, city, experienceYears, skills } = (input ?? {}) as Record<string, unknown>;

  // Regla 1: el nombre y el correo son obligatorios.
  if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !email.trim()) {
    throw new DomainError('El nombre y el correo son obligatorios');
  }

  // Regla 2: el correo debe tener un formato válido.
  if (!EMAIL_PATTERN.test(email.trim())) {
    throw new DomainError('El correo no tiene un formato válido');
  }

  // Regla 3: la ciudad es obligatoria.
  if (typeof city !== 'string' || !city.trim()) {
    throw new DomainError('La ciudad es obligatoria');
  }

  // Regla 4: los años de experiencia son un número mayor o igual que 0.
  if (typeof experienceYears !== 'number' || !Number.isFinite(experienceYears) || experienceYears < 0) {
    throw new DomainError('Los años de experiencia deben ser un número igual o mayor que 0');
  }

  // Regla 5: las habilidades son opcionales, pero si se envían deben ser una lista de textos.
  const cleanSkills = parseSkills(skills);

  // Devuelve los datos limpios (sin espacios sobrantes).
  return { name: name.trim(), email: email.trim(), city: city.trim(), experienceYears, skills: cleanSkills };
};
