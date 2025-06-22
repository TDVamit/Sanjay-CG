# Backend Server Configuration

## Environment Variables

This project now uses environment variables to configure the backend server IP instead of hardcoded values.

### Local Development (.env file)

Update the following variables in your `.env` file:

```
backend_server=http://127.0.0.1:8000
VITE_BACKEND_SERVER_IP=3.7.151.6
VITE_BACKEND_SERVER_URL=http://3.7.151.6/api/v1
```

### Production (Vercel)

The production environment variables are configured in `vercel.json`:

```json
"env": {
  "VITE_BACKEND_SERVER_IP": "3.7.151.6",
  "VITE_BACKEND_SERVER_URL": "http://3.7.151.6/api/v1"
}
```

## How to Change Backend Server IP

### For Development:
1. Update `VITE_BACKEND_SERVER_IP` and `VITE_BACKEND_SERVER_URL` in your `.env` file
2. Restart your development server

### For Production:
1. Update the environment variables in `vercel.json`
2. Update the `destination` URL in the `rewrites` section of `vercel.json`
3. Redeploy your application

## Code Changes Made

- ✅ `src/services/api.ts`: Now uses `VITE_BACKEND_SERVER_URL` environment variable
- ✅ `vercel.json`: Environment variables added for production configuration
- ✅ `.env`: Updated with backend server configuration variables

The API client will automatically use the environment variables, falling back to the hardcoded IP if the environment variable is not set. 