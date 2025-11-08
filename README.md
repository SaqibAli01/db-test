# Dr. Noor Backend API

This is a Node.js Express.js backend with MongoDB for managing appointments, user authentication, and communication features.

## Features

- User registration and login (JWT-based auth)
- Appointment creation and management
- Emailing PDF confirmations
- Sending WhatsApp notifications via Twilio

## Deployment to Vercel

1. Push this code to a GitHub repository
2. Connect your GitHub repository to Vercel
3. Set the following environment variables in Vercel:

   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - Your JWT secret key
   - Update other environment variables as needed (SMTP, Twilio, etc.)

4. Set the build command to `npm install` (this is default)
5. Set the output directory to `.` (this is default)
6. Deploy!

## Environment Variables

Check `.env.example` for all required environment variables.

## API Endpoints

- `/api/auth` - Authentication routes
- `/api/users` - User management
- `/api/appointments` - Appointment management
- `/api/doctor-availability` - Doctor availability
- `/api/dashboard` - Dashboard data
- `/health` - Health check endpoint

## Local Development

```bash
npm install
npm run dev
```
