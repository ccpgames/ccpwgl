/**
 * Converts a quat to vec3
 * @param {quat4} quat
 * @return {vec3}
 */
function quatToEuler(quat)
{
    var euler = vec3.create([0,0,0]);
    var qx = parseFloat(quat[0]);
    var qy = parseFloat(quat[1]);
    var qz = parseFloat(quat[2]);
    var qw = parseFloat(quat[3]);
    var qw2 = qw * qw;
    var qx2 = qx * qx;
    var qy2 = qy * qy;
    var qz2 = qz * qz;
    var test = qx * qy + qz * qw;
    if (test > 0.499)
    {
        euler[0] = 0;
        euler[1] = 360 / Math.PI * Math.atan2(qx, qw);
        euler[2] = 90;
        return euler;
    }
    if (test < -0.499)
    {
        euler[0] = 0;
        euler[1] = -360 / Math.PI * Math.atan2(qx, qw);
        euler[2] = -90;
        return euler;
    }

    var h = Math.atan2(2 * qy * qw - 2 * qx * qz, 1 - 2 * qy2 - 2 * qz2);
    var a = Math.asin(2 * qx * qy + 2 * qz * qw);
    var b = Math.atan2(2 * qx * qw - 2 * qy * qz, 1 - 2 * qx2 - 2 * qz2);
    euler[0] = Math.round(b * 180 / Math.PI);
    euler[1] = Math.round(h * 180 / Math.PI);
    euler[2] = Math.round(a * 180 / Math.PI);
    return euler;
}

/**
 *  Converts a vec3 to quat4
 *  @array {vec3} euler
 *  @return {quat4}
 */
function eulerToQuat(euler)
{
    var quat = quat4.create([0, 0, 0, 0]);
    var b = parseFloat(euler[0]) * Math.PI / 360;
    var h = parseFloat(euler[1]) * Math.PI / 360;
    var a = parseFloat(euler[2]) * Math.PI / 360;
    var c1 = Math.cos(h);
    var c2 = Math.cos(a);
    var c3 = Math.cos(b);
    var s1 = Math.sin(h);
    var s2 = Math.sin(a);
    var s3 = Math.sin(b);
    quat[0] = Math.round((s1 * s2 * c3 + c1 * c2 * s3) * 100000) / 100000;
    quat[1] = Math.round((s1 * c2 * c3 + c1 * s2 * s3) * 100000) / 100000;
    quat[2] = Math.round((c1 * s2 * c3 - s1 * c2 * s3) * 100000) / 100000;
    quat[3] = Math.round((c1 * c2 * c3 - s1 * s2 * s3) * 100000) / 100000;
    return quat;
}

/**
 * Tw2TransformParameter
 * @param {string} [name='']
 * @parameter {string} name
 * @parameter {vec3} scaling=[1,1,1]
 * @parameter {quat4} rotation=[0,0,0,1]
 * @parameter {vec3} translation=[0,0,0]
 * @parameter {mat4} worldTransform
 * @parameter {mat4} _transform
 * @parameter {mat4} target
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
    this._transform = mat4.identity(mat4.create());
    this._target = null;
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

    this._transform.set(this.worldTransform);
    mat4.transpose(this.worldTransform);
    
    if (this._target)
    {
        this.target.setTransform(this._transform);
    }
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

/**
 * Sets an optional target spaceObject
 * @param {{}}} spaceObject
 * @returns {boolean} 
 */
Tw2TransformParameter.prototype.SetTarget = function(spaceObject)
{
    if ('setTransform' in spaceObject)
    {
        this._target = spaceObject;
        return true;
    }
    return false;
}

/**
 * Gets the target
 * @returns {{}}} 
 */
Tw2TransformParameter.prototype.GetTarget = function()
{
    return this._target;
}

/**
 * Clears the target
 */
Tw2TransformParameter.prototype.RemoveTarget = function()
{
    this._target = null;
}


/**
 * Sets scale
 * @param {vec3} vec3
 */
Tw2TransformParameter.prototype.SetScale = function(vec3)
{     
    this.scaling.set(vec3);
    this.OnModified();
}

/**
 * Gets scale
 * @return {vec3}
 */
Tw2TransformParameter.prototype.GetScale = function()
{     
    return vec3.create(this.scaling);
}

/**
 * Sets position
 * @param {vec3} vec3
 */
Tw2TransformParameter.prototype.SetPosition = function(vec3)
{     
    this.translation.set(vec3);
    this.OnModified();
}

/**
 * Gets position
 * @return {vec3}
 */
Tw2TransformParameter.prototype.GetPosition = function()
{     
    return vec3.create(this.translation);
}
 
/**
 * Sets rotation from a vec3
 * @param {vec3} vec3
 */
Tw2TransformParameter.prototype.SetRotation = function(vec3)
{
    this.rotation.set(eulerToQuat(vec3));
    this.OnModified();
}

/**
 * Gets rotation as a vec3
 * @return {vec3}
 */
Tw2TransformParameter.prototype.GetRotation = function()
{     
    return vec3.create(quatToEuler(this.rotation));
}

/**
 * Sets rotation from a quat4
 * @param {vec3} 
 */
Tw2TransformParameter.prototype.SetOrientation = function(quat4)
{
    this.rotation.set(quat4);
    this.OnModified();
}

/**
 * Gets rotation as a quat4
 * @param {quat4} 
 */
Tw2TransformParameter.prototype.GetOrientation = function()
{
    return quat4.create(this.rotation);
}

/**
 * Sets rotation center
 * @param {vec3} vec3
 */
Tw2TransformParameter.prototype.SetCenter = function(vec3)
{
    this.rotationCenter.set(vec3);
    this.OnModified();
}

/**
 * Gets rotation center
 * @return {vec3} 
 */
Tw2TransformParameter.prototype.GetCenter = function()
{
    return vec3.create(this.rotationCenter);
}

/**
 * Gets current transform
 * @return {vec3} 
 */
Tw2TransformParameter.prototype.GetTransform = function()
{
    return mat4.create(this._transform);
}

/**
 * Gets current worldtransform
 * @return {vec3} 
 */
Tw2TransformParameter.prototype.GetWorld = function()
{
    return mat4.create(this.worldTransform);
}
