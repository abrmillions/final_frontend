# Django Integration Guide

This document explains how the Next.js frontend connects to the Django backend API.

## Architecture Overview

The system uses a **hybrid approach**:
- **Next.js Frontend**: User interface and client-side logic
- **Django Backend**: Real database, authentication (JWT), and business logic
- **API Communication**: Frontend calls Django REST API endpoints

## Setup Instructions

### 1. Configure Django API URL

Create a `.env.local` file in the root directory:

\`\`\`env
NEXT_PUBLIC_DJANGO_API_URL=http://localhost:8000
\`\`\`

For production:
\`\`\`env
NEXT_PUBLIC_DJANGO_API_URL=https://api.yourdomain.com
\`\`\`

### 2. Start Django Backend

\`\`\`bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
\`\`\`

### 3. Start Next.js Frontend

\`\`\`bash
npm install
npm run dev
\`\`\`

The frontend will be available at `http://localhost:3000`

## API Integration Points

### Authentication

**Login/Register**
- Frontend: `/components/auth/login-form.tsx`, `/components/auth/register-form.tsx`
- Backend: `POST /api/users/token/`, `POST /api/users/register/`
- Storage: JWT tokens in localStorage, user data in localStorage

**Token Management**
- Automatic token refresh when expired
- Tokens stored as: `clms_tokens` (access + refresh)

### License Applications

**Contractor License**
- Frontend: `/app/dashboard/contractor-license/apply/page.tsx`
- Backend: `POST /api/applications/`
- Data Flow: Form → Django → Database → License generation

**Professional License**
- Frontend: `/app/dashboard/professional-license/apply/page.tsx`
- Backend: `POST /api/applications/`
- Includes photo upload support

**Import/Export License**
- Frontend: `/app/dashboard/import-export/apply/page.tsx`
- Backend: `POST /api/applications/`

### File Uploads

**Document Uploads**
- Endpoint: `POST /api/documents/upload/`
- Supports: PDF, JPG, PNG, Images
- Handler: `lib/api/django-client.ts` → `documentsApi.upload()`

### Partnership Management

**Register Partnership**
- Frontend: `/app/dashboard/partnerships/register/page.tsx`
- Backend: `POST /api/partnerships/`
- Data: Company info, partners, documents

### Admin Functions

**Application Review**
- Approve: `POST /api/applications/{id}/approve/`
- Reject: `POST /api/applications/{id}/reject/`
- Request Info: `POST /api/applications/{id}/request_info/`

## API Client Usage

### Basic Usage

Import the API client:

\`\`\`typescript
import { authApi, applicationsApi, licensesApi } from '@/lib/api/django-client'

// Login
await authApi.login('email@example.com', 'password')

// Create application
const app = await applicationsApi.create({
  application_type: 'contractor',
  company_name: 'ABC Construction',
  // ... more fields
})

// Get licenses
const licenses = await licensesApi.list()
\`\`\`

### Error Handling

\`\`\`typescript
try {
  const result = await applicationsApi.create(data)
} catch (error: any) {
  console.error('API Error:', error.message)
  // error.message contains detailed error info from Django
}
\`\`\`

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_DJANGO_API_URL` | Django backend URL | `http://localhost:8000` |

## Django API Endpoints

### Authentication
- `POST /api/users/register/` - Register new user
- `POST /api/users/token/` - Login (get JWT tokens)
- `POST /api/users/token/refresh/` - Refresh access token
- `GET /api/users/me/` - Get current user profile
- `POST /api/users/change_password/` - Change password

### Applications
- `GET /api/applications/` - List all applications
- `POST /api/applications/` - Create application
- `GET /api/applications/{id}/` - Get application details
- `PATCH /api/applications/{id}/` - Update application
- `POST /api/applications/{id}/approve/` - Approve application
- `POST /api/applications/{id}/reject/` - Reject application
- `POST /api/applications/{id}/request_info/` - Request additional info

### Licenses
- `GET /api/licenses/` - List all licenses
- `POST /api/licenses/` - Create license
- `GET /api/licenses/{id}/` - Get license details
- `PATCH /api/licenses/{id}/` - Update license
- `POST /api/licenses/{id}/renew/` - Renew license
- `GET /api/licenses/verify/?license_number=XXX` - Verify license

### Documents
- `POST /api/documents/upload/` - Upload document
- `GET /api/documents/` - List documents
- `DELETE /api/documents/{id}/` - Delete document

### Partnerships
- `POST /api/partnerships/` - Create partnership
- `GET /api/partnerships/` - List partnerships
- `GET /api/partnerships/{id}/` - Get partnership details

## CORS Configuration

The Django backend is configured to accept requests from:
- `http://localhost:3000` (development)
- Custom URLs via `FRONTEND_URL` environment variable

To add more origins, update `backend/config/settings.py`:

\`\`\`python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://yourdomain.com",
]
\`\`\`

## Database

The system uses PostgreSQL. Configure in `backend/config/settings.py`:

\`\`\`python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'construction_license',
        'USER': 'postgres',
        'PASSWORD': 'postgres',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
\`\`\`

## JWT Token Flow

1. User logs in with email/password
2. Django returns `access` and `refresh` tokens
3. Frontend stores both in `localStorage` under key `clms_tokens`
4. All subsequent API calls include `Authorization: Bearer {access_token}`
5. When token expires, frontend automatically refreshes it using `refresh_token`
6. If refresh fails, user is logged out

## Hybrid Approach Benefits

1. **Real Database**: All data persisted in PostgreSQL (not localStorage)
2. **Scalability**: Django handles complex business logic
3. **Security**: Passwords hashed on backend, JWT tokens secure
4. **Performance**: Database queries optimized by Django ORM
5. **Admin Dashboard**: Full Django admin for system management
6. **Analytics**: Real-time data processing and reporting

## Troubleshooting

### CORS Errors

If you see CORS errors in browser console:
1. Check `NEXT_PUBLIC_DJANGO_API_URL` is correct
2. Verify Django `CORS_ALLOWED_ORIGINS` includes your frontend URL
3. Check Django is running on port 8000

### Auth Failures

If login/registration fails:
1. Verify Django backend is running: `curl http://localhost:8000/api/users/token/`
2. Check PostgreSQL is running
3. Check database credentials in settings.py

### Token Expiration

If requests fail with 401 Unauthorized:
1. Frontend will automatically try to refresh
2. If refresh fails, user should be logged out
3. Check JWT settings in `backend/config/settings.py`

## File Structure

\`\`\`
lib/
├── config/
│   └── django-api.ts          # Configuration & constants
├── api/
│   └── django-client.ts       # High-level API functions
\`\`\`

Key files using Django APIs:
- `components/auth/login-form.tsx`
- `components/auth/register-form.tsx`
- `app/dashboard/contractor-license/apply/page.tsx`
- `app/dashboard/professional-license/apply/page.tsx`
- `app/dashboard/import-export/apply/page.tsx`
- `app/dashboard/partnerships/register/page.tsx`
