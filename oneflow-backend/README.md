# OneFlow Backend API

Node.js + Express + PostgreSQL backend for OneFlow project management system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your database credentials

4. Create uploads directories:
```bash
mkdir uploads
mkdir uploads/receipts
```

5. Run the server:
```bash
npm run dev
```

## API Documentation

See main README.md for API endpoints.

## Environment Variables

- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)

