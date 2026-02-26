const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "API MEAN Project",
            version: "1.0.0",
            description: "Documentation de l'API Express"
        },
        servers: [
            { url: "http://localhost:3000" }
        ],

        // 🔐 AJOUT ICI
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },

        // 🔐 Sécurité globale (optionnelle mais recommandée)
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: ["./routes/*.js", "./chatbot/chat.router.js"]
};

module.exports = swaggerJsdoc(options);
