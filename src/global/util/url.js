
const
    url = {},
    query = window.location.search.substring(1),
    split = query.split('&');

for (let i = 0; i < split.length; i++)
{
    const
        result = split[i].split('='),
        key = result[0].toLowerCase(),
        value = unescape(result[1]);

    if (key)
    {
        let v = value.toLowerCase();
        url[key] = v === 'true' ? true : v === 'false' ? false : value;
    }
}

/**
 * Gets the url as an object
 * @returns {*}
 */
export function getURL()
{
    return Object.assign({}, url);
}

/**
 * Gets a string from the url, returning a default value if not found
 * @param {string} key
 * @param {string} defaultValue
 * @returns {string}
 */
export function getURLString(key, defaultValue)
{
    key = key.toLowerCase();
    return key in url ? url[key] : defaultValue;
}

/**
 * Gets an integer from the url, returning a default value if not found
 * @param {string} key
 * @param {number} defaultValue
 * @returns {number}
 */
export function getURLInteger(key, defaultValue)
{
    key = key.toLowerCase();
    return key in url ? parseInt(url[key], 10) : defaultValue;
}

/**
 * Gets a float from the url, returning a default value if not found
 * @param {string} key
 * @param {number} defaultValue
 * @returns {number}
 */
export function getURLFloat(key, defaultValue)
{
    key = key.toLowerCase();
    return key in url ? parseFloat(url[key]) : defaultValue;
}

/**
 * Gets a boolean from the url, returning a default value if not found
 * @param {string} key
 * @param {boolean} defaultValue
 * @returns {boolean}
 */
export function getURLBoolean(key, defaultValue)
{
    key = key.toLowerCase();
    return key in url ? url[key] : defaultValue;
}