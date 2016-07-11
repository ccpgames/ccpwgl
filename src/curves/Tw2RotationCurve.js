/**
 * Tw2QuaternionKey
 * @property {number} time
 * @property {quat} value
 * @property {quat} left
 * @property {quat} right
 * @property {number} interpolation
 * @constructor
 */
function Tw2QuaternionKey()
{
    this.time = 0;
    this.value = quat.zero();
    this.left = quat.zero();
    this.right = quat.zero();
    this.interpolation = 5;
}


/**
 * Tw2RotationCurve
 * @property {string} name
 * @property {number} start
 * @property {number} length
 * @property {quat} value
 * @property {number} extrapolation
 * @property {Array.<Tw2QuaternionKey>} keys
 * @property {number} _currKey
 * @constructor
 */
function Tw2RotationCurve()
{
    this.name = '';
    this.start = 0;
    this.length = 0;
    this.value = quat.zero();
    this.extrapolation = 0;
    this.keys = [];
    this._currKey = 1;
}

/**
 * Gets curve length
 * @returns {number}
 */
Tw2RotationCurve.prototype.GetLength = function()
{
    return this.length;
};

/**
 * Updates a value at a specific time
 * @param {number} time
 */
Tw2RotationCurve.prototype.UpdateValue = function(time)
{
    this.GetValueAt(time, this.value);
};

/**
 * BICumulative
 * @param {number} order
 * @param t
 * @returns {number}
 */
Tw2RotationCurve.BICumulative = function(order, t)
{
    if (order == 1)
    {
        var some = (1.0 - t);
        return 1.0 - some * some * some;
    }
    else if (order == 2)
    {
        return 3.0 * t * t - 2.0 * t * t * t;
    }
    else
    {
        return t * t * t;
    }
};

/**
 * QuaternionPow
 * @param {quat} out
 * @param {quat} inq
 * @param {number} exponent
 * @returns {quat}
 */
Tw2RotationCurve.QuaternionPow = function(out, inq, exponent)
{
    if (exponent == 1)
    {
        return quat.copy(out, inq);
    }
    Tw2RotationCurve.QuaternionLn(out, inq);
    out[0] *= exponent;
    out[1] *= exponent;
    out[2] *= exponent;
    out[3] *= exponent;
    Tw2RotationCurve.QuaternionExp(out, out);
    return out;
};

/**
 * QuaternionLn
 * @param {quat} out
 * @param {quat} q
 * @returns {quat}
 */
Tw2RotationCurve.QuaternionLn = function(out, q)
{
    var norm = quat.length(q);
    if (norm > 1.0001 || norm < 0.99999)
    {
        out[0] = q[0];
        out[1] = q[1];
        out[2] = q[2];
        out[3] = 0.0;
    }
    else
    {
        var normvec = Math.sqrt(q[0] * q[0] + q[1] * q[1] + q[2] * q[2]);
        if (normvec == 0.0)
        {
            quat.fill(out, 0.0);
        }
        else
        {
            var theta = Math.atan2(normvec, q[3]) / normvec;
            out[0] = theta * q[0];
            out[1] = theta * q[1];
            out[2] = theta * q[2];
            out[3] = 0.0;
        }
    }
    return out;
};

/**
 * QuaternionExp
 * @param {quat} out
 * @param {quat} q
 * @returns {quat}
 */
Tw2RotationCurve.QuaternionExp = function(out, q)
{
    var norm = Math.sqrt(q[0] * q[0] + q[1] * q[1] + q[2] * q[2]);
    if (norm)
    {
        out[0] = Math.sin(norm) * q[0] / norm;
        out[1] = Math.sin(norm) * q[1] / norm;
        out[2] = Math.sin(norm) * q[2] / norm;
        out[3] = Math.cos(norm);
    }
    else
    {
        quat.identity(out);
    }
    return out;
};

/**
 * Gets a value at a specific time
 * @param {number} time
 * @param {quat} value
 * @returns {quat}
 */
Tw2RotationCurve.prototype.GetValueAt = function(time, value)
{
    if (this.length == 0)
    {
        return quat.copy(value, this.value);
    }

    var firstKey = this.keys[0];
    var lastKey = this.keys[this.keys.length - 1];
    if (time >= lastKey.time)
    {
        if (this.extrapolation == 0)
        {
            return quat.copy(value, this.value);
        }
        else if (this.extrapolation == 1)
        {
            return quat.copy(value, lastKey.value);
        }
        else
        {
            time = time % lastKey.time;
        }
    }
    else if (time < 0 || time < firstKey.time)
    {
        if (this.extrapolation == 0)
        {
            return quat.copy(value, this.value);
        }
        else
        {
            return quat.copy(value, firstKey.value);
        }
    }
    var ck = this.keys[this._currKey];
    var ck_1 = this.keys[this._currKey - 1];
    while ((time >= ck.time) || (time < ck_1.time))
    {
        if (time < ck_1.time)
        {
            this._currKey = 0;
        }
        this._currKey++;
        ck = this.keys[this._currKey];
        ck_1 = this.keys[this._currKey - 1];
    }

    var nt = (time - ck_1.time) / (ck.time - ck_1.time);
    if (ck_1.interpolation == 1)
    {
        quat.copy(value, ck_1.value);
    }
    else if (ck_1.interpolation == 2)
    {
        value[0] = ck_1.value[0] * (1 - nt) + ck.value[0] * nt;
        value[1] = ck_1.value[1] * (1 - nt) + ck.value[1] * nt;
        value[2] = ck_1.value[2] * (1 - nt) + ck.value[2] * nt;
        value[3] = ck_1.value[3] * (1 - nt) + ck.value[3] * nt;
    }
    else if (ck_1.interpolation == 3)
    {
        var collect = quat.zero();
        collect[3] = 1;
        var arr = [ck_1.value, ck_1.right, ck.left, ck.value];
        for (var i = 3; i > 0; i--)
        {
            var power = Tw2RotationCurve.BICumulative(i, nt);
            if (power > 1)
            {
                quat.multiply(value, collect, arr[i]);
            }
            value[0] = -arr[i - 1][0];
            value[1] = -arr[i - 1][1];
            value[2] = -arr[i - 1][2];
            value[3] = arr[i - 1][3];
            quat.multiply(value, value, arr[i]);
            Tw2RotationCurve.QuaternionPow(value, value, power);
            quat.multiply(collect, collect, value);
        }
        return quat.multiply(value, collect, ck_1.value);
    }
    else if (ck_1.interpolation == 5)
    {
        return Tw2QuaternionCurve.slerp(ck_1.value, ck.value, nt, value);
    }
    else
    {
        return Tw2QuaternionCurve.slerp(Tw2QuaternionCurve.slerp(ck_1.value, ck.value, nt, quat.zero()), Tw2QuaternionCurve.slerp(ck_1.right, ck.left, nt, quat.zero()), 2.0 * time * (1.0 - time), value);
    }
    return value;
};
