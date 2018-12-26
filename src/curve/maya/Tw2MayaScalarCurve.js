import {Tw2Curve} from '../curves';

/**
 * Tw2MayaScalarCurve
 *
 * @property {number} index
 * @property {null|Tw2MayaAnimationEngine} animationEngine
 * @property {number} value
 * @property {number} length
 * @class
 */
export class Tw2MayaScalarCurve extends Tw2Curve
{

    index = -1;
    animationEngine = null;
    value = 0;
    length = 0;


    /**
     * Sorts the curve
     */
    Sort()
    {
        this.ComputeLength();
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
     * Updates a value at a specific time
     * @param {number} time
     */
    UpdateValue(time)
    {
        if (this.animationEngine)
        {
            this.value = this.animationEngine.Evaluate(this.index, time);
        }
    }

    /**
     * Computes curve Length
     */
    ComputeLength()
    {
        if (!this.animationEngine || this.animationEngine.GetNumberOfCurves() === 0) return;
        if (this.index >= 0) this.length = this.animationEngine.GetLength(this.index);
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
    static curveType = Tw2Curve.Type.CURVE_MAYA;

}