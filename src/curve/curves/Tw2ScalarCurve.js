import {Tw2CurveKey, Tw2Curve} from './Tw2Curve';

/**
 * Tw2ScalarKey
 *
 * @property {number} value
 * @property {number} left
 * @property {number} right
 * @property {number} interpolation
 * @class
 */
export class Tw2ScalarKey extends Tw2CurveKey
{
    constructor()
    {
        super();
        this.value = 0;
        this.left = 0;
        this.right = 0;
        this.interpolation = 0;
    }
}


/**
 * Tw2ScalarCurve
 *
 * @property {number} start
 * @property {number} timeScale
 * @property {number} timeOffset
 * @property {number} value
 * @property {number} extrapolation
 * @property {Array.<Tw2ScalarKey>} keys
 * @property {number} _currentKey
 * @property {number} _length
 * @class
 */
export class Tw2ScalarCurve extends Tw2Curve
{
    constructor()
    {
        super();
        this.start = 0;
        this.timeScale = 1;
        this.timeOffset = 0;
        this.value = 0;
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
        this.value = this.GetValueAt(time);
    }

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @returns {number}
     */
    GetValueAt(time)
    {
        time = time / this.timeScale - this.timeOffset;

        if (this._length === 0)
        {
            return this.value;
        }

        const
            firstKey = this.keys[0],
            lastKey = this.keys[this.keys.length - 1];

        if (time >= lastKey.time)
        {
            switch (this.extrapolation)
            {
                case Tw2ScalarCurve.Extrapolation.NONE:
                    return this.value;

                case Tw2ScalarCurve.Extrapolation.CONSTANT:
                    return lastKey.value;

                case Tw2ScalarCurve.Extrapolation.GRADIENT:
                    return lastKey.value + (time - lastKey.time) * lastKey.right;

                default:
                    time = time % lastKey.time;
            }
        }
        else if (time < 0 || time < firstKey.time)
        {
            switch (this.extrapolation)
            {
                case Tw2ScalarCurve.Extrapolation.NONE:
                    return this.value;

                case Tw2ScalarCurve.Extrapolation.GRADIENT:
                    return firstKey.value + (time * this._length - lastKey.time) * firstKey.left;

                default:
                    return firstKey.value;
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
            case Tw2ScalarCurve.Interpolation.CONSTANT:
                return ck_1.value;

            case Tw2ScalarCurve.Interpolation.LINEAR:
                return ck_1.value * (1 - nt) + ck.value * nt;

            case Tw2ScalarCurve.Interpolation.HERMITE:
                const
                    k3 = 2 * nt * nt * nt - 3 * nt * nt + 1,
                    k2 = -2 * nt * nt * nt + 3 * nt * nt,
                    k1 = nt * nt * nt - 2 * nt * nt + nt,
                    k0 = nt * nt * nt - nt * nt;
                return k3 * ck_1.value + k2 * ck.value + k1 * ck_1.right + k0 * ck.left;

            default:
                const
                    sq = Math.sqrt(ck_1.value / ck.value),
                    exponent = Math.exp(-time / ck_1.right),
                    ret = (1.0 + (sq - 1.0) * exponent);
                return ret * ret * ck.value;
        }
    }
}

/**
 * The curve's key dimension
 * @type {number}
 */
Tw2ScalarCurve.inputDimension = 1;

/**
 * The curve's dimension
 * @type {number}
 */
Tw2ScalarCurve.outputDimension = 1;

/**
 * The curve's current value property
 * @type {string}
 */
Tw2ScalarCurve.valueProperty = 'value';

/**
 * The curve's type
 * @type {number}
 */
Tw2ScalarCurve.curveType = Tw2Curve.Type.CURVE;

/**
 * The curve's key constructor
 * @type {Tw2ScalarKey}
 */
Tw2ScalarCurve.Key = Tw2ScalarKey;

/**
 * Extrapolation types
 * @type {{NONE: number, CONSTANT: number, GRADIENT: number, CYCLE: number}}
 */
Tw2ScalarCurve.Extrapolation = {
    NONE: 0,
    CONSTANT: 1,
    GRADIENT: 2,
    CYCLE: 3
};

/**
 * Interpolation types
 * @type {{NONE: number, CONSTANT: number, LINEAR: number, HERMITE: number, CATMULROM: number}}
 */
Tw2ScalarCurve.Interpolation = {
    NONE: 0,
    CONSTANT: 1,
    LINEAR: 2,
    HERMITE: 3,
    CATMULROM: 4
};