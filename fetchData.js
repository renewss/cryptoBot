const axios = require('axios');
const scrap = require('./scrap');

// to handle exceptions locally for every axios request
async function axiosWrp(url, params = {}) {
    try {
        return await axios.get(url, params);
    } catch (err) {
        console.log('Error from AXIOSWRP() function *******************', err);
    }
}

function format(rate) {
    return Math.round(rate * 100) / 100;
}

// Fetcher, cases are written for every API
module.exports = async function fetchData() {
    try {
        // scrapper for currency rates
        const urlCurrenRates =
            'https://www.widgets.investing.com/live-currency-cross-rates?theme=darkTheme&pairs=2124,2126,2138,2186';
        const indexes = ['pid-2124-last', 'pid-2126-last', 'pid-2138-last', 'pid-2186-last']; // from url
        let currenRates = (await scrap(urlCurrenRates, indexes, 6)).map((el) => el.replace(',', '')); // base USD, 0 - EUR 1 - GBP 2 - IDR 3 - RUB
        console.log(currenRates);

        // cyrpto rate,   ETH to BTC
        const cryptoRates = (await axiosWrp('https://api-pub.bitfinex.com/v2/tickers?symbols=tETHBTC')).data[0][7];

        // *******************************************
        let content = new Array();
        let reqTemp, // variable for temporarily storing request data
            storeTemp = {};

        reqTemp = (await axiosWrp('https://api.coindesk.com/v1/bpi/currentprice.json')).data;
        content[0] = {
            host: 'Coindesk',
            BTC: {
                USD: format(reqTemp.bpi.USD.rate.replace(',', '')),
                EUR: format(reqTemp.bpi.EUR.rate.replace(',', '')),
                GBP: format(reqTemp.bpi.GBP.rate.replace(',', '')),
                RUB: format(reqTemp.bpi.USD.rate.replace(',', '') * currenRates[3]),
                IDR: format(reqTemp.bpi.USD.rate.replace(',', '') * currenRates[2]),
            },
            ETH: {
                USD: format(reqTemp.bpi.USD.rate.replace(',', '') * cryptoRates),
                EUR: format(reqTemp.bpi.EUR.rate.replace(',', '') * cryptoRates),
                GBP: format(reqTemp.bpi.GBP.rate.replace(',', '') * cryptoRates),
                RUB: format(reqTemp.bpi.USD.rate.replace(',', '') * currenRates[3] * cryptoRates),
                IDR: format(reqTemp.bpi.USD.rate.replace(',', '') * currenRates[2] * cryptoRates),
            },
        };
        reqTemp = (await axiosWrp('https://api.binance.com/api/v3/ticker/24hr')).data;
        content[1] = {
            host: 'Binance',
            BTC: {
                USD: format(reqTemp[11].lastPrice),
                EUR: format(reqTemp[695].lastPrice),
                GBP: format(reqTemp[11].lastPrice / reqTemp[572].lastPrice),
                RUB: format(reqTemp[672].lastPrice),
                IDR: format(reqTemp[786].lastPrice),
            },
            ETH: {
                USD: format(reqTemp[12].lastPrice),
                EUR: format(reqTemp[696].lastPrice),
                GBP: format(reqTemp[12].lastPrice / reqTemp[572].lastPrice),
                RUB: format(reqTemp[673].lastPrice),
                IDR: format(reqTemp[12].lastPrice * reqTemp[788].lastPrice),
            },
        };

        reqTemp = (await axiosWrp('https://localbitcoins.com//bitcoinaverage/ticker-all-currencies/#')).data;
        content[2] = {
            host: 'LocalBitcoins',
            BTC: {
                USD: format(reqTemp.USD.avg_1h),
                EUR: format(reqTemp.EUR.avg_1h),
                GBP: format(reqTemp.GBP.avg_1h),
                RUB: format(reqTemp.RUB.avg_1h),
                IDR: format(reqTemp.IDR.rates.last),
            },
            ETH: {
                USD: format(reqTemp.USD.avg_1h / reqTemp.ETH.rates.last),
                EUR: format(reqTemp.EUR.avg_1h / reqTemp.ETH.rates.last),
                GBP: format(reqTemp.GBP.avg_1h / reqTemp.ETH.rates.last),
                RUB: format(reqTemp.RUB.avg_1h / reqTemp.ETH.rates.last),
                IDR: format(reqTemp.IDR.rates.last / reqTemp.ETH.rates.last),
            },
        };

        reqTemp = (await axiosWrp('https://garantex.io/api/v2/trades?market=btcrub#')).data;
        content[3] = {
            host: 'Garantex',
            BTC: {
                USD: format(reqTemp[0].price / currenRates[3]),
                EUR: format((reqTemp[0].price / currenRates[3]) * currenRates[0]),
                GBP: format((reqTemp[0].price / currenRates[3]) * currenRates[1]),
                RUB: format(reqTemp[0].price),
                IDR: format((reqTemp[0].price / currenRates[3]) * currenRates[2]),
            },
            ETH: {
                USD: format((reqTemp[0].price / currenRates[3]) * cryptoRates),
                EUR: format((reqTemp[0].price / currenRates[3]) * currenRates[0] * cryptoRates),
                GBP: format((reqTemp[0].price / currenRates[3]) * currenRates[1] * cryptoRates),
                RUB: format(reqTemp[0].price * cryptoRates),
                IDR: format((reqTemp[0].price / currenRates[3]) * currenRates[2] * cryptoRates),
            },
        };

        reqTemp = (await axiosWrp('https://paxful.com/data/average')).data;
        content[4] = {
            host: ' Paxful',
            BTC: {
                USD: format(reqTemp.BTC_USD.avg_1h),
                EUR: format(reqTemp.BTC_EUR.avg_1h),
                GBP: format(reqTemp.BTC_GBP.avg_1h),
                RUB: format(reqTemp.BTC_RUB.avg_1h),
                IDR: format(reqTemp.BTC_IDR.avg_1h),
            },
            ETH: {
                USD: format(reqTemp.BTC_USD.avg_1h * cryptoRates),
                EUR: format(reqTemp.BTC_EUR.avg_1h * cryptoRates),
                GBP: format(reqTemp.BTC_GBP.avg_1h * cryptoRates),
                RUB: format(reqTemp.BTC_RUB.avg_1h * cryptoRates),
                IDR: format(reqTemp.BTC_IDR.avg_1h * cryptoRates),
            },
        };

        reqTemp = (await axiosWrp('https://hodlhodl.com/api/v1/offers')).data;
        let counter = 0;
        for (let i = 0; i < reqTemp.offers.length && counter < 5; i++) {
            const curr = reqTemp.offers[i].currency_code;
            if (curr === 'USD' || curr === 'EUR' || curr === 'RUB' || curr === 'GBP') {
                if (!storeTemp[curr]) {
                    storeTemp[curr] = reqTemp.offers[i].price;
                    ++counter;
                }
            }
        }
        content[5] = {
            host: 'Hodlhodl',
            BTC: {
                USD: format(storeTemp.USD),
                EUR: format(storeTemp.EUR),
                GBP: format(storeTemp.GBP),
                RUB: format(storeTemp.RUB),
                IDR: format(storeTemp.USD * currenRates[2]),
            },
            ETH: {
                USD: format(storeTemp.USD * cryptoRates),
                EUR: format(storeTemp.EUR * cryptoRates),
                GBP: format(storeTemp.GBP * cryptoRates),
                RUB: format(storeTemp.RUB * cryptoRates),
                IDR: format(storeTemp.USD * currenRates[2] * cryptoRates),
            },
        };

        // no API, used web scrapping
        storeTemp = new Array();
        storeTemp = [...(await scrap('https://risex.net/market/all', ['calculator-form-container__block-number'], 6))];
        console.log(storeTemp);
        content[6] = {
            host: 'Risex',
            BTC: {
                USD: format(storeTemp[0] / currenRates[3]),
                EUR: format((storeTemp[0] / currenRates[3]) * currenRates[0]),
                GBP: format((storeTemp[0] / currenRates[3]) * currenRates[1]),
                RUB: format(storeTemp[0]),
                IDR: format((storeTemp[0] / currenRates[3]) * currenRates[2]),
            },
            ETH: {
                USD: format((storeTemp[0] / currenRates[3]) * cryptoRates),
                EUR: format((storeTemp[0] / currenRates[3]) * currenRates[0] * cryptoRates),
                GBP: format((storeTemp[0] / currenRates[3]) * currenRates[1] * cryptoRates),
                RUB: format(storeTemp[0] * cryptoRates),
                IDR: format((storeTemp[0] / currenRates[3]) * currenRates[2] * cryptoRates),
            },
        };

        // no API
        storeTemp = new Array();
        storeTemp = [...(await scrap('https://bitzlato.com/p2p?currency=RUB', ['jss158">Rate, ₽/BTC'], 6, 6))];
        content[7] = {
            host: 'Bitzlato',
            BTC: {
                USD: format(storeTemp[0] / currenRates[3]),
                EUR: format((storeTemp[0] / currenRates[3]) * currenRates[0]),
                GBP: format((storeTemp[0] / currenRates[3]) * currenRates[1]),
                RUB: format(storeTemp[0]),
                IDR: format((storeTemp[0] / currenRates[3]) * currenRates[2]),
            },
            ETH: {
                USD: format((storeTemp[0] / currenRates[3]) * cryptoRates),
                EUR: format((storeTemp[0] / currenRates[3]) * currenRates[0] * cryptoRates),
                GBP: format((storeTemp[0] / currenRates[3]) * currenRates[1] * cryptoRates),
                RUB: format(storeTemp[0] * cryptoRates),
                IDR: format((storeTemp[0] / currenRates[3]) * currenRates[2] * cryptoRates),
            },
        };

        reqTemp = (await axiosWrp('https://api.tokocrypto.com/v1/rates')).data;
        storeTemp = {
            BTC_IDR: reqTemp.data.find((el) => el.currencyPair === 'BTCIDR').buy,
            ETH_IDR: reqTemp.data.find((el) => el.currencyPair === 'ETHIDR').buy,
        };
        content[8] = {
            host: 'Tokocrypto',
            BTC: {
                USD: format(storeTemp.BTC_IDR / currenRates[2]),
                EUR: format((storeTemp.BTC_IDR / currenRates[2]) * currenRates[0]),
                GBP: format((storeTemp.BTC_IDR / currenRates[2]) * currenRates[1]),
                RUB: format((storeTemp.BTC_IDR / currenRates[2]) * currenRates[3]),
                IDR: format(storeTemp.BTC_IDR),
            },
            ETH: {
                USD: format((storeTemp.BTC_IDR / currenRates[2]) * cryptoRates),
                EUR: format((storeTemp.BTC_IDR / currenRates[2]) * currenRates[0] * cryptoRates),
                GBP: format((storeTemp.BTC_IDR / currenRates[2]) * currenRates[1] * cryptoRates),
                RUB: format((storeTemp.BTC_IDR / currenRates[2]) * currenRates[3] * cryptoRates),
                IDR: format(storeTemp.BTC_IDR * cryptoRates),
            },
        };

        return content;
    } catch (err) {
        console.log('Error from FETCH() function *******************', err);
    }
};
