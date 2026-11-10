# Demo Clinic API (Vercel)

Nakli clinic site/API, WhatsApp bot ko test karne ke liye.

## Deploy
1. Is folder ko GitHub par daalein, phir vercel.com -> Add New -> Project -> us repo ko import karein.
   (ya terminal mein: `npm i -g vercel` phir is folder mein `vercel`)
2. Vercel project -> Storage -> Upstash Redis (free) add karein aur project se connect karein.
   (Is ke baghair data thori der baad ur jata hai.)
3. Project -> Settings -> Environment Variables: `API_KEY` = koi lamba random text.
4. Redeploy karein.

## Test (terminal)
```
URL=https://YOUR-APP.vercel.app
KEY=your-api-key
curl -H "X-API-Key: $KEY" "$URL/api/availability?date=2026-11-12&service=Dental"
curl -X POST -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"patient_name":"Ali","patient_phone":"923001234567","service":"Dental","date":"2026-11-12","time":"16:00"}' "$URL/api/appointments"
curl -H "X-API-Key: $KEY" "$URL/api/appointments?from=2026-11-12&to=2026-11-13"
curl -X PATCH -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"id":"A-xxxx","status":"no_show"}' "$URL/api/appointments"
```
Statuses: booked, confirmed, no_show, completed, cancelled.
