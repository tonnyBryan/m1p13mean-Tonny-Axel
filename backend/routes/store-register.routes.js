const express = require('express');
const router = express.Router();
const storeRegisterController = require('../controllers/store-register.controller');
const upload = require("../middlewares/upload.middleware");

router.post('/check-email', storeRegisterController.checkEmail);

router.post('/send-otp', storeRegisterController.sendOtp);

router.post('/submit',  upload.single('file'), storeRegisterController.submitRegister);

module.exports = router;