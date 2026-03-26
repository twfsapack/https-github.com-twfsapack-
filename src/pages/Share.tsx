import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Copy, Check, ExternalLink, Globe, FileText, Smartphone } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useLanguage } from '../contexts/LanguageContext';

export const Share: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [copiedPortfolio, setCopiedPortfolio] = useState(false);
  const [copiedCV, setCopiedCV] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);

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

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">{t('share.title')}</h1>
        <p className="text-zinc-600 mt-1">{t('share.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Digital Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex flex-col md:col-span-2 lg:col-span-2">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div className="flex-1 w-full">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900 mb-2">{t('share.card')}</h2>
              <p className="text-sm text-zinc-600 mb-6">
                {t('share.cardDesc')}
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <span className="text-sm text-zinc-500 truncate flex-1 select-all">{cardUrl}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(cardUrl, 'card')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    {copiedCard ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedCard ? t('share.copied') : t('share.copy')}
                  </button>
                  <a
                    href={cardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t('share.open')}
                  </a>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-zinc-50 rounded-xl border border-zinc-200 shrink-0">
              <div className="bg-white p-3 rounded-xl shadow-sm mb-3">
                <QRCode 
                  value={cardUrl}
                  size={150}
                  level="H"
                />
              </div>
              <p className="text-xs font-medium text-zinc-500 text-center">{t('share.scanQR')}</p>
            </div>
          </div>
        </div>

        {/* Portfolio Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex flex-col">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
            <Globe className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">{t('share.portfolio')}</h2>
          <p className="text-sm text-zinc-600 mb-6 flex-1">
            {t('share.portfolioDesc')}
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
              <span className="text-sm text-zinc-500 truncate flex-1 select-all">{portfolioUrl}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(portfolioUrl, 'portfolio')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
              >
                {copiedPortfolio ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedPortfolio ? t('share.copied') : t('share.copy')}
              </button>
              <a
                href={portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                {t('share.open')}
              </a>
            </div>
          </div>
        </div>

        {/* CV Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex flex-col">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">{t('share.cv')}</h2>
          <p className="text-sm text-zinc-600 mb-6 flex-1">
            {t('share.cvDesc')}
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
              <span className="text-sm text-zinc-500 truncate flex-1 select-all">{cvUrl}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(cvUrl, 'cv')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
              >
                {copiedCV ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedCV ? t('share.copied') : t('share.copy')}
              </button>
              <a
                href={cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                {t('share.open')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
