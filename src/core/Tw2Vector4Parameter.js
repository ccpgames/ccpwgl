/**
 * Tw2Vector4Parameter
 * @param {string} [name='']
 * @param {quat4|Float32Array} [value=[1,1,1,1]]
 * @property {string} name
 * @property {quat4} value
 * @property {Array} constantBuffer
 * @property {Number} offset
 * @constructor
 */
function Tw2Vector4Parameter(name, value)
{
    if (typeof(name) != 'undefined')
    {
        this.name = name;
    }
    else
    {
        this.name = '';
    }
    if (typeof(value) != 'undefined')
    {
        this.value = quat4.create(value);
    }
    else
    {
        this.value = quat4.create([1, 1, 1, 1]);
    }
    this.constantBuffer = null;
    this.offset = 0;
}

/**
 * Bind
 * @param {Float32Array} constantBuffer
 * @param {Number} offset
 * @param {Number} size
 * @returns {Boolean}
 */
Tw2Vector4Parameter.prototype.Bind = function(constantBuffer, offset, size)
{
    if (this.constantBuffer != null || size < 4)
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
 */
Tw2Vector4Parameter.prototype.Unbind = function()
{
    this.constantBuffer = null;
};

/**
 * Sets a supplied value
 * @param {quat4|Float32Array|Array} value
 */
Tw2Vector4Parameter.prototype.SetValue = function(value)
{
    this.value.set(value);
    if (this.constantBuffer != null)
    {
        this.constantBuffer.set(this.value, this.offset);
    }
};

/**
 * Updates the constant buffer to the current value
 */
Tw2Vector4Parameter.prototype.OnValueChanged = function()
{
    if (this.constantBuffer != null)
    {
        this.constantBuffer.set(this.value, this.offset);
    }
};

/**
 * Applies the current value to the supplied constant buffer at the supplied offset
 * @param {Float32Array} constantBuffer
 * @param {Number} offset
 * @param {Number} size
 */
Tw2Vector4Parameter.prototype.Apply = function(constantBuffer, offset, size)
{
    constantBuffer.set(this.value, offset);
};

/**
 * Gets the current value array
 * @return {quat4} Vector4 Array
 */
Tw2Vector4Parameter.prototype.GetValue = function()
{
    if (this.constantBuffer != null)
    {
        return quat4.create(this.constantBuffer.subarray(this.offset, this.offset + this.value.length));
    }

    return quat4.create(this.value);
};

/**
 * Returns a value from a specific index of the value array
 * @param {Number} index
 * @returns {Number}
 * @throw Invalid Index
 */
Tw2Vector4Parameter.prototype.GetIndexValue = function(index)
{
    if (typeof this.value[index] === 'undefined')
    {
        throw "Invalid Index";
    }

    if (this.constantBuffer != null)
    {
        return this.constantBuffer[this.offset + index];
    }

    return this.value[index];
};

/**
 * Sets a value at a specific index of the value array
 * @param {Number} index
 * @param {Number} value
 * @throw Invalid Index
 *
 */
Tw2Vector4Parameter.prototype.SetIndexValue = function(index, value)
{
    if (typeof this.value[index] === 'undefined')
    {
        throw "Invalid Index";
    }

    this.value[index] = value;

    if (this.constantBuffer != null)
    {
        this.constantBuffer[this.offset + index] = value;
    }
};

/**
 * Sets all value array elements to a single value
 * @param {Number} value - The value to fill the value array elements with
 *
 */
Tw2Vector4Parameter.prototype.FillWith = function(value)
{
    this.SetValue([value, value, value, value]);
};
