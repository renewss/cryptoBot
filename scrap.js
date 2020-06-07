const axios = require('axios');
const cheerio = require('cheerio');

async function fetch() {
    const url = 'https://bitzlato.com/p2p?currency=USD';
    const resp = await axios.get(url);

    const $ = cheerio.load(resp.data);
    $('div.jss161').each((i, el) => {
        $(el)
            .find('div.jss167')
            .each((i, elem) => {
                const data = $(elem).find('jss158');
                console.log(data);
            });
    });
}
fetch();
