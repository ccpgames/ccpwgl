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
    constructor()
    {
        super();
        this.value = 0;
        this.min = 0;
        this.max = 1;
        this.hold = true;
    }

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
}

/**
 * The curve's dimension
 * @type {number}
 */
Tw2RandomConstantCurve.outputDimension = 1;

/**
 * The curve's current value property
 * @type {string}
 */
Tw2RandomConstantCurve.valueProperty = 'value';

/**
 * The curve's type
 * @type {number}
 */
Tw2RandomConstantCurve.curveType = Tw2Curve.Type.CURVE_NO_KEYS;