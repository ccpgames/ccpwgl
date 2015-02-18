function Tw2Vector2Key()
{
    this.time = 0;
    this.value = new Float32Array(2);
    this.leftTangent = new Float32Array(2);
    this.rightTangent = new Float32Array(2);
    this.interpolation = 1;
}

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

Tw2Vector2Curve.prototype.Initialize = function ()
{
    this.Sort();
}

Tw2Vector2Curve.prototype.GetLength = function () {
    return this.length;
}

Tw2Vector2Curve.Compare = function (a, b)
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
}

Tw2Vector2Curve.prototype.Sort = function ()
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
}

Tw2Vector2Curve.prototype.UpdateValue = function (t)
{
    this.GetValueAt(t, this.currentValue);
}

Tw2Vector2Curve.prototype.GetValueAt = function (time, value)
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
}

Tw2Vector2Curve.prototype.Interpolate = function (time, lastKey, nextKey, value)
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
}