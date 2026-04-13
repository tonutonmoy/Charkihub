import type { CVData } from './types';

export const INITIAL_CV_DATA: CVData = {
  language: 'bn',
  photoDataUrl: '',
  personalInfo: {
    fullName: 'মোঃ আব্দুর রহমান',
    email: 'rahman.dev@example.com',
    phone: '+880 1700 000000',
    address: 'বাসা ১২, রোড ৫, ধানমন্ডি, ঢাকা',
    permanentAddress: 'গ্রাম: পুরান বাজার, ডাকঘর: চাঁদপুর সদর, জেলা: চাঁদপুর',
    fatherName: 'মরহুম মোঃ ফজলুর রহমান',
    motherName: 'মিসেস ফাতেমা বেগম',
    dateOfBirth: '1995-05-20',
    nationality: 'বাংলাদেশী',
    religion: 'ইসলাম',
    gender: 'পুরুষ',
    maritalStatus: 'অবিবাহিত',
    objective:
      'প্রতিষ্ঠানের উন্নয়নে নিজের দক্ষতা ও অভিজ্ঞতা কাজে লাগিয়ে চ্যালেঞ্জিং পরিবেশে ক্যারিয়ার গড়ে তুলতে ইচ্ছুক।',
    researchInterests: 'ডেটা সায়েন্স, পাবলিক পলিসি, শিক্ষা ব্যবস্থাপনা',
  },
  education: [
    {
      id: '1',
      degree: 'বিএসসি ইন কম্পিউটার সায়েন্স',
      institution: 'ঢাকা বিশ্ববিদ্যালয়',
      year: '২০১৮',
      result: '৩.৮০/৪.০০',
    },
  ],
  experience: [
    {
      id: '1',
      title: 'সফটওয়্যার ইঞ্জিনিয়ার',
      company: 'টেক সলিউশন্স লিমিটেড',
      duration: '২০১৯ - বর্তমান',
      description: 'রিয়েক্ট ও নোড.জেএস ব্যবহার করে ফুল-স্ট্যাক ওয়েব ডেভেলপমেন্ট।',
    },
  ],
  skills: ['JavaScript', 'React', 'Node.js', 'SQL', 'Python', 'MS Word', 'MS Excel'],
  references: [
    {
      id: '1',
      name: 'ড. কামাল উদ্দিন',
      designation: 'অধ্যাপক',
      organization: 'ঢাকা বিশ্ববিদ্যালয়',
      contact: 'kamal@du.ac.bd',
    },
  ],
  publications: [
    {
      id: '1',
      title: 'ডিজিটাল গভর্নেন্স ও জনসেবা (নমুনা শিরোনাম)',
      journal: 'জার্নাল অফ পাবলিক অ্যাডমিনিস্ট্রেশন',
      year: '২০২৩',
    },
  ],
  training: [
    {
      id: '1',
      name: 'সরকারি কর্মকর্তাদের জন্য আইসিটি প্রশিক্ষণ',
      institution: 'বাংলাদেশ কম্পিউটার কাউন্সিল',
      year: '২০২২',
    },
  ],
};
