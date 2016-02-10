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
function Tw2MatrixParameter(name, value)
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
        this.value = mat4.create(value);
    }
    else
    {
        this.value = mat4.identity(mat4.create());
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
Tw2MatrixParameter.prototype.Bind = function(constantBuffer, offset, size)
{
    if (this.constantBuffer != null || size < 16)
    {
        return false;
    }
    this.constantBuffer = constantBuffer;
    this.offset = offset;
    this.Apply(this.constantBuffer, this.offset, size);
};

/**
 * Sets a supplied value
 * @param {mat4} value
 * @prototype
 */
Tw2MatrixParameter.prototype.SetValue = function(value)
{
    this.value = mat4.create(value);
    if (this.constantBuffer != null)
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
    if (this.constantBuffer != null)
    {
        return mat4.create(this.constantBuffer.subarray(this.offset, this.offset + this.value.length));
    }

    return mat4.create(this.value);
};

/**
 * Applies the current value to the supplied constant buffer at the supplied offset
 * TODO: @param size is currently redundant
 * @param {Float32Array} constantBuffer
 * @param {number} offset
 * @param {number} size
 * @prototype
 */
Tw2MatrixParameter.prototype.Apply = function(constantBuffer, offset, size)
{
    constantBuffer.set(this.value, offset);
};
