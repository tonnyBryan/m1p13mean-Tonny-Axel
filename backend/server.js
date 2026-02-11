const app = require('./app');
const connectDB = require('./config/db');

connectDB().then(() => {
    // init background jobs after DB connected
    try {
        const initExpireDraftsJob = require('./jobs/expireDrafts.job');
        initExpireDraftsJob();
    } catch (err) {
        console.error('Failed to init jobs:', err);
    }
}).catch(err => {
    console.error('DB connection failed:', err);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
