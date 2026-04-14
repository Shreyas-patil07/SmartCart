# 🛒 SmartCart — Frictionless In-Store Checkout System

SmartCart is a modern, full-stack contactless shopping solution that eliminates traditional checkout lines. Customers scan products with their smartphones, manage their cart in real-time, pay digitally, and exit the store by presenting a secure QR code — all without waiting in line.

This repository contains a complete implementation with:
- **Frontend**: React 19 + Vite progressive web application with Firebase authentication
- **Backend**: Python Flask REST API with Firebase Admin SDK for token verification
- **Security**: End-to-end Firebase authentication with protected API endpoints
- **Real-time**: Live cart updates, session management, and instant QR code generation

## 📋 Table of Contents

- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [User Flow](#-user-flow)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Development](#-development)
- [Security](#-security)
- [Future Enhancements](#-future-enhancements)
- [Troubleshooting](#-troubleshooting)

## 📚 Additional Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Quick installation and setup guide
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment instructions
- **[Update_and_enhance.md](Update_and_enhance.md)** - Planned features and roadmap
- **[LEGAL_COMPLIANCE.md](LEGAL_COMPLIANCE.md)** - Privacy policy and compliance
- **[Tester/README.md](Tester/README.md)** - Barcode testing tools documentation

## ✨ Features

### Customer Experience
- **Camera-Based Scanning**: Real-time barcode detection using device camera with visual feedback
- **Live Cart Management**: Add, update, and remove items with instant price calculations
- **Multiple Payment Methods**: Support for UPI, credit/debit cards, and net banking
- **Session Timer**: Visual countdown showing remaining shopping time
- **Cart Budget Tracking**: Progress bar showing spending against configurable limits
- **Digital Exit Pass**: Secure QR code for frictionless store exit
- **Responsive Design**: Mobile-first UI optimized for in-store smartphone usage

### Store Operations
- **Guard Verification Panel**: Dedicated interface for exit gate staff to validate QR codes
- **Session Management**: Track active shopping sessions with unique identifiers
- **Real-time Inventory Awareness**: Backend tracks scanned items for inventory insights
- **Secure Payment Processing**: Server-side price calculation prevents client-side tampering

### Technical Features
- **Firebase Authentication**: Email/password and Google OAuth support with account linking
- **Protected Routes**: Client-side route guards and server-side token verification
- **Session Persistence**: Shopping sessions survive page refreshes
- **Error Handling**: Graceful fallbacks for camera access and network issues
- **Material Design 3**: Modern UI following Google's latest design system

## 🏛 System Architecture

### Frontend (`/frontend`)

A progressive web application built for speed and mobile-first usage.

**Core Technologies**:
- **React 19**: Latest React with concurrent features and automatic batching
- **Vite 7**: Lightning-fast HMR and optimized production builds
- **TailwindCSS 4**: Utility-first styling with Material Design 3 color tokens
- **React Router 6**: Client-side routing with protected route support
- **Firebase SDK 12**: Client-side authentication and Firestore integration
- **Axios**: HTTP client for API communication with interceptors
- **html5-qrcode**: Real-time barcode scanning from camera and images
- **Quagga**: Alternative barcode scanning library (installed but not actively used)

**Architecture Patterns**:
- **Context API**: Global state management for authentication and cart
- **Custom Hooks**: Reusable logic for session timers and auth state
- **Component Composition**: Modular UI components with clear separation of concerns
- **Protected Routes**: HOC pattern for route-level authentication guards

**Key Components**:
- `AuthContext`: Manages Firebase authentication state and user profile
- `CartContext`: Handles cart state with reducer pattern for predictable updates
- `ProtectedRoute`: Guards routes requiring authentication
- `SessionTimerBadge`: Visual countdown for shopping session expiration
- `Scanner`: Real-time barcode detection using Html5Qrcode with camera and image upload support

**Barcode Scanning**:
- **Live Camera Scanning**: Html5Qrcode continuously scans Code128 barcodes from camera feed
- **Image Upload**: Supports both camera capture and gallery upload for barcode scanning
- **Format Support**: CODE_128 (primary format for SMC barcodes)
- **Duplicate Prevention**: 2-second cooldown between scans
- **Normalization**: Automatic barcode format detection and cleaning

### Backend (`/backend`)

A Django REST Framework API serving as the source of truth for products, carts, and orders.

**Core Technologies**:
- **Django 4.2+**: Full-featured web framework for Python
- **Django REST Framework**: Powerful toolkit for building Web APIs
- **django-cors-headers**: Cross-origin resource sharing for frontend communication
- **Firebase Admin SDK**: Server-side token verification and user management
- **Python-dotenv**: Environment variable management
- **SQLite**: Default database (production should use PostgreSQL/Firestore)

**Architecture Patterns**:
- **Authentication Class**: `FirebaseAuthentication` class for DRF endpoint protection
- **In-Memory Storage**: Dictionary-based session and order storage (temporary, should migrate to database models)
- **RESTful Design**: Standard HTTP methods and status codes
- **Stateless Sessions**: Session data stored server-side, identified by session ID

**Security Model**:
- All protected endpoints verify Firebase ID tokens via DRF authentication
- Server-side price calculation prevents client manipulation
- CORS configured for specific frontend origins only
- QR codes use cryptographically random identifiers

**Note**: The backend was originally Flask but has been migrated to Django. The Flask version is preserved as `app_flask_backup.py`.

## 💻 Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1.1 | UI framework with concurrent features |
| Vite | 7.1.7 | Build tool and dev server |
| TailwindCSS | 4.1.13 | Utility-first CSS framework |
| React Router | 6.30.1 | Client-side routing |
| Firebase | 12.11.0 | Authentication and Firestore |
| Axios | 1.12.2 | HTTP client for API calls |
| html5-qrcode | 2.3.8 | Real-time barcode scanning |
| Quagga | 0.12.1 | Alternative barcode library |
| ESLint | 9.36.0 | Code linting and quality |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Django | 4.2+ | Web framework |
| Django REST Framework | 3.14.0+ | API toolkit |
| django-cors-headers | 4.3.0+ | Cross-origin resource sharing |
| Firebase Admin | 6.0.0+ | Server-side token verification |
| Python-dotenv | 1.0.0+ | Environment configuration |

### Development Tools
- **Node.js**: Required for frontend development
- **Python 3.8+**: Required for backend development
- **Git**: Version control
- **@zxing/browser**: Additional barcode scanning library (root level)

## 📁 Project Structure

```
SmartCart/
├── frontend/                    # React web application
│   ├── src/
│   │   ├── auth/               # Firebase authentication utilities
│   │   │   ├── authService.js  # Auth operations (login, signup, linking)
│   │   │   └── firebase.js     # Firebase config with Google provider
│   │   ├── components/         # Reusable UI components
│   │   │   ├── AppBar.jsx      # Top navigation bar
│   │   │   ├── AuthUI.jsx      # Authentication forms
│   │   │   ├── BottomNav.jsx   # Bottom navigation for mobile
│   │   │   ├── Logo.jsx        # SmartCart logo component
│   │   │   ├── ProtectedRoute.jsx  # Route guard HOC
│   │   │   ├── SessionTimerBadge.jsx  # Session countdown display
│   │   │   └── Toast.jsx       # Toast notification system
│   │   ├── context/            # React Context providers
│   │   │   ├── AuthContext.jsx # Authentication state management
│   │   │   └── CartContext.jsx # Shopping cart state with reducer
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── useAuth.js      # Auth context consumer hook
│   │   │   └── useSessionTimer.js  # Session timer logic
│   │   ├── lib/                # Utility libraries
│   │   │   ├── api.js          # Axios API client with interceptors
│   │   │   └── firebase.js     # Firebase initialization
│   │   ├── pages/              # Route page components
│   │   │   ├── Cart.jsx        # Shopping cart view with item management
│   │   │   ├── Checkout.jsx    # Payment method selection and billing
│   │   │   ├── ConfirmStore.jsx  # Store selection before shopping
│   │   │   ├── ExitPass.jsx    # QR code display and receipt
│   │   │   ├── GuardPanel.jsx  # Exit gate verification interface
│   │   │   ├── Home.jsx        # Landing page with features
│   │   │   ├── Login.jsx       # Login and signup forms
│   │   │   ├── Scanner.jsx     # Camera barcode scanning interface
│   │   │   └── SignUp.jsx      # User registration
│   │   ├── routes/             # Route configuration
│   │   ├── App.jsx             # Root component with providers
│   │   ├── main.jsx            # Application entry point
│   │   └── index.css           # Global styles and Tailwind imports
│   ├── public/                 # Static assets
│   │   └── SmartCart_remade.png  # Logo and branding
│   ├── .env                    # Environment variables (Firebase config)
│   ├── package.json            # Dependencies and scripts
│   ├── vite.config.js          # Vite configuration
│   └── eslint.config.js        # ESLint rules
│
├── backend/                    # Flask REST API
│   ├── app.py                  # Main Flask application with all endpoints
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # Environment variables (Firebase credentials)
│   ├── firebase-service-account.json  # Firebase Admin SDK credentials
│   └── README.md               # Backend-specific documentation
│
├── Tester/                     # Testing utilities
│   ├── barcodes/               # Sample barcode images for testing
│   ├── barcode_generator.py   # Script to generate test barcodes
│   └── barcodes_collection.pdf # Printable barcode collection
│
└── README.md                   # This file
```

## 🔄 User Flow

SmartCart follows a streamlined scan-and-go shopping model designed for speed and convenience:

### 1. Authentication & Store Entry
```
User opens app → Firebase login (email/password or Google) → Select store location → Session created
```
- User authenticates via Firebase (handled entirely client-side)
- Firebase issues a secure ID token stored in memory
- User selects their store location from available options
- Frontend calls `POST /session/start` with Firebase token
- Backend validates token and creates session with unique ID (e.g., `SC-A1B2C3`)

### 2. Shopping & Scanning
```
Point camera at barcode → Product validated → Add to cart → Repeat
```
- User navigates to Scanner page with live camera feed powered by Html5Qrcode
- Camera continuously scans for Code128 barcodes in real-time
- Alternative: User can take photo or upload image from gallery for barcode detection
- Frontend calls `POST /scan` to validate product exists
- Backend returns product details (name, price, image, variant)
- Frontend calls `PATCH /cart/<session_id>/item` to add item
- Cart updates in real-time with running total
- 2-second cooldown prevents duplicate scans

### 3. Cart Management
```
View cart → Adjust quantities → Remove items → See live total
```
- User can view full cart with all items and pricing
- Increase/decrease quantities with `+`/`-` buttons
- Remove items with close button
- Cart progress bar shows spending against ₹2000 limit
- All changes sync to backend via API calls

### 4. Checkout & Payment
```
Proceed to checkout → Review locked order → Select payment method → Pay
```
- Cart is locked for review (no further edits)
- Billing breakdown shows subtotal, taxes (5%), and discounts
- User selects payment method (UPI, Card, Net Banking)
- Optional coupon code entry
- Frontend calls `POST /generate-qr` with session ID and payment method

### 5. Payment Processing
```
Backend calculates total → Creates order record → Generates QR code → Returns receipt
```
- Backend recalculates total from server-side prices (security)
- Session status transitions to `completed`
- Order stored in `orders_db` with unique QR code
- QR code format: `SMARTCART-{12-char-hex}`
- Frontend receives QR code and displays exit pass

### 6. Exit Verification
```
Guard scans QR → Backend validates → Gate opens → Customer exits
```
- Customer presents QR code at exit gate
- Guard device calls `POST /guard/verify` (public endpoint, no auth required)
- Backend searches `orders_db` for matching QR code
- Returns validation status, total paid, item count, and timestamp
- Gate opens if valid, denies if invalid or already used

## 🛠️ Development

### Frontend Development

**Available Scripts**:
```bash
npm run dev      # Start Vite dev server with HMR
npm run build    # Build for production
npm run preview  # Preview production build locally
npm run lint     # Run ESLint on all source files
```

**Development Tips**:
- Hot Module Replacement (HMR) is enabled by default
- React Fast Refresh preserves component state during edits
- Tailwind classes are JIT-compiled for fast builds
- ESLint runs automatically in most editors with the ESLint extension

### Backend Development

**Running in Debug Mode (Django)**:
```bash
python manage.py runserver 0.0.0.0:5000
```

**Running Flask (Legacy)**:
```bash
python app_flask_backup.py
```

**Development Tips**:
- Django auto-reloads on file changes when `DEBUG=True`
- In-memory storage resets on server restart (sessions_db, orders_db)
- If `FIREBASE_CREDENTIALS` is not set, token verification may be skipped (dev mode)
- CORS is configured for `localhost:5173` and `localhost:4173`
- Use `python manage.py check` to verify configuration

### Testing with Sample Barcodes

The `Tester/` directory contains:
- **40 pre-generated barcode images** in `barcodes/` folder
- **barcode_generator.py**: Python script to generate additional test barcodes
- **barcodes_collection.pdf**: Printable sheet of all barcodes for physical testing

**Using Test Barcodes**:
1. Open `Tester/barcodes_collection.pdf`
2. Print or display on another device
3. Use Scanner page to scan the barcodes
4. Or use the "Simulate Scan" button for quick testing

**Important Note**: Always store user data in Firestore with proper structure:
```javascript
setDoc(doc(db, "users", user.uid), {
  uid: user.uid,
  name: user.displayName,
  email: user.email,
  createdAt: serverTimestamp()
});
```

## 🔒 Security

### Authentication Flow

1. **Client-Side**: Firebase handles user authentication and issues JWT tokens
2. **Token Transmission**: Frontend includes token in `Authorization: Bearer <token>` header
3. **Server-Side Verification**: Backend uses Firebase Admin SDK to verify token signature
4. **User Context**: Decoded token provides `uid` for session association

### Security Measures

- **Server-Side Price Calculation**: Prevents client-side price manipulation
- **Token Expiration**: Firebase tokens expire after 1 hour (automatic refresh handled by SDK)
- **CORS Restrictions**: Backend only accepts requests from configured origins
- **QR Code Uniqueness**: Cryptographically random QR codes prevent guessing
- **Session Isolation**: Users can only access their own sessions (verified by `uid`)

### Security Considerations for Production

⚠️ **Current Limitations** (suitable for demo/development only):

- In-memory storage loses all data on server restart
- No rate limiting on API endpoints
- QR codes are single-use but not explicitly marked as consumed
- Guard endpoint is public (no authentication required)
- No HTTPS enforcement (required for production)
- No input validation or sanitization on most endpoints
- Session timeout not enforced server-side

**Recommended Production Enhancements**:
- Migrate to Firestore or PostgreSQL for persistent storage
- Implement rate limiting (e.g., Flask-Limiter)
- Add QR code expiration and one-time-use enforcement
- Require guard device authentication
- Enable HTTPS with valid SSL certificates
- Add comprehensive input validation (e.g., Flask-Marshmallow)
- Implement server-side session timeout enforcement
- Add request logging and monitoring
- Implement CSRF protection for state-changing operations

## 🚀 Future Enhancements

For a comprehensive list of planned features and enhancements, see [Update_and_enhance.md](Update_and_enhance.md).

### High Priority Features

**Customer Experience**:
- Real barcode scanning using device camera (ZXing or QuaggaJS integration)
- GPS-based store selection with distance calculation
- Geofencing for in-store verification
- Offline mode with local storage sync
- Push notifications for promotions and session expiration

**Store Operations**:
- Real-time inventory deduction on scan
- Store manager dashboard with analytics
- Age verification for restricted products (alcohol, tobacco)
- Weight-based pricing for produce
- Receipt email/SMS delivery

**Technical Improvements**:
- Migrate to Firestore for persistent storage
- Implement Redis for session caching
- Add comprehensive test coverage (Jest, Pytest)
- Set up CI/CD pipeline (GitHub Actions)
- Containerize with Docker
- Add API rate limiting and request throttling
- Implement WebSocket for real-time cart sync across devices
- Add Sentry for error tracking

**Payment & Security**:
- Integrate real payment gateway (Razorpay, Stripe)
- Add 3D Secure authentication for cards
- Implement fraud detection
- Add refund and cancellation workflows
- Support for split payments

See [Update_and_enhance.md](Update_and_enhance.md) for detailed implementation plans and priority matrix.

## 🐛 Troubleshooting

### Common Issues

**Backend won't start**:
- Verify Python 3.8+ is installed: `python --version`
- Check all dependencies are installed: `pip list`
- Ensure `firebase-service-account.json` exists and is valid JSON
- Check port 5000 is not already in use: `netstat -ano | findstr :5000`

**Frontend won't start**:
- Verify Node.js 18+ is installed: `node --version`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Check port 5173 is available

**Authentication errors**:
- Verify Firebase config in frontend `.env` matches your project
- Check Firebase Admin credentials path in backend `.env`
- Ensure Authentication is enabled in Firebase Console
- Check browser console for detailed Firebase error messages

**Camera not working**:
- Grant camera permissions in browser settings
- Use HTTPS or localhost (camera API requires secure context)
- Check browser compatibility (Chrome, Safari, Edge recommended)
- Use "Simulate Scan" button as fallback

**CORS errors**:
- Verify backend `FRONTEND_URL` in `.env` matches your frontend URL
- Check Flask-CORS configuration in `app.py`
- Clear browser cache and hard refresh

## 📄 License

This project is provided as-is for educational and demonstration purposes.

## 🤝 Contributing

This is a demonstration project. For production use, please implement the security enhancements listed in the Security section.

## 📞 Support

For issues or questions:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Review [QUICKSTART.md](QUICKSTART.md) for setup issues
3. Check [DEPLOYMENT.md](DEPLOYMENT.md) for production issues
4. Review Firebase documentation: https://firebase.google.com/docs
5. Review Django documentation: https://docs.djangoproject.com/

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Installation and setup guide
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide
- **[Update_and_enhance.md](Update_and_enhance.md)** - Feature roadmap and enhancements
- **[LEGAL_COMPLIANCE.md](LEGAL_COMPLIANCE.md)** - Privacy policy and legal compliance
- **[Tester/README.md](Tester/README.md)** - Barcode testing tools

---

**Built with ❤️ for the future of retail**

## 📡 API Documentation

### Authentication

All endpoints except `/health` and `/guard/verify` require Firebase authentication.

**Authorization Header**:
```
Authorization: Bearer <firebase-id-token>
```

The frontend automatically attaches this header via Axios interceptors.

### Endpoints

#### Session Management

**POST /session/start**
- **Auth**: Required
- **Body**: `{ "storeId": "city-supermarket-downtown" }`
- **Response**: `{ "sessionId": "SC-A1B2C3", "status": "active" }`
- **Description**: Creates a new shopping session for the authenticated user

**GET /session/:id**
- **Auth**: Required
- **Response**: `{ "sessionId": "SC-A1B2C3", "storeId": "...", "userId": "...", "items": [], "status": "active", "createdAt": "..." }`
- **Description**: Retrieves session details and current cart state

#### Product Scanning

**POST /scan**
- **Auth**: Required
- **Body**: `{ "barcode": "8901234567890", "storeId": "city-supermarket-downtown" }`
- **Response**: `{ "barcode": "8901234567890", "name": "Organic Vine Tomatoes", "variant": "500g Pack", "price": 180, "img": "..." }`
- **Error**: `404` if product not found in catalog
- **Description**: Validates barcode and returns product information

#### Cart Operations

**GET /cart/:sessionId**
- **Auth**: Required
- **Response**: `{ "sessionId": "SC-A1B2C3", "items": [...] }`
- **Description**: Retrieves all items in the cart for a session

**PATCH /cart/:sessionId/item**
- **Auth**: Required
- **Body**: `{ "barcode": "8901234567890", "qty": 2 }` or `{ "itemId": "8901234567890", "qty": 2 }`
- **Response**: `{ "message": "Updated", "item": {...} }` or `{ "message": "Added", "item": {...} }`
- **Description**: Adds new item or updates quantity of existing item

**DELETE /cart/:sessionId/item/:barcode**
- **Auth**: Required
- **Response**: `{ "message": "Removed" }`
- **Description**: Removes an item from the cart

#### Payment & Orders

**POST /generate-qr**
- **Auth**: Required
- **Body**: `{ "sessionId": "SC-A1B2C3", "paymentMethod": "upi", "coupon": "" }`
- **Response**: `{ "qrCode": "SMARTCART-A1B2C3D4E5F6", "total": 1450, "status": "paid" }`
- **Description**: Processes payment, generates QR code, and creates order record

**GET /order-status/:sessionId**
- **Auth**: Required
- **Response**: `{ "sessionId": "SC-A1B2C3", "items": [...], "total": 1450, "paymentMethod": "upi", "qrCode": "...", "paidAt": "...", "status": "paid" }`
- **Description**: Retrieves order details and payment status

#### Guard Operations

**POST /guard/verify**
- **Auth**: None (public endpoint for guard devices)
- **Body**: `{ "qrCode": "SMARTCART-A1B2C3D4E5F6" }`
- **Response**: `{ "valid": true, "sessionId": "SC-A1B2C3", "total": 1450, "itemCount": 5, "paidAt": "...", "status": "paid" }`
- **Error**: `404` with `{ "valid": false, "error": "Invalid QR code" }` if not found
- **Description**: Validates exit QR code for store security

#### Health Check

**GET /health**
- **Auth**: None
- **Response**: `{ "status": "ok", "service": "smartcart-api" }`
- **Description**: Health check endpoint for monitoring

### Product Catalog

The backend includes a demo product catalog with 5 items:

| Barcode | Product | Variant | Price |
|---------|---------|---------|-------|
| 8901234567890 | Organic Vine Tomatoes | 500g Pack | ₹180 |
| 8901234567891 | Artisan Olive Oil | 750ml • Cold Pressed | ₹950 |
| 8901234567892 | Sourdough Loaf | 400g • Freshly Baked | ₹120 |
| 8901234567893 | Fresh Avocado Pack | 2 Pieces • Premium | ₹190 |
| 8901234567894 | Dark Roast Coffee | 250g • Whole Beans | ₹825 |

In production, replace the `PRODUCTS` dictionary with a database query or external inventory API.
