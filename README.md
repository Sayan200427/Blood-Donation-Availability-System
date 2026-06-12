# Emergency Blood Donation & Availability System

A full-stack React and Express project for tracking blood donors, blood bank inventory, and emergency hospital requests.

## Stack

- React with Vite for the frontend
- Express for the backend API
- MongoDB Atlas with Mongoose for persistence
- Compatibility-based donor and stock matching on the server

## Features

- Register donors with blood group, city, phone number, and last donation date
- Update blood inventory by blood group and storage location
- Create emergency requests with hospital, city, urgency, and units needed
- View automatic donor matches and compatible inventory coverage
- Persist data in MongoDB

## Project Structure

- `src/` - React frontend
- `server/index.js` - Express API server
- `server/db.js` - MongoDB connection helper
- `server/store.js` - Mongoose models, persistence, and matching logic

## Run

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and replace the MongoDB password placeholder:

```bash
MONGO_URI=mongodb+srv://web_dev:your_real_password@cluster0.c9rnwol.mongodb.net/bloodDonationDB?retryWrites=true&w=majority&appName=Cluster0
```

If your password contains special characters such as `@`, `#`, `/`, or `?`, URL-encode it before putting it in the URI.

3. Start frontend and backend together:

```bash
npm run dev
```

4. Open:

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
