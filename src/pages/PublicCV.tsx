import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { Download, Loader2 } from 'lucide-react';
import { Profile as ProfileType, Experience as ExperienceType, Project as ProjectType, Skill as SkillType, Certificate as CertificateType } from '../types';
import { useReactToPrint } from 'react-to-print';
import { DossierView } from '../components/DossierView';
import { useLanguage } from '../contexts/LanguageContext';

export const PublicCV: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { t } = useLanguage();

  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [experiences, setExperiences] = useState<ExperienceType[]>([]);
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [skills, setSkills] = useState<SkillType[]>([]);
  const [certificates, setCertificates] = useState<CertificateType[]>([]);

  const cvRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: cvRef,
    documentTitle: profile ? `CV_${profile.fullName?.replace(/\s+/g, '_')}` : 'CV',
  });

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
        setExperiences(expSnap.docs.map(d => ({ id: d.id, ...d.data() } as ExperienceType)));

        const projSnap = await getDocs(collection(db, `profiles/${userId}/projects`));
        setProjects(projSnap.docs.map(d => ({ id: d.id, ...d.data() } as ProjectType)));

        const skillSnap = await getDocs(collection(db, `profiles/${userId}/skills`));
        setSkills(skillSnap.docs.map(d => ({ id: d.id, ...d.data() } as SkillType)));

        const certSnap = await getDocs(collection(db, `profiles/${userId}/certificates`));
        setCertificates(certSnap.docs.map(d => ({ id: d.id, ...d.data() } as CertificateType)));
      } catch (err) {
        console.error("Error fetching CV data:", err);
        setError(t('errorLoadingCV'));
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
          <h2 className="text-xl font-bold text-zinc-900 mb-2">{t('oops')}</h2>
          <p className="text-zinc-600">{error || t('errorLoadingProfile')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 py-8 px-4 sm:px-8 flex flex-col items-center relative overflow-hidden">
      {profile.allowPdfDownload && (
        <div className="w-full max-w-[210mm] flex justify-end mb-4 z-10">
          <button
            onClick={() => handlePrint()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" /> {t('downloadPDF')}
          </button>
        </div>
      )}

      {/* Dossier View */}
      <DossierView 
        profile={profile}
        experiences={experiences}
        projects={projects}
        skills={skills}
        certificates={certificates}
      />

      {/* Hidden CV for PDF Download */}
      <div className="absolute top-[-9999px] left-[-9999px] opacity-0 pointer-events-none">
        <div ref={cvRef}>
          <DossierView 
            profile={profile}
            experiences={experiences}
            projects={projects}
            skills={skills}
            certificates={certificates}
            isPrint={true}
          />
        </div>
      </div>
    </div>
  );
};
