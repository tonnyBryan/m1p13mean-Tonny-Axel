const express = require('express');
const router = express.Router();
const { sendVerification, verify, getActiveVerification } = require('../controllers/email.controller');
const { protect, authorize} = require('../middlewares/auth.middleware');



/**
 * @route   GET /api/email/send-verification
 * @desc    Créer un code de vérification pour l'email
 * @access  Authenticated
 * @query   email (optionnel) : si non fourni, prend req.user.email
 */
router.get('/send-verification', protect, authorize('user', 'admin'), sendVerification);

/**
 * @route   POST /api/email/verify
 * @desc    Vérifier le code de l'email
 * @access  Authenticated
 * @body    email : email à vérifier
 * @body    code : code OTP à 6 chiffres
 */
router.post('/verify',protect, authorize('user', 'admin'), verify);

router.get('/active-verification', protect, authorize('user', 'admin'), getActiveVerification);


module.exports = router;
