# Frontend (Next.js)

Minimal Next.js app that calls the backend in `../api`.

## Run locally

1. Install deps:

```bash
cd frontend
npm install
```

2. Start dev server (defaults to http://localhost:3000):

```bash
npm run dev
```

3. Ensure backend is running on http://localhost:8000.

4. Optionally set API base URL:

```bash
# in another shell or via .env.local
export NEXT_PUBLIC_API_URL=http://localhost:8000
```

Open http://localhost:3000 and try the form.

## Deploy

- Set `NEXT_PUBLIC_API_URL` to your deployed backend URL.
