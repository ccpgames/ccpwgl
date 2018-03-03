export const util = {};

/**
 * Assigns property values if they exist in a source object
 * @param {*} dest
 * @param {*} src
 * @param attr
 */
util.assignIfExists = function (dest, src, attr)
{
    if (src && src[attr] !== undefined)
    {
        dest[attr] = src[attr];
    }
};

/**
 * Generates an id
 * @type {?Function}
 */
util.generateID = util.generateObjectID;

/**
 * Generates an object id
 * @returns {number}
 */
util.generateObjectID = (function ()
{
    let OBJECT_COUNT = 0;

    return function generateID()
    {
        return OBJECT_COUNT++;
    };
})();

/**
 * Generates a UUID
 * @author Three.js
 * @returns {string}
 */
util.generateUUID = (function ()
{
    const lut = [];
    for (let i = 0; i < 256; i++)
    {
        lut[i] = (i < 16 ? '0' : '') + (i).toString(16).toUpperCase();
    }

    return function generateUUID()
    {
        const
            d0 = Math.random() * 0xffffffff | 0,
            d1 = Math.random() * 0xffffffff | 0,
            d2 = Math.random() * 0xffffffff | 0,
            d3 = Math.random() * 0xffffffff | 0;

        return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + '-' +
            lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' + lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' +
            lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] +
            lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff];
    };
})();

/**
 * Gets a source's property value if it exists else returns a default value
 * @param {*} src
 * @param {string} prop
 * @param {*} defaultValue
 * @returns {*}
 */
util.get = function (src, prop, defaultValue)
{
    return src && prop in src ? src[prop] : defaultValue;
};

/**
 * Checks if a value is an array
 * @param {*} a
 * @returns {boolean}
 */
util.isArray = Array.isArray;

/**
 * Checks if a value is array like
 * @param {*} a
 * @returns {boolean}
 */
util.isArrayLike = function (a)
{
    return (a && util.isArray(a) || util.isTyped(a));
};

/**
 * Checks if a value is a vector
 * @param {*} a
 * @returns {boolean}
 */
util.isVector = function (a)
{
    if (a)
    {
        if (util.isTyped(a))
        {
            return true;
        }

        if (util.isArray(a))
        {
            for (let i = 0; i < a.length; i++)
            {
                if (typeof a[i] !== 'number') return false;
            }
            return true;
        }
    }
    return false;
};

/**
 * Checks if a value is a typed array
 * @param {*} a
 * @returns {boolean}
 */
util.isTyped = function (a)
{
    return (a && a.buffer instanceof ArrayBuffer && a.BYTES_PER_ELEMENT);
};

/**
 * Calls a function with arguments for each child in an array where that function exists
 * @param {Array} arr
 * @param {string} func
 * @param args
 */
util.perArrayChild = function (arr, func, ...args)
{
    const len = arr.length;
    for (let i = 0; i < len; i++)
    {
        if (func in arr) arr[i][func](...args);
    }
};

/**
 * Returns a value if it is an array, or a new array with the object in it
 * @param {*} a
 * @returns {Array}
 */
util.toArray = function (a)
{
    return Array.isArray(a) ? a : [a];
};