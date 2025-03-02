// server.js
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

require('dotenv').config();
const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');
const Message = require('./models/Messages');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

if (!process.env.MONGODB_URI || !process.env.CLERK_FRONTEND_API_KEY) {
    console.error("Missing environment variables! Check .env file.");
    process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected successfully"))
.catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/config.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(`const CLERK_FRONTEND_API_KEY = "${process.env.CLERK_FRONTEND_API_KEY}";`);
});

io.on('connection', socket => {
    socket.on('joinRoom', async ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);

        const messages = await Message.find({ room }).sort({ time: 1 });
        socket.emit('loadMessages', messages);
        socket.emit('message', formatMessage("Bot", 'Welcome to ChatCord'));
        socket.broadcast.to(user.room).emit('message', formatMessage("Bot", `${user.username} has joined the chat`));
    });

    socket.on('chatMessage', async (msg) => {
        const user = getCurrentUser(socket.id);
        if (user) {
            const messageData = formatMessage(user.username, msg);
            const message = new Message({ username: user.username, room: user.room, text: messageData.text, time: messageData.time });
            await message.save();
            io.to(user.room).emit('message', messageData);
        }
    });

    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        if (user) {
            io.to(user.room).emit('message', formatMessage("Bot", `${user.username} has left the chat`));
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
