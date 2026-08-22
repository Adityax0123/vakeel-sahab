-- ==========================================================
-- Vakeel Sahab -- Database Schema (PostgreSQL)
-- ==========================================================

CREATE TYPE user_role AS ENUM ('client', 'lawyer', 'developer', 'admin');
CREATE TYPE consultation_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE message_sender AS ENUM ('user', 'assistant');

-- ---------- USERS ----------
-- Every login (client, lawyer, developer, admin) is a row here.
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  phone         VARCHAR(20),
  password_hash TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'client',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- LAWYER PROFILES ----------
CREATE TABLE lawyer_profiles (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  specialization    VARCHAR(200),
  designation       VARCHAR(150),
  experience_years  INTEGER,
  qualifications    TEXT,
  registration_no   VARCHAR(100),
  bio               TEXT,
  photo_url         TEXT,
  office_location   VARCHAR(200)
);

-- ---------- LAWYER SERVICES ----------
CREATE TABLE lawyer_services (
  id          SERIAL PRIMARY KEY,
  lawyer_id   INTEGER NOT NULL REFERENCES lawyer_profiles(id) ON DELETE CASCADE,
  name        VARCHAR(200) NOT NULL,
  description TEXT
);

-- ---------- DEVELOPER PROFILE ----------
CREATE TABLE developer_profiles (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skills       TEXT,
  bio          TEXT,
  photo_url    TEXT
);

-- ---------- DEVELOPER PORTFOLIO PROJECTS ----------
CREATE TABLE portfolio_projects (
  id           SERIAL PRIMARY KEY,
  developer_id INTEGER NOT NULL REFERENCES developer_profiles(id) ON DELETE CASCADE,
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  project_link TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- CONSULTATIONS / ENQUIRIES ----------
CREATE TABLE consultations (
  id                  SERIAL PRIMARY KEY,
  client_id           INTEGER REFERENCES users(id) ON DELETE SET NULL,
  lawyer_id           INTEGER REFERENCES lawyer_profiles(id) ON DELETE SET NULL,
  is_website_request  BOOLEAN NOT NULL DEFAULT false,
  guest_name          VARCHAR(150),
  guest_phone         VARCHAR(20),
  guest_email         VARCHAR(150),
  service             VARCHAR(200),
  message             TEXT,
  status              consultation_status NOT NULL DEFAULT 'pending',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- CONSULTATION NOTES / REPLIES ----------
CREATE TABLE consultation_notes (
  id               SERIAL PRIMARY KEY,
  consultation_id  INTEGER NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  author_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  note             TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- CHATBOT CONVERSATIONS ----------
CREATE TABLE chatbot_messages (
  id          SERIAL PRIMARY KEY,
  session_id  VARCHAR(100) NOT NULL,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  sender      message_sender NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chatbot_session ON chatbot_messages(session_id);
CREATE INDEX idx_consultations_client ON consultations(client_id);
CREATE INDEX idx_consultations_lawyer ON consultations(lawyer_id);
CREATE INDEX idx_consultations_status ON consultations(status);
