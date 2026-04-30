/**
 * Demo data: jobs, blog, suggestions. Run from server folder:
 *   npx tsx scripts/seed-sample.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const start = new Date();
  const end = new Date(Date.now() + 30 * 864e5);

  const jobCount = await prisma.job.count();
  if (jobCount === 0) {
    await prisma.job.createMany({
      data: [
        {
          mainCategory: 'government',
          subCategory: 'BCS',
          countryCode: 'BD',
          title: '46th BCS Circular (demo)',
          summary: 'National wide cadre recruitment — demo entry.',
          description: 'This is seeded demo content. Replace with real circular text in admin.',
          organization: 'Bangladesh Public Service Commission',
          applyUrl: 'https://example.com/apply',
          phone: null,
          startAt: start,
          endAt: end,
          pdfUrl: null,
          alertEnabled: true,
          alertMessage: 'Demo: verify deadline on official BPSC site.',
          status: 'published',
          likeCount: 12,
        },
        {
          mainCategory: 'government',
          subCategory: 'Bank',
          countryCode: 'BD',
          title: 'Senior Officer — Demo Bank',
          summary: 'IT officer track — demo.',
          organization: 'Demo Bank Ltd',
          applyUrl: null,
          phone: '+8801700000000',
          startAt: start,
          endAt: end,
          pdfUrl: null,
          alertEnabled: false,
          alertMessage: null,
          status: 'published',
          likeCount: 8,
        },
        {
          mainCategory: 'private',
          subCategory: 'Private IT',
          countryCode: 'BD',
          localArea: null,
          title: 'Software Engineer (demo)',
          summary: 'Remote-friendly private sector role.',
          description: 'Demo private job.',
          organization: 'Demo Tech Ltd',
          applyUrl: 'https://example.com/job',
          phone: null,
          startAt: start,
          endAt: end,
          pdfUrl: null,
          alertEnabled: false,
          alertMessage: null,
          status: 'published',
          likeCount: 5,
        },
        {
          mainCategory: 'local',
          subCategory: 'Teaching',
          countryCode: 'IN',
          localArea: 'Mumbai',
          title: 'Local school teacher (demo India)',
          summary: 'State quota local posting — demo.',
          description: 'Demo local job for India users.',
          organization: 'Demo School Board',
          applyUrl: 'https://example.com/in-apply',
          phone: null,
          startAt: start,
          endAt: end,
          pdfUrl: null,
          alertEnabled: false,
          alertMessage: null,
          status: 'published',
          likeCount: 3,
        },
      ],
    });
    console.log('[seed] inserted demo jobs');
  } else {
    console.log('[seed] jobs already exist — skip jobs');
  }

  const blogCount = await prisma.blogPost.count();
  if (blogCount === 0) {
    await prisma.blogPost.createMany({
      data: [
        {
          title: 'How to prepare for government exams',
          slug: 'gov-exam-prep',
          excerpt: 'Strategy for BCS, bank, and state jobs worldwide.',
          content:
            '## Plan\n\n1. Know the syllabus.\n2. Practice MCQs daily.\n3. Revise weekly.\n\nGood luck!',
          countryCode: 'BD',
          category: 'Exam Strategy',
          published: true,
        },
        {
          title: 'Bank interview tips',
          slug: 'bank-interview',
          excerpt: 'Common questions and how to answer.',
          content: 'Be clear about your motivation. Research the institution before the interview.',
          countryCode: 'BD',
          category: 'Career Tips',
          published: true,
        },
        {
          title: 'SSC & HSC study roadmap',
          slug: 'ssc-hsc-roadmap',
          excerpt: 'Balance board exams with competitive prep.',
          content: '## Timeline\n\nBuild a weekly schedule. Focus on weak subjects first.',
          countryCode: 'BD',
          category: 'Education',
          published: true,
        },
        {
          title: 'UPSC-style preparation notes (demo)',
          slug: 'upsc-demo',
          excerpt: 'For Indian users — demo article.',
          content: 'This is a **demo** blog post for India country filter.',
          countryCode: 'IN',
          category: 'Exam Strategy',
          published: true,
        },
      ],
    });
    console.log('[seed] inserted demo blog posts');
  } else {
    console.log('[seed] blog already exists — skip blog');
  }

  const sugCount = await prisma.suggestion.count();
  if (sugCount === 0) {
    await prisma.suggestion.createMany({
      data: [
        {
          title: 'BCS English literature — key topics',
          summary: 'Authors and periods to prioritize.',
          category: 'BCS',
          countryCode: 'BD',
          content: '- Shakespeare\n- Romantic period\n- Modern poetry',
          externalUrl: null,
          sortOrder: 1,
        },
        {
          title: 'Bank math shortcuts',
          summary: 'Profit, loss, interest formulas.',
          category: 'Bank',
          countryCode: 'BD',
          content: 'Practice 20 problems daily.',
          externalUrl: null,
          sortOrder: 2,
        },
        {
          title: 'MCQ question practice plan',
          summary: 'Timed sets and review.',
          category: 'MCQ',
          countryCode: 'BD',
          content: 'Use previous year papers.',
          externalUrl: null,
          sortOrder: 3,
        },
        {
          title: 'Government job application checklist',
          summary: 'Documents and deadlines.',
          category: 'Government',
          countryCode: 'BD',
          content: 'Keep scans ready. Track deadlines in calendar.',
          externalUrl: null,
          sortOrder: 4,
        },
        {
          title: 'HSC board exam focus areas',
          summary: 'Science group demo suggestion.',
          category: 'HSC',
          countryCode: 'BD',
          content: 'Board-first strategy, then entrance.',
          externalUrl: null,
          sortOrder: 5,
        },
        {
          title: 'SSC short suggestions',
          summary: 'Demo for SSC category.',
          category: 'SSC',
          countryCode: 'BD',
          content: 'NCERT basics + past papers.',
          externalUrl: null,
          sortOrder: 6,
        },
      ],
    });
    console.log('[seed] inserted demo suggestions');
  } else {
    console.log('[seed] suggestions already exist — skip suggestions');
  }

  const SEED_ORG = 'TonuChakriHub Seed';
  const alreadyBulk = await prisma.job.count({ where: { organization: SEED_ORG } });
  if (alreadyBulk === 0) {
    const start = new Date();
    const end = new Date(Date.now() + 45 * 864e5);
    const base = {
      organization: SEED_ORG,
      applyUrl: 'https://example.com/apply',
      phone: null as string | null,
      startAt: start,
      endAt: end,
      pdfUrl: null,
      alertEnabled: false,
      alertMessage: null,
      status: 'published' as const,
      description: 'Demo listing for realistic filters (government / private / local, city, sector).',
    };

    await prisma.job.createMany({
      data: [
        {
          ...base,
          mainCategory: 'government',
          subCategory: 'Bank',
          countryCode: 'IN',
          localArea: null,
          title: 'IBPS Clerk — Phase I (demo)',
          summary: 'All-India bank clerical cadre — practice-friendly demo row.',
          likeCount: 42,
        },
        {
          ...base,
          mainCategory: 'government',
          subCategory: 'Bank',
          countryCode: 'IN',
          localArea: 'Mumbai',
          title: 'SBI Specialist Officer — IT (demo)',
          summary: 'Government bank IT vertical — metro posting.',
          likeCount: 31,
        },
        {
          ...base,
          mainCategory: 'government',
          subCategory: 'SSC',
          countryCode: 'IN',
          localArea: null,
          title: 'SSC CGL Tier-I notice (demo)',
          summary: 'Staff Selection Commission combined graduate level.',
          likeCount: 55,
        },
        {
          ...base,
          mainCategory: 'government',
          subCategory: 'Railway',
          countryCode: 'IN',
          localArea: 'Kolkata',
          title: 'Railway Group D — Eastern Region (demo)',
          summary: 'Kolkata hub operations and maintenance roles.',
          likeCount: 28,
        },
        {
          ...base,
          mainCategory: 'government',
          subCategory: 'UPSC',
          countryCode: 'IN',
          localArea: 'New Delhi',
          title: 'UPSC Civil Services — prelims window (demo)',
          summary: 'Central civil services — demo timeline.',
          likeCount: 60,
        },
        {
          ...base,
          mainCategory: 'private',
          subCategory: 'IT',
          countryCode: 'IN',
          localArea: 'Bengaluru',
          title: 'Full-stack engineer — product SaaS (demo)',
          summary: 'Private IT — React, Node, cloud.',
          likeCount: 19,
        },
        {
          ...base,
          mainCategory: 'private',
          subCategory: 'IT',
          countryCode: 'IN',
          localArea: 'Hyderabad',
          title: 'Backend engineer — fintech (demo)',
          summary: 'Private sector IT — payments platform.',
          likeCount: 22,
        },
        {
          ...base,
          mainCategory: 'private',
          subCategory: 'Private IT',
          countryCode: 'IN',
          localArea: null,
          title: 'Remote software engineer — India (demo)',
          summary: 'Private IT remote-first role.',
          likeCount: 17,
        },
        {
          ...base,
          mainCategory: 'local',
          subCategory: 'Retail',
          countryCode: 'IN',
          localArea: 'Kolkata',
          title: 'Store supervisor — Salt Lake (demo)',
          summary: 'Local Kolkata hiring — shift operations.',
          likeCount: 9,
        },
        {
          ...base,
          mainCategory: 'local',
          subCategory: 'Teaching',
          countryCode: 'IN',
          localArea: 'Kolkata',
          title: 'Primary teacher — local council (demo)',
          summary: 'Kolkata area school — local quota.',
          likeCount: 11,
        },
        {
          ...base,
          mainCategory: 'local',
          subCategory: 'Hospitality',
          countryCode: 'IN',
          localArea: 'Mumbai',
          title: 'Front desk — Andheri (demo)',
          summary: 'Local Mumbai hospitality.',
          likeCount: 7,
        },
        {
          ...base,
          mainCategory: 'government',
          subCategory: 'BCS',
          countryCode: 'BD',
          localArea: null,
          title: 'BCS 46th — general cadre (demo)',
          summary: 'Bangladesh civil service — wide recruitment.',
          likeCount: 33,
        },
        {
          ...base,
          mainCategory: 'government',
          subCategory: 'Bank',
          countryCode: 'BD',
          localArea: 'Dhaka',
          title: 'Bangladesh Bank — officer IT (demo)',
          summary: 'Central bank IT track — Dhaka.',
          likeCount: 26,
        },
        {
          ...base,
          mainCategory: 'government',
          subCategory: 'Railway',
          countryCode: 'BD',
          localArea: 'Chattogram',
          title: 'Railway assistant — southeast (demo)',
          summary: 'Government railway operations.',
          likeCount: 18,
        },
        {
          ...base,
          mainCategory: 'private',
          subCategory: 'IT',
          countryCode: 'BD',
          localArea: 'Dhaka',
          title: 'Software engineer — startup (demo)',
          summary: 'Private IT Dhaka — product team.',
          likeCount: 14,
        },
        {
          ...base,
          mainCategory: 'private',
          subCategory: 'Banking IT',
          countryCode: 'BD',
          localArea: null,
          title: 'Core banking developer (demo)',
          summary: 'Private bank technology division.',
          likeCount: 12,
        },
        {
          ...base,
          mainCategory: 'local',
          subCategory: 'NGO',
          countryCode: 'BD',
          localArea: 'Dhaka',
          title: 'Field coordinator — Gulshan (demo)',
          summary: 'Local Dhaka NGO operations.',
          likeCount: 8,
        },
        {
          ...base,
          mainCategory: 'local',
          subCategory: 'Clinic',
          countryCode: 'BD',
          localArea: 'Dhaka',
          title: 'Medical assistant — Dhanmondi (demo)',
          summary: 'Local healthcare support.',
          likeCount: 6,
        },
        {
          ...base,
          mainCategory: 'local',
          subCategory: 'Teaching',
          countryCode: 'BD',
          localArea: 'Sylhet',
          title: 'College lecturer — Sylhet (demo)',
          summary: 'Local education board posting.',
          likeCount: 10,
        },
      ],
    });
    console.log('[seed] inserted TonuChakriHub Seed job pack (IN + BD)');
  } else {
    console.log('[seed] TonuChakriHub Seed jobs already present — skip bulk pack');
  }

  const filterCount = await prisma.jobFilterOption.count();
  if (filterCount === 0) {
    await prisma.jobFilterOption.createMany({
      data: [
        { kind: 'country', countryCode: '', mainCategory: '', value: 'BD', label: 'Bangladesh', sortOrder: 1 },
        { kind: 'country', countryCode: '', mainCategory: '', value: 'IN', label: 'India', sortOrder: 2 },
        { kind: 'country', countryCode: '', mainCategory: '', value: 'US', label: 'United States', sortOrder: 3 },
        { kind: 'main_category', countryCode: '', mainCategory: '', value: 'government', label: 'Government', sortOrder: 1 },
        { kind: 'main_category', countryCode: '', mainCategory: '', value: 'private', label: 'Private', sortOrder: 2 },
        { kind: 'main_category', countryCode: '', mainCategory: '', value: 'local', label: 'Local', sortOrder: 3 },
        { kind: 'city', countryCode: 'IN', mainCategory: '', value: 'Kolkata', label: 'Kolkata', sortOrder: 1 },
        { kind: 'city', countryCode: 'IN', mainCategory: '', value: 'Mumbai', label: 'Mumbai', sortOrder: 2 },
        { kind: 'city', countryCode: 'IN', mainCategory: '', value: 'Bengaluru', label: 'Bengaluru', sortOrder: 3 },
        { kind: 'city', countryCode: 'IN', mainCategory: '', value: 'Hyderabad', label: 'Hyderabad', sortOrder: 4 },
        { kind: 'city', countryCode: 'IN', mainCategory: '', value: 'New Delhi', label: 'New Delhi', sortOrder: 5 },
        { kind: 'city', countryCode: 'BD', mainCategory: '', value: 'Dhaka', label: 'Dhaka', sortOrder: 1 },
        { kind: 'city', countryCode: 'BD', mainCategory: '', value: 'Chattogram', label: 'Chattogram', sortOrder: 2 },
        { kind: 'city', countryCode: 'BD', mainCategory: '', value: 'Sylhet', label: 'Sylhet', sortOrder: 3 },
        { kind: 'sub_category', countryCode: 'IN', mainCategory: 'government', value: 'Bank', label: 'Bank', sortOrder: 1 },
        { kind: 'sub_category', countryCode: 'IN', mainCategory: 'government', value: 'SSC', label: 'SSC', sortOrder: 2 },
        { kind: 'sub_category', countryCode: 'IN', mainCategory: 'government', value: 'Railway', label: 'Railway', sortOrder: 3 },
        { kind: 'sub_category', countryCode: 'IN', mainCategory: 'government', value: 'UPSC', label: 'UPSC', sortOrder: 4 },
        { kind: 'sub_category', countryCode: 'IN', mainCategory: 'private', value: 'IT', label: 'IT', sortOrder: 1 },
        { kind: 'sub_category', countryCode: 'IN', mainCategory: 'private', value: 'Private IT', label: 'Private IT', sortOrder: 2 },
        { kind: 'sub_category', countryCode: 'IN', mainCategory: 'local', value: 'Teaching', label: 'Teaching', sortOrder: 1 },
        { kind: 'sub_category', countryCode: 'IN', mainCategory: 'local', value: 'Retail', label: 'Retail', sortOrder: 2 },
        { kind: 'sub_category', countryCode: 'BD', mainCategory: 'government', value: 'BCS', label: 'BCS', sortOrder: 1 },
        { kind: 'sub_category', countryCode: 'BD', mainCategory: 'government', value: 'Bank', label: 'Bank', sortOrder: 2 },
        { kind: 'sub_category', countryCode: 'BD', mainCategory: 'government', value: 'Railway', label: 'Railway', sortOrder: 3 },
        { kind: 'sub_category', countryCode: 'BD', mainCategory: 'private', value: 'IT', label: 'IT', sortOrder: 1 },
        { kind: 'sub_category', countryCode: 'BD', mainCategory: 'private', value: 'Banking IT', label: 'Banking IT', sortOrder: 2 },
        { kind: 'sub_category', countryCode: 'BD', mainCategory: 'local', value: 'NGO', label: 'NGO', sortOrder: 1 },
        { kind: 'sub_category', countryCode: 'BD', mainCategory: 'local', value: 'Teaching', label: 'Teaching', sortOrder: 2 },
      ],
    });
    console.log('[seed] job filter options (countries, cities, categories)');
  } else {
    console.log('[seed] job filter options already exist — skip');
  }

  const examPrepCount = await prisma.examPrepCategory.count();
  if (examPrepCount === 0) {
    const bcs = await prisma.examPrepCategory.create({
      data: { label: 'BCS', slug: 'bcs', countryCode: 'BD', sortOrder: 1, active: true },
    });
    const bank = await prisma.examPrepCategory.create({
      data: { label: 'Bank', slug: 'bank', countryCode: 'BD', sortOrder: 2, active: true },
    });
    const primary = await prisma.examPrepCategory.create({
      data: { label: 'Primary', slug: 'primary', countryCode: 'BD', sortOrder: 3, active: true },
    });
    const general = await prisma.examPrepCategory.create({
      data: { label: 'General', slug: 'general', countryCode: 'BD', sortOrder: 4, active: true },
    });
    await prisma.examPrepCourse.createMany({
      data: [
        {
          categoryId: bcs.id,
          title: 'BCS Preliminary Masterclass',
          description: 'Full syllabus coverage — demo.',
          lessons: 120,
          duration: '45 Hours',
          rating: 4.9,
          price: 'Free',
          sortOrder: 1,
          published: true,
        },
        {
          categoryId: bank.id,
          title: 'Bank Job Math Shortcuts',
          description: 'Quant and reasoning — demo.',
          lessons: 45,
          duration: '15 Hours',
          rating: 4.8,
          price: 'Premium',
          sortOrder: 1,
          published: true,
        },
        {
          categoryId: primary.id,
          title: 'Primary Teacher Exam Guide',
          description: 'NTRCA-style prep — demo.',
          lessons: 60,
          duration: '20 Hours',
          rating: 4.7,
          price: 'Free',
          sortOrder: 1,
          published: true,
        },
        {
          categoryId: general.id,
          title: 'Current Affairs 2026',
          description: 'Monthly digest — demo.',
          lessons: 12,
          duration: '6 Hours',
          rating: 4.5,
          price: 'Free',
          sortOrder: 1,
          published: true,
        },
      ],
    });
    console.log('[seed] exam prep categories & courses');
  } else {
    console.log('[seed] exam prep already exists — skip');
  }

  const feedCount = await prisma.feedPost.count();
  if (feedCount === 0) {
    const anyUser = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
    if (anyUser) {
      await prisma.feedPost.create({
        data: {
          userId: anyUser.id,
          body: 'Welcome to the ChakreBD community feed. This is a seeded demo post — create your own after login.',
        },
      });
      const g = await prisma.group.create({
        data: {
          name: 'Job seekers BD',
          description: 'Discuss exams, jobs, and prep — demo group.',
          isPublic: true,
          createdById: anyUser.id,
          members: { create: { userId: anyUser.id, role: 'admin' } },
        },
      });
      await prisma.feedPost.create({
        data: {
          userId: anyUser.id,
          groupId: g.id,
          body: 'First group post — share resources and tips here.',
        },
      });
      console.log('[seed] demo feed + group posts');
    } else {
      console.log('[seed] no users yet — skip feed/group seed');
    }
  } else {
    console.log('[seed] feed already exists — skip');
  }
  }

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
