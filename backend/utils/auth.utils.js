const jwt = require('jsonwebtoken');

/**
 * Génère un access token JWT
 * @param {Object} user - utilisateur Mongo
 * @returns {String} JWT access token
 */
const generateAccessToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRE
        }
    );
};

module.exports = {
    generateAccessToken
};
