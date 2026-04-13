'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  User,
  Briefcase,
  GraduationCap,
  Plus,
  Trash2,
  Save,
  Eye,
  Sparkles,
  Check,
  X,
  BookOpen,
  Languages,
  ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useReactToPrint } from 'react-to-print';
import { cn } from '@/lib/utils';
import type { CVData, CvLanguage, Education, Experience, Reference, Publication, Training } from '@/lib/cv/types';
import { fileToResizedDataUrl } from '@/lib/cv/resizePhoto';
import { INITIAL_CV_DATA } from '@/lib/cv/initialData';
import { loadCvData, parseStoredCvData, saveCvData } from '@/lib/cv/storage';
import { getTemplateComponent } from '@/lib/cv/registry';
import { CV_TEMPLATE_LIST } from '@/lib/cv/templateMeta';
import { getCvDraft, putCvDraft, uploadImageBase64 } from '@/lib/api';
import { useAuth } from '@/src/components/AuthContext';

export default function CVEditor() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = (params?.templateId as string) || '1';

  const [data, setData] = useState<CVData>(() => structuredClone(INITIAL_CV_DATA));
  const [hydrated, setHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>(
    searchParams?.get('mode') === 'preview' ? 'preview' : 'edit'
  );
  const [isSaved, setIsSaved] = useState(false);
  const [remoteSaveError, setRemoteSaveError] = useState<string | null>(null);
  const componentRef = useRef<HTMLDivElement>(null);
  const skillInputRef = useRef<HTMLInputElement>(null);
  const { isLoggedIn, ready: authReady } = useAuth();

  const TemplatePreview = useMemo(() => getTemplateComponent(templateId), [templateId]);
  const showBdPersonalFields = templateId !== '2';
  const showAcademicSections = templateId === '3';

  useEffect(() => {
    setData(loadCvData(templateId));
    setHydrated(true);
  }, [templateId]);

  useEffect(() => {
    if (!hydrated || !authReady || !isLoggedIn) return;
    let cancelled = false;
    (async () => {
      const res = await getCvDraft(templateId);
      if (cancelled) return;
      if (res.ok && res.data !== undefined) {
        const merged = parseStoredCvData(res.data);
        setData(merged);
        saveCvData(templateId, merged);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, authReady, isLoggedIn, templateId]);

  const handleSave = async () => {
    saveCvData(templateId, data);
    setRemoteSaveError(null);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    if (isLoggedIn) {
      const r = await putCvDraft(templateId, data);
      if (!r.ok) setRemoteSaveError(r.error);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `${data.personalInfo.fullName}_CV`,
  });

  const updatePersonalInfo = (field: keyof CVData['personalInfo'], value: string) => {
    setData((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value },
    }));
  };

  const setLanguage = (language: CvLanguage) => {
    setData((prev) => ({ ...prev, language }));
  };

  const onPhotoInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      if (isLoggedIn) {
        const up = await uploadImageBase64(dataUrl);
        if (up.ok) {
          setData((prev) => ({ ...prev, photoDataUrl: up.url }));
        } else {
          setData((prev) => ({ ...prev, photoDataUrl: dataUrl }));
        }
      } else {
        setData((prev) => ({ ...prev, photoDataUrl: dataUrl }));
      }
    } catch {
      /* ignore */
    }
    e.target.value = '';
  };

  const clearPhoto = () => setData((prev) => ({ ...prev, photoDataUrl: '' }));

  const addEducation = () => {
    setData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        { id: Date.now().toString(), degree: '', institution: '', year: '', result: '' },
      ],
    }));
  };

  const removeEducation = (id: string) => {
    setData((prev) => ({ ...prev, education: prev.education.filter((e) => e.id !== id) }));
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setData((prev) => ({
      ...prev,
      education: prev.education.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    }));
  };

  const addExperience = () => {
    setData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        { id: Date.now().toString(), title: '', company: '', duration: '', description: '' },
      ],
    }));
  };

  const removeExperience = (id: string) => {
    setData((prev) => ({ ...prev, experience: prev.experience.filter((e) => e.id !== id) }));
  };

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    setData((prev) => ({
      ...prev,
      experience: prev.experience.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    }));
  };

  const addSkill = (skill: string) => {
    const s = skill.trim();
    if (s && !data.skills.includes(s)) {
      setData((prev) => ({ ...prev, skills: [...prev.skills, s] }));
    }
  };

  const removeSkill = (skill: string) => {
    setData((prev) => ({ ...prev, skills: prev.skills.filter((x) => x !== skill) }));
  };

  const addReference = () => {
    setData((prev) => ({
      ...prev,
      references: [
        ...prev.references,
        { id: Date.now().toString(), name: '', designation: '', organization: '', contact: '' },
      ],
    }));
  };

  const updateReference = (id: string, field: keyof Reference, value: string) => {
    setData((prev) => ({
      ...prev,
      references: prev.references.map((ref) => (ref.id === id ? { ...ref, [field]: value } : ref)),
    }));
  };

  const removeReference = (id: string) => {
    setData((prev) => ({ ...prev, references: prev.references.filter((ref) => ref.id !== id) }));
  };

  const addPublication = () => {
    setData((prev) => ({
      ...prev,
      publications: [
        ...prev.publications,
        { id: Date.now().toString(), title: '', journal: '', year: '' },
      ],
    }));
  };

  const updatePublication = (id: string, field: keyof Publication, value: string) => {
    setData((prev) => ({
      ...prev,
      publications: prev.publications.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    }));
  };

  const removePublication = (id: string) => {
    setData((prev) => ({ ...prev, publications: prev.publications.filter((p) => p.id !== id) }));
  };

  const addTraining = () => {
    setData((prev) => ({
      ...prev,
      training: [
        ...prev.training,
        { id: Date.now().toString(), name: '', institution: '', year: '' },
      ],
    }));
  };

  const updateTraining = (id: string, field: keyof Training, value: string) => {
    setData((prev) => ({
      ...prev,
      training: prev.training.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    }));
  };

  const removeTraining = (id: string) => {
    setData((prev) => ({ ...prev, training: prev.training.filter((t) => t.id !== id) }));
  };

  const currentTemplateName = CV_TEMPLATE_LIST.find((t) => t.id === templateId)?.name ?? 'CV';

  if (!hydrated) {
    return (
      <div className="pt-32 pb-20 min-h-screen bg-muted/30 flex items-center justify-center">
        <p className="text-muted-foreground font-medium">লোড হচ্ছে…</p>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 min-h-screen bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-white"
              onClick={() => router.push('/cv')}
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-3xl font-black tracking-tight">সিভি সম্পাদক</h1>
              <p className="text-muted-foreground font-medium">
                টেমপ্লেট: <span className="text-foreground">{currentTemplateName}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-col items-stretch sm:items-end gap-1">
            <div className="flex flex-wrap items-center gap-3 justify-end">
              <Button
                variant="outline"
                className={cn(
                  'rounded-xl h-12 px-6 font-bold bg-white border-border/50 shadow-sm transition-all',
                  isSaved && 'bg-green-50 text-green-600 border-green-200'
                )}
                onClick={handleSave}
              >
                {isSaved ? (
                  <>
                    <Check className="mr-2 w-5 h-5" /> সংরক্ষিত
                  </>
                ) : (
                  <>
                    <Save className="mr-2 w-5 h-5" /> সংরক্ষণ করুন
                  </>
                )}
              </Button>
              <Button
                onClick={handlePrint}
                className="rounded-xl h-12 px-8 font-black shadow-xl shadow-primary/20"
              >
                <Download className="mr-2 w-5 h-5" /> PDF ডাউনলোড
              </Button>
            </div>
            {remoteSaveError ? (
              <p className="text-xs text-destructive font-medium text-right max-w-md" role="alert">
                সার্ভারে সেভ ব্যর্থ: {remoteSaveError}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div
            className={cn(
              'flex-1 space-y-8 transition-all duration-500',
              activeTab === 'preview' ? 'hidden lg:block lg:opacity-50' : 'block'
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <Button variant="ghost" className="rounded-xl font-bold w-fit" onClick={() => router.push('/cv')}>
                <ArrowLeft className="mr-2 w-5 h-5" /> টেমপ্লেটে ফিরুন
              </Button>
              <div className="flex flex-wrap gap-2">
                {CV_TEMPLATE_LIST.map((t) => (
                  <Link key={t.id} href={`/cv/edit/${t.id}`}>
                    <Button
                      variant={templateId === t.id ? 'default' : 'outline'}
                      size="sm"
                      className="rounded-xl font-bold"
                    >
                      {t.id}. {t.name}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>

            <Card className="rounded-[2.5rem] border-border/50 shadow-xl overflow-hidden bg-card">
              <CardHeader className="bg-primary/5 p-8 border-b border-border/50">
                <CardTitle className="text-2xl font-black flex items-center gap-3">
                  <Languages className="w-6 h-6 text-primary" /> ভাষা ও ছবি
                </CardTitle>
                <p className="text-sm text-muted-foreground font-medium mt-1">
                  প্রিভিউ/PDF-এ সেকশন শিরোনামের ভাষা; ছবি সব টেমপ্লেটে দেখা যাবে।
                </p>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">CV ভাষা (লেবেল)</label>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant={data.language === 'bn' ? 'default' : 'outline'}
                      className="rounded-xl font-black min-w-[120px]"
                      onClick={() => setLanguage('bn')}
                    >
                      বাংলা
                    </Button>
                    <Button
                      type="button"
                      variant={data.language === 'en' ? 'default' : 'outline'}
                      className="rounded-xl font-black min-w-[120px]"
                      onClick={() => setLanguage('en')}
                    >
                      English
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    আপনি যে ভাষা বেছে নেবেন, সিভির শিরোনাম ও ফিল্ড লেবেল সেই ভাষায় দেখাবে। নিজের লেখা (নাম, ঠিকানা ইত্যাদি) আপনি যেভাবে লিখেছেন সেভাবেই থাকবে।
                  </p>
                </div>
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> পাসপোর্ট সাইজ ছবি (ঐচ্ছিক)
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
                    <Input type="file" accept="image/jpeg,image/png,image/webp,image/jpg" className="rounded-xl max-w-md" onChange={onPhotoInput} />
                    {data.photoDataUrl ? (
                      <>
                        <div className="relative h-[120px] w-[96px] shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={data.photoDataUrl} alt="" className="h-full w-full object-cover" />
                        </div>
                        <Button type="button" variant="outline" className="rounded-xl font-bold" onClick={clearPhoto}>
                          ছবি সরান
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-border/50 shadow-xl overflow-hidden bg-card">
              <CardHeader className="bg-primary/5 p-8 border-b border-border/50">
                <CardTitle className="text-2xl font-black flex items-center gap-3">
                  <User className="w-6 h-6 text-primary" /> ব্যক্তিগত তথ্য
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">পূর্ণ নাম</label>
                    <Input
                      value={data.personalInfo.fullName}
                      onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                      className="rounded-xl h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">ইমেইল</label>
                    <Input
                      value={data.personalInfo.email}
                      onChange={(e) => updatePersonalInfo('email', e.target.value)}
                      className="rounded-xl h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">মোবাইল</label>
                    <Input
                      value={data.personalInfo.phone}
                      onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                      className="rounded-xl h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">বর্তমান ঠিকানা</label>
                    <Input
                      value={data.personalInfo.address}
                      onChange={(e) => updatePersonalInfo('address', e.target.value)}
                      className="rounded-xl h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">স্থায়ী ঠিকানা</label>
                    <Input
                      value={data.personalInfo.permanentAddress}
                      onChange={(e) => updatePersonalInfo('permanentAddress', e.target.value)}
                      className="rounded-xl h-12"
                    />
                  </div>
                </div>

                {showBdPersonalFields && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border/50">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">পিতার নাম</label>
                      <Input
                        value={data.personalInfo.fatherName}
                        onChange={(e) => updatePersonalInfo('fatherName', e.target.value)}
                        className="rounded-xl h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">মাতার নাম</label>
                      <Input
                        value={data.personalInfo.motherName}
                        onChange={(e) => updatePersonalInfo('motherName', e.target.value)}
                        className="rounded-xl h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">জন্ম তারিখ</label>
                      <Input
                        type="date"
                        value={data.personalInfo.dateOfBirth}
                        onChange={(e) => updatePersonalInfo('dateOfBirth', e.target.value)}
                        className="rounded-xl h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">জাতীয়তা</label>
                      <Input
                        value={data.personalInfo.nationality}
                        onChange={(e) => updatePersonalInfo('nationality', e.target.value)}
                        className="rounded-xl h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">ধর্ম</label>
                      <Input
                        value={data.personalInfo.religion}
                        onChange={(e) => updatePersonalInfo('religion', e.target.value)}
                        className="rounded-xl h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">লিঙ্গ</label>
                      <Input
                        value={data.personalInfo.gender}
                        onChange={(e) => updatePersonalInfo('gender', e.target.value)}
                        className="rounded-xl h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">বৈবাহিক অবস্থা</label>
                      <Input
                        value={data.personalInfo.maritalStatus}
                        onChange={(e) => updatePersonalInfo('maritalStatus', e.target.value)}
                        className="rounded-xl h-12"
                      />
                    </div>
                  </div>
                )}

                {showAcademicSections && (
                  <div className="space-y-2 pt-6 border-t border-border/50">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">গবেষণা আগ্রহ</label>
                    <textarea
                      value={data.personalInfo.researchInterests}
                      onChange={(e) => updatePersonalInfo('researchInterests', e.target.value)}
                      className="w-full min-h-[80px] rounded-xl bg-background border border-input p-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                )}

                <div className="space-y-2 pt-6 border-t border-border/50">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">ক্যারিয়ার উদ্দেশ্য</label>
                  <textarea
                    value={data.personalInfo.objective}
                    onChange={(e) => updatePersonalInfo('objective', e.target.value)}
                    className="w-full min-h-[120px] rounded-xl bg-background border border-input p-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-border/50 shadow-xl overflow-hidden bg-card">
              <CardHeader className="bg-primary/5 p-8 border-b border-border/50 flex flex-row items-center justify-between">
                <CardTitle className="text-2xl font-black flex items-center gap-3">
                  <GraduationCap className="w-6 h-6 text-primary" /> শিক্ষাগত যোগ্যতা
                </CardTitle>
                <Button onClick={addEducation} size="sm" className="rounded-xl font-bold">
                  <Plus className="w-4 h-4 mr-1" /> যোগ করুন
                </Button>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {data.education.map((edu) => (
                  <div key={edu.id} className="relative space-y-4 p-6 rounded-3xl bg-muted/30 border border-border/50">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-4 right-4 text-destructive hover:bg-destructive/10"
                      onClick={() => removeEducation(edu.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">ডিগ্রি / পরীক্ষা</label>
                        <Input
                          value={edu.degree}
                          onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                          className="rounded-xl h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">প্রতিষ্ঠান</label>
                        <Input
                          value={edu.institution}
                          onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                          className="rounded-xl h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">সাল</label>
                        <Input value={edu.year} onChange={(e) => updateEducation(edu.id, 'year', e.target.value)} className="rounded-xl h-10" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">ফলাফল / বিভাগ</label>
                        <Input
                          value={edu.result}
                          onChange={(e) => updateEducation(edu.id, 'result', e.target.value)}
                          className="rounded-xl h-10"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {showAcademicSections && (
              <>
                <Card className="rounded-[2.5rem] border-border/50 shadow-xl overflow-hidden bg-card">
                  <CardHeader className="bg-primary/5 p-8 border-b border-border/50 flex flex-row items-center justify-between">
                    <CardTitle className="text-2xl font-black">প্রকাশনা ও গবেষণা</CardTitle>
                    <Button onClick={addPublication} size="sm" className="rounded-xl font-bold">
                      <Plus className="w-4 h-4 mr-1" /> যোগ করুন
                    </Button>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    {data.publications.map((pub) => (
                      <div key={pub.id} className="relative space-y-4 p-6 rounded-3xl bg-muted/30 border border-border/50">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-4 right-4 text-destructive hover:bg-destructive/10"
                          onClick={() => removePublication(pub.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">শিরোনাম</label>
                            <Input
                              value={pub.title}
                              onChange={(e) => updatePublication(pub.id, 'title', e.target.value)}
                              className="rounded-xl h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">জার্নাল / মাধ্যম</label>
                            <Input
                              value={pub.journal}
                              onChange={(e) => updatePublication(pub.id, 'journal', e.target.value)}
                              className="rounded-xl h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">সাল</label>
                            <Input
                              value={pub.year}
                              onChange={(e) => updatePublication(pub.id, 'year', e.target.value)}
                              className="rounded-xl h-10"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-border/50 shadow-xl overflow-hidden bg-card">
                  <CardHeader className="bg-primary/5 p-8 border-b border-border/50 flex flex-row items-center justify-between">
                    <CardTitle className="text-2xl font-black">প্রশিক্ষণ ও কর্মশালা</CardTitle>
                    <Button onClick={addTraining} size="sm" className="rounded-xl font-bold">
                      <Plus className="w-4 h-4 mr-1" /> যোগ করুন
                    </Button>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    {data.training.map((tr) => (
                      <div key={tr.id} className="relative space-y-4 p-6 rounded-3xl bg-muted/30 border border-border/50">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-4 right-4 text-destructive hover:bg-destructive/10"
                          onClick={() => removeTraining(tr.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">প্রশিক্ষণের নাম</label>
                            <Input
                              value={tr.name}
                              onChange={(e) => updateTraining(tr.id, 'name', e.target.value)}
                              className="rounded-xl h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">প্রতিষ্ঠান</label>
                            <Input
                              value={tr.institution}
                              onChange={(e) => updateTraining(tr.id, 'institution', e.target.value)}
                              className="rounded-xl h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">সাল</label>
                            <Input
                              value={tr.year}
                              onChange={(e) => updateTraining(tr.id, 'year', e.target.value)}
                              className="rounded-xl h-10"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}

            <Card className="rounded-[2.5rem] border-border/50 shadow-xl overflow-hidden bg-card">
              <CardHeader className="bg-primary/5 p-8 border-b border-border/50 flex flex-row items-center justify-between">
                <CardTitle className="text-2xl font-black flex items-center gap-3">
                  <Briefcase className="w-6 h-6 text-primary" /> অভিজ্ঞতা
                </CardTitle>
                <Button onClick={addExperience} size="sm" className="rounded-xl font-bold">
                  <Plus className="w-4 h-4 mr-1" /> যোগ করুন
                </Button>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {data.experience.map((exp) => (
                  <div key={exp.id} className="relative space-y-4 p-6 rounded-3xl bg-muted/30 border border-border/50">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-4 right-4 text-destructive hover:bg-destructive/10"
                      onClick={() => removeExperience(exp.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">পদবি</label>
                        <Input
                          value={exp.title}
                          onChange={(e) => updateExperience(exp.id, 'title', e.target.value)}
                          className="rounded-xl h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">প্রতিষ্ঠান</label>
                        <Input
                          value={exp.company}
                          onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                          className="rounded-xl h-10"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">সময়কাল</label>
                        <Input
                          value={exp.duration}
                          onChange={(e) => updateExperience(exp.id, 'duration', e.target.value)}
                          className="rounded-xl h-10"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">বিবরণ</label>
                        <textarea
                          value={exp.description}
                          onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                          className="w-full min-h-[100px] rounded-xl bg-background border border-input p-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-border/50 shadow-xl overflow-hidden bg-card">
              <CardHeader className="bg-primary/5 p-8 border-b border-border/50">
                <CardTitle className="text-2xl font-black flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-primary" /> দক্ষতা
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="flex gap-2">
                  <Input
                    ref={skillInputRef}
                    placeholder="দক্ষতা লিখুন (যেমন MS Word, Python)"
                    className="rounded-xl h-12"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const v = skillInputRef.current?.value ?? '';
                        addSkill(v);
                        if (skillInputRef.current) skillInputRef.current.value = '';
                      }
                    }}
                  />
                  <Button
                    type="button"
                    className="rounded-xl h-12 px-6 font-bold"
                    onClick={() => {
                      const v = skillInputRef.current?.value ?? '';
                      addSkill(v);
                      if (skillInputRef.current) skillInputRef.current.value = '';
                    }}
                  >
                    যোগ করুন
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.skills.map((skill) => (
                    <Badge key={skill} className="bg-primary/10 text-primary border-none px-3 py-1.5 rounded-lg flex items-center gap-2 group">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="hover:text-destructive transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-border/50 shadow-xl overflow-hidden bg-card">
              <CardHeader className="bg-primary/5 p-8 border-b border-border/50 flex flex-row items-center justify-between">
                <CardTitle className="text-2xl font-black flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-primary" /> রেফারেন্স
                </CardTitle>
                <Button onClick={addReference} size="sm" className="rounded-xl font-bold">
                  <Plus className="w-4 h-4 mr-1" /> যোগ করুন
                </Button>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {data.references.map((ref) => (
                  <div key={ref.id} className="relative space-y-4 p-6 rounded-3xl bg-muted/30 border border-border/50">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-4 right-4 text-destructive hover:bg-destructive/10"
                      onClick={() => removeReference(ref.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">নাম</label>
                        <Input
                          value={ref.name}
                          onChange={(e) => updateReference(ref.id, 'name', e.target.value)}
                          className="rounded-xl h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">পদবি</label>
                        <Input
                          value={ref.designation}
                          onChange={(e) => updateReference(ref.id, 'designation', e.target.value)}
                          className="rounded-xl h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">প্রতিষ্ঠান</label>
                        <Input
                          value={ref.organization}
                          onChange={(e) => updateReference(ref.id, 'organization', e.target.value)}
                          className="rounded-xl h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">যোগাযোগ</label>
                        <Input
                          value={ref.contact}
                          onChange={(e) => updateReference(ref.id, 'contact', e.target.value)}
                          className="rounded-xl h-10"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div
            className={cn(
              'lg:w-[600px] xl:w-[800px] space-y-6 transition-all duration-500',
              activeTab === 'edit' ? 'hidden lg:block' : 'block'
            )}
          >
            <div className="sticky top-32 space-y-6">
              <div className="flex items-center justify-between bg-card p-4 rounded-2xl border border-border/50 shadow-lg">
                <div className="flex gap-2">
                  <Button
                    variant={activeTab === 'edit' ? 'default' : 'ghost'}
                    className="rounded-xl font-bold lg:hidden"
                    onClick={() => setActiveTab('edit')}
                  >
                    সম্পাদনা
                  </Button>
                  <Button
                    variant={activeTab === 'preview' ? 'default' : 'ghost'}
                    className="rounded-xl font-bold lg:hidden"
                    onClick={() => setActiveTab('preview')}
                  >
                    <Eye className="mr-2 w-4 h-4" /> প্রিভিউ
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-border/50 origin-top scale-[0.7] md:scale-100 print:scale-100">
                <div ref={componentRef}>
                  <TemplatePreview data={data} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
