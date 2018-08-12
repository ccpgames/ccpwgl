import {Tw2Parameter} from './Tw2Parameter';
import {util} from '../../global';

/**
 * Tw2FloatParameter
 *
 * @param {string} [name='']
 * @param {number} [value=1]
 * @property {string} name
 * @property {number} value
 * @property {?Float32Array} constantBuffer
 * @property {?number} offset
 * @class
 */
export class Tw2FloatParameter extends Tw2Parameter
{
    constructor(name = '', value = 1)
    {
        super(name);
        this.value = util.isArrayLike(value) ? value[0] : value;
        this.constantBuffer = null;
        this.offset = null;
    }

    /**
     * Sets the parameter's value
     * @param {number} value
     * @returns {boolean} true if updated
     */
    SetValue(value)
    {
        this.value = value;
        this.OnValueChanged();
    }

    /**
     * Gets the parameter's value
     * @returns {number}
     */
    GetValue()
    {
        return this.value;
    }

    /**
     * Applies the parameter's value to a constant buffer
     * @param {Float32Array} constantBuffer
     * @param {number} offset
     */
    Apply(constantBuffer, offset)
    {
        constantBuffer[offset] = this.value;
    }

    /**
     * Checks if a value equals the parameter's value
     * @param {number} value
     * @returns {boolean}
     */
    EqualsValue(value)
    {
        return this.value === value;
    }

    /**
     * Copies another float parameter's value
     * @param {Tw2FloatParameter} parameter
     * @param {boolean} [includeName]
     */
    Copy(parameter, includeName)
    {
        if (includeName) this.name = parameter.name;
        this.SetValue(parameter.GetValue());
    }

    /**
     * Checks if a value is a valid parameter value
     * @param {number} a
     * @returns {boolean}
     */
    static isValue(a)
    {
        return util.isNumber(a);
    }
}

/**
 * Float parameter's constant buffer size
 * @type {number}
 */
Tw2FloatParameter.constantBufferSize = 1;
