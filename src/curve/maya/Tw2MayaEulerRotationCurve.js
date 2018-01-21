import {vec3, quat} from '../../math';
import {Tw2Curve} from '../curves';

/**
 * Tw2MayaEulerRotationCurve
 *
 * @property {number} xIndex
 * @property {number} yIndex
 * @property {number} zIndex
 * @property {?Tw2MayaAnimationEngine} animationEngine
 * @property {string} name
 * @property {vec3} eulerValue
 * @property {boolean} updateQuaternion
 * @property {quat} quatValue
 * @property {number} _length
 * @class
 */
export class Tw2MayaEulerRotationCurve extends Tw2Curve
{
    constructor()
    {
        super();
        this.xIndex = -1;
        this.yIndex = -1;
        this.zIndex = -1;
        this.animationEngine = null;
        this.eulerValue = vec3.create();
        this.updateQuaternion = false;
        this.quatValue = quat.create();
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
            if (this.xIndex)
            {
                this.eulerValue[0] = this.animationEngine.Evaluate(this.xIndex, time);
            }

            if (this.yIndex)
            {
                if (this.yIndex === this.xIndex)
                {
                    this.eulerValue[1] = this.eulerValue[0];
                }
                else
                {
                    this.eulerValue[1] = this.animationEngine.Evaluate(this.yIndex, time);
                }
            }

            if (this.zIndex)
            {
                if (this.zIndex === this.xIndex)
                {
                    this.eulerValue[2] = this.eulerValue[0];
                }
                else
                {
                    this.eulerValue[2] = this.animationEngine.Evaluate(this.zIndex, time);
                }
            }

            if (this.updateQuaternion)
            {
                const
                    sinYaw = Math.sin(this.eulerValue[0] / 2),
                    cosYaw = Math.cos(this.eulerValue[0] / 2),
                    sinPitch = Math.sin(this.eulerValue[1] / 2),
                    cosPitch = Math.cos(this.eulerValue[1] / 2),
                    sinRoll = Math.sin(this.eulerValue[2] / 2),
                    cosRoll = Math.cos(this.eulerValue[2] / 2);

                this.quatValue[0] = sinYaw * cosPitch * sinRoll + cosYaw * sinPitch * cosRoll;
                this.quatValue[1] = sinYaw * cosPitch * cosRoll - cosYaw * sinPitch * sinRoll;
                this.quatValue[2] = cosYaw * cosPitch * sinRoll - sinYaw * sinPitch * cosRoll;
                this.quatValue[3] = cosYaw * cosPitch * cosRoll + sinYaw * sinPitch * sinRoll;
            }
        }
    }

    /**
     * Computes curve Length
     */
    ComputeLength()
    {
        if (!this.animationEngine || this.animationEngine.GetNumberOfCurves() === 0) return;

        this._length = 0;
        if (this.xIndex >= 0)
        {
            this._length = this.animationEngine.GetLength(this.xIndex);
        }

        if (this.yIndex >= 0)
        {
            this._length = Math.max(this._length, this.animationEngine.GetLength(this.yIndex));
        }

        if (this.zIndex >= 0)
        {
            this._length = Math.max(this._length, this.animationEngine.GetLength(this.zIndex));
        }
    }
}

/**
 * The curve's dimension
 * @type {number}
 */
Tw2MayaEulerRotationCurve.outputDimension = 3;

/**
 * The curve's current value property
 * @type {string}
 */
Tw2MayaEulerRotationCurve.valueProperty = 'eulerValue';

/**
 * The curve's type
 * @type {number}
 */
Tw2MayaEulerRotationCurve.curveType = Tw2Curve.Type.CURVE_MAYA;