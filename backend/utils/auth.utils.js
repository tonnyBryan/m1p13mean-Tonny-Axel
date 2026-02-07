// utils/auth.utils.js
const jwt = require('jsonwebtoken');

const generateAccessToken = (payload) => {
    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRE
        }
    );
};

module.exports = {
    generateAccessToken
};
