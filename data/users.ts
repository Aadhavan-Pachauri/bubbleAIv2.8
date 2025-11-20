import { Profile } from '../types';

export const mockProfiles: Profile[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    roblox_id: '98765432',
    roblox_username: 'Dev User',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
    role: 'admin',
    status: 'active',
    // FIX: Add missing properties to satisfy Profile type
    credits: 9999,
    membership: 'admin',
    preferred_image_model: 'imagen_3',
    preferred_chat_model: 'gemini_2.5_flash',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    roblox_id: '12345678',
    roblox_username: 'Koslox',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
    role: 'user',
    status: 'active',
    // FIX: Add missing properties to satisfy Profile type
    credits: 150,
    membership: 'pro',
    preferred_image_model: 'nano_banana',
    preferred_chat_model: 'gemini_2.5_flash',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    roblox_id: '87654321',
    roblox_username: 'DeforsonDevYT',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
    role: 'user',
    status: 'banned',
    // FIX: Add missing properties to satisfy Profile type
    credits: 0,
    membership: 'na',
    preferred_image_model: 'nano_banana',
    preferred_chat_model: 'gemini_1.5_flash',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    roblox_id: '11223344',
    roblox_username: 'xanderll_2009',
    avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
    role: 'user',
    status: 'active',
    // FIX: Add missing properties to satisfy Profile type
    credits: 75,
    membership: 'na',
    preferred_image_model: 'imagen_2',
    preferred_chat_model: 'gemini_2.5_flash',
  },
   {
    id: '55555555-5555-5555-5555-555555555555',
    roblox_id: '55667788',
    roblox_username: 'Creator_01',
    avatar_url: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
    role: 'user',
    status: 'active',
    // FIX: Add missing properties to satisfy Profile type
    credits: 500,
    membership: 'max',
    preferred_image_model: 'imagen_3',
    preferred_chat_model: 'gemini_2.5_flash',
  },
];