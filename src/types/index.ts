export interface User {
  uid: string;
  email: string;
  createdAt: string;
}

export interface Profile {
  uid: string;
  fullName?: string;
  title?: string;
  bio?: string;
  avatarUrl?: string;
  phone?: string;
  email?: string;
  location?: string;
  allowPdfDownload?: boolean;
  isPremium?: boolean;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    website?: string;
    telegram?: string;
    skype?: string;
  };
  createdAt: string;
  updatedAt: string;
  studio?: {
    orientation?: 'horizontal' | 'vertical';
    textAlign?: 'left' | 'center' | 'right';
    bgColor?: string;
    customBgImage?: string | null;
    generatedImage?: string | null;
  };
}

export interface Experience {
  id: string;
  userId: string;
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description?: string;
  location?: string;
  order?: number;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  role?: string;
  url?: string;
  imageUrl?: string;
  imageUrls?: string[];
  location?: string;
  order?: number;
}

export interface Skill {
  id: string;
  userId: string;
  name: string;
  category: 'technical' | 'soft' | 'tools';
  order?: number;
}

export interface Certificate {
  id: string;
  userId: string;
  name: string;
  issuer: string;
  date?: string;
  imageUrl?: string;
  url?: string;
  order?: number;
}

export interface CardDesign {
  userId: string;
  prompt?: string;
  layout?: 'horizontal' | 'vertical';
  theme?: string;
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  updatedAt: string;
}
