# AuthApp – Node.js + SQL Server Authentication

A simple but secure web application demonstrating:
- User registration & login
- Server-side sessions
- Password hashing (bcrypt)
- SQL Injection prevention (parameterised queries)
- XSS protection (Helmet, HTTP-only cookies, textContent vs innerHTML)

---

## Project Structure

```
auth-app/
├── server.js                 ← Express entry point – start here
├── package.json
├── .env.example              ← Copy to .env and fill in your values
├── .gitignore
│
├── config/
│   └── database.js           ← SQL Server connection pool + schema setup
│
├── middleware/
│   └── auth.js               ← requireLogin / redirectIfLoggedIn guards
│
├── routes/
│   ├── auth.js               ← POST /register, POST /login, GET /logout
│   └── pages.js              ← GET /, GET /home, GET /api/session
│
└── public/                   ← Static files served directly to the browser
    ├── register.html
    ├── login.html
    ├── home.html
    ├── css/
    │   └── style.css
    └── js/
        └── navbar.js
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18 or later |
| SQL Server | 2017 or later (Express edition is fine) |
| npm | comes with Node.js |

---

## Setup (Step by Step)

### 1. Install dependencies

```bash
cd auth-app
npm install
```

### 2. Create the database

Open SQL Server Management Studio (SSMS) or `sqlcmd` and run:

```sql
CREATE DATABASE AuthAppDB;
```

> The `users` table is created automatically by `config/database.js` on first run.

### 3. Configure environment variables

```bash
# Copy the example file
copy .env.example .env        # Windows
cp  .env.example  .env        # macOS / Linux
```

Then open `.env` and fill in your SQL Server credentials:

```ini
DB_SERVER=localhost\SQLEXPRESS   # or just "localhost" for default instance
DB_PORT=1433
DB_DATABASE=AuthAppDB
DB_USER=sa
DB_PASSWORD=YourActualPassword
SESSION_SECRET=some-long-random-string-here
PORT=3000
```

> **Tip – generating a strong SESSION_SECRET:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 4. Start the server

```bash
# Production
npm start

# Development (auto-restarts on file changes)
npm run dev
```

Visit **http://localhost:5000**

---

## How Each Security Feature Works

### SQL Injection Prevention

All database queries use **parameterised statements** via the `mssql` library:

```js
// ✅ SAFE – user input is a parameter, never concatenated
pool.request()
  .input('username', sql.NVarChar(50), username)
  .query('SELECT * FROM users WHERE username = @username');

// ❌ DANGEROUS – never do this
pool.query(`SELECT * FROM users WHERE username = '${username}'`);
```

### XSS Prevention

Three layers:
1. **Helmet.js** sets `Content-Security-Policy` headers so the browser blocks unexpected scripts.
2. **HTTP-only session cookie** – the JavaScript on the page cannot read `document.cookie`, so a malicious script can't steal the session.
3. **`textContent` instead of `innerHTML`** in the front-end JS – username is injected as plain text, not parsed as HTML.

### Password Security

```
Plain text → bcrypt.hash(password, 12) → $2a$12$... (stored in DB)
```

- bcrypt is a one-way hash (cannot be reversed)
- Salt is embedded automatically – same password produces different hashes
- Cost factor 12 = ~300 ms per hash – makes brute-force attacks impractical

### Session Security

- Sessions are stored **server-side** only; the browser gets an opaque ID cookie
- `httpOnly: true` – JavaScript can't access the cookie
- `secure: true` in production – cookie only sent over HTTPS
- `maxAge` – cookie expires automatically after 2 hours of inactivity

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Login failed (18456)` | Wrong DB_USER / DB_PASSWORD in `.env` |
| `Cannot open server` | Check DB_SERVER – try `localhost` vs `localhost\SQLEXPRESS` |
| `ECONNREFUSED` | SQL Server service is not running – start it in Services |
| Port 3000 busy | Change `PORT=` in `.env` |
