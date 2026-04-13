import { Award, Briefcase, Mail, MapPin, Phone, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { CVData } from '../types';
import { getCvLabels, cvTemplateFontClass } from '../labels';
import { cn } from '@/lib/utils';

export function ModernCorporateTemplate({ data }: { data: CVData }) {
  const p = data.personalInfo;
  const L = getCvLabels(data.language);
  return (
    <div
      lang={data.language}
      className={cn(
        'p-12 bg-white text-slate-800 font-sans min-h-[1100px] shadow-sm print:shadow-none flex gap-10',
        cvTemplateFontClass(data.language)
      )}
    >
      <div className="w-1/3 bg-slate-50 p-8 rounded-3xl print:rounded-none">
        {data.photoDataUrl ? (
          <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-primary/25 mx-auto mb-8 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.photoDataUrl} alt="" className="w-full h-full object-cover" width={144} height={144} />
          </div>
        ) : null}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-2xl font-black text-primary leading-tight mb-2">{p.fullName}</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{L.professionalResume}</p>
        </div>

        <div className="space-y-6">
          <section>
            <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-4">{L.contactSection}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary shrink-0" /> {p.email}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary shrink-0" /> {p.phone}
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" /> {p.address}
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-4">{L.skills}</h3>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="bg-primary/10 text-primary border-none text-[10px] font-bold"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-4">{L.education}</h3>
            <div className="space-y-4">
              {data.education.map((edu) => (
                <div key={edu.id}>
                  <p className="font-bold text-sm">{edu.degree}</p>
                  <p className="text-xs text-muted-foreground">{edu.institution}</p>
                  <p className="text-xs font-bold mt-1">
                    {edu.year} | {edu.result}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <section className="mb-10">
          <h2 className="text-lg font-black mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary shrink-0" /> {L.profile}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground text-justify">{p.objective}</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-black mb-6 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary shrink-0" /> {L.experience}
          </h2>
          <div className="space-y-8">
            {data.experience.map((exp) => (
              <div key={exp.id} className="relative pl-6 border-l-2 border-primary/20">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-white" />
                <div className="flex justify-between mb-1 gap-2">
                  <h3 className="font-bold text-sm">{exp.title}</h3>
                  <span className="text-xs font-bold text-primary shrink-0">{exp.duration}</span>
                </div>
                <p className="text-xs font-bold text-muted-foreground mb-2">{exp.company}</p>
                <p className="text-sm text-muted-foreground leading-relaxed text-justify">{exp.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-black mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary shrink-0" /> {L.references}
          </h2>
          <div className="grid grid-cols-1 gap-6">
            {data.references.map((ref) => (
              <div key={ref.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="font-bold text-sm">{ref.name}</p>
                <p className="text-xs text-muted-foreground">
                  {ref.designation}, {ref.organization}
                </p>
                <p className="text-xs font-bold text-primary mt-1">{ref.contact}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
