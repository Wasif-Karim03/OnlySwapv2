# OnlySwap - Data Flow and Storage Documentation
## Complete Data Journey from Account Creation to All User Activities

**Date:** January 15, 2025  
**Purpose:** Comprehensive documentation of how user data flows through the OnlySwap system and where it is stored at each step.

---

## Table of Contents
1. [Account Creation Data Flow](#1-account-creation-data-flow)
2. [Profile Data Storage](#2-profile-data-storage)
3. [Product Listing Data Flow](#3-product-listing-data-flow)
4. [Bid Data Storage](#4-bid-data-storage)
5. [Chat/Messaging Data Flow](#5-chatmessaging-data-flow)
6. [Notification Data Storage](#6-notification-data-storage)
7. [Support Ticket Data Flow](#7-support-ticket-data-flow)
8. [Settings and Preferences Storage](#8-settings-and-preferences-storage)
9. [Authentication and Session Data](#9-authentication-and-session-data)
10. [Image and File Storage](#10-image-and-file-storage)
11. [Data Storage Locations Summary](#11-data-storage-locations-summary)

---

## 1. Account Creation Data Flow

### 1.1 User Registration Process

**Step 1: User Fills Registration Form**
- **Frontend:** `app/create-account.tsx`
- **Data Collected:**
  - First Name (text input)
  - Last Name (text input)
  - University (selection/search)
  - Email (.edu address)
  - Password (secured input)
  - Confirm Password (validation)
  - Terms of Service acceptance (checkbox)
  - Privacy Policy acceptance (checkbox)

**Step 2: Form Validation**
- **Location:** Frontend validation in `create-account.tsx`
- **Checks:**
  - All fields filled
  - Email ends with .edu
  - Email matches university domain (if mapped)
  - Password minimum 6 characters
  - Passwords match
  - Terms and Privacy Policy accepted

**Step 3: API Call to Backend**
- **Endpoint:** `POST /api/auth/signup`
- **Service:** `services/authService_backend.ts` → `signUp()`
- **Request Body:**
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@university.edu",
    "password": "plaintextpassword",
    "university": "Ohio Wesleyan University"
  }
  ```

**Step 4: Backend Processing**
- **Controller:** `backend/controllers/authController.js` → `signUp()`
- **Actions:**
  1. Validates email is .edu
  2. Checks if email already exists
  3. Generates 6-digit verification code
  4. Creates VerificationCode document in MongoDB
  5. Sends verification email via `emailService.js`
  6. Stores user data temporarily in VerificationCode (not yet in User collection)

**Step 5: Verification Code Storage**
- **Model:** `backend/models/VerificationCode.js`
- **MongoDB Collection:** `verificationcodes`
- **Data Stored:**
  ```javascript
  {
    email: "john.doe@university.edu",
    code: "123456",
    userData: {
      firstName: "John",
      lastName: "Doe",
      university: "Ohio Wesleyan University",
      password: "hashed_password" // Hashed by bcrypt
    },
    createdAt: Date,
    expiresAt: Date // 2 minutes from creation
  }
  ```

**Step 6: Email Verification**
- **Endpoint:** `POST /api/verify-code`
- **Controller:** `backend/controllers/verificationController.js`
- **Process:**
  1. Verifies code matches and is not expired
  2. Checks if user already exists (prevent duplicates)
  3. Creates User document in MongoDB
  4. Generates JWT token
  5. Deletes VerificationCode document
  6. Returns token and user data

**Step 7: User Document Creation**
- **Model:** `backend/models/User.js`
- **MongoDB Collection:** `users`
- **Data Stored:**
  ```javascript
  {
    _id: ObjectId("507f1f77bcf86cd799439011"),
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@university.edu", // Lowercased, unique index
    password: "$2a$10$hashed_password_here", // bcrypt hash, 10 rounds
    university: "Ohio Wesleyan University",
    profilePicture: null, // Initially null
    createdAt: ISODate("2025-01-15T10:30:00Z"),
    // password field excluded from queries by default (select: false)
  }
  ```

**Step 8: JWT Token Generation**
- **Location:** `backend/controllers/authController.js` → `generateToken()`
- **Token Contains:**
  ```javascript
  {
    userId: "507f1f77bcf86cd799439011",
    // No password or sensitive data
  }
  ```
- **Expiration:** Set in environment variables (default: 7 days)
- **Algorithm:** HS256

**Step 9: Token Storage on Device**
- **Location:** Device AsyncStorage
- **Service:** `services/authService_backend.ts`
- **Storage Keys:**
  - `@onlyswap_token`: JWT token string
  - `@onlyswap_user`: User data JSON
- **Data Stored:**
  ```javascript
  // AsyncStorage.setItem('@onlyswap_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
  // AsyncStorage.setItem('@onlyswap_user', JSON.stringify({
  //   id: "507f1f77bcf86cd799439011",
  //   firstName: "John",
  //   lastName: "Doe",
  //   email: "john.doe@university.edu",
  //   university: "Ohio Wesleyan University",
  //   profilePicture: null
  // }))
  ```

**Step 10: User Context Initialization**
- **Location:** `context/UserContext.tsx`
- **Process:**
  1. Loads token from AsyncStorage
  2. Validates token with backend (`GET /api/auth/me`)
  3. Loads user data
  4. Sets user state in React Context
  5. App becomes authenticated

---

## 2. Profile Data Storage

### 2.1 Profile Update Flow

**Step 1: User Edits Profile**
- **Screen:** `app/edit-profile.tsx`
- **Data Fields:**
  - First Name (optional)
  - Last Name (optional)
  - Profile Picture (optional image)

**Step 2: Image Selection (if applicable)**
- **Process:**
  - User selects image from device gallery
  - Image stored temporarily in device memory
  - FormData created with image file

**Step 3: FormData Creation**
- **Location:** `services/authService_backend.ts` → `updateProfile()`
- **FormData Structure:**
  ```javascript
  FormData {
    firstName: "John",
    lastName: "Smith", // Updated
    profilePicture: {
      uri: "file:///path/to/image.jpg",
      name: "image.jpg",
      type: "image/jpeg"
    }
  }
  ```

**Step 4: API Request**
- **Endpoint:** `PUT /api/auth/profile`
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: multipart/form-data` (auto-set by axios for FormData)

**Step 5: Backend Processing**
- **Route:** `backend/routes/authRoutes.js`
- **Middleware Chain:**
  1. `authenticateToken` - Validates JWT token
  2. `optionalUpload` - Checks Content-Type, applies Multer if FormData
  3. `handleMulterError` - Error handling
  4. `updateProfile` - Controller function

**Step 6: Image Upload (if provided)**
- **Middleware:** Multer (`multer.single('profilePicture')`)
- **Storage:** `backend/uploads/` directory
- **File Naming:** `profile-{timestamp}-{random}.{extension}`
- **Example:** `profile-1762160730197-749746119.jpeg`
- **File Metadata Stored:**
  ```javascript
  req.file = {
    fieldname: 'profilePicture',
    originalname: 'image.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    destination: 'backend/uploads/',
    filename: 'profile-1762160730197-749746119.jpeg',
    path: 'backend/uploads/profile-1762160730197-749746119.jpeg',
    size: 245678
  }
  ```

**Step 7: Database Update**
- **Controller:** `backend/controllers/authController.js` → `updateProfile()`
- **MongoDB Operation:**
  ```javascript
  User.findByIdAndUpdate(
    userId,
    {
      firstName: "John", // Trimmed
      lastName: "Smith", // Trimmed
      profilePicture: "/uploads/profile-1762160730197-749746119.jpeg"
    },
    { new: true, runValidators: true }
  )
  ```
- **Updated User Document:**
  ```javascript
  {
    _id: ObjectId("507f1f77bcf86cd799439011"),
    firstName: "John",
    lastName: "Smith", // Updated
    email: "john.doe@university.edu",
    password: "$2a$10$hashed...",
    university: "Ohio Wesleyan University",
    profilePicture: "/uploads/profile-1762160730197-749746119.jpeg", // Updated
    createdAt: ISODate("2025-01-15T10:30:00Z"),
    // No updatedAt field (can be added if needed)
  }
  ```

**Step 8: Frontend Update**
- **Service:** `authService_backend.ts` → `updateProfile()`
- **Actions:**
  1. Receives updated user data from API
  2. Updates AsyncStorage user data
  3. Updates UserContext state
  4. UI reflects changes immediately

---

## 3. Product Listing Data Flow

### 3.1 Product Creation Process

**Step 1: User Creates Listing**
- **Screen:** `app/add-product.tsx`
- **Data Collected:**
  - Title (text, max 100 chars)
  - Description (text, max 1000 chars)
  - Price (number)
  - Category (dropdown: Textbooks, Electronics, Clothing, Furniture, Sports Equipment, Other)
  - Images (one or more, from device gallery)

**Step 2: Form Validation**
- **Frontend Validation:**
  - All required fields filled
  - Price is valid number > 0
  - At least one image selected
  - Title and description within character limits

**Step 3: FormData Preparation**
- **Location:** `app/add-product.tsx` → `handleSubmit()`
- **FormData Structure:**
  ```javascript
  FormData {
    title: "MacBook Pro 13 inch",
    description: "Excellent condition, barely used...",
    price: "800",
    category: "Electronics",
    university: "Ohio Wesleyan University", // Auto-filled from user
    images: [
      {
        uri: "file:///path/to/image1.jpg",
        name: "image1.jpg",
        type: "image/jpeg"
      },
      {
        uri: "file:///path/to/image2.jpg",
        name: "image2.jpg",
        type: "image/jpeg"
      }
    ]
  }
  ```

**Step 4: API Request**
- **Endpoint:** `POST /api/products`
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: multipart/form-data` (auto-set)
- **Service:** `services/api.ts` → Axios instance

**Step 5: Backend Processing**
- **Route:** `backend/routes/productRoutes.js`
- **Middleware:**
  1. `authenticateToken` - Validates user
  2. `upload.array('images', 5)` - Multer handles up to 5 images
  3. `createProduct` - Controller function

**Step 6: Image Upload**
- **Multer Configuration:**
  - Storage: `backend/uploads/` directory
  - File naming: `product-{timestamp}-{random}.{extension}`
  - Max file size: 5MB per image
  - Allowed types: image/jpeg, image/png, image/heic
- **Files Stored:**
  ```
  backend/uploads/product-1762130399453-103123240.jpg
  backend/uploads/product-1762131766907-196089889.jpg
  ```

**Step 7: Product Document Creation**
- **Model:** `backend/models/Product.js`
- **Controller:** `backend/controllers/productController.js` → `createProduct()`
- **MongoDB Operation:**
  ```javascript
  Product.create({
    sellerId: ObjectId("507f1f77bcf86cd799439011"), // From token
    title: "MacBook Pro 13 inch",
    description: "Excellent condition, barely used...",
    price: 800,
    category: "Electronics",
    university: "Ohio Wesleyan University",
    imageUrl: "/uploads/product-1762130399453-103123240.jpg", // First image
    images: [
      "/uploads/product-1762130399453-103123240.jpg",
      "/uploads/product-1762131766907-196089889.jpg"
    ],
    status: "available",
    leftSwipeCount: 0,
    rightSwipeCount: 0,
    createdAt: Date.now()
  })
  ```

**Step 8: Product Document Structure**
- **MongoDB Collection:** `products`
- **Document:**
  ```javascript
  {
    _id: ObjectId("507f191e810c19729de860ea"),
    sellerId: ObjectId("507f1f77bcf86cd799439011"), // Reference to User
    title: "MacBook Pro 13 inch",
    description: "Excellent condition, barely used...",
    price: 800,
    category: "Electronics",
    university: "Ohio Wesleyan University",
    imageUrl: "/uploads/product-1762130399453-103123240.jpg",
    images: [
      "/uploads/product-1762130399453-103123240.jpg",
      "/uploads/product-1762131766907-196089889.jpg"
    ],
    status: "available", // available, sold, pending
    leftSwipeCount: 0,
    rightSwipeCount: 0,
    createdAt: ISODate("2025-01-15T11:00:00Z")
  }
  ```

**Step 9: Response to Frontend**
- **API Response:**
  ```json
  {
    "success": true,
    "message": "Product created successfully",
    "data": {
      "_id": "507f191e810c19729de860ea",
      "title": "MacBook Pro 13 inch",
      // ... full product object
    }
  }
  ```

**Step 10: Frontend Update**
- **Location:** `app/add-product.tsx`
- **Actions:**
  1. Shows success message
  2. Navigates back to marketplace
  3. Marketplace refreshes to show new product

---

## 4. Bid Data Storage

### 4.1 Bid Creation Process

**Step 1: User Places Bid**
- **Screen:** `app/(tabs)/index.tsx` → BidModal component
- **Data Collected:**
  - Product ID (from selected product)
  - Bid Amount (user input, must be ≥ 50% of asking price)

**Step 2: Bid Validation**
- **Frontend Validation:**
  - Amount is valid number
  - Amount ≥ 50% of asking price
  - User is not the seller

**Step 3: API Request**
- **Endpoint:** `POST /api/bids`
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "productId": "507f191e810c19729de860ea",
    "amount": 750
  }
  ```

**Step 4: Backend Processing**
- **Controller:** `backend/controllers/bidController.js` → `createBid()`
- **Validation:**
  1. Validates product exists
  2. Checks user is not the seller
  3. Checks product is still available
  4. Validates bid amount

**Step 5: Bid Document Creation**
- **Model:** `backend/models/Bid.js`
- **MongoDB Operation:**
  ```javascript
  Bid.create({
    productId: ObjectId("507f191e810c19729de860ea"),
    buyerId: ObjectId("507f1f77bcf86cd799439011"),
    sellerId: ObjectId("507f1f77bcf86cd799439012"), // From product
    amount: 750,
    createdAt: Date.now()
  })
  ```

**Step 6: Bid Document Structure**
- **MongoDB Collection:** `bids`
- **Document:**
  ```javascript
  {
    _id: ObjectId("507f1f77bcf86cd799439013"),
    productId: ObjectId("507f191e810c19729de860ea"), // Reference to Product
    buyerId: ObjectId("507f1f77bcf86cd799439011"), // Reference to User (buyer)
    sellerId: ObjectId("507f1f77bcf86cd799439012"), // Reference to User (seller)
    amount: 750,
    createdAt: ISODate("2025-01-15T12:00:00Z")
  }
  ```

**Step 7: Chat Thread Creation**
- **Service:** `backend/services/threadService.js` → `ensureThread()`
- **Process:**
  1. Checks if thread exists for buyer/seller/product combination
  2. If not, creates new ChatThread document
  3. Returns thread ID

**Step 8: Chat Thread Document**
- **Model:** `backend/models/ChatThread.js`
- **MongoDB Collection:** `chatthreads`
- **Document:**
  ```javascript
  {
    _id: ObjectId("507f1f77bcf86cd799439014"),
    productId: ObjectId("507f191e810c19729de860ea"),
    buyerId: ObjectId("507f1f77bcf86cd799439011"),
    sellerId: ObjectId("507f1f77bcf86cd799439012"),
    lastMessage: "I'm bidding $750 for \"MacBook Pro 13 inch\".",
    lastMessageAt: ISODate("2025-01-15T12:00:00Z"),
    createdAt: ISODate("2025-01-15T12:00:00Z")
  }
  ```

**Step 9: System Message Creation**
- **Service:** `backend/services/threadService.js` → `createAndEmitMessage()`
- **Model:** `backend/models/Message.js`
- **Message Document:**
  ```javascript
  {
    _id: ObjectId("507f1f77bcf86cd799439015"),
    threadId: ObjectId("507f1f77bcf86cd799439014"),
    senderId: ObjectId("507f1f77bcf86cd799439011"),
    receiverId: ObjectId("507f1f77bcf86cd799439012"),
    text: "I'm bidding $750 for \"MacBook Pro 13 inch\".",
    productImage: "/uploads/product-1762130399453-103123240.jpg",
    kind: "system", // system, user
    isRead: false,
    createdAt: ISODate("2025-01-15T12:00:00Z")
  }
  ```

**Step 10: Notification Creation**
- **Model:** `backend/models/Notification.js`
- **Controller:** `backend/controllers/bidController.js`
- **Notification Document:**
  ```javascript
  {
    _id: ObjectId("507f1f77bcf86cd799439016"),
    userId: ObjectId("507f1f77bcf86cd799439012"), // Seller
    type: "bid",
    message: "John Doe placed a bid of $750 on \"MacBook Pro 13 inch\"",
    relatedId: "507f1f77bcf86cd799439014", // Thread ID
    isRead: false,
    createdAt: ISODate("2025-01-15T12:00:00Z")
  }
  ```

**Step 11: Socket.IO Events**
- **Emitted Events:**
  1. `newMessage` - Sent to thread room
  2. `newNotification` - Sent to seller's user room

---

## 5. Chat/Messaging Data Flow

### 5.1 Message Sending Process

**Step 1: User Types Message**
- **Screen:** `app/chat-room.tsx`
- **Data:**
  - Message text (user input)
  - Thread ID (from route params)
  - Sender ID (from UserContext)
  - Receiver ID (from route params)

**Step 2: API Request**
- **Endpoint:** `POST /api/chats/thread/:threadId/message`
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "senderId": "507f1f77bcf86cd799439011",
    "receiverId": "507f1f77bcf86cd799439012",
    "text": "Is this still available?"
  }
  ```

**Step 3: Backend Processing**
- **Controller:** `backend/controllers/chatController.js` → `sendMessage()`
- **Validation:**
  1. Verifies thread exists
  2. Verifies user is participant (buyer or seller)
  3. Validates message text is not empty

**Step 4: Message Creation**
- **Service:** `backend/services/threadService.js` → `createAndEmitMessage()`
- **Model:** `backend/models/Message.js`
- **MongoDB Operation:**
  ```javascript
  Message.create({
    threadId: ObjectId("507f1f77bcf86cd799439014"),
    senderId: ObjectId("507f1f77bcf86cd799439011"),
    receiverId: ObjectId("507f1f77bcf86cd799439012"),
    text: "Is this still available?",
    productImage: null,
    kind: "user",
    isRead: false,
    createdAt: Date.now()
  })
  ```

**Step 5: Message Document Structure**
- **MongoDB Collection:** `messages`
- **Document:**
  ```javascript
  {
    _id: ObjectId("507f1f77bcf86cd799439017"),
    threadId: ObjectId("507f1f77bcf86cd799439014"),
    senderId: ObjectId("507f1f77bcf86cd799439011"), // Reference to User
    receiverId: ObjectId("507f1f77bcf86cd799439012"), // Reference to User
    text: "Is this still available?",
    productImage: null, // Optional, can be product image URL
    kind: "user", // user, system
    isRead: false,
    createdAt: ISODate("2025-01-15T12:30:00Z")
  }
  ```

**Step 6: Thread Update**
- **Operation:**
  ```javascript
  ChatThread.findByIdAndUpdate(threadId, {
    lastMessage: "Is this still available?",
    lastMessageAt: Date.now()
  })
  ```

**Step 7: Notification Creation (if user message)**
- **Only for `kind: "user"` messages**
- **Notification Document:**
  ```javascript
  {
    _id: ObjectId("507f1f77bcf86cd799439018"),
    userId: ObjectId("507f1f77bcf86cd799439012"), // Receiver
    type: "message",
    message: "John Doe: Is this still available?",
    relatedId: "507f1f77bcf86cd799439014", // Thread ID
    isRead: false,
    createdAt: ISODate("2025-01-15T12:30:00Z")
  }
  ```

**Step 8: Socket.IO Events**
- **Events Emitted:**
  1. `newMessage` - To thread room (both users receive)
  2. `newNotification` - To receiver's user room

**Step 9: Real-time Update**
- **Frontend:** `app/chat-room.tsx`
- **Socket Listener:**
  ```javascript
  socketService.onNewMessage((message) => {
    setMessages(prev => [...prev, message]);
  })
  ```

### 5.2 Message History Loading

**Step 1: User Opens Chat Room**
- **Screen:** `app/chat-room.tsx`
- **API Call:** `GET /api/chats/thread/:threadId/messages`

**Step 2: Backend Retrieval**
- **Controller:** `backend/controllers/chatController.js` → `getMessages()`
- **MongoDB Query:**
  ```javascript
  Message.find({ threadId })
    .populate('senderId', 'firstName lastName email')
    .sort({ createdAt: 1 }) // Oldest first
  ```

**Step 3: Response**
- **Returns array of messages:**
  ```json
  {
    "success": true,
    "count": 5,
    "data": [
      {
        "_id": "...",
        "text": "I'm bidding $750...",
        "senderId": { "firstName": "John", "lastName": "Doe" },
        "createdAt": "2025-01-15T12:00:00Z"
      },
      // ... more messages
    ]
  }
  ```

---

## 6. Notification Data Storage

### 6.1 Notification Creation

**Triggers:**
1. New bid placed → Creates bid notification
2. New message received → Creates message notification
3. Product sold (future feature) → Creates sale notification

**Notification Document Structure:**
- **Model:** `backend/models/Notification.js`
- **MongoDB Collection:** `notifications`
- **Document:**
  ```javascript
  {
    _id: ObjectId("507f1f77bcf86cd799439019"),
    userId: ObjectId("507f1f77bcf86cd799439012"), // Who receives it
    type: "bid", // bid, message, sale
    message: "John Doe placed a bid of $750 on \"MacBook Pro 13 inch\"",
    relatedId: "507f1f77bcf86cd799439014", // Thread ID or Product ID
    isRead: false,
    createdAt: ISODate("2025-01-15T12:00:00Z")
  }
  ```

### 6.2 Notification Retrieval

**Step 1: User Opens Notifications Tab**
- **Screen:** `app/(tabs)/notifications.tsx`
- **API Call:** `GET /api/notifications`

**Step 2: Backend Query**
- **Controller:** `backend/controllers/notificationController.js` → `getNotifications()`
- **MongoDB Query:**
  ```javascript
  Notification.find({ userId })
    .sort({ createdAt: -1 }) // Newest first
    .limit(50)
  ```

**Step 3: Unread Count**
- **Separate Query:**
  ```javascript
  Notification.countDocuments({
    userId,
    isRead: false
  })
  ```

### 6.3 Notification Marking as Read

**Step 1: User Taps Notification**
- **API Call:** `PUT /api/notifications/:id/read`

**Step 2: Backend Update**
- **Controller:** `notificationController.js` → `markAsRead()`
- **Operation:**
  ```javascript
  Notification.findByIdAndUpdate(id, {
    isRead: true
  })
  ```

---

## 7. Support Ticket Data Flow

### 7.1 Bug Report Process

**Step 1: User Reports Bug**
- **Screen:** `app/help-support.tsx`
- **Data Collected:**
  - Subject (text)
  - Description (text area)

**Step 2: API Request**
- **Endpoint:** `POST /api/support/report-bug`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "subject": "App crashes when uploading images",
    "description": "When I try to upload an image..."
  }
  ```

**Step 3: Backend Processing**
- **Controller:** `backend/controllers/supportController.js` → `reportBug()`
- **Process:**
  1. Gets user data from token
  2. Creates SupportTicket document
  3. Stores user data snapshot
  4. Sends email to onlyswapwck@gmail.com

**Step 4: Support Ticket Document**
- **Model:** `backend/models/SupportTicket.js`
- **MongoDB Collection:** `supporttickets`
- **Document:**
  ```javascript
  {
    _id: ObjectId("507f1f77bcf86cd799439020"),
    userId: ObjectId("507f1f77bcf86cd799439011"),
    type: "bug",
    subject: "App crashes when uploading images",
    description: "When I try to upload an image...",
    reportedUserId: null, // Not applicable for bug reports
    status: "open", // open, in_progress, resolved, closed
    userData: {
      email: "john.doe@university.edu",
      firstName: "John",
      lastName: "Doe",
      university: "Ohio Wesleyan University",
      userId: "507f1f77bcf86cd799439011"
    },
    createdAt: ISODate("2025-01-15T13:00:00Z"),
    updatedAt: ISODate("2025-01-15T13:00:00Z")
  }
  ```

### 7.2 User Report Process

**Step 1: User Reports Another User**
- **Screen:** `app/help-support.tsx`
- **Data Collected:**
  - User ID/Email/Name (text input)
  - Subject (text)
  - Description (text area)

**Step 2: Backend User Lookup**
- **Controller:** `supportController.js` → `reportUser()`
- **User Search:**
  1. Tries ObjectId lookup
  2. Tries email lookup
  3. Tries name search (firstName/lastName)
  4. Returns found user or error

**Step 3: Support Ticket Creation**
- **Document:**
  ```javascript
  {
    _id: ObjectId("507f1f77bcf86cd799439021"),
    userId: ObjectId("507f1f77bcf86cd799439011"), // Reporter
    type: "user_report",
    subject: "Fraudulent listing",
    description: "This user posted a fake product...",
    reportedUserId: ObjectId("507f1f77bcf86cd799439012"), // Reported user
    status: "open",
    userData: {
      email: "john.doe@university.edu",
      firstName: "John",
      lastName: "Doe",
      university: "Ohio Wesleyan University",
      userId: "507f1f77bcf86cd799439011"
    },
    createdAt: ISODate("2025-01-15T13:30:00Z"),
    updatedAt: ISODate("2025-01-15T13:30:00Z")
  }
  ```

**Step 4: Email Notification**
- **Service:** `backend/utils/emailService.js` → `sendSupportTicketEmail()`
- **Email Sent To:** onlyswapwck@gmail.com
- **Email Contains:**
  - Ticket ID
  - Reporter information
  - Reported user information (if user report)
  - Subject and description
  - Formatted HTML email

---

## 8. Settings and Preferences Storage

### 8.1 Settings Data Flow

**Step 1: User Changes Settings**
- **Screen:** `app/settings.tsx`
- **Settings:**
  - Notifications enabled (boolean)
  - Bid notifications (boolean)
  - Message notifications (boolean)
  - Seller mode (boolean)

**Step 2: Local Storage Update**
- **Service:** `services/settingsService.ts`
- **Storage:** Device AsyncStorage
- **Key:** `@onlyswap_settings`
- **Data Structure:**
  ```javascript
  {
    notificationsEnabled: true,
    bidNotifications: true,
    messageNotifications: true,
    isSellerMode: false
  }
  ```

**Step 3: Settings Persistence**
- **Save Function:** `saveSettings()` or `updateSetting()`
- **Storage:**
  ```javascript
  AsyncStorage.setItem('@onlyswap_settings', JSON.stringify({
    notificationsEnabled: true,
    bidNotifications: true,
    messageNotifications: true,
    isSellerMode: false
  }))
  ```

**Step 4: Settings Loading**
- **On App Start:** `context/UserContext.tsx`
- **Load Function:** `loadSettings()`
- **Process:**
  1. Reads from AsyncStorage
  2. Merges with defaults if missing keys
  3. Sets seller mode in UserContext
  4. Sets notification preferences

**Step 5: Seller Mode Sync**
- **Location:** `context/UserContext.tsx`
- **Process:**
  - Seller mode stored in both:
    1. UserContext state (in-memory)
    2. AsyncStorage settings (persistent)
  - Loaded on app start
  - Saved when toggled

---

## 9. Authentication and Session Data

### 9.1 Login Process

**Step 1: User Logs In**
- **Screen:** `app/login.tsx`
- **Data:**
  - Email
  - Password

**Step 2: API Request**
- **Endpoint:** `POST /api/auth/login`
- **Request Body:**
  ```json
  {
    "email": "john.doe@university.edu",
    "password": "plaintextpassword"
  }
  ```

**Step 3: Backend Authentication**
- **Controller:** `backend/controllers/authController.js` → `login()`
- **Process:**
  1. Finds user by email (includes password field)
  2. Compares password using `user.comparePassword()`
  3. If valid, generates JWT token
  4. Returns token and user data (without password)

**Step 4: Token Storage**
- **Same as registration:**
  - `@onlyswap_token` in AsyncStorage
  - `@onlyswap_user` in AsyncStorage

### 9.2 Token Validation

**Every Protected API Request:**
- **Middleware:** `backend/middleware/authMiddleware.js` → `authenticateToken()`
- **Process:**
  1. Extracts token from `Authorization: Bearer <token>` header
  2. Verifies token signature using JWT_SECRET
  3. Extracts userId from token
  4. Attaches user to `req.user`
  5. Request proceeds to controller

**Token Structure:**
```javascript
// Encoded JWT
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJpYXQiOjE3MDUzMjE2MDAsImV4cCI6MTcwNTkyNjQwMH0.signature"

// Decoded Payload
{
  userId: "507f1f77bcf86cd799439011",
  iat: 1705321600, // Issued at
  exp: 1705926400  // Expiration
}
```

### 9.3 Logout Process

**Step 1: User Logs Out**
- **Screen:** `app/(tabs)/profile.tsx`
- **Function:** `handleLogout()`

**Step 2: Data Clearing**
- **Service:** `services/authService_backend.ts` → `signOut()`
- **Actions:**
  1. Removes `@onlyswap_token` from AsyncStorage
  2. Removes `@onlyswap_user` from AsyncStorage
  3. Clears UserContext state
  4. Navigates to login screen

**Note:** Backend has no logout endpoint - tokens are stateless. Invalidated by expiration or removal from client.

---

## 10. Image and File Storage

### 10.1 Image Storage Structure

**Server Directory:**
```
backend/uploads/
├── product-1762130399453-103123240.jpg
├── product-1762131766907-196089889.jpg
├── product-1762132189378-17162562.jpg
├── profile-1762160730197-749746119.jpeg
└── ...
```

**File Naming Convention:**
- Products: `product-{timestamp}-{random}.{extension}`
- Profiles: `profile-{timestamp}-{random}.{extension}`
- Timestamp: Milliseconds since epoch
- Random: Random number for uniqueness

**File Access:**
- **Static File Serving:** Express middleware
- **Route:** `app.use('/uploads', express.static('backend/uploads'))`
- **URL Format:**
  - Relative: `/uploads/product-1762130399453-103123240.jpg`
  - Full: `http://206.21.136.212:3001/uploads/product-1762130399453-103123240.jpg`

### 10.2 Image URL Construction

**Frontend:**
- **Service:** `services/apiConfig.ts` → `getApiBaseUrl()`
- **Process:**
  1. Gets API base URL from environment (`EXPO_PUBLIC_API_URL`)
  2. Combines with relative path from database
  3. Example:
     ```javascript
     const baseUrl = "http://206.21.136.212:3001";
     const imagePath = "/uploads/product-1762130399453-103123240.jpg";
     const fullUrl = `${baseUrl}${imagePath}`;
     // Result: "http://206.21.136.212:3001/uploads/product-1762130399453-103123240.jpg"
     ```

**Components:**
- **ProductCard:** `components/marketplace/ProductCard.tsx`
- **Process:**
  1. Receives image path from API (relative or full)
  2. Normalizes to full URL if needed
  3. Displays in `<Image>` component

---

## 11. Data Storage Locations Summary

### 11.1 MongoDB Collections

**Database:** OnlySwap (MongoDB)

**Collections:**
1. **users**
   - User accounts
   - Profile information
   - Authentication data

2. **verificationcodes**
   - Temporary email verification codes
   - Expires after 2 minutes
   - Auto-deleted after verification

3. **products**
   - Product listings
   - Images (paths only)
   - Status tracking

4. **bids**
   - Bid records
   - Buyer/seller/product relationships

5. **chatthreads**
   - Chat thread metadata
   - Last message tracking

6. **messages**
   - Individual messages
   - Thread relationships
   - Read status

7. **notifications**
   - User notifications
   - Read/unread status
   - Type and metadata

8. **supporttickets**
   - Bug reports
   - User reports
   - Status tracking

9. **passwordresetcodes**
   - Temporary password reset codes
   - Expires after 10 minutes

### 11.2 Server File Storage

**Directory:** `backend/uploads/`
- **Products:** Product images
- **Profiles:** Profile pictures
- **Format:** JPEG, PNG, HEIC
- **Max Size:** 5MB per file
- **Naming:** `{type}-{timestamp}-{random}.{ext}`

### 11.3 Device Storage (AsyncStorage)

**Storage Keys:**
1. **`@onlyswap_token`**
   - JWT authentication token
   - Type: String
   - Expires: Set in backend (default 7 days)

2. **`@onlyswap_user`**
   - User profile data (cached)
   - Type: JSON string
   - Structure: User object without password

3. **`@onlyswap_settings`**
   - App preferences
   - Type: JSON string
   - Structure: Settings object

### 11.4 In-Memory Storage (React Context)

**UserContext:**
- Current user state
- Authentication status
- Seller mode preference
- Loaded from AsyncStorage on app start

**Component State:**
- Form data (temporary)
- UI state (modals, loading, etc.)
- Not persisted

---

## 12. Data Flow Diagrams

### 12.1 Complete User Journey

```
1. Registration
   User Input → Frontend Validation → API Call → Backend Validation
   → VerificationCode Created → Email Sent → User Verifies
   → User Document Created → Token Generated → Stored in AsyncStorage
   → UserContext Updated → App Authenticated

2. Product Listing
   User Input → FormData Created → Multer Upload (Images)
   → Images Saved to /uploads/ → Product Document Created
   → Response Sent → Frontend Updates → Product Visible

3. Bidding
   User Input → API Call → Bid Document Created
   → Thread Created → System Message Created
   → Notification Created → Socket.IO Events
   → Real-time Updates on Both Devices

4. Messaging
   User Types → API Call → Message Document Created
   → Thread Updated → Notification Created
   → Socket.IO Events → Real-time Delivery
   → UI Updates on Both Devices

5. Settings
   User Toggles → Local State Update → AsyncStorage Save
   → Settings Persisted → Loaded on Next App Start
```

---

## 13. Data Relationships

### 13.1 User Relationships

```
User (1) ──< (Many) Products
User (1) ──< (Many) Bids (as buyer)
User (1) ──< (Many) Bids (as seller)
User (1) ──< (Many) Messages (as sender)
User (1) ──< (Many) Messages (as receiver)
User (1) ──< (Many) Notifications
User (1) ──< (Many) SupportTickets
```

### 13.2 Product Relationships

```
Product (1) ──< (Many) Bids
Product (1) ──< (1) ChatThread
Product (1) ──> (1) User (seller)
```

### 13.3 Chat Thread Relationships

```
ChatThread (1) ──< (Many) Messages
ChatThread (1) ──> (1) Product
ChatThread (1) ──> (1) User (buyer)
ChatThread (1) ──> (1) User (seller)
```

---

## 14. Data Persistence Timeline

### 14.1 Temporary Data (< 2 minutes)
- VerificationCode documents (auto-deleted after verification)
- PasswordResetCode documents (auto-deleted after use)

### 14.2 Session Data (Until Logout)
- JWT tokens in AsyncStorage
- Cached user data in AsyncStorage
- React Context state

### 14.3 Permanent Data (Until Deletion)
- User accounts
- Product listings
- Bids
- Messages
- Notifications
- Support tickets

### 14.4 File Storage
- Product images (permanent until product deleted)
- Profile pictures (permanent until user deleted or updated)

---

## 15. Data Security Measures

### 15.1 Password Security
- **Hashing:** bcrypt with 10 salt rounds
- **Storage:** Never stored in plain text
- **Query:** Excluded from queries by default (`select: false`)
- **Comparison:** `user.comparePassword()` method

### 15.2 Token Security
- **Algorithm:** HS256 (HMAC SHA-256)
- **Secret:** Stored in environment variable
- **Expiration:** Configurable (default 7 days)
- **Storage:** AsyncStorage (device-specific)
- **Transmission:** HTTPS only

### 15.3 Data Transmission
- **API:** HTTPS/WSS encryption
- **Headers:** Authorization token in headers
- **File Uploads:** Multipart/form-data over HTTPS

### 15.4 Access Control
- **Authentication:** Required for all protected routes
- **Authorization:** Users can only access their own data
- **Thread Access:** Users can only view threads they're part of
- **Product Access:** Users can only edit their own products

---

## 16. Data Backup and Recovery

### 16.1 Current Backup Strategy
- **MongoDB:** Database-level backups (if configured)
- **Files:** Server file system backups (if configured)
- **AsyncStorage:** Device-specific (not backed up)

### 16.2 Data Recovery
- **User Accounts:** Can be recovered from MongoDB
- **Messages:** Permanent unless explicitly deleted
- **Products:** Permanent unless deleted by user
- **Images:** Stored on server, recoverable from backups

---

## 17. Data Deletion Process

### 17.1 Account Deletion (Future Feature)
**Process:**
1. User requests account deletion
2. Backend marks account for deletion
3. Associated data handling:
   - Products: Deleted or anonymized
   - Bids: Deleted or anonymized
   - Messages: Deleted or anonymized
   - Notifications: Deleted
   - Support tickets: Retained for compliance
4. User document deleted
5. Images in /uploads/ deleted (if not used by other products)

### 17.2 Product Deletion
**Process:**
1. User deletes product
2. Product document deleted from MongoDB
3. Associated bids deleted
4. Chat threads may be retained
5. Images in /uploads/ deleted from server

---

## 18. Analytics and Tracking Data

### 18.1 Usage Analytics
**Currently Tracked:**
- Swipe counts (left/right) per product
- Product views
- Bid placements
- Message counts

**Storage:**
- Swipe counts in Product document (`leftSwipeCount`, `rightSwipeCount`)
- Other analytics in database queries (not stored separately)

### 18.2 Error Tracking
**Currently:**
- Console logging in development
- Error responses in API

**Future:**
- Error logging service (e.g., Sentry)
- Analytics service (e.g., Google Analytics)

---

## Conclusion

This document provides a comprehensive overview of how data flows through the OnlySwap system from account creation through all user activities. All data is stored securely, with proper authentication, validation, and access controls at each step.

**Key Takeaways:**
- User data stored in MongoDB with proper relationships
- Images stored on server file system
- Authentication tokens stored on device
- Settings stored locally on device
- Real-time updates via Socket.IO
- All sensitive data (passwords) properly hashed
- All communications encrypted (HTTPS/WSS)

**Last Updated:** January 15, 2025

