import {vec4} from '../../global';
import {Tw2CurveKey, Tw2Curve} from './Tw2Curve';

/**
 * Tw2ColorKey
 *
 * @property {vec4} value
 * @property {vec4} left
 * @property {vec4} right
 * @property {number} interpolation
 * @class
 */
export class Tw2ColorKey extends Tw2CurveKey
{

    value = vec4.create();
    left = vec4.create();
    right = vec4.create();
    interpolation = 0;

}


/**
 * Tw2ColorCurve
 *
 * @property {number} start
 * @property {vec4} currentValue
 * @property {number} extrapolation
 * @property {Array.<Tw2ColorKey>} keys
 * @property {number} _currentKey
 * @property {number} length
 * @class
 */
export class Tw2ColorCurve extends Tw2Curve
{

    start = 0;
    value = vec4.create();
    extrapolation = 0;
    keys = [];
    _currentKey = 1;
    length = 0;


    /**
     * Sorts the curve's keys
     */
    Sort()
    {
        Tw2Curve.Sort(this);
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
        this.GetValueAt(time, this.value);
    }

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @param {vec4} value
     * @returns {vec4} value
     */
    GetValueAt(time, value)
    {
        if (this.length === 0)
        {
            return vec4.copy(value, this.value);
        }

        const
            firstKey = this.keys[0],
            lastKey = this.keys[this.keys.length - 1];

        if (time >= lastKey.time)
        {
            switch (this.extrapolation)
            {
                case Tw2ColorCurve.Extrapolation.NONE:
                    return vec4.copy(value, this.value);

                case Tw2ColorCurve.Extrapolation.CONSTANT:
                    return vec4.copy(value, lastKey.value);

                case Tw2ColorCurve.Extrapolation.GRADIENT:
                    return vec4.scaleAndAdd(value, lastKey.value, lastKey.right, time - lastKey.time);

                default:
                    time = time % lastKey.time;
            }
        }
        else if (time < 0 || time < firstKey.time)
        {
            switch (this.extrapolation)
            {
                case Tw2ColorCurve.Extrapolation.NONE:
                    return vec4.copy(value, this.value);

                case Tw2ColorCurve.Extrapolation.GRADIENT:
                    return vec4.scaleAndAdd(value, firstKey.value, firstKey.left, time * this.length - lastKey.time);

                default:
                    return vec4.copy(value, firstKey.value);
            }
        }

        let ck = this.keys[this._currentKey],
            ck_1 = this.keys[this._currentKey - 1];

        while ((time >= ck.time) || (time < ck_1.time))
        {
            if (time < ck_1.time) this._currentKey = 0;
            this._currentKey++;
            ck = this.keys[this._currentKey];
            ck_1 = this.keys[this._currentKey - 1];
        }

        const nt = (time - ck_1.time) / (ck.time - ck_1.time);

        switch (ck_1.interpolation)
        {
            case Tw2ColorCurve.Interpolation.CONSTANT:
                return vec4.copy(value, ck_1.value);

            default:
                value[0] = ck_1.value[0] * (1 - nt) + ck.value[0] * nt;
                value[1] = ck_1.value[1] * (1 - nt) + ck.value[1] * nt;
                value[2] = ck_1.value[2] * (1 - nt) + ck.value[2] * nt;
                value[3] = ck_1.value[3] * (1 - nt) + ck.value[3] * nt;
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
    static ouputDimension = 4;

    /**
     * The curve's current value property
     * @type {string}
     */
    static valueProperty = 'value';

    /**
     * The curve's type
     * @type {number}
     */
    static curveType = Tw2Curve.Type.CURVE;

    /**
     * The curve's key constructor
     * @type {Tw2ColorKey}
     */
    static Key = Tw2ColorKey;

    /**
     * Extrapolation types
     * @type {{NONE: number, CONSTANT: number, GRADIENT: number, CYCLE: number}}
     */
    static Extrapolation = {
        NONE: 0,
        CONSTANT: 1,
        GRADIENT: 2,
        CYCLE: 3
    };

    /**
     * Interpolation types
     * @type {{NONE: number, CONSTANT: number, LINEAR: number}}
     */
    static Interpolation = {
        NONE: 0,
        CONSTANT: 1,
        LINEAR: 2
    };

}