import React from 'react';
import { motion } from 'motion/react';
import { FileText, Check, Download, Edit3, Layout, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from './LanguageContext';

const CVBuilder = () => {
  const { t } = useLanguage();

  const features = [
    "Predefined BD Govt Formats",
    "One-click PDF Download",
    "AI-Powered Content Suggestions",
    "Mobile Friendly Editor",
    "Multiple Professional Templates"
  ];

  return (
    <section id="cv" className="py-24 bg-primary/5 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 translate-x-1/2" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Visual Representation */}
          <div className="flex-1 order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Mock CV UI */}
              <div className="bg-background rounded-3xl shadow-2xl border border-border p-8 max-w-md mx-auto relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
                
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-muted" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-3 w-48 bg-muted/50 rounded" />
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="h-3 w-20 bg-primary/20 rounded" />
                    <div className="h-2 w-full bg-muted/30 rounded" />
                    <div className="h-2 w-full bg-muted/30 rounded" />
                    <div className="h-2 w-2/3 bg-muted/30 rounded" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-3 w-24 bg-primary/20 rounded" />
                    <div className="h-2 w-full bg-muted/30 rounded" />
                    <div className="h-2 w-full bg-muted/30 rounded" />
                  </div>
                </div>

                {/* Floating Action Buttons */}
                <div className="absolute bottom-8 right-8 flex flex-col gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center shadow-lg">
                    <Download className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Template Previews */}
              <div className="absolute -bottom-6 -right-6 w-32 h-40 bg-background rounded-xl shadow-xl border border-border p-4 rotate-6 hidden sm:block">
                <Layout className="w-6 h-6 text-muted-foreground mb-2" />
                <div className="space-y-1">
                  <div className="h-1 w-full bg-muted rounded" />
                  <div className="h-1 w-full bg-muted rounded" />
                  <div className="h-1 w-2/3 bg-muted rounded" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Content */}
          <div className="flex-1 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold mb-6 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 fill-secondary" />
              <span>New Feature</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              {t('cv.title')}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Don't let a poorly formatted CV hold you back. Choose international or regional layouts—including official Bangladesh government formats where they apply.
            </p>

            <ul className="space-y-4 mb-10">
              {features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-500" />
                  </div>
                  <span className="font-medium">{feature}</span>
                </li>
              ))}
            </ul>

            <Button size="lg" className="h-14 px-10 text-lg font-bold shadow-xl shadow-primary/20">
              <FileText className="mr-2 w-5 h-5" />
              {t('cv.cta')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CVBuilder;
