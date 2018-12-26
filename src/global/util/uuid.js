/**
 * Identifies if UUIDs should be used for ID generation
 * @type {?boolean}
 */
let USE_UUID = null;

/**
 * Internal object count
 * @type {number}
 */
let OBJECT_COUNT = 0;

/**
 * Stores uuid scratch
 * @type {?Array}
 */
let LUT = null;

/**
 * Generates a UUID
 * @author Three.js
 * @returns {string}
 */
function generateUUID()
{
    const
        d0 = Math.random() * 0xffffffff | 0,
        d1 = Math.random() * 0xffffffff | 0,
        d2 = Math.random() * 0xffffffff | 0,
        d3 = Math.random() * 0xffffffff | 0;

    return LUT[d0 & 0xff] + LUT[d0 >> 8 & 0xff] + LUT[d0 >> 16 & 0xff] + LUT[d0 >> 24 & 0xff] + '-' +
        LUT[d1 & 0xff] + LUT[d1 >> 8 & 0xff] + '-' + LUT[d1 >> 16 & 0x0f | 0x40] + LUT[d1 >> 24 & 0xff] + '-' +
        LUT[d2 & 0x3f | 0x80] + LUT[d2 >> 8 & 0xff] + '-' + LUT[d2 >> 16 & 0xff] + LUT[d2 >> 24 & 0xff] +
        LUT[d3 & 0xff] + LUT[d3 >> 8 & 0xff] + LUT[d3 >> 16 & 0xff] + LUT[d3 >> 24 & 0xff];
}

/**
 * Enables UUID's for ID generation
 * @param {boolean} bool
 * @throws When generateID has already been used and trying to set a different ID type
 */
export function enableUUID(bool)
{
    if (bool === USE_UUID)
    {
        return;
    }

    if (USE_UUID !== null)
    {
        throw new Error('Cannot change id generation type once set');
    }

    if (bool)
    {
        LUT = [];
        for (let i = 0; i < 256; i++)
        {
            LUT[i] = (i < 16 ? '0' : '') + (i).toString(16).toUpperCase();
        }
    }

    USE_UUID = (bool);
}

/**
 * Generates an id
 * - Defaults to Object IDs
 * @returns {string|number}
 */
export function generateID()
{
    if (USE_UUID === null)
    {
        USE_UUID = false;
    }

    return USE_UUID ? generateUUID() : OBJECT_COUNT++;
}
