require('dotenv').config();

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
app.set('trust proxy', 1);


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
app.use('/api/email', require('./routes/email.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/wishlist', require('./routes/wishlist.routes'));
app.use('/api/product-ratings', require('./routes/productRating.routes'));
app.use('/api/subscriptions', require('./routes/subscription.routes'));
app.use('/api/support-requests', require('./routes/supportRequest.routes'));
app.use('/api/user-dashboard', require('./routes/user-dashboard.routes'));
app.use('/api/boutique-dashboard', require('./routes/boutique-dashboard.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/store/register', require('./routes/store-register.routes'));
app.use('/api/stock-movements', require('./routes/stockMovement.routes'));
app.use('/api/inventories', require('./routes/inventory.routes'));
app.use('/api/chat', require('./chatbot/chat.router'));
app.use('/api/boxes', require('./routes/box.routes'));
app.use('/api/system', require('./routes/system.routes'));


module.exports = app;
