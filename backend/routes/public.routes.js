// Public, no-login-required routes: contact form + browsing lawyers/services.
const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// GET /api/public/lawyers -- list all lawyers with their services, for the site's "Our Lawyers" section
router.get('/lawyers', async (req, res) => {
  try {
    const lawyers = await pool.query(`
      SELECT lp.id, lp.specialization, lp.designation, lp.experience_years,
             lp.qualifications, lp.registration_no, lp.bio, lp.photo_url, lp.office_location,
             u.name, u.email, u.phone
      FROM lawyer_profiles lp
      JOIN users u ON u.id = lp.user_id
      ORDER BY lp.id
    `);

    const services = await pool.query('SELECT * FROM lawyer_services');

    const withServices = lawyers.rows.map((lawyer) => ({
      ...lawyer,
      services: services.rows.filter((s) => s.lawyer_id === lawyer.id),
    }));

    res.json(withServices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load lawyers.' });
  }
});

// POST /api/public/contact -- the site's contact form (guest submissions allowed)
router.post('/contact', async (req, res) => {
  const { name, phone, email, service, preferredLawyerId, message, isWebsiteRequest } = req.body;

  if (!name || !phone || !message) {
    return res.status(400).json({ error: 'Name, phone and message are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO consultations
        (client_id, lawyer_id, is_website_request, guest_name, guest_phone, guest_email, service, message)
       VALUES (NULL, $1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [preferredLawyerId || null, !!isWebsiteRequest, name, phone, email || null, service || null, message]
    );

    res.status(201).json({
      message: 'Thank you. Our team will contact you shortly.',
      consultationId: result.rows[0].id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not submit your enquiry. Please try again.' });
  }
});

module.exports = router;
