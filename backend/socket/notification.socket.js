const { Server } = require('socket.io');

let io;

/**
 * Initialize Socket.IO
 * Must be called once, after HTTP server is created
 */
function initSocket(server) {
    io = new Server(server, {
        cors: {
            origin: '*', // adapte si besoin
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        try {
            const userId = socket.handshake.auth?.userId;

            if (!userId) {
                socket.disconnect(true);
                return;
            }

            // Each user joins their own private room
            socket.join(userId.toString());

            socket.on('disconnect', () => {
                // optional logging
            });

        } catch (err) {
            socket.disconnect(true);
        }
    });

    return io;
}

/**
 * Get Socket.IO instance
 * Used inside services (NotificationService, etc.)
 */
function getIO() {
    if (!io) {
        throw new Error('Socket.IO not initialized');
    }
    return io;
}

module.exports = {
    initSocket,
    getIO,
    io: new Proxy({}, {
        get(_, prop) {
            if (!io) {
                throw new Error('Socket.IO not initialized');
            }
            return io[prop];
        }
    })
};
