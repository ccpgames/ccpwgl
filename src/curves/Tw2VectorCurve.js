function Tw2VectorKey()
{
    this.time = 0;
    this.value = vec3.create();
    this.left = vec3.create();
    this.right = vec3.create();
    this.interpolation = 0;
}

function Tw2VectorCurve() 
{
    this.name = '';
    this.start = 0;
    this.length = 0;
    this.value = vec3.create();
    this.extrapolation = 0;
    this.keys = [];
    this._currKey = 1;
}

Tw2VectorCurve.prototype.UpdateValue = function (t) 
{
    this.GetValueAt(t, this.value);
}

Tw2VectorCurve.prototype.GetLength = function () {
    return this.length;
}

Tw2VectorCurve.prototype.GetValueAt = function (t, value)
{
    if (this.length == 0)
    {
        value[0] = this.value[0];
        value[1] = this.value[1];
        value[2] = this.value[2];
        return value;
    }

    var firstKey = this.keys[0];
    var lastKey = this.keys[this.keys.length - 1];
    if (t >= lastKey.time)
    {
        if (this.extrapolation == 0)
        {
            value[0] = this.value[0];
            value[1] = this.value[1];
            value[2] = this.value[2];
            return value;
        }
        else if (this.extrapolation == 1)
        {
            value[0] = lastKey.value[0];
            value[1] = lastKey.value[1];
            value[2] = lastKey.value[2];
            return value;
        }
        else if (this.extrapolation == 2)
        {
            var d = t - lastKey.time;
            value[0] = lastKey.value[0] + d * lastKey.right[0];
            value[1] = lastKey.value[1] + d * lastKey.right[1];
            value[2] = lastKey.value[2] + d * lastKey.right[2];
            return value;
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
            value[0] = this.value[0];
            value[1] = this.value[1];
            value[2] = this.value[2];
            return value;
        }
        else if (this.extrapolation == 2)
        {
            var d = t * this.length - lastKey.time;
            value[0] = firstKey.value[0] + d * firstKey.left[0];
            value[1] = firstKey.value[1] + d * firstKey.left[1];
            value[2] = firstKey.value[2] + d * firstKey.left[2];
            return value;
        }
        else
        {
            value[0] = firstKey.value[0];
            value[1] = firstKey.value[1];
            value[2] = firstKey.value[2];
            return value;
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
        value[0] = ck_1.value[0];
        value[1] = ck_1.value[1];
        value[2] = ck_1.value[2];
    }
    else if (ck_1.interpolation == 2)
    {
        value[0] = ck_1.value[0] * (1 - nt) + ck.value[0] * nt;
        value[1] = ck_1.value[1] * (1 - nt) + ck.value[1] * nt;
        value[2] = ck_1.value[2] * (1 - nt) + ck.value[2] * nt;
    }
    else if (ck_1.interpolation == 3)
    {
	    var k3 = 2 * nt * nt * nt - 3 * nt * nt + 1;
	    var k2 = -2 * nt * nt * nt + 3 * nt * nt;
	    var k1 = nt * nt * nt - 2 * nt * nt + nt;
	    var k0 = nt * nt * nt - nt * nt;

	    value[0] = k3 * ck_1.value[0] + k2 * ck.value[0] + k1 * ck_1.right[0] + k0 * ck.left[0];
	    value[1] = k3 * ck_1.value[1] + k2 * ck.value[1] + k1 * ck_1.right[1] + k0 * ck.left[1];
	    value[2] = k3 * ck_1.value[2] + k2 * ck.value[2] + k1 * ck_1.right[2] + k0 * ck.left[2];
    }
    return value;
}