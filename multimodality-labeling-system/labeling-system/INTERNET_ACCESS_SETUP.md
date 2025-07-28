# 🌍 Internet Access Setup Guide

This guide shows how to expose your Multimodality Labeling System to the internet so users on different networks can access it.

## 🚀 Option 1: ngrok (Recommended for Development)

ngrok creates secure tunnels from your local machine to the internet. **Free tier** includes:
- 1 online ngrok agent
- 2 concurrent tunnels
- 10 requests/minute
- Perfect for development and demos

### Step 1: Setup ngrok Account

1. **Visit**: https://ngrok.com/signup
2. **Sign up** for free account
3. **Get your auth token** from dashboard: https://dashboard.ngrok.com/get-started/your-authtoken

### Step 2: Configure ngrok

```bash
# Configure with your auth token (replace YOUR_TOKEN)
ngrok config add-authtoken YOUR_TOKEN
```

### Step 3: Update App Configuration

Since ngrok provides HTTPS tunnels, we need to update our app configuration:

#### Frontend (.env):
```bash
# ngrok URLs will be provided after starting tunnels
REACT_APP_API_URL=https://your-backend-url.ngrok-free.app
```

#### Backend (config.py) - Add HTTPS CORS:
```python
BACKEND_CORS_ORIGINS: list = [
    "http://localhost:3000", 
    "http://127.0.0.1:3000",
    "http://172.20.10.2:3000",
    "https://your-frontend-url.ngrok-free.app",  # Add your ngrok frontend URL
    "*"  # For development
]
```

### Step 4: Start Your Applications

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

### Step 5: Create ngrok Tunnels

**Terminal 3 - Backend Tunnel:**
```bash
ngrok http 8000
# This will give you something like: https://abc123.ngrok-free.app
```

**Terminal 4 - Frontend Tunnel:**
```bash
ngrok http 3000  
# This will give you something like: https://def456.ngrok-free.app
```

### Step 6: Update Configuration with ngrok URLs

1. **Copy the ngrok URLs** from the terminal outputs
2. **Update frontend .env** with the backend ngrok URL:
   ```bash
   REACT_APP_API_URL=https://abc123.ngrok-free.app
   ```
3. **Update backend config.py** with frontend ngrok URL
4. **Restart both applications**

### Step 7: Share with Users

🌍 **Share this URL**: `https://def456.ngrok-free.app`

Users anywhere in the world can now access your app!

---

## 🔒 Option 2: Cloudflare Tunnel (Free, More Stable)

Cloudflare Tunnel is more stable than ngrok and completely free.

### Install Cloudflared:
```bash
brew install cloudflared
```

### Setup:
```bash
# Login to Cloudflare
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create labeling-system

# Configure tunnel (create config file)
mkdir -p ~/.cloudflared
cat << EOF > ~/.cloudflared/config.yml
tunnel: labeling-system
credentials-file: ~/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: labeling-frontend.your-domain.com
    service: http://localhost:3000
  - hostname: labeling-api.your-domain.com  
    service: http://localhost:8000
  - service: http_status:404
EOF

# Run tunnel
cloudflared tunnel run labeling-system
```

---

## 🏗️ Option 3: Railway (Deployment Platform)

For production deployment with custom domains.

### Setup:
1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Deploy: `railway up`

---

## 🔐 Option 4: Port Forwarding (Router Configuration)

If you have router admin access:

### Steps:
1. **Find your public IP**: https://whatismyipaddress.com/
2. **Access router settings** (usually 192.168.1.1 or 192.168.0.1)
3. **Setup port forwarding**:
   - External Port 8000 → Internal IP 172.20.10.2:8000 (Backend)
   - External Port 3000 → Internal IP 172.20.10.2:3000 (Frontend)
4. **Update configurations** to use your public IP
5. **Share**: `http://YOUR_PUBLIC_IP:3000`

⚠️ **Security Risk**: Exposes your network to internet

---

## 🚀 Quick Start with ngrok

### Complete Setup Commands:

```bash
# 1. Install and configure ngrok
brew install ngrok
ngrok config add-authtoken YOUR_TOKEN

# 2. Start applications (3 terminals)
# Terminal 1:
cd backend && python main.py

# Terminal 2: 
cd frontend && npm start

# Terminal 3:
ngrok http 8000

# Terminal 4:
ngrok http 3000

# 3. Update .env with ngrok backend URL
# 4. Share ngrok frontend URL with users
```

### Example Setup:
```bash
# After ngrok start, you'll see:
# Backend: https://abc123.ngrok-free.app
# Frontend: https://def456.ngrok-free.app

# Update frontend/.env:
REACT_APP_API_URL=https://abc123.ngrok-free.app

# Share with users:
🌍 Access at: https://def456.ngrok-free.app
👤 Demo login: admin@example.com / password123
```

---

## 🔍 Troubleshooting

### ngrok Common Issues:

1. **"ngrok not found"**: Install with `brew install ngrok`
2. **"authentication failed"**: Set auth token with `ngrok config add-authtoken`
3. **CORS errors**: Update BACKEND_CORS_ORIGINS in config.py
4. **Slow connection**: Upgrade to paid ngrok plan
5. **Tunnel disconnects**: Free tier has session limits

### Testing Your Setup:

```bash
# Test backend tunnel
curl https://your-backend.ngrok-free.app/health

# Test frontend tunnel  
curl https://your-frontend.ngrok-free.app
```

---

## 📊 Comparison

| Method | Cost | Ease | Security | Stability | Custom Domain |
|--------|------|------|----------|-----------|---------------|
| ngrok | Free/Paid | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | Paid only |
| Cloudflare | Free | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Yes |
| Railway | Paid | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Yes |
| Port Forward | Free | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | No |

**Recommendation**: Start with **ngrok** for quick demos, move to **Cloudflare Tunnel** for longer-term development sharing.

---

## 🎯 Demo User Accounts

Share these with your remote users:

- **Admin**: admin@example.com / password123
- **Labeler**: labeler@example.com / password123  
- **Reviewer**: reviewer@example.com / password123

---

## ⚠️ Security Notes

### Development Mode:
- ngrok tunnels are HTTPS by default ✅
- Authentication still handled by Supabase ✅
- CORS set to allow all origins for development ⚠️

### For Production:
- Remove `"*"` from CORS origins
- Use proper SSL certificates
- Set up proper environment variables
- Consider rate limiting and security headers