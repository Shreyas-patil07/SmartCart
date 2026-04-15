# 🚀 SmartCart Quick Start Guide

Get SmartCart up and running in minutes.

## Prerequisites

- **Node.js** 18+ and npm (for frontend)
- **Python** 3.8+ and pip (for backend)
- **Firebase Project** with Authentication and Firestore enabled
- **Git** for version control

## Quick Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd SmartCart
```

### 2. Backend Setup

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Configure environment variables
# Create a .env file with:
#   SECRET_KEY=your-secret-key
#   FIREBASE_CREDENTIALS=./firebase-service-account.json
#   FRONTEND_URL=http://localhost:5173

# Download Firebase Admin SDK credentials
# Firebase Console → Project Settings → Service Accounts → Generate new private key
# Save as firebase-service-account.json in backend/

# Start the Django server
python manage.py migrate
python manage.py runserver 0.0.0.0:5000
```

The backend will start at `http://localhost:5000`

**Note**: Run migrations on first setup with `python manage.py migrate`

### 3. Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install

# Configure environment variables
# Create a .env file with your Firebase config:
#   VITE_FIREBASE_API_KEY=your-api-key
#   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
#   VITE_FIREBASE_PROJECT_ID=your-project-id
#   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
#   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
#   VITE_FIREBASE_APP_ID=your-app-id

# Start the Vite dev server
npm run dev
```

The frontend will start at `http://localhost:5173`

### 4. Access the Application

Open your browser and navigate to `http://localhost:5173`

## First-Time Setup Checklist

- [ ] Firebase project created with Authentication enabled
- [ ] Email/Password and Google sign-in methods enabled in Firebase Console
- [ ] Firestore database created (even if using in-memory storage initially)
- [ ] Firebase Admin SDK service account JSON downloaded
- [ ] Backend `.env` configured with Firebase credentials path
- [ ] Frontend `.env` configured with Firebase web SDK config
- [ ] Both servers running (backend on :5000, frontend on :5173)
- [ ] Camera permissions granted in browser for barcode scanning

## Configuration

### Backend Environment Variables

Create `backend/.env`:

```env
# Django Configuration
SECRET_KEY=your-random-secret-key-here

# Firebase Admin SDK
FIREBASE_CREDENTIALS=./firebase-service-account.json

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Optional: Production deployment URL
# FRONTEND_URL=https://your-app.vercel.app
```

### Frontend Environment Variables

Create `frontend/.env`:

```env
# Firebase Web SDK Configuration
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# Optional: Backend API URL (defaults to http://localhost:5000)
# VITE_API_BASE_URL=https://your-api.herokuapp.com
```

## Firebase Console Setup

1. **Create Firebase Project**: https://console.firebase.google.com
2. **Enable Authentication**:
   - Go to Authentication → Sign-in method
   - Enable Email/Password provider
   - Enable Google provider (configure OAuth consent screen)
3. **Create Firestore Database**:
   - Go to Firestore Database → Create database
   - Start in test mode (configure security rules later)
4. **Download Service Account**:
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `backend/firebase-service-account.json`
5. **Get Web SDK Config**:
   - Go to Project Settings → General
   - Scroll to "Your apps" → Web app
   - Copy configuration values to frontend `.env`

## Testing with Sample Barcodes

The `Tester/` directory contains:
- **40 pre-generated barcode images** in `barcodes/` folder
- **barcode_generator.py**: Python script to generate additional test barcodes
- **barcodes_collection.pdf**: Printable sheet of all barcodes for physical testing

**Using Test Barcodes**:
1. Open `Tester/barcodes_collection.pdf`
2. Print or display on another device
3. Use Scanner page to scan the barcodes
4. Or use the "Simulate Scan" button for quick testing

## Common Commands

### Frontend Development
```bash
npm run dev      # Start Vite dev server with HMR
npm run build    # Build for production
npm run preview  # Preview production build locally
npm run lint     # Run ESLint on all source files
```

### Backend Development

**Running in Debug Mode**:
```bash
python manage.py runserver 0.0.0.0:5000
```

**Common Django Commands**:
```bash
python manage.py check          # Check for issues
python manage.py makemigrations # Create migrations
python manage.py migrate        # Apply migrations
python manage.py createsuperuser # Create admin user
python manage.py test           # Run tests
```

### Backend Development (Django)
```bash
# Start server
python manage.py runserver 0.0.0.0:5000

# Check for issues
python manage.py check

# Create migrations (when you add models)
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Run tests
python manage.py test
```

## Troubleshooting

### Backend won't start
- Verify Python 3.8+ is installed: `python --version`
- Check all dependencies are installed: `pip list`
- Ensure `firebase-service-account.json` exists and is valid JSON
- Check port 5000 is not already in use: `netstat -ano | findstr :5000`

### Frontend won't start
- Verify Node.js 18+ is installed: `node --version`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Check port 5173 is available

### Authentication errors
- Verify Firebase config in frontend `.env` matches your project
- Check Firebase Admin credentials path in backend `.env`
- Ensure Authentication is enabled in Firebase Console
- Check browser console for detailed Firebase error messages

### Camera not working
- Grant camera permissions in browser settings
- Use HTTPS or localhost (camera API requires secure context)
- Check browser compatibility (Chrome, Safari, Edge recommended)
- Use "Simulate Scan" button as fallback

### CORS errors
- Verify backend `FRONTEND_URL` in `.env` matches your frontend URL
- Check CORS configuration in `backend/smartcart/settings.py`
- Clear browser cache and hard refresh

## Next Steps

- Review the [README.md](README.md) for complete system documentation
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment guide
- See [Update_and_enhance.md](Update_and_enhance.md) for planned features

---

**Need help?** Check the main README or Firebase documentation at https://firebase.google.com/docs
