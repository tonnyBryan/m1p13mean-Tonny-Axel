const Boutique = require('../models/Boutique');
const {errorResponse} = require("../utils/apiResponse");

const injectBoutiqueFilter = async (req, res, next) => {
    if (req.user.role !== 'boutique') {
        return next();
    }

    const boutique = await Boutique.findOne({ owner: req.user._id }).select('_id');

    if (!boutique) {
        return errorResponse(res,403, 'Store not found for this user');
    }

    req.query.boutique = boutique._id.toString();

    next();
};

module.exports = injectBoutiqueFilter;
