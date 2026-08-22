// Public chatbot endpoint -- works for anonymous site visitors and logged-in clients.
// Conversation history is grouped by session_id (generate a random UUID in the frontend
// and reuse it for the length of the visitor's session).
const express = require('express');
const pool = require('../db/pool');
const { getChatbotReply } = require('../utils/openai');

const router = express.Router();

// Optional auth: if a valid token is present we log the user_id, but it's not required.
const jwt = require('jsonwebtoken');
function attachUserIfPresent(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (_) {
      /* ignore invalid token for the chatbot -- treat as anonymous */
    }
  }
  next();
}

// POST /api/chatbot/message
// body: { sessionId: string, message: string }
router.post('/message', attachUserIfPresent, async (req, res) => {
  const { sessionId, message } = req.body;

  if (!sessionId || !message) {
    return res.status(400).json({ error: 'sessionId and message are required.' });
  }

  try {
    // 1. Save the user's message
    await pool.query(
      `INSERT INTO chatbot_messages (session_id, user_id, sender, content) VALUES ($1, $2, 'user', $3)`,
      [sessionId, req.user?.id || null, message]
    );

    // 2. Pull recent history for this session (last 20 messages) for context
    const historyResult = await pool.query(
      `SELECT sender, content FROM chatbot_messages
       WHERE session_id = $1 ORDER BY created_at ASC LIMIT 20`,
      [sessionId]
    );

    // 3. Get a reply from OpenAI
    const reply = await getChatbotReply(historyResult.rows);

    // 4. Save the assistant's reply
    await pool.query(
      `INSERT INTO chatbot_messages (session_id, user_id, sender, content) VALUES ($1, $2, 'assistant', $3)`,
      [sessionId, req.user?.id || null, reply]
    );

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'The chatbot is temporarily unavailable. Please try again shortly.' });
  }
});

// GET /api/chatbot/history/:sessionId -- reload a conversation (e.g. after page refresh)
router.get('/history/:sessionId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sender, content, created_at FROM chatbot_messages
       WHERE session_id = $1 ORDER BY created_at ASC`,
      [req.params.sessionId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load conversation history.' });
  }
});

module.exports = router;
