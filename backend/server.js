const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./socket');
const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
initSocket(server);

connectDB()
    .then(() => {
        try {
            const initExpireDraftsJob = require('./jobs/expireDrafts.job');
            initExpireDraftsJob();

            const initCleanExpiredSessionsJob = require('./jobs/cleanExpiredSessions.job');
            initCleanExpiredSessionsJob();
        } catch (err) {
            console.error('Failed to init jobs:', err);
        }
    })
    .catch(err => {
        console.error('DB connection failed:', err);
    });

server.listen(PORT, () => {
    console.log(`🚀 Server + Socket.IO running on port ${PORT}`);
});
