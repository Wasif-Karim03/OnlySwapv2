# 🔐 Admin Login Setup

There is **no default admin account**. You need to create one first using the script.

---

## 📝 Create Admin Account

### Step 1: Make sure backend is running and MongoDB is connected

Make sure your backend server has started successfully (MongoDB connection established).

### Step 2: Run the createAdmin script

**Option A: Using npm script (Easiest)**
```bash
cd /Users/wasifkarim/Desktop/Lot\ Detector/OnlySwap/backend
npm run create-admin -- admin@onlyswap.com admin123 superadmin
```

**Option B: Direct node command**
```bash
cd /Users/wasifkarim/Desktop/Lot\ Detector/OnlySwap/backend
node scripts/createAdmin.js admin@onlyswap.com admin123 superadmin
```

### Syntax:
```bash
node scripts/createAdmin.js <email> <password> [role]
```

**Parameters:**
- `<email>`: Admin email address (required)
- `<password>`: Admin password (required)
- `[role]`: Optional role - either `admin` or `superadmin` (default: `admin`)

### Example Commands:

**Create regular admin:**
```bash
cd /Users/wasifkarim/Desktop/Lot\ Detector/OnlySwap/backend
node scripts/createAdmin.js admin@onlyswap.com mypassword123
```

**Create superadmin:**
```bash
cd /Users/wasifkarim/Desktop/Lot\ Detector/OnlySwap/backend
node scripts/createAdmin.js admin@onlyswap.com mypassword123 superadmin
```

---

## 🔑 Login with Admin Account

Once created, you can login using:

### Via Mobile App:
1. Navigate to admin login screen in the app
2. Enter the email you used when creating the admin
3. Enter the password you set

### Via API (for testing):
```bash
curl -X POST http://localhost:3001/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@onlyswap.com",
    "password": "mypassword123"
  }'
```

---

## ✅ Verification

After running the script, you should see:
```
✅ Connected to MongoDB
✅ Admin created successfully!
📝 Admin details:
   Email: admin@onlyswap.com
   Role: superadmin
   ID: [some-id]
   Created: [timestamp]

💡 You can now login at: POST /api/admin/login
   Email: admin@onlyswap.com
   Password: mypassword123
```

---

## 🔄 Update Existing Admin

If an admin with that email already exists, the script will:
- Delete the old admin
- Create a new one with the provided credentials

---

## 💡 Recommended Admin Credentials

For development/testing, you can use:

**Email:** `admin@onlyswap.com`  
**Password:** `admin123` (or choose your own secure password)  
**Role:** `superadmin`

**Command:**
```bash
cd /Users/wasifkarim/Desktop/Lot\ Detector/OnlySwap/backend
node scripts/createAdmin.js admin@onlyswap.com admin123 superadmin
```

---

## 🚨 Security Note

⚠️ **For production**, make sure to:
1. Use a strong password
2. Use a secure email address
3. Never commit admin credentials to version control
4. Consider using environment variables for admin credentials

---

## 📍 Admin Login Endpoint

**Endpoint:** `POST /api/v1/admin/auth/login`  
**Body:**
```json
{
  "email": "admin@onlyswap.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin login successful",
  "token": "jwt-token-here",
  "admin": {
    "email": "admin@onlyswap.com",
    "role": "superadmin"
  }
}
```

---

## 🛠️ Troubleshooting

**"MongoDB connection error":**
- Make sure MongoDB is running
- Check your `.env` file has correct `MONGO_URI`

**"Admin already exists":**
- The script will automatically delete and recreate it
- Or manually delete from database if needed

**"Cannot find module":**
- Make sure you're in the `backend` directory
- Run `npm install` if dependencies aren't installed

