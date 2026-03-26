import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Camera, Save, Loader2, Globe, Mail, MapPin } from 'lucide-react';
import { FaGithub, FaLinkedin, FaTwitter, FaPhoneAlt, FaWhatsapp, FaTelegramPlane, FaSkype } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { Profile as ProfileType } from '../types';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
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
      
      setSuccessMsg(t('profile.success'));
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
    <div className="p-8 max-w-4xl mx-auto dark:bg-zinc-950 min-h-full transition-colors duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white transition-colors">{t('profile.title')}</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400 transition-colors">
          {t('profile.subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Foto de Perfil */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-6 transition-colors">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center overflow-hidden transition-colors">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/50 text-white flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium"
            >
              {t('profile.uploadPhoto')}
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
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white transition-colors">{t('profile.photo')}</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 transition-colors">Sube una foto profesional. Se redimensionará automáticamente.</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              {t('profile.uploadPhoto')}
            </button>
          </div>
        </div>

        {/* Información Básica */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-6 transition-colors">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-4 transition-colors">{t('profile.personalInfo')}</h3>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 transition-colors">{t('profile.fullName')}</label>
              <input
                type="text"
                value={profile.fullName || ''}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                placeholder="Ej: Laura Gómez"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 transition-colors">{t('profile.headline')}</label>
              <input
                type="text"
                value={profile.title || ''}
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                placeholder={t('profile.headlinePlaceholder')}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 transition-colors">{t('profile.email')}</label>
              <div className="relative flex items-center">
                <Mail className="w-5 h-5 text-zinc-400 dark:text-zinc-500 absolute left-3" />
                <input
                  type="email"
                  value={profile.email || ''}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="Ej: hola@tu-dominio.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 transition-colors">{t('profile.location')}</label>
              <div className="relative flex items-center">
                <MapPin className="w-5 h-5 text-zinc-400 dark:text-zinc-500 absolute left-3" />
                <input
                  type="text"
                  value={profile.location || ''}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  placeholder="Ej: Madrid, España"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 transition-colors">{t('profile.phone')}</label>
              <div className="relative flex items-center">
                <FaPhoneAlt className="w-5 h-5 text-zinc-400 dark:text-zinc-500 absolute left-3" />
                <input
                  type="tel"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="Ej: +34 600 000 000"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 transition-colors">{t('profile.bio')}</label>
            <textarea
              value={profile.bio || ''}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder={t('profile.bioPlaceholder')}
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
            />
          </div>
        </div>

        {/* Redes Sociales */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-6 transition-colors">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-4 transition-colors">{t('profile.socialLinks')}</h3>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="relative">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 transition-colors">LinkedIn</label>
              <div className="relative flex items-center">
                <FaLinkedin className="w-5 h-5 text-zinc-400 dark:text-zinc-500 absolute left-3" />
                <input
                  type="url"
                  value={profile.socialLinks?.linkedin || ''}
                  onChange={(e) => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, linkedin: e.target.value } })}
                  placeholder="https://linkedin.com/in/tu-perfil"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 transition-colors">Twitter / X</label>
              <div className="relative flex items-center">
                <FaXTwitter className="w-5 h-5 text-zinc-400 dark:text-zinc-500 absolute left-3" />
                <input
                  type="url"
                  value={profile.socialLinks?.twitter || ''}
                  onChange={(e) => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, twitter: e.target.value } })}
                  placeholder="https://twitter.com/tu-usuario"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 transition-colors">GitHub</label>
              <div className="relative flex items-center">
                <FaGithub className="w-5 h-5 text-zinc-400 dark:text-zinc-500 absolute left-3" />
                <input
                  type="url"
                  value={profile.socialLinks?.github || ''}
                  onChange={(e) => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, github: e.target.value } })}
                  placeholder="https://github.com/tu-usuario"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 transition-colors">Sitio Web / Portafolio</label>
              <div className="relative flex items-center">
                <Globe className="w-5 h-5 text-zinc-400 dark:text-zinc-500 absolute left-3" />
                <input
                  type="url"
                  value={profile.socialLinks?.website || ''}
                  onChange={(e) => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, website: e.target.value } })}
                  placeholder="https://tu-sitio.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 transition-colors">Telegram (Opcional)</label>
              <div className="relative flex items-center">
                <FaTelegramPlane className="w-5 h-5 text-zinc-400 dark:text-zinc-500 absolute left-3" />
                <input
                  type="text"
                  value={profile.socialLinks?.telegram || ''}
                  onChange={(e) => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, telegram: e.target.value } })}
                  placeholder="Ej: @tu_usuario"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 transition-colors">Skype (Opcional)</label>
              <div className="relative flex items-center">
                <FaSkype className="w-5 h-5 text-zinc-400 dark:text-zinc-500 absolute left-3" />
                <input
                  type="text"
                  value={profile.socialLinks?.skype || ''}
                  onChange={(e) => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, skype: e.target.value } })}
                  placeholder="Ej: live:tu_usuario"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-4">
          {successMsg && <span className="text-emerald-600 dark:text-emerald-400 font-medium text-sm transition-colors">{successMsg}</span>}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? t('profile.saving') : t('profile.save')}
          </button>
        </div>
      </form>
    </div>
  );
};
