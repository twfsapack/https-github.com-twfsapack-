import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { ExternalLink, Briefcase, FolderGit2, GraduationCap, Loader2 } from 'lucide-react';
import { FaGithub, FaLinkedin, FaGlobe, FaTelegramPlane, FaSkype, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { Profile as ProfileType, Experience as ExperienceType, Project as ProjectType, Skill as SkillType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export const Portfolio: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { t } = useLanguage();

  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [experiences, setExperiences] = useState<ExperienceType[]>([]);
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [skills, setSkills] = useState<SkillType[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        setError(t('userNotFound'));
        setLoading(false);
        return;
      }

      try {
        const profileSnap = await getDoc(doc(db, 'profiles', userId));
        if (profileSnap.exists()) {
          setProfile({ id: profileSnap.id, ...profileSnap.data() } as unknown as ProfileType);
        } else {
          setError(t('profileNotFound'));
          setLoading(false);
          return;
        }

        const expSnap = await getDocs(collection(db, `profiles/${userId}/experiences`));
        setExperiences(expSnap.docs.map(d => ({ id: d.id, ...d.data() } as ExperienceType)).sort((a, b) => (b.order || 0) - (a.order || 0)));

        const projSnap = await getDocs(collection(db, `profiles/${userId}/projects`));
        setProjects(projSnap.docs.map(d => ({ id: d.id, ...d.data() } as ProjectType)).sort((a, b) => (b.order || 0) - (a.order || 0)));

        const skillSnap = await getDocs(collection(db, `profiles/${userId}/skills`));
        setSkills(skillSnap.docs.map(d => ({ id: d.id, ...d.data() } as SkillType)));
      } catch (err) {
        console.error("Error fetching Portfolio data:", err);
        setError(t('errorLoadingPortfolio'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 text-center max-w-md w-full">
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">{t('oops')}</h2>
          <p className="text-zinc-600">{error || t('errorLoadingProfile')}</p>
        </div>
      </div>
    );
  }

  const socialIcons = {
    github: <FaGithub className="w-5 h-5" />,
    linkedin: <FaLinkedin className="w-5 h-5" />,
    twitter: <FaXTwitter className="w-5 h-5" />,
    website: <FaGlobe className="w-5 h-5" />,
    telegram: <FaTelegramPlane className="w-5 h-5" />,
    skype: <FaSkype className="w-5 h-5" />,
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header / Hero Section */}
      <header className="bg-white border-b border-zinc-200 pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
          {profile.avatarUrl ? (
            <img 
              src={profile.avatarUrl} 
              alt={profile.fullName} 
              className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover shadow-xl ring-4 ring-white"
            />
          ) : (
            <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-5xl font-bold shadow-xl ring-4 ring-white">
              {profile.fullName?.charAt(0) || 'U'}
            </div>
          )}
          
          <div className="flex-1 text-center md:text-left min-w-0 w-full">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-zinc-900 tracking-tight mb-3 truncate" title={profile.fullName || t('yourName')}>
              {profile.fullName || t('yourName')}
            </h1>
            <h2 className="text-xl md:text-2xl text-indigo-600 font-medium mb-6 truncate" title={profile.title || t('yourTitle')}>
              {profile.title || t('yourTitle')}
            </h2>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 text-sm text-zinc-600 mb-8">
              {profile.email && (
                <a href={`mailto:${profile.email}`} className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
                  <FaEnvelope className="w-4 h-4" /> {profile.email}
                </a>
              )}
              {profile.phone && (
                <a href={`tel:${profile.phone}`} className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
                  <FaPhoneAlt className="w-4 h-4" /> {profile.phone}
                </a>
              )}
              {profile.location && (
                <span className="flex items-center gap-2">
                  <FaMapMarkerAlt className="w-4 h-4" /> {profile.location}
                </span>
              )}
            </div>

            {profile.socialLinks && Object.values(profile.socialLinks).some(link => link) && (
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                {Object.entries(profile.socialLinks).map(([network, url]) => {
                  if (!url) return null;
                  return (
                    <a 
                      key={network} 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-2.5 bg-zinc-100 text-zinc-600 hover:bg-indigo-600 hover:text-white rounded-full transition-all duration-200"
                      aria-label={network}
                    >
                      {socialIcons[network as keyof typeof socialIcons] || <ExternalLink className="w-5 h-5" />}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-24">
        
        {/* Bio Section */}
        {profile.bio && (
          <section className="max-w-3xl">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6">{t('aboutMe')}</h3>
            <p className="text-lg md:text-xl text-zinc-700 leading-relaxed whitespace-pre-wrap">
              {profile.bio}
            </p>
          </section>
        )}

        {/* Experience Section */}
        {experiences.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-10">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900">{t('professionalExperience')}</h3>
            </div>
            
            <div className="space-y-12">
              {experiences.map((exp, index) => (
                <div key={exp.id} className="relative pl-8 md:pl-0">
                  {/* Timeline Line for Mobile */}
                  <div className="md:hidden absolute left-0 top-2 bottom-[-3rem] w-px bg-zinc-200 last:hidden"></div>
                  <div className="md:hidden absolute left-[-4px] top-2 w-2 h-2 rounded-full bg-indigo-600 ring-4 ring-zinc-50"></div>

                  <div className="md:grid md:grid-cols-4 md:gap-8 items-start">
                    <div className="md:col-span-1 mb-2 md:mb-0 md:text-right pt-1">
                      <span className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
                        {exp.startDate} — {exp.current ? t('present') : exp.endDate}
                      </span>
                    </div>
                    <div className="md:col-span-3 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-zinc-100 hover:shadow-md transition-shadow">
                      <h4 className="text-xl font-bold text-zinc-900 mb-1">{exp.role}</h4>
                      <div className="text-indigo-600 font-medium mb-4">
                        {exp.company} {exp.location && <span className="text-zinc-400 font-normal"> • {exp.location}</span>}
                      </div>
                      {exp.description && (
                        <p className="text-zinc-600 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects Section */}
        {projects.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-10">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                <FolderGit2 className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900">{t('featuredProjects')}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(proj => (
                <div key={proj.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-zinc-200 hover:shadow-lg transition-all duration-300 group flex flex-col">
                  {proj.imageUrl ? (
                    <div className="aspect-video w-full overflow-hidden bg-zinc-100">
                      <img 
                        src={proj.imageUrl} 
                        alt={proj.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video w-full bg-zinc-100 flex items-center justify-center text-zinc-300 group-hover:bg-indigo-50 transition-colors duration-500">
                      <FolderGit2 className="w-12 h-12" />
                    </div>
                  )}
                  <div className="p-6 flex-1 flex flex-col">
                    <h4 className="text-lg font-bold text-zinc-900 mb-2 group-hover:text-indigo-600 transition-colors">{proj.name}</h4>
                    {proj.role && <p className="text-sm font-medium text-indigo-600 mb-3">{proj.role}</p>}
                    <p className="text-sm text-zinc-600 line-clamp-3 mb-4 flex-1">{proj.description}</p>
                    
                    {proj.url && (
                      <a 
                        href={proj.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 hover:text-indigo-600 transition-colors mt-auto"
                      >
                        {t('viewProject')} <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills Section */}
        {skills.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-10">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900">{t('skills')}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {['technical', 'soft', 'tools'].map(category => {
                const catSkills = skills.filter(s => s.category === category);
                if (catSkills.length === 0) return null;
                
                const catNames = {
                  technical: t('exp.cat.tech'),
                  soft: t('exp.cat.soft'),
                  tools: t('exp.cat.tools')
                };

                return (
                  <div key={category} className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
                    <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-6">{catNames[category as keyof typeof catNames]}</h4>
                    <div className="flex flex-wrap gap-2">
                      {catSkills.map(skill => (
                        <span 
                          key={skill.id} 
                          className="px-3 py-1.5 bg-zinc-100 text-zinc-700 rounded-lg text-sm font-medium hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-200 py-12 mt-12">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-zinc-500 text-sm">
            © {new Date().getFullYear()} {profile.fullName}. {t('allRightsReserved')}
          </p>
        </div>
      </footer>
    </div>
  );
};
