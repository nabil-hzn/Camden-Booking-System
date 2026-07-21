const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const { OAuth2Client } = require('google-auth-library');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(';')
  .map((o) => o.trim())
  .filter(Boolean);

const pool = new Pool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DB_NAME,
  connectionTimeoutMillis: 15000,
});
pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

const oauthClient = new OAuth2Client(CLIENT_ID);

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
// so one user's read never leaks another clinic's contact info.
function toClientView(row, requesterEmail) {
  const base = {
    id: row.id,
    roomId: row.room_id,
    date: row.date,
    slot: row.slot,
    durationMinutes: row.duration_minutes,
  };
  if (row.user_email === requesterEmail) {
    return {
      ...base,
      userEmail: row.user_email,
      clinicName: row.clinic_name,
      unitNumber: row.unit_number,
      contactNo: row.contact_no,
      description: row.description,
      hasCatering: row.has_catering,
      createdAt: row.created_at,
    };
  }
  return base;
}

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  applyCors(req, res);
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  next();
});

// Everything under /bookings requires a verified Google ID token.
// Static assets and the SPA shell below are intentionally public — the
// login screen itself has to load before anyone has a token.
const bookings = express.Router();

bookings.use(async (req, res, next) => {
  const user = await verifyToken(req);
  if (!user) {
    res.status(401).json({ error: 'Missing or invalid authentication token.' });
    return;
  }
  req.user = user;
  next();
});

bookings.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM cmscheduler_booking ORDER BY date, slot');
    const results = rows.map((row) => toClientView(row, req.user.email));
    res.status(200).json({ bookings: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

bookings.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const required = ['roomId', 'date', 'slot', 'durationMinutes', 'clinicName'];
    for (const field of required) {
      if (!body[field]) {
        res.status(400).json({ error: `Missing required field: ${field}` });
        return;
      }
    }

    const { rows: existingRows } = await pool.query(
      'SELECT slot, duration_minutes FROM cmscheduler_booking WHERE room_id = $1 AND date = $2',
      [body.roomId, body.date]
    );

    const newStart = toMinutes(body.slot);
    const newEnd = newStart + Number(body.durationMinutes);
    const conflict = existingRows.some((row) => {
      const start = toMinutes(row.slot);
      const end = start + row.duration_minutes;
      return newStart < end && start < newEnd;
    });

    if (conflict) {
      res.status(409).json({ error: 'This slot overlaps with an existing booking.' });
      return;
    }

    const newBooking = {
      id: crypto.randomUUID(),
      roomId: body.roomId,
      date: body.date,
      slot: body.slot,
      durationMinutes: Number(body.durationMinutes),
      userEmail: req.user.email,
      clinicName: String(body.clinicName),
      unitNumber: body.unitNumber ? String(body.unitNumber) : null,
      contactNo: body.contactNo ? String(body.contactNo) : null,
      description: body.description ? String(body.description) : null,
      hasCatering: typeof body.hasCatering === 'boolean' ? body.hasCatering : null,
      createdAt: new Date().toISOString(),
    };

    await pool.query(
      `INSERT INTO cmscheduler_booking (id, room_id, date, slot, duration_minutes, user_email, clinic_name, unit_number, contact_no, description, has_catering, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        newBooking.id,
        newBooking.roomId,
        newBooking.date,
        newBooking.slot,
        newBooking.durationMinutes,
        newBooking.userEmail,
        newBooking.clinicName,
        newBooking.unitNumber,
        newBooking.contactNo,
        newBooking.description,
        newBooking.hasCatering,
        newBooking.createdAt,
      ]
    );

    res.status(201).json(newBooking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

bookings.delete('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT user_email FROM cmscheduler_booking WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }
    if (rows[0].user_email !== req.user.email) {
      res.status(403).json({ error: 'You can only cancel your own bookings.' });
      return;
    }
    await pool.query('DELETE FROM cmscheduler_booking WHERE id = $1', [req.params.id]);
    res.status(200).json({ id: req.params.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.use('/bookings', bookings);

// Frontend build output, copied into place by scripts/copy-dist-to-functions.js
// (`npm run build:function`) before deploy — see functions/public.
const publicDir = path.join(__dirname, 'public');
// Asset filenames are content-hashed by Vite, so they're safe to cache
// forever; index.html is not, and must always be revalidated — otherwise
// returning visitors get stuck on a bundle from before the last deploy.
app.use(express.static(publicDir, {
  index: false,
  setHeaders: (res, filePath) => {
    if (path.basename(filePath) !== 'index.html') {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));
app.get('*', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(publicDir, 'index.html'));
});

exports.api = app;
