h1 align="center">💈 Barbershop Backend API</h1>

<p align="center">
  Secure Authentication • Clean Architecture • Production Ready
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18.x-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Express.js-5.x-black?style=for-the-badge" />
  <img src="https://img.shields.io/badge/MongoDB-6.x-47A248?style=for-the-badge" />
  <img src="https://img.shields.io/badge/JWT-Auth-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Zod-Validation-blueviolet?style=for-the-badge" />
</p>

---

## 🧩 Description

This backend powers a barbershop application — providing user registration, secure login, JWT-based authentication, and a clean scalable architecture.  
It is built to be extended easily into:

- Bookings & Appointment Scheduling
- Admin Dashboard
- Barber Profiles
- User Account Management

The authentication layer is **production secure** with hashed passwords, validated inputs, structured error handling, and stateless session tokens.

---

## 🚀 Tech Stack

| Layer | Technology |
|------|------------|
| Runtime | Node.js & TypeScript |
| Web Framework | Express |
| Database | MongoDB + Mongoose |
| Authentication | JWT + bcrypt |
| Validation | Zod |
| Error Handling | Centralized middleware |
| Architecture | Modular + Layered API |

---

## 🗂️ Project Structure

backend/
├── src/
│ ├── index.ts # Starts server + DB
│ ├── server.ts # Express config + global error handler
│ ├── config/
│ │ └── db.ts # MongoDB connection config
│ ├── models/
│ │ └── User.ts # User model (Mongoose)
│ ├── utils/
│ │ └── auth.ts # bcrypt + JWT helpers
│ ├── middleware/
│ │ └── validate.ts # Zod validation middleware
│ ├── routes/
│ │ ├── index.ts # API root router (/api)
│ │ ├── authRoutes.ts # Auth endpoints
│ │ ├── controllers/
│ │ │ └── authController.ts
│ │ └── validators/
│ │ └── authSchemas.ts # Zod schemas
└── config/
└── .env.development # Environment variables

yaml
 '

---

## ⚙️ Setup & Installation

### 1. Clone Repo
```bash
git clone <your-repo-url>
cd backend
2. Install Dependencies
bash
 '
npm install
3. Setup Environment Variables
Create:

arduino
 '
config/.env.development
Add:

ini
 '
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/barbershop
JWT_SECRET=your_secret_here
4. Start MongoDB (macOS Homebrew)
bash
 '
brew services start mongodb-community@6.0
5. Run App
bash
 '
npm run dev
Expected:

arduino
 '
✅ MongoDB connected
🚀 API listening on http://localhost:3000
🔐 Authentication Endpoints
Register a New User
POST /api/auth/register

json
{
  "name": "Alice Test",
  "email": "alice@example.com",
  "password": "secret123"
}
Login
POST /api/auth/login

json
 '
{
  "email": "alice@example.com",
  "password": "secret123"
}
Example Successful Response
json
 '
{
  "user": {
    "id": "68ff635dec4f3b6a776b3d5d",
    "name": "Alice Test",
    "email": "alice@example.com"
  },
  "token": "JWT_TOKEN_HERE"
}
🔒 Security Design
Feature	Status	Notes
Password hashing	✅	Stored using bcrypt, never plain text
Input validation	✅	All requests validated via Zod
Auth tokens	✅	Stateless JWT tokens (Authorization: Bearer …)
Error handling	✅	Centralized + prevents information leaks

🔜 Next Features Roadmap
Feature	Description
Protected endpoints	Using requireAuth middleware
User account profile	/api/me
Create booking	Choose date/time & barber
Staff / Barber management	Admin-only
Admin dashboard	Manage appointments


