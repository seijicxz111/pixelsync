# Deployment

## Web on Vercel

1. Create a Vercel project connected to the repository.
2. Set root as the project root.
3. Use `vercel.json` install/build commands.
4. Configure `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_REALTIME_URL`, and OAuth secrets.

## Realtime on Railway

1. Create a Railway service from the repository.
2. Railway uses `railway.toml` and `apps/realtime-server/Dockerfile`.
3. Set `DATABASE_URL`, `REDIS_URL`, `WEB_ORIGIN`, `AUTH_SECRET`, `PORT=4000`.
4. Verify `/health`.

## Realtime on Fly.io

1. `fly launch --no-deploy`.
2. Review `fly.toml`.
3. Set secrets with `fly secrets set`.
4. Deploy with `fly deploy`.

## Supabase

Use Supabase Postgres for `DATABASE_URL` and `DIRECT_URL`. Run migrations from a trusted environment. Supabase Storage can hold thumbnails and exported assets; do not expose service-role keys to the browser.

## Scaling Notes

Socket.IO long-polling works best with sticky sessions. WebSocket-only deployments can be less sensitive, but sticky sessions are still recommended. Redis adapter broadcasts events between instances; it does not persist the canvas state by itself.
