/* eslint-disable */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

try { admin.initializeApp(); } catch {}
const db = admin.firestore();

// Helpers
function nowUtc() {
  return new Date();
}

function fmtDateKey(date, tzOffsetMin) {
  // Returns YYYY-MM-DD for the local date at tzOffsetMin
  const d = new Date(date.getTime() - tzOffsetMin * 60000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function getLocalHM(date, tzOffsetMin) {
  const d = new Date(date.getTime() - tzOffsetMin * 60000);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

exports.registerToken = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return; }
      const { token, tzOffset, userAgent } = req.body || {};
      if (!token || typeof token !== 'string') { res.status(400).json({ error: 'token missing' }); return; }
      const tz = Number.isFinite(tzOffset) ? tzOffset : 0;
      const ref = db.collection('devices').doc(token);
      await ref.set({
        tzOffset: tz,
        userAgent: String(userAgent || ''),
        lastSeen: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'internal' });
    }
  });
});

exports.syncReminders = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return; }
      const { token, reminders } = req.body || {};
      if (!token || !Array.isArray(reminders)) { res.status(400).json({ error: 'bad request' }); return; }
      const batch = db.batch();
      const parent = db.collection('devices').doc(token);
      const col = parent.collection('reminders');
      // Clear existing first (read then delete)
      const existing = await col.get();
      for (const doc of existing.docs) batch.delete(doc.ref);
      // Write new
      for (const r of reminders) {
        const id = String(r.id || '');
        if (!id) continue;
        const data = {
          id,
          title: String(r.title || ''),
          type: r.type === 'occasion' ? 'occasion' : 'daily',
          time: r.time ? String(r.time) : null,
          date: r.date ? String(r.date) : null,
          done: !!r.done,
          lastSent: r.lastSent ? String(r.lastSent) : null,
        };
        batch.set(col.doc(id), data);
      }
      batch.set(parent, { lastSeen: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      await batch.commit();
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'internal' });
    }
  });
});

exports.sendDueReminders = functions.pubsub.schedule('every 1 minutes').timeZone('UTC').onRun(async () => {
  const now = nowUtc();
  const devicesSnap = await db.collection('devices').get();
  const messages = [];

  for (const dev of devicesSnap.docs) {
    const token = dev.id;
    const tzOffset = Number(dev.get('tzOffset') || 0);
    const hm = getLocalHM(now, tzOffset);
    const todayKey = fmtDateKey(now, tzOffset);

    const remindersSnap = await db.collection('devices').doc(token).collection('reminders').get();
    for (const rdoc of remindersSnap.docs) {
      const r = rdoc.data();
      if (r.done) continue;
      let due = false;
      let lastKey = r.lastSent || null;

      if (r.type === 'daily' && r.time) {
        if (hm === r.time) {
          due = lastKey !== todayKey; // once per day
          lastKey = todayKey;
        }
      } else if (r.type === 'occasion' && r.date) {
        // r.date is MM-DD
        const [mm, dd] = String(r.date).split('-');
        const cur = todayKey.slice(5); // MM-DD
        if (`${mm}-${dd}` === cur && hm === '09:00') {
          const yearKey = todayKey.slice(0, 4);
          due = lastKey !== yearKey; // once per year
          lastKey = yearKey;
        }
      }

      if (due) {
        const title = r.title || 'Reminder';
        const body = r.type === 'occasion' ? "It's today." : "It's time.";
        messages.push({ token, notification: { title, body } });
        await rdoc.ref.set({ lastSent: lastKey }, { merge: true });
      }
    }
  }

  // Send in chunks of 500
  const chunk = 500;
  for (let i = 0; i < messages.length; i += chunk) {
    const batch = messages.slice(i, i + chunk);
    try {
      await admin.messaging().sendEach(batch.map(m => ({ token: m.token, notification: m.notification })));
    } catch (e) {
      console.error('FCM send error', e);
    }
  }

  return null;
});
