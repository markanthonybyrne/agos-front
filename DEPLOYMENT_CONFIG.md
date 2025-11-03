# Deployment Configuration

## Overview

This document describes the deployment configuration for staging and production environments.

## Environment URLs

- **Staging API**: `https://api-staging.agameof.space/api/v1/`
- **Production API**: `https://api.agameof.space/api/v1/`

## Environment Files

### Staging Configuration (`.env.staging`)

Create this file in the project root for staging deployments:

```env
VITE_API_URL=https://api-staging.agameof.space/api/v1/
VITE_PUSHER_KEY=33d7245f0190d9d32296
VITE_PUSHER_CLUSTER=eu
VITE_USE_PUSHER=true
```

### Production Configuration (`.env.production`)

Create this file in the project root for production deployments:

```env
VITE_API_URL=https://api.agameof.space/api/v1/
VITE_PUSHER_KEY=33d7245f0190d9d32296
VITE_PUSHER_CLUSTER=eu
VITE_USE_PUSHER=true
```

## Deployment Scripts

### Production Deployment

```bash
./deploy-production.sh
```

Or with image compression (slower):

```bash
./deploy-production.sh --compress
```

### Staging Deployment

```bash
./deploy-staging.sh
```

Or with image compression (slower):

```bash
./deploy-staging.sh --compress
```

## Build Commands

### Production Builds

- `npm run build:production` - Full production build with type checking
- `npm run build:production:skip-check` - Production build without type checking
- `npm run build:fast:production` - Fast production build (no image compression)

### Staging Builds

- `npm run build:staging` - Full staging build with type checking
- `npm run build:staging:skip-check` - Staging build without type checking
- `npm run build:fast:staging` - Fast staging build (no image compression)

## Server Configuration

- **Server IP**: `159.65.16.122`
- **Server User**: `root`
- **Deploy Path**: `/var/www/agos-app/current/dist`

## Deployment Process

1. **Ensure environment file exists**: `.env.staging` or `.env.production`
2. **Run deployment script**: `./deploy-staging.sh` or `./deploy-production.sh`
3. **Script will**:
   - Check for required files
   - Build the application with the correct environment
   - Test SSH connection
   - Deploy using rsync
   - Verify deployment success

## Manual Deployment

If you prefer manual deployment:

1. Build the application:
   ```bash
   npm run build:production  # or build:staging
   ```

2. Deploy using rsync:
   ```bash
   rsync -avz --delete dist/ root@159.65.16.122:/var/www/agos-app/current/dist/
   ```

## Notes

- Environment files (`.env.staging`, `.env.production`) are gitignored for security
- Both staging and production use the same server but may have different configurations
- The deployment scripts automatically handle SSH connection testing and directory creation
- Image compression is optional and can significantly slow down builds

