# OnlySwap Backend API

Node.js + Express + MongoDB backend for OnlySwap marketplace app.

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas account)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the backend directory:
   ```env
   MONGO_URI=mongodb://localhost:27017/onlyswap
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   PORT=5000
   NODE_ENV=development
   ```

3. **Start MongoDB:**
   ```bash
   # If using local MongoDB
   mongod
   
   # Or use MongoDB Atlas (cloud) and set your connection string in .env
   ```

4. **Run the server:**
   ```bash
   # Development mode (with auto-restart)
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:3001`

## 📡 API Endpoints

### Authentication

#### POST /api/auth/signup
Create a new user account.

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "university": "Harvard University",
  "email": "john@harvard.edu",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully! Welcome to OnlySwap!",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "university": "Harvard University",
      "email": "john@harvard.edu",
      "createdAt": "2024-10-31T23:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /api/auth/login
Sign in to existing account.

**Request:**
```json
{
  "email": "john@harvard.edu",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Welcome back!",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "university": "Harvard University",
      "email": "john@harvard.edu",
      "createdAt": "2024-10-31T23:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### GET /api/auth/me
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

---

## 🗄️ Database Schema

### User Model
```javascript
{
  firstName: String,
  lastName: String,
  university: String,
  email: String (unique, .edu validation, lowercase),
  password: String (hashed with bcrypt),
  createdAt: Date
}
```

**Indexes:**
- Email (unique)
- University
- CreatedAt

---

## 🔒 Security Features

- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ JWT authentication with 30-day expiration
- ✅ Email validation (.edu required)
- ✅ Unique email enforcement
- ✅ CORS enabled for React Native
- ✅ Environment variables for secrets

---

## 🏗️ Project Structure

```
backend/
├── server.js                 # Entry point
├── package.json              # Dependencies
├── .env                      # Environment variables
├── models/
│   └── User.js              # User schema
├── controllers/
│   └── authController.js    # Auth logic
├── routes/
│   └── authRoutes.js        # API routes
├── middleware/
│   └── authMiddleware.js    # JWT protection
└── README.md                # Documentation
```

---

## 🧪 Testing the API

### Using cURL:

**Signup:**
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "university": "Harvard University",
    "email": "john@harvard.edu",
    "password": "securePassword123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@harvard.edu",
    "password": "securePassword123"
  }'
```

---

## 🚧 Future Features

- User profiles and avatars
- Item/listings management
- Messaging between users
- University-based filtering
- Search functionality
- Analytics and reporting

---

## 📝 License

ISC

