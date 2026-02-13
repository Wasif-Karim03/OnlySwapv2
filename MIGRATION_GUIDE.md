# 🔄 Migration Guide: Local to Production Database

## Current Situation

- **Local Database:** `mongodb://localhost:27017/onlyswap`
  - Contains: 7 users, 19 products (test data)
- **Production Database:** Railway/MongoDB Atlas (cloud)
  - Contains: All real user accounts and products

## Step 1: Get Production MONGO_URI

1. Go to **https://railway.app**
2. Login to your account
3. Click on your **"OnlySwap"** project
4. You'll see services. Look for:
   - A service named **"MongoDB"** (if you added MongoDB plugin), OR
   - Your **backend service** (the one running Node.js)
5. **If MongoDB service exists:**
   - Click on it
   - Go to **"Variables"** tab
   - Copy the **`MONGO_URL`** or **`MONGO_URI`** value
6. **If no MongoDB service (using MongoDB Atlas):**
   - Go to **MongoDB Atlas**: https://cloud.mongodb.com
   - Click **"Connect"** on your cluster
   - Choose **"Connect your application"**
   - Copy the connection string
   - Replace `<password>` with your database password
   - Add database name: `/onlyswap?retryWrites=true&w=majority`

## Step 2: Run Migration Script

Once you have the production MONGO_URI, run:

```bash
cd "/Users/wasifkarim/Desktop/Lot Detector/OnlySwap/backend"
node scripts/migrateToProduction.js "mongodb://localhost:27017/onlyswap" "YOUR_PRODUCTION_MONGO_URI"
```

**Example:**
```bash
node scripts/migrateToProduction.js \
  "mongodb://localhost:27017/onlyswap" \
  "mongodb+srv://username:password@cluster.mongodb.net/onlyswap?retryWrites=true&w=majority"
```

## Step 3: Update .env File

After migration, update your `.env` file:

1. Open: `backend/.env`
2. Change this line:
   ```
   MONGO_URI=mongodb://localhost:27017/onlyswap
   ```
3. To your production URI:
   ```
   MONGO_URI=YOUR_PRODUCTION_MONGO_URI
   ```

## Step 4: Verify Migration

Run the list script to verify:

```bash
cd backend
node scripts/listUniversityUsers.js "Ohio Wesleyan University" "YOUR_PRODUCTION_MONGO_URI"
```

You should see all users from production database.

## What Gets Migrated

✅ **Users:**
- Email, password (hashed), name, university
- Profile pictures
- Account status

✅ **Products:**
- Title, description, price, category
- Images (Cloudinary URLs)
- Status (available/sold/pending)
- Suspension status

⚠️ **What's NOT Migrated:**
- Bids (will need to be recreated)
- Chat messages
- Notifications
- Feed posts

## After Migration

- ✅ All new accounts will go to production
- ✅ All new products will go to production
- ✅ No more local database usage
- ✅ Everything stored in cloud

## Troubleshooting

**"Connection refused" error:**
- Make sure MongoDB Atlas IP whitelist includes your IP (or 0.0.0.0/0)
- Check password is correct in connection string

**"Authentication failed" error:**
- Verify database username and password
- Check database user has proper permissions

**"Users already exist" warnings:**
- This is normal if users were already in production
- Script will skip duplicates automatically

