// Client dashboard: view own consultations, book a new one, chat history.
const express = require('express');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('client'));

// GET /api/client/consultations -- everything this client has submitted
router.get('/consultations', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, lp.specialization AS lawyer_specialization, u.name AS lawyer_name
       FROM consultations c
       LEFT JOIN lawyer_profiles lp ON lp.id = c.lawyer_id
       LEFT JOIN users u ON u.id = lp.user_id
       WHERE c.client_id = $1
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load your consultations.' });
  }
});

// POST /api/client/consultations -- book a new consultation as a logged-in client
router.post('/consultations', async (req, res) => {
  const { lawyerId, service, message, isWebsiteRequest } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Please describe what you need help with.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO consultations (client_id, lawyer_id, is_website_request, service, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, lawyerId || null, !!isWebsiteRequest, service || null, message]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not submit your request.' });
  }
});

// GET /api/client/consultations/:id/notes -- replies from the lawyer/developer on a case
router.get('/consultations/:id/notes', async (req, res) => {
  try {
    const owns = await pool.query('SELECT id FROM consultations WHERE id = $1 AND client_id = $2', [
      req.params.id,
      req.user.id,
    ]);
    if (owns.rows.length === 0) return res.status(404).json({ error: 'Not found.' });

    const notes = await pool.query(
      `SELECT n.*, u.name AS author_name, u.role AS author_role
       FROM consultation_notes n
       LEFT JOIN users u ON u.id = n.author_id
       WHERE n.consultation_id = $1
       ORDER BY n.created_at ASC`,
      [req.params.id]
    );
    res.json(notes.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load updates.' });
  }
});

module.exports = router;
