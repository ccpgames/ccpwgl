/**
 * Tw2ScalarKey
 * @property {number} time
 * @property {number} value
 * @property {number} left
 * @property {number} right
 * @property {number} interpolation
 * @constructor
 */
function Tw2ScalarKey()
{
    this.time = 0;
    this.value = 0;
    this.left = 0;
    this.right = 0;
    this.interpolation = 0;
}

/**
 * Tw2ScalarCurve
 * @property {string} name
 * @property {number} start
 * @property {number} timeScale
 * @property {number} timeOffset
 * @property {number} length
 * @property {number} value
 * @property {number} extrapolation
 * @property {Array.<Tw2ScalarKey>} keys
 * @property {number} _currKey
 * @constructor
 */
function Tw2ScalarCurve()
{
    this.name = '';
    this.start = 0;
    this.timeScale = 1;
    this.timeOffset = 0;
    this.length = 0;
    this.value = 0;
    this.extrapolation = 0;
    this.keys = [];
    this._currKey = 1;
}

/**
 * Gets curve length
 * @returns {number}
 * @prototype
 */
Tw2ScalarCurve.prototype.GetLength = function()
{
    return this.length;
};

/**
 * Updates a value at a specific time
 * @param {number} time
 * @prototype
 */
Tw2ScalarCurve.prototype.UpdateValue = function(time)
{
    this.value = this.GetValueAt(time);
};

/**
 * Gets a value at a specific time
 * TODO: Final return is unreachable
 * @param {number} time
 * @returns {*}
 * @prototype
 */
Tw2ScalarCurve.prototype.GetValueAt = function(time)
{
    var d;

    time = time / this.timeScale - this.timeOffset;
    if (this.length == 0)
    {
        return this.value;
    }

    var firstKey = this.keys[0];
    var lastKey = this.keys[this.keys.length - 1];
    if (time >= lastKey.time)
    {
        if (this.extrapolation == 0)
        {
            return this.value;
        }
        else if (this.extrapolation == 1)
        {
            return lastKey.value;
        }
        else if (this.extrapolation == 2)
        {
            d = time - lastKey.time;
            return lastKey.value + d * lastKey.right;
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
            return this.value;
        }
        else if (this.extrapolation == 2)
        {
            d = time * this.length - lastKey.time;
            return firstKey.value + d * firstKey.left;
        }
        else
        {
            return firstKey.value;
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
        return ck_1.value;
    }
    else if (ck_1.interpolation == 2)
    {
        return ck_1.value * (1 - nt) + ck.value * nt;
    }
    else if (ck_1.interpolation == 3)
    {
        var k3 = 2 * nt * nt * nt - 3 * nt * nt + 1;
        var k2 = -2 * nt * nt * nt + 3 * nt * nt;
        var k1 = nt * nt * nt - 2 * nt * nt + nt;
        var k0 = nt * nt * nt - nt * nt;
        return k3 * ck_1.value + k2 * ck.value + k1 * ck_1.right + k0 * ck.left;
    }
    else
    {
        var sq = Math.sqrt(ck_1.value / ck.value);
        var exponent = Math.exp(-time / ck_1.right);
        var ret = (1.0 + (sq - 1.0) * exponent);
        return ret * ret * ck.value;
    }

    return this.value;
};
