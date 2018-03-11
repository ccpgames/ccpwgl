import { util } from '../../math';

/**
 * A Tw2 Parameter
 * @typedef {(Tw2FloatParameter|Tw2TextureParameter|Tw2VariableParameter|Tw2Vector2Parameter|Tw2Vector3Parameter|Tw2Vector4Parameter|Tw2MatrixParameter)} Parameter
 */

/**
 * Tw2FloatParameter
 * @param {string} [name='']
 * @param {number} [value=1]
 * @property {string} name
 * @property {number} value
 * @property {null|Array} constantBuffer
 * @property {null|number} offset
 * @constructor
 */
export function Tw2FloatParameter(name, value)
{
    if (typeof(name) !== 'undefined')
    {
        this.name = name;
    }
    else
    {
        this.name = '';
    }
    if (typeof(value) !== 'undefined')
    {
        if (util.isArrayLike(value))
        {
            this.value = value[0];
        }
        else
        {
            this.value = value;
        }
    }
    else
    {
        this.value = 1;
    }
    this.constantBuffer = null;
    this.offset = null;
}

/**
 * Binds the parameter to a constant buffer
 * @param {Array} constantBuffer
 * @param {number} offset
 * @param {number} [size=] - unused
 * @returns {boolean}
 * @prototype
 */
Tw2FloatParameter.prototype.Bind = function(constantBuffer, offset, size)
{
    if (this.constantBuffer !== null || size < 1)
    {
        return false;
    }
    this.constantBuffer = constantBuffer;
    this.offset = offset;
    this.Apply(this.constantBuffer, this.offset, size);
};

/**
 * Unbinds the parameter from it's constant buffer
 * @prototype
 */
Tw2FloatParameter.prototype.Unbind = function()
{
    this.constantBuffer = null;
};

/**
 * Updates the constant buffer to the current value
 * @prototype
 */
Tw2FloatParameter.prototype.OnValueChanged = function()
{
    if (this.constantBuffer !== null)
    {
        this.constantBuffer[this.offset] = this.value;
    }
};

/**
 * Applies the current value to the supplied constant buffer at the supplied offset
 * @param {Array} constantBuffer
 * @param {number} offset
 * @prototype
 */
Tw2FloatParameter.prototype.Apply = function(constantBuffer, offset)
{
    constantBuffer[offset] = this.value;
};

/**
 * Gets the current value
 * @prototype
 */
Tw2FloatParameter.prototype.GetValue = function()
{
    if (this.constantBuffer !== null)
    {
        return this.constantBuffer[this.offset];
    }

    return this.value;
};

/**
 * Sets a supplied value
 * @prototype
 */
Tw2FloatParameter.prototype.SetValue = function(value)
{
    this.value = value;
    if (this.constantBuffer !== null)
    {
        this.constantBuffer[this.offset] = this.value;
    }
};

/**
 * Checks if the parameter's value equals a supplied value
 * @param {number} value
 * @returns {boolean}
 */
Tw2FloatParameter.prototype.EqualsValue = function(value)
{
    return value === this.GetValue();
};

/**
 * Checks if a value is a valid parameter value
 * @param {*} value
 * @returns {boolean}
 */
Tw2FloatParameter.is = function(value)
{
    return typeof value === 'number';
};