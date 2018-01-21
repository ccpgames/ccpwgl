import {vec3} from '../../math';
import {Tw2CurveKey, Tw2Curve} from './Tw2Curve';

/**
 * Tw2Vector3Key
 *
 * @property {number} time
 * @property {vec3} value
 * @property {vec3} leftTangent
 * @property {vec3} rightTangent
 * @property {number} interpolation
 * @class
 */
export class Tw2Vector3Key extends Tw2CurveKey
{
    constructor()
    {
        super();
        this.value = vec3.create();
        this.leftTangent = vec3.create();
        this.rightTangent = vec3.create();
        this.interpolation = 1;
    }
}


/**
 * Tw2Vector3Curve
 *
 * @property {boolean} cycle
 * @property {boolean} reversed
 * @property {number} timeOffset
 * @property {number} timeScale
 * @property {vec3} startValue
 * @property {vec3} currentValue
 * @property {vec3} endValue
 * @property {vec3} startTangent
 * @property {vec3} endTangent
 * @property {number} interpolation
 * @property {Array.<Tw2Vector3Key>} keys
 * @property {number} _length
 * @class
 */
export class Tw2Vector3Curve extends Tw2Curve
{
    constructor()
    {
        super();
        this.cycle = false;
        this.reversed = false;
        this.timeOffset = 0;
        this.timeScale = 1;
        this.startValue = vec3.create();
        this.currentValue = vec3.create();
        this.endValue = vec3.create();
        this.startTangent = vec3.create();
        this.endTangent = vec3.create();
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
        this.GetValueAt(time, this.currentValue);
    }

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @param {vec3} value
     * @returns {vec3}
     */
    GetValueAt(time, value)
    {
        time = time / this.timeScale + this.timeOffset;
        if (this._length <= 0 || time <= 0)
        {
            return vec3.copy(value, this.startValue);
        }

        if (time > this._length)
        {
            if (this.cycle)
            {
                time = time % this._length;
            }
            else if (this.reversed)
            {
                return vec3.copy(value, this.startValue);
            }
            else
            {
                return vec3.copy(value, this.endValue);
            }
        }

        if (this.reversed)
        {
            time = this._length - time;
        }

        if (this.keys.length === 0)
        {
            return this.Interpolate(time, null, null, value);
        }

        let startKey = this.keys[0];
        if (time <= startKey.time)
        {
            return this.Interpolate(time, null, startKey, value);
        }
        else if (time >= this.keys[this.keys.length - 1].time)
        {
            return this.Interpolate(time, this.keys[this.keys.length - 1], null, value);
        }

        let endKey;
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
     * @param {Tw2Vector3Key} lastKey
     * @param {Tw2Vector3Key} nextKey
     * @param {vec3} value
     * @returns {vec3}
     */
    Interpolate(time, lastKey, nextKey, value)
    {
        vec3.copy(value, this.startValue);

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
            case Tw2Vector3Curve.Interpolation.LINEAR:
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

                value[0] = startValue[0] + (endValue[0] - startValue[0]) * (time / deltaTime);
                value[1] = startValue[1] + (endValue[1] - startValue[1]) * (time / deltaTime);
                value[2] = startValue[2] + (endValue[2] - startValue[2]) * (time / deltaTime);
                return value;

            case Tw2Vector3Curve.Interpolation.HERMITE:
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

                value[0] = startValue[0] * c1 + endValue[0] * c2 + inTangent[0] * c3 + outTangent[0] * c4;
                value[1] = startValue[1] * c1 + endValue[1] * c2 + inTangent[1] * c3 + outTangent[1] * c4;
                value[2] = startValue[2] * c1 + endValue[2] * c2 + inTangent[2] * c3 + outTangent[2] * c4;
                return value;

            default:
                return value;
        }
    }
}

/**
 * The curve's child dimension
 * @type {number}
 */
Tw2Vector3Curve.inputDimension = 3;

/**
 * The curve's dimension
 * @type {number}
 */
Tw2Vector3Curve.outputDimension = 3;

/**
 * The curve's current value property
 * @type {string}
 */
Tw2Vector3Curve.valueProperty = 'currentValue';

/**
 * The curve's type
 * @type {number}
 */
Tw2Vector3Curve.curveType = Tw2Curve.Type.CURVE2;

/**
 * The curve's key constructor
 * @type {Tw2Vector3Key}
 */
Tw2Vector3Curve.Key = Tw2Vector3Key;

/**
 * Interpolation types
 * @type {{CONSTANT: number, LINEAR: number, HERMITE: number}}
 */
Tw2Vector3Curve.Interpolation = {
    CONSTANT: 0,
    LINEAR: 1,
    HERMITE: 2
};
