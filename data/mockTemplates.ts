import { Template } from '../types';

export interface MockTemplate extends Template {
    rating: number;
    ratingsCount: number;
    author: string;
    preview_image: string;
}

export const mockTemplates: MockTemplate[] = [
  {
    id: '1',
    name: '🎮 Racing Game Template',
    description: 'A complete starter kit for a Roblox racing game with physics, a track, and a simple UI.',
    category: 'Game',
    tags: ['roblox', 'racing', 'game', 'physics'],
    files: {},
    preview_image: 'https://images.unsplash.com/photo-1599409333945-96e6a82772b4?q=80&w=600&auto=format&fit=crop',
    created_by: 'user-id-1',
    author: 'alex_dev',
    status: 'approved',
    downloads: 2345,
    stars: 45,
    created_at: new Date('2024-05-10T10:00:00Z').toISOString(),
    rating: 4.8,
    ratingsCount: 127
  },
  {
    id: '2',
    name: '📊 CRM Dashboard Template',
    description: 'A responsive dashboard for managing customer relationships, built with React and Chart.js.',
    category: 'App',
    tags: ['react', 'dashboard', 'crm', 'chartjs'],
    files: {},
    preview_image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop',
    created_by: 'user-id-2',
    author: 'sarah_codes',
    status: 'approved',
    downloads: 1890,
    stars: 123,
    created_at: new Date('2024-05-20T14:30:00Z').toISOString(),
    rating: 4.9,
    ratingsCount: 89,
  },
  {
    id: '3',
    name: '🌐 Portfolio Website Template',
    description: 'A sleek, modern, and fully responsive portfolio website template for developers and designers.',
    category: 'Website',
    tags: ['portfolio', 'website', 'responsive', 'webdev'],
    files: {},
    preview_image: 'https://images.unsplash.com/photo-1531403009284-440993d21634?q=80&w=600&auto=format&fit=crop',
    created_by: 'user-id-3',
    author: 'john_builder',
    status: 'approved',
    downloads: 5412,
    stars: 256,
    created_at: new Date('2024-04-28T09:00:00Z').toISOString(),
    rating: 4.7,
    ratingsCount: 215,
  },
  {
    id: '4',
    name: '📘 User Authentication Blueprint',
    description: 'Complete guide to Supabase auth for Roblox games, including secure data handling and session management.',
    category: 'Blueprint',
    tags: ['supabase', 'auth', 'roblox', 'security'],
    files: {},
    preview_image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=600&auto=format&fit=crop',
    created_by: 'user-id-2',
    author: 'sarah_codes',
    status: 'approved',
    downloads: 980,
    stars: 78,
    created_at: new Date('2024-05-15T18:00:00Z').toISOString(),
    rating: 5.0,
    ratingsCount: 42,
  },
];