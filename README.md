# Clinic website for Vercel

Upload this folder as the Vercel project root. The folders must stay exactly as shown:

- `api/appointments.js` and `api/availability.js`: protected bot/admin endpoints
- `api/public/availability.js` and `api/public/book.js`: website booking endpoints
- `lib/`: shared clinic and storage code
- `public/`: website files

After deployment, connect Upstash Redis and add `API_KEY` in Vercel Environment Variables.
