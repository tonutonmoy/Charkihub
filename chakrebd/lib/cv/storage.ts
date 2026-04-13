import type { CVData } from './types';
import { INITIAL_CV_DATA } from './initialData';

const STORAGE_PREFIX = 'chakrebd_cv_v1';

export function storageKeyForTemplate(templateId: string): string {
  return `${STORAGE_PREFIX}_${templateId}`;
}

export function loadCvData(templateId: string): CVData {
  if (typeof window === 'undefined') return INITIAL_CV_DATA;
  try {
    const raw = localStorage.getItem(storageKeyForTemplate(templateId));
    if (!raw) return structuredClone(INITIAL_CV_DATA);
    const parsed = JSON.parse(raw) as CVData;
    return mergeWithDefaults(parsed);
  } catch {
    return structuredClone(INITIAL_CV_DATA);
  }
}

export function parseStoredCvData(raw: unknown): CVData {
  if (!raw || typeof raw !== 'object') return structuredClone(INITIAL_CV_DATA);
  return mergeWithDefaults(raw as Partial<CVData>);
}

function mergeWithDefaults(partial: Partial<CVData>): CVData {
  const base = structuredClone(INITIAL_CV_DATA);
  const pi = partial.personalInfo ?? {};
  const lang = partial.language === 'en' || partial.language === 'bn' ? partial.language : base.language;
  return {
    language: lang,
    photoDataUrl: typeof partial.photoDataUrl === 'string' ? partial.photoDataUrl : base.photoDataUrl,
    personalInfo: { ...base.personalInfo, ...pi },
    education: Array.isArray(partial.education) ? partial.education : base.education,
    experience: Array.isArray(partial.experience) ? partial.experience : base.experience,
    skills: Array.isArray(partial.skills) ? partial.skills : base.skills,
    references: Array.isArray(partial.references) ? partial.references : base.references,
    publications: Array.isArray(partial.publications) ? partial.publications : [],
    training: Array.isArray(partial.training) ? partial.training : [],
  };
}

export function saveCvData(templateId: string, data: CVData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKeyForTemplate(templateId), JSON.stringify(data));
  } catch {
    /* ignore quota */
  }
}
