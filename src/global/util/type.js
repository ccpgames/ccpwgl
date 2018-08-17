const toString = Object.prototype.toString;

/**
 * Checks if a value is an array
 * @param {*} a
 * @returns {boolean}
 */
export const isArray = Array.isArray;

/**
 * Checks if a value is an array or a typed array
 * @param {*} a
 * @returns {boolean}
 */
export function isArrayLike(a)
{
    return a ? isArray(a) || isTyped(a) : false;
}

/**
 * Checks if a value is a boolean
 * @param {*} a
 * @returns {boolean}
 */
export function isBoolean(a)
{
    return isTag(a, '[object Boolean]');
}

/**
 * Checks if a value is an html canvas element
 * @param {*} a
 * @returns {boolean}
 */
export function isCanvas(a)
{
    return !!(a && a instanceof HTMLCanvasElement);
}

/**
 * Checks if a value is a descriptor
 * @author jay phelps
 * @param {*} a
 * @returns {boolean}
 */
export function isDescriptor(a)
{
    if (!a || !a.hasOwnProperty)
    {
        return false;
    }

    const keys = ['value', 'initializer', 'get', 'set'];

    for (let i = 0, l = keys.length; i < l; i++)
    {
        if (a.hasOwnProperty(keys[i]))
        {
            return true;
        }
    }

    return false;
}

/**
 * Checks if a value is a number
 * @param {*} a
 * @returns {boolean}
 */
export function isNumber(a)
{
    return isTag(a, '[object Number]');
}

/**
 * Checks if a value is a function
 * @param {*} a
 * @returns {boolean}
 */
export function isFunction(a)
{
    return typeof a === 'function';
}

/**
 * Checks if a value is null or undefined
 * @param {*} a
 * @returns {boolean}
 */
export function isNoU(a)
{
    return a == null;
}

/**
 * Checks if a value is null
 * @param {*} a
 * @returns {boolean}
 */
export function isNull(a)
{
    return a === null;
}

/**
 * Checks if a value is an object and not null
 * @param {*} a
 * @returns {boolean}
 */
export function isObject(a)
{
    const type = typeof a;
    return a !== null && (type === 'object' || type === 'function');
}

/**
 * Checks if a value has the type object, and is not null
 * @param {*} a
 * @returns {boolean}
 */
export function isObjectLike(a)
{
    return a !== null && typeof a === 'object';
}

/**
 * Checks if a value is a plain object
 * @author lodash
 * @param {*} a
 * @returns {boolean}
 */
export function isPlain(a)
{
    if (!isObject(a) || !isTag(a, '[object Object]'))
    {
        return false;
    }

    if (Object.getPrototypeOf(a) === null)
    {
        return true;
    }

    let proto = a;
    while (Object.getPrototypeOf(proto) !== null)
    {
        proto = Object.getPrototypeOf(proto);
    }

    return Object.getPrototypeOf(a) === proto;
}

/**
 * Checks if a value is a primary type
 * @param {*} a
 * @returns {boolean}
 */
export function isPrimary(a)
{
    return isBoolean(a) || isNumber(a) || isString(a);
}

/**
 * Checks if a value is a string
 * @param {*} a
 * @returns {boolean}
 */
export function isString(a)
{
    return isTag(a, '[object String]');
}

/**
 * Checks if a value is a symbol
 * @param {*} a
 * @returns {boolean}
 */
export function isSymbol(a)
{
    return typeof a === 'symbol' || isTag(a, '[object Symbol]');
}

/**
 * Checks if a value has a given tag
 * @param {*} a
 * @param {string} tag
 * @returns {boolean}
 */
export function isTag(a, tag)
{
    return toString.call(a) === tag;
}

/**
 * Checks if a value is a typed array
 * @param {*} a
 * @returns {boolean}
 */
export function isTyped(a)
{
    return a ? !!(a.buffer instanceof ArrayBuffer && a.BYTES_PER_ELEMENT) : false;
}

/**
 * Checks if a value is undefined
 * @param {*} a
 * @returns {boolean}
 */
export function isUndefined(a)
{
    return a === undefined;
}

/**
 * Checks if a value is arraylike and only contains numbers
 * @param {*} a
 * @returns {boolean}
 */
export function isVector(a)
{
    if (!a)
    {
        return false;
    }

    if (isTyped(a))
    {
        return true;
    }

    if (isArray(a))
    {
        for (let i = 0; i < a.length; i++)
        {
            if (!isNumber(a[i])) return false;
        }
        return true;
    }
}