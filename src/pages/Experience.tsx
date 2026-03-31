import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, doc, getDocs, getDoc, addDoc, deleteDoc, updateDoc, deleteField } from 'firebase/firestore';
import { Plus, Trash2, Briefcase, FolderGit2, GraduationCap, Loader2, ExternalLink, Image as ImageIcon, X, FileText, Download, ToggleLeft, ToggleRight, Mail, Phone, MapPin, Edit2, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { Experience as ExperienceType, Project as ProjectType, Skill as SkillType, Profile as ProfileType, Certificate as CertificateType, Education as EducationType } from '../types';
import { DossierView } from '../components/DossierView';
import { useLanguage } from '../contexts/LanguageContext';

export const Experience: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'experiences' | 'projects' | 'skills' | 'cv' | 'educations'>('experiences');
  const [cvScale, setCvScale] = useState<number>(1);

  // States for lists
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [experiences, setExperiences] = useState<ExperienceType[]>([]);
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [skills, setSkills] = useState<SkillType[]>([]);
  const [certificates, setCertificates] = useState<CertificateType[]>([]);
  const [educations, setEducations] = useState<EducationType[]>([]);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('center');

  // States for forms
  const [showExpForm, setShowExpForm] = useState(false);
  const [newExp, setNewExp] = useState<Partial<ExperienceType>>({});
  const [editingExpId, setEditingExpId] = useState<string | null>(null);

  const [showProjForm, setShowProjForm] = useState(false);
  const [newProj, setNewProj] = useState<Partial<ProjectType>>({});
  const [editingProjId, setEditingProjId] = useState<string | null>(null);

  const [showSkillForm, setShowSkillForm] = useState(false);
  const [newSkill, setNewSkill] = useState<Partial<SkillType>>({ category: 'technical' });
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);

  const [showCertForm, setShowCertForm] = useState(false);
  const [newCert, setNewCert] = useState<Partial<CertificateType>>({});
  const [editingCertId, setEditingCertId] = useState<string | null>(null);

  const [showEduForm, setShowEduForm] = useState(false);
  const [newEdu, setNewEdu] = useState<Partial<EducationType>>({});
  const [editingEduId, setEditingEduId] = useState<string | null>(null);

  // State for image lightbox
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setCvScale(0.4);
      } else if (window.innerWidth < 1024) {
        setCvScale(0.7);
      } else {
        setCvScale(1);
      }
    };
    
    // Set initial scale
    handleResize();
    
    // Only listen if we're on the CV tab to avoid unnecessary updates
    if (activeTab === 'cv') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [activeTab]);

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const profileSnap = await getDoc(doc(db, 'profiles', user.uid));
        if (profileSnap.exists()) {
          setProfile({ id: profileSnap.id, ...profileSnap.data() } as unknown as ProfileType);
        }

        const expSnap = await getDocs(collection(db, `profiles/${user.uid}/experiences`));
        setExperiences(expSnap.docs.map(d => ({ id: d.id, ...d.data() } as ExperienceType)).sort((a, b) => (a.startDate || '').localeCompare(b.startDate || '')));

        const projSnap = await getDocs(collection(db, `profiles/${user.uid}/projects`));
        setProjects(projSnap.docs.map(d => ({ id: d.id, ...d.data() } as ProjectType)));

        const skillSnap = await getDocs(collection(db, `profiles/${user.uid}/skills`));
        setSkills(skillSnap.docs.map(d => ({ id: d.id, ...d.data() } as SkillType)));

        const certSnap = await getDocs(collection(db, `profiles/${user.uid}/certificates`));
        setCertificates(certSnap.docs.map(d => ({ id: d.id, ...d.data() } as CertificateType)));

        const eduSnap = await getDocs(collection(db, `profiles/${user.uid}/educations`));
        setEducations(eduSnap.docs.map(d => ({ id: d.id, ...d.data() } as EducationType)).sort((a, b) => (a.startDate || '').localeCompare(b.startDate || '')));

        const studioSnap = await getDoc(doc(db, 'studio', user.uid));
        if (studioSnap.exists()) {
          setTextAlign(studioSnap.data().textAlign || 'center');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `profiles/${user.uid}/*`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const cleanData = (data: any) => {
    const cleaned = { ...data };
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] === undefined) {
        delete cleaned[key];
      }
    });
    return cleaned;
  };

  // --- Handlers for Experience ---
  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const expData = cleanData({ ...newExp, userId: user.uid });
      delete expData.id;
      
      if (editingExpId) {
        if (expData.endDate === '') expData.endDate = deleteField();
        if (expData.description === '') expData.description = deleteField();
        if (expData.location === '') expData.location = deleteField();
        await updateDoc(doc(db, `profiles/${user.uid}/experiences`, editingExpId), expData);
        setExperiences(experiences.map(exp => exp.id === editingExpId ? { ...exp, ...expData } as ExperienceType : exp).sort((a, b) => (a.startDate || '').localeCompare(b.startDate || '')));
        setEditingExpId(null);
      } else {
        if (expData.endDate === '') delete expData.endDate;
        if (expData.description === '') delete expData.description;
        if (expData.location === '') delete expData.location;
        const docRef = await addDoc(collection(db, `profiles/${user.uid}/experiences`), expData);
        setExperiences([...experiences, { id: docRef.id, ...expData } as ExperienceType].sort((a, b) => (a.startDate || '').localeCompare(b.startDate || '')));
      }
      setShowExpForm(false);
      setNewExp({});
    } catch (error) {
      handleFirestoreError(error, editingExpId ? OperationType.UPDATE : OperationType.CREATE, `profiles/${user.uid}/experiences`);
    }
  };

  const handleDeleteExperience = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `profiles/${user.uid}/experiences`, id));
      setExperiences(experiences.filter(e => e.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `profiles/${user.uid}/experiences/${id}`);
    }
  };

  // --- Handlers for Projects ---
  const handleProjectImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (!files.length) return;

    const currentImages = newProj.imageUrls || (newProj.imageUrl ? [newProj.imageUrl] : []);
    const remainingSlots = 3 - currentImages.length;
    const filesToProcess = files.slice(0, remainingSlots);

    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          setNewProj(prev => {
            const current = prev.imageUrls || (prev.imageUrl ? [prev.imageUrl] : []);
            if (current.length >= 3) {
              alert('Máximo 3 imágenes por proyecto');
              return prev;
            }
            return {
              ...prev,
              imageUrl: '', // clear legacy field
              imageUrls: [...current, dataUrl]
            };
          });
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const removeProjectImage = (index: number) => {
    setNewProj(prev => {
      const current = prev.imageUrls || (prev.imageUrl ? [prev.imageUrl] : []);
      return {
        ...prev,
        imageUrl: '',
        imageUrls: current.filter((_, i) => i !== index)
      };
    });
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const projData = cleanData({ ...newProj, userId: user.uid });
      delete projData.id;
      
      if (editingProjId) {
        if (projData.role === '') projData.role = deleteField();
        if (projData.url === '') projData.url = deleteField();
        if (projData.imageUrl === '') projData.imageUrl = deleteField();
        if (projData.location === '') projData.location = deleteField();
        if (projData.imageUrls) {
          projData.imageUrls = projData.imageUrls.filter(url => url !== '');
          if (projData.imageUrls.length === 0) projData.imageUrls = deleteField();
        }
        await updateDoc(doc(db, `profiles/${user.uid}/projects`, editingProjId), projData);
        setProjects(projects.map(proj => proj.id === editingProjId ? { ...proj, ...projData } as ProjectType : proj));
        setEditingProjId(null);
      } else {
        if (projData.role === '') delete projData.role;
        if (projData.url === '') delete projData.url;
        if (projData.imageUrl === '') delete projData.imageUrl;
        if (projData.location === '') delete projData.location;
        if (projData.imageUrls) {
          projData.imageUrls = projData.imageUrls.filter(url => url !== '');
          if (projData.imageUrls.length === 0) delete projData.imageUrls;
        }
        const docRef = await addDoc(collection(db, `profiles/${user.uid}/projects`), projData);
        setProjects([...projects, { id: docRef.id, ...projData } as ProjectType]);
      }
      setShowProjForm(false);
      setNewProj({});
    } catch (error) {
      handleFirestoreError(error, editingProjId ? OperationType.UPDATE : OperationType.CREATE, `profiles/${user.uid}/projects`);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `profiles/${user.uid}/projects`, id));
      setProjects(projects.filter(p => p.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `profiles/${user.uid}/projects/${id}`);
    }
  };

  // --- Handlers for Skills ---
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const skillData = cleanData({ ...newSkill, userId: user.uid });
      delete skillData.id;
      if (editingSkillId) {
        await updateDoc(doc(db, `profiles/${user.uid}/skills`, editingSkillId), skillData);
        setSkills(skills.map(skill => skill.id === editingSkillId ? { ...skill, ...skillData } as SkillType : skill));
        setEditingSkillId(null);
      } else {
        const docRef = await addDoc(collection(db, `profiles/${user.uid}/skills`), skillData);
        setSkills([...skills, { id: docRef.id, ...skillData } as SkillType]);
      }
      setShowSkillForm(false);
      setNewSkill({ category: 'technical' });
    } catch (error) {
      handleFirestoreError(error, editingSkillId ? OperationType.UPDATE : OperationType.CREATE, `profiles/${user.uid}/skills`);
    }
  };

  const handleDeleteSkill = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `profiles/${user.uid}/skills`, id));
      setSkills(skills.filter(s => s.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `profiles/${user.uid}/skills/${id}`);
    }
  };

  // --- Handlers for Certificates ---
  const handleCertImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        setNewCert({ ...newCert, imageUrl: dataUrl });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAddCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const certData = cleanData({ ...newCert, userId: user.uid });
      delete certData.id;
      
      if (editingCertId) {
        if (certData.date === '') certData.date = deleteField();
        if (certData.imageUrl === '') certData.imageUrl = deleteField();
        if (certData.url === '') certData.url = deleteField();
        await updateDoc(doc(db, `profiles/${user.uid}/certificates`, editingCertId), certData);
        setCertificates(certificates.map(cert => cert.id === editingCertId ? { ...cert, ...certData } as CertificateType : cert));
        setEditingCertId(null);
      } else {
        if (certData.date === '') delete certData.date;
        if (certData.imageUrl === '') delete certData.imageUrl;
        if (certData.url === '') delete certData.url;
        const docRef = await addDoc(collection(db, `profiles/${user.uid}/certificates`), certData);
        setCertificates([...certificates, { id: docRef.id, ...certData } as CertificateType]);
      }
      setShowCertForm(false);
      setNewCert({});
    } catch (error) {
      handleFirestoreError(error, editingCertId ? OperationType.UPDATE : OperationType.CREATE, `profiles/${user.uid}/certificates`);
    }
  };

  const handleDeleteCertificate = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `profiles/${user.uid}/certificates`, id));
      setCertificates(certificates.filter(c => c.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `profiles/${user.uid}/certificates/${id}`);
    }
  };

  // --- Handlers for Education ---
  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const eduData = cleanData({ ...newEdu, userId: user.uid });
      delete eduData.id;
      
      if (editingEduId) {
        if (eduData.endDate === '') eduData.endDate = deleteField();
        if (eduData.description === '') eduData.description = deleteField();
        if (eduData.fieldOfStudy === '') eduData.fieldOfStudy = deleteField();
        if (eduData.location === '') eduData.location = deleteField();
        await updateDoc(doc(db, `profiles/${user.uid}/educations`, editingEduId), eduData);
        setEducations(educations.map(edu => edu.id === editingEduId ? { ...edu, ...eduData } as EducationType : edu).sort((a, b) => (a.startDate || '').localeCompare(b.startDate || '')));
      } else {
        const docRef = await addDoc(collection(db, `profiles/${user.uid}/educations`), eduData);
        setEducations([...educations, { id: docRef.id, ...eduData } as EducationType].sort((a, b) => (a.startDate || '').localeCompare(b.startDate || '')));
      }
      setNewEdu({});
      setShowEduForm(false);
      setEditingEduId(null);
    } catch (error) {
      handleFirestoreError(error, editingEduId ? OperationType.UPDATE : OperationType.CREATE, `profiles/${user.uid}/educations/${editingEduId || 'new'}`);
    }
  };

  const handleDeleteEducation = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `profiles/${user.uid}/educations`, id));
      setEducations(educations.filter(e => e.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `profiles/${user.uid}/educations/${id}`);
    }
  };

  const togglePdfDownload = async () => {
    if (!user || !profile) return;
    const newValue = !profile.allowPdfDownload;
    try {
      await updateDoc(doc(db, 'profiles', user.uid), {
        allowPdfDownload: newValue
      });
      setProfile({ ...profile, allowPdfDownload: newValue });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `profiles/${user.uid}`);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto flex-1 w-full print:p-0 print:m-0 print:max-w-none">
      <div className="mb-6 sm:mb-8 print:hidden">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">{t('exp.title')}</h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-zinc-600">
          {t('exp.subtitle')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-zinc-100 p-1 rounded-xl mb-6 sm:mb-8 overflow-x-auto hide-scrollbar print:hidden">
        <button
          onClick={() => setActiveTab('experiences')}
          className={`flex-1 min-w-[110px] sm:min-w-[120px] flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${activeTab === 'experiences' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
        >
          <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="truncate">{t('exp.tab.exp')}</span>
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex-1 min-w-[110px] sm:min-w-[120px] flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${activeTab === 'projects' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
        >
          <FolderGit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="truncate">{t('exp.tab.proj')}</span>
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`flex-1 min-w-[110px] sm:min-w-[120px] flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${activeTab === 'skills' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
        >
          <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="truncate">{t('exp.tab.skills')}</span>
        </button>
        <button
          onClick={() => setActiveTab('educations')}
          className={`flex-1 min-w-[110px] sm:min-w-[120px] flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${activeTab === 'educations' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
        >
          <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="truncate">{t('exp.tab.edu')}</span>
        </button>
        <button
          onClick={() => setActiveTab('cv')}
          className={`flex-1 min-w-[110px] sm:min-w-[120px] flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${activeTab === 'cv' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
        >
          <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="truncate">{t('exp.tab.cv')}</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="space-y-6">
        
        {/* EXPERIENCES TAB */}
        {activeTab === 'experiences' && (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-semibold text-zinc-900">{t('exp.workExp')}</h2>
              <button 
                onClick={() => setShowExpForm(!showExpForm)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-50 text-indigo-700 text-xs sm:text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">{t('exp.addExp')}</span><span className="sm:hidden">Añadir</span>
              </button>
            </div>

            {showExpForm && (
              <form onSubmit={handleAddExperience} className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-indigo-100 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">{t('exp.company')}</label>
                    <input required type="text" value={newExp.company || ''} onChange={e => setNewExp({...newExp, company: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">{t('exp.role')}</label>
                    <input required type="text" value={newExp.role || ''} onChange={e => setNewExp({...newExp, role: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">{t('exp.startDate')}</label>
                    <input required type="month" value={newExp.startDate || ''} onChange={e => setNewExp({...newExp, startDate: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">{t('exp.endDate')}</label>
                    <input type="month" disabled={newExp.current} value={newExp.endDate || ''} onChange={e => setNewExp({...newExp, endDate: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-indigo-500 disabled:bg-zinc-100" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-zinc-700 mb-1">{t('exp.location')}</label>
                    <input type="text" value={newExp.location || ''} onChange={e => setNewExp({...newExp, location: e.target.value})} placeholder="Ej: Madrid - España" className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="current" checked={newExp.current || false} onChange={e => setNewExp({...newExp, current: e.target.checked, endDate: ''})} className="rounded text-indigo-600 focus:ring-indigo-500" />
                  <label htmlFor="current" className="text-sm text-zinc-700">{t('exp.currentJob')}</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">{t('exp.description')}</label>
                  <textarea rows={3} value={newExp.description || ''} onChange={e => setNewExp({...newExp, description: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-indigo-500 resize-none" />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                  <button type="button" onClick={() => { setShowExpForm(false); setNewExp({}); setEditingExpId(null); }} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900">{t('exp.cancel')}</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">{t('exp.save')}</button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {experiences.length === 0 && !showExpForm && (
                <div className="text-center py-12 bg-white rounded-2xl border border-zinc-200 border-dashed">
                  <Briefcase className="mx-auto h-12 w-12 text-zinc-300" />
                  <h3 className="mt-2 text-sm font-semibold text-zinc-900">{t('exp.noExp')}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{t('exp.noExpDesc')}</p>
                </div>
              )}
              {experiences.map((exp) => (
                <div key={exp.id} className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex justify-between items-start group">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900">{exp.role}</h3>
                    <p className="text-indigo-600 font-medium">
                      {exp.company}
                      {exp.location && <span className="text-zinc-500 font-normal text-sm ml-2">&bull; {exp.location}</span>}
                    </p>
                    <p className="text-sm text-zinc-500 mt-1">
                      {exp.startDate} - {exp.current ? t('exp.present') : exp.endDate}
                    </p>
                    {exp.description && <p className="mt-3 text-zinc-700 text-sm whitespace-pre-wrap">{exp.description}</p>}
                  </div>
                  <div className="flex flex-col gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => {
                      setNewExp(exp);
                      setEditingExpId(exp.id);
                      setShowExpForm(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }} className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDeleteExperience(exp.id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* PROJECTS TAB */}
        {activeTab === 'projects' && (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-zinc-900">{t('exp.featuredProj')}</h2>
              <button 
                onClick={() => setShowProjForm(!showProjForm)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-50 text-indigo-700 text-xs sm:text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">{t('exp.addProj')}</span><span className="sm:hidden">Añadir</span>
              </button>
            </div>

            {showProjForm && (
              <form onSubmit={handleAddProject} className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">{t('exp.projName')}</label>
                    <input required type="text" value={newProj.name || ''} onChange={e => setNewProj({...newProj, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">{t('exp.yourRole')}</label>
                    <input type="text" value={newProj.role || ''} onChange={e => setNewProj({...newProj, role: e.target.value})} placeholder="Ej: Lead Developer" className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-zinc-700 mb-1">{t('exp.projUrl')}</label>
                    <input type="url" value={newProj.url || ''} onChange={e => setNewProj({...newProj, url: e.target.value})} placeholder="https://..." className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-zinc-700 mb-1">{t('exp.location')}</label>
                    <input type="text" value={newProj.location || ''} onChange={e => setNewProj({...newProj, location: e.target.value})} placeholder="Ej: Remoto / CDMX - México" className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-zinc-700 mb-1">{t('exp.description')}</label>
                    <textarea required rows={3} value={newProj.description || ''} onChange={e => setNewProj({...newProj, description: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-indigo-500 resize-none" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-zinc-700 mb-1">{t('exp.projPhotos')}</label>
                    <div className="mt-1 flex flex-wrap items-center gap-4">
                      {(() => {
                        const currentImages = newProj.imageUrls || (newProj.imageUrl ? [newProj.imageUrl] : []);
                        return (
                          <>
                            {currentImages.map((url, idx) => (
                              <div key={idx} className="relative group">
                                <img src={url} alt={`Preview ${idx + 1}`} className="h-16 w-24 object-cover rounded-lg border border-zinc-200" />
                                <button type="button" onClick={() => removeProjectImage(idx)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-sm">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            {currentImages.length < 3 && (
                              <label className="cursor-pointer flex items-center justify-center px-4 py-2 border border-zinc-300 rounded-lg shadow-sm text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50 transition-colors">
                                <ImageIcon className="w-4 h-4 mr-2 text-zinc-500" />
                                <span>{t('exp.uploadPhoto')}</span>
                                <input type="file" accept="image/*" multiple className="hidden" onChange={handleProjectImageUpload} />
                              </label>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                  <button type="button" onClick={() => { setShowProjForm(false); setNewProj({}); setEditingProjId(null); }} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900">{t('exp.cancel')}</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">{t('exp.save')}</button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {projects.length === 0 && !showProjForm && (
                <div className="text-center py-12 bg-white rounded-2xl border border-zinc-200 border-dashed">
                  <FolderGit2 className="mx-auto h-12 w-12 text-zinc-300" />
                  <h3 className="mt-2 text-sm font-semibold text-zinc-900">{t('exp.noProj')}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{t('exp.noProjDesc')}</p>
                </div>
              )}
              {projects.map((proj) => (
                <div key={proj.id} className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex justify-between items-start group">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-zinc-900">{proj.name}</h3>
                      {proj.url && (
                        <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    {proj.role && (
                      <p className="text-sm font-medium text-zinc-600 mt-1">
                        {proj.role}
                        {proj.location && <span className="text-zinc-400 font-normal ml-2">&bull; {proj.location}</span>}
                      </p>
                    )}
                    {!proj.role && proj.location && (
                      <p className="text-sm font-medium text-zinc-500 mt-1">{proj.location}</p>
                    )}
                    <p className="mt-3 text-zinc-700 text-sm whitespace-pre-wrap">{proj.description}</p>
                    {(() => {
                      const images = proj.imageUrls || (proj.imageUrl ? [proj.imageUrl] : []);
                      if (images.length === 0) return null;
                      return (
                        <div className="mt-4 flex flex-wrap gap-3">
                          {images.map((url, idx) => (
                            <img 
                              key={idx} 
                              src={url} 
                              alt={`${proj.name} ${idx + 1}`} 
                              onClick={() => setSelectedImage(url)} 
                              className="h-20 w-32 object-cover rounded-lg border border-zinc-200 cursor-pointer hover:opacity-90 transition-opacity shadow-sm" 
                            />
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex flex-col gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-4">
                    <button onClick={() => {
                      setNewProj(proj);
                      setEditingProjId(proj.id);
                      setShowProjForm(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }} className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDeleteProject(proj.id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* SKILLS TAB */}
        {activeTab === 'skills' && (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-zinc-900">{t('exp.skills')}</h2>
              <button 
                onClick={() => setShowSkillForm(!showSkillForm)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-50 text-indigo-700 text-xs sm:text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">{t('exp.addSkill')}</span><span className="sm:hidden">Añadir</span>
              </button>
            </div>

            {showSkillForm && (
              <form onSubmit={handleAddSkill} className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">{t('exp.skillName')}</label>
                    <input required type="text" value={newSkill.name || ''} onChange={e => setNewSkill({...newSkill, name: e.target.value})} placeholder="Ej: React, Liderazgo, Figma..." className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">{t('exp.category')}</label>
                    <select required value={newSkill.category || 'technical'} onChange={e => setNewSkill({...newSkill, category: e.target.value as any})} className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-indigo-500 bg-white">
                      <option value="technical">{t('exp.cat.tech')}</option>
                      <option value="soft">{t('exp.cat.soft')}</option>
                      <option value="tools">{t('exp.cat.tools')}</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                  <button type="button" onClick={() => { setShowSkillForm(false); setNewSkill({ category: 'technical' }); setEditingSkillId(null); }} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900">{t('exp.cancel')}</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">{t('exp.save')}</button>
                </div>
              </form>
            )}

            <div className="space-y-6">
              {skills.length === 0 && !showSkillForm && (
                <div className="text-center py-12 bg-white rounded-2xl border border-zinc-200 border-dashed">
                  <GraduationCap className="mx-auto h-12 w-12 text-zinc-300" />
                  <h3 className="mt-2 text-sm font-semibold text-zinc-900">Sin habilidades</h3>
                  <p className="mt-1 text-sm text-zinc-500">Añade tus conocimientos técnicos y blandos.</p>
                </div>
              )}

              {/* Group skills by category */}
              {['technical', 'soft', 'tools'].map(category => {
                const categorySkills = skills.filter(s => s.category === category);
                if (categorySkills.length === 0) return null;
                
                const categoryNames = {
                  technical: 'Habilidades Técnicas',
                  soft: 'Habilidades Blandas',
                  tools: 'Herramientas'
                };

                return (
                  <div key={category} className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
                    <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4">{categoryNames[category as keyof typeof categoryNames]}</h3>
                    <div className="flex flex-wrap gap-2">
                      {categorySkills.map(skill => (
                        <div key={skill.id} className="group flex items-center gap-2 px-3 py-1.5 bg-zinc-100 text-zinc-800 rounded-lg text-sm font-medium border border-zinc-200">
                          {skill.name}
                          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button onClick={() => {
                              setNewSkill(skill);
                              setEditingSkillId(skill.id);
                              setShowSkillForm(true);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }} className="text-zinc-400 hover:text-indigo-600 transition-colors">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteSkill(skill.id)} className="text-zinc-400 hover:text-red-500 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CERTIFICATES SECTION */}
            <div className="mt-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-zinc-900">Certificados y Títulos</h2>
                <button 
                  onClick={() => setShowCertForm(!showCertForm)}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-50 text-indigo-700 text-xs sm:text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Añadir Documento</span><span className="sm:hidden">Añadir</span>
                </button>
              </div>

              {showCertForm && (
                <form onSubmit={handleAddCertificate} className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 space-y-4 mb-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre del Certificado/Título</label>
                      <input required type="text" value={newCert.name || ''} onChange={e => setNewCert({...newCert, name: e.target.value})} placeholder="Ej: Certificación AWS, Título Universitario..." className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Institución Emisora</label>
                      <input required type="text" value={newCert.issuer || ''} onChange={e => setNewCert({...newCert, issuer: e.target.value})} placeholder="Ej: Universidad, Coursera, AWS..." className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Fecha (Opcional)</label>
                      <input type="text" value={newCert.date || ''} onChange={e => setNewCert({...newCert, date: e.target.value})} placeholder="Ej: 2023, Octubre 2022..." className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">URL de Verificación (Opcional)</label>
                      <input type="url" value={newCert.url || ''} onChange={e => setNewCert({...newCert, url: e.target.value})} placeholder="https://..." className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Imagen del Documento (Opcional)</label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center justify-center w-32 h-24 border-2 border-dashed border-zinc-300 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors overflow-hidden relative">
                        {newCert.imageUrl ? (
                          <img src={newCert.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center">
                            <ImageIcon className="w-6 h-6 text-zinc-400" />
                            <span className="text-xs text-zinc-500 mt-1">Subir imagen</span>
                          </div>
                        )}
                        <input type="file" accept="image/*" onChange={handleCertImageUpload} className="hidden" />
                      </label>
                      {newCert.imageUrl && (
                        <button type="button" onClick={() => setNewCert({...newCert, imageUrl: undefined})} className="text-sm text-red-600 hover:text-red-700">
                          Quitar imagen
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                    <button type="button" onClick={() => { setShowCertForm(false); setNewCert({}); setEditingCertId(null); }} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">Guardar Documento</button>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {certificates.length === 0 && !showCertForm && (
                  <div className="text-center py-12 bg-white rounded-2xl border border-zinc-200 border-dashed">
                    <FileText className="mx-auto h-12 w-12 text-zinc-300" />
                    <h3 className="mt-2 text-sm font-semibold text-zinc-900">Sin certificados</h3>
                    <p className="mt-1 text-sm text-zinc-500">Añade tus títulos y certificados para respaldar tus habilidades.</p>
                  </div>
                )}

                {certificates.map(cert => (
                  <div key={cert.id} className="group bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex justify-between items-start hover:border-indigo-200 transition-colors">
                    <div className="flex gap-4">
                      {cert.imageUrl && (
                        <img 
                          src={cert.imageUrl} 
                          alt={cert.name} 
                          onClick={() => setSelectedImage(cert.imageUrl!)}
                          className="w-24 h-20 object-cover rounded-lg border border-zinc-200 cursor-pointer hover:opacity-90 transition-opacity"
                        />
                      )}
                      <div>
                        <h3 className="text-lg font-bold text-zinc-900">{cert.name}</h3>
                        <p className="text-sm font-medium text-zinc-600 mt-1">{cert.issuer}</p>
                        {cert.date && <p className="text-sm text-zinc-500 mt-1">{cert.date}</p>}
                        {cert.url && (
                          <a href={cert.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 mt-2 font-medium">
                            <ExternalLink className="w-4 h-4" /> Ver credencial
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-4">
                      <button onClick={() => {
                        setNewCert(cert);
                        setEditingCertId(cert.id);
                        setShowCertForm(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }} className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDeleteCertificate(cert.id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* EDUCATIONS TAB */}
        {activeTab === 'educations' && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden print:hidden">
              <div className="p-4 sm:p-6 border-b border-zinc-100 flex justify-between items-center">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-zinc-900">{t('exp.education')}</h2>
                  <p className="text-sm text-zinc-500 mt-1">{t('exp.noEduDesc')}</p>
                </div>
                {!showEduForm && (
                  <button onClick={() => { setShowEduForm(true); setEditingEduId(null); setNewEdu({}); }} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                    <Plus className="w-4 h-4" /> <span className="hidden sm:inline">{t('exp.addEdu')}</span><span className="sm:hidden">Añadir</span>
                  </button>
                )}
              </div>

              {showEduForm && (
                <div className="p-4 sm:p-6 bg-zinc-50 border-b border-zinc-100">
                  <form onSubmit={handleAddEducation} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">{t('exp.institution')}</label>
                        <input type="text" required value={newEdu.institution || ''} onChange={e => setNewEdu({ ...newEdu, institution: e.target.value })} className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">{t('exp.degree')}</label>
                        <input type="text" required value={newEdu.degree || ''} onChange={e => setNewEdu({ ...newEdu, degree: e.target.value })} className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">{t('exp.fieldOfStudy')}</label>
                        <input type="text" value={newEdu.fieldOfStudy || ''} onChange={e => setNewEdu({ ...newEdu, fieldOfStudy: e.target.value })} className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">{t('exp.location')}</label>
                        <input type="text" value={newEdu.location || ''} onChange={e => setNewEdu({ ...newEdu, location: e.target.value })} className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">{t('exp.startDate')}</label>
                        <input type="month" required value={newEdu.startDate || ''} onChange={e => setNewEdu({ ...newEdu, startDate: e.target.value })} className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">{t('exp.endDate')}</label>
                        <input type="month" disabled={newEdu.current} value={newEdu.endDate || ''} onChange={e => setNewEdu({ ...newEdu, endDate: e.target.value })} className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-zinc-100 disabled:text-zinc-400" />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" id="currentEdu" checked={newEdu.current || false} onChange={e => setNewEdu({ ...newEdu, current: e.target.checked, endDate: e.target.checked ? '' : newEdu.endDate })} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-zinc-300 rounded" />
                      <label htmlFor="currentEdu" className="ml-2 block text-sm text-zinc-900">Estudio aquí actualmente</label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">{t('exp.description')}</label>
                      <textarea rows={3} value={newEdu.description || ''} onChange={e => setNewEdu({ ...newEdu, description: e.target.value })} className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <button type="button" onClick={() => { setShowEduForm(false); setEditingEduId(null); }} className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50">
                        {t('exp.cancel')}
                      </button>
                      <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
                        {t('exp.save')}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="divide-y divide-zinc-100">
                {educations.length === 0 && !showEduForm && (
                  <div className="p-8 text-center text-zinc-500">
                    <GraduationCap className="w-12 h-12 mx-auto text-zinc-300 mb-3" />
                    <p className="text-lg font-medium text-zinc-900">{t('exp.noEdu')}</p>
                    <p className="mt-1">{t('exp.noEduDesc')}</p>
                  </div>
                )}
                {educations.map(edu => (
                  <div key={edu.id} className="p-4 sm:p-6 hover:bg-zinc-50 transition-colors flex flex-col sm:flex-row gap-4 sm:gap-6 group">
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-zinc-900">{edu.degree}</h3>
                          <p className="text-indigo-600 font-medium">{edu.institution}</p>
                        </div>
                        <div className="flex sm:hidden gap-1">
                          <button onClick={() => { setEditingEduId(edu.id); setNewEdu(edu); setShowEduForm(true); }} className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleDeleteEducation(edu.id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-zinc-500 flex flex-wrap gap-x-4 gap-y-1">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {edu.startDate} - {edu.current ? t('exp.present') : edu.endDate}
                        </span>
                        {edu.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {edu.location}
                          </span>
                        )}
                        {edu.fieldOfStudy && (
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-4 h-4" />
                            {edu.fieldOfStudy}
                          </span>
                        )}
                      </div>
                      {edu.description && (
                        <p className="mt-3 text-zinc-600 text-sm whitespace-pre-wrap">{edu.description}</p>
                      )}
                    </div>
                    <div className="hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity items-start gap-2">
                      <button onClick={() => { setEditingEduId(edu.id); setNewEdu(edu); setShowEduForm(true); }} className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDeleteEducation(edu.id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* CV TAB */}
        {activeTab === 'cv' && profile && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-zinc-200 print:hidden">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePdfDownload}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${profile.allowPdfDownload ? 'bg-indigo-600' : 'bg-zinc-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${profile.allowPdfDownload ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm font-medium text-zinc-700">
                  {profile.allowPdfDownload ? t('exp.pdfOn') : t('exp.pdfOff')}
                </span>
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center bg-zinc-100 rounded-lg p-1">
                  <button onClick={() => setCvScale(s => Math.max(0.4, s - 0.1))} className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-white rounded-md transition-colors" title="Alejar">
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-medium px-2 w-12 text-center">{Math.round(cvScale * 100)}%</span>
                  <button onClick={() => setCvScale(s => Math.min(2, s + 0.1))} className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-white rounded-md transition-colors" title="Acercar">
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <div className="w-px h-4 bg-zinc-300 mx-1"></div>
                  <button onClick={() => setCvScale(1)} className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-white rounded-md transition-colors" title="Tamaño original">
                    <Maximize className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Download className="w-4 h-4" /> <span className="hidden sm:inline">{t('exp.downloadPdf')}</span>
                </button>
              </div>
            </div>

            {/* CV Preview Container */}
            <div className="bg-zinc-200/50 p-4 sm:p-8 rounded-2xl overflow-auto flex justify-center relative print:hidden h-[70vh] min-h-[600px] border border-zinc-200 shadow-inner">
              <div 
                style={{ 
                  transform: `scale(${cvScale})`, 
                  transformOrigin: 'top center', 
                  transition: 'transform 0.2s ease-out',
                  width: '210mm'
                }}
                className="origin-top flex justify-center"
              >
                <DossierView 
                  profile={profile}
                  experiences={experiences}
                  projects={projects}
                  skills={skills}
                  certificates={certificates}
                  educations={educations}
                  textAlign={textAlign}
                />
              </div>
            </div>

            {/* Hidden CV Document for PDF */}
            <div className="hidden print:block w-full">
              <DossierView 
                profile={profile}
                experiences={experiences}
                projects={projects}
                skills={skills}
                certificates={certificates}
                educations={educations}
                isPrint={true}
              />
            </div>
          </div>
        )}

      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/90 p-4 backdrop-blur-sm" 
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl w-full max-h-full flex items-center justify-center">
            <button 
              onClick={() => setSelectedImage(null)} 
              className="absolute -top-12 right-0 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={selectedImage} 
              alt="Vista ampliada" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" 
              onClick={e => e.stopPropagation()} 
            />
          </div>
        </div>
      )}
    </div>
  );
};
