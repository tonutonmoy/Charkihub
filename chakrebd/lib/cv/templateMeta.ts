export interface CvTemplateMeta {
  id: string;
  name: string;
  desc: string;
  image: string;
  category: string;
  popular: boolean;
}

export const CV_TEMPLATE_LIST: CvTemplateMeta[] = [
  {
    id: '1',
    name: 'Standard Govt Format',
    desc: 'বাংলাদেশি সরকারি চাকরির আবেদনে সর্বাধিক গ্রহণযোগ্য ফরম্যাট।',
    image: 'https://picsum.photos/seed/cv1/600/800',
    category: 'Govt Standard',
    popular: true,
  },
  {
    id: '2',
    name: 'Modern Corporate',
    desc: 'ব্যাংক ও বহুজাতিক কোম্পানির জন্য পরিষ্কার, আধুনিক লেআউট।',
    image: 'https://picsum.photos/seed/cv2/600/800',
    category: 'Corporate',
    popular: false,
  },
  {
    id: '3',
    name: 'Academic/Research',
    desc: 'প্রকাশনা, গবেষণা ও শিক্ষাগত অর্জনের জন্য বিস্তারিত ফরম্যাট।',
    image: 'https://picsum.photos/seed/cv3/600/800',
    category: 'Academic',
    popular: false,
  },
  {
    id: '4',
    name: 'Professional Compact',
    desc: 'সরকারি আবেদন ও বিসিএ পরীক্ষার জন্য উপযোগী সংক্ষিপ্ত পেশাদারি বিন্যাস।',
    image: 'https://picsum.photos/seed/cv4/600/800',
    category: 'Creative',
    popular: false,
  },
];

export const CV_CATEGORIES = ['All', 'Govt Standard', 'Corporate', 'Academic', 'Creative'] as const;
