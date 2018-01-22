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