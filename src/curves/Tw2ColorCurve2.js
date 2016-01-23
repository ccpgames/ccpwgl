/**
 * Tw2ColorKey2
 * @property {number} time
 * @property {quat4} value
 * @property {quat4} leftTangent
 * @property {quat4} rightTangent
 * @property {number} interpolation
 * @constructor
 */
function Tw2ColorKey2()
{
    this.time = 0;
    this.value = quat4.create();
    this.leftTangent = quat4.create();
    this.rightTangent = quat4.create();
    this.interpolation = 1;
}


/**
 * Tw2ColorCurve2
 * @property {string} name
 * @property {number} length
 * @property {boolean} cycle
 * @property {boolean} reversed
 * @property {number} timeOffset
 * @property {number} timeScale
 * @property {quat4} startValue=[0,0,0,1]
 * @property {quat4} currentValue=[0,0,0,1]
 * @property {quat4} endValue=[0,0,0,1]
 * @property {quat4} startTangent
 * @property {quat4} endTangent
 * @property {number} interpolation
 * @property {Array.<Tw2ColorKey2>} keys
 * @constructor
 */
function Tw2ColorCurve2()
{
    this.name = '';
    this.length = 0;
    this.cycle = false;
    this.reversed = false;
    this.timeOffset = 0;
    this.timeScale = 1;
    this.startValue = quat4.create([0, 0, 0, 1]);
    this.currentValue = quat4.create([0, 0, 0, 1]);
    this.endValue = quat4.create([0, 0, 0, 1]);
    this.startTangent = quat4.create();
    this.endTangent = quat4.create();
    this.interpolation = 1;
    this.keys = [];
}

/**
 * Initializes the curve
 * @prototype
 */
Tw2ColorCurve2.prototype.Initialize = function()
{
    this.Sort();
};

/**
 * Gets curve length
 * @returns {number}
 * @prototype
 */
Tw2ColorCurve2.prototype.GetLength = function()
{
    return this.length;
};

/**
 * Compares two curve keys' time properties
 * @param {Tw2ColorKey2} a
 * @param {Tw2ColorKey2} b
 * @returns {number}
 * @method
 */
Tw2ColorCurve2.Compare = function(a, b)
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
Tw2ColorCurve2.prototype.Sort = function()
{
    if (this.keys.length)
    {
        this.keys.sort(Tw2ColorCurve2.Compare);
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
Tw2ColorCurve2.prototype.UpdateValue = function(time)
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
Tw2ColorCurve2.prototype.GetValueAt = function(time, value)
{
    time = time / this.timeScale + this.timeOffset;
    if (this.length <= 0 || time <= 0)
    {
        value[0] = this.startValue[0];
        value[1] = this.startValue[1];
        value[2] = this.startValue[2];
        value[3] = this.startValue[3];
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
            value[3] = this.startValue[3];
            return value;
        }
        else
        {
            value[0] = this.endValue[0];
            value[1] = this.endValue[1];
            value[2] = this.endValue[2];
            value[3] = this.endValue[3];
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
    var endKey = this.keys[i + 1];
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
 * @param {Tw2ColorKey2} lastKey
 * @param {Tw2ColorKey2} nextKey
 * @param {quat4} value
 * @returns {*}
 * @prototype
 */
Tw2ColorCurve2.prototype.Interpolate = function(time, lastKey, nextKey, value)
{
    value[0] = this.startValue[0];
    value[1] = this.startValue[1];
    value[2] = this.startValue[2];
    value[3] = this.startValue[3];

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
        case 1:
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
            value[0] = startValue[0] + (endValue[0] - startValue[0]) * (time / deltaTime);
            value[1] = startValue[1] + (endValue[1] - startValue[1]) * (time / deltaTime);
            value[2] = startValue[2] + (endValue[2] - startValue[2]) * (time / deltaTime);
            value[3] = startValue[3] + (endValue[3] - startValue[3]) * (time / deltaTime);
            return value;
    }
    return value;
};
