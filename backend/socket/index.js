const { Server } = require('socket.io');

let io = null;

function initSocket(server) {
    io = new Server(server, {
        cors: {
            origin: '*', // à restreindre en prod
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log('Socket connected:', socket.id);

        socket.on('join', ({ userId }) => {
            if (userId) {
                socket.join(`user:${userId}`);
                console.log(`User ${userId} joined room`);
            }
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected:', socket.id);
        });
    });
}

function getIO() {
    if (!io) throw new Error('Socket not initialized');
    return io;
}

module.exports = {
    initSocket,
    getIO
};
