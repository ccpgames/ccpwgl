import {quat, util} from '../../global';
import {Tw2Vector4Parameter} from '../parameter';

/**
 * Tw2ValueBinding
 *
 * @property {string|number} _id
 * @property {string} name
 * @property {Object} sourceObject
 * @property {string} sourceAttribute
 * @property {?number} _sourceElement
 * @property {?boolean} sourceIsArray
 * @property {Object} destinationObject
 * @property {string} destinationAttribute
 * @property {?number} _destinationElement
 * @property {?boolean} destinationIsArray
 * @property {number} scale
 * @property {quat} offset
 * @property {null|Function} _copyFunc - The function to use when updating destination attributes
 */
export class Tw2ValueBinding
{
    constructor()
    {
        this._id = util.generateID();
        this.name = '';
        this.sourceObject = null;
        this.sourceAttribute = '';
        this._sourceElement = null;
        this.sourceIsArray = null;
        this.destinationObject = null;
        this.destinationAttribute = '';
        this._destinationElement = null;
        this.destinationIsArray = null;
        this.scale = 1;
        this.offset = quat.create();
        this._copyFunc = null;
    }

    /**
     * Initializes the Value Binding
     */
    Initialize()
    {
        if (!this.sourceObject || this.sourceAttribute === '') return;
        if (!this.destinationObject || this.destinationAttribute === '') return;

        let srcSwizzled = false,
            destSwizzled = false,
            srcSwizzle = this.sourceAttribute.substr(-2);

        if (srcSwizzle === '.x' || srcSwizzle === '.r')
        {
            srcSwizzled = true;
            this._sourceElement = 0;
            this.sourceAttribute = this.sourceAttribute.substr(0, this.sourceAttribute.length - 2);
        }
        else if (srcSwizzle === '.y' || srcSwizzle === '.g')
        {
            srcSwizzled = true;
            this._sourceElement = 1;
            this.sourceAttribute = this.sourceAttribute.substr(0, this.sourceAttribute.length - 2);
        }
        else if (srcSwizzle === '.z' || srcSwizzle === '.b')
        {
            srcSwizzled = true;
            this._sourceElement = 2;
            this.sourceAttribute = this.sourceAttribute.substr(0, this.sourceAttribute.length - 2);
        }
        else if (srcSwizzle === '.w' || srcSwizzle === '.a')
        {
            srcSwizzled = true;
            this._sourceElement = 3;
            this.sourceAttribute = this.sourceAttribute.substr(0, this.sourceAttribute.length - 2);
        }
        else if (this.sourceObject instanceof Tw2Vector4Parameter)
        {
            if (this.sourceAttribute === 'v1')
            {
                srcSwizzled = true;
                this._sourceElement = 0;
                this.sourceAttribute = 'value';
            }
            else if (this.sourceAttribute === 'v2')
            {
                srcSwizzled = true;
                this._sourceElement = 1;
                this.sourceAttribute = 'value';
            }
            else if (this.sourceAttribute === 'v3')
            {
                srcSwizzled = true;
                this._sourceElement = 2;
                this.sourceAttribute = 'value';
            }
            else if (this.sourceAttribute === 'v4')
            {
                srcSwizzled = true;
                this._sourceElement = 3;
                this.sourceAttribute = 'value';
            }
        }

        let destSwizzle = this.destinationAttribute.substr(-2);
        if (destSwizzle === '.x' || destSwizzle === '.r')
        {
            destSwizzled = true;
            this._destinationElement = 0;
            this.destinationAttribute = this.destinationAttribute.substr(0, this.destinationAttribute.length - 2);
        }
        else if (destSwizzle === '.y' || destSwizzle === '.g')
        {
            destSwizzled = true;
            this._destinationElement = 1;
            this.destinationAttribute = this.destinationAttribute.substr(0, this.destinationAttribute.length - 2);
        }
        else if (destSwizzle === '.z' || destSwizzle === '.b')
        {
            destSwizzled = true;
            this._destinationElement = 2;
            this.destinationAttribute = this.destinationAttribute.substr(0, this.destinationAttribute.length - 2);
        }
        else if (destSwizzle === '.w' || destSwizzle === '.a')
        {
            destSwizzled = true;
            this._destinationElement = 3;
            this.destinationAttribute = this.destinationAttribute.substr(0, this.destinationAttribute.length - 2);
        }
        else if (this.destinationObject instanceof Tw2Vector4Parameter)
        {
            if (this.destinationAttribute === 'v1')
            {
                destSwizzled = true;
                this._destinationElement = 0;
                this.destinationAttribute = 'value';
            }
            else if (this.destinationAttribute === 'v2')
            {
                destSwizzled = true;
                this._destinationElement = 1;
                this.destinationAttribute = 'value';
            }
            else if (this.destinationAttribute === 'v3')
            {
                destSwizzled = true;
                this._destinationElement = 2;
                this.destinationAttribute = 'value';
            }
            else if (this.destinationAttribute === 'v4')
            {
                destSwizzled = true;
                this._destinationElement = 3;
                this.destinationAttribute = 'value';
            }
        }

        if (!(this.sourceAttribute in this.sourceObject) || !(this.destinationAttribute in this.destinationObject))
        {
            return;
        }

        this.sourceIsArray = util.isArrayLike(this.sourceObject[this.sourceAttribute]);
        this.destinationIsArray = util.isArrayLike(this.destinationObject[this.destinationAttribute]);

        if (this.sourceIsArray === this.destinationIsArray && typeof this.sourceObject[this.sourceAttribute] === typeof this.destinationObject[this.destinationAttribute])
        {
            if (this.sourceIsArray)
            {
                if (srcSwizzled)
                {
                    if (destSwizzled)
                    {
                        this._copyFunc = Tw2ValueBinding.CopyElementToElement;
                    }
                    else
                    {
                        this._copyFunc = Tw2ValueBinding.ReplicateElement;
                    }
                }
                else
                {
                    if (this.sourceObject[this.sourceAttribute].length <= this.destinationObject[this.destinationAttribute].length)
                    {
                        this._copyFunc = Tw2ValueBinding.CopyArray;
                    }
                    else if (this.sourceObject[this.sourceAttribute].length === 16)
                    {
                        this._copyFunc = Tw2ValueBinding.ExtractPos;
                    }
                }
            }
            else
            {
                this._copyFunc = Tw2ValueBinding.CopyValueToValue;
            }
        }
        else if (this.sourceIsArray && srcSwizzled && util.isNumber(this.destinationObject[this.destinationAttribute]))
        {
            this._copyFunc = Tw2ValueBinding.CopyElementToValue;
        }
        else if (this.destinationIsArray && util.isNumber(this.sourceObject[this.sourceAttribute]))
        {
            if (destSwizzled)
            {
                this._copyFunc = Tw2ValueBinding.CopyValueToElement;
            }
            else
            {
                this._copyFunc = Tw2ValueBinding.ReplicateValue;
            }
        }
        else if (util.isNumber(this.sourceObject[this.sourceAttribute]) && util.isBoolean(this.destinationObject[this.destinationAttribute]))
        {
            this._copyFunc = Tw2ValueBinding.CopyFloatToBoolean;
        }
    }

    /**
     * CopyValue
     * @param {*} [controller=this]
     */
    CopyValue(controller = this)
    {
        if (this._copyFunc)
        {
            this._copyFunc.call(this);
            if ('OnValueChanged' in this.destinationObject)
            {
                this.destinationObject.OnValueChanged(controller, [this.destinationAttribute]);
            }
        }
    }

    /**
     * _CopyValueToValue
     */
    static CopyValueToValue()
    {
        this.destinationObject[this.destinationAttribute] = this.sourceObject[this.sourceAttribute] * this.scale + this.offset[0];
    }

    /**
     * _CopyArray
     */
    static CopyArray()
    {
        let count = Math.min(this.destinationObject[this.destinationAttribute].length, this.sourceObject[this.sourceAttribute].length);
        for (let i = 0; i < count; ++i)
        {
            this.destinationObject[this.destinationAttribute][i] = this.sourceObject[this.sourceAttribute][i] * this.scale + this.offset[i];
        }
    }

    /**
     * _CopyElementToElement
     */
    static CopyElementToElement()
    {
        this.destinationObject[this.destinationAttribute][this._destinationElement] = this.sourceObject[this.sourceAttribute][this._sourceElement] * this.scale + this.offset[0];
    }

    /**
     * _ReplicateValue
     */
    static ReplicateValue()
    {
        for (let i = 0; i < this.destinationObject[this.destinationAttribute].length; ++i)
        {
            this.destinationObject[this.destinationAttribute][i] = this.sourceObject[this.sourceAttribute] * this.scale + this.offset[i];
        }
    }

    /**
     * _CopyArray
     */
    static ReplicateElement()
    {
        for (let i = 0; i < this.destinationObject[this.destinationAttribute].length; ++i)
        {
            this.destinationObject[this.destinationAttribute][i] = this.sourceObject[this.sourceAttribute][this._sourceElement] * this.scale + this.offset[i];
        }
    }

    /**
     * _ExtractPos
     */
    static ExtractPos()
    {
        for (let i = 0; i < this.destinationObject[this.destinationAttribute].length; ++i)
        {
            this.destinationObject[this.destinationAttribute][i] = this.sourceObject[this.sourceAttribute][i + 12] * this.scale + this.offset[i];
        }
    }

    /**
     * _CopyElementToValue
     */
    static CopyElementToValue()
    {
        this.destinationObject[this.destinationAttribute] = this.sourceObject[this.sourceAttribute][this._sourceElement] * this.scale + this.offset[0];
    }

    /**
     * _CopyValueToElement
     */
    static CopyValueToElement()
    {
        this.destinationObject[this.destinationAttribute][this._destinationElement] = this.sourceObject[this.sourceAttribute] * this.scale + this.offset[0];
    }

    /**
     * _CopyFloatToBoolean
     */
    static CopyFloatToBoolean()
    {
        this.destinationObject[this.destinationAttribute] = this.sourceObject[this.sourceAttribute] !== 0;
    }
}
