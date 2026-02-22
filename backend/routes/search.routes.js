// routes/search.routes.js

const express = require('express');
const router = express.Router();
const { globalSearch, searchGlobalForBoutique } = require('../controllers/search.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.get('/', protect, authorize('user', 'admin'), globalSearch);
router.get('/boutique', protect, authorize('boutique', 'admin'), searchGlobalForBoutique);



module.exports = router;
