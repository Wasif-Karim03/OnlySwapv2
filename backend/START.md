# Quick Start Guide 🚀

## Prerequisites
- Node.js (v14+) installed
- MongoDB running (local or Atlas)

## First Time Setup

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Install dependencies** (already done):
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   # Copy the example env file
   cp env.example .env
   ```

4. **Edit `.env` file** with your MongoDB connection:
   ```env
   MONGO_URI=mongodb://localhost:27017/onlyswap
   JWT_SECRET=supersecretkey
   PORT=3001
   NODE_ENV=development
   ```

5. **Start MongoDB** (if using local):
   ```bash
   # macOS
   brew services start mongodb-community
   
   # Or run manually
   mongod
   ```

## Running the Server

### Development Mode (with auto-restart)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

You should see:
```
🚀 Server is running on port 3001
📡 API URL: http://localhost:3001
🔗 MongoDB: mongodb://localhost:27017/onlyswap
✅ Connected to MongoDB
```

## Testing the API

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
    "password": "secure123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@harvard.edu",
    "password": "secure123"
  }'
```

### Using Postman:
- Import the collection
- Test signup and login endpoints
- Copy the JWT token from response

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Sign in
- `GET /api/auth/me` - Get current user (protected)

### Health Check
- `GET /health` - Check server status
- `GET /` - Root endpoint

## Troubleshooting

**Port already in use:**
```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>
```

**MongoDB connection error:**
- Check if MongoDB is running
- Verify MONGO_URI in `.env` file
- For Atlas, ensure IP whitelist includes your IP

**Module not found:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Next Steps
1. Start the backend server
2. Start the Expo frontend app
3. Test signup/login from mobile app
4. Check MongoDB for created users

