# Library Management Frontend

React frontend for the Django REST API backend at `D:\code\library-management`.

## Run locally

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

The API base URL defaults to `/api/v1`; Vite proxies it to `http://127.0.0.1:8000` during local development. It can be changed with `VITE_API_BASE_URL`.

Implemented API client methods match the current backend:

- `POST /auth/login/`
- `GET /auth/me/`
- `POST /auth/logout/`
- `GET /circulation/loans/`
- `POST /circulation/loans/borrow/`
- `PATCH /circulation/loans/:id/renew/`
- `POST /circulation/loans/:id/return/`
- `GET /catalog/books/` with optional `search` query
- `GET /catalog/authors/`
- `GET /catalog/genres/`
- `GET /catalog/languages/`
- `GET /catalog/book-instances/`

The `/books` screen is connected to the Catalog books endpoint. Catalog write forms remain Admin-only and follow the backend permission contract.
