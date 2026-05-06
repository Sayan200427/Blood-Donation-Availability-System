# Emergency Blood Donation & Availability System

A full-stack React and Express project for tracking blood donors, blood bank inventory, and emergency hospital requests.

## Stack

- React with Vite for the frontend
- Express for the backend API
- Local JSON file storage for persistence
- Compatibility-based donor and stock matching on the server

## Features

- Register donors with blood group, city, phone number, and last donation date
- Update blood inventory by blood group and storage location
- Create emergency requests with hospital, city, urgency, and units needed
- View automatic donor matches and compatible inventory coverage
- Persist data in `server/data.json`

## Project Structure

- `src/` - React frontend
- `server/index.js` - Express API server
- `server/store.js` - persistence and matching logic
- `server/data.json` - local JSON datastore

## Run

1. Install dependencies:

```bash
npm install
```

2. Start frontend and backend together:

```bash
npm run dev
```

3. Open:

`http://localhost:5173`

## API Endpoints

- `GET /api/health`
- `GET /api/dashboard`
- `POST /api/donors`
- `POST /api/inventory`
- `POST /api/requests`

## Notes

- Inventory updates replace the current record for the same blood group
- Donor eligibility uses a 90-day gap from the previous donation date
- Emergency requests are sorted by priority and enriched with compatible donor matches
