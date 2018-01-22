import {Tw2CurveKey, Tw2Curve} from './Tw2Curve';

/**
 * Tw2ScalarKey2
 *
 * @property {number} value
 * @property {number} leftTangent
 * @property {number} rightTangent
 * @property {number} interpolation
 * @class
 */
export class Tw2ScalarKey2 extends Tw2CurveKey
{
    constructor()
    {
        super();
        this.value = 0;
        this.leftTangent = 0;
        this.rightTangent = 0;
        this.interpolation = 1;
    }
}


/**
 * Tw2ScalarCurve2
 *
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
 * @property {number} _length
 * @class
 */
export class Tw2ScalarCurve2 extends Tw2Curve
{
    constructor()
    {
        super();
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
        this._length = 0;
    }

    /**
     * Sorts the curve's keys
     */
    Sort()
    {
        Tw2Curve.Sort2(this);
    }
    
    /**
     * Gets the curve's length
     * @returns {number}
     */
    GetLength()
    {
        return this._length;
    }

    /**
     * Updates the current value at the given time
     * @param {number} time
     */
    UpdateValue(time)
    {
        this.currentValue = this.GetValueAt(time);
    }

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @returns {number}
     */
    GetValueAt(time)
    {
        time = time / this.timeScale + this.timeOffset;
        if (this._length <= 0 || time <= 0)
        {
            return this.startValue;
        }

        if (time > this._length)
        {
            if (this.cycle)
            {
                time = time % this._length;
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
            time = this._length - time;
        }

        if (this.keys.length === 0)
        {
            return this.Interpolate(time, null, null);
        }

        let startKey = this.keys[0];
        if (time <= startKey.time)
        {
            return this.Interpolate(time, null, startKey);
        }
        else if (time >= this.keys[this.keys.length - 1].time)
        {
            return this.Interpolate(time, this.keys[this.keys.length - 1], null);
        }

        let endKey;
        for (let i = 0; i + 1 < this.keys.length; ++i)
        {
            startKey = this.keys[i];
            endKey = this.keys[i + 1];
            if (startKey.time <= time && endKey.time > time) break;
        }

        return this.Interpolate(time, startKey, endKey);
    }

    /**
     * Interpolate
     * @param {number} time
     * @param {Tw2ScalarKey2} lastKey
     * @param {Tw2ScalarKey2} nextKey
     * @returns {number}
     */
    Interpolate(time, lastKey, nextKey)
    {
        let startValue = this.startValue,
            endValue = this.endValue,
            interp = this.interpolation,
            deltaTime = this._length;

        if (lastKey !== null)
        {
            interp = lastKey.interpolation;
            time -= lastKey.time;
        }

        switch (interp)
        {
            case Tw2ScalarCurve2.Interpolation.LINEAR:
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
                    deltaTime = this._length - lastKey.time;
                }
                return startValue + (endValue - startValue) * (time / deltaTime);

            case Tw2ScalarCurve2.Interpolation.HERMITE:
                let inTangent = this.startTangent,
                    outTangent = this.endTangent;

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
                    deltaTime = this._length - lastKey.time;
                }

                const
                    s = time / deltaTime,
                    s2 = s * s,
                    s3 = s2 * s;

                const
                    c2 = -2.0 * s3 + 3.0 * s2,
                    c1 = 1.0 - c2,
                    c4 = s3 - s2,
                    c3 = s + c4 - s2;

                return startValue * c1 + endValue * c2 + inTangent * c3 + outTangent * c4;

            default:
                return this.startValue;
        }
    }
}

/**
 * The curve's key dimension
 * @type {number}
 */
Tw2ScalarCurve2.inputDimension = 1;

/**
 * The curve's dimension
 * @type {number}
 */
Tw2ScalarCurve2.outputDimension = 1;

/**
 * The curve's current value property
 * @type {string}
 */
Tw2ScalarCurve2.valueProperty = 'currentValue';

/**
 * The curve's type
 * @type {number}
 */
Tw2ScalarCurve2.curveType = Tw2Curve.Type.CURVE2;

/**
 * The curve's key constructor
 * @type {Tw2ScalarKey2}
 */
Tw2ScalarCurve2.Key = Tw2ScalarKey2;

/**
 * Interpolation types
 * @type {{CONSTANT: number, LINEAR: number, HERMITE: number}}
 */
Tw2ScalarCurve2.Interpolation = {
    CONSTANT: 0,
    LINEAR: 1,
    HERMITE: 2
};
