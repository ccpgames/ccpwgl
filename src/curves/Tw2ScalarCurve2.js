/**
 * Tw2ScalarKey2
 * @property {number} time
 * @property {number} value
 * @property {number} leftTangent
 * @property {number} rightTangent
 * @property {number} interpolation
 * @constructor
 */
function Tw2ScalarKey2()
{
    this.time = 0;
    this.value = 0;
    this.leftTangent = 0;
    this.rightTangent = 0;
    this.interpolation = 1;
}

/**
 * Tw2ScalarCurve2
 * @property {string} name
 * @property {number} length
 * @property {boolean} cycle
 * @property {boolean} reversed
 * @property {number} timeOffset
 * @property {number} timeScale
 * @property {number} startValue
 * @property {number} currentValue
 * @property {number} endValue
 * @property {number} startTangent
 * @property {number} endTangent
 * @property {number} interpolation
 * @property {Array.<Tw2ScalarKey2>} keys
 * @constructor
 */
function Tw2ScalarCurve2()
{
    this.name = '';
    this.length = 0;
    this.cycle = false;
    this.reversed = false;
    this.timeOffset = 0;
    this.timeScale = 1;
    this.startValue = 0;
    this.currentValue = 0;
    this.endValue = 0;
    this.startTangent = 0;
    this.endTangent = 0;
    this.interpolation = 1;
    this.keys = [];
}

/**
 * Gets curve length
 * @returns {number}
 * @prototype
 */
Tw2ScalarCurve2.prototype.GetLength = function()
{
    return this.length;
};

/**
 * Initializes Curve
 * @prototype
 */
Tw2ScalarCurve2.prototype.Initialize = function()
{
    this.Sort();
};

/**
 * Compares two curve keys' time properties
 * @param {Tw2ScalarKey2} a
 * @param {Tw2ScalarKey2} b
 * @returns {number}
 * @method
 */
Tw2ScalarCurve2.Compare = function(a, b)
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
Tw2ScalarCurve2.prototype.Sort = function()
{
    if (this.keys.length)
    {
        this.keys.sort(Tw2ScalarCurve2.Compare);
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
Tw2ScalarCurve2.prototype.UpdateValue = function(time)
{
    this.currentValue = this.GetValueAt(time);
};

/**
 * Gets a value at a specific time
 * @param {number} time
 * @returns {number}
 * @prototype
 */
Tw2ScalarCurve2.prototype.GetValueAt = function(time)
{
    time = time / this.timeScale + this.timeOffset;
    if (this.length <= 0 || time <= 0)
    {
        return this.startValue;
    }
    if (time > this.length)
    {
        if (this.cycle)
        {
            time = time % this.length;
        }
        else if (this.reversed)
        {
            return this.startValue;
        }
        else
        {
            return this.endValue;
        }
    }
    if (this.reversed)
    {
        time = this.length - time;
    }
    if (this.keys.length == 0)
    {
        return this.Interpolate(time, null, null);
    }
    var startKey = this.keys[0];
    if (time <= startKey.time)
    {
        return this.Interpolate(time, null, startKey);
    }
    else if (time >= this.keys[this.keys.length - 1].time)
    {
        return this.Interpolate(time, this.keys[this.keys.length - 1], null);
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
    return this.Interpolate(time, startKey, endKey);
};

/**
 * Interpolate
 * @param {number} time
 * @param {Tw2ScalarKey2} lastKey
 * @param {Tw2ScalarKey2} nextKey
 * @returns {number}
 * @prototype
 */
Tw2ScalarCurve2.prototype.Interpolate = function(time, lastKey, nextKey)
{
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
            return startValue + (endValue - startValue) * (time / deltaTime);

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

            return startValue * c1 + endValue * c2 + inTangent * c3 + outTangent * c4;
    }
    return this.startValue;
};
