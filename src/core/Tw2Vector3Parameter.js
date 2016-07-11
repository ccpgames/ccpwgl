/**
 * Tw2Vector3Parameter
 * @param {string} [name='']
 * @param {vec3|Array|Float32Array} [value=[1,1,1]]
 * @property {string} name
 * @property {vec3} value
 * @property {Float32Array} constantBuffer
 * @property {number} offset
 * @constructor
 */
function Tw2Vector3Parameter(name, value)
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
        this.value = vec3.clone(value);
    }
    else
    {
        this.value = vec3.one();
    }
    this.constantBuffer = null;
    this.offset = 0;
}

/**
 * Bind
 * @param {Float32Array} constantBuffer
 * @param {number} offset
 * @param {number} size
 * @returns {boolean}
 */
Tw2Vector3Parameter.prototype.Bind = function(constantBuffer, offset, size)
{
    if (this.constantBuffer != null || size < 3)
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
Tw2Vector3Parameter.prototype.Unbind = function()
{
    this.constantBuffer = null;
};

/**
 * Sets a supplied value
 * @param {vec3|Float32Array} value - Vector3 Array
 */
Tw2Vector3Parameter.prototype.SetValue = function(value)
{
    vec3.copy(this.value, value);
    if (this.constantBuffer != null)
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
    if (this.constantBuffer != null)
    {
        this.constantBuffer.set(this.value, this.offset);
    }
};

/**
 * Applies the current value to the supplied constant buffer at the supplied offset
 * @param {Float32Array} constantBuffer
 * @param {number} offset
 * @param {number} size - unused
 */
Tw2Vector3Parameter.prototype.Apply = function(constantBuffer, offset, size)
{
    constantBuffer.set(this.value, offset);
};

/**
 * Gets the current value array
 * @return {vec3} Vector3 Array
 */
Tw2Vector3Parameter.prototype.GetValue = function()
{
    if (this.constantBuffer != null)
    {
        return vec3.fromArray(this.constantBuffer.subarray(this.offset, this.offset + this.value.length));
    }

    return vec3.clone(this.value);
};

/**
 * Returns a value from a specific index of the value array
 * @param {number} index
 * @returns {number}
 * @throw Invalid Index
 */
Tw2Vector3Parameter.prototype.GetIndexValue = function(index)
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
 */
Tw2Vector3Parameter.prototype.SetIndexValue = function(index, value)
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
 */
Tw2Vector3Parameter.prototype.FillWith = function(value)
{
    this.SetValue([value, value, value]);
};
