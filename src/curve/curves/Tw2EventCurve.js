import {Tw2CurveKey, Tw2Curve} from './Tw2Curve';

/**
 * Tw2EventKey
 *
 * @property {string} value
 * @class
 */
export class Tw2EventKey extends Tw2CurveKey
{

    value = '';

}


/**
 * Tw2EventCurve
 *
 * @property {string} value
 * @property {Array.<Tw2EventKey>} keys
 * @property {number} extrapolation
 * @property {number} _time
 * @property {number} _currentKey
 * @property {number} _length
 * @class
 */
export class Tw2EventCurve extends Tw2Curve
{

    value = '';
    keys = [];
    extrapolation = 0;
    _time = 0;
    _currentKey = 0;
    _length = 0;


    /**
     * Sorts the curve's keys
     */
    Sort()
    {
        if (this.keys.length)
        {
            this.keys.sort(Tw2Curve.Compare);
            this._length = this.keys[this.keys.length - 1].time;
        }
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
     * Gets a value at the given time
     * @param {number} time
     */
    UpdateValue(time)
    {
        if (this._length <= 0)
        {
            return this.value;
        }

        let before = this._time;
        this._time = time;
        if (this._time < before)
        {
            this._currentKey = 0;
        }

        if (this.extrapolation === Tw2EventCurve.Extrapolation.CYCLE)
        {
            let now = this._time % this._length;
            if (now < before) this._currentKey = 0;
            this._time = now;
        }

        while (this._currentKey < this.keys.length && this._time >= this.keys[this._currentKey].time)
        {
            this.value = this.keys[this._currentKey].value;
            ++this._currentKey;
        }
    }

    /**
     * The curve's key dimension
     * @type {number}
     */
    static dimension = 1;

    /**
     * The curve's output dimension
     * @type {number}
     */
    static outputDimension = 1;

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
     * @type {Tw2EventKey}
     */
    static Key = Tw2EventKey;

    /**
     * Extrapolation types
     * @type {{NONE: number, CYCLE: number}}
     */
    static Extrapolation = {
        NONE: 0,
        CYCLE: 3
    };

}
