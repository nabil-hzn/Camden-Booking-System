const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');

const DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || 'cmscheduler';
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(';')
  .map((o) => o.trim())
  .filter(Boolean);

const firestore = new Firestore({ databaseId: DATABASE_ID });
const oauthClient = new OAuth2Client(CLIENT_ID);
const bookingsCollection = firestore.collection('bookings');

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Vary', 'Origin');
}

async function verifyToken(req) {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) return null;
  try {
    const ticket = await oauthClient.verifyIdToken({ idToken: match[1], audience: CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) return null;
    return { email: payload.email, name: payload.name || payload.email };
  } catch (err) {
    return null;
  }
}

const toMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

// Strip contact/clinic details from bookings that don't belong to the requester,
// so one user's Firestore read never leaks another clinic's contact info.
function toClientView(doc, requesterEmail) {
  const data = doc.data();
  if (data.userEmail === requesterEmail) {
    return { id: doc.id, ...data };
  }
  return {
    id: doc.id,
    roomId: data.roomId,
    date: data.date,
    slot: data.slot,
    durationMinutes: data.durationMinutes,
  };
}

exports.api = async (req, res) => {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  const user = await verifyToken(req);
  if (!user) {
    res.status(401).json({ error: 'Missing or invalid authentication token.' });
    return;
  }

  const path = req.path.replace(/\/+$/, '') || '/';
  const segments = path.split('/').filter(Boolean);

  try {
    if (segments[0] !== 'bookings') {
      res.status(404).json({ error: 'Not found.' });
      return;
    }

    if (req.method === 'GET' && segments.length === 1) {
      const snapshot = await bookingsCollection.orderBy('date').orderBy('slot').get();
      const bookings = snapshot.docs.map((doc) => toClientView(doc, user.email));
      res.status(200).json({ bookings });
      return;
    }

    if (req.method === 'POST' && segments.length === 1) {
      const body = req.body || {};
      const required = ['roomId', 'date', 'slot', 'durationMinutes', 'clinicName'];
      for (const field of required) {
        if (!body[field]) {
          res.status(400).json({ error: `Missing required field: ${field}` });
          return;
        }
      }

      const existingSnapshot = await bookingsCollection
        .where('roomId', '==', body.roomId)
        .where('date', '==', body.date)
        .get();

      const newStart = toMinutes(body.slot);
      const newEnd = newStart + Number(body.durationMinutes);
      const conflict = existingSnapshot.docs.some((doc) => {
        const b = doc.data();
        const start = toMinutes(b.slot);
        const end = start + b.durationMinutes;
        return newStart < end && start < newEnd;
      });

      if (conflict) {
        res.status(409).json({ error: 'This slot overlaps with an existing booking.' });
        return;
      }

      const newBooking = {
        roomId: body.roomId,
        date: body.date,
        slot: body.slot,
        durationMinutes: Number(body.durationMinutes),
        userEmail: user.email,
        clinicName: String(body.clinicName),
        unitNumber: body.unitNumber ? String(body.unitNumber) : null,
        contactNo: body.contactNo ? String(body.contactNo) : null,
        description: body.description ? String(body.description) : null,
        hasCatering: typeof body.hasCatering === 'boolean' ? body.hasCatering : null,
        createdAt: new Date().toISOString(),
      };

      const docRef = await bookingsCollection.add(newBooking);
      res.status(201).json({ id: docRef.id, ...newBooking });
      return;
    }

    if (req.method === 'DELETE' && segments.length === 2) {
      const bookingId = segments[1];
      const docRef = bookingsCollection.doc(bookingId);
      const doc = await docRef.get();
      if (!doc.exists) {
        res.status(404).json({ error: 'Booking not found.' });
        return;
      }
      if (doc.data().userEmail !== user.email) {
        res.status(403).json({ error: 'You can only cancel your own bookings.' });
        return;
      }
      await docRef.delete();
      res.status(200).json({ id: bookingId });
      return;
    }

    res.status(404).json({ error: 'Not found.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
