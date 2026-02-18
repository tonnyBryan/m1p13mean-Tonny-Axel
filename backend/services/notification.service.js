const Notification = require('../models/Notification');
const { getIO } = require('../socket');

exports.sendNotification = async ({
                                      recipient,
                                      channel,
                                      type,
                                      title,
                                      message,
                                      payload = {},
                                      url
                                  }) => {
    try {
        const notification = await Notification.create({
            recipient,
            channel,
            type,
            title,
            message,
            payload,
            url
        });

        // 2️⃣ Envoi temps réel (Socket)
        try {
            const io = getIO();
            io.to(`user:${recipient}`).emit('notification', notification);
        } catch (socketErr) {
            // SILENCE MODE
            console.warn('Socket notification failed');
        }

        return notification;
    } catch (err) {
        // AUCUN throw
        console.error('Notification service error:', err.message);
    }
};
