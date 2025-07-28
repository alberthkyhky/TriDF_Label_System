# 🚀 Quick Internet Access Setup

## Step-by-Step Guide to Share Your App Worldwide

### 1. 📝 Setup ngrok Account (One-time)

1. **Visit**: https://ngrok.com/signup
2. **Sign up** for free
3. **Copy your auth token** from: https://dashboard.ngrok.com/get-started/your-authtoken
4. **Configure ngrok**:
   ```bash
   ngrok config add-authtoken YOUR_TOKEN_HERE
   ```

### 2. 🚀 Start Your Applications

**Terminal 1 - Backend:**
```bash
cd backend
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### 3. 🌍 Create Internet Tunnels

**Terminal 3 - Backend Tunnel:**
```bash
ngrok http 8000
```
Copy the `https://something.ngrok-free.app` URL from the output.

**Terminal 4 - Frontend Tunnel:**
```bash
ngrok http 3000
```
Copy the `https://something.ngrok-free.app` URL from the output.

### 4. 🔧 Update Configuration

**Update `frontend/.env`** with your backend ngrok URL:
```bash
REACT_APP_API_URL=https://your-backend-url.ngrok-free.app
```

**Restart frontend** (Ctrl+C then `npm start` again)

### 5. 🎉 Share with Users

**Share your frontend ngrok URL**: `https://your-frontend-url.ngrok-free.app`

Anyone worldwide can now access your app! 🌍

### 🎭 Demo Accounts
- **Admin**: admin@example.com / password123
- **Labeler**: labeler@example.com / password123

---

## 🤖 Automated Script

For easier setup, use the automated script:

```bash
./start-internet-access.sh
```

This script will:
- ✅ Check if ngrok is set up
- ✅ Verify your apps are running
- ✅ Create tunnels automatically
- ✅ Update configuration
- ✅ Provide shareable URLs

---

## 💡 Alternative: Cloudflare Tunnel (More Stable)

If you want a more stable solution:

```bash
# Install Cloudflare tunnel
brew install cloudflared

# Login and create tunnel
cloudflared tunnel login
cloudflared tunnel create labeling-app

# Create configuration
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml << EOF
tunnel: labeling-app
credentials-file: ~/.cloudflared/TUNNEL_ID.json

ingress:
  - hostname: your-app.your-domain.com
    service: http://localhost:3000
  - hostname: api.your-domain.com
    service: http://localhost:8000
  - service: http_status:404
EOF

# Run tunnel
cloudflared tunnel run labeling-app
```

---

## 🛡️ Security Notes

- ✅ **HTTPS**: ngrok provides SSL automatically
- ✅ **Authentication**: Your Supabase auth still works
- ⚠️ **Development**: CORS is open for development
- 🔒 **Production**: Remove `"*"` from CORS for production

---

## 🐛 Troubleshooting

**ngrok not found?**
```bash
brew install ngrok
```

**Authentication failed?**
```bash
ngrok config add-authtoken YOUR_TOKEN
```

**CORS errors?**
Make sure backend config.py includes your ngrok URL in CORS origins.

**Tunnel disconnects?**
Free ngrok accounts have session limits. Upgrade for persistent tunnels.

---

## 📊 What You Get

| Feature | Free ngrok | Paid ngrok |
|---------|------------|------------|
| Concurrent tunnels | 1 agent, 2 tunnels | Multiple |
| Custom domains | ❌ | ✅ |
| Session time | 2 hours | Unlimited |
| Bandwidth | 10 requests/min | Higher limits |

Perfect for development and demos! 🎯