/**
 * Tw2QuaternionKey
 * @property {number} time
 * @property {quat4} value
 * @property {quat4} leftTangent
 * @property {quat4} rightTangent
 * @property {number} interpolation
 * @constructor
 */
function Tw2QuaternionKey()
{
    this.time = 0;
    this.value = quat4.create();
    this.leftTangent = quat4.create();
    this.rightTangent = quat4.create();
    this.interpolation = 1;
}


/**
 * Tw2QuaternionCurve
 * @property {string} name
 * @property {number} length
 * @property {boolean} cycle
 * @property {boolean} reversed
 * @property {number} timeOffset
 * @property {number} timeScale
 * @property {quat4} startValue
 * @property {quat4} currentValue
 * @property {quat4} endValue
 * @property {quat4} startTangent
 * @property {quat4} endTangent
 * @property {number} interpolation
 * @property {Array.<Tw2QuaternionKey>} keys
 * @constructor
 */
function Tw2QuaternionCurve()
{
    this.name = '';
    this.length = 0;
    this.cycle = false;
    this.reversed = false;
    this.timeOffset = 0;
    this.timeScale = 1;
    this.startValue = quat4.create();
    this.currentValue = quat4.create();
    this.endValue = quat4.create();
    this.startTangent = quat4.create();
    this.endTangent = quat4.create();
    this.interpolation = 1;
    this.keys = [];
}

/**
 * Initializes the Curve
 * @prototype
 */
Tw2QuaternionCurve.prototype.Initialize = function()
{
    this.Sort();
};

/**
 * Gets curve length
 * @returns {number}
 * @prototype
 */
Tw2QuaternionCurve.prototype.GetLength = function()
{
    return this.length;
};

/**
 * Compares two curve keys' time properties
 * @param {Tw2QuaternionKey} a
 * @param {Tw2QuaternionKey} b
 * @returns {number}
 * @method
 */
Tw2QuaternionCurve.Compare = function(a, b)
{
    if (a.time < b.time)
    {
        return -1;
    }
    if (a.time > b.time)
    {
        return 1;
    }
    return 0;
};

/**
 * Sorts the curve's keys
 * @prototype
 */
Tw2QuaternionCurve.prototype.Sort = function()
{
    if (this.keys.length)
    {
        this.keys.sort(Tw2QuaternionCurve.Compare);
        var back = this.keys[this.keys.length - 1];
        if (back.time > this.length)
        {
            var preLength = this.length;
            var endValue = this.endValue;
            var endTangent = this.endTangent;
            this.length = back.time;
            this.endValue = back.value;
            this.endTangent = back.leftTangent;
            if (preLength > 0)
            {
                back.time = preLength;
                back.value = endValue;
                back.leftTangent = endTangent;
            }
        }
    }
};

/**
 * Updates a value at a specific time
 * @param {number} time
 * @prototype
 */
Tw2QuaternionCurve.prototype.UpdateValue = function(time)
{
    this.GetValueAt(time, this.currentValue);
};

/**
 * Gets a value at a specific time
 * @param {number} time
 * @param {quat4} value
 * @returns {quat4}
 * @prototype
 */
Tw2QuaternionCurve.prototype.GetValueAt = function(time, value)
{
    time = time / this.timeScale + this.timeOffset;
    if (this.length <= 0 || time <= 0)
    {
        value[0] = this.startValue[0];
        value[1] = this.startValue[1];
        value[2] = this.startValue[2];
        return value;
    }
    if (time > this.length)
    {
        if (this.cycle)
        {
            time = time % this.length;
        }
        else if (this.reversed)
        {
            value[0] = this.startValue[0];
            value[1] = this.startValue[1];
            value[2] = this.startValue[2];
            return value;
        }
        else
        {
            value[0] = this.endValue[0];
            value[1] = this.endValue[1];
            value[2] = this.endValue[2];
            return value;
        }
    }
    if (this.reversed)
    {
        time = this.length - time;
    }
    if (this.keys.length == 0)
    {
        return this.Interpolate(time, null, null, value);
    }
    var startKey = this.keys[0];
    if (time <= startKey.time)
    {
        return this.Interpolate(time, null, startKey, value);
    }
    else if (time >= this.keys[this.keys.length - 1].time)
    {
        return this.Interpolate(time, this.keys[this.keys.length - 1], null, value);
    }
    var endKey = this.keys[0];
    for (var i = 0; i + 1 < this.keys.length; ++i)
    {
        startKey = this.keys[i];
        endKey = this.keys[i + 1];
        if (startKey.time <= time && endKey.time > time)
        {
            break;
        }
    }
    return this.Interpolate(time, startKey, endKey, value);
};

/**
 * Interpolate
 * @param {number} time
 * @param {null|Tw2QuaternionKey} lastKey
 * @param {null|Tw2QuaternionKey} nextKey
 * @param {quat4} value
 * @returns {*}
 * @prototype
 */
Tw2QuaternionCurve.prototype.Interpolate = function(time, lastKey, nextKey, value)
{
    value[0] = this.startValue[0];
    value[1] = this.startValue[1];
    value[2] = this.startValue[2];

    var startValue = this.startValue;
    var endValue = this.endValue;
    var interp = this.interpolation;
    var deltaTime = this.length;
    if (lastKey != null)
    {
        interp = lastKey.interpolation;
        time -= lastKey.time;
    }
    switch (interp)
    {
        case 4:
            if (lastKey && nextKey)
            {
                startValue = lastKey.value;
                endValue = nextKey.value;
                deltaTime = nextKey.time - lastKey.time;
            }
            else if (nextKey)
            {
                endValue = nextKey.value;
                deltaTime = nextKey.time;
            }
            else if (lastKey)
            {
                startValue = lastKey.value;
                deltaTime = this.length - lastKey.time;
            }
            quat4.slerp(startValue, endValue, time / deltaTime, value);
            return value;
    }
    return value;
};
