import {curve, util, vec4} from '../../math';

/**
 * Tw2MayaAnimationEngine
 * TODO: Complete the prototype `_EvaluteBezier`
 *
 * @property {number|string} id
 * @property {Array} curves
 * @property {Array} hermiteSegments
 * @property {Array} bezierSegments
 * @property {number} _currentCurveIndex
 * @property _evalCache
 */
export class Tw2MayaAnimationEngine
{
    constructor()
    {
        this._id = util.generateID();
        this.curves = [];
        this.hermiteSegments = [];
        this.bezierSegments = [];
        this._currentCurveIndex = 0;
        this._evalCache = null;
    }

    /**
     * Evaluate
     * @param curveIndex
     * @param time
     * @returns {*}
     */
    Evaluate(curveIndex, time)
    {
        if (this.curves.length <= curveIndex) return 0;

        this._currentCurveIndex = curveIndex;
        if (!this._evalCache)
        {
            this._evalCache = new Array(this.curves.length);
            for (let i = 0; i < this._evalCache.length; ++i) this._evalCache[i] = -1;
        }

        let animCurve = this.curves[curveIndex];
        let firstSegment = animCurve[Tw2MayaAnimationEngine.AnimCurveFields.SEGMENT_OFFSET];
        let segments = null;

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
            if (animCurve[Tw2MayaAnimationEngine.AnimCurveFields.PRE_INFINITY] === Tw2MayaAnimationEngine.INFINITY)
            {
                return segments[firstSegment][Tw2MayaAnimationEngine.AnimSegment.VALUE];
            }
            return this._EvaluateInfinities(animCurve, segments, firstSegment, time, true);
        }

        if (time > animCurve[Tw2MayaAnimationEngine.AnimCurveFields.END_TIME])
        {
            if (animCurve[Tw2MayaAnimationEngine.AnimCurveFields.POST_INFINITY] === Tw2MayaAnimationEngine.INFINITY)
            {
                return animCurve[Tw2MayaAnimationEngine.AnimCurveFields.END_VALUE];
            }
            return this._EvaluateInfinities(animCurve, segments, firstSegment, time, false);
        }

        return this._EvaluateImpl(animCurve, segments, firstSegment, time);
    }

    /**
     * _EvaluateImpl
     * @param animCurve
     * @param segments
     * @param firstSegment
     * @param time
     * @returns {*}
     */
    _EvaluateImpl(animCurve, segments, firstSegment, time)
    {
        let withinInterval = false,
            nextSegment = null,
            lastSegment = null,
            index;

        if (this._evalCache[this._currentCurveIndex] >= 0)
        {
            lastSegment = firstSegment + this._evalCache[this._currentCurveIndex];
            if (this._evalCache[this._currentCurveIndex] < animCurve[Tw2MayaAnimationEngine.AnimCurveFields.NUM_SEGMENTS - 1] && time > segments[lastSegment][Tw2MayaAnimationEngine.AnimSegment.TIME])
            {
                nextSegment = firstSegment + this._evalCache[this._currentCurveIndex] + 1;
                if (time === segments[nextSegment][Tw2MayaAnimationEngine.AnimSegment.TIME])
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
                let prevSegment = firstSegment + this._evalCache[this._currentCurveIndex] - 1;
                if (time > segments[prevSegment][Tw2MayaAnimationEngine.AnimSegment.TIME])
                {
                    index = this._evalCache[this._currentCurveIndex];
                    withinInterval = true;
                }
                else if (time === segments[prevSegment][Tw2MayaAnimationEngine.AnimSegment.TIME])
                {
                    this._evalCache[this._currentCurveIndex]--;
                    return segments[prevSegment][Tw2MayaAnimationEngine.AnimSegment.VALUE];
                }
            }
        }

        if (!withinInterval)
        {
            let result = this._Find(animCurve, time, segments, firstSegment);
            index = result[1];
            if (result[0] || index === 0)
            {
                if (index === animCurve[Tw2MayaAnimationEngine.AnimCurveFields.NUM_SEGMENTS])
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
            else if (index === animCurve[Tw2MayaAnimationEngine.AnimCurveFields.NUM_SEGMENTS] + 1)
            {
                this._evalCache[this._currentCurveIndex] = 0;
                return animCurve[Tw2MayaAnimationEngine.AnimCurveFields.END_VALUE];
            }
        }

        if (this._evalCache[this._currentCurveIndex] !== index - 1)
        {
            this._evalCache[this._currentCurveIndex] = index - 1;
            lastSegment = firstSegment + this._evalCache[this._currentCurveIndex];
            if (nextSegment === null) nextSegment = firstSegment + index;
        }

        if (animCurve[Tw2MayaAnimationEngine.AnimCurveFields.IS_WEIGHTED])
        {
            let bSegment = segments[lastSegment];
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
                let nextKeyTime = animCurve[Tw2MayaAnimationEngine.AnimCurveFields.END_TIME];
                if (this._evalCache[this._currentCurveIndex] + 1 < animCurve[Tw2MayaAnimationEngine.AnimCurveFields.NUM_SEGMENTS])
                {
                    nextKeyTime = segments[nextSegment][Tw2MayaAnimationEngine.BezierSegment.TIME];
                }
                return this._EvaluateBezier(bSegment, time, nextKeyTime);
            }
        }
        else
        {
            let hSegment = segments[lastSegment];
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
    }

    /* eslint-disable no-unused-vars */

    /**
     * A static helper function to evaluate the infinity portion of an animation curve.
     * The infinity portion is the parts of the animation curve outside the range of keys.
     * @param curve - The animation curve to evaluate
     * @param segments
     * @param startSegment
     * @param {time} time
     * @param {boolean} bool - false: evaluate the post-infinity portion, true: evaluate the pre-infinity portion
     */

    _EvaluateInfinities(curve, segments, startSegment, time, bool)
    {

        throw new Error('_EvaluateInfinities not implemented');

    }

    /* eslint-enable no-unused-vars */

    /**
     * _EvaluateHermite
     * @param segment
     * @param time
     * @returns {*}
     */
    _EvaluateHermite(segment, time)
    {
        let t = time - segment[Tw2MayaAnimationEngine.HermiteSegment.TIME];
        let coeff = segment[Tw2MayaAnimationEngine.HermiteSegment.COEFF];
        return (t * (t * (t * coeff[0] + coeff[1]) + coeff[2]) + coeff[3]);
    }

    /**
     * _EvaluateBezier
     * @param segment
     * @param time
     * @param nextSegmentTime
     * @returns {*}
     */
    _EvaluateBezier(segment, time, nextSegmentTime)
    {
        let t, s;

        s = (time - segment[Tw2MayaAnimationEngine.BezierSegment.TIME]) / (nextSegmentTime - segment[Tw2MayaAnimationEngine.BezierSegment.TIME]);

        if (segment[Tw2MayaAnimationEngine.BezierSegment.IS_LINEAR])
        {
            t = s;
        }
        else
        {
            let poly = vec4.create();
            poly[3] = segment[Tw2MayaAnimationEngine.BezierSegment.COEFF][3];
            poly[2] = segment[Tw2MayaAnimationEngine.BezierSegment.COEFF][2];
            poly[1] = segment[Tw2MayaAnimationEngine.BezierSegment.COEFF][1];
            poly[0] = segment[Tw2MayaAnimationEngine.BezierSegment.COEFF][0] - s;
            let roots = [];
            if (curve.polyZeroes(poly, 3, 0.0, 1, 1.0, 1, roots) === 1) t = roots[0];
            else t = 0.0;
        }

        let poly = segment[Tw2MayaAnimationEngine.BezierSegment.POLYY];
        return (t * (t * (t * poly[3] + poly[2]) + poly[1]) + poly[0]);
    }

    /**
     * _Find
     * @param animCurve
     * @param time
     * @param segments
     * @param firstSegment
     * @returns {*}
     */
    _Find(animCurve, time, segments, firstSegment)
    {
        let len, mid, low, high;

        /* use a binary search to find the key */
        let index = 0;
        len = animCurve[Tw2MayaAnimationEngine.AnimCurveFields.NUM_SEGMENTS] + 1;
        let segment = null;
        let stime = 0.0;

        if (len > 0)
        {
            low = 0;
            high = len - 1;
            do
            {
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
    }

    /**
     * Returns the total number of curves
     * @returns {number}
     */
    GetNumberOfCurves()
    {
        return this.curves.length;
    }

    /**
     * Gets specific curve's length
     * @property {number} index
     * @returns {number}
     */
    GetLength(index)
    {
        if (index < 0 || index >= this.curves.length) return 0;
        let curve = this.curves[index];
        let firstSegment;

        if (curve[Tw2MayaAnimationEngine.AnimCurveFields.IS_WEIGHTED])
        {
            firstSegment = this.bezierSegments[curve[Tw2MayaAnimationEngine.AnimCurveFields.SEGMENT_OFFSET]];
        }
        else
        {
            firstSegment = this.hermiteSegments[curve[Tw2MayaAnimationEngine.AnimCurveFields.SEGMENT_OFFSET]];
        }

        return curve[Tw2MayaAnimationEngine.AnimCurveFields.END_TIME] - firstSegment[Tw2MayaAnimationEngine.AnimSegment.TIME];
    }
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
