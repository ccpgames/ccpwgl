function Tw2ScalarKey2()
{
    this.time = 0;
    this.value = 0;
    this.leftTangent = 0;
    this.rightTangent = 0;
    this.interpolation = 1;
}

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

Tw2ScalarCurve2.prototype.GetLength = function () {
    return this.length;
}

Tw2ScalarCurve2.prototype.Initialize = function ()
{
    this.Sort();
}

Tw2ScalarCurve2.Compare = function (a, b)
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

Tw2ScalarCurve2.prototype.Sort = function ()
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
}

Tw2ScalarCurve2.prototype.UpdateValue = function (t)
{
    this.currentValue = this.GetValueAt(t);
}

Tw2ScalarCurve2.prototype.GetValueAt = function (time)
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
}

Tw2ScalarCurve2.prototype.Interpolate = function (time, lastKey, nextKey)
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
                deltaTime = length - lastKey.time;
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
}