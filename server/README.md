# K-POP Audition — Full App (no Google, no sign-in, PC-free)

## What this is
A real cloud app. Applicants fill the black/dark-blue site → data + **video file** go to **MongoDB Atlas** (always on, even while you sleep). You log into an **admin panel** (password), see the list of names, click one to watch their video inline + read all info, **download ALL** (info + videos as one zip), and **delete** anyone to free space.

No Google Forms. No sign-in for applicants. Your PC stays off the whole time.

## Files
```
kpop-audition/
├── index.html        (home, about, contact, privacy — already built)
├── about.html
├── contact.html
├── privacy.html
├── apply.html        (REWIRED: real form -> POSTs to /api/apply)
└── server/           (the backend)
    ├── server.js
    ├── package.json
    ├── railway.json
    └── .env.example
```

## Deploy (one time, ~20 min)

### 1. MongoDB Atlas (free, always-on storage)
1. Sign up at mongodb.com/atlas → create **free M0 cluster**
2. Database → **Browse Collections** → create DB named `kpop`
3. Security → **Network Access** → Add IP `0.0.0.0/0` (allow everywhere)
4. Security → **Database Access** → create user (save the password)
5. **Connect** → Drivers → copy the connection string (looks like `mongodb+srv://user:pw@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority`)

### 2. Railway (free, always-on host)
1. Sign up at railway.app → **New Project** → **Deploy from GitHub** (push this folder to a GitHub repo first)
2. Add a **MongoDB** variable? No — we use Atlas. Just set env vars (see step 3).
3. Railway auto-reads `railway.json` + `package.json`.

### 3. Environment variables (in Railway project → Variables)
```
MONGODB_URI   = mongodb+srv://USER:PW@cluster0.xxxx.mongodb.net/kpop?retryWrites=true&w=majority
ADMIN_PASSWORD = (pick a strong password — this locks your admin panel)
PORT            = 3000   (Railway sets this automatically; leave default)
MAX_UPLOAD_MB  = 100
PUBLIC_DIR     = ./   (Railway serves the site from repo root)
```
**Important:** put `apply.html` + the other 4 HTML files in the **repo root** (same level as `server/`), and set `PUBLIC_DIR=./` so the server serves them. Then `apply.html`'s form posts to `/api/apply` on the same domain.

### 4. Done
Railway gives you a URL like `https://kpop-audition.up.railway.app`.
- Public site: open it → **Apply Now** → fill form, upload video, submit. No sign-in. ✅
- Admin: go to `https://kpop-audition.up.railway.app/admin` → enter `ADMIN_PASSWORD`.

## Admin panel features
- **List** of all applicants (name + stage name, country, age, positions, video icon)
- **Click a name** → modal opens: all info + **video plays inline** (HTML5 player)
- **⬇ Download ALL** (top-right) → one ZIP with each person's `info.json` + their video file
- **Delete** button per row → removes DB doc **and** the video from GridFS (frees Atlas storage) ✅
- Logout link

## Notes / limits
- Atlas **M0 free = 512 MB** total. With 100 MB max upload, that's ~5 videos before you must delete. Use **Delete** regularly, or upgrade M0 to paid for more.
- Videos stored via **GridFS** (MongoDB's file system) — not a raw BSON blob, so large files are fine.
- No email notifications built in; add later via a free service if wanted.
- The admin password is a single shared secret — fine for you. For team use, add user accounts later.

## Local testing (optional)
```
cd server
cp .env.example .env   # fill in real values
npm install
npm start               # serves site on http://localhost:3000
```
Open http://localhost:3000/apply.html to test the form, /admin for the panel.

## To change the admin password later
Just update the `ADMIN_PASSWORD` env var in Railway → Redeploy.
