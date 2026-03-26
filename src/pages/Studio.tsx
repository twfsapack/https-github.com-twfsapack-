import React, { useState, useEffect, useRef } from 'react';
import { Wand2, LayoutTemplate, Type, Palette, Smartphone, Monitor, Save, RefreshCw, User, Briefcase, AlignLeft, AlignCenter, AlignRight, Upload, Share2, QrCode } from 'lucide-react';
import { FaPhoneAlt, FaWhatsapp, FaEnvelope, FaMapMarkerAlt, FaFileAlt, FaLinkedin, FaGithub, FaGlobe, FaTelegramPlane, FaSkype } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { cn } from '../components/Layout';
import { GoogleGenAI } from '@google/genai';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import QRCode from 'react-qr-code';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

import { useLanguage } from '../contexts/LanguageContext';

export const Studio: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState('#18181b'); // bg-zinc-900 equivalent
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const [showBgOptions, setShowBgOptions] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const bgInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<{
    fullName: string;
    title: string;
    avatarUrl: string;
    phone: string;
    email: string;
    location: string;
    allowPdfDownload: boolean;
    socialLinks?: {
      linkedin?: string;
      github?: string;
      twitter?: string;
      website?: string;
      telegram?: string;
      skype?: string;
    };
  }>({
    fullName: '',
    title: '',
    avatarUrl: '',
    phone: '',
    email: '',
    location: '',
    allowPdfDownload: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const compressImage = (dataUrl: string, maxWidth: number, maxHeight: number, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = dataUrl;
    });
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'profiles', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile({
            fullName: data.fullName || user.displayName || t('yourName'),
            title: data.title || t('yourTitle'),
            avatarUrl: data.avatarUrl || '',
            phone: data.phone || t('yourPhone'),
            email: data.email || 'tu@email.com',
            location: data.location || t('yourCity'),
            allowPdfDownload: data.allowPdfDownload || false,
            socialLinks: data.socialLinks || {}
          });

          if (data.studio) {
            if (data.studio.orientation) setOrientation(data.studio.orientation);
            if (data.studio.textAlign) setTextAlign(data.studio.textAlign);
            if (data.studio.bgColor) setBgColor(data.studio.bgColor);
            if (data.studio.customBgImage) setCustomBgImage(data.studio.customBgImage);
            if (data.studio.generatedImage) setGeneratedImage(data.studio.generatedImage);
          }
        } else {
          setProfile(prev => ({ ...prev, fullName: user.displayName || t('yourName') }));
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, [user]);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: `A professional business card background design. ${prompt}. High quality, modern, clean, abstract background. NO TEXT, NO LETTERS, NO NUMBERS, NO WORDS. Completely blank background without any typography, writing, or logos.`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: orientation === 'horizontal' ? "16:9" : "9:16",
          },
        },
      });

      let newImageUrl = null;
      if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64EncodeString = part.inlineData.data;
            newImageUrl = `data:image/png;base64,${base64EncodeString}`;
            break;
          }
        }
      }
      
      if (newImageUrl) {
        const compressed = await compressImage(newImageUrl, 1024, 1024, 0.7);
        setGeneratedImage(compressed);
        setCustomBgImage(null); // Clear manual image if AI generates one
      } else {
        console.error("No image generated by the model.");
      }
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      const compressed = await compressImage(result, 1024, 1024, 0.7);
      setCustomBgImage(compressed);
      setGeneratedImage(null); // Clear AI image if user uploads manual one
      setShowBgOptions(false);
    };
    reader.readAsDataURL(file);
  };

  const handlePublish = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const docRef = doc(db, 'profiles', user.uid);
      await setDoc(docRef, {
        studio: {
          orientation,
          textAlign,
          bgColor,
          customBgImage,
          generatedImage
        },
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `profiles/${user.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full bg-zinc-50">
      {/* Left Panel - Controls */}
      <div className="w-1/3 min-w-[320px] max-w-md bg-white border-r border-zinc-200 flex flex-col h-full overflow-y-auto">
        <div className="p-6 border-b border-zinc-200">
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-indigo-600" />
            {t('studio.title')}
          </h2>
          <p className="text-sm text-zinc-500 mt-1">{t('studio.subtitle')}</p>
        </div>

        <div className="p-6 flex-1 flex flex-col gap-6">
          {/* Prompt Area */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-zinc-900">
              {t('studio.describeCard')}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('studio.promptPlaceholder')}
              className="w-full h-32 p-4 rounded-xl border border-zinc-200 bg-zinc-50 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all"
            />
            
            {/* Presets */}
            <div className="flex flex-wrap gap-2 mt-2">
              {[t('studio.presetMinimalist'), t('studio.presetNeon'), t('studio.presetCreative'), t('studio.presetCorporate')].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setPrompt(preset)}
                  className="px-3 py-1.5 text-xs font-medium bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  {t('studio.generating')}
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  {t('studio.generateDesign')}
                </>
              )}
            </button>
          </div>

          <hr className="border-zinc-200" />

          {/* Manual Controls */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-zinc-900">{t('studio.manualAdjustments')}</h3>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4" /> {t('studio.orientation')}
              </span>
              <div className="flex bg-zinc-100 rounded-lg p-1">
                <button 
                  onClick={() => setOrientation('horizontal')}
                  className={cn("px-3 py-1 text-xs font-medium rounded-md transition-colors", orientation === 'horizontal' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-600 hover:text-zinc-900")}
                >{t('studio.horiz')}</button>
                <button 
                  onClick={() => setOrientation('vertical')}
                  className={cn("px-3 py-1 text-xs font-medium rounded-md transition-colors", orientation === 'vertical' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-600 hover:text-zinc-900")}
                >{t('studio.vert')}</button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 flex items-center gap-2">
                <AlignLeft className="w-4 h-4" /> {t('studio.alignment')}
              </span>
              <div className="flex bg-zinc-100 rounded-lg p-1">
                <button 
                  onClick={() => setTextAlign('left')}
                  className={cn("p-1.5 text-xs font-medium rounded-md transition-colors", textAlign === 'left' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-600 hover:text-zinc-900")}
                  title={t('studio.left')}
                ><AlignLeft className="w-4 h-4" /></button>
                <button 
                  onClick={() => setTextAlign('center')}
                  className={cn("p-1.5 text-xs font-medium rounded-md transition-colors", textAlign === 'center' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-600 hover:text-zinc-900")}
                  title="Centro"
                ><AlignCenter className="w-4 h-4" /></button>
                <button 
                  onClick={() => setTextAlign('right')}
                  className={cn("p-1.5 text-xs font-medium rounded-md transition-colors", textAlign === 'right' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-600 hover:text-zinc-900")}
                  title="Derecha"
                ><AlignRight className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 flex items-center gap-2">
                <Type className="w-4 h-4" /> {t('studio.typography')}
              </span>
              <select className="text-sm border-zinc-200 rounded-lg py-1.5 pl-3 pr-8 bg-zinc-50">
                <option>Inter</option>
                <option>Space Grotesk</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 flex items-center gap-2">
                <QrCode className="w-4 h-4" /> {t('studio.qrCode')}
              </span>
              <button
                onClick={() => setShowQR(!showQR)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                  showQR ? "bg-indigo-100 text-indigo-700" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                )}
              >
                {showQR ? 'Ocultar QR' : 'Mostrar QR'}
              </button>
            </div>

            <div className="flex items-center justify-between relative">
              <span className="text-sm text-zinc-600 flex items-center gap-2">
                <Palette className="w-4 h-4" /> {t('studio.background')}
              </span>
              <div 
                className="w-8 h-8 rounded-full border border-zinc-200 cursor-pointer shadow-sm bg-zinc-900"
                style={{ 
                  backgroundColor: bgColor, 
                  backgroundImage: (customBgImage || generatedImage) ? `url(${customBgImage || generatedImage})` : 'none', 
                  backgroundSize: 'cover', 
                  backgroundPosition: 'center' 
                }}
                onClick={() => setShowBgOptions(!showBgOptions)}
              ></div>

              {showBgOptions && (
                <div className="absolute right-0 top-10 mt-2 w-56 bg-white rounded-xl shadow-xl border border-zinc-200 p-4 z-50 flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">{t('studio.solidColor')}</label>
                    <div className="flex items-center gap-3">
                      <div className="relative w-8 h-8 rounded-md overflow-hidden border border-zinc-200 shadow-sm shrink-0">
                        <input 
                          type="color" 
                          value={bgColor}
                          onChange={(e) => {
                            setBgColor(e.target.value);
                            setCustomBgImage(null);
                            setGeneratedImage(null);
                          }}
                          className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer"
                        />
                      </div>
                      <span className="text-sm text-zinc-600 font-mono uppercase">{bgColor}</span>
                    </div>
                  </div>
                  
                  <div className="h-px w-full bg-zinc-100"></div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">{t('studio.customImage')}</label>
                    <button 
                      onClick={() => bgInputRef.current?.click()}
                      className="w-full py-2 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" /> {t('studio.uploadImage')}
                    </button>
                    <input 
                      type="file" 
                      ref={bgInputRef}
                      onChange={handleBgImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-zinc-200 bg-zinc-50">
          <button 
            onClick={handlePublish}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saveSuccess ? t('studio.saved') : t('studio.publishChanges')}
          </button>
        </div>
      </div>

      {/* Right Panel - Canvas */}
      <div className="flex-1 flex flex-col bg-zinc-100/50 relative">
        {/* Topbar */}
        <div className="h-16 border-b border-zinc-200 bg-white flex items-center justify-center px-6">
          <div className="flex bg-zinc-100 rounded-xl p-1">
            <button 
              onClick={() => setViewMode('desktop')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                viewMode === 'desktop' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              <Monitor className="w-4 h-4" /> {t('studio.desktop')}
            </button>
            <button 
              onClick={() => setViewMode('mobile')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                viewMode === 'mobile' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              <Smartphone className="w-4 h-4" /> {t('studio.mobile')}
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto bg-zinc-100/50 relative">
          <div className="min-h-full w-full flex items-center justify-center p-4 sm:p-8">
            <div className={cn(
              "relative transition-all duration-500 ease-in-out flex items-center justify-center shrink-0",
              viewMode === 'desktop' 
                ? "w-full max-w-3xl" 
                : (orientation === 'horizontal' ? "w-[736px] aspect-[16/9]" : "h-[736px] aspect-[9/16]"),
              viewMode === 'mobile' ? "bg-zinc-900 rounded-[3rem] shadow-2xl border-[14px] border-zinc-800 p-2" : "",
              isGenerating && "blur-sm scale-95 opacity-80"
            )}>
              
              {/* Mobile Device Notch */}
              {viewMode === 'mobile' && (
                <div className={cn(
                  "absolute bg-zinc-800 z-50 pointer-events-none",
                  orientation === 'horizontal' 
                    ? "left-0 top-1/2 -translate-y-1/2 w-7 h-32 rounded-r-3xl" 
                    : "top-0 left-1/2 -translate-x-1/2 w-32 h-7 rounded-b-3xl"
                )}></div>
              )}

              {/* Card Preview Placeholder */}
              <div 
                className={cn(
                  "w-full flex flex-col items-center justify-center text-white p-6 sm:p-12 relative overflow-hidden transition-all duration-500",
                  viewMode === 'mobile' ? "h-full rounded-[2.2rem]" : "rounded-3xl shadow-2xl border border-zinc-800",
                  viewMode === 'desktop' && (orientation === 'horizontal' ? "aspect-[16/9]" : "aspect-[9/16]"),
                  showQR ? "bg-white" : ""
                )}
                style={!showQR ? { backgroundColor: bgColor } : undefined}
              >
                {/* Share Button */}
              <button
                onClick={() => setShowQR(!showQR)}
                className={cn(
                  "absolute top-4 right-4 z-50 p-2 rounded-full backdrop-blur-md transition-all",
                  showQR ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200" : "bg-black/20 text-white hover:bg-black/40"
                )}
                title={t('studio.shareCard')}
              >
                <Share2 className="w-5 h-5" />
              </button>

              {showQR ? (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300 bg-white">
                  <div className={cn(
                    "bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border border-zinc-200",
                    orientation === 'horizontal' ? "w-24 sm:w-32 md:w-40" : "w-40 sm:w-48 md:w-56"
                  )}>
                    <QRCode 
                      value={`${window.location.origin}/card/${user?.uid}`}
                      size={256}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                      level="H"
                    />
                  </div>
                  <p className={cn(
                    "text-zinc-800 font-medium text-center",
                    orientation === 'horizontal' ? "mt-2 sm:mt-4 text-xs sm:text-sm" : "mt-4 sm:mt-6 text-sm sm:text-base"
                  )}>
                    {t('studio.scanQR')}
                  </p>
                </div>
              ) : (
                <>
                  {isGenerating && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite] z-20" />
                  )}
                  
                  {(generatedImage || customBgImage) && (
                    <img src={generatedImage || customBgImage} alt="Background" className="absolute inset-0 w-full h-full object-cover z-0" />
                  )}
                  
                  {/* Overlay Content */}
                  <div className={cn(
                    "relative z-10 flex flex-col justify-center w-full max-w-full px-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]",
                    textAlign === 'left' ? "items-start" : textAlign === 'right' ? "items-end" : "items-center"
                  )}>
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt="Avatar" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-white/30 mb-4 sm:mb-6 shadow-xl" />
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/30 mb-4 sm:mb-6 shadow-xl flex items-center justify-center">
                        <User className="w-10 h-10 text-white/50" />
                      </div>
                    )}
                
                <div className={cn(
                  "flex flex-col gap-2 sm:gap-3 w-full",
                  textAlign === 'left' ? "items-start" : textAlign === 'right' ? "items-end" : "items-center"
                )}>
                  <div className={cn(
                    "flex items-center gap-2 w-full max-w-full",
                    textAlign === 'left' ? "justify-start" : textAlign === 'right' ? "justify-end" : "justify-center"
                  )}>
                    <User className="w-5 h-5 shrink-0 text-white/80" />
                    <h1 className={cn(
                      "text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate whitespace-nowrap",
                      textAlign === 'left' ? "text-left" : textAlign === 'right' ? "text-right" : "text-center"
                    )}>
                      {profile.fullName || t('yourName')}
                    </h1>
                  </div>
                  
                  <div className={cn(
                    "flex items-center gap-2 w-full max-w-full",
                    textAlign === 'left' ? "justify-start" : textAlign === 'right' ? "justify-end" : "justify-center"
                  )}>
                    <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-white/80" />
                    <p className="text-sm sm:text-base lg:text-lg text-white/90 truncate whitespace-nowrap">
                      {profile.title || t('yourTitle')}
                    </p>
                  </div>

                  <div className={cn(
                    "flex items-center gap-2 w-full max-w-full",
                    textAlign === 'left' ? "justify-start" : textAlign === 'right' ? "justify-end" : "justify-center"
                  )}>
                    <a 
                      href={`tel:${profile.phone.replace(/\D/g, '')}`} 
                      className="hover:scale-110 transition-transform p-1.5 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm" 
                      title={t('studio.call')}
                    >
                      <FaPhoneAlt className="w-4 h-4 sm:w-4 sm:h-4 shrink-0 text-white" />
                    </a>
                    <a 
                      href={`https://wa.me/${profile.phone.replace(/\D/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:scale-110 transition-transform p-1.5 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm" 
                      title={t('studio.whatsapp')}
                    >
                      <FaWhatsapp className="w-4 h-4 sm:w-4 sm:h-4 shrink-0 text-white" />
                    </a>
                    <p className="text-sm sm:text-base lg:text-lg text-white/90 truncate whitespace-nowrap ml-1">
                      {profile.phone || t('yourPhone')}
                    </p>
                  </div>

                  <div className={cn(
                    "flex items-center gap-2 w-full max-w-full",
                    textAlign === 'left' ? "justify-start" : textAlign === 'right' ? "justify-end" : "justify-center"
                  )}>
                    <a 
                      href={`mailto:${profile.email}`} 
                      className="hover:scale-110 transition-transform p-1.5 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm" 
                      title={t('studio.sendEmail')}
                    >
                      <FaEnvelope className="w-4 h-4 sm:w-4 sm:h-4 shrink-0 text-white" />
                    </a>
                    <p className="text-sm sm:text-base lg:text-lg text-white/90 truncate whitespace-nowrap ml-1">
                      {profile.email || 'tu@email.com'}
                    </p>
                  </div>

                  {profile.location && profile.location !== t('yourCity') && (
                    <div className={cn(
                      "flex items-center gap-2 w-full max-w-full",
                      textAlign === 'left' ? "justify-start" : textAlign === 'right' ? "justify-end" : "justify-center"
                    )}>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile.location)}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hover:scale-110 transition-transform p-1.5 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm" 
                        title={t('studio.viewOnMap')}
                      >
                        <FaMapMarkerAlt className="w-4 h-4 sm:w-4 sm:h-4 shrink-0 text-white" />
                      </a>
                      <p className="text-sm sm:text-base lg:text-lg text-white/90 truncate whitespace-nowrap ml-1">
                        {profile.location}
                      </p>
                    </div>
                  )}

                  <div className={cn(
                    "flex items-center gap-2 w-full max-w-full",
                    textAlign === 'left' ? "justify-start" : textAlign === 'right' ? "justify-end" : "justify-center"
                  )}>
                    <a 
                      href={`/cv/${user?.uid}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:scale-110 transition-transform p-1.5 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm" 
                      title={t('studio.viewCV')}
                    >
                      <FaFileAlt className="w-4 h-4 sm:w-4 sm:h-4 shrink-0 text-white" />
                    </a>
                    <p className="text-sm sm:text-base lg:text-lg text-white/90 truncate whitespace-nowrap ml-1">
                      {t('studio.myCV')}
                    </p>
                  </div>

                  {/* Social Links */}
                  {profile.socialLinks && Object.values(profile.socialLinks).some(link => link) && (
                    <div className={cn(
                      "flex flex-wrap items-center gap-2 w-full max-w-full mt-1",
                      textAlign === 'left' ? "justify-start" : textAlign === 'right' ? "justify-end" : "justify-center"
                    )}>
                      {profile.socialLinks.linkedin && (
                        <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm" title="LinkedIn">
                          <FaLinkedin className="w-4 h-4 text-white" />
                        </a>
                      )}
                      {profile.socialLinks.github && (
                        <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm" title="GitHub">
                          <FaGithub className="w-4 h-4 text-white" />
                        </a>
                      )}
                      {profile.socialLinks.twitter && (
                        <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm" title="Twitter / X">
                          <FaXTwitter className="w-4 h-4 text-white" />
                        </a>
                      )}
                      {profile.socialLinks.website && (
                        <a href={profile.socialLinks.website} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm" title={t('studio.website')}>
                          <FaGlobe className="w-4 h-4 text-white" />
                        </a>
                      )}
                      {profile.socialLinks.telegram && (
                        <a href={profile.socialLinks.telegram.startsWith('http') ? profile.socialLinks.telegram : `https://t.me/${profile.socialLinks.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm" title="Telegram">
                          <FaTelegramPlane className="w-4 h-4 text-white" />
                        </a>
                      )}
                      {profile.socialLinks.skype && (
                        <a href={`skype:${profile.socialLinks.skype}?chat`} className="hover:scale-110 transition-transform p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm" title="Skype">
                          <FaSkype className="w-4 h-4 text-white" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
              </>
            )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
