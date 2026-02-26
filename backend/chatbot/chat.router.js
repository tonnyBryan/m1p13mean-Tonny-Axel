// chat/chat.router.js

const express = require('express');
const router = express.Router();
const chatController = require('./chat.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: AI chatbot for boutique managers
 */

/**
 * @swagger
 * /api/chat/message:
 *   post:
 *     summary: Send a message to the AI assistant
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Processes a natural language message from the boutique manager.
 *       Phase 1 — LLM generates a MongoDB query proposal.
 *       Phase 2 — Query is executed and LLM formats a structured UI-ready response.
 *       The response type determines how Angular renders the result (kpi, table, chart, list, text, mixed).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "Combien de commandes aujourd'hui ?"
 *           examples:
 *             orders_today:
 *               summary: Count orders today
 *               value:
 *                 message: "Combien de commandes aujourd'hui ?"
 *             top_products:
 *               summary: Top selling products
 *               value:
 *                 message: "Top 5 produits les plus vendus ce mois"
 *             low_stock:
 *               summary: Low stock products
 *               value:
 *                 message: "Quels produits sont en rupture de stock ?"
 *             revenue:
 *               summary: Revenue this month
 *               value:
 *                 message: "Quel est mon chiffre d'affaires ce mois ?"
 *             greeting:
 *               summary: Greeting
 *               value:
 *                 message: "Bonjour, que peux-tu faire ?"
 *     responses:
 *       200:
 *         description: Structured AI response ready for UI rendering
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [kpi, table, chart, list, text, mixed]
 *                       example: kpi
 *                     lang:
 *                       type: string
 *                       enum: [fr, en]
 *                       example: fr
 *                     title:
 *                       type: string
 *                       example: "Commandes aujourd'hui"
 *                     summary:
 *                       type: string
 *                       example: "Vous avez reçu 12 commandes aujourd'hui, soit 3 de plus qu'hier."
 *                     data:
 *                       type: object
 *                       description: Shape depends on type (kpi/table/chart/list/text/mixed)
 *                     actions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           label:
 *                             type: string
 *                             example: "Voir les commandes"
 *                           route:
 *                             type: string
 *                             example: "/store/app/orders"
 *             examples:
 *               kpi_response:
 *                 summary: KPI response example
 *                 value:
 *                   success: true
 *                   data:
 *                     type: kpi
 *                     lang: fr
 *                     title: "Commandes aujourd'hui"
 *                     summary: "Vous avez reçu 12 commandes aujourd'hui, soit 3 de plus qu'hier."
 *                     data:
 *                       items:
 *                         - label: "Commandes aujourd'hui"
 *                           value: 12
 *                           unit: "commandes"
 *                           trend: "+3 vs hier"
 *                           trendDirection: "up"
 *                     actions:
 *                       - label: "Voir les commandes"
 *                         route: "/store/app/orders"
 *               table_response:
 *                 summary: Table response example
 *                 value:
 *                   success: true
 *                   data:
 *                     type: table
 *                     lang: fr
 *                     title: "Top 5 produits — ce mois"
 *                     summary: "Le T-shirt blanc domine vos ventes avec 48 unités vendues."
 *                     data:
 *                       columns:
 *                         - key: name
 *                           label: Produit
 *                         - key: quantitySold
 *                           label: "Qté vendue"
 *                         - key: revenue
 *                           label: "Revenu (Ar)"
 *                       rows:
 *                         - name: "T-shirt blanc"
 *                           quantitySold: 48
 *                           revenue: 480000
 *                     actions: []
 *               text_response:
 *                 summary: Text response example (greeting/refusal)
 *                 value:
 *                   success: true
 *                   data:
 *                     type: text
 *                     lang: fr
 *                     title: ""
 *                     summary: ""
 *                     data:
 *                       message: "Je peux vous aider à consulter vos commandes, produits, stock, catégories et avis clients."
 *                       variant: info
 *                     actions: []
 *       400:
 *         description: Message missing or too long
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       403:
 *         description: Forbidden — role is not boutique
 *       404:
 *         description: Boutique not found for this user
 *       500:
 *         description: Internal server error
 */
router.post('/message', protect, authorize('boutique'), chatController.sendMessage);

/**
 * @swagger
 * /api/chat/history:
 *   get:
 *     summary: Get conversation history
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Returns the full message history for the authenticated boutique manager's session.
 *       Each assistant message includes the structuredResponse so Angular can re-render
 *       all previous cards (kpi, table, chart...) without re-calling the AI.
 *     responses:
 *       200:
 *         description: Conversation history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           role:
 *                             type: string
 *                             enum: [user, assistant]
 *                           content:
 *                             type: string
 *                             description: Raw text content
 *                           structuredResponse:
 *                             type: object
 *                             nullable: true
 *                             description: Full UI-ready JSON (only for assistant messages)
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *             example:
 *               success: true
 *               data:
 *                 messages:
 *                   - role: user
 *                     content: "Combien de commandes aujourd'hui ?"
 *                     structuredResponse: null
 *                     createdAt: "2025-01-15T10:30:00.000Z"
 *                   - role: assistant
 *                     content: "Vous avez reçu 12 commandes aujourd'hui."
 *                     structuredResponse:
 *                       type: kpi
 *                       title: "Commandes aujourd'hui"
 *                       summary: "Vous avez reçu 12 commandes aujourd'hui."
 *                       data:
 *                         items:
 *                           - label: "Commandes"
 *                             value: 12
 *                             unit: commandes
 *                       actions: []
 *                     createdAt: "2025-01-15T10:30:05.000Z"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Boutique not found
 *       500:
 *         description: Internal server error
 */
router.get('/history', protect, authorize('boutique'), chatController.getHistory);

/**
 * @swagger
 * /api/chat/history:
 *   delete:
 *     summary: Clear conversation history
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     description: Clears all messages from the current session. Used for "New conversation" feature.
 *     responses:
 *       200:
 *         description: Conversation cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Conversation cleared."
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Boutique not found
 *       500:
 *         description: Internal server error
 */
router.delete('/history', protect, authorize('boutique'), chatController.clearHistory);

module.exports = router;