/**
 * Tw2MayaAnimationEngine
 * TODO: Constructor is missing the prototype `_EvaluteBezier`
 * @property {Array} curves
 * @property {Array} hermiteSegments
 * @property {Array} bezierSegments
 * @property {number} _currentCurveIndex
 * @property _evalCache
 * @constructor
 */
function Tw2MayaAnimationEngine()
{
    this.curves = [];
    this.hermiteSegments = [];
    this.bezierSegments = [];
    this._currentCurveIndex = 0;
    this._evalCache = null;
}

Tw2MayaAnimationEngine.AnimCurveFields = {
    NUM_SEGMENTS: 0,
    SEGMENT_OFFSET: 1,
    END_TIME: 2,
    END_VALUE: 3,
    IN_TANGENT: 4,
    OUT_TANGENT: 5,
    PRE_INFINITY: 6,
    POST_INFINITY: 7,
    IS_WEIGHTED: 8
};

Tw2MayaAnimationEngine.AnimSegment = {
    TIME: 0,
    VALUE: 1
};

Tw2MayaAnimationEngine.HermiteSegment = {
    TIME: 0,
    VALUE: 1,
    COEFF: 2,
    IS_STEP: 3,
    IS_STEP_NEXT: 4
};

Tw2MayaAnimationEngine.BezierSegment = {
    TIME: 0,
    VALUE: 1,
    COEFF: 2,
    POLYY: 3,
    IS_STEP: 4,
    IS_STEP_NEXT: 5,
    IS_LINEAR: 6
};

Tw2MayaAnimationEngine.INFINITY = 0;

/**
 * Evaluate
 * @param curveIndex
 * @param time
 * @returns {*}
 * @prototype
 */
Tw2MayaAnimationEngine.prototype.Evaluate = function(curveIndex, time)
{
    if (this.curves.length <= curveIndex)
    {
        return 0;
    }
    this._currentCurveIndex = curveIndex;
    if (!this._evalCache)
    {
        this._evalCache = new Array(this.curves.length);
        for (var i = 0; i < this._evalCache.length; ++i)
        {
            this._evalCache[i] = -1;
        }
    }

    var animCurve = this.curves[curveIndex];
    var firstSegment = animCurve[Tw2MayaAnimationEngine.AnimCurveFields.SEGMENT_OFFSET];
    var segments = null;

    if (animCurve[Tw2MayaAnimationEngine.AnimCurveFields.IS_WEIGHTED])
    {
        segments = this.bezierSegments;
    }
    else
    {
        segments = this.hermiteSegments;
    }
    if (time < segments[firstSegment][Tw2MayaAnimationEngine.AnimSegment.TIME])
    {
        if (animCurve[Tw2MayaAnimationEngine.AnimCurveFields.PRE_INFINITY] == Tw2MayaAnimationEngine.INFINITY)
        {
            return segments[firstSegment][Tw2MayaAnimationEngine.AnimSegment.VALUE];
        }
        return this._EvaluateInfinities(animCurve, segments, firstSegment, time, true);
    }
    if (time > animCurve[Tw2MayaAnimationEngine.AnimCurveFields.END_TIME])
    {
        if (animCurve[Tw2MayaAnimationEngine.AnimCurveFields.POST_INFINITY] == Tw2MayaAnimationEngine.INFINITY)
        {
            return animCurve[Tw2MayaAnimationEngine.AnimCurveFields.END_VALUE];
        }
        return this._EvaluateInfinities(animCurve, segments, firstSegment, time, false);
    }
    return this._EvaluateImpl(animCurve, segments, firstSegment, time);
};

/**
 * _EvaluateImpl
 * @param animCurve
 * @param segments
 * @param firstSegment
 * @param time
 * @returns {?}
 * @private
 */
Tw2MayaAnimationEngine.prototype._EvaluateImpl = function(animCurve, segments, firstSegment, time)
{
    var withinInterval = false;
    var nextSegment = null;
    var lastSegment = null;
    var index;
    var value = 0;

    if (this._evalCache[this._currentCurveIndex] >= 0)
    {
        lastSegment = firstSegment + this._evalCache[this._currentCurveIndex];
        if (this._evalCache[this._currentCurveIndex] < animCurve[Tw2MayaAnimationEngine.AnimCurveFields.NUM_SEGMENTS - 1] && time > segments[lastSegment][Tw2MayaAnimationEngine.AnimSegment.TIME])
        {
            nextSegment = firstSegment + this._evalCache[this._currentCurveIndex] + 1;
            if (time == segments[nextSegment][Tw2MayaAnimationEngine.AnimSegment.TIME])
            {
                this._evalCache[this._currentCurveIndex]++;
                return segments[nextSegment][Tw2MayaAnimationEngine.AnimSegment.VALUE];
            }
            else if (time < segments[nextSegment][Tw2MayaAnimationEngine.AnimSegment.TIME])
            {
                index = this._evalCache[this._currentCurveIndex] + 1;
                withinInterval = true;
            }
            else
            {
                nextSegment = null;
            }
        }
        else if (this._evalCache[this._currentCurveIndex] > 0 && time < segments[lastSegment][Tw2MayaAnimationEngine.AnimSegment.TIME])
        {
            var prevSegment = firstSegment + this._evalCache[this._currentCurveIndex] - 1;
            if (time > segments[prevSegment][Tw2MayaAnimationEngine.AnimSegment.TIME])
            {
                index = this._evalCache[this._currentCurveIndex];
                withinInterval = true;
            }
            else if (time == segments[prevSegment][Tw2MayaAnimationEngine.AnimSegment.TIME])
            {
                this._evalCache[this._currentCurveIndex]--;
                return segments[prevSegment][Tw2MayaAnimationEngine.AnimSegment.VALUE];
            }
        }
    }

    if (!withinInterval)
    {
        var result = this._Find(animCurve, time, segments, firstSegment);
        index = result[1];
        if (result[0] || index == 0)
        {
            if (index == animCurve[Tw2MayaAnimationEngine.AnimCurveFields.NUM_SEGMENTS])
            {
                index--;
                this._evalCache[this._currentCurveIndex] = index;
                return animCurve[Tw2MayaAnimationEngine.AnimCurveFields.END_VALUE];
            }
            else
            {
                this._evalCache[this._currentCurveIndex] = index;
                return segments[firstSegment + index][Tw2MayaAnimationEngine.AnimSegment.VALUE];
            }
        }
        else if (index == animCurve[Tw2MayaAnimationEngine.AnimCurveFields.NUM_SEGMENTS] + 1)
        {
            this._evalCache[this._currentCurveIndex] = 0;
            return animCurve[Tw2MayaAnimationEngine.AnimCurveFields.END_VALUE];
        }
    }

    if (this._evalCache[this._currentCurveIndex] != index - 1)
    {
        this._evalCache[this._currentCurveIndex] = index - 1;
        lastSegment = firstSegment + this._evalCache[this._currentCurveIndex];
        if (nextSegment == null)
        {
            nextSegment = firstSegment + index;
        }
    }

    if (animCurve[Tw2MayaAnimationEngine.AnimCurveFields.IS_WEIGHTED])
    {
        var bSegment = segments[lastSegment];
        if (bSegment[Tw2MayaAnimationEngine.BezierSegment.IS_STEP])
        {
            return bSegment[Tw2MayaAnimationEngine.BezierSegment.VALUE];
        }
        else if (bSegment[Tw2MayaAnimationEngine.BezierSegment.IS_STEP_NEXT])
        {
            if (nextSegment === null)
            {
                return animCurve[Tw2MayaAnimationEngine.AnimCurveFields.END_VALUE];
            }
            return segments[nextSegment][Tw2MayaAnimationEngine.BezierSegment.VALUE];
        }
        else
        {
            var nextKeyTime = animCurve[Tw2MayaAnimationEngine.AnimCurveFields.END_TIME];
            if (this._evalCache[this._currentCurveIndex] + 1 < animCurve[Tw2MayaAnimationEngine.AnimCurveFields.NUM_SEGMENTS])
            {
                nextKeyTime = segments[nextSegment][Tw2MayaAnimationEngine.BezierSegment.TIME];
            }
            return this._EvaluateBezier(bSegment, time, nextKeyTime);
        }
    }
    else
    {
        var hSegment = segments[lastSegment];
        if (hSegment[Tw2MayaAnimationEngine.HermiteSegment.IS_STEP])
        {
            return hSegment[Tw2MayaAnimationEngine.HermiteSegment.VALUE];
        }
        else if (hSegment[Tw2MayaAnimationEngine.HermiteSegment.IS_STEP_NEXT])
        {
            if (nextSegment === null)
            {
                return animCurve[Tw2MayaAnimationEngine.AnimCurveFields.END_VALUE];
            }
            return segments[nextSegment][Tw2MayaAnimationEngine.HermiteSegment.VALUE];
        }
        else
        {
            return this._EvaluateHermite(hSegment, time);
        }
    }
};

/**
 * _EvaluateHermite
 * @param segment
 * @param time
 * @returns {?}
 * @private
 */
Tw2MayaAnimationEngine.prototype._EvaluateHermite = function(segment, time)
{
    var t = time - segment[Tw2MayaAnimationEngine.HermiteSegment.TIME];
    var coeff = segment[Tw2MayaAnimationEngine.HermiteSegment.COEFF];
    return (t * (t * (t * coeff[0] + coeff[1]) + coeff[2]) + coeff[3]);
};

/**
 * _EvaluateBezier
 * TODO: This function possibly has multiple errors
 * @param segment
 * @param time
 * @param nextKeyTime
 * @returns {?}
 * @private
 */
Tw2MayaAnimationEngine.prototype._EvaluateBezier = function(segment, time, nextKeyTime)
{
    var t, s;

    s = (time - segment[Tw2MayaAnimationEngine.BezierSegment.TIME]) / (nextSegmentTime - segment[Tw2MayaAnimationEngine.BezierSegment.TIME]);

    if (segment[Tw2MayaAnimationEngine.BezierSegment.IS_LINEAR])
    {
        t = s;
    }
    else
    {
        var poly3 = segment[Tw2MayaAnimationEngine.BezierSegment.COEFF][3];
        var poly2 = segment[Tw2MayaAnimationEngine.BezierSegment.COEFF][2];
        var poly1 = segment[Tw2MayaAnimationEngine.BezierSegment.COEFF][1];
        var poly0 = segment[Tw2MayaAnimationEngine.BezierSegment.COEFF][0] - s;
        var roots = [];
        if (polyZeroes(poly, 3, 0.0, 1, 1.0, 1, roots) == 1)
        {
            t = roots[0];
        }
        else
        {
            t = 0.0;
        }
    }
    var poly = segment[Tw2MayaAnimationEngine.BezierSegment.POLYY];
    return (t * (t * (t * poly[3] + poly[2]) + poly[1]) + poly[0]);
};

/**
 * _Find
 * @param animCurve
 * @param time
 * @param segments
 * @param firstSegment
 * @returns {?}
 * @private
 */
Tw2MayaAnimationEngine.prototype._Find = function(animCurve, time, segments, firstSegment)
{
    var len, mid, low, high;

    /* use a binary search to find the key */
    var index = 0;
    len = animCurve[Tw2MayaAnimationEngine.AnimCurveFields.NUM_SEGMENTS] + 1;
    var segment = null;
    var stime = 0.0;

    if (len > 0)
    {
        low = 0;
        high = len - 1;
        do {
            mid = (low + high) >> 1;
            if (mid < (len - 1))
            {
                segment = firstSegment + mid;
                stime = segments[segment][Tw2MayaAnimationEngine.AnimSegment.TIME];
            }
            else
            {
                stime = animCurve[Tw2MayaAnimationEngine.AnimCurveFields.END_TIME];
            }

            if (time < stime)
            {
                high = mid - 1;
            }
            else if (time > stime)
            {
                low = mid + 1;
            }
            else
            {
                index = mid;
                return [true, index];
            }
        } while (low <= high);
        index = low;
    }
    return [false, index];
};

/**
 * Returns the total number of curves
 * @returns {number}
 * @prototype
 */
Tw2MayaAnimationEngine.prototype.GetNumberOfCurves = function()
{
    return this.curves.length;
};

/**
 * Gets specific curve's length
 * @property {number} index
 * @returns {number}
 * @prototype
 */
Tw2MayaAnimationEngine.prototype.GetLength = function(index)
{
    if (index < 0 || index >= this.curves.length)
    {
        return 0;
    }
    var curve = this.curves[index];
    if (curve[Tw2MayaAnimationEngine.AnimCurveFields.IS_WEIGHTED])
    {
        var firstSegment = this.bezierSegments[curve[Tw2MayaAnimationEngine.AnimCurveFields.SEGMENT_OFFSET]];
    }
    else
    {
        var firstSegment = this.hermiteSegments[curve[Tw2MayaAnimationEngine.AnimCurveFields.SEGMENT_OFFSET]];
    }
    return curve[Tw2MayaAnimationEngine.AnimCurveFields.END_TIME] - firstSegment[Tw2MayaAnimationEngine.AnimSegment.TIME];
};

/**
 * ag_horner1
 * @param P
 * @param deg
 * @param s
 * @returns {?}
 */
function ag_horner1(P, deg, s)
{
    var h = P[deg];
    while (--deg >= 0) h = (s * h) + P[deg];
    return (h);
}

/**
 * ag_zeroin2
 * @param a
 * @param b
 * @param fa
 * @param fb
 * @param tol
 * @param pars
 * @returns {?}
 */
function ag_zeroin2(a, b, fa, fb, tol, pars)
{
    var test;
    var c, d, e, fc, del, m, machtol, p, q, r, s;

    /* initialization */
    machtol = 1.192092896e-07;
    var label1 = true;

    /* start iteration */
    while (true)
    {
        if (label1)
        {
            c = a;
            fc = fa;
            d = b - a;
            e = d;
        }
        if (Math.abs(fc) < Math.abs(fb))
        {
            a = b;
            b = c;
            c = a;
            fa = fb;
            fb = fc;
            fc = fa;
        }
        label1 = false;

        /* convergence test */
        del = 2.0 * machtol * Math.abs(b) + 0.5 * tol;
        m = 0.5 * (c - b);
        test = ((Math.abs(m) > del) && (fb != 0.0));
        if (test)
        {
            if ((Math.abs(e) < del) || (Math.abs(fa) <= Math.abs(fb)))
            {
                /* bisection */
                d = m;
                e = d;
            }
            else
            {
                s = fb / fa;
                if (a == c)
                {
                    /* linear interpolation */
                    p = 2.0 * m * s;
                    q = 1.0 - s;
                }
                else
                {
                    /* inverse quadratic interpolation */
                    q = fa / fc;
                    r = fb / fc;
                    p = s * (2.0 * m * q * (q - r) - (b - a) * (r - 1.0));
                    q = (q - 1.0) * (r - 1.0) * (s - 1.0);
                }
                /* adjust the sign */
                if (p > 0.0) q = -q;
                else p = -p;
                /* check if interpolation is acceptable */
                s = e;
                e = d;
                if ((2.0 * p < 3.0 * m * q - Math.abs(del * q)) && (p < Math.abs(0.5 * s * q)))
                {
                    d = p / q;
                }
                else
                {
                    d = m;
                    e = d;
                }
            }
            /* complete step */
            a = b;
            fa = fb;
            if (Math.abs(d) > del) b += d;
            else if (m > 0.0) b += del;
            else b -= del;
            fb = ag_horner1(pars.p, pars.deg, b);
            if (fb * (fc / Math.abs(fc)) > 0.0)
            {
                label1 = true;
            }
        }
        else
        {
            break;
        }
    }
    return (b);
}

/**
 * ag_zeroin
 * @param a
 * @param b
 * @param tol
 * @param pars
 * @returns {?}
 */
function ag_zeroin(a, b, tol, pars)
{
    var fa, fb;

    fa = ag_horner1(pars.p, pars.deg, a);
    if (Math.abs(fa) < 1.192092896e-07) return (a);

    fb = ag_horner1(pars.p, pars.deg, b);
    if (Math.abs(fb) < 1.192092896e-07) return (b);

    return (ag_zeroin2(a, b, fa, fb, tol, pars));
}

/**
 * polyZeroes
 * @param Poly
 * @param deg
 * @param a
 * @param a_closed
 * @param b
 * @param b_closed
 * @param Roots
 * @returns {?}
 */
function polyZeroes(Poly, deg, a, a_closed, b, b_closed, Roots)
{
    var i, left_ok, right_ok, nr, ndr, skip;
    var e, f, s, pe, ps, tol, p, p_x = new Array(22),
        d, d_x = new Array(22),
        dr, dr_x = new Array(22);
    var ply = {
        p: [],
        deg: 0
    };

    e = pe = 0.0;
    f = 0.0;

    for (i = 0; i < deg + 1; ++i)
    {
        f += Math.abs(Poly[i]);
    }
    tol = (Math.abs(a) + Math.abs(b)) * (deg + 1) * 1.192092896e-07;

    /* Zero polynomial to tolerance? */
    if (f <= tol) return (-1);

    p = p_x;
    d = d_x;
    dr = dr_x;
    for (i = 0; i < deg + 1; ++i)
    {
        p[i] = 1.0 / f * Poly[i];
    }

    /* determine true degree */
    while (Math.abs(p[deg]) < tol) deg--;

    /* Identically zero poly already caught so constant fn != 0 */
    nr = 0;
    if (deg == 0) return (nr);

    /* check for linear case */
    if (deg == 1)
    {
        Roots[0] = -p[0] / p[1];
        left_ok = (a_closed) ? (a < Roots[0] + tol) : (a < Roots[0] - tol);
        right_ok = (b_closed) ? (b > Roots[0] - tol) : (b > Roots[0] + tol);
        nr = (left_ok && right_ok) ? 1 : 0;
        if (nr)
        {
            if (a_closed && Roots[0] < a) Roots[0] = a;
            else if (b_closed && Roots[0] > b) Roots[0] = b;
        }
        return nr;
    }
    /* handle non-linear case */
    else
    {
        ply.p = p;
        ply.deg = deg;

        /* compute derivative */
        for (i = 1; i <= deg; i++) d[i - 1] = i * p[i];

        /* find roots of derivative */
        ndr = polyZeroes(d, deg - 1, a, 0, b, 0, dr);
        if (ndr.length == 0) return (0);

        /* find roots between roots of the derivative */
        for (i = skip = 0; i <= ndr; i++)
        {
            if (nr > deg) return (nr);
            if (i == 0)
            {
                s = a;
                ps = ag_horner1(p, deg, s);
                if (Math.abs(ps) <= tol && a_closed) Roots[nr++] = a;
            }
            else
            {
                s = e;
                ps = pe;
            }
            if (i == ndr)
            {
                e = b;
                skip = 0;
            }
            else e = dr[i];
            pe = ag_horner1(p, deg, e);
            if (skip) skip = 0;
            else
            {
                if (Math.abs(pe) < tol)
                {
                    if (i != ndr || b_closed)
                    {
                        Roots[nr++] = e;
                        skip = 1;
                    }
                }
                else if ((ps < 0 && pe > 0) || (ps > 0 && pe < 0))
                {
                    Roots[nr++] = ag_zeroin(s, e, 0.0, ply);
                    if ((nr > 1) && Roots[nr - 2] >= Roots[nr - 1] - tol)
                    {
                        Roots[nr - 2] = (Roots[nr - 2] + Roots[nr - 1]) * 0.5;
                        nr--;
                    }
                }
            }
        }
    }

    return (nr);
}
