import type { CvLanguage } from './types';

export interface CvLabels {
  careerObjective: string;
  personalInformation: string;
  mailingAddress: string;
  permanentAddress: string;
  fatherName: string;
  motherName: string;
  dateOfBirth: string;
  nationality: string;
  religion: string;
  gender: string;
  maritalStatus: string;
  education: string;
  degreeExam: string;
  institution: string;
  passYear: string;
  resultDivision: string;
  experience: string;
  skills: string;
  references: string;
  contact: string;
  email: string;
  mobile: string;
  phone: string;
  professionalResume: string;
  contactSection: string;
  profile: string;
  researchInterests: string;
  publications: string;
  publicationTitle: string;
  journalMedium: string;
  year: string;
  trainingWorkshops: string;
  workExperience: string;
  objective: string;
  exam: string;
  boardUniversity: string;
  result: string;
  nationalityReligionGender: string;
  father: string;
  mother: string;
}

const BN: CvLabels = {
  careerObjective: 'ক্যারিয়ার উদ্দেশ্য',
  personalInformation: 'ব্যক্তিগত তথ্য',
  mailingAddress: 'বর্তমান ঠিকানা',
  permanentAddress: 'স্থায়ী ঠিকানা',
  fatherName: 'পিতার নাম',
  motherName: 'মাতার নাম',
  dateOfBirth: 'জন্ম তারিখ',
  nationality: 'জাতীয়তা',
  religion: 'ধর্ম',
  gender: 'লিঙ্গ',
  maritalStatus: 'বৈবাহিক অবস্থা',
  education: 'শিক্ষাগত যোগ্যতা',
  degreeExam: 'ডিগ্রি / পরীক্ষা',
  institution: 'প্রতিষ্ঠান',
  passYear: 'পাসের সাল',
  resultDivision: 'ফলাফল / বিভাগ',
  experience: 'অভিজ্ঞতা',
  skills: 'দক্ষতা',
  references: 'রেফারেন্স',
  contact: 'যোগাযোগ',
  email: 'ইমেইল',
  mobile: 'মোবাইল',
  phone: 'ফোন',
  professionalResume: 'পেশাগত রিজিউম',
  contactSection: 'যোগাযোগ',
  profile: 'প্রোফাইল',
  researchInterests: 'গবেষণা আগ্রহ',
  publications: 'প্রকাশনা ও গবেষণা',
  publicationTitle: 'শিরোনাম',
  journalMedium: 'জার্নাল / মাধ্যম',
  year: 'সাল',
  trainingWorkshops: 'প্রশিক্ষণ ও কর্মশালা',
  workExperience: 'কর্ম অভিজ্ঞতা',
  objective: 'উদ্দেশ্য',
  exam: 'পরীক্ষা',
  boardUniversity: 'বোর্ড / বিশ্ববিদ্যালয়',
  result: 'ফল',
  nationalityReligionGender: 'জাতীয়তা / ধর্ম / লিঙ্গ',
  father: 'পিতা',
  mother: 'মাতা',
};

const EN: CvLabels = {
  careerObjective: 'Career Objective',
  personalInformation: 'Personal Information',
  mailingAddress: 'Mailing / Present Address',
  permanentAddress: 'Permanent Address',
  fatherName: "Father's Name",
  motherName: "Mother's Name",
  dateOfBirth: 'Date of Birth',
  nationality: 'Nationality',
  religion: 'Religion',
  gender: 'Gender',
  maritalStatus: 'Marital Status',
  education: 'Educational Qualification',
  degreeExam: 'Degree / Examination',
  institution: 'Institution',
  passYear: 'Passing Year',
  resultDivision: 'Result / Division',
  experience: 'Experience',
  skills: 'Skills',
  references: 'References',
  contact: 'Contact',
  email: 'Email',
  mobile: 'Mobile',
  phone: 'Phone',
  professionalResume: 'Professional Resume',
  contactSection: 'Contact',
  profile: 'Profile',
  researchInterests: 'Research Interests',
  publications: 'Publications & Research',
  publicationTitle: 'Title',
  journalMedium: 'Journal / Medium',
  year: 'Year',
  trainingWorkshops: 'Training & Workshops',
  workExperience: 'Work Experience',
  objective: 'Objective',
  exam: 'Examination',
  boardUniversity: 'Board / University',
  result: 'Result',
  nationalityReligionGender: 'Nationality / Religion / Gender',
  father: 'Father',
  mother: 'Mother',
};

export function getCvLabels(lang: CvLanguage): CvLabels {
  return lang === 'en' ? EN : BN;
}

export function cvTemplateFontClass(lang: CvLanguage): string {
  return lang === 'bn' ? "font-[Hind_Siliguri,Inter,sans-serif]" : 'font-[Inter,system-ui,sans-serif]';
}
