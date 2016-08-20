/**
 * Tw2MatrixParameter
 * @param {string} [name='']
 * @param {mat4|Float32Array|Array} [value=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]]
 * @property {string} name
 * @property {mat4} value
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
        this.value = mat4.clone(value);
    }
    else
    {
        this.value = mat4.create();
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
 */
Tw2MatrixParameter.prototype.SetValue = function(value)
{
    mat4.copy(this.value, value);
    if (this.constantBuffer != null)
    {
        this.constantBuffer.set(this.value, this.offset);
    }
};

/**
 * Gets the current value
 * @return {mat4}
 */
Tw2MatrixParameter.prototype.GetValue = function()
{
    if (this.constantBuffer != null)
    {
        return mat4.fromArray(this.constantBuffer.subarray(this.offset, this.offset + this.value.length));
    }

    return mat4.clone(this.value);
};

/**
 * Applies the current value to the supplied constant buffer at the supplied offset
 * @param {Float32Array} constantBuffer
 * @param {number} offset
 * @param {number} size - Unused
 */
Tw2MatrixParameter.prototype.Apply = function(constantBuffer, offset, size)
{
    constantBuffer.set(this.value, offset);
};
