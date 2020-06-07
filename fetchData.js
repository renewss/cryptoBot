const axios = require('axios');
const xml2json = require('xml2json');

// to handle exceptions locally for every axios request
async function axiosWrp(url, params = {}) {
    try {
        return await axios.get(url, params);
    } catch (err) {
        console.log('Error from FETCHING *******************', err);
    }
}

function format(rate) {
    return Math.round(rate * 100) / 100;
}

// Fetcher, cases are written for every API
module.exports = async function fetchData() {
    try {
        const now = new Date();
        const date = {
            day: now.getDate() > 9 ? now.getDate() : `0${now.getDate()}`,
            month: now.getMonth() + 1 > 9 ? now.getMonth() + 1 : `0${now.getMonth() + 1}`,
            year: now.getFullYear(),
        };
        // Getting currency rates
        const xml = (
            await axiosWrp(
                `http://www.cbr.ru/scripts/XML_daily.asp?date_req=${date.day}/${date.month}/${date.year}&VAL_NM_RQ=R01235`
            )
        ).data;
        const currenRates = xml2json.toJson(xml, { object: true }).ValCurs.Valute; // base RUB
        /* 0 - AUD - Australia
           2 - GBP
           10 - USD
           11 - EUR
           14 - CAD - Canada
           27 - UAH - Ukraine
         */

        const cryptoRates = (await axiosWrp('https://api-pub.bitfinex.com/v2/tickers?symbols=tETHBTC')).data[0][7]; // ETH to BTC

        // *******************************************
        let content = new Array();
        let reqTemp; // variable for temporarily storing request data

        reqTemp = (await axiosWrp('https://api.coindesk.com/v1/bpi/currentprice.json')).data;
        content[0] = {
            host: 'Coindesk',
            BTC: {
                USD: format(reqTemp.bpi.USD.rate.replace(',', '')),
                EUR: format(reqTemp.bpi.EUR.rate.replace(',', '')),
                GBP: format(reqTemp.bpi.GBP.rate.replace(',', '')),
                RUB: format(reqTemp.bpi.USD.rate.replace(',', '') * currenRates[10].Value.replace(',', '.')),
            },
            ETH: {
                USD: format(reqTemp.bpi.USD.rate.replace(',', '') * cryptoRates),
                EUR: format(reqTemp.bpi.EUR.rate.replace(',', '') * cryptoRates),
                GBP: format(reqTemp.bpi.GBP.rate.replace(',', '') * cryptoRates),
                RUB: format(
                    reqTemp.bpi.USD.rate.replace(',', '') * currenRates[10].Value.replace(',', '.') * cryptoRates
                ),
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
            },
            ETH: {
                USD: format(reqTemp[12].lastPrice),
                EUR: format(reqTemp[696].lastPrice),
                GBP: format(reqTemp[12].lastPrice / reqTemp[572].lastPrice),
                RUB: format(reqTemp[673].lastPrice),
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
            },
            ETH: {
                USD: format(reqTemp.USD.avg_1h / reqTemp.ETH.rates.last),
                EUR: format(reqTemp.EUR.avg_1h / reqTemp.ETH.rates.last),
                GBP: format(reqTemp.GBP.avg_1h / reqTemp.ETH.rates.last),
                RUB: format(reqTemp.RUB.avg_1h / reqTemp.ETH.rates.last),
            },
        };

        reqTemp = (await axiosWrp('https://garantex.io/api/v2/trades?market=btcrub#')).data;
        content[3] = {
            host: 'Garantex',
            BTC: {
                USD: format(reqTemp[0].price / currenRates[10].Value.replace(',', '.')),
                EUR: format(reqTemp[0].price / currenRates[11].Value.replace(',', '.')),
                GBP: format(reqTemp[0].price / currenRates[2].Value.replace(',', '.')),
                RUB: format(reqTemp[0].price),
            },
            ETH: {
                USD: format((reqTemp[0].price / currenRates[10].Value.replace(',', '.')) * cryptoRates),
                EUR: format((reqTemp[0].price / currenRates[11].Value.replace(',', '.')) * cryptoRates),
                GBP: format((reqTemp[0].price / currenRates[2].Value.replace(',', '.')) * cryptoRates),
                RUB: format(reqTemp[0].price * cryptoRates),
            },
        };
        return content;
    } catch (err) {
        console.log('Error from FETCHING *******************', err);
    }
};
