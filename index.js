const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

const Db = require('./model');
const fetchData = require('./fetchData');
const utils = require('./utils');

// BOT
let bot;
if (process.env.NODE_ENV === 'production') {
    bot = new TelegramBot(process.env.BOT_TOKEN);
    bot.setWebHook(`${process.env.BOT_WEBHOOK_URL}${process.env.BOT_TOKEN}`);
} else {
    bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
}

// GLOBAL VARIABLES
let data = new Array();
// supported currencies must be added here
const cryptoShort = { Bitcoin: 'BTC', Ethereum: 'ETH' };
const currenShort = { US_Dollar: 'USD', Euro: 'EUR', GB_Pound: 'GBP', Rubl: 'RUB', Indonesian_R: 'IDR' };
const hostsAll = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
// const hostsAll = [0, 1, 2, 3];

// FETCHING INFORAMTION FROM APIs
async function fetch() {
    data = await fetchData();
    console.log('Data Fetched************');
    console.log(data);
}
fetch();

// SENDERS
function sendError(text, msg) {
    bot.sendMessage(msg.chat.id, text, {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Ok',
                        callback_data: `deleteMe`,
                    },
                ],
            ],
        },
    });
}
function sendList(cb, symbols, isSort = false) {
    let hosts = symbols[1].split('-');
    hosts.pop();
    const list = utils.filterByIndex(hosts, data);

    // Testing whether query is valid (contains valid currencies)
    if (!Object.values(cryptoShort).includes(symbols[2]) || !Object.values(currenShort).includes(symbols[3])) {
        console.log(`ERROR. Invalid symbols recieved: ${symbols[2]}, ${symbols[3]} `);
        bot.sendMessage(cb.message.chat.id, 'Invalid currencies were entered!');
        return;
    }

    // should list be sorted
    let inKey, resp;
    if (!isSort) {
        // console.log(list);
        resp = utils.makeList(symbols[2], symbols[3], list);
        inKey = {
            inline_keyboard: [
                [
                    {
                        text: 'Sort (ascending)',
                        callback_data: `3_${symbols[1]}_${symbols[2]}_${symbols[3]}_1`, // last number shows sorting parametres
                    },
                    {
                        text: 'Sort (descending)',
                        callback_data: `3_${symbols[1]}_${symbols[2]}_${symbols[3]}_-1`,
                    },
                ],
                [
                    {
                        text: 'Back',
                        callback_data: `-3_${symbols[1]}_${symbols[2]}`,
                    },
                ],
            ],
        };
    } else {
        const sortedList = [...utils.sort(symbols[2], symbols[3], symbols[4], list)];
        resp = utils.makeList(symbols[2], symbols[3], sortedList);
        inKey = {
            inline_keyboard: [
                [
                    {
                        text: 'Back',
                        callback_data: `-4_${symbols[1]}_${symbols[2]}_${symbols[3]}`,
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
    let text = `${symbols[2]}\n\n`,
        hosts = symbols[1].split('-');
    hosts.pop();
    hosts.forEach((el) => {
        if (hosts.length !== hostsAll.length) text += `${data[el].host}\n`;
    });

    bot.editMessageText(`${text}\nChoose currency`, {
        chat_id: cb.message.chat.id,
        message_id: cb.message.message_id,
        reply_markup: {
            inline_keyboard: [
                Object.values(currenShort).map((el) => {
                    return { text: el, callback_data: `2_${symbols[1]}_${symbols[2]}_${el}_0` };
                }),

                [
                    {
                        text: 'Back',
                        callback_data: `-2_${symbols[1]}_${symbols[2]}`,
                    },
                ],
            ],
        },
    });
}

function sendCryptoMenu(msg, isNew = false, symbols = false) {
    let inKey,
        resp = 'Choose crypto currency\n\n',
        cbAdd = '';

    hostsAll.forEach((el) => {
        cbAdd += `${el}-`;
    });

    if (symbols) {
        hosts = symbols[1].split('-');
        hosts.pop();
        hosts.forEach((el) => {
            if (hosts.length !== hostsAll.length) resp += `${data[el].host}\n`;
        });
        cbAdd = symbols[1];
    }

    inKey = {
        inline_keyboard: [
            [
                {
                    text: `Bitcoin`,
                    callback_data: `1_${cbAdd}_BTC`,
                },
                {
                    text: `Ethereum`,
                    callback_data: `1_${cbAdd}_ETH`,
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
    const names = msg.text.split(' ');
    names.shift();
    let invalidNames = new Array(),
        hosts = new Array();
    hosts[1] = '';

    names.forEach((name, i) => {
        let isFound = false;
        data.forEach((el, j) => {
            if (name === el.host) {
                hosts[1] += `${j}-`;
                isFound = true;
            }
        });
        if (!isFound) invalidNames.push(i);
    });

    // Sends error message if any of names in incorrect
    if (invalidNames.length > 0) {
        let resp = 'Invalid names:\n';
        invalidNames.forEach((el) => {
            resp += `${names[el]}\n`;
        });
        sendError(resp, msg);
    } else {
        sendCryptoMenu(msg, true, hosts);
    }
});
bot.onText(/\/help/, (msg) => {
    text =
        '/data - get menu with all platforms\n' +
        '/compare - get menu with specified platforms (use as /compare platform1 platform2...)\n';

    sendError(text, msg);
});

bot.on('callback_query', (cb) => {
    const symbols = cb.data.split('_');
    bot.answerCallbackQuery(cb.id);

    // symbol[0] represents level of menu, every callback query sends its level of menu
    // if symbol[0] is positive number, GO to NEXT level of menu
    // if symbol[0] is negative number, RETURN to PREVIOUS level of menu
    switch (symbols[0]) {
        case '-2':
            sendCryptoMenu(cb.message, false, symbols);
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
        case 'deleteMe':
            bot.deleteMessage(cb.message.chat.id, cb.message.message_id);
            break;
    }
});

module.exports = bot;
