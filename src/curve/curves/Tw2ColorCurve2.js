import {vec4} from '../../global';
import {Tw2CurveKey, Tw2Curve} from './Tw2Curve';

/**
 * Tw2ColorKey2
 *
 * @property {number} time
 * @property {vec4} value
 * @property {vec4} leftTangent
 * @property {vec4} rightTangent
 * @property {number} interpolation
 * @class
 */
export class Tw2ColorKey2 extends Tw2CurveKey
{

    value = vec4.create();
    leftTangent = vec4.create();
    rightTangent = vec4.create();
    interpolation = 1;

}


/**
 * Tw2ColorCurve2
 *
 * @property {boolean} cycle
 * @property {boolean} reversed
 * @property {number} timeOffset
 * @property {number} timeScale
 * @property {vec4} startValue=[0,0,0,1]
 * @property {vec4} currentValue=[0,0,0,1]
 * @property {vec4} endValue=[0,0,0,1]
 * @property {vec4} startTangent
 * @property {vec4} endTangent
 * @property {number} interpolation
 * @property {Array.<Tw2ColorKey2>} keys
 * @class
 */
export class Tw2ColorCurve2 extends Tw2Curve
{

    cycle = false;
    reversed = false;
    timeOffset = 0;
    timeScale = 1;
    startValue = vec4.fromValues(0, 0, 0, 1);
    currentValue = vec4.fromValues(0, 0, 0, 1);
    endValue = vec4.fromValues(0, 0, 0, 1);
    startTangent = vec4.create();
    endTangent = vec4.create();
    interpolation = 1;
    keys = [];
    length = 0;


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
        return this.length;
    }

    /**
     * Updates the current value at the given time
     * @param {number} time
     */
    UpdateValue(time)
    {
        this.GetValueAt(time, this.currentValue);
    }

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @param {vec4} value
     * @returns {vec4}
     */
    GetValueAt(time, value)
    {
        time = time / this.timeScale + this.timeOffset;
        if (this.length <= 0 || time <= 0)
        {
            return vec4.copy(value, this.startValue);
        }

        if (time > this.length)
        {
            if (this.cycle)
            {
                time = time % this.length;
            }
            else if (this.reversed)
            {
                return vec4.copy(value, this.startValue);
            }
            else
            {
                return vec4.copy(value, this.endValue);
            }
        }

        if (this.reversed)
        {
            time = this.length - time;
        }

        if (this.keys.length === 0)
        {
            return this.Interpolate(time, null, null, value);
        }

        let startKey = this.keys[0],
            endKey = this.keys[this.keys.length - 1];

        if (time <= startKey.time)
        {
            return this.Interpolate(time, null, startKey, value);
        }
        else if (time >= endKey.time)
        {
            return this.Interpolate(time, endKey, null, value);
        }

        for (let i = 0; i + 1 < this.keys.length; ++i)
        {
            startKey = this.keys[i];
            endKey = this.keys[i + 1];
            if (startKey.time <= time && endKey.time > time) break;
        }

        return this.Interpolate(time, startKey, endKey, value);
    }

    /**
     * Interpolate
     * @param {number} time
     * @param {Tw2ColorKey2} lastKey
     * @param {Tw2ColorKey2} nextKey
     * @param {vec4} value
     * @returns {vec4} value
     */
    Interpolate(time, lastKey, nextKey, value)
    {
        vec4.copy(value, this.startValue);

        let startValue = this.startValue,
            endValue = this.endValue,
            interp = this.interpolation,
            deltaTime = this.length;

        if (lastKey !== null)
        {
            interp = lastKey.interpolation;
            time -= lastKey.time;
        }

        switch (interp)
        {
            case Tw2ColorCurve2.Interpolation.LINEAR:
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
                value[2] = startValue[2] + (endValue[2] - startValue[2]) * (time / deltaTime);
                value[3] = startValue[3] + (endValue[3] - startValue[3]) * (time / deltaTime);
                return value;

            default:
                return value;
        }
    }


    /**
     * The curve's key dimension
     * @type {number}
     */
    static inputDimension = 4;

    /**
     * The curve's dimension
     * @type {number}
     */
    static outputDimension = 4;

    /**
     * The curve's current value property
     * @type {string}
     */
    static valueProperty = 'currentValue';

    /**
     * The curve's type
     * @type {number}
     */
    static curveType = Tw2Curve.Type.CURVE2;

    /**
     * The curve's key constructor
     * @type {Tw2ColorKey2}
     */
    static Key = Tw2ColorKey2;

    /**
     * Interpolation types
     * @type {{CONSTANT: number, LINEAR: number}}
     */
    static Interpolation = {
        CONSTANT: 0,
        LINEAR: 1
    };

}
