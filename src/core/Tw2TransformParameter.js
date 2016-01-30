/**
 * Tw2TransformParameter
 * @param {string} [name='']
 * @parameter {string} name
 * @parameter {vec3} scaling=[1,1,1]
 * @parameter {quat4} rotation=[0,0,0,1]
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
    this.scaling = vec3.create([1, 1, 1]);
    this.rotationCenter = vec3.create([0, 0, 0]);
    this.rotation = quat4.create([0, 0, 0, 1]);
    this.translation = vec3.create([0, 0, 0]);
    this.worldTransform = mat4.identity(mat4.create());
}

/**
 * Initializes the transform parameter
 * @prototype
 */
Tw2TransformParameter.prototype.Initialize = function()
{
    this.OnModified();
};

/**
 * Updates the transform parameter's properties
 * @prototype
 */
Tw2TransformParameter.prototype.OnModified = function()
{
    mat4.identity(this.worldTransform);
    mat4.scale(this.worldTransform, this.scaling);

    var rotationCenter = mat4.create();
    mat4.identity(rotationCenter);
    mat4.translate(rotationCenter, this.rotationCenter);
    var rotationCenterInv = mat4.create();
    mat4.identity(rotationCenterInv);
    mat4.translate(rotationCenterInv, [-this.rotationCenter[0], -this.rotationCenter[1], -this.rotationCenter[2]]);
    
    var rotation = mat4.create();
    rotation[0] = 1.0 - 2.0 * this.rotation[1] * this.rotation[1] - 2 * this.rotation[2] * this.rotation[2];
    rotation[4] = 2 * this.rotation[0] * this.rotation[1] - 2 * this.rotation[2] * this.rotation[3];
    rotation[8] = 2 * this.rotation[0] * this.rotation[2] + 2 * this.rotation[1] * this.rotation[3];
    rotation[1] = 2 * this.rotation[0] * this.rotation[1] + 2 * this.rotation[2] * this.rotation[3];
    rotation[5] = 1 - 2 * this.rotation[0] * this.rotation[0] - 2 * this.rotation[2] * this.rotation[2];
    rotation[9] = 2 * this.rotation[1] * this.rotation[2] - 2 * this.rotation[0] * this.rotation[3];
    rotation[2] = 2 * this.rotation[0] * this.rotation[2] - 2 * this.rotation[1] * this.rotation[3];
    rotation[6] = 2 * this.rotation[1] * this.rotation[2] + 2 * this.rotation[0] * this.rotation[3];
    rotation[10] = 1 - 2 * this.rotation[0] * this.rotation[0] - 2 * this.rotation[1] * this.rotation[1];
    rotation[15] = 1;

    mat4.multiply(this.worldTransform, rotationCenterInv);
    mat4.multiply(this.worldTransform, rotation);
    mat4.multiply(this.worldTransform, rotationCenter);
    mat4.translate(this.worldTransform, this.translation);
    mat4.transpose(this.worldTransform);
};

/**
 * Bind
 * @param {Float32Array} constantBuffer
 * @param {number} offset
 * @param {number} size
 * @returns {boolean}
 * @prototype
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
 * @prototype
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
 * @constructor
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
