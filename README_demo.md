# CLMS Demo Script

## Setup
- Ensure Django backend is running and accessible via DJANGO_API_URL.
- Create `.env.local` with required vars; start Next dev: `npm run dev`.

## Demo Flow (10 minutes)
- Home: show services and Stats; explain proxy architecture.
- Maintenance: toggle maintenance in System Settings; show global banner and disabled actions.
- Registration/Login: register a user, auto-login; show role-based header changes.
- License Application:
  - Contractor → Step 1: attempt Continue without photo (blocked).
  - Upload 4×3 photo; attempt non-4×3 image to trigger error; then valid image passes.
  - Repeat for Professional and Import/Export.
- Documents Upload:
  - Use form to upload; server-side 4×3 validation returns clear error if invalid.
- Settings:
  - Show maintenance switch, notifications, and persistence.

## Key Talking Points
- Client + server validation parity (4×3 ratio, min size).
- Next.js app router, same-origin proxy to Django, consistent error handling.
- RBAC, audit trail readiness, and scalability notes.

## Troubleshooting
- If Stats error appears, backend may be down; still demonstrate flows.
- Hydration warnings: resolved via stable banner rendering.
