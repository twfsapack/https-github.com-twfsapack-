import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { User, Briefcase, Download, Loader2, Share2 } from 'lucide-react';
import QRCode from 'react-qr-code';
import { FaPhoneAlt, FaWhatsapp, FaEnvelope, FaMapMarkerAlt, FaFileAlt, FaLinkedin, FaGithub, FaGlobe, FaTelegramPlane, FaSkype } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../components/Layout';
import { AIAssistant } from '../components/AIAssistant';

export const PublicCard: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showQR, setShowQR] = useState(false);

  const { t } = useLanguage();

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
          setProfile({ id: profileSnap.id, ...profileSnap.data() });
        } else {
          setError(t('profileNotFound'));
        }
      } catch (err) {
        console.error("Error fetching Card data:", err);
        setError(t('errorLoadingCard'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const handleSaveContact = () => {
    if (!profile) return;
    
    // Create vCard
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${profile.fullName || ''}
TITLE:${profile.title || ''}
TEL;TYPE=CELL:${profile.phone || ''}
EMAIL:${profile.email || ''}
URL:${window.location.origin}/portfolio/${userId}
END:VCARD`;

    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.fullName?.replace(/\s+/g, '_') || t('contact')}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-white" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
        <div className="bg-zinc-800 p-8 rounded-2xl shadow-sm border border-zinc-700 text-center max-w-md w-full">
          <h2 className="text-2xl font-bold text-white mb-2">{t('oops')}</h2>
          <p className="text-zinc-400">{error || t('errorLoadingCard')}</p>
        </div>
      </div>
    );
  }

  const studio = profile.studio || {};
  const orientation = studio.orientation || 'vertical';
  const textAlign = studio.textAlign || 'center';
  const bgColor = studio.bgColor || '#18181b';
  const customBgImage = studio.customBgImage || '';
  const generatedImage = studio.generatedImage || '';

  const bumpFontSizeForDesktop = (sizeClass: string) => {
    const map: Record<string, string> = {
      'sm:text-sm': 'sm:text-base',
      'sm:text-base': 'sm:text-lg',
      'sm:text-lg': 'sm:text-xl',
      'sm:text-xl': 'sm:text-2xl',
      'sm:text-2xl': 'sm:text-3xl',
      'sm:text-3xl': 'sm:text-4xl',
      'sm:text-4xl': 'sm:text-5xl',
      'lg:text-base': 'lg:text-lg',
      'lg:text-lg': 'lg:text-xl',
      'lg:text-xl': 'lg:text-2xl',
      'lg:text-2xl': 'lg:text-3xl',
      'lg:text-3xl': 'lg:text-4xl',
      'lg:text-4xl': 'lg:text-5xl',
      'lg:text-5xl': 'lg:text-6xl',
    };
    return sizeClass.split(' ').map(cls => map[cls] || cls).join(' ');
  };

  const headerFontSize = bumpFontSizeForDesktop(studio.headerFontSize || 'text-xl sm:text-2xl lg:text-3xl');
  const bodyFontSize = bumpFontSizeForDesktop(studio.bodyFontSize || 'text-sm sm:text-base lg:text-lg');

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 sm:p-8">
      <div 
        className={cn(
          "w-full min-h-[100dvh] sm:min-h-0 sm:h-auto flex flex-col items-center justify-center text-white p-6 sm:p-14 relative overflow-hidden shadow-2xl sm:border border-zinc-800",
          orientation === 'horizontal' ? "sm:aspect-[16/9] max-w-[920px] sm:rounded-3xl" : "sm:aspect-[9/16] max-w-[460px] sm:rounded-[2.2rem]",
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
              orientation === 'horizontal' ? "w-32 sm:w-40 md:w-48" : "w-48 sm:w-56 md:w-64"
            )}>
              <QRCode 
                value={`${window.location.origin}/card/${userId}`}
                size={256}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                level="H"
              />
            </div>
            <p className={cn(
              "text-zinc-800 font-medium text-center",
              orientation === 'horizontal' ? "mt-4 text-sm" : "mt-6 text-base"
            )}>
              {t('studio.scanQR')}
            </p>
          </div>
        ) : (
          <>
            {(generatedImage || customBgImage) && (
              <img src={generatedImage || customBgImage} alt="Background" className="absolute inset-0 w-full h-full object-cover z-0" />
            )}
            
            {/* Overlay Content */}
            <div className={cn(
              "relative z-10 flex flex-col justify-center w-full max-w-full px-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]",
              textAlign === 'left' ? "items-start" : textAlign === 'right' ? "items-end" : "items-center"
            )}>
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className={cn("w-24 h-24 sm:w-40 sm:h-40 rounded-full object-cover border-2 border-white/30 mb-6 shadow-xl", textAlign === 'left' ? "self-start" : textAlign === 'right' ? "self-end" : "self-center")} />
              ) : (
                <div className={cn("w-24 h-24 sm:w-40 sm:h-40 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/30 mb-6 shadow-xl flex items-center justify-center", textAlign === 'left' ? "self-start" : textAlign === 'right' ? "self-end" : "self-center")}>
                  <User className="w-12 h-12 sm:w-16 sm:h-16 text-white/50" />
                </div>
              )}
      
          <div className={cn(
            "flex flex-col gap-3 sm:gap-4 w-full",
            textAlign === 'left' ? "items-start" : textAlign === 'right' ? "items-end" : "items-center"
          )}>
            <div className={cn(
              "flex items-center gap-2 w-full max-w-full",
              textAlign === 'left' ? "justify-start" : textAlign === 'right' ? "justify-end" : "justify-center"
            )}>
              <User className="w-6 h-6 sm:w-8 sm:h-8 shrink-0 text-white/80" />
              <h1 className={cn(
                headerFontSize,
                "font-bold tracking-tight break-words min-w-0",
                textAlign === 'left' ? "text-left" : textAlign === 'right' ? "text-right" : "text-center"
              )}>
                {profile.fullName || t('yourName')}
              </h1>
            </div>
            
            <div className={cn(
              "flex items-center gap-2 w-full max-w-full",
              textAlign === 'left' ? "justify-start" : textAlign === 'right' ? "justify-end" : "justify-center"
            )}>
              <Briefcase className="w-5 h-5 sm:w-7 sm:h-7 shrink-0 text-white/80" />
              <p className={cn(
                bodyFontSize, 
                "text-white/90 break-words min-w-0",
                textAlign === 'left' ? "text-left" : textAlign === 'right' ? "text-right" : "text-center"
              )}>
                {profile.title || t('yourTitle')}
              </p>
            </div>

            <div className={cn(
              "flex items-center gap-2 w-full max-w-full",
              textAlign === 'left' ? "justify-start" : textAlign === 'right' ? "justify-end" : "justify-center"
            )}>
              <a 
                href={`tel:${profile.phone?.replace(/\D/g, '')}`} 
                className="hover:scale-110 transition-transform p-2 sm:p-2.5 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm" 
                title={t('call')}
              >
                <FaPhoneAlt className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-white" />
              </a>
              <a 
                href={`https://wa.me/${profile.phone?.replace(/\D/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:scale-110 transition-transform p-2 sm:p-2.5 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm" 
                title={t('whatsapp')}
              >
                <FaWhatsapp className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-white" />
              </a>
              <p className={cn(
                bodyFontSize, 
                "text-white/90 break-words min-w-0 ml-1",
                textAlign === 'left' ? "text-left" : textAlign === 'right' ? "text-right" : "text-center"
              )}>
                {profile.phone || t('yourPhone')}
              </p>
            </div>

            <div className={cn(
              "flex items-center gap-2 w-full max-w-full",
              textAlign === 'left' ? "justify-start" : textAlign === 'right' ? "justify-end" : "justify-center"
            )}>
              <a 
                href={`mailto:${profile.email}`} 
                className="hover:scale-110 transition-transform p-2 sm:p-2.5 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm" 
                title={t('sendEmail')}
              >
                <FaEnvelope className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-white" />
              </a>
              <p className={cn(
                bodyFontSize, 
                "text-white/90 break-words min-w-0 ml-1",
                textAlign === 'left' ? "text-left" : textAlign === 'right' ? "text-right" : "text-center"
              )}>
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
                  className="hover:scale-110 transition-transform p-2 sm:p-2.5 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm" 
                  title={t('viewOnMap')}
                >
                  <FaMapMarkerAlt className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-white" />
                </a>
                <p className={cn(
                  bodyFontSize, 
                  "text-white/90 break-words min-w-0 ml-1",
                  textAlign === 'left' ? "text-left" : textAlign === 'right' ? "text-right" : "text-center"
                )}>
                  {profile.location}
                </p>
              </div>
            )}

            <div className={cn(
              "flex items-center gap-2 w-full max-w-full",
              textAlign === 'left' ? "justify-start" : textAlign === 'right' ? "justify-end" : "justify-center"
            )}>
              <a 
                href={`/cv/${userId}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:scale-110 transition-transform p-2 sm:p-2.5 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm" 
                title={t('viewCV')}
              >
                <FaFileAlt className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-white" />
              </a>
              <p className={cn(
                bodyFontSize, 
                "text-white/90 break-words min-w-0 ml-1",
                textAlign === 'left' ? "text-left" : textAlign === 'right' ? "text-right" : "text-center"
              )}>
                {t('myCV')}
              </p>
            </div>

            {/* Social Links */}
            {profile.socialLinks && Object.values(profile.socialLinks).some(link => link) && (
              <div className={cn(
                "flex flex-wrap items-center gap-3 w-full max-w-full mt-2",
                textAlign === 'left' ? "justify-start" : textAlign === 'right' ? "justify-end" : "justify-center"
              )}>
                {profile.socialLinks.linkedin && (
                  <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform p-2.5 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm" title="LinkedIn">
                    <FaLinkedin className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </a>
                )}
                {profile.socialLinks.github && (
                  <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform p-2.5 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm" title="GitHub">
                    <FaGithub className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </a>
                )}
                {profile.socialLinks.twitter && (
                  <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform p-2.5 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm" title="Twitter / X">
                    <FaXTwitter className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </a>
                )}
                {profile.socialLinks.website && (
                  <a href={profile.socialLinks.website} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform p-2.5 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm" title={t('website')}>
                    <FaGlobe className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </a>
                )}
                {profile.socialLinks.telegram && (
                  <a href={profile.socialLinks.telegram.startsWith('http') ? profile.socialLinks.telegram : `https://t.me/${profile.socialLinks.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform p-2.5 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm" title="Telegram">
                    <FaTelegramPlane className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </a>
                )}
                {profile.socialLinks.skype && (
                  <a href={`skype:${profile.socialLinks.skype}?chat`} className="hover:scale-110 transition-transform p-2.5 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm" title="Skype">
                    <FaSkype className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </a>
                )}
              </div>
            )}
          </div>
          
          {/* Save Contact Button */}
          <div className={cn(
            "mt-8 w-full flex",
            textAlign === 'left' ? "justify-start" : textAlign === 'right' ? "justify-end" : "justify-center"
          )}>
            <button
              onClick={handleSaveContact}
              className="flex items-center gap-2 px-6 py-3 bg-white text-zinc-900 font-bold rounded-full hover:bg-zinc-100 transition-colors shadow-lg"
            >
              <Download className="w-5 h-5" />
              {t('saveContact')}
            </button>
          </div>
        </div>
        </>
        )}
      </div>
      {userId && <AIAssistant userId={userId} />}
    </div>
  );
};
