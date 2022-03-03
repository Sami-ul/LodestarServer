const express = require('express');
const router = express.Router();

// Shows if the app is online
router.get('/', (req, res) => {
  res.send("online");
});

module.exports = router;