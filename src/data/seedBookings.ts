import { Booking } from '../types';

const getTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Let's generate seed bookings dynamically for today and surrounding dates
const baseDate = getTodayString();

// Helper to get surrounding dates (e.g. July 14, July 15, July 16, July 17)
const getRelativeDate = (offsetDays: number): string => {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const SEED_BOOKINGS: Booking[] = [
  // --- Selected Base Date: 2026-07-15 ---
  // Nap Room bookings (Snooze Haven)
  {
    id: 'seed-nap-1',
    roomId: 'nap-1',
    date: getRelativeDate(0),
    slot: '09:00',
    durationMinutes: 60,
    userEmail: 'sarah.j@company.com',
    userName: 'Sarah Jenkins',
    purpose: 'Power Nap',
    notes: 'Had a very early flight this morning, need 45m of absolute silence.',
    createdAt: new Date().toISOString(),
    isSimulated: true,
  },
  {
    id: 'seed-nap-2',
    roomId: 'nap-1',
    date: getRelativeDate(0),
    slot: '14:00',
    durationMinutes: 60,
    userEmail: 'michael.s@company.com',
    userName: 'Michael Scott',
    purpose: 'Quiet Meditation',
    notes: 'Need to disconnect before the big budget presentation.',
    createdAt: new Date().toISOString(),
    isSimulated: true,
  },
  
  // Lounge bookings (Panorama Deck)
  {
    id: 'seed-lounge-1',
    roomId: 'lounge-1',
    date: getRelativeDate(0),
    slot: '10:00',
    durationMinutes: 60,
    userEmail: 'alice.c@company.com',
    userName: 'Alice Chen',
    purpose: 'Informal Sync',
    notes: 'Catching up with the design team over cold brew.',
    createdAt: new Date().toISOString(),
    isSimulated: true,
  },
  {
    id: 'seed-lounge-2',
    roomId: 'lounge-1',
    date: getRelativeDate(0),
    slot: '11:00',
    durationMinutes: 60,
    userEmail: 'david.m@company.com',
    userName: 'David Miller',
    purpose: 'Coffee Break',
    notes: 'Coffee with prospective intern.',
    createdAt: new Date().toISOString(),
    isSimulated: true,
  },
  {
    id: 'seed-lounge-3',
    roomId: 'lounge-1',
    date: getRelativeDate(0),
    slot: '15:00',
    durationMinutes: 60,
    userEmail: 'emily.b@company.com',
    userName: 'Emily Blunt',
    purpose: 'Casual Networking',
    notes: 'Welcome chats for our new engineering recruits.',
    createdAt: new Date().toISOString(),
    isSimulated: true,
  },

  // Meeting Room bookings (Summit Room)
  {
    id: 'seed-meet-1',
    roomId: 'meeting-1',
    date: getRelativeDate(0),
    slot: '11:00',
    durationMinutes: 60,
    userEmail: 'ceo.office@company.com',
    userName: 'CEO Office',
    purpose: 'Client Presentation',
    notes: 'Board presentation for external stakeholders. Need HDMI setup pre-checked.',
    createdAt: new Date().toISOString(),
    isSimulated: true,
  },
  {
    id: 'seed-meet-2',
    roomId: 'meeting-1',
    date: getRelativeDate(0),
    slot: '16:00',
    durationMinutes: 60,
    userEmail: 'alex.h@company.com',
    userName: 'Alex Honnold',
    purpose: 'Ideation Session',
    notes: 'Scrum brainstorming for Q3 product roadmap.',
    createdAt: new Date().toISOString(),
    isSimulated: true,
  },

  // --- Next Day: 2026-07-16 ---
  {
    id: 'seed-nap-3',
    roomId: 'nap-1',
    date: getRelativeDate(1),
    slot: '13:00',
    durationMinutes: 60,
    userEmail: 'olivia.w@company.com',
    userName: 'Olivia Wilde',
    purpose: 'Power Nap',
    notes: 'Recharging energy levels.',
    createdAt: new Date().toISOString(),
    isSimulated: true,
  },
  {
    id: 'seed-meet-3',
    roomId: 'meeting-1',
    date: getRelativeDate(1),
    slot: '10:00',
    durationMinutes: 60,
    userEmail: 'hr.recruiting@company.com',
    userName: 'HR Recruiting',
    purpose: 'Technical Interview',
    notes: 'Final round technical interview for Lead Backend Engineer.',
    createdAt: new Date().toISOString(),
    isSimulated: true,
  },
  {
    id: 'seed-meet-4',
    roomId: 'meeting-1',
    date: getRelativeDate(1),
    slot: '14:00',
    durationMinutes: 60,
    userEmail: 'finance.lead@company.com',
    userName: 'Finance Lead',
    purpose: 'Team Huddle',
    notes: 'Monthly expenses review.',
    createdAt: new Date().toISOString(),
    isSimulated: true,
  },

  // --- Previous Day: 2026-07-14 (Historical stats) ---
  {
    id: 'seed-nap-hist',
    roomId: 'nap-1',
    date: getRelativeDate(-1),
    slot: '15:00',
    durationMinutes: 60,
    userEmail: 'sarah.j@company.com',
    userName: 'Sarah Jenkins',
    purpose: 'Power Nap',
    createdAt: new Date().toISOString(),
    isSimulated: true,
  },
  {
    id: 'seed-lounge-hist',
    roomId: 'lounge-1',
    date: getRelativeDate(-1),
    slot: '11:00',
    durationMinutes: 60,
    userEmail: 'david.m@company.com',
    userName: 'David Miller',
    purpose: 'Coffee Break',
    createdAt: new Date().toISOString(),
    isSimulated: true,
  },
];
