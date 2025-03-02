const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    username: { type: String, required: true },
    room: { type: String, required: true, index: true },
    text: { type: String, required: true },
    time: { type: Date, default: Date.now }
});

// Prevent re-compilation error
const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

module.exports = Message;

