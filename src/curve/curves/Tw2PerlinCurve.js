import {noise} from '../../global';
import {Tw2Curve} from './Tw2Curve';

/**
 * Tw2PerlinCurve
 *
 * @property {number} start
 * @property {number} speed
 * @property {number} alpha
 * @property {number} beta
 * @property {number} offset
 * @property {number} scale
 * @property {number} N
 * @property {number} _startOffset
 * @class
 */
export class Tw2PerlinCurve extends Tw2Curve
{

    value = 0;
    start = 0;
    speed = 1;
    alpha = 1.1;
    beta = 2;
    offset = 0;
    scale = 1;
    N = 3;
    _startOffset = Math.random() * 100;


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
        time -= this._startOffset;
        return ((noise.perlin1D(time * this.speed, this.alpha, this.beta, this.N) + 1) / 2) * this.scale + this.offset;
    }

    /**
     * The curve's dimension
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
    static curveType = Tw2Curve.Type.CURVE_NO_KEYS;

}
