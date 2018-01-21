import {Tw2Curve} from '../curves';

/**
 * Tw2MayaScalarCurve
 *
 * @property {number} index
 * @property {null|Tw2MayaAnimationEngine} animationEngine
 * @property {number} value
 * @property {number} _length
 * @class
 */
export class Tw2MayaScalarCurve extends Tw2Curve
{
    constructor()
    {
        super();
        this.index = -1;
        this.animationEngine = null;
        this.value = 0;
        this._length = 0;
    }

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
        return this._length;
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
        if (this.index >= 0) this._length = this.animationEngine.GetLength(this.index);
    }
}

/**
 * The curve's dimension
 * @type {number}
 */
Tw2MayaScalarCurve.outputDimension = 1;

/**
 * The curve's current value property
 * @type {string}
 */
Tw2MayaScalarCurve.valueProperty = 'value';

/**
 * The curve's type
 * @type {number}
 */
Tw2MayaScalarCurve.curveType = Tw2Curve.Type.CURVE_MAYA;