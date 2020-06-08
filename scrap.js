const axios = require('axios');
const cheerio = require('cheerio');

async function scrap() {
    const url = 'https://www.widgets.investing.com/live-currency-cross-rates?theme=darkTheme&pairs=2124,2126,2138,2186';
    const resp = (await axios.get(url)).data;

    let data = []; // base USD, 0 - EUR 1 - GBP 2 - IDR 3 - RUB
    const indexes = [2124, 2126, 2138, 2186]; // from url
    for (let i = 0; i < 4; i++) {
        data.push(resp.substr(resp.search(`pid-${indexes[i]}-last`) + 15, 6).replace(',', ''));
    }
    console.log(data);
}
scrap();
