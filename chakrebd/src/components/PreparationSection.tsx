'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, GraduationCap, Building2, 
  Train, LayoutGrid, FileText, 
  CheckCircle2, PlayCircle, Download, Star, Sparkles
} from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThreeDCard } from './ThreeDCard';

const PreparationSection = () => {
  const { t } = useLanguage();

  const categories = [
    { id: 'bcs', label: t('prep.bcs'), icon: GraduationCap },
    { id: 'bank', label: t('prep.bank'), icon: Building2 },
    { id: 'primary', label: t('prep.primary'), icon: BookOpen },
    { id: 'railway', label: t('prep.railway'), icon: Train },
    { id: 'others', label: t('prep.others'), icon: LayoutGrid },
  ];

  const content = {
    bcs: {
      title: 'BCS Preparation Hub',
      description: 'Comprehensive study materials for Preliminary, Written, and Viva.',
      modules: [
        { title: 'Syllabus Breakdown', icon: FileText, count: '10 Subjects' },
        { title: 'Study Plan (90 Days)', icon: CheckCircle2, count: 'Active' },
        { title: 'PDF Notes', icon: Download, count: '500+ Files' },
        { title: 'Video Lectures', icon: PlayCircle, count: '120+ Hours' },
      ]
    },
    bank: {
      title: 'Bank Job Mastery',
      description: 'Focused preparation for Govt and Private Bank recruitment exams.',
      modules: [
        { title: 'Math Shortcuts', icon: FileText, count: '20 Topics' },
        { title: 'English Grammar', icon: CheckCircle2, count: 'Full Course' },
        { title: 'Focus Writing', icon: Download, count: '50 Samples' },
        { title: 'Mock Tests', icon: PlayCircle, count: '25 Exams' },
      ]
    }
  };

  return (
    <section id="prep" className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4 uppercase tracking-widest border border-primary/20">
            <Sparkles className="w-4 h-4" />
            <span>Learning Paths</span>
          </div>
          <h2 className="text-4xl font-bold mb-4">{t('prep.title')}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Structured learning paths for competitive exams—deep coverage for Bangladesh, with resources relevant wherever you prepare.
          </p>
        </div>

        <Tabs defaultValue="bcs" className="w-full">
          <div className="flex justify-center mb-16">
            <TabsList className="h-auto p-2 bg-muted/50 backdrop-blur-sm rounded-3xl flex-wrap justify-center border border-border/50">
              {categories.map((cat) => (
                <TabsTrigger 
                  key={cat.id} 
                  value={cat.id}
                  className="rounded-2xl px-8 py-4 data-[state=active]:bg-background data-[state=active]:shadow-xl data-[state=active]:text-primary transition-all font-bold text-sm"
                >
                  <cat.icon className="w-5 h-5 mr-3" />
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {Object.entries(content).map(([id, data]) => (
            <TabsContent key={id} value={id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-10"
              >
                {/* Left Side: Info */}
                <div className="lg:col-span-1 space-y-8">
                  <ThreeDCard>
                    <div className="p-10 rounded-[3rem] bg-gradient-to-br from-primary to-primary/80 text-white shadow-2xl shadow-primary/30 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                        <GraduationCap className="w-32 h-32" />
                      </div>
                      <h3 className="text-3xl font-black mb-6 tracking-tight">{data.title}</h3>
                      <p className="text-primary-foreground/90 mb-10 leading-relaxed text-lg">
                        {data.description}
                      </p>
                      <Link href="/prep">
                        <Button variant="secondary" className="w-full h-16 font-black text-lg rounded-2xl shadow-xl hover:scale-105 transition-transform">
                          Start Learning Now
                        </Button>
                      </Link>
                    </div>
                  </ThreeDCard>
                  
                  <ThreeDCard>
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
                      <CardContent className="p-8">
                        <h4 className="font-black mb-6 flex items-center gap-3 text-lg">
                          <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                          Top Mentors
                        </h4>
                        <div className="flex -space-x-4">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="w-14 h-14 rounded-2xl border-4 border-background bg-muted overflow-hidden shadow-lg">
                              <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="Mentor" referrerPolicy="no-referrer" />
                            </div>
                          ))}
                          <div className="w-14 h-14 rounded-2xl border-4 border-background bg-primary text-white flex items-center justify-center text-sm font-black shadow-lg">
                            +12
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-6 font-medium leading-relaxed">
                          Learn from top-ranked BCS cadres and bank officers with years of experience.
                        </p>
                      </CardContent>
                    </Card>
                  </ThreeDCard>
                </div>

                {/* Right Side: Modules */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {data.modules.map((module, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <ThreeDCard className="h-full">
                        <Link href="/prep/1" className="h-full block">
                          <Card className="h-full group hover:border-primary/50 transition-all duration-500 cursor-pointer bg-card/50 backdrop-blur-sm rounded-[2rem] border-border/50">
                            <CardContent className="p-8 flex items-center gap-6">
                              <div className="w-16 h-16 rounded-2xl bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-all duration-500 group-hover:rotate-6">
                                <module.icon className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                              </div>
                              <div>
                                <h4 className="text-xl font-black group-hover:text-primary transition-colors tracking-tight">{module.title}</h4>
                                <p className="text-muted-foreground font-bold text-sm mt-1">{module.count}</p>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </ThreeDCard>
                    </motion.div>
                  ))}
                  
                  {/* Placeholder for more modules */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="sm:col-span-2 p-12 rounded-[3rem] border-4 border-dashed border-border/50 flex flex-col items-center justify-center text-center opacity-40 hover:opacity-100 transition-opacity group cursor-help"
                  >
                    <LayoutGrid className="w-12 h-12 mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <p className="text-xl font-black tracking-tight">More modules coming soon</p>
                    <p className="text-sm font-bold mt-2">We are constantly updating our curriculum</p>
                  </motion.div>
                </div>
              </motion.div>
            </TabsContent>
          ))}
          
          {/* Fallback for other tabs */}
          <TabsContent value="primary">
             <div className="py-24 text-center">
               <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                 <BookOpen className="w-10 h-10 text-muted-foreground" />
               </div>
               <h3 className="text-2xl font-black mb-2">Primary Teachers Prep</h3>
               <p className="text-muted-foreground">Content is being curated by our expert panel...</p>
             </div>
          </TabsContent>
          <TabsContent value="railway">
             <div className="py-24 text-center">
               <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                 <Train className="w-10 h-10 text-muted-foreground" />
               </div>
               <h3 className="text-2xl font-black mb-2">Railway Jobs Prep</h3>
               <p className="text-muted-foreground">Stay tuned for specialized railway exam modules...</p>
             </div>
          </TabsContent>
          <TabsContent value="others">
             <div className="py-24 text-center">
               <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                 <LayoutGrid className="w-10 h-10 text-muted-foreground" />
               </div>
               <h3 className="text-2xl font-black mb-2">Other Govt Jobs</h3>
               <p className="text-muted-foreground">We are expanding our coverage to all govt sectors...</p>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default PreparationSection;
