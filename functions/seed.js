// One-off local script to seed the Firestore "bookings" collection with demo data.
// Run with: node seed.js  (uses gcloud Application Default Credentials)
const { Firestore } = require('@google-cloud/firestore');

const firestore = new Firestore({ projectId: 'plg-ai-dev', databaseId: 'cmscheduler' });
const bookingsCollection = firestore.collection('bookings');

const getTodayString = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

const baseDate = getTodayString();
const getRelativeDate = (offsetDays) => {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

const SEED_BOOKINGS = [
  { roomId: 'nap-1', date: getRelativeDate(0), slot: '09:00', durationMinutes: 60, userEmail: 'sarah.j@company.com', clinicName: 'Jenkins Family Clinic', unitNumber: '#04-12' },
  { roomId: 'nap-1', date: getRelativeDate(0), slot: '14:00', durationMinutes: 60, userEmail: 'michael.s@company.com', clinicName: 'Scott Wellness Clinic', unitNumber: '#02-08' },
  { roomId: 'lounge-1', date: getRelativeDate(0), slot: '10:00', durationMinutes: 240, userEmail: 'alice.c@company.com', clinicName: 'Chen Dental Practice', contactNo: '9123 4567', description: 'Catching up with the design team over cold brew.', hasCatering: true },
  { roomId: 'lounge-1', date: getRelativeDate(0), slot: '15:00', durationMinutes: 240, userEmail: 'emily.b@company.com', clinicName: 'Blunt Family Practice', contactNo: '9345 6789', description: 'Welcome chats for our new engineering recruits.', hasCatering: false },
  { roomId: 'meeting-1', date: getRelativeDate(0), slot: '11:00', durationMinutes: 60, userEmail: 'ceo.office@company.com', clinicName: 'CEO Office Clinic Partners', contactNo: '6123 4567', description: 'Board presentation for external stakeholders. Need HDMI setup pre-checked.' },
  { roomId: 'meeting-1', date: getRelativeDate(0), slot: '16:00', durationMinutes: 60, userEmail: 'alex.h@company.com', clinicName: 'Honnold Health Associates', contactNo: '9456 7890', description: 'Scrum brainstorming for Q3 product roadmap.' },
  { roomId: 'nap-1', date: getRelativeDate(1), slot: '13:00', durationMinutes: 60, userEmail: 'olivia.w@company.com', clinicName: 'Wilde Wellness Clinic', unitNumber: '#03-15' },
  { roomId: 'meeting-1', date: getRelativeDate(1), slot: '10:00', durationMinutes: 60, userEmail: 'hr.recruiting@company.com', clinicName: 'HR Recruiting Partners', contactNo: '6234 5678', description: 'Final round technical interview for Lead Backend Engineer.' },
  { roomId: 'meeting-1', date: getRelativeDate(1), slot: '14:00', durationMinutes: 60, userEmail: 'finance.lead@company.com', clinicName: 'Finance Lead Consultancy', contactNo: '6345 6789', description: 'Monthly expenses review.' },
  { roomId: 'nap-1', date: getRelativeDate(-1), slot: '15:00', durationMinutes: 60, userEmail: 'sarah.j@company.com', clinicName: 'Jenkins Family Clinic', unitNumber: '#04-12' },
  { roomId: 'lounge-1', date: getRelativeDate(-1), slot: '11:00', durationMinutes: 240, userEmail: 'david.m@company.com', clinicName: 'Miller Medical Group', contactNo: '8234 5678', description: 'Coffee with prospective intern.', hasCatering: false },
];

async function seed() {
  const existing = await bookingsCollection.limit(1).get();
  if (!existing.empty) {
    console.log('Bookings collection already has data. Skipping seed.');
    return;
  }

  const batch = firestore.batch();
  for (const booking of SEED_BOOKINGS) {
    const ref = bookingsCollection.doc();
    batch.set(ref, {
      ...booking,
      unitNumber: booking.unitNumber || null,
      contactNo: booking.contactNo || null,
      description: booking.description || null,
      hasCatering: typeof booking.hasCatering === 'boolean' ? booking.hasCatering : null,
      createdAt: new Date().toISOString(),
    });
  }
  await batch.commit();
  console.log(`Seeded ${SEED_BOOKINGS.length} bookings.`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
