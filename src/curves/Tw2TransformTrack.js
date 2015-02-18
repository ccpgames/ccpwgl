function Tw2TransformTrack()
{
    this.name = '';
    this.resPath = '';
    this.res = null;
    this.group = '';
    this.cycle = false;
    this.translation = vec3.create();
    this.rotation = quat4.create([0, 0, 0, 1]);
    this.scale = vec3.create([1, 1, 1]);
    this.positionCurve = null;
    this.orientationCurve = null;
    this.scaleCurve = null;
    this._scaleShear = mat4.create();
}

Tw2TransformTrack.prototype.Initialize = function ()
{
    if (this.resPath != '')
    {
        this.res = resMan.GetResource(this.resPath);
    }
}

Tw2TransformTrack.prototype.GetLength = function () {
    return this.duration;
}

Tw2TransformTrack.prototype.EvaluateCurve = function (curve, time, value, cycle, duration)
{
    var count = curve.knots.length;
    var knot = count - 1;
    var t = 0;
    for (var i = 0; i < curve.knots.length; ++i)
    {
        if (curve.knots[i] > time)
        {
            knot = i;
            break;
        }
    }

    if (curve.degree == 0)
    {
        for (var i = 0; i < curve.dimension; ++i)
        {
            value[i] = curve.controls[knot * curve.dimension + i];
        }
    }
    else if (curve.degree == 1)
    {
        var knot0 = cycle ? (knot + count - 1) % count : knot == 0 ? 0 : knot - 1;
        var dt = curve.knots[knot] - curve.knots[knot0];
        if (dt < 0)
        {
            dt += duration;
        }
        if (dt > 0)
        {
            t = (time - curve.knots[i - 1]) / dt;
        }
        for (var i = 0; i < curve.dimension; ++i)
        {
            value[i] = curve.controls[knot0 * curve.dimension + i] * (1 - t) + curve.controls[knot * curve.dimension + i] * t;
        }
    }
    else
    {
        var k_2 = cycle ? (knot + count - 2) % count : knot == 0 ? 0 : knot - 2;
        var k_1 = cycle ? (knot + count - 1) % count : knot == 0 ? 0 : knot - 1;

        var p1 = (k_2) * curve.dimension;
        var p2 = (k_1) * curve.dimension;
        var p3 = knot * curve.dimension;

        var ti_2 = curve.knots[k_2];
        var ti_1 = curve.knots[k_1];
        var ti = curve.knots[knot];
        var ti1 = curve.knots[(knot + 1) % count];
        if (ti_2 > ti)
        {
            ti += duration;
            ti1 += duration;
            time += duration;
        }
        if (ti_1 > ti)
        {
            ti += duration;
            ti1 += duration;
            time += duration;
        }
        if (ti1 < ti)
        {
            ti1 += duration;
        }

        var tmti_1 = (time - ti_1);
        var tmti_2 = (time - ti_2);
        var dL0 = ti - ti_1;
        var dL1_1 = ti - ti_2;
        var dL1_2 = ti1 - ti_1;

        var L0 = tmti_1 / dL0;
        var L1_1 = tmti_2 / dL1_1;
        var L1_2 = tmti_1 / dL1_2;

        var ci_2 = (L1_1 + L0) - L0 * L1_1;
        var ci = L0 * L1_2;
        var ci_1 = ci_2 - ci;
        ci_2 = 1 - ci_2;

        for (var i = 0; i < curve.dimension; ++i)
        {
            value[i] = ci_2 * curve.controls[p1 + i] + ci_1 * curve.controls[p2 + i] + ci * curve.controls[p3 + i];
        }
    }
}

Tw2TransformTrack.prototype.UpdateValue = function (t)
{
    if (!this.res || !this.res.IsGood())
    {
        return;
    }
    if (!this.positionCurve)
    {
        this.FindTracks();
    }
    if (!this.positionCurve)
    {
        return;
    }

    if (this.cycle)
    {
        t = t % this.duration;
    }
    if (t > this.duration || t < 0)
    {
        return;
    }

    this.EvaluateCurve(this.positionCurve, t, this.translation, this.cycle, this.duration);
    this.EvaluateCurve(this.orientationCurve, t, this.rotation, this.cycle, this.duration);
    quat4.normalize(orientation);
    this.EvaluateCurve(this.scaleCurve, t, this._scaleShear, this.cycle, this.duration);
    this.scale[0] = vec3.length(this.scaleCurve);
    this.scale[1] = vec3.length(this.scaleCurve.subarray(3, 6));
    this.scale[2] = vec3.length(this.scaleCurve.subarray(6, 9));
}

Tw2TransformTrack.prototype.FindTracks = function ()
{
    var group = null;
    for (var i = 0; i < this.res.animations.length; ++i)
    {
        for (var j = 0; j < this.res.animations[i].trackGroups.length; ++j)
        {
            if (this.res.animations[i].trackGroups[j].name == this.group)
            {
                this.duration = this.res.animations[i].duration;
                group = this.res.animations[i].trackGroups[j];
                break;
            }
        }
    }
    if (!group)
    {
        return;
    }
    for (var i = 0; i < group.transformTracks.length; ++i)
    {
        if (this.name == group.transformTracks[i].name)
        {
            this.positionCurve = group.transformTracks[i].position;
            this.orientationCurve = group.transformTracks[i].orientation;
            this.scaleCurve = group.transformTracks[i].scaleShear;
            break;
        }
    }
}