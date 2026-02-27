const express = require('express');
const router = express.Router();
const boxController = require('../controllers/box.controller');
const { protect, authorize } = require("../middlewares/auth.middleware");

// Routes require admin authentication

// GET /api/boxes
router.get('/', protect, authorize('admin'), boxController.getBoxes);

// GET /api/boxes/:id
router.get('/:id', protect, authorize('admin'), boxController.getBoxById);

// POST /api/boxes
router.post('/', protect, authorize('admin'), boxController.createBox);

// PATCH /api/boxes/:id
router.patch('/:id', protect, authorize('admin'), boxController.updateBox);

// DELETE /api/boxes/:id
router.delete('/:id', protect, authorize('admin'), boxController.deleteBox);

module.exports = router;
