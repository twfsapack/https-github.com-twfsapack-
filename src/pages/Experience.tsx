import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, doc, getDocs, getDoc, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Plus, Trash2, Briefcase, FolderGit2, GraduationCap, Loader2, ExternalLink, Image as ImageIcon, X, FileText, Download, ToggleLeft, ToggleRight } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { Experience as ExperienceType, Project as ProjectType, Skill as SkillType, Profile as ProfileType } from '../types';
import { useReactToPrint } from 'react-to-print';

export const Experience: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'experiences' | 'projects' | 'skills' | 'cv'>('experiences');

  // States for lists
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [experiences, setExperiences] = useState<ExperienceType[]>([]);
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [skills, setSkills] = useState<SkillType[]>([]);

  // States for forms
  const [showExpForm, setShowExpForm] = useState(false);
  const [newExp, setNewExp] = useState<Partial<ExperienceType>>({});

  const [showProjForm, setShowProjForm] = useState(false);
  const [newProj, setNewProj] = useState<Partial<ProjectType>>({});

  const [showSkillForm, setShowSkillForm] = useState(false);
  const [newSkill, setNewSkill] = useState<Partial<SkillType>>({ category: 'technical' });

  // State for image lightbox
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const cvRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: cvRef,
    documentTitle: profile ? `CV_${profile.fullName?.replace(/\s+/g, '_')}` : 'CV',
  });

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const profileSnap = await getDoc(doc(db, 'profiles', user.uid));
        if (profileSnap.exists()) {
          setProfile({ id: profileSnap.id, ...profileSnap.data() } as ProfileType);
        }

        const expSnap = await getDocs(collection(db, `profiles/${user.uid}/experiences`));
        setExperiences(expSnap.docs.map(d => ({ id: d.id, ...d.data() } as ExperienceType)));

        const projSnap = await getDocs(collection(db, `profiles/${user.uid}/projects`));
        setProjects(projSnap.docs.map(d => ({ id: d.id, ...d.data() } as ProjectType)));

        const skillSnap = await getDocs(collection(db, `profiles/${user.uid}/skills`));
        setSkills(skillSnap.docs.map(d => ({ id: d.id, ...d.data() } as SkillType)));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `profiles/${user.uid}/*`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // --- Handlers for Experience ---
  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const expData = { ...newExp, userId: user.uid };
      const docRef = await addDoc(collection(db, `profiles/${user.uid}/experiences`), expData);
      setExperiences([...experiences, { id: docRef.id, ...expData } as ExperienceType]);
      setShowExpForm(false);
      setNewExp({});
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `profiles/${user.uid}/experiences`);
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
    const files = Array.from(e.target.files || []);
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
      const projData = { ...newProj, userId: user.uid };
      const docRef = await addDoc(collection(db, `profiles/${user.uid}/projects`), projData);
      setProjects([...projects, { id: docRef.id, ...projData } as ProjectType]);
      setShowProjForm(false);
      setNewProj({});
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `profiles/${user.uid}/projects`);
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
      const skillData = { ...newSkill, userId: user.uid };
      const docRef = await addDoc(collection(db, `profiles/${user.uid}/skills`), skillData);
      setSkills([...skills, { id: docRef.id, ...skillData } as SkillType]);
      setShowSkillForm(false);
      setNewSkill({ category: 'technical' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `profiles/${user.uid}/skills`);
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
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Trayectoria</h1>
        <p className="mt-2 text-zinc-600">
          Añade tu experiencia laboral, proyectos destacados y habilidades clave.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-zinc-100 p-1 rounded-xl mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('experiences')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'experiences' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
        >
          <Briefcase className="w-4 h-4" /> Experiencia
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'projects' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
        >
          <FolderGit2 className="w-4 h-4" /> Proyectos
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'skills' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
        >
          <GraduationCap className="w-4 h-4" /> Habilidades
        </button>
        <button
          onClick={() => setActiveTab('cv')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'cv' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
        >
          <FileText className="w-4 h-4" /> CV / Hoja de Vida
        </button>
      </div>

      {/* Content Area */}
      <div className="space-y-6">
        
        {/* EXPERIENCES TAB */}
        {activeTab === 'experiences' && (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-zinc-900">Experiencia Laboral</h2>
              <button 
                onClick={() => setShowExpForm(!showExpForm)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <Plus className="w-4 h-4" /> Añadir Experiencia
              </button>
            </div>

            {showExpForm && (
              <form onSubmit={handleAddExperience} className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Empresa</label>
                    <input required type="text" value={newExp.company || ''} onChange={e => setNewExp({...newExp, company: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Cargo</label>
                    <input required type="text" value={newExp.role || ''} onChange={e => setNewExp({...newExp, role: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Fecha Inicio</label>
                    <input required type="month" value={newExp.startDate || ''} onChange={e => setNewExp({...newExp, startDate: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Fecha Fin</label>
                    <input type="month" disabled={newExp.current} value={newExp.endDate || ''} onChange={e => setNewExp({...newExp, endDate: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-indigo-500 disabled:bg-zinc-100" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Ubicación (Ciudad - País)</label>
                    <input type="text" value={newExp.location || ''} onChange={e => setNewExp({...newExp, location: e.target.value})} placeholder="Ej: Madrid - España" className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="current" checked={newExp.current || false} onChange={e => setNewExp({...newExp, current: e.target.checked, endDate: ''})} className="rounded text-indigo-600 focus:ring-indigo-500" />
                  <label htmlFor="current" className="text-sm text-zinc-700">Trabajo aquí actualmente</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Descripción y Logros</label>
                  <textarea rows={3} value={newExp.description || ''} onChange={e => setNewExp({...newExp, description: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-indigo-500 resize-none" />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                  <button type="button" onClick={() => setShowExpForm(false)} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">Guardar</button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {experiences.length === 0 && !showExpForm && (
                <div className="text-center py-12 bg-white rounded-2xl border border-zinc-200 border-dashed">
                  <Briefcase className="mx-auto h-12 w-12 text-zinc-300" />
                  <h3 className="mt-2 text-sm font-semibold text-zinc-900">Sin experiencia</h3>
                  <p className="mt-1 text-sm text-zinc-500">Comienza añadiendo tu historial laboral.</p>
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
                      {exp.startDate} - {exp.current ? 'Presente' : exp.endDate}
                    </p>
                    {exp.description && <p className="mt-3 text-zinc-700 text-sm whitespace-pre-wrap">{exp.description}</p>}
                  </div>
                  <button onClick={() => handleDeleteExperience(exp.id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* PROJECTS TAB */}
        {activeTab === 'projects' && (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-zinc-900">Proyectos Destacados</h2>
              <button 
                onClick={() => setShowProjForm(!showProjForm)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <Plus className="w-4 h-4" /> Añadir Proyecto
              </button>
            </div>

            {showProjForm && (
              <form onSubmit={handleAddProject} className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre del Proyecto</label>
                    <input required type="text" value={newProj.name || ''} onChange={e => setNewProj({...newProj, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Tu Rol (Opcional)</label>
                    <input type="text" value={newProj.role || ''} onChange={e => setNewProj({...newProj, role: e.target.value})} placeholder="Ej: Lead Developer" className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-zinc-700 mb-1">URL del Proyecto (Opcional)</label>
                    <input type="url" value={newProj.url || ''} onChange={e => setNewProj({...newProj, url: e.target.value})} placeholder="https://..." className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Ubicación (Ciudad - País)</label>
                    <input type="text" value={newProj.location || ''} onChange={e => setNewProj({...newProj, location: e.target.value})} placeholder="Ej: Remoto / CDMX - México" className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Descripción</label>
                    <textarea required rows={3} value={newProj.description || ''} onChange={e => setNewProj({...newProj, description: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-indigo-500 resize-none" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Fotos del Proyecto (Máx 3)</label>
                    <div className="mt-1 flex flex-wrap items-center gap-4">
                      {(() => {
                        const currentImages = newProj.imageUrls || (newProj.imageUrl ? [newProj.imageUrl] : []);
                        return (
                          <>
                            {currentImages.map((url, idx) => (
                              <div key={idx} className="relative group">
                                <img src={url} alt={`Preview ${idx + 1}`} className="h-16 w-24 object-cover rounded-lg border border-zinc-200" />
                                <button type="button" onClick={() => removeProjectImage(idx)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            {currentImages.length < 3 && (
                              <label className="cursor-pointer flex items-center justify-center px-4 py-2 border border-zinc-300 rounded-lg shadow-sm text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50 transition-colors">
                                <ImageIcon className="w-4 h-4 mr-2 text-zinc-500" />
                                <span>Subir foto</span>
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
                  <button type="button" onClick={() => setShowProjForm(false)} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">Guardar</button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {projects.length === 0 && !showProjForm && (
                <div className="text-center py-12 bg-white rounded-2xl border border-zinc-200 border-dashed">
                  <FolderGit2 className="mx-auto h-12 w-12 text-zinc-300" />
                  <h3 className="mt-2 text-sm font-semibold text-zinc-900">Sin proyectos</h3>
                  <p className="mt-1 text-sm text-zinc-500">Añade los proyectos de los que estés más orgulloso.</p>
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
                  <button onClick={() => handleDeleteProject(proj.id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ml-4">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* SKILLS TAB */}
        {activeTab === 'skills' && (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-zinc-900">Habilidades</h2>
              <button 
                onClick={() => setShowSkillForm(!showSkillForm)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <Plus className="w-4 h-4" /> Añadir Habilidad
              </button>
            </div>

            {showSkillForm && (
              <form onSubmit={handleAddSkill} className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Habilidad</label>
                    <input required type="text" value={newSkill.name || ''} onChange={e => setNewSkill({...newSkill, name: e.target.value})} placeholder="Ej: React, Liderazgo, Figma..." className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Categoría</label>
                    <select required value={newSkill.category || 'technical'} onChange={e => setNewSkill({...newSkill, category: e.target.value as any})} className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-indigo-500 bg-white">
                      <option value="technical">Técnica (Hard Skill)</option>
                      <option value="soft">Blanda (Soft Skill)</option>
                      <option value="tools">Herramientas / Software</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                  <button type="button" onClick={() => setShowSkillForm(false)} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">Guardar</button>
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
                          <button onClick={() => handleDeleteSkill(skill.id)} className="text-zinc-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* CV TAB */}
        {activeTab === 'cv' && profile && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-zinc-200">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePdfDownload}
                  className="flex items-center gap-2 text-zinc-700 hover:text-indigo-600 transition-colors"
                >
                  {profile.allowPdfDownload ? (
                    <ToggleRight className="w-6 h-6 text-indigo-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-zinc-400" />
                  )}
                  <span className="text-sm font-medium">
                    {profile.allowPdfDownload ? 'Descarga pública activada' : 'Descarga pública desactivada'}
                  </span>
                </button>
              </div>
              <button
                onClick={() => handlePrint()}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors w-full sm:w-auto justify-center"
              >
                <Download className="w-4 h-4" /> Descargar PDF
              </button>
            </div>

            {/* CV Preview Container */}
            <div className="bg-zinc-200 p-4 sm:p-8 rounded-2xl overflow-x-auto flex justify-center">
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
