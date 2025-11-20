

import { Project } from '../types';

// This ID must match the mock user ID in AuthContext.tsx when DEV_BYPASS_LOGIN is true
const MOCK_USER_ID = '11111111-1111-1111-1111-111111111111';

const now = new Date();

const oneDayAgo = new Date(now);
oneDayAgo.setDate(now.getDate() - 1);

const fiveDaysAgo = new Date(now);
fiveDaysAgo.setDate(now.getDate() - 5);

const twoWeeksAgo = new Date(now);
twoWeeksAgo.setDate(now.getDate() - 14);

export const mockProjects: Project[] = [
  {
    id: '1',
    user_id: MOCK_USER_ID,
    name: 'My First Game',
    description: 'A simple obby game to learn the basics of Roblox development.',
    status: 'In Progress',
    platform: 'Roblox Studio',
    // FIX: Added missing project_type property.
    project_type: 'roblox_game',
    default_model: 'gemini-2.5-flash',
    updated_at: oneDayAgo.toISOString(),
    created_at: twoWeeksAgo.toISOString(),
  },
  {
    id: '2',
    user_id: MOCK_USER_ID,
    name: 'RPG Framework',
    description: 'A complex RPG system with inventory, quests, and combat.',
    status: 'In Progress',
    platform: 'Roblox Studio',
    // FIX: Added missing project_type property.
    project_type: 'roblox_game',
    default_model: 'gemini-2.5-flash',
    updated_at: fiveDaysAgo.toISOString(),
    created_at: fiveDaysAgo.toISOString(),
  },
  {
    id: '3',
    user_id: MOCK_USER_ID,
    name: 'Shooter Test',
    description: 'Testing advanced weapon mechanics and networking.',
    status: 'Archived',
    platform: 'Roblox Studio',
    // FIX: Added missing project_type property.
    project_type: 'roblox_game',
    default_model: 'gemini-2.5-flash',
    updated_at: twoWeeksAgo.toISOString(),
    created_at: twoWeeksAgo.toISOString(),
  },
];