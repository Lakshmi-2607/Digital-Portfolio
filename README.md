# Secure Authentication Web Application (React + Node + MongoDB)

## 1) Folder Structure

```txt
project-root/
  client/
    src/
      App.jsx
      api.js
      main.jsx
      styles.css
    index.html
    package.json
    vite.config.js
    .env.example
  server/
    config/
      db.js
      mailer.js
    controllers/
      authController.js
    middleware/
      authMiddleware.js
      rateLimiter.js
    models/
      User.js
    routes/
      authRoutes.js
    utils/
      generateOtp.js
      generateToken.js
    certs/
      server.key
      server.cert
    server.js
    package.json
    .env.example
  README.md
```

---

## 2) Backend Code Overview (English + தமிழ்)

### `server/server.js`
- **EN:** Creates Express app, applies security middleware (helmet, mongoSanitize, xss-clean, hpp), rate limiting, routes, DB connection, then starts HTTP/HTTPS server.
- **TA:** Express app உருவாக்குகிறது, பாதுகாப்பு middleware-களை (helmet, mongoSanitize, xss-clean, hpp) பயன்படுத்துகிறது, rate limit சேர்க்கிறது, routes load செய்கிறது, DB connect செய்து HTTP/HTTPS server start செய்கிறது.

### `server/models/User.js`
- **EN:** Defines user schema with `name`, `email`, `password`, `isVerified`, OTP fields, and QR token. Validates real email format with `validator`.
- **TA:** `name`, `email`, `password`, `isVerified`, OTP fields, QR token ஆகிய fields உடன் User schema அமைக்கிறது. Email format சரியா என்பதை `validator` மூலம் சரிபார்க்கிறது.

### `server/controllers/authController.js`
- **EN:** Contains all business logic:
  - `signup`: validates input, hashes password with bcrypt, creates 6-digit OTP, sets 5-minute expiry, sends email.
  - `verifyOtp`: verifies OTP and expiry, marks account verified, creates QR token, returns QR image URL.
  - `login`: checks verified email, validates password, returns JWT.
  - `qrLogin`: logs in using scanned QR token.
  - `getProfile`: protected route using JWT.
- **TA:** முக்கிய authentication logic இங்கே:
  - `signup`: input validation, bcrypt hash, 6 digit OTP, 5 நிமிடம் expiry, email send.
  - `verifyOtp`: OTP + expiry check, verified ஆக update, QR token உருவாக்கி QR image தருகிறது.
  - `login`: verified email மட்டும் login, password check, JWT return.
  - `qrLogin`: QR token scan செய்து login.
  - `getProfile`: JWT பாதுகாக்கப்பட்ட route.

### `server/config/mailer.js`
- **EN:** Configures Nodemailer transport for Gmail SMTP and sends OTP email.
- **TA:** Gmail SMTP மூலம் Nodemailer transport அமைத்து OTP email அனுப்புகிறது.

### `server/middleware/*`
- **EN:** `authMiddleware.js` verifies JWT. `rateLimiter.js` blocks brute-force attempts.
- **TA:** `authMiddleware.js` JWT சரிபார்க்கிறது. `rateLimiter.js` அதிகமான request-ஐ கட்டுப்படுத்துகிறது.

---

## 3) Frontend Code Overview (English + தமிழ்)

### `client/src/App.jsx`
- **EN:** Contains all pages:
  - Signup page (name/email/password/confirm)
  - OTP verification page
  - Login page
  - QR login route `/qr-login/:token`
  - JWT protected dashboard
- **TA:** எல்லா UI pages-மும் இதில்:
  - Signup
  - OTP verify
  - Login
  - QR login route `/qr-login/:token`
  - JWT பாதுகாக்கப்பட்ட dashboard

### `client/src/styles.css`
- **EN:** Modern gradient background, glassmorphism card, animation, responsive mobile style, clean buttons.
- **TA:** Gradient background, glass card effect, animation, mobile responsive design, modern buttons ஆகிய UI style-களை வழங்குகிறது.

### `client/src/api.js`
- **EN:** Axios instance for backend API calls.
- **TA:** Backend API calls செய்ய reusable Axios instance.

---

## 4) CSS/Design Highlights
- Gradient full-page background
- Animated login/signup card
- Clean modern CTA buttons
- Responsive for small screens

---

## 5) Environment Variables Example

### Backend (`server/.env`)
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/secure-auth-app
JWT_SECRET=super_long_secret_change_me
JWT_EXPIRES_IN=1d
CLIENT_URL=https://localhost:5173
EMAIL_USER=yourgmail@gmail.com
EMAIL_APP_PASSWORD=your_gmail_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
USE_HTTPS=true
SSL_KEY_PATH=./certs/server.key
SSL_CERT_PATH=./certs/server.cert
```

### Frontend (`client/.env`)
```env
VITE_API_URL=https://localhost:5000/api
```

---

## 6) Run Commands (Localhost)

### Step-by-step (English)
1. Install Node.js (LTS): https://nodejs.org
2. Install MongoDB Community Edition and start service.
3. Open terminal for backend:
   ```bash
   cd server
   cp .env.example .env
   npm install
   ```
4. Generate local SSL certs:
   ```bash
   mkdir -p certs
   openssl req -x509 -newkey rsa:2048 -sha256 -nodes \
     -keyout certs/server.key -out certs/server.cert -days 365 \
     -subj '/CN=localhost'
   ```
5. Add Gmail credentials in `.env`.
6. Run backend:
   ```bash
   npm run dev
   ```
7. Open new terminal for frontend:
   ```bash
   cd client
   cp .env.example .env
   npm install
   npm run dev
   ```
8. Access app at `http://localhost:5173`.

### படிப்படியான வழிகாட்டி (தமிழ்)
1. Node.js (LTS) install செய்யவும்.
2. MongoDB install செய்து service start செய்யவும்.
3. Backend terminal:
   - `cd server`
   - `.env` உருவாக்க `cp .env.example .env`
   - `npm install`
4. SSL certificate உருவாக்க OpenSSL command run செய்யவும்.
5. Gmail App Password ஐ `.env`ல் சேர்க்கவும்.
6. Backend run: `npm run dev`
7. Frontend terminal:
   - `cd client`
   - `cp .env.example .env`
   - `npm install`
   - `npm run dev`
8. Browserல் `http://localhost:5173` திறக்கவும்.

---

## 7) HTTPS Setup Explanation

### EN
- Local HTTPS requires SSL key + cert.
- `server.js` reads these files using `fs.readFileSync` and starts `https.createServer`.
- API requests from frontend should use `https://localhost:5000/api` to avoid insecure transport.
- In production use real certs from Let’s Encrypt or cloud load balancer.

### TA
- Local HTTPSக்கு SSL key + cert தேவை.
- `server.js` இல் அந்த files வாசித்து `https.createServer` மூலம் HTTPS server start செய்கிறது.
- Frontend API URL `https://localhost:5000/api` ஆக இருக்க வேண்டும்.
- Productionல் Let’s Encrypt அல்லது cloud certificate பயன்படுத்தவும்.

---

## 8) Security System Documentation

### Features
- bcrypt password hashing
- JWT authentication
- OTP email verification (5 min expiry)
- QR token based login
- Rate limiting
- Mongo sanitize + XSS clean + HPP + Helmet
- HTTPS support

### OTP Workflow
1. User signup.
2. Server generates 6-digit OTP.
3. OTP saved with `otpExpiresAt = now + 5 minutes`.
4. OTP emailed via Nodemailer.
5. Verify endpoint checks code and expiry.
6. On success: `isVerified = true`, generate QR token.

### Email Verification Logic
- Login endpoint blocks users with `isVerified = false`.
- User must complete OTP verification first.

### QR Authentication Flow
1. After OTP verify, backend generates persistent `qrToken`.
2. Converts login URL into QR image.
3. User scans QR and lands on `/qr-login/:token`.
4. Frontend calls backend `/api/auth/qr-login/:token`.
5. Backend validates token and returns JWT.

### API Keys & Secrets
- Never hardcode credentials.
- Use `.env` files and secret manager in production.

### Dependencies (core)
- Backend: express, mongoose, bcrypt, jsonwebtoken, nodemailer, qrcode, helmet
- Frontend: react, react-router-dom, axios, vite

### Deployment Guide (beginner to expert)
- Use reverse proxy (Nginx) with HTTPS.
- Keep backend/private env vars on server only.
- Use MongoDB Atlas with IP allowlist.
- Enable secure cookies or token storage best practices.
- Add refresh tokens + rotation for advanced security.
- Add MFA/WebAuthn for enterprise level.

### Keywords
`React Auth`, `Node OTP Login`, `JWT + bcrypt`, `Email Verification`, `QR Login`, `HTTPS Express`, `MongoDB Security`, `Secure Full Stack App`

---

## 9) API Endpoints

- `POST /api/auth/signup`
- `POST /api/auth/verify-otp`
- `POST /api/auth/resend-otp`
- `POST /api/auth/login`
- `POST /api/auth/qr-login/:qrToken`
- `GET /api/auth/me` (Bearer token)

