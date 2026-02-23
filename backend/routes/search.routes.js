// routes/search.routes.js

const express = require('express');
const router = express.Router();
const { globalSearch, searchGlobalForBoutique, searchGlobalForAdmin } = require('../controllers/search.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.get('/', protect, authorize('user', 'admin'), globalSearch);
router.get('/boutique', protect, authorize('boutique', 'admin'), searchGlobalForBoutique);
router.get('/admin', protect, authorize('admin'), searchGlobalForAdmin);



module.exports = router;
