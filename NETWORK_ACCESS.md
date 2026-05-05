# Network Access Guide

This guide explains how to access your InFlux application from other devices on your local network (phones, tablets, other computers).

## Quick Start

1. **Get your local IP address:**
   ```bash
   node get-local-ip.js
   ```
   Or manually:
   ```bash
   # Windows
   ipconfig | findstr /i "IPv4"
   
   # Mac/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. **Start both servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

3. **Access from other devices:**
   - **Frontend:** `http://YOUR_IP:5173` (e.g., `http://172.20.10.9:5173`)
   - **Backend API:** `http://YOUR_IP:5000`
   - **API Docs:** `http://YOUR_IP:5000/api/docs`

## Configuration

### Backend
The backend is configured to:
- Bind to `0.0.0.0` (accessible from network)
- Automatically allow CORS from localhost and local network IPs
- Display network URL when starting

### Frontend
The frontend is configured to:
- Accept connections from network (`host: 0.0.0.0`)
- Auto-detect backend URL based on how you access it:
  - If you access via `localhost:5173` → API uses `localhost:5000`
  - If you access via `172.20.10.9:5173` → API uses `172.20.10.9:5000`

### Environment Variables (Optional)

#### Backend (.env)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/influx_dev
JWT_SECRET=supersecret_jwt_key
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CLIENT_URL=http://localhost:5173,http://172.20.10.9:5173
COOKIE_SECRET=somecookiekey
```

Replace `172.20.10.9` with your actual IP address.

#### Frontend (.env)
```env
VITE_API_URL=http://172.20.10.9:5000/api
```

**Note:** The frontend will auto-detect the API URL, so this is only needed if you want to override the default behavior.

## Troubleshooting

### Can't access from phone/other device

1. **Check firewall:**
   - Windows: Allow Node.js through Windows Firewall
   - Mac: System Preferences → Security → Firewall
   - Linux: `sudo ufw allow 5173` and `sudo ufw allow 5000`

2. **Verify devices are on same network:**
   - Both devices must be on the same Wi-Fi network
   - Check IP addresses are in the same range (e.g., both start with `192.168.x.x` or `172.20.x.x`)

3. **Check backend is running:**
   - Visit `http://YOUR_IP:5000/api/health` from another device
   - Should return: `{"status":"ok","message":"InFlux API is running"}`

4. **Check CORS errors in browser console:**
   - If you see CORS errors, the backend might not have added your IP to allowed origins
   - Check backend console logs when starting - it should show allowed origins

### Backend shows "YOUR_IP" instead of actual IP

- The IP detection might have failed
- Manually note your IP using `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- Use that IP in the URLs

### Connection refused errors

- Make sure both servers are running
- Check if ports 5000 and 5173 are already in use
- Verify firewall isn't blocking the ports

## Testing Network Access

1. From your computer:
   - Open `http://localhost:5173` (should work)
   - Open `http://YOUR_IP:5173` (should also work)

2. From another device on same network:
   - Open `http://YOUR_IP:5173` in a browser
   - The app should load and connect to the backend automatically

## Security Note

⚠️ **Warning:** This configuration allows access from any device on your local network. Only use this for development. For production, use proper authentication and HTTPS.


