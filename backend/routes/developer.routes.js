// Developer dashboard: manage portfolio projects, view/respond to website-service enquiries.
const express = require('express');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('developer'));

async function getDeveloperProfileId(userId) {
  const result = await pool.query('SELECT id FROM developer_profiles WHERE user_id = $1', [userId]);
  return result.rows[0]?.id || null;
}

// GET /api/developer/requests -- website-service enquiries (is_website_request = true)
router.get('/requests', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.name AS client_name, u.email AS client_email
       FROM consultations c
       LEFT JOIN users u ON u.id = c.client_id
       WHERE c.is_website_request = true
       ORDER BY c.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load website requests.' });
  }
});

// PATCH /api/developer/requests/:id/status
router.patch('/requests/:id/status', async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'in_progress', 'completed', 'cancelled'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}` });
  }

  try {
    const result = await pool.query(
      `UPDATE consultations SET status = $1, updated_at = now()
       WHERE id = $2 AND is_website_request = true RETURNING *`,
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Request not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update status.' });
  }
});

// GET /api/developer/projects -- this developer's portfolio
router.get('/projects', async (req, res) => {
  try {
    const devId = await getDeveloperProfileId(req.user.id);
    if (!devId) return res.status(404).json({ error: 'Developer profile not found.' });

    const result = await pool.query(
      'SELECT * FROM portfolio_projects WHERE developer_id = $1 ORDER BY created_at DESC',
      [devId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load projects.' });
  }
});

// POST /api/developer/projects -- add a portfolio project
router.post('/projects', async (req, res) => {
  const { title, description, projectLink } = req.body;
  if (!title) return res.status(400).json({ error: 'Project title is required.' });

  try {
    const devId = await getDeveloperProfileId(req.user.id);
    const result = await pool.query(
      `INSERT INTO portfolio_projects (developer_id, title, description, project_link)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [devId, title, description || null, projectLink || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not add project.' });
  }
});

// DELETE /api/developer/projects/:id
router.delete('/projects/:id', async (req, res) => {
  try {
    const devId = await getDeveloperProfileId(req.user.id);
    const result = await pool.query(
      'DELETE FROM portfolio_projects WHERE id = $1 AND developer_id = $2 RETURNING id',
      [req.params.id, devId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found.' });
    res.json({ message: 'Project removed.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not remove project.' });
  }
});

module.exports = router;
