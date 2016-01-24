/**
 * Tw2ColorKey
 * @property {number} time
 * @property {quat4} value
 * @property {quat4} left
 * @property {quat4} right
 * @property {number} interpolation
 * @constructor
 */
function Tw2ColorKey()
{
    this.time = 0;
    this.value = quat4.create();
    this.left = quat4.create();
    this.right = quat4.create();
    this.interpolation = 0;
}


/**
 * Tw2ColorCurve
 * @property {String} name
 * @property {number} start
 * @property {number} length
 * @property {quat4} value
 * @property {number} extrapolation
 * @property {Array.<Tw2ColorKey>} keys
 * @property {number} _currKey
 * @constructor
 */
function Tw2ColorCurve()
{
    this.name = '';
    this.start = 0;
    this.length = 0;
    this.value = quat4.create();
    this.extrapolation = 0;
    this.keys = [];
    this._currKey = 1;
}

/**
 * Returns curve length
 * @returns {number}
 * @prototype
 */
Tw2ColorCurve.prototype.GetLength = function()
{
    return this.length;
};

/**
 * Updates a value at a specific time
 * @param {number} time
 * @prototype
 */
Tw2ColorCurve.prototype.UpdateValue = function(time)
{
    this.GetValueAt(time, this.value);
};

/**
 * Gets a value at a specific time
 * @param {number} time
 * @param {quat4} value
 * @returns {quat4}
 * @prototype
 */
Tw2ColorCurve.prototype.GetValueAt = function(time, value)
{
    if (this.length == 0)
    {
        value[0] = this.value[0];
        value[1] = this.value[1];
        value[2] = this.value[2];
        value[3] = this.value[3];
        return value;
    }

    var d;
    var firstKey = this.keys[0];
    var lastKey = this.keys[this.keys.length - 1];
    if (time >= lastKey.time)
    {
        if (this.extrapolation == 0)
        {
            value[0] = this.value[0];
            value[1] = this.value[1];
            value[2] = this.value[2];
            value[3] = this.value[3];
            return value;
        }
        else if (this.extrapolation == 1)
        {
            value[0] = lastKey.value[0];
            value[1] = lastKey.value[1];
            value[2] = lastKey.value[2];
            value[3] = lastKey.value[3];
            return value;
        }
        else if (this.extrapolation == 2)
        {
            d = time - lastKey.time;
            value[0] = lastKey.value[0] + d * lastKey.right[0];
            value[1] = lastKey.value[1] + d * lastKey.right[1];
            value[2] = lastKey.value[2] + d * lastKey.right[2];
            value[3] = lastKey.value[3] + d * lastKey.right[3];
            return value;
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
            value[0] = this.value[0];
            value[1] = this.value[1];
            value[2] = this.value[2];
            value[3] = this.value[3];
            return value;
        }
        else if (this.extrapolation == 2)
        {
            d = time * this.length - lastKey.time;
            value[0] = firstKey.value[0] + d * firstKey.left[0];
            value[1] = firstKey.value[1] + d * firstKey.left[1];
            value[2] = firstKey.value[2] + d * firstKey.left[2];
            value[3] = firstKey.value[3] + d * firstKey.left[3];
            return value;
        }
        else
        {
            value[0] = firstKey.value[0];
            value[1] = firstKey.value[1];
            value[2] = firstKey.value[2];
            value[3] = firstKey.value[3];
            return value;
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
        value[0] = ck_1.value[0];
        value[1] = ck_1.value[1];
        value[2] = ck_1.value[2];
        value[3] = ck_1.value[3];
    }
    else
    {
        value[0] = ck_1.value[0] * (1 - nt) + ck.value[0] * nt;
        value[1] = ck_1.value[1] * (1 - nt) + ck.value[1] * nt;
        value[2] = ck_1.value[2] * (1 - nt) + ck.value[2] * nt;
        value[3] = ck_1.value[3] * (1 - nt) + ck.value[3] * nt;
    }
    return value;
};
