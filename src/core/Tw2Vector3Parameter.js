import {util, vec3} from '../math';

/**
 * Tw2Vector3Parameter
 * @param {string} [name='']
 * @param {vec3|Float32Array} [value=[1,1,1]]
 * @property {string} name
 * @property {vec3|Float32Array} value
 * @property {Float32Array} constantBuffer
 * @property {number} offset
 * @constructor
 */
export function Tw2Vector3Parameter(name, value)
{
    this.name = name !== 'undefined' ? name : '';
    this.value = value !== undefined ? vec3.clone(value) : vec3.fromValues(1, 1, 1);
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
Tw2Vector3Parameter.prototype.Bind = function(constantBuffer, offset, size)
{
    if (this.constantBuffer !== null || size < 3)
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
Tw2Vector3Parameter.prototype.Unbind = function()
{
    this.constantBuffer = null;
};

/**
 * Sets a supplied value
 * @param {vec3|Float32Array} value - Vector3 Array
 * @prototype
 */
Tw2Vector3Parameter.prototype.SetValue = function(value)
{
    vec3.copy(this.value, value);
    if (this.constantBuffer !== null)
    {
        this.constantBuffer.set(this.value, this.offset);
    }
};

/**
 * Updates the constant buffer to the current value
 * @prototype
 */
Tw2Vector3Parameter.prototype.OnValueChanged = function()
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
Tw2Vector3Parameter.prototype.Apply = function(constantBuffer, offset)
{
    constantBuffer.set(this.value, offset);
};

/**
 * Gets the current value array
 * @return {vec3|Float32Array} Vector3 Array
 * @prototype
 */
Tw2Vector3Parameter.prototype.GetValue = function()
{
    if (this.constantBuffer !== null)
    {
        return vec3.clone(this.constantBuffer.subarray(this.offset, this.offset + this.value.length));
    }

    return vec3.clone(this.value);
};

/**
 * Returns a value from a specific index of the value array
 * @param {number} index
 * @returns {number}
 * @throw Invalid Index
 * @prototype
 */
Tw2Vector3Parameter.prototype.GetIndexValue = function(index)
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
Tw2Vector3Parameter.prototype.SetIndexValue = function(index, value)
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
Tw2Vector3Parameter.prototype.FillWith = function(value)
{
    this.SetValue([value, value, value]);
};

/**
 * Checks if a value is a valid parameter input
 * @param {*} value
 * @returns {boolean}
 */
Tw2Vector3Parameter.is = function(value)
{
    return util.isArrayLike(value) && value.length === 3;
};