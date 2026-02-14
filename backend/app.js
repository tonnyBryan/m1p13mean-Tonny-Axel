require('dotenv').config();

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

// pour JSON
app.use(express.json({ limit: '20mb' }));
// pour les formulaires urlencoded
app.use(express.urlencoded({ limit: '20mb', extended: true }));

app.use(cookieParser());
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
}));


// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/', require('./routes/index.routes'));
app.use('/', require('./routes/test.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/boutiques', require('./routes/boutique.routes'));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/commandes', require('./routes/commande.routes'));
app.use('/api/centre-commercial', require('./routes/centreCommercial.routes'));
app.use('/api/ventes', require('./routes/vente.routes'));
app.use('/api/search', require('./routes/search.routes'));



module.exports = app;
