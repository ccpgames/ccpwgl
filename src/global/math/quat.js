import {quat} from 'gl-matrix';

export {quat};

/**
 * QuaternionExp
 *
 * @param {quat} out
 * @param {quat|vec3} a
 * @returns {quat}
 */
quat.exp = function (out, a)
{
    let norm = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
    if (norm)
    {
        out[0] = Math.sin(norm) * a[0] / norm;
        out[1] = Math.sin(norm) * a[1] / norm;
        out[2] = Math.sin(norm) * a[2] / norm;
        out[3] = Math.cos(norm);
    }
    else
    {
        out[0] = 0.0;
        out[1] = 0.0;
        out[2] = 0.0;
        out[3] = 1.0;
    }
    return out;
};

/**
 * QuaternionLn
 *
 * @param {quat} out
 * @param {quat} q
 * @returns {quat}
 */
quat.ln = function (out, q)
{
    let norm = quat.length(q);
    if (norm > 1.0001 || norm < 0.99999)
    {
        out[0] = q[0];
        out[1] = q[1];
        out[2] = q[2];
        out[3] = 0.0;
    }
    else
    {
        norm = Math.sqrt(q[0] * q[0] + q[1] * q[1] + q[2] * q[2]);
        if (norm)
        {
            let theta = Math.atan2(norm, q[3]) / norm;
            out[0] = theta * q[0];
            out[1] = theta * q[1];
            out[2] = theta * q[2];
            out[3] = 0.0;
        }
        else
        {
            out[0] = 0.0;
            out[1] = 0.0;
            out[2] = 0.0;
            out[3] = 0.0;
        }
    }
    return out;
};

/**
 * QuaternionPow
 *
 * @param {quat} out
 * @param {quat} inq
 * @param {number} exponent
 * @returns {quat}
 */
quat.pow = function (out, inq, exponent)
{
    if (exponent === 1)
    {
        return quat.copy(out, inq);
    }

    quat.ln(out, inq);
    out[0] *= exponent;
    out[1] *= exponent;
    out[2] *= exponent;
    out[3] *= exponent;
    quat.exp(out, out);
    return out;
};