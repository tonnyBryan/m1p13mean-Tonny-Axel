const CentreCommercial = require('../models/CentreCommercial');
const { successResponse, errorResponse } = require('../utils/apiResponse');

exports.getCentreCommercial = async (req, res) => {
  try {
    // on suppose qu'il n'y a qu'un document
    const centre = await CentreCommercial.findOne().lean();
    if (!centre) {
      // si aucun document, on renvoie une erreur serveur comme demandé
      return errorResponse(res, 500, 'The central commercial configuration was not found. Please contact support.');
    }

    return successResponse(res, 200, null, centre);
  } catch (err) {
    console.error('getCentreCommercial error:', err);
    return errorResponse(res, 500, 'An unexpected server error occurred while retrieving the commercial center configuration. Please try again later.');
  }
};
