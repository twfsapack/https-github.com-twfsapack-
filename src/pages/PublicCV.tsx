import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { Mail, Phone, MapPin, Download, Loader2 } from 'lucide-react';
import { Profile as ProfileType, Experience as ExperienceType, Project as ProjectType, Skill as SkillType } from '../types';
import { useReactToPrint } from 'react-to-print';

export const PublicCV: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [experiences, setExperiences] = useState<ExperienceType[]>([]);
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [skills, setSkills] = useState<SkillType[]>([]);

  const cvRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: cvRef,
    documentTitle: profile ? `CV_${profile.fullName?.replace(/\s+/g, '_')}` : 'CV',
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        setError("Usuario no encontrado");
        setLoading(false);
        return;
      }

      try {
        const profileSnap = await getDoc(doc(db, 'profiles', userId));
        if (profileSnap.exists()) {
          setProfile({ id: profileSnap.id, ...profileSnap.data() } as ProfileType);
        } else {
          setError("Perfil no encontrado");
          setLoading(false);
          return;
        }

        const expSnap = await getDocs(collection(db, `profiles/${userId}/experiences`));
        setExperiences(expSnap.docs.map(d => ({ id: d.id, ...d.data() } as ExperienceType)));

        const projSnap = await getDocs(collection(db, `profiles/${userId}/projects`));
        setProjects(projSnap.docs.map(d => ({ id: d.id, ...d.data() } as ProjectType)));

        const skillSnap = await getDocs(collection(db, `profiles/${userId}/skills`));
        setSkills(skillSnap.docs.map(d => ({ id: d.id, ...d.data() } as SkillType)));
      } catch (err) {
        console.error("Error fetching CV data:", err);
        setError("Error al cargar el CV");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Oops!</h2>
          <p className="text-zinc-600">{error || "No se pudo cargar el perfil"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 py-8 px-4 sm:px-8 flex flex-col items-center">
      {profile.allowPdfDownload && (
        <div className="w-full max-w-[210mm] flex justify-end mb-4">
          <button
            onClick={() => handlePrint()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" /> Descargar PDF
          </button>
        </div>
      )}

      {/* Actual CV Document */}
      <div 
        ref={cvRef}
        className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-xl p-8 sm:p-12 text-zinc-900 font-sans mx-auto"
        style={{
          boxSizing: 'border-box'
        }}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-zinc-200 pb-8 mb-8">
          {profile.avatarUrl && (
            <img 
              src={profile.avatarUrl} 
              alt={profile.fullName} 
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-zinc-100"
            />
          )}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-2">{profile.fullName || 'Tu Nombre'}</h1>
            <h2 className="text-xl text-indigo-600 font-medium mb-4">{profile.title || 'Tu Cargo'}</h2>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-zinc-600">
              {profile.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4" /> {profile.email}
                </div>
              )}
              {profile.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4" /> {profile.phone}
                </div>
              )}
              {profile.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> {profile.location}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-zinc-900 uppercase tracking-wider mb-3 border-b border-zinc-200 pb-2">Perfil Profesional</h3>
            <p className="text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap">{profile.bio}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column (Main Content) */}
          <div className="md:col-span-2 space-y-8">
            {/* Experience */}
            {experiences.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-zinc-900 uppercase tracking-wider mb-4 border-b border-zinc-200 pb-2">Experiencia</h3>
                <div className="space-y-6">
                  {experiences.map(exp => (
                    <div key={exp.id}>
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="text-base font-bold text-zinc-900">{exp.role}</h4>
                        <span className="text-sm font-medium text-indigo-600 whitespace-nowrap ml-4">
                          {exp.startDate} - {exp.current ? 'Presente' : exp.endDate}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-zinc-700 mb-2">
                        {exp.company} {exp.location && <span className="text-zinc-500 font-normal">| {exp.location}</span>}
                      </div>
                      {exp.description && (
                        <p className="text-sm text-zinc-600 whitespace-pre-wrap leading-relaxed">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {projects.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-zinc-900 uppercase tracking-wider mb-4 border-b border-zinc-200 pb-2">Proyectos</h3>
                <div className="space-y-6">
                  {projects.map(proj => (
                    <div key={proj.id}>
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="text-base font-bold text-zinc-900">{proj.name}</h4>
                        {proj.url && (
                          <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline ml-4">
                            Ver Proyecto
                          </a>
                        )}
                      </div>
                      {proj.role && (
                        <div className="text-sm font-medium text-zinc-700 mb-2">
                          {proj.role}
                        </div>
                      )}
                      <p className="text-sm text-zinc-600 whitespace-pre-wrap leading-relaxed">{proj.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column (Sidebar) */}
          <div className="space-y-8">
            {/* Skills */}
            {skills.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-zinc-900 uppercase tracking-wider mb-4 border-b border-zinc-200 pb-2">Habilidades</h3>
                
                {['technical', 'soft', 'tools'].map(category => {
                  const catSkills = skills.filter(s => s.category === category);
                  if (catSkills.length === 0) return null;
                  
                  const catNames = {
                    technical: 'Técnicas',
                    soft: 'Blandas',
                    tools: 'Herramientas'
                  };

                  return (
                    <div key={category} className="mb-4 last:mb-0">
                      <h4 className="text-sm font-bold text-zinc-800 mb-2">{catNames[category as keyof typeof catNames]}</h4>
                      <ul className="list-disc list-inside text-sm text-zinc-600 space-y-1">
                        {catSkills.map(skill => (
                          <li key={skill.id}>{skill.name}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Social Links */}
            {profile.socialLinks && Object.values(profile.socialLinks).some(link => link) && (
              <div>
                <h3 className="text-lg font-bold text-zinc-900 uppercase tracking-wider mb-4 border-b border-zinc-200 pb-2">Enlaces</h3>
                <ul className="space-y-2 text-sm text-zinc-600">
                  {Object.entries(profile.socialLinks).map(([network, url]) => {
                    if (!url) return null;
                    return (
                      <li key={network} className="flex items-center gap-2">
                        <span className="capitalize font-medium text-zinc-800">{network}:</span>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate">
                          {url.replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
