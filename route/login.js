const express = require('express');
const router = express.Router();

const authenticateAdmin = require('../middleware/authmiddleware.js');
router.get('/login', authenticateAdmin, (req, res) => {
  res.render('../views/admindashboard.ejs');
});
module.exports = router;
