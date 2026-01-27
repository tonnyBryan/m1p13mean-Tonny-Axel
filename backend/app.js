require('dotenv').config();

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const connectDB = require('./config/db');

connectDB();

const app = express();
app.use(express.json());

// ===== Swagger configuration =====
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "API MEAN Project",
            version: "1.0.0",
            description: "Documentation de l'API Express pour le projet MEAN"
        },
        servers: [
            {
                url: "http://localhost:3000", // URL locale
            }
        ]
    },
    apis: ["./routes/*.js","./app.js"] // fichiers où tu mettras tes routes avec JSDoc
};

const specs = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// ===== Routes =====
app.get('/', (req, res) => {
    res.json({ message: 'API MEAN OK 🚀' });
});

// Exemple de route documentée
/**
 * @swagger
 * /hello:
 *   get:
 *     summary: Test route
 *     description: Renvoie un message de test
 *     responses:
 *       200:
 *         description: Succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Hello World!"
 */
app.get('/hello', (req, res) => {
    res.json({ message: "Hello World!" });
});

// ===== Lancement du serveur =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
