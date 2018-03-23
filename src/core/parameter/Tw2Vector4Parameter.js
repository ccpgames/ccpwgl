import {vec4} from '../../math';

/**
 * Tw2Vector4Parameter
 * @param {string} [name='']
 * @param {vec4|Float32Array} [value=[1,1,1,1]]
 * @property {string} name
 * @property {vec4|Float32Array} value
 * @property {Float32Array} constantBuffer
 * @property {number} offset
 * @constructor
 */
export function Tw2Vector4Parameter(name, value)
{
    this.name = name !== 'undefined' ? name : '';
    this.value = value !== undefined ? vec4.clone(value) : vec4.fromValues(1, 1, 1);
    this.constantBuffer = null;
    this.offset = 0;
}

/**
 * Bind
 * @param {Float32Array} constantBuffer
 * @param {number} offset
 * @param {number} size
 * @returns {boolean}
 * @prototype
 */
Tw2Vector4Parameter.prototype.Bind = function(constantBuffer, offset, size)
{
    if (this.constantBuffer !== null || size < 4)
    {
        return false;
    }
    this.constantBuffer = constantBuffer;
    this.offset = offset;
    this.Apply(this.constantBuffer, this.offset, size);
    return true;
};

/**
 * Unbind
 * @prototype
 */
Tw2Vector4Parameter.prototype.Unbind = function()
{
    this.constantBuffer = null;
};

/**
 * Sets a supplied value
 * @param {vec4|Float32Array|Array} value - Vector4 Array
 * @prototype
 */
Tw2Vector4Parameter.prototype.SetValue = function(value)
{
    vec4.copy(this.value, value);
    if (this.constantBuffer !== null)
    {
        this.constantBuffer.set(this.value, this.offset);
    }
};

/**
 * Updates the constant buffer to the current value
 * @prototype
 */
Tw2Vector4Parameter.prototype.OnValueChanged = function()
{
    if (this.constantBuffer !== null)
    {
        this.constantBuffer.set(this.value, this.offset);
    }
};

/**
 * Applies the current value to the supplied constant buffer at the supplied offset
 * @param {Float32Array} constantBuffer
 * @param {number} offset
 * @prototype
 */
Tw2Vector4Parameter.prototype.Apply = function(constantBuffer, offset)
{
    constantBuffer.set(this.value, offset);
};

/**
 * Gets the current value array
 * @return {vec4|Float32Array} Vector4 Array
 * @prototype
 */
Tw2Vector4Parameter.prototype.GetValue = function()
{
    if (this.constantBuffer !== null)
    {
        return vec4.clone(this.constantBuffer.subarray(this.offset, this.offset + this.value.length));
    }

    return vec4.clone(this.value);
};

/**
 * Returns a value from a specific index of the value array
 * @param {number} index
 * @returns {number}
 * @throw Invalid Index
 * @prototype
 */
Tw2Vector4Parameter.prototype.GetIndexValue = function(index)
{
    if (typeof this.value[index] === 'undefined')
    {
        throw 'Invalid Index';
    }

    if (this.constantBuffer !== null)
    {
        return this.constantBuffer[this.offset + index];
    }

    return this.value[index];
};

/**
 * Sets a value at a specific index of the value array
 * @param {number} index
 * @param {number} value
 * @throw Invalid Index
 * @prototype
 */
Tw2Vector4Parameter.prototype.SetIndexValue = function(index, value)
{
    if (typeof this.value[index] === 'undefined')
    {
        throw 'Invalid Index';
    }

    this.value[index] = value;

    if (this.constantBuffer !== null)
    {
        this.constantBuffer[this.offset + index] = value;
    }
};

/**
 * Sets all value array elements to a single value
 * @param {number} value - The value to fill the value array elements with
 * @prototype
 */
Tw2Vector4Parameter.prototype.FillWith = function(value)
{
    this.SetValue([value, value, value, value]);
};
