# GoRide – Vehicle Booking Website

A full-stack ride booking app (bike / auto / car / SUV), built with **Next.js 15, MongoDB, Leaflet maps and ZEGOCLOUD video KYC**.

## Features

**Riders**
- Search pickup and drop (OpenStreetMap search), use current location, or click on the map
- Road route and upfront fare for every vehicle type
- Live tracking: watch the driver come to you and follow the trip on the map
- 4-digit OTP to start the ride, cancel, rate the driver, ride history

**Drivers**
- Add vehicle and licence details
- **Video KYC**: join a live video call with an admin, who approves or rejects
- Go online/offline, see nearby requests for their vehicle type, accept
- Arrive → start with OTP → complete
- Shares live location from real GPS, or "Simulate drive" to demo tracking from a laptop

**Admin**
- Stats (riders, drivers, active rides, revenue)
- List of drivers waiting in the KYC call → join the video call, go through a checklist, approve/reject
- All drivers and all rides

## Tech

| Part | Used |
|---|---|
| Frontend + API | Next.js 15 (App Router), React 19, Tailwind CSS 4 |
| Database | MongoDB + Mongoose |
| Auth | JWT in an httpOnly cookie (`jose`), passwords hashed with `bcryptjs`, role-based middleware |
| Maps | Leaflet + OpenStreetMap tiles, Nominatim (search), OSRM (routing) — all free, no keys |
| Video KYC | ZEGOCLOUD UIKit Prebuilt; tokens are generated on the server so the secret never reaches the browser |
| Live tracking | Driver posts location every few seconds, rider's page polls every 3 s |

## Run it locally

```bash
npm install
cp .env.example .env.local   # then fill in values
npm run dev
```

Open http://localhost:3000.

- With `MONGODB_URI` empty, a local MongoDB starts automatically and keeps its data in `.data/` (development only).
- Register with the email in `ADMIN_EMAIL` to become the admin.

### Try the whole flow
1. Register a **driver** → add vehicle → *Start Video KYC*.
2. In another browser (or incognito), register with `ADMIN_EMAIL` → Admin → *Join call* → tick the checklist → **Approve**.
3. Driver → go online.
4. In a third browser, register a **rider** → book a ride of the same vehicle type.
5. Driver accepts → *Simulate drive* moves the car on the rider's map → arrive → enter rider's OTP → complete.

## Environment variables

| Name | Where to get it |
|---|---|
| `MONGODB_URI` | [MongoDB Atlas](https://www.mongodb.com/atlas) (free M0 cluster) → Connect → Drivers. In Network Access allow `0.0.0.0/0` for Vercel. |
| `JWT_SECRET` | Any long random string |
| `ADMIN_EMAIL` | The email that should become admin |
| `ZEGO_APP_ID`, `ZEGO_SERVER_SECRET` | [ZEGOCLOUD console](https://console.zegocloud.com) → create a project (Video Call / UIKit) → App ID and ServerSecret |

## Deploy on Vercel

1. Push this repo to GitHub.
2. On [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
3. Add the environment variables above (`MONGODB_URI` is **required** in production).
4. Deploy. Camera access for Video KYC and GPS need HTTPS, which Vercel provides.

## Project structure

```
src/
  app/
    api/            REST endpoints (auth, bookings, driver, admin, quote, geocode, zego token)
    book/           rider: book a ride
    rides/[id]/     rider: live tracking
    driver/         driver dashboard + kyc
    admin/          admin dashboard + kyc review
  components/       MapView, PlaceSearch, KycCall, Navbar, StatusBadge
  lib/              db, auth, fare, maps (OSRM/Nominatim), zego token
  models/           User, Driver, Booking
  middleware.ts     role-based page protection
```
