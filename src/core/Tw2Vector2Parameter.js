/**
 * Tw2Vector2Parameter
 * @param {string} [name='']
 * @param {Array|Float32Array} [value=[1,1]]
 * @property {string} name
 * @property {Float32Array} value
 * @property {Float32Array} constantBuffer
 * @property {number} offset
 * @constructor
 */
function Tw2Vector2Parameter(name, value)
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
        this.value = new Float32Array(value);
    }
    else
    {
        this.value = new Float32Array([1, 1]);
    }
    this.constantBuffer = null;
    this.offset = 0;
}

/**
 * Bind
 * TODO: Identify if @param size should be passed to the `Apply` prototype as it is currently redundant
 * @param {Float32Array} constantBuffer
 * @param {number} offset
 * @param {number} size
 * @returns {boolean}
 * @prototype
 */
Tw2Vector2Parameter.prototype.Bind = function(constantBuffer, offset, size)
{
    if (this.constantBuffer != null || size < 2)
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
Tw2Vector2Parameter.prototype.Unbind = function()
{
    this.constantBuffer = null;
};

/**
 * Sets a supplied value
 * @param {Array} value - Vector2 Array
 * @prototype
 */
Tw2Vector2Parameter.prototype.SetValue = function(value)
{
    this.value.set(value);
    if (this.constantBuffer != null)
    {
        this.constantBuffer.set(this.value, this.offset);
    }
};

/**
 * Updates the constant buffer to the current value
 * @prototype
 */
Tw2Vector2Parameter.prototype.OnValueChanged = function()
{
    if (this.constantBuffer != null)
    {
        this.constantBuffer.set(this.value, this.offset);
    }
};

/**
 * Applies the current value to the supplied constant buffer at the supplied offset
 * TODO: @param size is currently redundant
 * @param {Float32Array} constantBuffer
 * @param {number} offset
 * @param {number} size
 * @prototype
 */
Tw2Vector2Parameter.prototype.Apply = function(constantBuffer, offset, size)
{
    constantBuffer.set(this.value, offset);
};

/**
 * Gets the current value array
 * @return {Float32Array} Vector2 Array
 * @prototype
 */
Tw2Vector2Parameter.prototype.GetValue = function()
{
    if (this.constantBuffer != null)
    {
        return new Float32Array((this.constantBuffer.subarray(this.offset, this.offset + this.value.length)));
    }

    return new Float32Array(this.value);
};

/**
 * Returns a value from a specific index of the value array
 * @param {number} index
 * @returns {number}
 * @throw Invalid Index
 * @prototype
 */
Tw2Vector2Parameter.prototype.GetIndexValue = function(index)
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
 * @param {number} index
 * @param {number} value
 * @throw Invalid Index
 * @prototype
 */
Tw2Vector2Parameter.prototype.SetIndexValue = function(index, value)
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
 * @param {number} value - The value to fill the value array elements with
 * @prototype
 */
Tw2Vector2Parameter.prototype.FillWith = function(value)
{
    this.SetValue([value, value]);
};
