const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/:verticalCount', async (req, res) => {
  const verticalCount = parseInt(req.params.verticalCount);

  if (isNaN(verticalCount)) {
    return res.status(400).json({ success: false, message: 'Invalid verticalCount' });
  }

  try {
    const result = await pool.query(
      'SELECT goal_factor, start_factor FROM multipliers WHERE vertical_count = $1',
      [verticalCount]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    res.json({
      success: true,
      goal_factor: result.rows[0].goal_factor,
      start_factor: result.rows[0].start_factor
    });
  } catch (err) {
    console.error('❌ multipliers fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error', detail: err.message });
  }
});

module.exports = router;