// Lawyer dashboard: view/respond to consultations assigned to them, edit own profile.
const express = require('express');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('lawyer'));

// Helper: resolve the lawyer_profiles.id for the logged-in user
async function getLawyerProfileId(userId) {
  const result = await pool.query('SELECT id FROM lawyer_profiles WHERE user_id = $1', [userId]);
  return result.rows[0]?.id || null;
}

// GET /api/lawyer/consultations -- queries assigned to this lawyer
router.get('/consultations', async (req, res) => {
  try {
    const lawyerId = await getLawyerProfileId(req.user.id);
    if (!lawyerId) return res.status(404).json({ error: 'Lawyer profile not found.' });

    const result = await pool.query(
      `SELECT c.*, u.name AS client_name, u.email AS client_email
       FROM consultations c
       LEFT JOIN users u ON u.id = c.client_id
       WHERE c.lawyer_id = $1
       ORDER BY c.created_at DESC`,
      [lawyerId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load consultations.' });
  }
});

// PATCH /api/lawyer/consultations/:id/status -- update status (pending / in_progress / completed / cancelled)
router.patch('/consultations/:id/status', async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'in_progress', 'completed', 'cancelled'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}` });
  }

  try {
    const lawyerId = await getLawyerProfileId(req.user.id);
    const result = await pool.query(
      `UPDATE consultations SET status = $1, updated_at = now()
       WHERE id = $2 AND lawyer_id = $3 RETURNING *`,
      [status, req.params.id, lawyerId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Consultation not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update status.' });
  }
});

// POST /api/lawyer/consultations/:id/notes -- reply to a client on a case
router.post('/consultations/:id/notes', async (req, res) => {
  const { note } = req.body;
  if (!note) return res.status(400).json({ error: 'Note text is required.' });

  try {
    const result = await pool.query(
      `INSERT INTO consultation_notes (consultation_id, author_id, note)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.params.id, req.user.id, note]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not add note.' });
  }
});

// PUT /api/lawyer/profile -- edit own profile
router.put('/profile', async (req, res) => {
  const { specialization, designation, experienceYears, qualifications, bio, officeLocation } = req.body;

  try {
    const result = await pool.query(
      `UPDATE lawyer_profiles
       SET specialization = COALESCE($1, specialization),
           designation = COALESCE($2, designation),
           experience_years = COALESCE($3, experience_years),
           qualifications = COALESCE($4, qualifications),
           bio = COALESCE($5, bio),
           office_location = COALESCE($6, office_location)
       WHERE user_id = $7
       RETURNING *`,
      [specialization, designation, experienceYears, qualifications, bio, officeLocation, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update profile.' });
  }
});

module.exports = router;
