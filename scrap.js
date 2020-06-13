const pptr = require('puppeteer');

module.exports = async function scrap(url, match = [], lenght, offset = 2) {
    try {
        // scrapper for currency rates //
        const browser = await pptr.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle0' });
        const html = await page.evaluate(() => document.querySelector('*').outerHTML);
        // console.log(html);

        let data = new Array();
        Array.prototype.forEach.call(match, (m) => {
            data.push(html.substr(html.search(m) + m.length + offset, lenght));
        });
        await browser.close();

        return data;
    } catch (err) {
        console.log('ERROR from SCRAP() function', err);
    }
};
