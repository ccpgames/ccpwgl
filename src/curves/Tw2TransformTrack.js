/**
 * Tw2TransformTrack
 * @property {string} name
 * @property {string} resPath
 * @property {Object} res
 * @property {string} group
 * @property {boolean} cycle
 * @property {vec3} translation
 * @property {quat4} rotation
 * @property {vec3} scale
 * @property positionCurve
 * @property orientationCurve
 * @property scaleCurve
 * @property {mat4} _scaleShear
 * @constructor
 */
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

/**
 * Initializes the Curve
 * @prototype
 */
Tw2TransformTrack.prototype.Initialize = function()
{
    if (this.resPath != '')
    {
        this.res = resMan.GetResource(this.resPath);
    }
};

/**
 * Gets curve length
 * @returns {number}
 * @prototype
 */
Tw2TransformTrack.prototype.GetLength = function()
{
    return this.duration;
};

/**
 * EvaluateCurve
 * @param curve
 * @param {number} time
 * @param {Array|vec3|quat4|mat4} value
 * @param {boolean} cycle
 * @param {number} duration
 * @prototype
 */
Tw2TransformTrack.prototype.EvaluateCurve = function(curve, time, value, cycle, duration)
{
    var i;
    var count = curve.knots.length;
    var knot = count - 1;
    var t = 0;
    for (i = 0; i < curve.knots.length; ++i)
    {
        if (curve.knots[i] > time)
        {
            knot = i;
            break;
        }
    }

    if (curve.degree == 0)
    {
        for (i = 0; i < curve.dimension; ++i)
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
        for (i = 0; i < curve.dimension; ++i)
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

        for (i = 0; i < curve.dimension; ++i)
        {
            value[i] = ci_2 * curve.controls[p1 + i] + ci_1 * curve.controls[p2 + i] + ci * curve.controls[p3 + i];
        }
    }
};

/**
 * Updates a value at a specific time
 * @param {number} time
 * @prototype
 */
Tw2TransformTrack.prototype.UpdateValue = function(time)
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
        time = time % this.duration;
    }
    if (time > this.duration || time < 0)
    {
        return;
    }

    this.EvaluateCurve(this.positionCurve, time, this.translation, this.cycle, this.duration);
    this.EvaluateCurve(this.orientationCurve, time, this.rotation, this.cycle, this.duration);
    quat4.normalize(this.rotation);
    this.EvaluateCurve(this.scaleCurve, time, this._scaleShear, this.cycle, this.duration);
    this.scale[0] = vec3.length(this.scaleCurve);
    this.scale[1] = vec3.length(this.scaleCurve.subarray(3, 6));
    this.scale[2] = vec3.length(this.scaleCurve.subarray(6, 9));
};

/**
 * FindTracks
 * @prototype
 */
Tw2TransformTrack.prototype.FindTracks = function()
{
    var i;

    var group = null;
    for (i = 0; i < this.res.animations.length; ++i)
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
    for (i = 0; i < group.transformTracks.length; ++i)
    {
        if (this.name == group.transformTracks[i].name)
        {
            this.positionCurve = group.transformTracks[i].position;
            this.orientationCurve = group.transformTracks[i].orientation;
            this.scaleCurve = group.transformTracks[i].scaleShear;
            break;
        }
    }
};
