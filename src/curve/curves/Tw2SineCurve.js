import {Tw2Curve} from './Tw2Curve';

/**
 * Tw2SineCurve
 *
 * @property {string} name
 * @property {number} value
 * @property {number} offset
 * @property {number} scale
 * @property {number} speed
 */
export class Tw2SineCurve extends Tw2Curve
{

    value = 0;
    offset = 0;
    scale = 1;
    speed = 1;


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
        return Math.sin(time * Math.PI * 2 * this.speed) * this.scale + this.offset;
    }

    /**
     * THe curve's dimension
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