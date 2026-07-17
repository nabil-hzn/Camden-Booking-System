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
    clinicName: 'Jenkins Family Clinic',
    unitNumber: '#04-12',
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
    clinicName: 'Scott Wellness Clinic',
    unitNumber: '#02-08',
    createdAt: new Date().toISOString(),
    isSimulated: true,
  },

  // Lounge bookings (Panorama Deck)
  {
    id: 'seed-lounge-1',
    roomId: 'lounge-1',
    date: getRelativeDate(0),
    slot: '10:00',
    durationMinutes: 240,
    userEmail: 'alice.c@company.com',
    clinicName: 'Chen Dental Practice',
    contactNo: '9123 4567',
    description: 'Catching up with the design team over cold brew.',
    createdAt: new Date().toISOString(),
    isSimulated: true,
  },
  {
    id: 'seed-lounge-3',
    roomId: 'lounge-1',
    date: getRelativeDate(0),
    slot: '15:00',
    durationMinutes: 240,
    userEmail: 'emily.b@company.com',
    clinicName: 'Blunt Family Practice',
    contactNo: '9345 6789',
    description: 'Welcome chats for our new engineering recruits.',
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
    clinicName: 'CEO Office Clinic Partners',
    contactNo: '6123 4567',
    description: 'Board presentation for external stakeholders. Need HDMI setup pre-checked.',
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
    clinicName: 'Honnold Health Associates',
    contactNo: '9456 7890',
    description: 'Scrum brainstorming for Q3 product roadmap.',
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
    clinicName: 'Wilde Wellness Clinic',
    unitNumber: '#03-15',
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
    clinicName: 'HR Recruiting Partners',
    contactNo: '6234 5678',
    description: 'Final round technical interview for Lead Backend Engineer.',
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
    clinicName: 'Finance Lead Consultancy',
    contactNo: '6345 6789',
    description: 'Monthly expenses review.',
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
    clinicName: 'Jenkins Family Clinic',
    unitNumber: '#04-12',
    createdAt: new Date().toISOString(),
    isSimulated: true,
  },
  {
    id: 'seed-lounge-hist',
    roomId: 'lounge-1',
    date: getRelativeDate(-1),
    slot: '11:00',
    durationMinutes: 240,
    userEmail: 'david.m@company.com',
    clinicName: 'Miller Medical Group',
    contactNo: '8234 5678',
    description: 'Coffee with prospective intern.',
    createdAt: new Date().toISOString(),
    isSimulated: true,
  },
];
