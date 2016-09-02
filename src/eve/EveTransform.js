/**
 * EveBasicPerObjectData
 * @parameter perObjectVSData - Vertex shader data
 * @parameter perObjectPSData - Pixel shader data
 * @parameter perObjectFFEData - Fixed Function Emulation data
 * @constructor
 */
function EveBasicPerObjectData()
{}

/**
 * SetPerObjectDataToDevice
 * @param constantBufferHandles
 * @constructor
 */
EveBasicPerObjectData.prototype.SetPerObjectDataToDevice = function(constantBufferHandles)
{
    if (this.perObjectVSData && constantBufferHandles[3])
    {
        device.gl.uniform4fv(constantBufferHandles[3], this.perObjectVSData.data);
    }
    if (this.perObjectPSData && constantBufferHandles[4])
    {
        device.gl.uniform4fv(constantBufferHandles[4], this.perObjectPSData.data);
    }
    if (this.perObjectFFEData && constantBufferHandles[5])
    {
        device.gl.uniform4fv(constantBufferHandles[5], this.perObjectFFEData.data);
    }
};

/**
 * EveTransform
 * @property {String} name
 * @property {Tw2Mesh} mesh
 * @property {Number} Modifier
 * @property {Number} NONE - modifier option
 * @property {Number} BILLBOARD - modifier option
 * @property {Number} TRANSLATE_WITH_CAMERA - modifier option
 * @property {Number} LOOK_AT_CAMERA - modifier option
 * @property {Number} SIMPLE_HALO - modifier option
 * @property {Number} EVE_CAMERA_ROTATION_ALIGNED - modifier option
 * @property {Number} EVE_BOOSTER - modifier option
 * @property {Number} EVE_SIMPLE_HALO - modifier option
 * @property {Number} EVE_CAMERA_ROTATION - modifier option
 * @property {Number} sortValueMultiplier
 * @property {Number} distanceBasedScaleArg1
 * @property {Number} distanceBasedScaleArg2
 * @property {Boolean} useDistanceBasedScale
 * @property {Array.<Tw2ParticleSystem>} particleSystems
 * @property {Array.<Tw2ParticleEmitter>} particleEmitters
 * @property {Array.<Tw2CurveSet>} curveSets
 * @property {Array} children
 * @property {Boolean} display                                      - Enables/ disables all batch accumulations
 * @property {{}} visible                                           - Batch accumulation options for the transforms's elements
 * @property {Boolean} visible.mesh                                 - Enables/ disables mesh batch accumulation
 * @property {Boolean} visible.children                             - Enables/ disables child batch accumulation
 * @property {vec3} scaling
 * @property {vec3} translation
 * @property {quat4} rotation
 * @property {mat4} localTransform
 * @property {mat4} rotationTransform
 * @property {mat4} worldTransform
 * @property {Array.<mat4>} _mat4Cache
 * @property {Array.<vec3>} _vec3Cache
 * @property {EveBasicPerObjectData} _perObjectData
 * @constructor
 */
function EveTransform()
{
    this.name = '';
    this.mesh = null;

    this.NONE = 0;
    this.BILLBOARD = 1;
    this.TRANSLATE_WITH_CAMERA = 2;
    this.LOOK_AT_CAMERA = 3;
    this.SIMPLE_HALO = 4;
    this.EVE_CAMERA_ROTATION_ALIGNED = 100;
    this.EVE_BOOSTER = 101;
    this.EVE_SIMPLE_HALO = 102;
    this.EVE_CAMERA_ROTATION = 103;
    this.modifier = this.NONE;

    this.sortValueMultiplier = 1.0;
    this.distanceBasedScaleArg1 = 0.2;
    this.distanceBasedScaleArg2 = 0.63;
    this.useDistanceBasedScale = false;

    this.particleSystems = [];
    this.particleEmitters = [];
    this.curveSets = [];
    this.children = [];

    this.display = true;
    this.visible = {};
    this.visible.mesh = true;
    this.visible.children = true;

    this.scaling = vec3.create([1, 1, 1]);
    this.translation = vec3.create([0, 0, 0]);
    this.rotation = quat4.create([0, 0, 0, 1]);
    this.localTransform = mat4.create();
    this.rotationTransform = mat4.identity(mat4.create());
    this.worldTransform = mat4.identity(mat4.create());

    this._mat4Cache = [mat4.create(), mat4.create()];
    this._vec3Cache = [];
    for (var i = 0; i < 7; ++i)
    {
        this._vec3Cache[i] = vec3.create();
    }

    this._perObjectData = new EveBasicPerObjectData();
    this._perObjectData.perObjectFFEData = new Tw2RawData();
    this._perObjectData.perObjectFFEData.Declare('World', 16);
    this._perObjectData.perObjectFFEData.Declare('WorldInverseTranspose', 16);
    this._perObjectData.perObjectFFEData.Create();
}

/**
 * Initializes the EveTransform
 */
EveTransform.prototype.Initialize = function()
{
    mat4.identity(this.localTransform);
    mat4.translate(this.localTransform, this.translation);
    mat4.transpose(quat4.toMat4(this.rotation, this.rotationTransform));
    mat4.multiply(this.localTransform, this.rotationTransform, this.localTransform);
    mat4.scale(this.localTransform, this.scaling);
};

/**
 * Gets transform res objects
 * @param {Array} [out=[]] - Optional receiving array
 * @param {Boolean} excludeChildren - True to exclude children's res objects
 * @returns {Array.<Tw2EffectRes|Tw2TextureRes|Tw2GeometryRes>} [out]
 */
EveTransform.prototype.GetResources = function(out, excludeChildren)
{
    if (out === undefined)
    {
        out = [];
    }

    if (this.mesh !== null)
    {
        this.mesh.GetResources(out);
    }

    if (!excludeChildren)
    {
        for (var i = 0; i < this.children; i++)
        {
            this.children[i].GetResources(out);
        }
    }

    return out;
};

/**
 * Gets render batches for accumulation
 * @param {RenderMode} mode
 * @param {Tw2BatchAccumulator} accumulator
 * @param {Tw2PerObjectData} perObjectData
 */
EveTransform.prototype.GetBatches = function(mode, accumulator, perObjectData)
{
    if (!this.display)
    {
        return;
    }

    if (this.visible.mesh && this.mesh != null)
    {
        mat4.transpose(this.worldTransform, this._perObjectData.perObjectFFEData.Get('World'));
        mat4.inverse(this.worldTransform, this._perObjectData.perObjectFFEData.Get('WorldInverseTranspose'));
        if (perObjectData)
        {
            this._perObjectData.perObjectVSData = perObjectData.perObjectVSData;
            this._perObjectData.perObjectPSData = perObjectData.perObjectPSData;
        }
        this.mesh.GetBatches(mode, accumulator, this._perObjectData);
    }

    if (this.visible.children)
    {
        for (var i = 0; i < this.children.length; ++i)
        {
            this.children[i].GetBatches(mode, accumulator, perObjectData);
        }
    }
};

/**
 * Per frame update
 * @param {Number} dt - delta time
 */
EveTransform.prototype.Update = function(dt)
{
    for (var i = 0; i < this.children.length; ++i)
    {
        this.children[i].Update(dt);
    }
    for (var i = 0; i < this.particleEmitters.length; ++i)
    {
        this.particleEmitters[i].Update(dt);
    }
    for (var i = 0; i < this.particleSystems.length; ++i)
    {
        this.particleSystems[i].Update(dt);
    }
    for (var i = 0; i < this.curveSets.length; ++i)
    {
        this.curveSets[i].Update(dt);
    }
};

/**
 * multiply3x3
 */
mat4.multiply3x3 = function(a, b, c)
{
    c || (c = b);
    var d = b[0],
        e = b[1];
    b = b[2];
    c[0] = a[0] * d + a[4] * e + a[8] * b;
    c[1] = a[1] * d + a[5] * e + a[9] * b;
    c[2] = a[2] * d + a[6] * e + a[10] * b;
    return c;
};

/**
 * Per frame update
 * @param {mat4} parentTransform
 */
EveTransform.prototype.UpdateViewDependentData = function(parentTransform)
{
    mat4.identity(this.localTransform);
    mat4.translate(this.localTransform, this.translation);
    mat4.transpose(quat4.toMat4(quat4.normalize(this.rotation), this.rotationTransform));
    mat4.multiply(this.localTransform, this.rotationTransform, this.localTransform);
    mat4.scale(this.localTransform, this.scaling);
    switch (this.modifier)
    {
        case this.BILLBOARD:
        case this.SIMPLE_HALO:
            {
                mat4.multiply(parentTransform, this.localTransform, this.worldTransform);

                var finalScale = this._vec3Cache[0];
                vec3.set(this.scaling, finalScale);
                var parentScaleX = vec3.length(parentTransform);
                var parentScaleY = vec3.length(parentTransform.subarray(4));
                var parentScaleZ = vec3.length(parentTransform.subarray(8));
                finalScale[0] *= parentScaleX;
                finalScale[1] *= parentScaleY;
                finalScale[2] *= parentScaleZ;
                if (this.modifier == this.SIMPLE_HALO)
                {
                    var camPos = device.GetEyePosition();
                    var d = this._vec3Cache[1];
                    vec3.subtract(camPos, this.worldTransform.subarray(12), d);
                    var scale = vec3.dot(vec3.normalize(d), vec3.normalize(this.worldTransform.subarray(8), this._vec3Cache[2]));
                    if (scale < 0)
                    {
                        scale = 0;
                    }
                    vec3.scale(finalScale, scale * scale);
                }
                var invView = device.viewInv;
                this.worldTransform[0] = invView[0] * finalScale[0];
                this.worldTransform[1] = invView[1] * finalScale[0];
                this.worldTransform[2] = invView[2] * finalScale[0];
                this.worldTransform[4] = invView[4] * finalScale[1];
                this.worldTransform[5] = invView[5] * finalScale[1];
                this.worldTransform[6] = invView[6] * finalScale[1];
                this.worldTransform[8] = invView[8] * finalScale[2];
                this.worldTransform[9] = invView[9] * finalScale[2];
                this.worldTransform[10] = invView[10] * finalScale[2];
            }
            break;

        case this.EVE_CAMERA_ROTATION:
            {
                var newTranslation = mat4.multiplyVec3(parentTransform, this.translation, vec3.create());

                mat4.identity(this.localTransform);
                mat4.translate(this.localTransform, newTranslation);
                mat4.transpose(quat4.toMat4(this.rotation, this.rotationTransform));
                mat4.multiply(this.localTransform, this.rotationTransform, this.localTransform);
                mat4.scale(this.localTransform, this.scaling);

                var x = this.localTransform[12];
                var y = this.localTransform[13];
                var z = this.localTransform[14];
                mat4.multiply(device.viewInv, this.localTransform, this.worldTransform);
                this.worldTransform[12] = x;
                this.worldTransform[13] = y;
                this.worldTransform[14] = z;
            }
            break;

        case this.EVE_CAMERA_ROTATION_ALIGNED:
        case this.EVE_SIMPLE_HALO:
            {
                // 3 4 3 3 3 4 3 3
                mat4.translate(parentTransform, this.translation, this.worldTransform);

                var camPos = device.GetEyePosition();
                var d = this._vec3Cache[0];
                d[0] = camPos[0] - this.worldTransform[12];
                d[1] = camPos[1] - this.worldTransform[13];
                d[2] = camPos[2] - this.worldTransform[14];

                var parentT = this._mat4Cache[0];
                mat4.transpose(parentTransform, parentT);
                var camFwd = this._vec3Cache[1];
                vec3.set(d, camFwd);
                mat4.multiply3x3(parentT, camFwd);

                var parentScaleX = vec3.length(parentTransform);
                camFwd[0] /= parentScaleX;
                var parentScaleY = vec3.length(parentTransform.subarray(4));
                camFwd[1] /= parentScaleY;
                var parentScaleZ = vec3.length(parentTransform.subarray(8));
                camFwd[2] /= parentScaleZ;

                var distCenter = vec3.length(camFwd);
                vec3.normalize(camFwd);

                var right = this._vec3Cache[2];
                right[0] = device.view[0];
                right[1] = device.view[4];
                right[2] = device.view[8];
                mat4.multiply3x3(parentT, right);
                vec3.normalize(right);

                var up = this._vec3Cache[3];
                vec3.cross(camFwd, right, up);
                vec3.normalize(up);

                var alignMat = this._mat4Cache[1];
                vec3.cross(up, camFwd, right);
                alignMat[0] = right[0];
                alignMat[1] = right[1];
                alignMat[2] = right[2];
                alignMat[4] = up[0];
                alignMat[5] = up[1];
                alignMat[6] = up[2];
                alignMat[8] = camFwd[0];
                alignMat[9] = camFwd[1];
                alignMat[10] = camFwd[2];
                alignMat[15] = 1;
                mat4.multiply(alignMat, this.rotationTransform, alignMat);

                if (this.modifier == this.EVE_SIMPLE_HALO)
                {
                    var forward = this._vec3Cache[4];
                    vec3.normalize(this.worldTransform.subarray(8), forward);
                    var dirToCamNorm = d;
                    vec3.normalize(dirToCamNorm);
                    var scale = -vec3.dot(dirToCamNorm, forward);
                    if (scale < 0)
                    {
                        scale = 0;
                    }
                    mat4.multiply(this.worldTransform, alignMat, this.worldTransform);
                    mat4.scale(this.worldTransform, [this.scaling[0] * scale, this.scaling[1] * scale, this.scaling[2] * scale]);
                }
                else
                {
                    mat4.scale(this.worldTransform, this.scaling);
                    mat4.multiply(this.worldTransform, alignMat, this.worldTransform);
                }
            }
            break;

        case this.LOOK_AT_CAMERA:
            {
                mat4.multiply(parentTransform, this.localTransform, this.worldTransform);
                var invView = this._mat4Cache[0];
                mat4.lookAt(device.viewInv.subarray(12), this.worldTransform.subarray(12), [0, 1, 0], invView);
                mat4.transpose(invView);

                var finalScale = this._vec3Cache[0];
                vec3.set(this.scaling, finalScale);
                var parentScaleX = vec3.length(parentTransform);
                var parentScaleY = vec3.length(parentTransform.subarray(4));
                var parentScaleZ = vec3.length(parentTransform.subarray(8));
                finalScale[0] *= parentScaleX;
                finalScale[1] *= parentScaleY;
                finalScale[2] *= parentScaleZ;

                this.worldTransform[0] = invView[0] * finalScale[0];
                this.worldTransform[1] = invView[1] * finalScale[0];
                this.worldTransform[2] = invView[2] * finalScale[0];
                this.worldTransform[4] = invView[4] * finalScale[1];
                this.worldTransform[5] = invView[5] * finalScale[1];
                this.worldTransform[6] = invView[6] * finalScale[1];
                this.worldTransform[8] = invView[8] * finalScale[2];
                this.worldTransform[9] = invView[9] * finalScale[2];
                this.worldTransform[10] = invView[10] * finalScale[2];
            }
            break;

        default:
            mat4.multiply(parentTransform, this.localTransform, this.worldTransform);
    }

    for (var i = 0; i < this.children.length; ++i)
    {
        this.children[i].UpdateViewDependentData(this.worldTransform);
    }
};
