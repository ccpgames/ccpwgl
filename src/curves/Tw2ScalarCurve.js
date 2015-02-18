function Tw2ScalarKey()
{
    this.time = 0;
    this.value = 0;
    this.left = 0;
    this.right = 0;
    this.interpolation = 0;
}

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

Tw2ScalarCurve.prototype.GetLength = function () {
    return this.length;
}

Tw2ScalarCurve.prototype.UpdateValue = function (t) 
{
    this.value = this.GetValueAt(t);
}

Tw2ScalarCurve.prototype.GetValueAt = function (t)
{
    t = t / this.timeScale - this.timeOffset;
    if (this.length == 0)
    {
        return this.value;
    }

    var firstKey = this.keys[0];
    var lastKey = this.keys[this.keys.length - 1];
    if (t >= lastKey.time)
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
            var d = t - lastKey.time;
            return lastKey.value + d * lastKey.right;
        }
        else
        {
            t = t % lastKey.time;
        }
    }
    else if (t < 0 || t < firstKey.time)
    {
        if (this.extrapolation == 0)
        {
            return this.value;
        }
        else if (this.extrapolation == 2)
        {
            var d = t * this.length - lastKey.time;
            return firstKey.value + d * firstKey.left;
        }
        else
        {
            return firstKey.value;
        }
    }
    var ck = this.keys[this._currKey];
    var ck_1 = this.keys[this._currKey - 1];
    while ((t >= ck.time) || (t < ck_1.time))
    {
        if (t < ck_1.time)
        {
            this._currKey = 0;
        }
        this._currKey++;
        ck = this.keys[this._currKey];
        ck_1 = this.keys[this._currKey - 1];
    }

    var nt = (t - ck_1.time) / (ck.time - ck_1.time);
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
		var sq = Math.sqrt( ck_1.value / ck.value );
		var exponent = Math.exp( -t / ck_1.right );
		var ret = (1.0 + (sq - 1.0) * exponent);
		return ret * ret * ck.value;
    }
    return this.value;
}