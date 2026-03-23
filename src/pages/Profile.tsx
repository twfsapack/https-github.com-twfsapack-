import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Camera, Save, Loader2, Github, Linkedin, Twitter, Globe, Phone, MessageCircle, Video, Mail, MapPin } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { Profile as ProfileType } from '../types';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Partial<ProfileType>>({
    fullName: '',
    title: '',
    bio: '',
    avatarUrl: '',
    phone: '',
    email: '',
    location: '',
    socialLinks: {
      linkedin: '',
      twitter: '',
      github: '',
      website: '',
      telegram: '',
      skype: ''
    }
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'profiles', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile({ ...profile, ...docSnap.data() });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `profiles/${user.uid}`);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Comprimir y redimensionar la imagen en el cliente para no exceder el límite de 1MB de Firestore
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 256;
        const MAX_HEIGHT = 256;
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
        
        // Convertir a base64 con calidad 0.8 (aprox 10-30kb)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setProfile(prev => ({ ...prev, avatarUrl: dataUrl }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSuccessMsg('');

    try {
      const docRef = doc(db, 'profiles', user.uid);
      await setDoc(docRef, {
        ...profile,
        uid: user.uid,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setSuccessMsg('¡Perfil guardado exitosamente!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `profiles/${user.uid}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Mi Perfil</h1>
        <p className="mt-2 text-zinc-600">
          Esta información será la base de tu tarjeta digital y tu CV interactivo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Foto de Perfil */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-zinc-100 border-2 border-dashed border-zinc-300 flex items-center justify-center overflow-hidden">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-zinc-400" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/50 text-white flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium"
            >
              Cambiar
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
          <div>
            <h3 className="text-lg font-medium text-zinc-900">Foto de perfil</h3>
            <p className="text-sm text-zinc-500 mt-1">Sube una foto profesional. Se redimensionará automáticamente.</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 px-4 py-2 bg-zinc-100 text-zinc-700 text-sm font-medium rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Subir imagen
            </button>
          </div>
        </div>

        {/* Información Básica */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 space-y-6">
          <h3 className="text-lg font-medium text-zinc-900 border-b border-zinc-100 pb-4">Información Básica</h3>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Nombre Completo</label>
              <input
                type="text"
                value={profile.fullName || ''}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                placeholder="Ej: Laura Gómez"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Cargo o Especialidad</label>
              <input
                type="text"
                value={profile.title || ''}
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                placeholder="Ej: Senior Product Designer"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-2">Correo Electrónico</label>
              <div className="relative flex items-center">
                <Mail className="w-5 h-5 text-zinc-400 absolute left-3" />
                <input
                  type="email"
                  value={profile.email || ''}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="Ej: hola@tu-dominio.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-2">Localizador / Ciudad (Opcional)</label>
              <div className="relative flex items-center">
                <MapPin className="w-5 h-5 text-zinc-400 absolute left-3" />
                <input
                  type="text"
                  value={profile.location || ''}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  placeholder="Ej: Madrid, España"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-2">Teléfono / WhatsApp</label>
              <div className="relative flex items-center">
                <Phone className="w-5 h-5 text-zinc-400 absolute left-3" />
                <input
                  type="tel"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="Ej: +34 600 000 000"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Biografía Breve</label>
            <textarea
              value={profile.bio || ''}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Cuenta un poco sobre ti, tu pasión y lo que haces..."
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
            />
          </div>
        </div>

        {/* Redes Sociales */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 space-y-6">
          <h3 className="text-lg font-medium text-zinc-900 border-b border-zinc-100 pb-4">Enlaces y Redes Sociales</h3>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="relative">
              <label className="block text-sm font-medium text-zinc-700 mb-2">LinkedIn</label>
              <div className="relative flex items-center">
                <Linkedin className="w-5 h-5 text-zinc-400 absolute left-3" />
                <input
                  type="url"
                  value={profile.socialLinks?.linkedin || ''}
                  onChange={(e) => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, linkedin: e.target.value } })}
                  placeholder="https://linkedin.com/in/tu-perfil"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-zinc-700 mb-2">Twitter / X</label>
              <div className="relative flex items-center">
                <Twitter className="w-5 h-5 text-zinc-400 absolute left-3" />
                <input
                  type="url"
                  value={profile.socialLinks?.twitter || ''}
                  onChange={(e) => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, twitter: e.target.value } })}
                  placeholder="https://twitter.com/tu-usuario"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-zinc-700 mb-2">GitHub</label>
              <div className="relative flex items-center">
                <Github className="w-5 h-5 text-zinc-400 absolute left-3" />
                <input
                  type="url"
                  value={profile.socialLinks?.github || ''}
                  onChange={(e) => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, github: e.target.value } })}
                  placeholder="https://github.com/tu-usuario"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-zinc-700 mb-2">Sitio Web / Portafolio</label>
              <div className="relative flex items-center">
                <Globe className="w-5 h-5 text-zinc-400 absolute left-3" />
                <input
                  type="url"
                  value={profile.socialLinks?.website || ''}
                  onChange={(e) => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, website: e.target.value } })}
                  placeholder="https://tu-sitio.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-zinc-700 mb-2">Telegram (Opcional)</label>
              <div className="relative flex items-center">
                <MessageCircle className="w-5 h-5 text-zinc-400 absolute left-3" />
                <input
                  type="text"
                  value={profile.socialLinks?.telegram || ''}
                  onChange={(e) => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, telegram: e.target.value } })}
                  placeholder="Ej: @tu_usuario"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-zinc-700 mb-2">Skype (Opcional)</label>
              <div className="relative flex items-center">
                <Video className="w-5 h-5 text-zinc-400 absolute left-3" />
                <input
                  type="text"
                  value={profile.socialLinks?.skype || ''}
                  onChange={(e) => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, skype: e.target.value } })}
                  placeholder="Ej: live:tu_usuario"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-4">
          {successMsg && <span className="text-emerald-600 font-medium text-sm">{successMsg}</span>}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Guardar Perfil
          </button>
        </div>
      </form>
    </div>
  );
};
