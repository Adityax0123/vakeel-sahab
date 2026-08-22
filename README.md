# Vakeel Sahab — Full-Stack Web App

A legal-services platform with a public marketing site, an OpenAI-powered chatbot,
and three role-based dashboards (Client, Lawyer, Developer).

## Stack
- **Frontend:** Static HTML/CSS/JS (no build step) — `frontend/public`
- **Backend:** Node.js + Express — `backend/`
- **Database:** PostgreSQL — `database/`
- **Chatbot:** OpenAI Chat Completions API

## Project Structure
```
vakeel-sahab/
├── backend/
│   ├── server.js              # Express app entry point
│   ├── db/pool.js             # PostgreSQL connection pool
│   ├── middleware/auth.js     # JWT verification + role guard
│   ├── routes/
│   │   ├── auth.routes.js     # register / login
│   │   ├── public.routes.js   # contact form, lawyer listing (no login)
│   │   ├── client.routes.js   # client dashboard API
│   │   ├── lawyer.routes.js   # lawyer dashboard API
│   │   ├── developer.routes.js# developer dashboard API
│   │   └── chatbot.routes.js  # OpenAI chatbot endpoint
│   ├── utils/openai.js        # OpenAI API wrapper + system prompt
│   ├── package.json
│   └── .env.example
├── database/
│   ├── schema.sql              # tables, types, indexes
│   └── seed.sql                # sample login accounts for testing
└── frontend/public/
    ├── index.html               # marketing site (chatbot + contact form wired to API)
    ├── login.html                # shared login (routes by role) + client signup
    ├── dashboard-client.html
    ├── dashboard-lawyer.html
    ├── dashboard-developer.html
    ├── css/dashboard.css
    └── js/
        ├── api.js               # shared fetch helper + session storage
        └── chatbot-widget.js    # floating chat widget logic
```

## 1. Database Setup

Install PostgreSQL if you don't have it, then:

```bash
createdb vakeel_sahab
psql -d vakeel_sahab -f database/schema.sql
psql -d vakeel_sahab -f database/seed.sql   # optional: adds test accounts
```

**Sample login accounts from seed.sql (password for all: `Passw0rd!`):**
| Role      | Email                              |
|-----------|-------------------------------------|
| client    | client@example.com                  |
| lawyer    | ramesh.lawyer@vakeelsahab.com       |
| lawyer    | priya.lawyer@vakeelsahab.com        |
| developer | aman.dev@vakeelsahab.com            |
| admin     | admin@vakeelsahab.com               |

> Public self-registration only creates **client** accounts. Create lawyer/developer/admin
> accounts by inserting rows directly into `users` + `lawyer_profiles` / `developer_profiles`
> (see seed.sql for the pattern), until you build an admin-only account-creation screen.

## 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/vakeel_sahab
JWT_SECRET=<generate a long random string>
OPENAI_API_KEY=<your real OpenAI key>
CLIENT_ORIGIN=http://localhost:3000
```

Run it:
```bash
npm start          # production
npm run dev         # auto-restart on file changes (needs devDependency nodemon)
```

The API runs on `http://localhost:5000` by default (change `PORT` in `.env`).

## 3. Frontend Setup

The frontend is static — no build step. Serve it with any static server, e.g.:

```bash
cd frontend/public
python3 -m http.server 3000
```

Then open `http://localhost:3000/index.html`.

**Important:** each HTML file loads `js/api.js`, which reads `window.API_BASE`.
`index.html` sets this near the top:
```html
<script>window.API_BASE = 'http://localhost:5000/api';</script>
```
Update this to your deployed backend URL when you go live. The dashboard pages
default to `http://localhost:5000/api` automatically if `API_BASE` isn't set —
edit `frontend/public/js/api.js` (top line) for production.

## 4. OpenAI Chatbot

The chatbot widget appears as a floating button on the marketing site and inside
the client dashboard. It calls `POST /api/chatbot/message`, which:
1. Saves the visitor's message to `chatbot_messages`
2. Sends recent conversation history + a system prompt (see `backend/utils/openai.js`)
   to OpenAI's Chat Completions API
3. Saves and returns the assistant's reply

Conversations are grouped by a `sessionId` generated client-side and stored in
`localStorage`, so a visitor's chat persists across page reloads (but is separate
per browser). Logged-in users' `user_id` is attached automatically when a valid
token is present, but login isn't required to use the chatbot.

To swap models, edit `OPENAI_MODEL` in `.env` (defaults to `gpt-4o-mini`).

## 5. How the Three Dashboards Work

- **Client** (`dashboard-client.html`) — book a new consultation (legal or website),
  view status of past requests, chat with the AI assistant.
- **Lawyer** (`dashboard-lawyer.html`) — view queries assigned to them, update status
  (pending → in progress → completed), reply to clients, edit their own profile.
- **Developer** (`dashboard-developer.html`) — view all website-development enquiries
  (flagged via `is_website_request`), update their status, manage portfolio projects
  shown on the public site.

All three share one login page (`login.html`); after authenticating, the user is
redirected based on the `role` returned by the backend. Each dashboard calls
`guardPage('role')` on load, which redirects to the correct dashboard (or to login)
if the session doesn't match.

## 6. Security Notes Before Going Live
- Rotate `JWT_SECRET` to a long random value and never commit `.env`.
- Put the backend behind HTTPS; set `CLIENT_ORIGIN` to your real frontend domain (not `*`).
- Rate-limit `/api/chatbot/message` and `/api/public/contact` to prevent abuse (e.g. `express-rate-limit`).
- Consider adding email verification for client signups.
- Add server-side input validation/sanitization (e.g. `zod` or `express-validator`) before production use.
- Move lawyer/developer account creation behind an authenticated admin-only route instead of manual SQL inserts.

## What Was Tested
This scaffold was run end-to-end against a real local PostgreSQL database and a
running Express server: registration, login for all 4 roles, role-based access
control (401/403 verified), client booking flow, lawyer/developer dashboard data
retrieval, portfolio project CRUD, the public contact form (including the legal-vs-website
routing fix), and chatbot message logging with graceful failure handling when no
real OpenAI key is present. You'll still want to test with your real OpenAI key
and a production database before launch.
