import {isArray} from './type';

/**
 * Adds arguments to an array if they don't already exist in it
 * @param {Array} arr
 * @param args
 * @returns {boolean} true if something was added
 */
export function addToArray(arr, ...args)
{
    let added = false;
    for (let i = 0; i < args.length; i++)
    {
        if (arr.indexOf(args[i]) === -1)
        {
            arr.push(args[i]);
            added = true;
        }
    }
    return added;
}

/**
 * Calls a function with arguments for each child in an array where that function exists
 * @param {Array} arr
 * @param {string} func
 * @param args
 */
export function perArrayChild(arr, func, ...args)
{
    const len = arr.length;
    for (let i = 0; i < len; i++)
    {
        if (func in arr) arr[i][func](...args);
    }
}

/**
 * Removes arguments from an array if they exist in it
 * @param {Array} arr
 * @param args
 * @returns {boolean} true if something was removed
 */
export function removeFromArray(arr, ...args)
{
    let removed = false;
    for (let i = 0; i < args.length; i++)
    {
        const index = arr.indexOf(args[i]);
        if (index !== -1)
        {
            arr.splice(index, 1);
            removed = true;
        }
    }
    return removed;
}

/**
 * Returns a value if it is an array, or a new array with the object in it
 * @param {*} a
 * @returns {Array}
 */
export function toArray(a)
{
    return isArray(a) ? a : [a];
}

/**
 * Returns an array containing only unique numbers
 * @param {*} a
 * @returns {Array}
 */
export function toUniqueArray(a)
{
    return Array.from(new Set(toArray(a)));
}