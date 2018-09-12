export const num = {};

/**
 * biCumulative
 *
 * @param {number} t
 * @param {number} order
 * @returns {number}
 */
num.biCumulative = function(t, order)
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
num.dwordToFloat = function(value)
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
num.exponentialDecay = function(omega0, torque, I, d, time)
{
    return torque * time / d + I * (omega0 * d - torque) / (d * d) * (1.0 - Math.pow(Math.E, -d * time / I));
};