exports.successResponse = (res, statusCode = 200, message = null, data = null) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

exports.errorResponse = (res, statusCode = 500, message = 'Erreur serveur') => {
    return res.status(statusCode).json({
        success: false,
        message,
        data: null
    });
};
