/**
 * Tw2ColorKey
 * @property {number} time
 * @property {vec4} value
 * @property {vec4} left
 * @property {vec4} right
 * @property {number} interpolation
 * @constructor
 */
function Tw2ColorKey()
{
    this.time = 0;
    this.value = vec4.create()
    this.left = vec4.create()
    this.right = vec4.create()
    this.interpolation = 0;
}


/**
 * Tw2ColorCurve
 * @property {String} name
 * @property {number} start
 * @property {number} length
 * @property {vec4} value
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
    this.value = vec4.create()
    this.extrapolation = 0;
    this.keys = [];
    this._currKey = 1;
}

/**
 * Returns curve length
 * @returns {number}
 */
Tw2ColorCurve.prototype.GetLength = function()
{
    return this.length;
};

/**
 * Updates a value at a specific time
 * @param {number} time
 */
Tw2ColorCurve.prototype.UpdateValue = function(time)
{
    this.GetValueAt(time, this.value);
};

/**
 * Gets a value at a specific time
 * @param {number} time
 * @param {vec4} value
 * @returns {vec4}
 */
Tw2ColorCurve.prototype.GetValueAt = function(time, value)
{
    if (this.length == 0)
    {
        return vec4.copy(value, this.value);
    }

    var d;
    var firstKey = this.keys[0];
    var lastKey = this.keys[this.keys.length - 1];
    if (time >= lastKey.time)
    {
        if (this.extrapolation == 0)
        {
            return vec4.copy(value, this.value);
        }
        else if (this.extrapolation == 1)
        {
            return vec4.copy(value, lastKey.value);
        }
        else if (this.extrapolation == 2)
        {
            return vec4.scaleAndAdd(value, lastKey.value, lastKey.right, time - lastKey.time);
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
            return vec4.copy(value, this.value);
        }
        else if (this.extrapolation == 2)
        {
            return vec4.scaleAndAdd(value, firstKey.value, firstKey.left, time * this.length - lastKey.time);
        }
        else
        {
            return vec4.copy(value, firstKey.value);
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
        vec4.copy(value, ck_1.value);
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
