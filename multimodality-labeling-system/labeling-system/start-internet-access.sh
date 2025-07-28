#!/bin/bash

# 🌍 Internet Access Setup Script for Multimodality Labeling System
# This script helps you expose your local app to the internet using ngrok

echo "🌍 Starting Internet Access Setup for Multimodality Labeling System"
echo "=================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo -e "${RED}❌ ngrok is not installed${NC}"
    echo -e "${YELLOW}Installing ngrok...${NC}"
    brew install ngrok
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install ngrok. Please install manually.${NC}"
        exit 1
    fi
fi

# Check if ngrok is authenticated
if ! ngrok config check > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  ngrok is not authenticated${NC}"
    echo -e "${BLUE}Please follow these steps:${NC}"
    echo "1. Visit: https://ngrok.com/signup"
    echo "2. Sign up for a free account"
    echo "3. Get your auth token from: https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "4. Run: ngrok config add-authtoken YOUR_TOKEN"
    echo ""
    echo -e "${YELLOW}After setting up your auth token, run this script again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ ngrok is installed and authenticated${NC}"

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Check if backend is running
if check_port 8000; then
    echo -e "${GREEN}✅ Backend is running on port 8000${NC}"
    BACKEND_RUNNING=true
else
    echo -e "${YELLOW}⚠️  Backend is not running on port 8000${NC}"
    echo -e "${BLUE}Please start your backend in another terminal:${NC}"
    echo "cd backend && python main.py"
    BACKEND_RUNNING=false
fi

# Check if frontend is running  
if check_port 3000; then
    echo -e "${GREEN}✅ Frontend is running on port 3000${NC}"
    FRONTEND_RUNNING=true
else
    echo -e "${YELLOW}⚠️  Frontend is not running on port 3000${NC}"
    echo -e "${BLUE}Please start your frontend in another terminal:${NC}"
    echo "cd frontend && npm start"
    FRONTEND_RUNNING=false
fi

if [ "$BACKEND_RUNNING" = false ] || [ "$FRONTEND_RUNNING" = false ]; then
    echo ""
    echo -e "${YELLOW}Please start both backend and frontend, then run this script again.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🚀 Both applications are running! Setting up internet tunnels...${NC}"
echo ""

# Function to start ngrok tunnel and extract URL
start_ngrok_tunnel() {
    local port=$1
    local name=$2
    
    echo -e "${BLUE}Starting $name tunnel on port $port...${NC}"
    
    # Start ngrok in background and capture output
    ngrok http $port --log=stdout > "/tmp/ngrok_${port}.log" 2>&1 &
    local ngrok_pid=$!
    
    # Wait for ngrok to start and get URL
    local url=""
    local attempts=0
    while [ $attempts -lt 30 ]; do
        sleep 1
        url=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    for tunnel in data.get('tunnels', []):
        if tunnel['config']['addr'] == 'http://localhost:$port':
            print(tunnel['public_url'])
            break
except:
    pass
" 2>/dev/null)
        
        if [ ! -z "$url" ]; then
            break
        fi
        attempts=$((attempts + 1))
    done
    
    if [ ! -z "$url" ]; then
        echo -e "${GREEN}✅ $name tunnel: $url${NC}"
        echo "$url"
    else
        echo -e "${RED}❌ Failed to get $name tunnel URL${NC}"
        kill $ngrok_pid 2>/dev/null
        echo ""
    fi
}

# Start backend tunnel
echo "Setting up tunnels..."
BACKEND_URL=$(start_ngrok_tunnel 8000 "Backend")

# Wait a bit for the first tunnel to stabilize
sleep 2

# Start frontend tunnel  
FRONTEND_URL=$(start_ngrok_tunnel 3000 "Frontend")

# Display results
echo ""
echo "=================================================================="
echo -e "${GREEN}🎉 Internet access is now active!${NC}"
echo "=================================================================="
echo ""
echo -e "${BLUE}📡 Your app is now accessible from anywhere in the world:${NC}"
echo ""
if [ ! -z "$FRONTEND_URL" ]; then
    echo -e "${GREEN}🌍 Main App URL: $FRONTEND_URL${NC}"
fi
if [ ! -z "$BACKEND_URL" ]; then
    echo -e "${GREEN}🔧 API URL: $BACKEND_URL${NC}"
    echo -e "${GREEN}📚 API Docs: $BACKEND_URL/docs${NC}"
fi
echo ""
echo -e "${BLUE}👥 Demo Accounts:${NC}"
echo "   Admin: admin@example.com / password123"
echo "   Labeler: labeler@example.com / password123"
echo "   Reviewer: reviewer@example.com / password123"
echo ""

# Update frontend configuration if both URLs are available
if [ ! -z "$BACKEND_URL" ] && [ ! -z "$FRONTEND_URL" ]; then
    echo -e "${YELLOW}🔧 Updating frontend configuration...${NC}"
    
    # Backup original .env
    cp frontend/.env frontend/.env.backup
    
    # Update API URL in .env
    sed -i '' "s|REACT_APP_API_URL=.*|REACT_APP_API_URL=$BACKEND_URL|" frontend/.env
    
    echo -e "${GREEN}✅ Frontend configured to use: $BACKEND_URL${NC}"
    echo -e "${YELLOW}⚠️  Please restart your frontend (npm start) to apply changes${NC}"
    echo ""
fi

echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Restart your frontend if configuration was updated"
echo "2. Share the Main App URL with your users"
echo "3. Users can access from any device with internet connection"
echo ""
echo -e "${YELLOW}💡 To stop tunnels: Press Ctrl+C in this terminal${NC}"
echo -e "${YELLOW}💡 To revert config: cp frontend/.env.backup frontend/.env${NC}"
echo ""

# Keep script running to maintain tunnels
echo -e "${GREEN}🔄 Tunnels are active. Press Ctrl+C to stop.${NC}"
echo ""

# Wait for user to stop
trap 'echo -e "\n${YELLOW}🛑 Stopping tunnels...${NC}"; kill $(jobs -p) 2>/dev/null; exit 0' INT

# Keep script alive
while true; do
    sleep 10
    # Check if ngrok processes are still running
    if ! pgrep -f "ngrok http" > /dev/null; then
        echo -e "${RED}❌ ngrok tunnels have stopped${NC}"
        break
    fi
done