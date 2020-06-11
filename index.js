const express = require('express');
const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const { table } = require('table');
require('dotenv').config();

const Db = require('./model');
const fetchData = require('./fetchData');
const utils = require('./utils');

// SERVER
const app = express();
app.get('/', (req, res) => {
    console.log(`ENDPOINT / accepted request at ${new Date().getUTCDate}`);

    res.status(200).json({
        status: 'success',
        message: 'U hit / endpoint',
    });
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

// BOT
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// GLOBAL VARIABLES
let data = new Array();
// supported currencies must be added here
const cryptoShort = { Bitcoin: 'BTC', Ethereum: 'ETH' };
const currenShort = { US_Dollar: 'USD', Euro: 'EUR', GB_Pound: 'GBP', Rubl: 'RUB', Indonesian_R: 'IDR' };

// FETCHING INFORAMTION FROM APIs
async function fetch() {
    data = await fetchData();
    console.log('Data Fetched************');
    console.log(data);
}
fetch();

// HELPER FUNCTIONS
// keep heroku server alive
async function keepAlive() {
    await axios.get('https://rcryptosbot.herokuapp.com/test');
}
setInterval(keepAlive, 25 * 60 * 1000);

// SENDERS
function sendList(cb, symbols, isSort = false) {
    // Testing whether query is valid (contains valid currencies)
    if (!Object.values(cryptoShort).includes(symbols[1]) || !Object.values(currenShort).includes(symbols[2])) {
        console.log(`ERROR. Invalid symbols recieved: ${symbols[1]}, ${symbols[2]} `);
        bot.sendMessage(cb.message.chat.id, 'Invalid currencies were entered!');
        return;
    }

    // should list be sorted
    let inKey, resp;
    if (!isSort) {
        resp = utils.makeList(symbols[1], symbols[2], data);
        inKey = {
            inline_keyboard: [
                [
                    {
                        text: 'Sort (ascending)',
                        callback_data: `3_${symbols[1]}_${symbols[2]}_1`, // last number shows sorting parametres
                    },
                    {
                        text: 'Sort (descending)',
                        callback_data: `3_${symbols[1]}_${symbols[2]}_-1`,
                    },
                ],
                [
                    {
                        text: 'Back',
                        callback_data: `-3_${symbols[1]}`,
                    },
                ],
            ],
        };
    } else {
        const sortedList = [...utils.sort(symbols[1], symbols[2], symbols[3], data)];
        resp = utils.makeList(symbols[1], symbols[2], sortedList);
        inKey = {
            inline_keyboard: [
                [
                    {
                        text: 'Back',
                        callback_data: `-4_${symbols[1]}_${symbols[2]}`,
                    },
                ],
            ],
        };
    }

    bot.editMessageText(resp, {
        chat_id: cb.message.chat.id,
        message_id: cb.message.message_id,
        reply_markup: inKey,
        parse_mode: 'HTML',
    });
}

function sendCurrenMenu(cb, symbols) {
    bot.editMessageText(`${symbols[1]}\nChoose currency`, {
        chat_id: cb.message.chat.id,
        message_id: cb.message.message_id,
        reply_markup: {
            inline_keyboard: [
                Object.values(currenShort).map((el) => {
                    return { text: el, callback_data: `2_${symbols[1]}_${el}_0` };
                }),

                [
                    {
                        text: 'Back',
                        callback_data: `-2_${symbols[1]}`,
                    },
                ],
            ],
        },
    });
}

function sendCryptoMenu(msg, isNew = false) {
    const resp = 'Choose crypto currency';
    const inKey = {
        inline_keyboard: [
            [
                {
                    text: `Bitcoin`,
                    callback_data: `1_BTC`,
                },
                {
                    text: `Ethereum`,
                    callback_data: `1_ETH`,
                },
            ],
        ],
    };
    if (isNew) {
        // /data command case
        bot.sendMessage(msg.chat.id, resp, {
            reply_markup: inKey,
        });
    } else {
        // for other cases
        bot.editMessageText(resp, {
            chat_id: msg.chat.id,
            message_id: msg.message_id,
            reply_markup: inKey,
        });
    }
}

// REQUEST, RESPONSE
bot.onText(/^(\/data|\/start)/, (msg) => {
    sendCryptoMenu(msg, true);
});
bot.onText(/\/compare/, (msg) => {
    // const names = msg.text.split(' ');
    // names.shift();
    // const filtered = filterByName(names);
    // const sorted = sort()
});

bot.on('callback_query', (cb) => {
    const symbols = cb.data.split('_');
    // console.log(cb);
    bot.answerCallbackQuery(cb.id);

    // symbol[0] represents level of menu, every callback query sends its level of menu
    // if symbol[0] is positive number, GO to NEXT level of menu
    // if symbol[0] is negative number, RETURN to PREVIOUS level of menu
    switch (symbols[0]) {
        case '-2':
            sendCryptoMenu(cb.message);
            break;
        case '1':
        case '-3':
            sendCurrenMenu(cb, symbols);
            break;
        case '2':
        case '-4':
            sendList(cb, symbols); // Unsorted list
            break;
        case '3':
            sendList(cb, symbols, true); // Sorted list
            break;
    }
});
