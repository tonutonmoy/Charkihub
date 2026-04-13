import type { CVData } from '../types';
import { getCvLabels, cvTemplateFontClass } from '../labels';
import { cn } from '@/lib/utils';

export function AcademicTemplate({ data }: { data: CVData }) {
  const p = data.personalInfo;
  const L = getCvLabels(data.language);
  return (
    <div
      lang={data.language}
      className={cn(
        'p-10 bg-white text-black font-serif min-h-[1100px] shadow-sm print:shadow-none text-[13px] leading-relaxed',
        cvTemplateFontClass(data.language)
      )}
    >
      <div className="flex flex-col sm:flex-row gap-4 items-start border-b-2 border-black pb-4 mb-6">
        <div className="flex-1 text-center sm:text-left min-w-0 order-2 sm:order-1">
          <h1 className="text-2xl font-bold uppercase tracking-wide">{p.fullName}</h1>
          <p className="mt-2">{p.address}</p>
          <p>
            {L.email}: {p.email} | {L.phone}: {p.phone}
          </p>
        </div>
        {data.photoDataUrl ? (
          <div className="shrink-0 w-[100px] h-[125px] border border-black overflow-hidden mx-auto sm:ml-auto order-1 sm:order-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.photoDataUrl} alt="" className="w-full h-full object-cover" width={100} height={125} />
          </div>
        ) : null}
      </div>

      <section className="mb-6">
        <h2 className="font-bold border-b border-black mb-2 uppercase text-sm">{L.researchInterests}</h2>
        <p className="text-justify">{p.researchInterests || '—'}</p>
      </section>

      <section className="mb-6">
        <h2 className="font-bold border-b border-black mb-2 uppercase text-sm">{L.careerObjective}</h2>
        <p className="text-justify">{p.objective}</p>
      </section>

      <section className="mb-6">
        <h2 className="font-bold border-b border-black mb-3 uppercase text-sm">{L.education}</h2>
        <table className="w-full border-collapse border border-black">
          <thead>
            <tr className="bg-neutral-100">
              <th className="border border-black p-1.5 text-left">{L.degreeExam}</th>
              <th className="border border-black p-1.5 text-left">{L.institution}</th>
              <th className="border border-black p-1.5">{L.year}</th>
              <th className="border border-black p-1.5">{L.result}</th>
            </tr>
          </thead>
          <tbody>
            {data.education.map((e) => (
              <tr key={e.id}>
                <td className="border border-black p-1.5">{e.degree}</td>
                <td className="border border-black p-1.5">{e.institution}</td>
                <td className="border border-black p-1.5 text-center">{e.year}</td>
                <td className="border border-black p-1.5 text-center">{e.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-6">
        <h2 className="font-bold border-b border-black mb-3 uppercase text-sm">{L.publications}</h2>
        <table className="w-full border-collapse border border-black">
          <thead>
            <tr className="bg-neutral-100">
              <th className="border border-black p-1.5 text-left">{L.publicationTitle}</th>
              <th className="border border-black p-1.5 text-left">{L.journalMedium}</th>
              <th className="border border-black p-1.5">{L.year}</th>
            </tr>
          </thead>
          <tbody>
            {data.publications.map((pub) => (
              <tr key={pub.id}>
                <td className="border border-black p-1.5">{pub.title}</td>
                <td className="border border-black p-1.5">{pub.journal}</td>
                <td className="border border-black p-1.5 text-center">{pub.year}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-6">
        <h2 className="font-bold border-b border-black mb-3 uppercase text-sm">{L.trainingWorkshops}</h2>
        <ul className="list-disc pl-5 space-y-1">
          {data.training.map((t) => (
            <li key={t.id}>
              <span className="font-semibold">{t.name}</span> — {t.institution} ({t.year})
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="font-bold border-b border-black mb-3 uppercase text-sm">{L.workExperience}</h2>
        <div className="space-y-3">
          {data.experience.map((exp) => (
            <div key={exp.id}>
              <p className="font-semibold">
                {exp.title}, {exp.company}{' '}
                <span className="font-normal">({exp.duration})</span>
              </p>
              <p className="text-justify pl-2">{exp.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="font-bold border-b border-black mb-2 uppercase text-sm">{L.skills}</h2>
        <p>{data.skills.join(', ')}</p>
      </section>

      <section>
        <h2 className="font-bold border-b border-black mb-3 uppercase text-sm">{L.references}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.references.map((ref) => (
            <div key={ref.id}>
              <p className="font-bold">{ref.name}</p>
              <p>
                {ref.designation}, {ref.organization}
              </p>
              <p>{ref.contact}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
