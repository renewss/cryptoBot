const { table } = require('table');

// deep copy function
function dcf(inObject) {
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

// Make table foramatted string
exports.makeList = function makeList(crypt, curr, data) {
    let response = new Array();

    data.forEach((el, i) => {
        if (el[crypt][curr] != 0 && el[crypt][curr] != Infinity && typeof el[crypt][curr] === 'number') {
            response.push([`${el.host}`, `${el[crypt][curr]} ${curr}`]);
            if (el.diff) {
                response[response.length - 1].push(`${el.diff.percent}%`, `${el.diff.value} ${curr}`);
            }
        }
    });

    const out = `<pre>${table(response)}</pre>`;

    return out;
};

//
exports.filterByName = function filterByName(names, data) {
    console.log(names);
    let list = new Array();
    names.forEach((name) => {
        list.push(data.find((el) => el.host === name));
    });
    return list;
};

// Sort list in either ascending or descending order
exports.sort = function sort(crypt, curr, param = 1, data) {
    const list = dcf(
        data.filter((el) => el[crypt][curr] != 0 && el[crypt][curr] != Infinity && typeof el[crypt][curr] === 'number')
    );

    list.sort((a, b) => {
        const x = a[crypt][curr];
        const y = b[crypt][curr];
        return x < y ? -param : x > y ? param : 0;
    });
    list.forEach((el, i) => {
        list[i].diff = {
            value: Math.round((list[i][crypt][curr] - list[0][crypt][curr]) * 100) / 100,
            percent: Math.round(((list[i][crypt][curr] - list[0][crypt][curr]) / list[0][crypt][curr]) * 10000) / 100,
        };
    });

    return list;
};
