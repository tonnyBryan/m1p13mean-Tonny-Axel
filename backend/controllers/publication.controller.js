const { successResponse, errorResponse } = require('../utils/apiResponse');
const Publication = require('../models/Publication');
const Boutique = require('../models/Boutique');
const { uploadImage } = require('../utils/cloudinary');
const { sendNotification } = require('../services/notification.service');
const mongoose = require('mongoose');

/**
 * POST /api/publications
 * Create a publication (admin or boutique)
 * - Admin -> status published immediately
 * - Boutique -> status pending, notify admin
 */
exports.createPublication = async (req, res) => {
    try {
        const { content, type } = req.body;
        const user = req.user;

        /* =========================
           1 - Content validation
        ========================= */
        if (!content || typeof content !== 'string' || content.trim().length < 3) {
            return errorResponse(res, 400, 'Publication content is required and must be at least 3 characters.');
        }

        const allowedTypes = ['promotion', 'new_arrival', 'event', 'announcement'];
        if (type && !allowedTypes.includes(type)) {
            return errorResponse(res, 400, `Invalid type. Allowed values: ${allowedTypes.join(', ')}.`);
        }

        /* =========================
           2 - Image upload
        ========================= */
        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            if (req.files.length > 10) {
                return errorResponse(res, 400, 'You can upload a maximum of 10 images per publication.');
            }
            const uploaded = await Promise.all(
                req.files.map((file) => uploadImage(file.buffer, 'publications'))
            );
            imageUrls = uploaded.map((img) => img.secure_url);
        }

        /* =========================
           3 - Boutique resolution
        ========================= */
        let boutiqueId = null;
        let boutiqueName = null;
        if (user.role === 'boutique') {
            const boutique = await Boutique.findOne({ owner: user._id }).select('_id name');
            if (!boutique) {
                return errorResponse(res, 403, 'No boutique was found for this user.');
            }
            boutiqueId = boutique._id;
            boutiqueName = boutique.name;
        }

        /* =========================
           4 - Publication creation
        ========================= */
        const status = user.role === 'admin' ? 'published' : 'pending';
        const publication = await Publication.create({
            author:     user._id,
            authorType: user.role === 'admin' ? 'admin' : 'boutique',
            boutique:   boutiqueId,
            content:    content.trim(),
            images:     imageUrls,
            type:       type || null,
            status,
        });

        /* =========================
           5 - Notify admins when boutique
        ========================= */
        if (user.role === 'boutique') {
            const User = require('../models/User');
            const admins = await User.find({ role: 'admin' }).select('_id');
            for (const admin of admins) {
                sendNotification({
                    recipient: admin._id,
                    channel:   'system',
                    type:      'publication_pending',
                    title:     'New publication pending',
                    message:   `The boutique <strong>${boutiqueName || 'Unknown'}</strong> submitted a publication pending approval.`,
                    payload:   { publicationId: publication._id },
                    url: `/admin/app/publications?tab=pending`,
                    severity:  'info'
                }).catch(err => console.error('Notification failed', err));
            }
        }

        return successResponse(res, 201, 'Publication created successfully.', publication);

    } catch (error) {
        console.error(error);
        return errorResponse(res, 500, 'An error occurred while creating the publication.');
    }
};


/**
 * GET /api/publications
 * Public list of published publications (no auth required)
 * Query: type, authorType, page, limit
 */
exports.getPublications = async (req, res) => {
    try {
        const { type, authorType, page = 1, limit = 10 } = req.query;

        const filter = { status: 'published' };
        if (type) filter.type = type;
        if (authorType) filter.authorType = authorType;

        const skip = (Number(page) - 1) * Number(limit);

        const [publications, total] = await Promise.all([
            Publication.find(filter)
                .sort({ publishedAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .populate('author',   'name email')
                .populate('boutique', 'name logo'),
            Publication.countDocuments(filter)
        ]);

        return successResponse(res, 200, null, {
            publications,
            pagination: {
                total,
                page:       Number(page),
                limit:      Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });

    } catch (error) {
        console.error(error);
        return errorResponse(res, 500, 'An error occurred while loading publications.');
    }
};


/**
 * GET /api/publications/pending
 * Pending publications - admin only
 */
exports.getPendingPublications = async (req, res) => {
    try {
        const publications = await Publication.find({ status: 'pending' })
            .sort({ createdAt: -1 })
            .populate('author',   'name email')
            .populate('boutique', 'name logo');

        return successResponse(res, 200, null, publications);

    } catch (error) {
        console.error(error);
        return errorResponse(res, 500, 'An error occurred while loading pending publications.');
    }
};


/**
 * GET /api/publications/my
 * Publications for the connected user (admin or boutique)
 * - Admin  -> all publications created by admin (authorType: admin)
 * - Boutique -> all publications for their boutique
 */
exports.getMyPublications = async (req, res) => {
    try {
        const user = req.user;
        let filter = {};


        if (user.role === 'admin') {
            filter = { author: user._id, authorType: 'admin' };
        } else {
            filter = { author: user._id, authorType: 'boutique' };
        }

        const publications = await Publication.find(filter)
            .sort({ createdAt: -1 })
            .populate('author', 'name email')
            .populate('boutique', 'name logo');

        return successResponse(res, 200, null, publications);

    } catch (error) {
        console.error(error);
        return errorResponse(res, 500, 'An error occurred while loading your publications.');
    }
};


/**
 * GET /api/publications/:id
 * Publication details
 */
exports.getPublicationById = async (req, res) => {
    try {
        const publication = await Publication.findById(req.params.id)
            .populate('author',   'name email')
            .populate('boutique', 'name logo');

        if (!publication) {
            return errorResponse(res, 404, 'Publication not found.');
        }

        return successResponse(res, 200, null, publication);

    } catch (error) {
        if (error.name === 'CastError') {
            return errorResponse(res, 404, 'Publication not found.');
        }
        return errorResponse(res, 500, 'An unexpected error occurred.');
    }
};


/**
 * PATCH /api/publications/:id/validate
 * Approve or reject a publication - admin only
 * Body: { action: 'approve' | 'reject', rejectedReason? }
 */
exports.validatePublication = async (req, res) => {
    try {
        const { action, rejectedReason } = req.body;

        if (!['approve', 'reject'].includes(action)) {
            return errorResponse(res, 400, 'Invalid action. Use "approve" or "reject".');
        }

        if (action === 'reject' && (!rejectedReason || rejectedReason.trim().length < 3)) {
            return errorResponse(res, 400, 'A reason is required to reject a publication.');
        }

        const publication = await Publication.findById(req.params.id);
        if (!publication) {
            return errorResponse(res, 404, 'Publication not found.');
        }

        if (publication.status !== 'pending') {
            return errorResponse(res, 400, `This publication is already "${publication.status}". Only pending publications can be approved or rejected.`);
        }

        publication.status         = action === 'approve' ? 'published' : 'rejected';
        publication.rejectedReason = action === 'reject' ? rejectedReason.trim() : null;
        await publication.save(); // pre-save hook manages publishedAt automatically


        if (publication.boutique) {
            const boutique = await Boutique.findById(publication.boutique).select('owner name');
            if (boutique) {
                const isApproved = action === 'approve';
                sendNotification({
                    recipient: boutique.owner,
                    channel:   'system',
                    type:      isApproved ? 'publication_approved' : 'publication_rejected',
                    title:     isApproved ? 'Publication approved' : 'Publication rejected',
                    message:   isApproved
                        ? 'Your publication was approved and is now visible to all visitors.'
                        : `Your publication was rejected. Reason: <strong>${rejectedReason}</strong>`,
                    payload:   { publicationId: publication._id },
                    url:       `/store/app/publications`,
                    severity:  isApproved ? 'success' : 'warning'
                }).catch(err => console.error('Notification failed', err));
            }
        }

        return successResponse(
            res, 200,
            `Publication ${action === 'approve' ? 'approved' : 'rejected'} successfully.`,
            publication
        );

    } catch (error) {
        console.error(error);
        return errorResponse(res, 500, 'An error occurred while validating the publication.');
    }
};


/**
 * DELETE /api/publications/:id
 * - Admin: delete any
 * - Boutique: delete only their own
 */
exports.deletePublication = async (req, res) => {
    try {
        const user = req.user;
        const publication = await Publication.findById(req.params.id);

        if (!publication) {
            return errorResponse(res, 404, 'Publication not found.');
        }

        if (user.role === 'boutique') {
            const boutique = await Boutique.findOne({ owner: user._id }).select('_id');
            if (!boutique || !publication.boutique?.equals(boutique._id)) {
                return errorResponse(res, 403, 'You are not authorized to delete this publication.');
            }
        }

        await publication.deleteOne();
        return successResponse(res, 200, 'Publication deleted successfully.');

    } catch (error) {
        console.error(error);
        return errorResponse(res, 500, 'An unexpected error occurred while deleting the publication.');
    }
};
