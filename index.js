const TelegramBot = require('node-telegram-bot-api');
const fetchData = require('./fetchData');
require('dotenv').config();

// BOT CONFIGS
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// GLOBAL VARIABLES
let data = new Array();
// supported currencies must be added here
const cryptoShort = { Bitcoin: 'BTC', Ethereum: 'ETH' };
const currenShort = { US_Dollar: 'USD', Euro: 'EUR', GB_Pound: 'GBP', Rubl: 'RUB' };

// FETCHING INFORAMTION FROM APIs
async function fetch() {
    data = await fetchData();
    console.log('Data Fetched************');
    console.log(data);
}
fetch();

// HELPER FUNCTIONS
function dcf(inObject) {
    // deep copy function
    let outObject, value, key;

    if (typeof inObject !== 'object' || inObject === null) {
        return inObject; // Return the value if inObject is not an object
    }

    // Create an array or object to hold the values
    outObject = Array.isArray(inObject) ? [] : {};

    for (key in inObject) {
        value = inObject[key];

        // Recursively (deep) copy for nested objects, including arrays
        outObject[key] = typeof value === 'object' && value !== null ? dcf(value) : value;
    }

    return outObject;
}

function makeList(crypt, curr, list = data) {
    let response = `${crypt}\n`;

    list.forEach((el) => {
        response += `<b>${el.host.padEnd(15, ' ')}</b>:${el[crypt][curr]} ${curr}`;
        if (el.diff) {
            response += `    <b>${el.diff.percent}%</b>   ${el.diff.value}\n`;
        } else {
            response += '\n';
        }
    });

    return response;
}

function sort(crypt, curr, param = 1) {
    const list = dcf(data);
    list.sort((a, b) => {
        const x = a[crypt][curr];
        const y = b[crypt][curr];
        return x < y ? -param : x > y ? param : 0;
    });
    list.forEach((el, i) => {
        if (i === 0) return;
        list[i].diff = {
            value: Math.round(Math.abs(list[i][crypt][curr] - list[0][crypt][curr]) * 100) / 100,
            percent:
                Math.round((Math.abs(list[i][crypt][curr] - list[0][crypt][curr]) / list[0][crypt][curr]) * 10000) /
                100,
        };
    });

    return [...list];
}

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
        resp = makeList(symbols[1], symbols[2]);
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
        const sortedList = [...sort(symbols[1], symbols[2], symbols[3])];
        resp = makeList(symbols[1], symbols[2], sortedList);
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
                [
                    {
                        text: `USD`,
                        callback_data: `2_${symbols[1]}_USD_0`,
                    },
                    {
                        text: `EUR`,
                        callback_data: `2_${symbols[1]}_EUR_0`,
                    },
                    {
                        text: `GBP`,
                        callback_data: `2_${symbols[1]}_GBP_0`,
                    },
                    {
                        text: `RUB`,
                        callback_data: `2_${symbols[1]}_RUB_0`,
                    },
                ],
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
