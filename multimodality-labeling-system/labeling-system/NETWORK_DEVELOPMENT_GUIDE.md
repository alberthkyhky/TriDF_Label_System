# Network Development Setup Guide

This guide shows how to run the Multimodality Labeling System on your computer and allow others to connect from other devices on the same network.

## 🔧 Configuration Applied

### Your Computer's Network Information
- **Host Computer IP**: `172.20.10.2`
- **Backend Port**: `8000`
- **Frontend Port**: `3000`

### Backend Configuration ✅
- **Listen Address**: `0.0.0.0:8000` (all network interfaces)
- **CORS Origins**: Updated to allow network access
- **API Endpoint**: `http://172.20.10.2:8000`

### Frontend Configuration ✅
- **Listen Address**: `0.0.0.0:3000` (all network interfaces)  
- **API URL**: Updated to `http://172.20.10.2:8000`
- **Network Access**: Enabled

## 🚀 How to Start the Application

### 1. Start Backend (Terminal 1)
```bash
cd backend
python main.py
```
**Backend will be available at:**
- Local: `http://localhost:8000`
- Network: `http://172.20.10.2:8000`
- API Docs: `http://172.20.10.2:8000/docs`

### 2. Start Frontend (Terminal 2)
```bash
cd frontend
npm start
```
**Frontend will be available at:**
- Local: `http://localhost:3000`
- Network: `http://172.20.10.2:3000`

## 📱 How Others Can Connect

### For Other Users on Your Network:

1. **Find Your Network IP** (in case it changes):
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. **Share These URLs**:
   - **Main App**: `http://172.20.10.2:3000`
   - **API**: `http://172.20.10.2:8000`
   - **API Docs**: `http://172.20.10.2:8000/docs`

3. **Device Requirements**:
   - Must be on the same Wi-Fi/network as your computer
   - Modern web browser (Chrome, Firefox, Safari, Edge)
   - No additional software installation needed

### Example Devices That Can Connect:
- 📱 **Mobile phones** (iOS/Android) via browser
- 💻 **Other laptops/computers** on same network
- 📟 **Tablets** via browser
- 🖥️ **Desktop computers** on same network

## 🔒 Security Notes

### Current Setup (Development Mode)
- ⚠️ **CORS**: Set to allow all origins (`*`) for development
- ⚠️ **No HTTPS**: Using HTTP for local development
- ✅ **Supabase Auth**: Still secured with proper authentication

### For Production Deployment:
1. Remove `"*"` from CORS origins
2. Use HTTPS with proper SSL certificates
3. Set up proper firewall rules
4. Use environment-specific configurations

## 🐛 Troubleshooting

### If Others Can't Connect:

1. **Check Firewall Settings**:
   ```bash
   # macOS: Allow incoming connections
   sudo pfctl -d  # Disable firewall temporarily for testing
   ```

2. **Verify Network Connectivity**:
   ```bash
   # Test if port 8000 is accessible
   curl http://172.20.10.2:8000/health
   
   # Test if port 3000 is accessible  
   curl http://172.20.10.2:3000
   ```

3. **Check if Ports are Open**:
   ```bash
   lsof -i :8000  # Check backend port
   lsof -i :3000  # Check frontend port
   ```

4. **Alternative IP Discovery**:
   ```bash
   # Get all network interfaces
   ifconfig -a
   
   # Or use system preferences > network
   ```

### Common Issues:

1. **"Connection Refused"**:
   - Backend not running
   - Firewall blocking ports
   - Wrong IP address

2. **"CORS Error"**:
   - Backend CORS configuration issue
   - Check browser developer console

3. **"Network Unreachable"**:
   - Devices not on same network
   - Network isolation (guest network)

## 📊 Testing the Setup

### 1. Test Backend API:
```bash
# Health check
curl http://172.20.10.2:8000/health

# API documentation  
open http://172.20.10.2:8000/docs
```

### 2. Test Frontend:
```bash
# Open in browser
open http://172.20.10.2:3000
```

### 3. Test from Another Device:
1. Connect to same Wi-Fi network
2. Open browser
3. Navigate to `http://172.20.10.2:3000`
4. Try to log in and use the application

## 🔄 Switching Back to Local Development

### To revert to localhost-only development:

1. **Frontend (.env)**:
   ```bash
   REACT_APP_API_URL=http://localhost:8000
   ```

2. **Frontend (package.json)**:
   ```json
   "start": "FAST_REFRESH=false react-scripts start"
   ```

3. **Backend (config.py)**:
   ```python
   BACKEND_CORS_ORIGINS: list = ["http://localhost:3000", "http://127.0.0.1:3000"]
   ```

## 📝 Demo User Accounts

Share these accounts with your team for testing:

- **Admin**: admin@example.com / password123
- **Labeler**: labeler@example.com / password123  
- **Reviewer**: reviewer@example.com / password123

## 🏃‍♂️ Quick Start Commands

### Full Startup (Two Terminals):
```bash
# Terminal 1 - Backend
cd backend && python main.py

# Terminal 2 - Frontend  
cd frontend && npm start
```

### Share With Team:
```
🌐 Access the app at: http://172.20.10.2:3000
📚 API docs at: http://172.20.10.2:8000/docs
👤 Demo login: admin@example.com / password123
```

---

**Note**: The IP address `172.20.10.2` may change if you switch networks. Always check your current IP with `ifconfig` and update the configurations accordingly.