function Tw2QuaternionKey()
{
    this.time = 0;
    this.value = quat4.create();
    this.left = quat4.create();
    this.right = quat4.create();
    this.interpolation = 5;
}

function Tw2RotationCurve() 
{
    this.name = '';
    this.start = 0;
    this.length = 0;
    this.value = quat4.create();
    this.extrapolation = 0;
    this.keys = [];
    this._currKey = 1;
}

Tw2RotationCurve.prototype.GetLength = function () {
    return this.length;
}

Tw2RotationCurve.prototype.UpdateValue = function (t) 
{
    this.GetValueAt(t, this.value);
}

Tw2RotationCurve.BICumulative = function (order, t)
{
	if (order == 1)
	{
		var some = (1.0 - t);
		return 1.0 - some * some * some;
	}
	else if (order == 2)
	{
		return 3.0 * t * t - 2.0 * t * t * t;
	}
	else
	{
		return t * t * t;
	}
}

Tw2RotationCurve.QuaternionPow = function (out, inq, exponent)
{
    if (exponent == 1)
    {
        quat4.set(inq, out);
        return out;
    }
    Tw2RotationCurve.QuaternionLn(out, inq);
    out[0] *= exponent;
    out[1] *= exponent;
    out[2] *= exponent;
    out[3] *= exponent;
    Tw2RotationCurve.QuaternionExp(out, out);
}

Tw2RotationCurve.QuaternionLn = function (out, q)
{
	var norm = quat4.length(q);
	if (norm > 1.0001 || norm < 0.99999)
	{
		out[0] = q[0];
		out[1] = q[1];
		out[2] = q[2];
		out[3] = 0.0;
	}
	else
	{
		var normvec = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z);
		if (normvec == 0.0)
		{
			out[0] = 0.0;
			out[1] = 0.0;
			out[2] = 0.0;
			out[3] = 0.0;
		}
		else
		{
			var theta = Math.atan2(normvec, q.w) / normvec;
			out[0] = theta * q[0];
			out[1] = theta * q[1];
			out[2] = theta * q[2];
			out[3] = 0.0;
		}
	}
	return out;
}

Tw2RotationCurve.QuaternionExp = function (out, q)
{
	var norm = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z);
	if (norm)
	{
		out[0] = Math.sin(norm) * q[0] / norm;
		out[1] = Math.sin(norm) * q[1] / norm;
		out[2] = Math.sin(norm) * q[2] / norm;
		out[3] = Math.cos(norm);
	}
	else
	{
		out[0] = 0.0;
		out[1] = 0.0;
		out[2] = 0.0;
		out[3] = 1.0;
	}
	return out;
}

Tw2RotationCurve.prototype.GetValueAt = function (t, value)
{
    if (this.length == 0)
    {
        quat4.set(this.value, value);
        return value;
    }

    var firstKey = this.keys[0];
    var lastKey = this.keys[this.keys.length - 1];
    if (t >= lastKey.time)
    {
        if (this.extrapolation == 0)
        {
            quat4.set(this.value, value);
            return value;
        }
        else if (this.extrapolation == 1)
        {
            quat4.set(lastKey.value, value);
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
            quat4.set(this.value, value);
            return value;
        }
        else
        {
            quat4.set(firstKey.value, value);
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
        quat4.set(ck_1.value, value);
    }
    else if (ck_1.interpolation == 2)
    {
        value[0] = ck_1.value[0] * (1 - nt) + ck.value[0] * nt;
        value[1] = ck_1.value[1] * (1 - nt) + ck.value[1] * nt;
        value[2] = ck_1.value[2] * (1 - nt) + ck.value[2] * nt;
        value[3] = ck_1.value[3] * (1 - nt) + ck.value[3] * nt;
    }
    else if (ck_1.interpolation == 3)
    {
        var collect = quat4.create();
        collect[3] = 1;
        var arr = [ck_1.value, ck_1.right, ck.left, ck.value];
        for (var i = 3; i > 0; i--)
        {
            var power = Tw2RotationCurve.BICumulative(i, nt);
            if (power > 1)
            {
                quat4.multiply(collect, arr[i], value);
            }
            value[0] = -arr[i - 1][0];
            value[1] = -arr[i - 1][1];
            value[2] = -arr[i - 1][2];
            value[3] = arr[i - 1][3];
            quat4.multiply(value, arr[i], value);
            Tw2RotationCurve.QuaternionPow(value, value, power);
            quat4.multiply(collect, value, collect);
        }
        return quat4.multiply(collect, q0, value);
    }
    else if (ck_1.interpolation == 5)
    {
        return quat4.slerp(ck_1.value, ck.value, nt, value);
    }
    else
    {
        return quat4.slerp(quat4.slerp(ck_1.value, ck.value, nt, quat4.create()), quat4.slerp(ck_1.right, ck.left, nt, quat4.create()), 2.0 * t * (1.0 - t), value);
    }
    return value;
}