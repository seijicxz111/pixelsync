# Security

- HTTP mutations require Auth.js sessions.
- Socket identity is resolved from Auth.js session cookies or development/public guest rules.
- Project membership is checked before joins and editor mutations.
- Viewer and guest users cannot send canvas operations.
- Zod validates every socket event and API payload.
- Operation payload size, color values, coordinates, and dimensions are constrained.
- Invite tokens are random, expire, and are stored as SHA-256 hashes.
- Environment variables are validated at startup.
- Error responses avoid leaking internals.
- Database constraints mirror application constraints where practical.

Production deployments should set strong `AUTH_SECRET`, restrict CORS to the deployed web origin, disable demo mode, use TLS, and rotate OAuth/Supabase/Redis credentials through platform secret managers.
