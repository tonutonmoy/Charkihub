import type { CVData } from '../types';
import { getCvLabels, cvTemplateFontClass } from '../labels';
import { cn } from '@/lib/utils';

export function ProfessionalCompactTemplate({ data }: { data: CVData }) {
  const p = data.personalInfo;
  const L = getCvLabels(data.language);
  return (
    <div
      lang={data.language}
      className={cn(
        'min-h-[1100px] bg-white text-black font-sans text-[12px] shadow-sm print:shadow-none',
        cvTemplateFontClass(data.language)
      )}
    >
      <div className="bg-slate-900 text-white px-8 py-6 print:bg-black">
        <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
          {data.photoDataUrl ? (
            <div className="shrink-0 w-24 h-28 border-2 border-white/30 overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.photoDataUrl} alt="" className="w-full h-full object-cover" width={96} height={112} />
            </div>
          ) : null}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h1 className="text-2xl font-bold tracking-tight">{p.fullName}</h1>
            <p className="mt-1 opacity-90">
              {p.phone} | {p.email}
            </p>
            <p className="opacity-90 text-[11px] mt-1">{p.address}</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-5">
        <section>
          <h2 className="text-sm font-black uppercase border-b-2 border-slate-900 mb-2 pb-1">{L.personalInformation}</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-slate-600">{L.permanentAddress}</span>
            <span>{p.permanentAddress}</span>
            <span className="text-slate-600">{L.father}</span>
            <span>{p.fatherName}</span>
            <span className="text-slate-600">{L.mother}</span>
            <span>{p.motherName}</span>
            <span className="text-slate-600">{L.dateOfBirth}</span>
            <span>{p.dateOfBirth}</span>
            <span className="text-slate-600">{L.nationalityReligionGender}</span>
            <span>
              {p.nationality}, {p.religion}, {p.gender}
            </span>
            <span className="text-slate-600">{L.maritalStatus}</span>
            <span>{p.maritalStatus}</span>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-black uppercase border-b-2 border-slate-900 mb-2 pb-1">{L.objective}</h2>
          <p className="text-justify leading-snug">{p.objective}</p>
        </section>

        <section>
          <h2 className="text-sm font-black uppercase border-b-2 border-slate-900 mb-2 pb-1">{L.education}</h2>
          <table className="w-full border border-slate-300 text-[11px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-1 text-left">{L.exam}</th>
                <th className="border border-slate-300 p-1 text-left">{L.boardUniversity}</th>
                <th className="border border-slate-300 p-1">{L.year}</th>
                <th className="border border-slate-300 p-1">{L.result}</th>
              </tr>
            </thead>
            <tbody>
              {data.education.map((e) => (
                <tr key={e.id}>
                  <td className="border border-slate-300 p-1">{e.degree}</td>
                  <td className="border border-slate-300 p-1">{e.institution}</td>
                  <td className="border border-slate-300 p-1 text-center">{e.year}</td>
                  <td className="border border-slate-300 p-1 text-center">{e.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-sm font-black uppercase border-b-2 border-slate-900 mb-2 pb-1">{L.experience}</h2>
          <ul className="space-y-2">
            {data.experience.map((exp) => (
              <li key={exp.id}>
                <span className="font-semibold">{exp.title}</span> — {exp.company} ({exp.duration})
                <p className="text-justify text-slate-700 pl-2 border-l-2 border-slate-200 mt-0.5">{exp.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-black uppercase border-b-2 border-slate-900 mb-2 pb-1">{L.skills}</h2>
          <p>{data.skills.join(' · ')}</p>
        </section>

        <section>
          <h2 className="text-sm font-black uppercase border-b-2 border-slate-900 mb-2 pb-1">{L.references}</h2>
          <div className="grid grid-cols-2 gap-4">
            {data.references.map((ref) => (
              <div key={ref.id}>
                <p className="font-semibold">{ref.name}</p>
                <p className="text-slate-700">
                  {ref.designation}, {ref.organization}
                </p>
                <p>{ref.contact}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
