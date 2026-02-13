# OnlySwap Backend API Documentation

## Base URL
```
http://localhost:3001/api
```

---

## Authentication Endpoints

### POST `/auth/signup`
Create a new account (sends verification email).
- **Body**: `{ firstName, lastName, university, email, password }`
- **Response**: Verification code sent to email

### POST `/auth/login`
Sign in to existing account.
- **Body**: `{ email, password }`
- **Response**: JWT token + user data

### POST `/verify-code`
Verify email and complete account creation.
- **Body**: `{ email, code }`
- **Response**: JWT token + user data

### POST `/forgot-password`
Request password reset code.
- **Body**: `{ email }`
- **Response**: Reset code sent to email

### POST `/reset-password`
Reset password with verification code.
- **Body**: `{ email, code, newPassword, confirmPassword }`
- **Response**: Success message

### GET `/auth/me`
Get current user profile.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: User data

---

## Product Endpoints

### GET `/products`
Get all products (with optional filters).
- **Query Params**:
  - `university` - Filter by university
  - `category` - Filter by category
  - `status` - Filter by status (default: 'available')
  - `limit` - Max results (default: 50)
- **Response**: Array of products

### GET `/products/:id`
Get single product by ID.
- **Response**: Product details

### POST `/products`
Create new product (requires auth).
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ title, description, price, category, university }`
- **Form Data**: `image` (optional file upload)
- **Response**: Created product

### PUT `/products/:id`
Update product (seller only).
- **Headers**: `Authorization: Bearer <token>`
- **Body**: Update fields
- **Form Data**: `image` (optional file upload)
- **Response**: Updated product

### DELETE `/products/:id`
Delete product (seller only).
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Success message

### GET `/products/my/products`
Get current user's products (seller).
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Array of user's products

---

## Bid Endpoints

### POST `/bids`
Create a new bid (requires auth).
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ productId, amount }`
- **Actions**:
  - Creates bid
  - Starts chat thread
  - Sends notification to seller
  - Emits Socket.IO events
- **Response**: Bid + initial message

### GET `/bids/product/:productId`
Get all bids for a product.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Array of bids (highest first)

### GET `/bids/my/bids`
Get current user's bids (as buyer).
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Array of user's bids

### GET `/bids/my/products/bids`
Get bids on current user's products (as seller).
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Array of bids on user's products

---

## Chat Endpoints

### POST `/chats/message`
Send a message (requires auth).
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ chatId, receiverId, message }`
- **Actions**:
  - Creates message
  - Sends notification to receiver
  - Emits Socket.IO event
- **Response**: Created message

### GET `/chats/messages/:chatId`
Get chat history.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Array of messages (oldest first)

### GET `/chats`
Get all chats for current user.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Array of chats with last message

### GET `/chats/unread/count`
Get unread message count.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Unread count

---

## Notification Endpoints

### GET `/notifications`
Get all notifications for current user.
- **Headers**: `Authorization: Bearer <token>`
- **Query Params**: `limit` (default: 50)
- **Response**: Notifications + unread count

### GET `/notifications/unread/count`
Get unread notification count.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Unread count

### PUT `/notifications/:id/read`
Mark notification as read.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Updated notification

### PUT `/notifications/read/all`
Mark all notifications as read.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Count of updated notifications

### DELETE `/notifications/:id`
Delete a notification.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Success message

---

## Socket.IO Events

### Client → Server
- `register` - Register user with Socket.IO
  - Payload: `{ userId }`

### Server → Client
- `newMessage` - New chat message received
  - Payload: `{ chatId, message, sender }`
  
- `newNotification` - New notification received
  - Payload: `{ userId, notification }`

---

## Data Models

### Product
```javascript
{
  _id: ObjectId,
  sellerId: ObjectId (ref: User),
  title: String,
  description: String,
  price: Number,
  imageUrl: String,
  category: String, // ['Textbooks', 'Electronics', 'Clothing', 'Furniture', 'Sports Equipment', 'Other']
  university: String,
  status: String, // ['available', 'sold', 'pending']
  createdAt: Date
}
```

### Bid
```javascript
{
  _id: ObjectId,
  productId: ObjectId (ref: Product),
  buyerId: ObjectId (ref: User),
  sellerId: ObjectId (ref: User),
  amount: Number,
  createdAt: Date
}
```

### Message
```javascript
{
  _id: ObjectId,
  chatId: String,
  senderId: ObjectId (ref: User),
  receiverId: ObjectId (ref: User),
  message: String,
  productImage: String, // Included on first message
  createdAt: Date
}
```

### Notification
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  type: String, // ['bid', 'message', 'sale']
  message: String,
  relatedId: String, // productId or chatId
  isRead: Boolean,
  createdAt: Date
}
```

---

## Authentication

All protected routes require:
```
Authorization: Bearer <JWT_TOKEN>
```

Token is obtained from `/auth/login` or `/verify-code` endpoints.

---

## Error Responses

All errors follow this format:
```javascript
{
  success: false,
  message: "Error description",
  error: "Detailed error message"
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

