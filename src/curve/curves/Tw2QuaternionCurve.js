import {vec4, quat} from '../../global';
import {Tw2CurveKey, Tw2Curve} from './Tw2Curve';

/**
 * Tw2QuaternionKey2
 *
 * @property {quat} value
 * @property {vec4} leftTangent
 * @property {vec4} rightTangent
 * @property {number} interpolation
 * @class
 */
export class Tw2QuaternionKey2 extends Tw2CurveKey
{
    constructor()
    {
        super();
        this.value = quat.create();
        this.leftTangent = vec4.create();
        this.rightTangent = vec4.create();
        this.interpolation = 1;
    }
}


/**
 * Tw2QuaternionCurve
 *
 * @property {boolean} cycle
 * @property {boolean} reversed
 * @property {number} timeOffset
 * @property {number} timeScale
 * @property {quat} startValue
 * @property {quat} currentValue
 * @property {quat} endValue
 * @property {vec4} startTangent
 * @property {vec4} endTangent
 * @property {number} interpolation
 * @property {Array.<Tw2QuaternionKey>} keys
 * @property {number} length
 * @class
 */
export class Tw2QuaternionCurve extends Tw2Curve
{
    constructor()
    {
        super();
        this.cycle = false;
        this.reversed = false;
        this.timeOffset = 0;
        this.timeScale = 1;
        this.startValue = quat.create();
        this.currentValue = quat.create();
        this.endValue = quat.create();
        this.startTangent = vec4.create();
        this.endTangent = vec4.create();
        this.interpolation = 1;
        this.keys = [];
        this.length = 0;
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
     * @param {quat} value
     * @returns {quat}
     */
    GetValueAt(time, value)
    {
        time = time / this.timeScale + this.timeOffset;

        if (this.length <= 0 || time <= 0)
        {
            value[0] = this.startValue[0];
            value[1] = this.startValue[1];
            value[2] = this.startValue[2];
            return value;
        }

        if (time > this.length)
        {
            if (this.cycle)
            {
                time = time % this.length;
            }
            else if (this.reversed)
            {
                value[0] = this.startValue[0];
                value[1] = this.startValue[1];
                value[2] = this.startValue[2];
                return value;
            }
            else
            {
                value[0] = this.endValue[0];
                value[1] = this.endValue[1];
                value[2] = this.endValue[2];
                return value;
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
     * @param {null|Tw2QuaternionKey} lastKey
     * @param {null|Tw2QuaternionKey} nextKey
     * @param {quat} value
     * @returns {*}
     */
    Interpolate(time, lastKey, nextKey, value)
    {
        value[0] = this.startValue[0];
        value[1] = this.startValue[1];
        value[2] = this.startValue[2];

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
            case Tw2QuaternionCurve.Interpolation.SPHERICAL_LINEAR:
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

                quat.slerp(value, startValue, endValue, time / deltaTime);
                return value;

            default:
                return value;
        }
    }
}

/**
 * The curve's key dimension
 * @type {number}
 */
Tw2QuaternionCurve.inputDimension = 4;

/**
 * The curve's dimension
 * @type {number}
 */
Tw2QuaternionCurve.outputDimension = 4;

/**
 * The curve's current value property
 * @type {string}
 */
Tw2QuaternionCurve.valueProperty = 'currentValue';

/**
 * The curve's type
 * @type {number}
 */
Tw2QuaternionCurve.curveType = Tw2Curve.Type.CURVE2;

/**
 * The curve's key constructor
 * @type {Tw2QuaternionKey2}
 */
Tw2QuaternionCurve.Key = Tw2QuaternionKey2;

/**
 * Interpolation types
 * @type {{CONSTANT: number, SPHERICAL_LINEAR: number}}
 */
Tw2QuaternionCurve.Interpolation = {
    CONSTANT: 0,
    SPHERICAL_LINEAR: 4
};