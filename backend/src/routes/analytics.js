const express = require('express');
const { getOverviewStats } = require('../services/analyticsService');

const router = express.Router();

// GET /api/analytics/overview?days=30
router.get('/overview', (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 365);
    res.json(getOverviewStats(days));
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
