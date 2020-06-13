const mongoose = require('mongoose');

const DbShema = new mongoose.Schema({
    name: {
        type: String,
        enum: ['user', 'password', 'interval'],
        default: 'user',
        required: true,
    },
    value: {
        type: String,
        required: true,
    },
    value2: {
        type: String,
        unique: true,
    },
});

const Db = mongoose.model('db', DbShema);
module.exports = Db;
