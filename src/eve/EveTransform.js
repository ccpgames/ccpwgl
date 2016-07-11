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
 * @property {Boolean} display
 * @property {Boolean} displayMesh
 * @property {Boolean} displayChildren
 * @property {vec3} scaling
 * @property {vec3} translation
 * @property {quat} rotation
 * @property {mat4} localTransform
 * @property {mat4} rotationTransform
 * @property {mat4} worldTransform
 * @property {Array.<mat4>} _mat4Cache
 * @property {Array.<vec3>} _vec3Cache
 * @property {vec3} _parentScale
 * @property {EveBasicPerObjectData} _perObjectData
 * @constructor
 */
function EveTransform()
{
    this.name = '';
    this.mesh = null;

    this.modifier = this.NONE;
    this.NONE = 0;
    this.BILLBOARD = 1;
    this.TRANSLATE_WITH_CAMERA = 2;
    this.LOOK_AT_CAMERA = 3;
    this.SIMPLE_HALO = 4;
    this.EVE_CAMERA_ROTATION_ALIGNED = 100;
    this.EVE_BOOSTER = 101;
    this.EVE_SIMPLE_HALO = 102;
    this.EVE_CAMERA_ROTATION = 103;

    this.sortValueMultiplier = 1.0;
    this.distanceBasedScaleArg1 = 0.2;
    this.distanceBasedScaleArg2 = 0.63;
    this.useDistanceBasedScale = false;

    this.particleSystems = [];
    this.particleEmitters = [];
    this.curveSets = [];
    this.children = [];

    this.display = true;
    this.displayMesh = true;
    this.displayChildren = true;

    this.scaling = vec3.one();
    this.translation = vec3.create();
    this.rotation = quat.create();
    this.localTransform = mat4.zero();
    this.rotationTransform = mat4.create();
    this.worldTransform = mat4.create();

    this._mat4Cache = [mat4.zero(), mat4.zero()];
    this._vec3Cache = [];
    for (var i = 0; i < 7; ++i)
    {
        this._vec3Cache[i] = vec3.create();
    }
    this._parentScale = vec3.create();

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
    mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);
    mat4.fromQuat(this.rotationTransform, this.rotation);
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
    };

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
}

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

    if (this.displayMesh && this.mesh != null)
    {
        mat4.transpose(this._perObjectData.perObjectFFEData.Get('World'), this.worldTransform);
        mat4.invert(this._perObjectData.perObjectFFEData.Get('WorldInverseTranspose'), this.worldTransform);
        if (perObjectData)
        {
            this._perObjectData.perObjectVSData = perObjectData.perObjectVSData;
            this._perObjectData.perObjectPSData = perObjectData.perObjectPSData;
        }
        this.mesh.GetBatches(mode, accumulator, this._perObjectData);
    }

    if (this.displayChildren)
    {
        for (var i = 0; i < this.children.length; ++i)
        {
            this.children[i].GetBatches(mode, accumulator, perObjectData);
        }
    }
}

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
 * Per frame update
 * @param {Mat4} parentTransform
 */
EveTransform.prototype.UpdateViewDependentData = function(parentTransform)
{
    quat.normalize(this.rotation, this.rotation);
    mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);
    mat4.fromQuat(this.rotationTransform, this.rotation);
    vec3.setScale(this._parentScale, parentTransform);

    switch (this.modifier)
    {
        case this.BILLBOARD:
        case this.SIMPLE_HALO:
            {
                mat4.multiply( this.worldTransform, parentTransform, this.localTransform);

                var finalScale = this._vec3Cache[0];
                vec3.copy(finalScale, this.scaling);
                vec3.multiply(finalScale, finalScale, this._parentScale);

                if (this.modifier == this.SIMPLE_HALO)
                {
                    var camPos = device.GetEyePosition();
                    var d = this._vec3Cache[1];
                    vec3.subtract(d, camPos, this.worldTransform.subarray(12));
                    vec3.normalize(this._vec3Cache[2], this.worldTransform.subarray(8));
                    vec3.normalize(d, d);
                    var scale = vec3.dot(d, this._vec3Cache[2]);
                    if (scale < 0)
                    {
                        scale = 0;
                    }
                    vec3.scale(finalScale, finalScale, scale * scale);
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
                var newTranslation = vec3.transformMat4(vec3.create(), this.translation, parentTransform);
                mat4.fromRotationTranslationScale(this.localTransform, this.rotation, newTranslation, this.scaling);
                mat4.fromQuat(this.rotationTransform, this.rotation);
                var temp = vec3.fromTranslation(this.localTransform)
                mat4.multiply(this.worldTransform, device.viewInv, this.localTransform);
                mat4.setTranslation(this.worldTransform, temp);
            }
            break;

        case this.EVE_CAMERA_ROTATION_ALIGNED:
        case this.EVE_SIMPLE_HALO:
            {
                // 3 4 3 3 3 4 3 3
                mat4.translate(this.worldTransform, parentTransform, this.translation);

                var camPos = device.GetEyePosition();
                var d = this._vec3Cache[0];
                d[0] = camPos[0] - this.worldTransform[12];
                d[1] = camPos[1] - this.worldTransform[13];
                d[2] = camPos[2] - this.worldTransform[14];

                var parentT = this._mat4Cache[0];
                mat4.transpose(parentT, parentTransform);
                var camFwd = this._vec3Cache[1];
                vec3.copy(camFwd, d);
                vec3.transformMat4(camFwd, camFwd, parentT);
                vec3.divide(camFwd, camFwd, this._parentScale);
                vec3.normalize(camFwd, camFwd);

                var right = this._vec3Cache[2];
                right[0] = device.view[0];
                right[1] = device.view[4];
                right[2] = device.view[8];
                vec3.transformMat4(right, right, parentT);
                vec3.normalize(right, right);

                var up = this._vec3Cache[3];
                vec3.cross(up, camFwd, right);
                vec3.normalize(up, up);

                var alignMat = this._mat4Cache[1];
                vec3.cross(right, up, camFwd);
                mat4.setBasis(alignMat, right, up, camFwd);
                mat4.multiply(alignMat, alignMat, this.rotationTransform);

                if (this.modifier == this.EVE_SIMPLE_HALO)
                {
                    var forward = this._vec3Cache[4];
                    vec3.normalize(forward, this.worldTransform.subarray(8));
                    var dirToCamNorm = d;
                    vec3.normalize(dirToCamNorm, dirToCamNorm);
                    var scale = -vec3.dot(dirToCamNorm, forward);
                    if (scale < 0)
                    {
                        scale = 0;
                    }
                    mat4.multiply(this.worldTransform, this.worldTransform, alignMat);
                    mat4.scale(this.worldTransform, this.worldTransform, [this.scaling[0] * scale, this.scaling[1] * scale, this.scaling[2] * scale]);
                }
                else
                {
                    mat4.scale(this.worldTransform, this.worldTransform, this.scaling);
                    mat4.multiply(this.worldTransform, this.worldTransform, alignMat);
                }
            }
            break;

        case this.LOOK_AT_CAMERA:
            {
                mat4.multiply(this.worldTransform, parentTransform, this.localTransform);
                var invView = this._mat4Cache[0];
                mat4.lookAt(invView, device.viewInv.subarray(12), this.worldTransform.subarray(12), [0,1,0]);
                mat4.transpose(invView, invView);

                var finalScale = this._vec3Cache[0];
                vec3.copy(finalScale, this.scaling);
                vec3.multiply(finalScale, finalScale, this._parentScale);

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
            mat4.multiply(this.worldTransform, parentTransform, this.localTransform);
    }

    for (var i = 0; i < this.children.length; ++i)
    {
        this.children[i].UpdateViewDependentData(this.worldTransform);
    }
};
