/**
 * Tw2TransformParameter
 * @param {string} [name='']
 * @parameter {string} name
 * @parameter {vec3} scaling=[1,1,1]
 * @parameter {quat} rotation=[0,0,0,1]
 * @parameter {vec3} translation=[0,0,0]
 * @parameter {mat4} worldTransform
 * @constructor
 */
function Tw2TransformParameter(name)
{
    if (typeof(name) != 'undefined')
    {
        this.name = name;
    }
    else
    {
        this.name = '';
    }
    this.scaling = vec3.one();
    this.rotationCenter = vec3.create();
    this.rotation = quat.create();
    this.translation = vec3.create();
    this.worldTransform = mat4.create();
}

/**
 * Initializes the transform parameter
 */
Tw2TransformParameter.prototype.Initialize = function()
{
    this.OnModified();
};

/**
 * Updates the transform parameter's properties
 */
Tw2TransformParameter.prototype.OnModified = function()
{
    mat4.fromRotationTranslationScaleOrigin(this.worldTransform, this.rotation, this.translation, this.scaling, this.rotationCenter);
    mat4.transpose(this.worldTransform, this.worldTransform);
};

/**
 * Bind
 * @param {Float32Array} constantBuffer
 * @param {number} offset
 * @param {number} size
 * @returns {boolean}
 */
Tw2TransformParameter.prototype.Bind = function(constantBuffer, offset, size)
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
 * A function that should be called when any of the transform parameter's properties have been changed
 */
Tw2TransformParameter.prototype.OnValueChanged = function()
{
    this.OnModified();
};

/**
 * Apply
 * @param {Float32Array} constantBuffer
 * @param {number} offset
 * @param {number} size
 */
Tw2TransformParameter.prototype.Apply = function(constantBuffer, offset, size)
{
    if (size >= 16)
    {
        constantBuffer.set(this.worldTransform, offset);
    }
    else
    {
        constantBuffer.set(this.worldTransform.subarray(0, size), offset);
    }
};
