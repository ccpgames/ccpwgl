import {Tw2Curve} from './Tw2Curve';

/**
 * Tw2RandomConstantCurve
 *
 * @property {number} currentValue
 * @property {number} min
 * @property {number} max
 * @property {boolean} hold
 * @class
 */
export class Tw2RandomConstantCurve extends Tw2Curve
{

    value = 0;
    min = 0;
    max = 1;
    hold = true;


    /**
     * Updates the current value at the given time
     */
    UpdateValue()
    {
        this.value = this.GetValueAt();
    }

    /**
     * Gets a value at a specific time
     * @returns {number}
     */
    GetValueAt()
    {
        return this.hold ? this.value : this.min + (this.max - this.min) * Math.random();
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