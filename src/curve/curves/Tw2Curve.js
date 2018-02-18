/* eslint no-unused-vars:0 */
import {vec3, vec4, quat} from '../../math';

/**
 * Tw2CurveKey base class
 *
 * @property {string} name
 * @property {number} time
 * @class
 */
export class Tw2CurveKey
{
    constructor()
    {
        this.name = '';
        this.time = 0;
    }
}


/**
 * Tw2Curve base class
 *
 * @property {string} name
 * @class
 */
export class Tw2Curve
{
    constructor()
    {
        this.name = '';
    }

    /**
     * Initializes the Curve
     */
    Initialize()
    {
        this.Sort();
    }

    /**
     * Sorts the curve
     */
    Sort()
    {

    }

    /**
     * Gets the curve's length
     * @returns {number}
     */
    GetLength()
    {
        return 0;
    }
    
    /**
     * Updates the current value at the given time
     * @param {number} time
     */
    UpdateValue(time)
    {

    }

    /**
     * Compares curve keys
     * @param {Tw2CurveKey} a
     * @param {Tw2CurveKey} b
     * @returns {number}
     */
    static Compare(a, b)
    {
        if (a.time < b.time) return -1;
        if (a.time > b.time) return 1;
        return 0;
    }

    /**
     * Sorts legacy curve keys
     * @param {*} curve
     * @param {Array.<Tw2CurveKey>} [keys=curve.keys] - Optional keys override
     */
    static Sort(curve, keys=curve.keys)
    {
        if (keys && keys.length)
        {
            keys.sort(Tw2Curve.Compare);
            curve.length = keys[keys.length - 1].time;
        }
    }

    /**
     * Sorts curve keys
     * @param {*} curve
     */
    static Sort2(curve)
    {
        if (curve.keys && curve.keys.length)
        {
            curve.keys.sort(Tw2Curve.Compare);
            const back = curve.keys[curve.keys.length - 1];

            if (back.time > curve.length)
            {
                const
                    preLength = curve.length,
                    endValue = curve.endValue,
                    endTangent = curve.endTangent;

                curve.length = back.time;
                curve.endValue = back.value;
                curve.endTangent = back.leftTangent;

                if (preLength > 0)
                {
                    back.time = preLength;
                    back.value = endValue;
                    back.leftTangent = endTangent;
                }
            }
        }
    }
}

/**
 * The curve's key dimension
 * @type {?number}
 */
Tw2Curve.inputDimension = null;

/**
 * The curve's dimension
 * @type {?number}
 */
Tw2Curve.outputDimension = null;

/**
 * The curve's current value property
 * @type {?string}
 */
Tw2Curve.valueProperty = null;

/**
 * The curve's type
 * @type {?number}
 */
Tw2Curve.curveType = null;

/**
 * The curve's Key constructor
 * @type {?Tw2CurveKey}
 */
Tw2Curve.Key = null;

/**
 * Interpolation types
 * @type {?{ string: number}}
 */
Tw2Curve.Interpolation = null;

/**
 * Extrapolation types
 * @type {?{ string: number}}
 */
Tw2Curve.Extrapolation = null;

/**
 * Curve types
 * @type {{CURVE: number, CURVE2: number, CURVE_MAYA: number, SEQUENCER: number, SEQUENCER2: number}}
 */
Tw2Curve.Type = {
    CURVE: 1,
    CURVE2: 2,
    CURVE_MAYA: 3,
    CURVE_NO_KEYS: 4,
    SEQUENCER: 100,
    SEQUENCER2: 101,
};

/**
 * Class globals
 * @type {*}
 */
Tw2Curve.global = {
    vec3_0: vec3.create(),
    vec4_0: vec4.create(),
    quat_0: quat.create(),
    quat_1: quat.create()
};
