# Demo Clinic website + API (Vercel)

Poori nakli clinic site: booking page, staff page aur WhatsApp bot ki API.

- `/` : clinic website (services, doctors, timings, online booking)
- `/admin.html` : staff page (appointments dekhein, status badlein; staff key = `API_KEY`)
- `/api/public/availability`, `/api/public/book` : website ke liye (key ke baghair)
- `/api/availability`, `/api/appointments` : bot ke liye (`X-API-Key` zaroori)

## Deploy
1. Purani files ko is folder ki files se replace karke GitHub par push karein. Vercel khud dobara deploy karega.
2. Vercel -> Storage -> Upstash Redis connect karein (is ke baghair data thori der baad ur jata hai).
3. Vercel -> Settings -> Environment Variables: `API_KEY` = lamba random text. Phir Redeploy.

## Doosre clinic ke liye
`public/site-config.js` mein naam, doctors, fees, timings badlein. Services aur slots ka hisaab `lib/clinic.js` mein hai.

## Bot ke liye URLs (n8n)
- check_availability: `https://YOUR-APP.vercel.app/api/availability?date={date}&service={service}`
- book_appointment: `https://YOUR-APP.vercel.app/api/appointments`
- Config site_api_base: `https://YOUR-APP.vercel.app/api`
- Header Auth credential: `X-API-Key` = `API_KEY`
