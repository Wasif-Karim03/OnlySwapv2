# OnlySwap - Legal Documentation Guide
## For Attorney Review and Terms of Service / Privacy Policy Drafting

**Date:** January 2025  
**Prepared for:** OnlySwap Legal Team  
**Purpose:** Comprehensive overview of OnlySwap app functionality, features, data handling, and legal considerations for drafting Terms of Service and Privacy Policy.

---

## 1. APPLICATION OVERVIEW

### 1.1 What is OnlySwap?
OnlySwap is a mobile marketplace application (iOS and Android) designed exclusively for university students to buy and sell items within their university community. The app facilitates peer-to-peer transactions through a Tinder-like swiping interface combined with a bidding system.

### 1.2 Core Business Model
- **Platform Type:** Peer-to-peer marketplace facilitator
- **Revenue Model:** Currently free (no transaction fees at launch)
- **Target Users:** University students with valid .edu email addresses
- **Geographic Scope:** United States (university-specific communities)
- **Business Structure:** Technology platform connecting buyers and sellers

### 1.3 Key Differentiators
- University-exclusive (requires .edu email)
- Swipe-based product discovery
- Bidding system for price negotiation
- Real-time chat messaging
- In-app notifications

---

## 2. USER REGISTRATION & AUTHENTICATION

### 2.1 Registration Process
1. **Email Requirement:** Users must register with a valid .edu email address
2. **Verification:** Email verification code sent to user's .edu email
3. **User Information Collected:**
   - First Name
   - Last Name
   - Email Address (must be .edu)
   - University Name
   - Password (hashed and encrypted)
   - Optional: Profile Picture

### 2.2 Account Security
- Passwords are hashed using bcrypt (10 salt rounds)
- JWT tokens for session management
- Tokens stored securely in device storage (AsyncStorage)
- No password recovery via email reset (requires code verification)

### 2.3 User Authentication
- Backend API authentication required for all protected routes
- Token-based authentication system
- Automatic token expiration and refresh
- Logout functionality clears all stored authentication data

---

## 3. CORE FEATURES & FUNCTIONALITY

### 3.1 Product Listings
**What Users Can Do:**
- Create product listings with:
  - Title (max 100 characters)
  - Description (max 1000 characters)
  - Price (numeric)
  - Category (Textbooks, Electronics, Clothing, Furniture, Sports Equipment, Other)
  - University (auto-filled from user profile)
  - One or more images (uploaded from device)
- Edit their own listings
- Delete their own listings
- View their own listings ("My Listings" section)

**Technical Details:**
- Images stored on server (backend/uploads/)
- Images accessible via HTTP URLs
- Product status tracking (available, sold, pending)
- Swipe tracking analytics (left/right swipe counts)

### 3.2 Swipe-Based Discovery
**How It Works:**
- Users swipe through products (Tinder-like interface)
- Right swipe = Interested (opens bid modal)
- Left swipe = Not interested
- Products filtered by:
  - User's university (only shows products from same university)
  - Seller exclusion (doesn't show user's own products in buyer mode)
  - Status (only shows available products)

**Data Collected:**
- Swipe actions tracked for analytics
- Product views tracked
- User preferences inferred from swipe patterns

### 3.3 Bidding System
**Functionality:**
- Users can place bids on products they're interested in
- Bids must be at least 50% of asking price
- Multiple users can bid on same product
- Highest bid visible to seller
- Bid history tracked per product

**User Actions:**
- Place bid (amount + optional message)
- View all bids on their own products ("My Listings" → bids)
- View their own bids ("My Bids" section)
- Seller can accept/reject bids (future feature)

**Data Stored:**
- Bid amount
- Bid timestamp
- Bidder information
- Product ID
- Seller ID
- Buyer ID

### 3.4 Real-Time Chat Messaging
**Features:**
- Automatic chat thread creation when user places a bid
- One-on-one messaging between buyer and seller
- Real-time message delivery via Socket.IO
- Message history persisted in database
- System messages for bid notifications
- Product image sharing in chat

**Technical Implementation:**
- WebSocket connections for real-time communication
- Message encryption in transit (HTTPS/WSS)
- Messages stored in database with:
  - Sender ID
  - Receiver ID
  - Message text
  - Timestamp
  - Thread ID
  - Message type (user/system)

**Privacy Considerations:**
- Messages are private between buyer and seller
- Only participants in thread can view messages
- No message monitoring or content scanning (except for abuse reports)

### 3.5 Notifications System
**Types of Notifications:**
- Bid notifications (when someone bids on your product)
- Message notifications (new messages in chat)
- Sale notifications (future feature)

**Delivery Methods:**
- In-app notifications
- Real-time push via Socket.IO
- Notification history stored in database

**User Control:**
- Users can mark notifications as read
- Unread count tracking
- Notification preferences (Settings screen)

### 3.6 User Profiles
**Profile Information:**
- First Name
- Last Name
- Email (not visible to other users)
- University
- Profile Picture (optional)
- User ID (system-generated)

**Profile Visibility:**
- Names visible to other users in chats and bids
- Profile pictures visible in chats and product listings
- Email addresses NOT shared with other users
- University visible on profile

### 3.7 Search & Filtering
**Current Features:**
- Filter by university (automatic, based on user's university)
- Filter by category
- Filter by status (available/sold/pending)
- Seller mode toggle (see own products vs. marketplace)

**Future Features:**
- Text search (not yet implemented)
- Price range filtering
- Date filtering

---

## 4. DATA COLLECTION & STORAGE

### 4.1 User Data Collected
**Required Information:**
- First Name
- Last Name
- Email Address (.edu)
- University Name
- Password (hashed, never stored in plain text)
- Account creation timestamp

**Optional Information:**
- Profile Picture
- Notification preferences
- App settings (seller/buyer mode preference)

**Automatically Collected:**
- User ID (system-generated MongoDB ObjectId)
- Registration IP address (via server logs)
- Login timestamps
- Device information (for app functionality)
- App version

### 4.2 Transaction Data Collected
**Product Information:**
- Product title, description, price
- Category, university
- Images (stored on server)
- Listing timestamp
- Status (available/sold/pending)
- Seller ID

**Bid Information:**
- Bid amount
- Bid timestamp
- Buyer ID
- Seller ID
- Product ID

**Chat Data:**
- Message content
- Sender and receiver IDs
- Timestamps
- Thread information
- Product context (if applicable)

### 4.3 Analytics & Usage Data
**Tracked Metrics:**
- Swipe actions (left/right)
- Product views
- Bid placements
- Message send/receive counts
- Notification interactions
- App usage patterns

**Purpose:**
- Improve app functionality
- Understand user behavior
- Debug technical issues
- Analytics (not currently shared with third parties)

### 4.4 Data Storage Locations
**Backend Database (MongoDB):**
- User accounts
- Product listings
- Bids
- Messages
- Notifications
- Support tickets

**Server Storage:**
- User-uploaded images (product images, profile pictures)
- Stored in `/backend/uploads/` directory
- Accessible via HTTP URLs

**Mobile Device Storage (AsyncStorage):**
- Authentication tokens
- User profile data (cached)
- App settings/preferences
- Notification preferences

**Third-Party Services:**
- Expo (app distribution)
- Socket.IO (real-time messaging)
- Email service (Gmail SMTP for verification codes)

---

## 5. USER INTERACTIONS & TRANSACTIONS

### 5.1 How Transactions Work
**Current Flow:**
1. Seller creates listing with price
2. Buyer browses/swipes through products
3. Buyer places bid (≥50% of asking price)
4. Chat thread automatically created
5. Buyer and seller communicate via chat
6. **Transaction completion happens OFF-PLATFORM**
7. Seller manually marks product as "sold" (future feature)

**Important:**
- OnlySwap does NOT process payments
- OnlySwap does NOT handle transactions
- OnlySwap does NOT guarantee transactions
- Users arrange payment and delivery independently
- No escrow or payment protection
- No transaction fees currently

### 5.2 User-to-User Communication
**Channels:**
- In-app chat messaging
- Bid messages (attached to bid)
- System notifications

**Communication Rules:**
- Users can only message each other if:
  - They have an active bid on a product
  - They are seller/buyer of a product
- No direct user search or messaging without product context

### 5.3 Content Moderation
**Current Moderation:**
- Manual reporting system (Report a User)
- No automated content scanning
- No profanity filters
- No image content moderation
- Relies on user reports for violations

**Reporting System:**
- Users can report other users for:
  - Inappropriate behavior
  - Fraudulent listings
  - Harassment
  - Other violations
- Reports generate support tickets
- Reports sent to company email (onlyswapwck@gmail.com)
- Reports stored in database for review

---

## 6. TECHNICAL ARCHITECTURE

### 6.1 Frontend (Mobile App)
- **Framework:** React Native with Expo
- **Platforms:** iOS and Android
- **State Management:** React Context API
- **Navigation:** Expo Router
- **Real-time:** Socket.IO client
- **Storage:** AsyncStorage (local device storage)

### 6.2 Backend (Server)
- **Runtime:** Node.js with Express.js
- **Database:** MongoDB (NoSQL)
- **Authentication:** JWT tokens
- **File Upload:** Multer middleware
- **Real-time:** Socket.IO server
- **Email:** Nodemailer (Gmail SMTP)

### 6.3 Data Security
**Encryption:**
- Passwords: bcrypt hashing (10 salt rounds)
- API communications: HTTPS/WSS
- Tokens: JWT with expiration
- No plain text passwords stored

**Access Control:**
- Authentication required for all protected routes
- User can only access their own data
- Users can only view threads they're part of
- Users can only edit their own listings

**Server Security:**
- CORS configured for API access
- Request validation
- Error handling
- Input sanitization

---

## 7. THIRD-PARTY SERVICES & INTEGRATIONS

### 7.1 Current Integrations
**Expo:**
- App distribution platform
- Development tools
- Build services
- Analytics (basic)

**Socket.IO:**
- Real-time messaging
- WebSocket connections
- Event-based communication

**Gmail SMTP:**
- Email verification codes
- Password reset codes
- Support ticket notifications

### 7.2 Data Sharing with Third Parties
**Currently:**
- No data sold to third parties
- No advertising networks
- No analytics services (except basic Expo analytics)
- No payment processors
- No social media integrations

**Email Service:**
- Email provider (Gmail) processes emails
- Emails contain user information
- No persistent data storage by email provider (beyond email delivery)

---

## 8. USER RIGHTS & ACCOUNT MANAGEMENT

### 8.1 User Account Rights
- Users can delete their account (future feature)
- Users can edit their profile
- Users can change password
- Users can manage notification preferences
- Users can view their data (listings, bids, messages)

### 8.2 Account Termination
**By User:**
- Can request account deletion
- Account deletion removes:
  - User account
  - Associated listings
  - Bid history
  - Message threads
  - Notification history

**By Platform:**
- Can suspend accounts for violations
- Can terminate accounts for severe violations
- Violations include:
  - Fraudulent listings
  - Harassment
  - Spam
  - Terms of Service violations

### 8.3 Data Retention
**Active Accounts:**
- Data retained indefinitely
- Users can delete their own data
- Messages retained for communication history

**Deleted Accounts:**
- Account data deleted
- Associated listings may be anonymized or deleted
- Support tickets retained for legal/compliance purposes
- Transaction history may be retained for dispute resolution

---

## 9. POTENTIAL RISKS & LIABILITIES

### 9.1 Transaction Risks
**User-to-User Transactions:**
- No guarantee of product quality
- No guarantee of payment
- No fraud protection
- No dispute resolution service
- No refund guarantees
- Users responsible for:
  - Verifying product condition
  - Arranging payment securely
  - Arranging delivery/pickup
  - Resolving disputes

**Potential Issues:**
- Fraudulent listings
- Non-payment
- Product misrepresentation
- Delivery issues
- Counterfeit items
- Stolen goods

### 9.2 Content Risks
**User-Generated Content:**
- Inappropriate images
- Offensive descriptions
- False information
- Copyright violations
- Trademark violations

**Moderation Challenges:**
- No automated content scanning
- Relies on user reports
- Manual review process
- Response time delays

### 9.3 Communication Risks
**Chat Messaging:**
- Harassment
- Spam
- Scams
- Inappropriate content
- Privacy violations

### 9.4 Data Security Risks
**Potential Issues:**
- Data breaches
- Unauthorized access
- Account hijacking
- Image data exposure
- Personal information leaks

**Mitigation:**
- Password hashing
- HTTPS encryption
- Token-based authentication
- Input validation
- Error handling

### 9.5 Platform Liability
**What OnlySwap Does NOT Do:**
- Does not process payments
- Does not guarantee transactions
- Does not verify product authenticity
- Does not mediate disputes
- Does not provide escrow services
- Does not verify user identity beyond email
- Does not background check users

**What OnlySwap Provides:**
- Platform for listing products
- Communication tools (chat)
- Bidding system
- User matching

---

## 10. LEGAL CONSIDERATIONS FOR TERMS OF SERVICE

### 10.1 Critical Disclaimers Needed

**1. Marketplace Disclaimer**
- OnlySwap is a platform, not a party to transactions
- Users buy/sell directly with each other
- OnlySwap facilitates connections, doesn't guarantee transactions
- No warranty on products or services

**2. "As Is" Disclaimer**
- Platform provided "as is"
- No warranties (express or implied)
- No guarantee of service availability
- No guarantee of functionality

**3. Limitation of Liability**
- Maximum liability limited to fees paid (currently $0)
- Not liable for:
  - Product quality or condition
  - User disputes
  - Fraudulent transactions
  - Data loss
  - Service interruptions
  - Third-party actions

**4. User Responsibility**
- Users responsible for:
  - Verifying product authenticity
  - Arranging secure payment
  - Arranging delivery
  - Resolving disputes
  - Compliance with laws

**5. Indemnification**
- Users agree to indemnify OnlySwap from:
  - Claims arising from their use
  - Violations of terms
  - Infringement of rights
  - Disputes with other users

### 10.2 User Conduct Requirements

**Prohibited Activities:**
- Fraudulent listings
- False information
- Harassment or abuse
- Spam or unsolicited messages
- Illegal activities
- Copyright/trademark infringement
- Circumventing platform rules
- Multiple accounts
- Automated systems/bots

**Prohibited Items:**
- Alcohol
- Drugs or drug paraphernalia
- Weapons
- Stolen goods
- Counterfeit items
- Animals/pets
- Services (should be goods only)
- Items requiring licenses
- Hazardous materials

### 10.3 Intellectual Property

**Platform Ownership:**
- OnlySwap owns:
  - App design and code
  - Logo and branding
  - Platform features
  - User interface

**User Content License:**
- Users retain ownership of their content
- Users grant OnlySwap license to:
  - Display content on platform
  - Use content for platform functionality
  - Store content on servers

**User Content Requirements:**
- Users must own or have rights to content
- No copyright violations
- No trademark violations
- No unauthorized use of others' IP

### 10.4 Dispute Resolution

**User-to-User Disputes:**
- OnlySwap is not a party to disputes
- Users resolve disputes independently
- No mediation or arbitration by OnlySwap
- Users can report violations

**User-to-Platform Disputes:**
- Governing law (specify state)
- Arbitration clause (if desired)
- Class action waiver (if applicable)
- Jurisdiction (specify location)

### 10.5 Account Termination

**By User:**
- Can delete account anytime
- Data deletion process
- No refunds (if fees are added later)

**By Platform:**
- Can terminate for violations
- Can suspend for investigation
- No refunds for terminated accounts
- Data retention policy

---

## 11. LEGAL CONSIDERATIONS FOR PRIVACY POLICY

### 11.1 Data Collection Disclosure

**What Data is Collected:**
- Personal information (name, email, university)
- Account information (password, preferences)
- Transaction data (listings, bids, messages)
- Usage data (swipes, views, interactions)
- Device information (for app functionality)
- Location data (if used, currently not collected)

**How Data is Collected:**
- Directly from user (registration, profile)
- Automatically (usage, interactions)
- From device (images, settings)

### 11.2 Data Use Disclosure

**How Data is Used:**
- Provide platform services
- Facilitate transactions
- Enable communication
- Send notifications
- Improve app functionality
- Prevent fraud and abuse
- Comply with legal obligations

**Data Sharing:**
- Currently: No data sold or shared
- Email service provider (for email delivery)
- Legal requirements (if subpoenaed)
- Future: May add analytics (disclose if added)

### 11.3 Data Storage & Security

**Where Data is Stored:**
- Backend database (MongoDB)
- Server storage (images)
- Device storage (tokens, preferences)
- Third-party services (email)

**Security Measures:**
- Password hashing (bcrypt)
- HTTPS encryption
- Token-based authentication
- Access controls
- Input validation

**Data Retention:**
- Active accounts: Indefinitely
- Deleted accounts: Per deletion policy
- Support tickets: For compliance
- Legal requirements: As required by law

### 11.4 User Rights

**User Access Rights:**
- View their data
- Edit their data
- Delete their account
- Export their data (future feature)

**User Control:**
- Notification preferences
- Privacy settings
- Account deletion
- Data correction

**California Privacy Rights (if applicable):**
- CCPA compliance (if serving CA users)
- Right to know
- Right to delete
- Right to opt-out

**GDPR Compliance (if applicable):**
- Right to access
- Right to rectification
- Right to erasure
- Right to data portability
- Right to object

### 11.5 Third-Party Services

**Disclose Integrations:**
- Expo (app platform)
- Socket.IO (messaging)
- Gmail SMTP (email)
- Future services (analytics, payments, etc.)

**Third-Party Data Handling:**
- Email provider processes emails
- No data sharing with advertisers
- No data sharing with data brokers
- Compliance with third-party privacy policies

### 11.6 Children's Privacy

**COPPA Compliance:**
- Service not intended for users under 13
- Age requirement (18+ or parent consent)
- No knowingly collecting data from children
- If child data collected, parental consent required

### 11.7 International Users

**Data Transfers:**
- Currently US-focused
- Data stored in US servers
- If international expansion:
  - GDPR compliance
  - Data transfer agreements
  - Local privacy laws

---

## 12. COMPLIANCE REQUIREMENTS

### 12.1 University Compliance
- Users must comply with university policies
- Violations may be reported to university
- University-specific rules apply
- Campus policies supersede app rules where applicable

### 12.2 Legal Compliance
- Federal laws (US)
- State laws (varies by state)
- Local ordinances
- Consumer protection laws
- E-commerce regulations

### 12.3 Industry Standards
- Best practices for marketplaces
- Data security standards
- Privacy best practices
- User protection standards

---

## 13. FUTURE FEATURES & CONSIDERATIONS

### 13.1 Planned Features
- Payment processing (if added, major legal change)
- Escrow services (if added, major legal change)
- Dispute resolution (if added, major legal change)
- User ratings/reviews
- Product categories expansion
- Search functionality

### 13.2 Potential Legal Changes
- Payment processing requires:
  - Payment processor agreements
  - PCI compliance
  - Money transmitter licenses (potentially)
  - Additional terms for payment protection

- Escrow services require:
  - Escrow licenses
  - Fiduciary responsibilities
  - Additional liability

---

## 14. CONTACT INFORMATION FOR LEGAL MATTERS

**Company Email:** onlyswapwck@gmail.com  
**Support Email:** onlyswapwck@gmail.com  
**Report Issues:** In-app reporting system

---

## 15. SUMMARY FOR ATTORNEY

### Key Points for Terms of Service:
1. **Platform, not party:** Make clear OnlySwap facilitates, doesn't guarantee transactions
2. **No warranties:** "As is" service, no guarantees
3. **User responsibility:** Users responsible for transactions, payments, disputes
4. **Limitation of liability:** Cap damages, exclude indirect damages
5. **Indemnification:** Users protect platform from their actions
6. **Content ownership:** Users own content, grant license to platform
7. **Prohibited items:** Clear list of what can't be sold
8. **Account termination:** Right to suspend/terminate for violations
9. **Dispute resolution:** Users resolve disputes, platform not involved
10. **Governing law:** Specify jurisdiction

### Key Points for Privacy Policy:
1. **Data collection:** What, why, how
2. **Data use:** Clear purpose for each data type
3. **Data sharing:** Currently minimal, disclose all sharing
4. **User rights:** Access, edit, delete, export
5. **Security measures:** How data is protected
6. **Third parties:** All integrations disclosed
7. **Data retention:** How long data is kept
8. **International users:** GDPR/CCPA if applicable
9. **Children's privacy:** COPPA compliance
10. **Updates:** How policy changes are communicated

---

## 16. RECOMMENDATIONS

1. **Consult with attorney** specializing in:
   - Technology/software law
   - E-commerce law
   - Privacy law
   - State-specific requirements

2. **Consider:**
   - Business insurance
   - Terms versioning system
   - Privacy policy updates process
   - User consent mechanisms
   - Age verification (if needed)

3. **Regular review:**
   - Terms should be reviewed annually
   - Privacy policy when features change
   - Legal compliance as laws change
   - User feedback and disputes

---

**Document Prepared:** January 2025  
**For:** OnlySwap Legal Documentation  
**Next Steps:** Attorney review and drafting of Terms of Service and Privacy Policy

