export interface Education {
  id: string;
  degree: string;
  institution: string;
  year: string;
  result: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  duration: string;
  description: string;
}

export interface Reference {
  id: string;
  name: string;
  designation: string;
  organization: string;
  contact: string;
}

export interface Publication {
  id: string;
  title: string;
  journal: string;
  year: string;
}

export interface Training {
  id: string;
  name: string;
  institution: string;
  year: string;
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  permanentAddress: string;
  fatherName: string;
  motherName: string;
  dateOfBirth: string;
  nationality: string;
  religion: string;
  gender: string;
  maritalStatus: string;
  objective: string;
  /** Academic / research template */
  researchInterests: string;
}

export type CvLanguage = 'bn' | 'en';

export interface CVData {
  /** CV output language (section headings & labels) */
  language: CvLanguage;
  /** Optional passport-style photo as data URL; empty = hide */
  photoDataUrl: string;
  personalInfo: PersonalInfo;
  education: Education[];
  experience: Experience[];
  skills: string[];
  references: Reference[];
  publications: Publication[];
  training: Training[];
}
