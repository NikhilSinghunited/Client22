const express = require('express');
const router = express.Router();
const authenticateAdmin = require('../middleware/authmiddleware.js');
router.get('/', (req, res) => {
  res.render('../views/uploaddriver.ejs');
});
router.post('/admin/drivers', (req, res) => {
  res.render('../views/adin/drivers');
});
router.get('/admin/drivers', (req, res) => {
  res.render('../views/admindashboard.ejs');
});

module.exports = router;
