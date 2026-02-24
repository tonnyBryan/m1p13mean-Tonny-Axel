const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload un fichier buffer vers Cloudinary
 * @param {Buffer} fileBuffer
 * @param {String} folder
 */
const uploadImage = (fileBuffer, folder = 'products') => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'auto' // 'auto' est plus flexible que 'image'
            },
            (error, result) => {
                if (error) {
                    console.error("Erreur Cloudinary détaillée:", error);
                    return reject(error);
                }
                resolve(result);
            }
        );

        // On utilise la méthode 'end' de stream-ifier ou on passe le buffer directement
        stream.end(fileBuffer);
    });
};

/**
 * Supprime une ressource Cloudinary par son public_id
 * @param {String} publicId
 */
const deleteImage = (publicId) => {
    return new Promise((resolve, reject) => {
        if (!publicId) return resolve({ success: false, message: 'No publicId provided' });
        cloudinary.uploader.destroy(publicId, { resource_type: 'image' }, (error, result) => {
            if (error) {
                console.error('Cloudinary delete error:', error);
                return reject(error);
            }
            resolve(result);
        });
    });
};

module.exports = {
    uploadImage,
    deleteImage
};
