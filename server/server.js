// ===== K-POP Audition Backend =====
// Node + Express + MongoDB Atlas (GridFS for videos) + admin panel
// No Google, no sign-in for applicants. Always-on via Railway.

require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const { MongoClient, GridFSBucket } = require('mongodb');
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PW = process.env.ADMIN_PASSWORD || 'CHANGE_ME';
const MAX_MB = parseInt(process.env.MAX_UPLOAD_MB || '100', 10);
// Public directory is current folder (where HTML files live in server/)
const PUBLIC_DIR = __dirname;

// ---- Mongo ----
const client = new MongoClient(process.env.MONGODB_URI, { maxPoolSize: 10 });
let bucket, db;

async function initDb() {
  await client.connect();
  db = client.db('kpop');
  bucket = new GridFSBucket(db, { bucketName: 'videos' });
  console.log('[db] connected to MongoDB Atlas');
}

// ---- Middleware ----
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(PUBLIC_DIR));

// ---- Redirect root to index.html ----
app.get('/', (req, res) => res.redirect('/index.html'));

// ---- Multer: store video in memory, stream to GridFS ----
const upload = multer({
  limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/video\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only video files allowed'));
  }
});

// ---- Admin auth helper ----
function isAdmin(req) {
  return req.cookies && req.cookies.admin === hash(ADMIN_PW);
}
function hash(pw) {
  return crypto.createHash('sha256').update('kp0p' + pw).digest('hex');
}

// ===== PUBLIC: submit audition =====
app.post('/api/apply', upload.single('video'), async (req, res) => {
  try {
    const positions = Array.isArray(req.body.positions) ? req.body.positions : (req.body.positions ? [req.body.positions] : []);
    const doc = {
      fullName: (req.body.fullName || '').toString().trim(),
      stageName: (req.body.stageName || '').toString().trim(),
      age: parseInt(req.body.age, 10) || null,
      country: (req.body.country || '').toString().trim(),
      height: parseInt(req.body.height, 10) || null,
      social: (req.body.social || '').toString().trim(),
      positions,
      createdAt: new Date(),
      hasVideo: false
    };
    if (!doc.fullName || !doc.stageName) {
      return res.status(400).json({ ok: false, error: 'Full name and stage name required' });
    }
    const ins = await db.collection('applicants').insertOne(doc);
    const id = ins.insertedId;

    if (req.file) {
      const stream = bucket.openUploadStream(req.file.originalname, {
        metadata: { applicantId: id.toString(), contentType: req.file.mimetype }
      });
      stream.end(req.file.buffer);
      await new Promise((resolve, reject) => {
        stream.on('finish', () => {
          db.collection('applicants').updateOne({ _id: id }, { $set: { hasVideo: true, videoId: stream.id, videoName: req.file.originalname } });
          resolve();
        });
        stream.on('error', reject);
      });
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('[apply] error', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ===== ADMIN: login =====
app.post('/admin/login', (req, res) => {
  if (req.body.password === ADMIN_PW) {
    res.cookie('admin', hash(ADMIN_PW), { httpOnly: true, sameSite: 'lax', maxAge: 86400000 * 7 });
    res.redirect('/admin');
  } else {
    res.redirect('/admin?err=1');
  }
});
app.get('/admin/logout', (req, res) => {
  res.clearCookie('admin');
  res.redirect('/admin');
});

// ===== ADMIN: panel (HTML) =====
app.get('/admin', async (req, res) => {
  if (!isAdmin(req)) return res.send(loginPage(req.query.err));
  try {
    const list = await db.collection('applicants')
      .find({}, { projection: { videoBuffer: 0 } })
      .sort({ createdAt: -1 }).toArray();
    res.send(adminPage(list));
  } catch (e) {
    res.status(500).send('DB error: ' + e.message);
  }
});

// ===== ADMIN: single applicant detail (JSON) =====
app.get('/api/applicant/:id', async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ ok: false });
  try {
    const doc = await db.collection('applicants').findOne(
      { _id: new (require('mongodb').ObjectId)(req.params.id) },
      { projection: { videoBuffer: 0 } }
    );
    res.json(doc);
  } catch (e) { res.status(500).json({ ok: false }); }
});

// ===== ADMIN: stream video inline =====
app.get('/video/:id', async (req, res) => {
  if (!isAdmin(req)) return res.status(403).send('forbidden');
  try {
    const doc = await db.collection('applicants').findOne(
      { _id: new (require('mongodb').ObjectId)(req.params.id) },
      { projection: { videoId: 1, videoName: 1 } }
    );
    if (!doc || !doc.videoId) return res.status(404).send('no video');
    res.set('Content-Type', 'video/mp4');
    res.set('Content-Disposition', 'inline; filename="' + (doc.videoName || 'video.mp4') + '"');
    bucket.openDownloadStream(new (require('mongodb').ObjectId)(doc.videoId)).pipe(res);
  } catch (e) { res.status(500).send(e.message); }
});

// ===== ADMIN: download ALL (zip: info.json + videos) =====
app.get('/admin/download-all', async (req, res) => {
  if (!isAdmin(req)) return res.status(403).send('forbidden');
  try {
    const list = await db.collection('applicants').find({}).sort({ createdAt: -1 }).toArray();
    const archive = archiver('zip', { zlib: { level: 9 } });
    res.attachment('kpop-auditions-' + Date.now() + '.zip');
    archive.pipe(res);
    for (const a of list) {
      const { videoBuffer, ...info } = a;
      archive.append(JSON.stringify(info, null, 2), { name: (a.stageName || a._id) + '/info.json' });
      if (a.videoId) {
        archive.append(bucket.openDownloadStream(new (require('mongodb').ObjectId)(a.videoId)),
          { name: (a.stageName || a._id) + '/' + (a.videoName || 'video.mp4') });
      }
    }
    await archive.finalize();
  } catch (e) { res.status(500).send(e.message); }
});

// ===== ADMIN: delete one =====
app.post('/admin/delete/:id', async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ ok: false });
  try {
    const _id = new (require('mongodb').ObjectId)(req.params.id);
    const doc = await db.collection('applicants').findOne({ _id }, { projection: { videoId: 1 } });
    if (doc && doc.videoId) await bucket.delete(new (require('mongodb').ObjectId)(doc.videoId));
    await db.collection('applicants').deleteOne({ _id });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false }); }
});

// ===== Pages (HTML builders) =====
// ===== HEALTHCHECK (Railway / load balancers) =====
app.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

function loginPage(err) {
  return `<!doctype html><meta charset=utf-8><title>Admin Login</title>
  <body style="background:#000;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
  <form method=post action=/admin/login style="background:#111;padding:40px;border-radius:16px;text-align:center;border:1px solid #333">
    <h2 style="color:#0074D9;margin:0 0 20px">K-POP Admin</h2>
    ${err ? '<p style="color:#e60012">Wrong password</p>' : ''}
    <input name=password type=password placeholder="Admin password" style="width:100%;padding:12px;border-radius:8px;border:2px solid #333;background:#000;color:#fff;margin-bottom:16px">
    <button style="width:100%;padding:12px;background:#0074D9;color:#fff;border:0;border-radius:8px;font-weight:600;cursor:pointer">Enter</button>
  </form></body>`;
}

function adminPage(list) {
  const rows = list.map(a => `<tr style="border-bottom:1px solid #222">
    <td style="padding:12px;cursor:pointer" onclick="openDetail('${a._id}')">${esc(a.fullName)} <span style="color:#0074D9">(${esc(a.stageName)})</span></td>
    <td style="padding:12px">${esc(a.country||'')}</td>
    <td style="padding:12px">${a.age||''}</td>
    <td style="padding:12px">${(a.positions||[]).join(', ')}</td>
    <td style="padding:12px">${a.hasVideo ? '🎬' : '—'}</td>
    <td style="padding:12px"><button onclick="del('${a._id}')" style="background:#e60012;color:#fff;border:0;border-radius:6px;padding:6px 10px;cursor:pointer">Delete</button></td>
  </tr>`).join('');
  return `<!doctype html><meta charset=utf-8><title>K-POP Admin Panel</title>
  <body style="background:#000;color:#fff;font-family:sans-serif;margin:0">
  <header style="background:#001f3f;padding:20px 30px;display:flex;justify-content:space-between;align-items:center">
    <h1 style="margin:0;color:#0074D9;font-size:1.4rem">K-POP Auditions (${list.length})</h1>
    <div><a href="/admin/download-all" style="background:#0074D9;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;margin-right:10px">⬇ Download ALL</a>
    <a href="/admin/logout" style="color:#aaa;text-decoration:none">Logout</a></div>
  </header>
  <table style="width:100%;border-collapse:collapse;margin-top:10px">
    <thead><tr style="color:#888;text-align:left"><th style="padding:12px">Name</th><th>Country</th><th>Age</th><th>Positions</th><th>Video</th><th></th></tr></thead>
    <tbody>${rows || '<tr><td colspan=6 style="padding:30px;text-align:center;color:#666">No applicants yet</td></tr>'}</tbody>
  </table>
  <div id="modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);padding:40px;overflow:auto">
    <div style="max-width:700px;margin:0 auto;background:#111;padding:30px;border-radius:16px;position:relative">
      <button onclick="document.getElementById('modal').style.display='none'" style="position:absolute;top:15px;right:20px;background:none;border:0;color:#aaa;font-size:1.5rem;cursor:pointer">✕</button>
      <div id="modalBody"></div>
    </div>
  </div>
  <script>
    async function openDetail(id){
      const a = await (await fetch('/api/applicant/'+id)).json();
      let html = '<h2 style="color:#0074D9">'+esc(a.fullName)+' ('+esc(a.stageName)+')</h2>';
      html += '<p><b>Age:</b> '+a.age+'</p><p><b>Country:</b> '+esc(a.country)+'</p>';
      html += '<p><b>Height:</b> '+a.height+' cm</p><p><b>Social:</b> '+esc(a.social)+'</p>';
      html += '<p><b>Positions:</b> '+(a.positions||[]).join(', ')+'</p>';
      html += '<p style="color:#666;font-size:.85rem">Submitted: '+(a.createdAt?new Date(a.createdAt).toLocaleString():'')+'</p>';
      if(a.hasVideo) html += '<video src="/video/'+a._id+'" controls style="width:100%;border-radius:10px;margin-top:15px"></video>';
      document.getElementById('modalBody').innerHTML = html;
      document.getElementById('modal').style.display='block';
    }
    async function del(id){
      if(!confirm('Delete this applicant and free their video space?')) return;
      await fetch('/admin/delete/'+id,{method:'POST'});
      location.reload();
    }
    function esc(s){return (s||'').toString().replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
  </script>
  </body>`;
}
function esc(s){return (s||'').toString().replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

// ---- Start ----
initDb().then(() => {
  app.listen(PORT, () => console.log('[server] listening on ' + PORT));
}).catch(e => {
  console.error('[server] failed to start:', e.message);
  process.exit(1);
});
