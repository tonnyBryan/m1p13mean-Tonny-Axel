const axios = require('axios');

const uploadImage = async (fileBuffer) => {
    try {
        // 1. Conversion en Base64
        const base64Image = fileBuffer.toString('base64');

        // 2. Utilisation de URLSearchParams (plus stable pour l'API ImgBB)
        const params = new URLSearchParams();
        params.append('image', base64Image);

        // 3. Envoi de la requête
        const response = await axios.post(
            `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
            params,
            {
                timeout: 60000 // Augmenté à 60s pour les réseaux lents
            }
        );

        return {
            secure_url: response.data.data.url
        };

    } catch (error) {
        // C'est ici qu'on voit la VRAIE erreur (ex: Clé invalide, image trop lourde)
        console.error("DÉTAIL ERREUR IMGBB:", error.response?.data || error.message);
        throw error;
    }
};

module.exports = { uploadImage };