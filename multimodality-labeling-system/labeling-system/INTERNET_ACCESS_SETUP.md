# 🌍 ngrok Setup Guide

This guide shows how to expose your Multimodality Labeling System to the internet using ngrok so users on different networks can access it.

## 🚀 What is ngrok?

ngrok creates secure tunnels from your local machine to the internet. **Free tier** includes:
- 1 online ngrok agent
- 2 concurrent tunnels
- Perfect for development and demos

## 📋 Complete Setup Steps

### Step 1: Setup ngrok Account & Configuration

1. **Visit**: https://ngrok.com/signup
2. **Sign up** for free account
3. **Get your auth token** from dashboard: https://dashboard.ngrok.com/get-started/your-authtoken
4. **Update ngrok.yml** with your auth token:
   ```bash
   # Edit ngrok.yml file
   vim ngrok.yml
   # Replace YOUR_NGROK_AUTH_TOKEN_HERE with your actual token
   ```

### Step 2: Start Your Applications

**Terminal 1 - Backend:**
```bash
cd backend
python main.py
# Backend running on http://localhost:8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend  
npm start
# Frontend running on http://localhost:3000
```

### Step 3: Start ngrok Tunnels

**Terminal 3 - Start All Tunnels:**
```bash
ngrok start --all --config ./multimodality-labeling-system/labeling-system/ngrok.yml
# This will start both backend and frontend tunnels simultaneously
```

You'll see output like:
```
Tunnel Status                 online
Account                       Your Account (Plan: Free)

Session Status                online
Session Expires               1 hour, 59 minutes
Version                       3.x.x

Region                        United States (us)
Latency                       -

Forwarding                    https://abc123.ngrok-free.app -> http://localhost:8000 (backend)
Forwarding                    https://def456.ngrok-free.app -> http://localhost:3000 (frontend)
```

### Step 4: Update Configuration

**Update `frontend/.env`** with your backend ngrok URL:
```bash
REACT_APP_API_URL=https://your-backend-url.ngrok-free.app
```

**Restart frontend** (Ctrl+C then `npm start` again)

### Step 5: Share with Users

🌍 **Share your frontend ngrok URL**: `https://your-frontend-url.ngrok-free.app`

Users anywhere in the world can now access your app!

## 🎯 Demo User Accounts

Share these with your remote users:

- **Admin**: admin@example.com / password123
- **Labeler**: labeler@example.com / password123  
- **Reviewer**: reviewer@example.com / password123

## 🔧 Example Setup

After starting ngrok, you'll see something like:
```
Backend ngrok URL:  https://abc123.ngrok-free.app
Frontend ngrok URL: https://def456.ngrok-free.app
```

**Update frontend/.env:**
```bash
REACT_APP_API_URL=https://abc123.ngrok-free.app
```

**Share with users:**
```
🌍 Access the app at: https://def456.ngrok-free.app
👤 Demo login: admin@example.com / password123
```

## 🔍 Troubleshooting

### Common Issues:

1. **"ngrok not found"**: 
   ```bash
   brew install ngrok
   ```

2. **"authentication failed"**: 
   ```bash
   ngrok config add-authtoken YOUR_TOKEN
   ```

3. **CORS errors**: Backend already configured for ngrok HTTPS URLs

4. **Tunnel disconnects**: Free tier has session limits, just restart ngrok

### Testing Your Setup:

```bash
# Test backend tunnel
curl https://your-backend.ngrok-free.app/health

# Test frontend tunnel  
curl https://your-frontend.ngrok-free.app
```

## ⚠️ Security Notes

- ✅ **HTTPS**: ngrok provides SSL automatically
- ✅ **Authentication**: Your Supabase auth still works
- ✅ **CORS**: Already configured for ngrok URLs
- ⚠️ **Development**: This setup is for development/demo purposes

## 🚀 Quick Reference

**Full startup sequence:**
```bash
# Terminal 1: Backend
cd backend && python main.py

# Terminal 2: Frontend
cd frontend && npm start

# Terminal 3: Start all ngrok tunnels
ngrok start --all --config ./multimodality-labeling-system/labeling-system/ngrok.yml

# Update frontend/.env with backend ngrok URL
# Restart frontend
# Share frontend ngrok URL with users
```

## 📁 Configuration File

The `ngrok.yml` file contains:
```yaml
version: "2"
authtoken: YOUR_NGROK_AUTH_TOKEN_HERE

tunnels:
  backend:
    addr: 8000
    proto: http
    
  frontend:
    addr: 3000
    proto: http
```

**Benefits of using config file:**
- ✅ Start both tunnels with one command
- ✅ Consistent tunnel names
- ✅ Easy to manage and version control
- ✅ No need for multiple terminals

Your app is now accessible worldwide! 🌍