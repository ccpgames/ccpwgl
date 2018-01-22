import {vec3} from '../../math';
import {Tw2CurveKey, Tw2Curve} from './Tw2Curve';

/**
 * Tw2VectorKey
 *
 * @property {vec3} value
 * @property {vec3} left
 * @property {vec3} right
 * @property {number} interpolation
 * @inherits Tw2CurveKey
 * @class
 */
export class Tw2VectorKey extends Tw2CurveKey
{
    constructor()
    {
        super();
        this.value = vec3.create();
        this.left = vec3.create();
        this.right = vec3.create();
        this.interpolation = 0;
    }
}


/**
 * Tw2Vector3Curve
 *
 * @property {string} name
 * @property {number} start
 * @property {vec3} value
 * @property {number} extrapolation
 * @property {Array.<Tw2VectorKey>} keys
 * @property {number} _currentKey
 * @property {number} _length
 * @class
 */
export class Tw2VectorCurve extends Tw2Curve
{
    constructor()
    {
        super();
        this.start = 0;
        this.value = vec3.create();
        this.extrapolation = 0;
        this.keys = [];
        this._currentKey = 1;
        this._length = 0;
    }

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
        return this._length;
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
     * @param {vec3} value
     * @returns {vec3}
     */
    GetValueAt(time, value)
    {
        if (this._length === 0)
        {
            return vec3.copy(value, this.value);
        }

        const
            firstKey = this.keys[0],
            lastKey = this.keys[this.keys.length - 1];

        if (time >= lastKey.time)
        {
            switch (this.extrapolation)
            {
                case Tw2VectorCurve.Extrapolation.NONE:
                    return vec3.copy(value, this.value);

                case Tw2VectorCurve.Extrapolation.CONSTANT:
                    return vec3.copy(value, lastKey.value);

                case Tw2VectorCurve.Extrapolation.GRADIENT:
                    return vec3.scaleAndAdd(value, lastKey.value, lastKey.right, time - lastKey.time);

                default:
                    time = time % lastKey.time;
            }
        }
        else if (time < 0 || time < firstKey.time)
        {
            switch (this.extrapolation)
            {
                case Tw2VectorCurve.Extrapolation.NONE:
                    return vec3.copy(value, this.value);

                case Tw2VectorCurve.Extrapolation.GRADIENT:
                    return vec3.scaleAndAdd(value, firstKey.value, firstKey.left, d);

                default:
                    return vec3.copy(value, firstKey.value);
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
            case Tw2VectorCurve.Interpolation.CONSTANT:
                return vec3.copy(value, ck_1.value);

            case Tw2VectorCurve.Interpolation.LINEAR:
                value[0] = ck_1.value[0] * (1 - nt) + ck.value[0] * nt;
                value[1] = ck_1.value[1] * (1 - nt) + ck.value[1] * nt;
                value[2] = ck_1.value[2] * (1 - nt) + ck.value[2] * nt;
                return value;

            case Tw2VectorCurve.Interpolation.HERMITE:
                const
                    k3 = 2 * nt * nt * nt - 3 * nt * nt + 1,
                    k2 = -2 * nt * nt * nt + 3 * nt * nt,
                    k1 = nt * nt * nt - 2 * nt * nt + nt,
                    k0 = nt * nt * nt - nt * nt;

                value[0] = k3 * ck_1.value[0] + k2 * ck.value[0] + k1 * ck_1.right[0] + k0 * ck.left[0];
                value[1] = k3 * ck_1.value[1] + k2 * ck.value[1] + k1 * ck_1.right[1] + k0 * ck.left[1];
                value[2] = k3 * ck_1.value[2] + k2 * ck.value[2] + k1 * ck_1.right[2] + k0 * ck.left[2];
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
Tw2VectorCurve.inputDimension = 3;

/**
 * The curve's dimension
 * @type {number}
 */
Tw2VectorCurve.outputDimension = 3;

/**
 * The curve's current value property
 * @type {string}
 */
Tw2VectorCurve.valueProperty = 'value';

/**
 * The curve's type
 * @type {number}
 */
Tw2VectorCurve.curveType = Tw2Curve.Type.CURVE;

/**
 * The curve's key constructor
 * @type {Tw2VectorKey}
 */
Tw2VectorCurve.Key = Tw2VectorKey;

/**
 * Extrapolation types
 * @type {{NONE: number, CONSTANT: number, GRADIENT: number, CYCLE: number}}
 */
Tw2VectorCurve.Extrapolation = {
    NONE: 0,
    CONSTANT: 1,
    GRADIENT: 2,
    CYCLE: 3
};

/**
 * Interpolation types
 * @type {{NONE: number, CONSTANT: number, LINEAR: number, HERMITE: number}}
 */
Tw2VectorCurve.Interpolation = {
    NONE: 0,
    CONSTANT: 1,
    LINEAR: 2,
    HERMITE: 3
};
