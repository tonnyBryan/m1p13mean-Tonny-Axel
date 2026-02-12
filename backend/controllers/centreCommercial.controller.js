const CentreCommercial = require('../models/CentreCommercial');
const { successResponse, errorResponse } = require('../utils/apiResponse');

exports.getCentreCommercial = async (req, res) => {
  try {
    // on suppose qu'il n'y a qu'un document
    const centre = await CentreCommercial.findOne().lean();
    if (!centre) {
      // si aucun document, on renvoie une erreur serveur comme demandé
      return errorResponse(res, 500, 'Centre commercial introuvable');
    }

    return successResponse(res, 200, null, centre);
  } catch (err) {
    console.error('getCentreCommercial error:', err);
    return errorResponse(res, 500, 'Erreur serveur');
  }
};
