import {isTyped, isArrayLike} from './type';
import {toArray} from './arr';

/**
 * Assigns property values if they exist in a source object
 * - Typed arrays are cloned/ copied to ensure no pass-by-reference errors
 *
 * @param {*} dest
 * @param {*} src
 * @param {string|string[]} attrs
 */
export function assignIfExists(dest, src, attrs)
{
    if (!src) return;

    attrs = toArray(attrs);
    for (let i = 0; i < attrs.length; i++)
    {
        const attr = attrs[i];
        if (src[attr] !== undefined)
        {
            if (isArrayLike(dest[attr]))
            {
                if (isTyped(dest[attr]))
                {
                    if (dest[attr].length !== src[attr].length)
                    {
                        const Constructor = dest[attr].constructor;
                        dest[attr] = new Constructor(src[attr]);
                    }
                    else
                    {
                        dest[attr].set(src[attr]);
                    }
                }
                else
                {
                    dest[attr] = dest[attr].splice(dest[attr].length, 0);
                    for (let i = 0; i < src[attr].length; i++)
                    {
                        dest[attr].push(src[attr][i]);
                    }
                }
            }
            else if (isTyped(src[attr]))
            {
                const Constructor = src[attr].constructor;
                dest[attr] = new Constructor(src[attr]);
            }
            else
            {
                dest[attr] = src[attr];
            }
        }
    }
}

/**
 * Gets a source's property value if it exists else returns a default value
 * @param {*} src
 * @param {string} prop
 * @param {*} defaultValue
 * @returns {*}
 */
export function get(src, prop, defaultValue)
{
    return src && prop in src ? src[prop] : defaultValue;
}
