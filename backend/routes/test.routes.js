const express = require('express');
const router = express.Router();
const testController = require('../controllers/test.controller');

/**
 * @swagger
 * /hello:
 *   get:
 *     summary: Test route
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/hello', testController.hello);

module.exports = router;
