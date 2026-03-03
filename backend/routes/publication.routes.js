const express = require('express');
const router = express.Router();
const publicationController = require('../controllers/publication.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');


// ─── PUBLIC ───────────────────────────────────────────────────────────────────

/**
 * GET /api/publications
 * Public feed of published publications — no auth required
 * Query: type, authorType, page, limit
 */
router.get(
    '/',
    publicationController.getPublications
);

/**
 * GET /api/publications/my
 * Publications for the connected boutique
 */
router.get(
    '/my',
    protect,
    authorize('admin', 'boutique'),
    publicationController.getMyPublications
);


/**
 * GET /api/publications/pending
 * List of pending publications
 */
router.get(
    '/pending',
    protect,
    authorize('admin'),
    publicationController.getPendingPublications
);

/**
 * GET /api/publications/:id
 * Publication details — no auth required
 */
router.get(
    '/:id',
    publicationController.getPublicationById
);


/**
 * POST /api/publications
 * Create a publication (admin or boutique)
 * - Admin -> published immediately
 * - Boutique -> pending, notify admin
 */
router.post(
    '/',
    protect,
    authorize('admin', 'boutique'),
    upload.array('images', 10),
    publicationController.createPublication
);

/**
 * DELETE /api/publications/:id
 * Delete a publication
 * - Admin: any
 * - Boutique: only their own
 */
router.delete(
    '/:id',
    protect,
    authorize('admin', 'boutique'),
    publicationController.deletePublication
);




/**
 * PATCH /api/publications/:id/validate
 * Approve or reject a publication
 * Body: { action: 'approve' | 'reject', rejectedReason? }
 */
router.patch(
    '/:id/validate',
    protect,
    authorize('admin'),
    publicationController.validatePublication
);


module.exports = router;
