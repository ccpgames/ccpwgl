import {mat4, util} from '../../math';

/**
 * Tw2MatrixParameter
 * @param {string} [name='']
 * @param {mat4|Float32Array|Array} [value=mat4.create()]
 * @property {string} name
 * @property {mat4|Float32Array} value
 * @property {Float32Array} constantBuffer
 * @property {number} offset
 * @constructor
 */
export function Tw2MatrixParameter(name, value)
{
    this.name = (name !== undefined) ? name : '';
    this.value = (value !== undefined) ? mat4.clone(value) : mat4.create();
    this.constantBuffer = null;
    this.offset = 0;
}

/**
 * Binds the parameter's value to a constant buffer
 * @param {Float32Array} constantBuffer
 * @param {number} offset
 * @param {number} size
 * @returns {boolean}
 * @prototype
 */
Tw2MatrixParameter.prototype.Bind = function(constantBuffer, offset, size)
{
    if (this.constantBuffer !== null || size < 16)
    {
        return false;
    }
    this.constantBuffer = constantBuffer;
    this.offset = offset;
    this.Apply(this.constantBuffer, this.offset, size);
};

/**
 * Unbinds the parameter's constant buffer
 * @prototype
 */
Tw2MatrixParameter.prototype.UnBind = function()
{
    this.constantBuffer = null;
};

/**
 * Sets a supplied value
 * @param {mat4} value
 * @prototype
 */
Tw2MatrixParameter.prototype.SetValue = function(value)
{
    mat4.copy(this.value, value);
    if (this.constantBuffer !== null)
    {
        this.constantBuffer.set(this.value, this.offset);
    }
};

/**
 * Gets the current value
 * @return {mat4|Float32Array}
 * @prototype
 */
Tw2MatrixParameter.prototype.GetValue = function()
{
    if (this.constantBuffer !== null)
    {
        return mat4.clone(this.constantBuffer.subarray(this.offset, this.offset + this.value.length));
    }

    return mat4.clone(this.value);
};

/**
 * Applies the current value to the supplied constant buffer at the supplied offset
 * @param {Float32Array} constantBuffer
 * @param {number} offset
 * @prototype
 */
Tw2MatrixParameter.prototype.Apply = function(constantBuffer, offset)
{
    constantBuffer.set(this.value, offset);
};

/**
 * Updates the constant buffer to the current value
 * @prototype
 */
Tw2MatrixParameter.prototype.OnValueChanged = function()
{
    if (this.constantBuffer !== null)
    {
        this.constantBuffer.set(this.value, this.offset);
    }
};

/**
 * Checks if the parameter's value equals another
 * @param {mat4|Array} value
 * @returns {boolean}
 */
Tw2MatrixParameter.prototype.EqualsValue = function(value)
{
    return mat4.equals(this.value, value);
};

/**
 * Checks if a value is a valid parameter value
 * @param {*} value
 * @returns {boolean}
 */
Tw2MatrixParameter.is = function(value)
{
    return util.isArrayLike(value) && value.length === 16;
};