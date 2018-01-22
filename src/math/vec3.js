import {vec3} from 'gl-matrix';
import {num} from './num';
export {vec3};

/**
 * Exponential decay
 *
 * @param {vec3} out
 * @param {vec3} omega0
 * @param {vec3} torque
 * @param {number} I
 * @param {number} drag
 * @param {number} time
 * @returns {vec3} out
 */
vec3.exponentialDecay = function(out, omega0, torque, I, drag, time)
{
    out[0] = num.exponentialDecay(omega0[0], torque[0], I, drag, time);
    out[1] = num.exponentialDecay(omega0[1], torque[1], I, drag, time);
    out[2] = num.exponentialDecay(omega0[2], torque[2], I, drag, time);
    return out;
};

