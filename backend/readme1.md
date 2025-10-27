curl -i -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Test",
    "email": "alice@example.com",
    "password": "secret123"
  }'

# Backend Overview

This backend provides a secure authentication system built with **Node.js**, **Express**, **MongoDB**, **Zod**, **bcrypt**, and **JWT**.  
It establishes a clean foundation for future features such as user profiles, booking system, and admin dashboard.

---

## 🔧 Tech Stack

| Layer | Technology |
|------|------------|
| Runtime | Node.js |
| Server Framework | Express |
| Database | MongoDB (Mongoose ORM) |
| Authentication | JWT + bcrypt |
| Input Validation | Zod |
| Error Handling | Centralized middleware |
| Language | TypeScript |

---

## 📁 Project Structure

backend/
│
├── config/
│ └── .env.development # Environment variables
│
├── src/
│ ├── index.ts # App entry (starts DB + server)
│ ├── server.ts # Express app setup + error handling
│ ├── config/
│ │ └── db.ts # MongoDB connection logic
│ ├── models/
│ │ └── User.ts # User schema/model
│ ├── utils/
│ │ └── auth.ts # JWT + bcrypt utility functions
│ ├── middleware/
│ │ └── validate.ts # Zod request validation middleware
│ ├── routes/
│ │ ├── index.ts # Main router (/api)
│ │ ├── authRoutes.ts # /api/auth endpoints
│ │ ├── controllers/
│ │ │ └── authController.ts
│ │ └── validators/
│ │ └── authSchemas.ts
│ └── common/
│ └── constants/...
│
└── package.json

## 🌍 Environment Variables

Create:

backend/config/.env.development

Add:

NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/barbershop
JWT_SECRET=your_secret_here

---

## 🗄️ Database Setup (macOS Homebrew)

## Start MongoDB:

```bash
brew services start mongodb-community@6.0

Verify:

mongosh

Exit the shell:

exit

🚀 Run the Server

Install dependencies:

npm install


Start backend:

npm run dev


Expected:

✅ MongoDB connected
🚀 API listening on http://localhost:3000


Test health check:

http://localhost:3000/api/health

🔐 Authentication Flow
Register User

POST /api/auth/register

Request:

{
  "name": "Alice Test",
  "email": "alice@example.com",
  "password": "secret123"
}


Response:

{
  "user": {
    "id": "MongoID",
    "name": "Alice Test",
    "email": "alice@example.com"
  },
  "token": "JWT_TOKEN_HERE"
}

Login

POST /api/auth/login

Request:

{
  "email": "alice@example.com",
  "password": "secret123"
}


Response:

{
  "user": {
    "id": "MongoID",
    "name": "Alice Test",
    "email": "alice@example.com"
  },
  "token": "JWT_TOKEN_HERE"
}

✅ What’s Implemented
Feature	Status
User registration with database persistence	✅
Password hashing (bcrypt)	✅
Login + password verification	✅
JWT token generation	✅
Zod validation	✅
Central error handling	✅
Working Register + Login endpoints	✅