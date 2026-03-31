import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Copy, Check, ExternalLink, Globe, FileText, Smartphone, Download, Share2, Linkedin, Twitter, MessageCircle } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useLanguage } from '../contexts/LanguageContext';

export const Share: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [copiedPortfolio, setCopiedPortfolio] = useState(false);
  const [copiedCV, setCopiedCV] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  if (!user) return null;

  const portfolioUrl = `${window.location.origin}/portfolio/${user.uid}`;
  const cvUrl = `${window.location.origin}/cv/${user.uid}`;
  const cardUrl = `${window.location.origin}/card/${user.uid}`;

  const handleCopy = async (url: string, type: 'portfolio' | 'cv' | 'card') => {
    try {
      await navigator.clipboard.writeText(url);
      if (type === 'portfolio') {
        setCopiedPortfolio(true);
        setTimeout(() => setCopiedPortfolio(false), 2000);
      } else if (type === 'cv') {
        setCopiedCV(true);
        setTimeout(() => setCopiedCV(false), 2000);
      } else {
        setCopiedCard(true);
        setTimeout(() => setCopiedCard(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `qr-code-${user.uid}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const shareToSocial = (platform: 'linkedin' | 'twitter' | 'whatsapp', url: string) => {
    const text = "Check out my professional profile!";
    let shareUrl = '';
    
    switch (platform) {
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const SocialShare = ({ url }: { url: string }) => (
    <div className="pt-6 mt-6 border-t border-zinc-100">
      <p className="text-sm font-medium text-zinc-500 mb-3">Share directly to</p>
      <div className="flex gap-3">
        <button onClick={() => shareToSocial('linkedin', url)} className="p-3 bg-[#0A66C2]/10 text-[#0A66C2] rounded-xl hover:bg-[#0A66C2]/20 transition-colors" title="Share to LinkedIn">
          <Linkedin className="w-5 h-5" />
        </button>
        <button onClick={() => shareToSocial('twitter', url)} className="p-3 bg-black/5 text-black rounded-xl hover:bg-black/10 transition-colors" title="Share to X (Twitter)">
          <Twitter className="w-5 h-5" />
        </button>
        <button onClick={() => shareToSocial('whatsapp', url)} className="p-3 bg-[#25D366]/10 text-[#25D366] rounded-xl hover:bg-[#25D366]/20 transition-colors" title="Share to WhatsApp">
          <MessageCircle className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative flex-1 flex flex-col">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      <div className="absolute inset-0 bg-grid-zinc-100 opacity-20 bg-[size:20px_20px] pointer-events-none"></div>
      
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
        {/* Header with gradient background */}
        <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-800 p-8 sm:p-10 text-white shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-indigo-400 opacity-20 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium text-indigo-50 mb-4">
                <Share2 className="w-4 h-4" />
                <span>Share Your Brand</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">{t('share.title')}</h1>
              <p className="text-indigo-100 max-w-xl text-lg">{t('share.subtitle')}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Digital Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm hover:shadow-md border border-zinc-200 flex flex-col md:col-span-2 transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50 transition-opacity group-hover:opacity-100"></div>
            
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
              <div className="flex-1 w-full">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-100 transition-all duration-300 shadow-sm">
                  <Smartphone className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-900 mb-3">{t('share.card')}</h2>
                <p className="text-zinc-600 mb-8 text-lg">
                  {t('share.cardDesc')}
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
                    <span className="text-sm text-zinc-600 truncate flex-1 select-all font-medium">{cardUrl}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleCopy(cardUrl, 'card')}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-zinc-900 text-white text-sm font-semibold rounded-xl hover:bg-zinc-800 transition-colors shadow-sm"
                    >
                      {copiedCard ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      {copiedCard ? t('share.copied') : t('share.copy')}
                    </button>
                    <a
                      href={cardUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-xl hover:bg-indigo-100 transition-colors"
                    >
                      <ExternalLink className="w-5 h-5" />
                      {t('share.open')}
                    </a>
                  </div>
                  
                  <SocialShare url={cardUrl} />
                </div>
              </div>
              
              <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-zinc-50 to-zinc-100/50 rounded-3xl border border-zinc-200 shrink-0 w-full md:w-auto">
                <div className="bg-white p-4 rounded-2xl shadow-sm mb-4" ref={qrRef}>
                  <QRCode 
                    value={cardUrl}
                    size={180}
                    level="H"
                    className="rounded-lg"
                  />
                </div>
                <p className="text-sm font-medium text-zinc-600 text-center mb-4">{t('share.scanQR')}</p>
                <button 
                  onClick={downloadQR}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 text-sm font-medium rounded-lg hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm w-full justify-center"
                >
                  <Download className="w-4 h-4" />
                  Download QR
                </button>
              </div>
            </div>
          </div>

          {/* Portfolio Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm hover:shadow-md border border-zinc-200 flex flex-col transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-50 transition-opacity group-hover:opacity-100"></div>
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-100 transition-all duration-300 shadow-sm">
                <Globe className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 mb-3">{t('share.portfolio')}</h2>
              <p className="text-zinc-600 mb-8 flex-1 text-lg">
                {t('share.portfolioDesc')}
              </p>
              
              <div className="space-y-4 mt-auto">
                <div className="flex items-center gap-3 p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <span className="text-sm text-zinc-600 truncate flex-1 select-all font-medium">{portfolioUrl}</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleCopy(portfolioUrl, 'portfolio')}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-zinc-900 text-white text-sm font-semibold rounded-xl hover:bg-zinc-800 transition-colors shadow-sm"
                  >
                    {copiedPortfolio ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    {copiedPortfolio ? t('share.copied') : t('share.copy')}
                  </button>
                  <a
                    href={portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-xl hover:bg-indigo-100 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                    {t('share.open')}
                  </a>
                </div>
                
                <SocialShare url={portfolioUrl} />
              </div>
            </div>
          </div>

          {/* CV Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm hover:shadow-md border border-zinc-200 flex flex-col transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-50 transition-opacity group-hover:opacity-100"></div>
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-100 transition-all duration-300 shadow-sm">
                <FileText className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 mb-3">{t('share.cv')}</h2>
              <p className="text-zinc-600 mb-8 flex-1 text-lg">
                {t('share.cvDesc')}
              </p>
              
              <div className="space-y-4 mt-auto">
                <div className="flex items-center gap-3 p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <span className="text-sm text-zinc-600 truncate flex-1 select-all font-medium">{cvUrl}</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleCopy(cvUrl, 'cv')}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-zinc-900 text-white text-sm font-semibold rounded-xl hover:bg-zinc-800 transition-colors shadow-sm"
                  >
                    {copiedCV ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    {copiedCV ? t('share.copied') : t('share.copy')}
                  </button>
                  <a
                    href={cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-xl hover:bg-indigo-100 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                    {t('share.open')}
                  </a>
                </div>
                
                <SocialShare url={cvUrl} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
