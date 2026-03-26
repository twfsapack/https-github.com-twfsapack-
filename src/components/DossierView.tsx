import React from 'react';
import { ExternalLink } from 'lucide-react';
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaLinkedin, FaGithub, FaGlobe, FaTelegramPlane, FaSkype } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { Profile, Experience, Project, Skill, Certificate } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface DossierViewProps {
  profile: Profile;
  experiences: Experience[];
  projects: Project[];
  skills: Skill[];
  certificates?: Certificate[];
  isPrint?: boolean;
}

const ElegantSeparator = () => (
  <div className="flex items-center justify-center my-10 opacity-80">
    <div className="h-px bg-zinc-300 flex-1 max-w-[120px]"></div>
    <div className="mx-6 text-zinc-400 text-lg">♦</div>
    <div className="h-px bg-zinc-300 flex-1 max-w-[120px]"></div>
  </div>
);

export const DossierView: React.FC<DossierViewProps> = ({ profile, experiences, projects, skills, certificates = [], isPrint = false }) => {
  const { t } = useLanguage();

  return (
    <div 
      className={`bg-white text-zinc-900 font-sans mx-auto ${
        isPrint 
          ? 'w-[210mm] min-h-[297mm] p-[20mm]' 
          : 'w-full max-w-[210mm] h-[800px] overflow-y-auto p-8 sm:p-12 rounded-xl shadow-2xl relative'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-8">
        {profile.avatarUrl && (
          <img 
            src={profile.avatarUrl} 
            alt={profile.fullName} 
            className="w-32 h-32 rounded-full object-cover border-4 border-zinc-50 shadow-md mb-6" 
          />
        )}
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-zinc-900 mb-3 tracking-tight">
          {profile.fullName || t('yourName')}
        </h1>
        <h2 className="text-xl font-serif italic text-zinc-600 mb-6">
          {profile.title || t('yourTitle')}
        </h2>
        
        {profile.bio && (
          <p className="text-sm sm:text-base text-zinc-700 max-w-2xl mx-auto leading-relaxed mb-8">
            {profile.bio}
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-5 text-sm text-zinc-600 font-medium">
          {profile.email && <span className="flex items-center gap-1.5"><FaEnvelope className="w-4 h-4"/> {profile.email}</span>}
          {profile.phone && <span className="flex items-center gap-1.5"><FaPhoneAlt className="w-4 h-4"/> {profile.phone}</span>}
          {profile.location && <span className="flex items-center gap-1.5"><FaMapMarkerAlt className="w-4 h-4"/> {profile.location}</span>}
        </div>

        {profile.socialLinks && Object.values(profile.socialLinks).some(link => link) && (
          <div className="flex flex-wrap justify-center gap-6 mt-6 text-sm">
            {Object.entries(profile.socialLinks).map(([network, url]) => {
              if (!url) return null;
              
              let Icon = null;
              switch (network) {
                case 'linkedin': Icon = FaLinkedin; break;
                case 'github': Icon = FaGithub; break;
                case 'twitter': Icon = FaXTwitter; break;
                case 'website': Icon = FaGlobe; break;
                case 'telegram': Icon = FaTelegramPlane; break;
                case 'skype': Icon = FaSkype; break;
              }

              return (
                <a key={network} href={url as string} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 transition-colors uppercase tracking-wider text-xs font-bold">
                  {Icon && <Icon className="w-4 h-4" />}
                  {network}
                </a>
              );
            })}
          </div>
        )}
      </div>

      {experiences.length > 0 && (
        <>
          <ElegantSeparator />
          <div className="mb-8">
            <h3 className="text-2xl font-serif text-zinc-900 uppercase tracking-widest mb-8 text-center">{t('professionalExperience')}</h3>
            <div className="space-y-10">
              {experiences.map(exp => (
                <div key={exp.id} className="relative">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-4 border-b border-zinc-200 pb-2">
                    <h4 className="text-lg font-bold text-zinc-900 uppercase tracking-wide">{exp.role}</h4>
                    <span className="text-sm font-serif italic text-zinc-500 mt-1 sm:mt-0">
                      {exp.startDate} - {exp.current ? t('present') : exp.endDate}
                    </span>
                  </div>
                  <div className="text-sm text-zinc-700 space-y-3">
                    <p><span className="font-bold text-zinc-900 uppercase text-xs tracking-wider mr-2">{t('company')}:</span> {exp.company}</p>
                    {exp.location && <p><span className="font-bold text-zinc-900 uppercase text-xs tracking-wider mr-2">{t('location')}:</span> {exp.location}</p>}
                    {exp.description && (
                      <div className="mt-4">
                        <span className="font-bold text-zinc-900 uppercase text-xs tracking-wider block mb-1.5">{t('description')}:</span>
                        <p className="whitespace-pre-wrap leading-relaxed">{exp.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {projects.length > 0 && (
        <>
          <ElegantSeparator />
          <div className="mb-8">
            <h3 className="text-2xl font-serif text-zinc-900 uppercase tracking-widest mb-8 text-center">{t('featuredProjects')}</h3>
            <div className="space-y-12">
              {projects.map(proj => (
                <div key={proj.id}>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-4 border-b border-zinc-200 pb-2">
                    <h4 className="text-lg font-bold text-zinc-900 uppercase tracking-wide">{proj.name}</h4>
                    {proj.url && (
                      <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-sm font-serif italic text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-1 sm:mt-0">
                        {t('viewProject')} <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="text-sm text-zinc-700 space-y-3 mb-5">
                    {proj.role && <p><span className="font-bold text-zinc-900 uppercase text-xs tracking-wider mr-2">{t('role')}:</span> {proj.role}</p>}
                    {proj.description && (
                      <div className="mt-4">
                        <span className="font-bold text-zinc-900 uppercase text-xs tracking-wider block mb-1.5">{t('description')}:</span>
                        <p className="whitespace-pre-wrap leading-relaxed">{proj.description}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Project Images */}
                  {(proj.imageUrls && proj.imageUrls.length > 0) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                      {proj.imageUrls.map((url, idx) => (
                        <img key={idx} src={url} alt={`${proj.name} - ${idx}`} className="w-full h-48 object-cover rounded shadow-sm border border-zinc-100" />
                      ))}
                    </div>
                  ) : proj.imageUrl ? (
                    <img src={proj.imageUrl} alt={proj.name} className="w-full h-56 object-cover rounded shadow-sm border border-zinc-100 mt-6" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {skills.length > 0 && (
        <>
          <ElegantSeparator />
          <div className="mb-8">
            <h3 className="text-2xl font-serif text-zinc-900 uppercase tracking-widest mb-8 text-center">{t('skills')}</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {['technical', 'soft', 'tools'].map(category => {
                const catSkills = skills.filter(s => s.category === category);
                if (catSkills.length === 0) return null;
                
                const catNames = {
                  technical: t('exp.cat.tech'),
                  soft: t('exp.cat.soft'),
                  tools: t('exp.cat.tools')
                };

                return (
                  <div key={category} className="text-center sm:text-left">
                    <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-widest mb-4 border-b border-zinc-200 pb-2 inline-block sm:block">{catNames[category as keyof typeof catNames]}</h4>
                    <ul className="flex flex-wrap justify-center sm:justify-start gap-2">
                      {catSkills.map(skill => (
                        <li key={skill.id} className="text-sm text-zinc-700 bg-zinc-50 px-3 py-1.5 rounded-md border border-zinc-200">
                          {skill.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {certificates.length > 0 && (
        <>
          <ElegantSeparator />
          <div className="mb-8">
            <h3 className="text-2xl font-serif text-zinc-900 uppercase tracking-widest mb-8 text-center">{t('certificates')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {certificates.map(cert => (
                <div key={cert.id} className="flex gap-4 p-4 border border-zinc-200 rounded-lg bg-zinc-50/50">
                  {cert.imageUrl && (
                    <img 
                      src={cert.imageUrl} 
                      alt={cert.name} 
                      className="w-20 h-20 object-cover rounded shadow-sm border border-zinc-200 flex-shrink-0"
                    />
                  )}
                  <div className="flex flex-col justify-center">
                    <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">{cert.name}</h4>
                    <p className="text-sm font-serif italic text-zinc-600 mt-1">{cert.issuer}</p>
                    {cert.date && <p className="text-xs text-zinc-500 mt-1">{cert.date}</p>}
                    {cert.url && (
                      <a href={cert.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 mt-2 uppercase tracking-wider">
                        {t('viewCredential')} <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
