const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();

const bot = require('./index');

// SERVER
const app = express();
app.use(bodyParser());
app.get('/', (req, res) => {
    console.log(`ENDPOINT / accepted request at ${new Date().getUTCDate}`);

    res.status(200).json({
        status: 'success',
        message: 'U hit / endpoint',
    });
});
app.post(`/${process.env.BOT_TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

const port = process.env.PORT || 3030;
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});

// DATABASE
const DB = process.env.MONGODB_KEY.replace('<password>', process.env.MONGODB_PASS);
mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true, //required to avoid warning in console
    })
    .then(() => console.log('DB connection successful'));

//
// keep heroku server alive
async function keepAlive() {
    await axios.get('https://rcryptosbot.herokuapp.com/test');
}
setInterval(keepAlive, 25 * 60 * 1000);
