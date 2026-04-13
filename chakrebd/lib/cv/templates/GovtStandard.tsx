import type { CVData } from '../types';
import { getCvLabels, cvTemplateFontClass } from '../labels';
import { cn } from '@/lib/utils';

export function GovtStandardTemplate({ data }: { data: CVData }) {
  const p = data.personalInfo;
  const L = getCvLabels(data.language);
  return (
    <div
      lang={data.language}
      className={cn(
        'p-12 bg-white text-black font-serif min-h-[1100px] shadow-sm print:shadow-none',
        cvTemplateFontClass(data.language)
      )}
    >
      <div className="flex flex-col sm:flex-row gap-6 items-start border-b-2 border-black pb-6 mb-8">
        {data.photoDataUrl ? (
          <div className="shrink-0 w-[120px] h-[150px] border-2 border-black overflow-hidden mx-auto sm:mx-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.photoDataUrl} alt="" className="w-full h-full object-cover" width={120} height={150} />
          </div>
        ) : null}
        <div className="flex-1 text-center sm:text-left min-w-0">
          <h1 className="text-3xl font-bold uppercase mb-2">{p.fullName}</h1>
          <p className="text-sm">{p.address}</p>
          <p className="text-sm">
            {L.email}: {p.email} | {L.mobile}: {p.phone}
          </p>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="text-xl font-bold border-b border-black mb-4 uppercase">{L.careerObjective}</h2>
        <p className="text-sm leading-relaxed text-justify">{p.objective}</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold border-b border-black mb-4 uppercase">{L.personalInformation}</h2>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div className="font-bold">{L.mailingAddress}:</div>
          <div>{p.address}</div>
          <div className="font-bold">{L.permanentAddress}:</div>
          <div>{p.permanentAddress}</div>
          <div className="font-bold">{L.fatherName}:</div>
          <div>{p.fatherName}</div>
          <div className="font-bold">{L.motherName}:</div>
          <div>{p.motherName}</div>
          <div className="font-bold">{L.dateOfBirth}:</div>
          <div>{p.dateOfBirth}</div>
          <div className="font-bold">{L.nationality}:</div>
          <div>{p.nationality}</div>
          <div className="font-bold">{L.religion}:</div>
          <div>{p.religion}</div>
          <div className="font-bold">{L.gender}:</div>
          <div>{p.gender}</div>
          <div className="font-bold">{L.maritalStatus}:</div>
          <div>{p.maritalStatus}</div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold border-b border-black mb-4 uppercase">{L.education}</h2>
        <table className="w-full border-collapse border border-black text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2">{L.degreeExam}</th>
              <th className="border border-black p-2">{L.institution}</th>
              <th className="border border-black p-2">{L.passYear}</th>
              <th className="border border-black p-2">{L.resultDivision}</th>
            </tr>
          </thead>
          <tbody>
            {data.education.map((edu) => (
              <tr key={edu.id}>
                <td className="border border-black p-2">{edu.degree}</td>
                <td className="border border-black p-2">{edu.institution}</td>
                <td className="border border-black p-2 text-center">{edu.year}</td>
                <td className="border border-black p-2 text-center">{edu.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold border-b border-black mb-4 uppercase">{L.experience}</h2>
        <div className="space-y-4">
          {data.experience.map((exp) => (
            <div key={exp.id}>
              <div className="flex justify-between font-bold text-sm gap-2">
                <span>
                  {exp.title} — {exp.company}
                </span>
                <span className="shrink-0">{exp.duration}</span>
              </div>
              <p className="text-sm mt-1 text-justify">{exp.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold border-b border-black mb-4 uppercase">{L.skills}</h2>
        <p className="text-sm">{data.skills.join(', ')}</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold border-b border-black mb-4 uppercase">{L.references}</h2>
        <div className="grid grid-cols-2 gap-8">
          {data.references.map((ref) => (
            <div key={ref.id} className="text-sm">
              <p className="font-bold">{ref.name}</p>
              <p>{ref.designation}</p>
              <p>{ref.organization}</p>
              <p>
                {L.contact}: {ref.contact}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
