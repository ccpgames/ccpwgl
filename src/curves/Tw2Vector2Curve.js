/**
 * Tw2Vector2Key
 * @property {number} time
 * @property {Float32Array} value - vec2 array
 * @property {Float32Array} leftTangent - vec2 array
 * @property {Float32Array} rightTangent - vec2 array
 * @property {number} interpolation
 * @constructor
 */
function Tw2Vector2Key()
{
    this.time = 0;
    this.value = new Float32Array(2);
    this.leftTangent = new Float32Array(2);
    this.rightTangent = new Float32Array(2);
    this.interpolation = 1;
}

/**
 * Tw2Vector2Curve
 * @property {string} name
 * @property {number} length
 * @property {boolean} cycle
 * @property {boolean} reversed
 * @property {number} timeOffset
 * @property {number} timeScale
 * @property {Float32Array} startValue - vec2 array
 * @property {Float32Array} currentValue - vec2 array
 * @property {Float32Array} endValue - vec2 array
 * @property {Float32Array} startTangent - vec2 array
 * @property {Float32Array} endTangent - vec2 array
 * @property {number} interpolation
 * @property {Array.<Tw2Vector2Key>} keys
 * @constructor
 */
function Tw2Vector2Curve()
{
    this.name = '';
    this.length = 0;
    this.cycle = false;
    this.reversed = false;
    this.timeOffset = 0;
    this.timeScale = 1;
    this.startValue = new Float32Array(2);
    this.currentValue = new Float32Array(2);
    this.endValue = new Float32Array(2);
    this.startTangent = new Float32Array(2);
    this.endTangent = new Float32Array(2);
    this.interpolation = 1;
    this.keys = [];
}

/**
 * Initializes the Curve
 * @prototype
 */
Tw2Vector2Curve.prototype.Initialize = function()
{
    this.Sort();
};

/**
 * Gets curve length
 * @returns {number}
 * @prototype
 */
Tw2Vector2Curve.prototype.GetLength = function()
{
    return this.length;
};

/**
 * Compares two curve keys' time properties
 * @param {Tw2Vector2Key} a
 * @param {Tw2Vector2Key} b
 * @returns {number}
 * @method
 */
Tw2Vector2Curve.Compare = function(a, b)
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
Tw2Vector2Curve.prototype.Sort = function()
{
    if (this.keys.length)
    {
        this.keys.sort(Tw2Vector2Curve.Compare);
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
Tw2Vector2Curve.prototype.UpdateValue = function(time)
{
    this.GetValueAt(time, this.currentValue);
};

/**
 * Gets a value at a specific time
 * TODO: the variable `i` is used before it has been initialized
 * @param {number} time
 * @param {Float32Array} value - vec2 array
 * @returns {Float32Array} vec2 array
 * @prototype
 */
Tw2Vector2Curve.prototype.GetValueAt = function(time, value)
{
    time = time / this.timeScale + this.timeOffset;
    if (this.length <= 0 || time <= 0)
    {
        value[0] = this.startValue[0];
        value[1] = this.startValue[1];
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
            return value;
        }
        else
        {
            value[0] = this.endValue[0];
            value[1] = this.endValue[1];
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
    var endKey = this.keys[i + 1]; // <----------------------------------------- `i` is not yet initialized
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
 * @param {Tw2Vector2Key} lastKey
 * @param {Tw2Vector2Key} nextKey
 * @param {Float32Array} value - vec2 array
 * @returns {Float32Array} vec2 array
 * @prototype
 */
Tw2Vector2Curve.prototype.Interpolate = function(time, lastKey, nextKey, value)
{
    value[0] = this.startValue[0];
    value[1] = this.startValue[1];

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
            return value;
        case 2:
            var inTangent = this.startTangent;
            var outTangent = this.endTangent;
            if (lastKey && nextKey)
            {
                startValue = lastKey.value;
                inTangent = lastKey.rightTangent;
                endValue = nextKey.value;
                outTangent = nextKey.leftTangent;
                deltaTime = nextKey.time - lastKey.time;
            }
            else if (nextKey)
            {
                endValue = nextKey.value;
                outTangent = nextKey.leftTangent;
                deltaTime = nextKey.time;
            }
            else if (lastKey)
            {
                startValue = lastKey.value;
                inTangent = lastKey.rightTangent;
                deltaTime = this.length - lastKey.time;
            }
            var s = time / deltaTime;
            var s2 = s * s;
            var s3 = s2 * s;

            var c2 = -2.0 * s3 + 3.0 * s2;
            var c1 = 1.0 - c2;
            var c4 = s3 - s2;
            var c3 = s + c4 - s2;

            value[0] = startValue[0] * c1 + endValue[0] * c2 + inTangent[0] * c3 + outTangent[0] * c4;
            value[1] = startValue[1] * c1 + endValue[1] * c2 + inTangent[1] * c3 + outTangent[1] * c4;
            return value;
    }
    return value;
};
