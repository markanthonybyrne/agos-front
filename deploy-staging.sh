#!/bin/bash

# EmpireQuest Frontend - Staging Deployment Script
# This script builds the frontend with staging config and deploys to the server
#
# Usage:
#   ./deploy-staging.sh                    # Fast build (no image compression)
#   ./deploy-staging.sh --compress         # Build with image compression (slower)
#   ./deploy-staging.sh --fast             # Fast build (explicit, default)

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_HOST="144.126.199.15"
SERVER_USER="root"
DEPLOY_PATH="/var/www/agos-app/current/dist"
BUILD_DIR="dist"

# Parse command line arguments
ENABLE_COMPRESSION=false
if [[ "$1" == "--compress" ]] || [[ "$1" == "-c" ]]; then
    ENABLE_COMPRESSION=true
    echo -e "${YELLOW}📦 Image compression enabled (build will be slower)${NC}"
elif [[ "$1" == "--fast" ]] || [[ "$1" == "-f" ]]; then
    ENABLE_COMPRESSION=false
    echo -e "${GREEN}⚡ Fast build enabled (no image compression)${NC}"
elif [[ "$1" != "" ]]; then
    echo -e "${YELLOW}Usage: ./deploy-staging.sh [--compress|--fast]${NC}"
    echo -e "  --compress, -c    Enable image compression (slower build)"
    echo -e "  --fast, -f        Fast build without compression (default)"
    exit 1
fi
echo ""

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${GREEN}🚀 EmpireQuest Frontend - Staging Deployment${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

# Check if .env.staging exists
if [ ! -f ".env.staging" ]; then
    echo -e "${RED}❌ Error: .env.staging file not found!${NC}"
    echo -e "${YELLOW}Please create .env.staging with staging configuration:${NC}"
    echo ""
    echo "VITE_API_URL=https://staging-api.astralus.online/api/v1/"
    echo "VITE_PUSHER_KEY=33d7245f0190d9d32296"
    echo "VITE_PUSHER_CLUSTER=eu"
    echo "VITE_USE_PUSHER=true"
    echo ""
    exit 1
fi

# Check if rsync is available
if ! command -v rsync &> /dev/null; then
    echo -e "${RED}❌ Error: rsync is not installed!${NC}"
    echo "Please install rsync: brew install rsync (macOS) or apt-get install rsync (Linux)"
    exit 1
fi

# Check if ssh is available
if ! command -v ssh &> /dev/null; then
    echo -e "${RED}❌ Error: ssh is not installed!${NC}"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found. Installing dependencies...${NC}"
    npm install
    echo ""
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Error: npm is not installed!${NC}"
    exit 1
fi

# Build with staging configuration
if [ "$ENABLE_COMPRESSION" = true ]; then
    echo -e "${GREEN}📦 Building frontend with staging configuration (with image compression)...${NC}"
    echo -e "${YELLOW}⚠️  Note: Image compression may take a long time due to large image assets${NC}"
    export ENABLE_IMAGE_COMPRESSION=true
    BUILD_CMD="npm run build:staging"
    BUILD_CMD_SKIP="npm run build:staging:skip-check"
else
    echo -e "${GREEN}📦 Building frontend with staging configuration (fast build, no compression)...${NC}"
    export SKIP_IMAGE_COMPRESSION=true
    BUILD_CMD="npm run build:fast:staging"
    BUILD_CMD_SKIP="npm run build:fast:staging"
fi

# Try building with type checking first
echo -e "${BLUE}Running: ${BUILD_CMD}${NC}"
echo ""
if eval "$BUILD_CMD" 2>&1 | tee /tmp/build.log; then
    echo -e "${GREEN}✅ Build completed successfully with type checking${NC}"
else
    echo -e "${YELLOW}⚠️  Build failed with type checking, trying without type check...${NC}"
    echo -e "${BLUE}Running: ${BUILD_CMD_SKIP}${NC}"
    echo ""
    if eval "$BUILD_CMD_SKIP"; then
        echo -e "${GREEN}✅ Build completed successfully (type checking skipped)${NC}"
    else
        echo -e "${RED}❌ Build failed even without type checking!${NC}"
        exit 1
    fi
fi
echo ""

# Check if build was successful
if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${RED}❌ Error: Build directory not found! Build may have failed.${NC}"
    exit 1
fi

# Check if dist directory is empty
if [ -z "$(ls -A $BUILD_DIR)" ]; then
    echo -e "${RED}❌ Error: Build directory is empty! Build may have failed.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📤 Deploying to server...${NC}"
echo -e "${BLUE}Server: ${SERVER_USER}@${SERVER_HOST}${NC}"
echo -e "${BLUE}Path: ${DEPLOY_PATH}${NC}"
echo ""

# Test SSH connection first
echo -e "${YELLOW}Testing SSH connection...${NC}"
if ! ssh -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} "echo 'SSH connection successful'" &> /dev/null; then
    echo -e "${RED}❌ Error: Cannot connect to server via SSH!${NC}"
    echo -e "${YELLOW}Please check:${NC}"
    echo "  - SSH key is configured"
    echo "  - Server is accessible: ${SERVER_HOST}"
    echo "  - User has access: ${SERVER_USER}"
    exit 1
fi
echo -e "${GREEN}✅ SSH connection successful${NC}"
echo ""

# Create the directory on the server if it doesn't exist
echo -e "${YELLOW}Creating directory on server if needed...${NC}"
ssh ${SERVER_USER}@${SERVER_HOST} "mkdir -p ${DEPLOY_PATH}"

# Deploy using rsync (more efficient than scp for multiple files)
# --delete removes files on server that don't exist locally
# --exclude excludes node_modules and other dev files
echo -e "${YELLOW}Syncing files...${NC}"
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '*.md' \
    --exclude '.env*' \
    --exclude 'src' \
    --exclude 'tests' \
    --exclude 'docs' \
    ${BUILD_DIR}/ ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/

# Verify deployment
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo -e "${GREEN}🌐 Frontend deployed to:${NC}"
    echo -e "   ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Deployment failed!${NC}"
    exit 1
fi

