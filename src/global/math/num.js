export const num = {};

/**
 * biCumulative
 *
 * @param {number} t
 * @param {number} order
 * @returns {number}
 */
num.biCumulative = function (t, order)
{
    if (order === 1)
    {
        const some = (1.0 - t);
        return 1.0 - some * some * some;
    }
    else if (order === 2)
    {
        return 3.0 * t * t - 2.0 * t * t * t;
    }
    else
    {
        return t * t * t;
    }
};

/**
 * Converts a Dword to Float
 * @param value
 * @return {Number}
 */
num.dwordToFloat = function (value)
{
    const
        b4 = (value & 0xff),
        b3 = (value & 0xff00) >> 8,
        b2 = (value & 0xff0000) >> 16,
        b1 = (value & 0xff000000) >> 24,
        sign = 1 - (2 * (b1 >> 7)), // sign = bit 0
        exp = (((b1 << 1) & 0xff) | (b2 >> 7)) - 127, // exponent = bits 1..8
        sig = ((b2 & 0x7f) << 16) | (b3 << 8) | b4; // significand = bits 9..31

    if (sig === 0 && exp === -127) return 0.0;
    return sign * (1 + sig * Math.pow(2, -23)) * Math.pow(2, exp);
};

/**
 * Exponential decay
 *
 * @param {number} omega0
 * @param {number} torque
 * @param {number} I - inertia
 * @param {number} d - drag
 * @param {number} time - time
 * @returns {number}
 */
num.exponentialDecay = function (omega0, torque, I, d, time)
{
    return torque * time / d + I * (omega0 * d - torque) / (d * d) * (1.0 - Math.pow(Math.E, -d * time / I));
};

/**
 * Gets a value from a half float
 * @author Babylon
 * @param {number} a
 * @returns {number}
 */
num.fromHalfFloat = function (a)
{
    const
        s = (a & 0x8000) >> 15,
        e = (a & 0x7C00) >> 10,
        f = a & 0x03FF;

    if (e === 0)
    {
        return (s ? -1 : 1) * Math.pow(2, -14) * (f / Math.pow(2, 10));
    }
    else if (e === 0x1F)
    {
        return f ? NaN : ((s ? -1 : 1) * Infinity);
    }

    return (s ? -1 : 1) * Math.pow(2, e - 15) * (1 + (f / Math.pow(2, 10)));
};

/**
 * Gets long word order
 * @author Babylon
 * @param {number} a
 * @returns {number}
 */
num.getLongWordOrder = function(a)
{
    return (a === 0 || a === 255 || a === -16777216) ? 0 : 1 + num.getLongWordOrder(a >> 8);
};

/**
 * Gets the log2 of a number
 * @param {number} a
 * @returns {number}
 */
num.log2 = function(a)
{
    return Math.log(a) * Math.LOG2E;
};

/**
 * Converts a number to a half float
 * @author http://stackoverflow.com/questions/32633585/how-do-you-convert-to-half-floats-in-javascript
 * @param {number} a
 * @returns {number}
 */
num.toHalfFloat = (function ()
{
    let floatView, int32View;
    
    return function (a)
    {
        if (!floatView)
        {
            floatView = new Float32Array(1);
            int32View = new Int32Array(floatView.buffer);        
        }
        
        floatView[0] = a;
        const x = int32View[0];

        let bits = (x >> 16) & 0x8000;
        /* Get the sign */
        let m = (x >> 12) & 0x07ff;
        /* Keep one extra bit for rounding */
        let e = (x >> 23) & 0xff;
        /* Using int is faster here */

        /* If zero, or denormal, or exponent underflows too much for a denormal half, return signed zero. */
        if (e < 103)
        {
            return bits;
        }

        /* If NaN, return NaN. If Inf or exponent overflow, return Inf. */
        if (e > 142)
        {
            bits |= 0x7c00;
            /* If exponent was 0xff and one mantissa bit was set, it means NaN,
                 * not Inf, so make sure we set one mantissa bit too. */
            bits |= ((e === 255) ? 0 : 1) && (x & 0x007fffff);
            return bits;
        }

        /* If exponent underflows but not too much, return a denormal */
        if (e < 113)
        {
            m |= 0x0800;
            /* Extra rounding may overflow and set mantissa to 0 and exponent to 1, which is OK. */
            bits |= (m >> (114 - e)) + ((m >> (113 - e)) & 1);
            return bits;
        }

        bits |= ((e - 112) << 10) | (m >> 1);
        /* Extra rounding. An overflow will set mantissa to 0 and increment the exponent, which is OK. */
        bits += m & 1;
        return bits;
    };

}());