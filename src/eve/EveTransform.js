import {vec3, quat, mat4} from '../math';
import {device, Tw2RawData} from '../core';
import {EveBasicPerObjectData} from './EveBasicPerObjectData';

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
 * @property {Array.<Tw2StaticEmitter|Tw2DynamicEmitter>} particleEmitters
 * @property {Array.<Tw2CurveSet>} curveSets
 * @property {Array} children
 * @property {Boolean} display                                      - Enables/ disables all batch accumulations
 * @property {{}} visible                                           - Batch accumulation options for the transforms's elements
 * @property {Boolean} visible.mesh                                 - Enables/ disables mesh batch accumulation
 * @property {Boolean} visible.children                             - Enables/ disables child batch accumulation
 * @property {vec3} scaling
 * @property {vec3} translation
 * @property {quat} rotation
 * @property {mat4} localTransform
 * @property {mat4} worldTransform
 * @property {Array.<mat4>} _mat4Cache
 * @property {Array.<vec3>} _vec3Cache
 * @property {EveBasicPerObjectData} _perObjectData
 * @constructor
 */
export function EveTransform()
{
    this.name = '';
    this.mesh = null;

    this.modifier = EveTransform.Modifier.NONE;

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

    this.scaling = vec3.fromValues(1, 1, 1);
    this.translation = vec3.create();
    this.rotation = quat.create();
    this.localTransform = mat4.create();
    this.worldTransform = mat4.create();

    this._perObjectData = new EveBasicPerObjectData();
    this._perObjectData.perObjectFFEData = new Tw2RawData();
    this._perObjectData.perObjectFFEData.Declare('World', 16);
    this._perObjectData.perObjectFFEData.Declare('WorldInverseTranspose', 16);
    this._perObjectData.perObjectFFEData.Create();
}

/**
 * Scratch variables
 */
EveTransform.scratch = {
    vec3_0: vec3.create(),
    vec3_1: vec3.create(),
    vec3_2: vec3.create(),
    vec3_3: vec3.create(),
    vec3_4: vec3.create(),
    vec3_5: vec3.create(),
    vec3_6: vec3.create(),
    vec3_7: vec3.create(),
    mat4_0: mat4.create(),
    mat4_1: mat4.create(),
    mat4_2: mat4.create()
};

/**
 * Initializes the EveTransform
 */
EveTransform.prototype.Initialize = function()
{
    mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);
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
 * @param {number} mode
 * @param {Tw2BatchAccumulator} accumulator
 * @param {Tw2PerObjectData} perObjectData
 */
EveTransform.prototype.GetBatches = function(mode, accumulator, perObjectData)
{
    if (!this.display)
    {
        return;
    }

    if (this.visible.mesh && this.mesh !== null)
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
EveTransform.Multiply3x3 = function(a, b, c)
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
    var finalScale, d, temp, camPos, scale, invView,
        scratch = EveTransform.scratch,
        parentScale = scratch.vec3_7;

    quat.normalize(this.rotation, this.rotation);
    mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);
    mat4.getScaling(parentScale, parentTransform);

    switch (this.modifier)
    {
        case EveTransform.Modifier.BILLBOARD:
        case EveTransform.Modifier.SIMPLE_HALO:
            mat4.multiply(this.worldTransform, parentTransform, this.localTransform);
            finalScale = vec3.multiply(scratch.vec3_0, this.scaling, parentScale);

            if (this.modifier === EveTransform.Modifier.SIMPLE_HALO)
            {
                camPos = device.GetEyePosition();
                d = vec3.subtract(scratch.vec3_1, camPos, this.worldTransform.subarray(12));
                temp = scratch.vec3_2;
                vec3.normalize(temp, this.worldTransform.subarray(8));
                vec3.normalize(d, d);
                scale = vec3.dot(d, temp);
                if (scale < 0) scale = 0;
                vec3.scale(finalScale, finalScale, scale * scale);
            }

            invView = device.viewInverse;
            this.worldTransform[0] = invView[0] * finalScale[0];
            this.worldTransform[1] = invView[1] * finalScale[0];
            this.worldTransform[2] = invView[2] * finalScale[0];
            this.worldTransform[4] = invView[4] * finalScale[1];
            this.worldTransform[5] = invView[5] * finalScale[1];
            this.worldTransform[6] = invView[6] * finalScale[1];
            this.worldTransform[8] = invView[8] * finalScale[2];
            this.worldTransform[9] = invView[9] * finalScale[2];
            this.worldTransform[10] = invView[10] * finalScale[2];
            break;

        case EveTransform.Modifier.EVE_CAMERA_ROTATION:
            var newTranslation = vec3.transformMat4(scratch.vec3_0, this.translation, parentTransform);
            mat4.fromRotationTranslationScale(this.localTransform, this.rotation, newTranslation, this.scaling);
            mat4.multiply(this.worldTransform, device.viewInverse, this.localTransform);
            this.worldTransform[12] = this.localTransform[12];
            this.worldTransform[13] = this.localTransform[13];
            this.worldTransform[14] = this.localTransform[14];
            break;

        case EveTransform.Modifier.EVE_CAMERA_ROTATION_ALIGNED:
        case EveTransform.Modifier.EVE_SIMPLE_HALO:
        // 3 4 3 3 3 4 3 3
            mat4.translate(this.worldTransform, parentTransform, this.translation);
            camPos = device.GetEyePosition();
            d = scratch.vec3_0;
            d[0] = camPos[0] - this.worldTransform[12];
            d[1] = camPos[1] - this.worldTransform[13];
            d[2] = camPos[2] - this.worldTransform[14];

            var parentT = mat4.transpose(scratch.mat4_0, parentTransform);
            var camFwd = vec3.copy(scratch.vec3_1, d);
            vec3.transformMat4(camFwd, camFwd, parentT);
            vec3.divide(camFwd, camFwd, parentScale);
            vec3.normalize(camFwd, camFwd);

            var right = vec3.set(scratch.vec3_2, device.view[0], device.view[4], device.view[8]);
            vec3.transformMat4(right, right, parentT);
            vec3.normalize(right, right);

            var up = vec3.cross(scratch.vec3_3, camFwd, right);
            vec3.normalize(up, up);

            vec3.cross(right, up, camFwd);

            var alignMat = scratch.mat4_1;
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
            var rotationTransform = mat4.fromQuat(scratch.mat4_2, this.rotation);
            mat4.multiply(alignMat, alignMat, rotationTransform);

            if (this.modifier === EveTransform.Modifier.EVE_SIMPLE_HALO)
            {
                var forward = vec3.normalize(scratch.vec3_4, this.worldTransform.subarray(8));
                var dirToCamNorm = vec3.normalize(d, d);
                scale = -vec3.dot(dirToCamNorm, forward);
                if (scale < 0) scale = 0;
                mat4.multiply(this.worldTransform, this.worldTransform, alignMat);
                mat4.scale(this.worldTransform, this.worldTransform, [this.scaling[0] * scale, this.scaling[1] * scale, this.scaling[2] * scale]);
            }
            else
            {
                mat4.scale(this.worldTransform, this.worldTransform, this.scaling);
                mat4.multiply(this.worldTransform, this.worldTransform, alignMat);
            }
            break;

        case EveTransform.Modifier.LOOK_AT_CAMERA:
            mat4.multiply(this.worldTransform, parentTransform, this.localTransform);
            invView = mat4.lookAt(scratch.mat4_0, device.viewInverse.subarray(12), this.worldTransform.subarray(12), [0, 1, 0]);
            mat4.transpose(invView, invView);
            finalScale = vec3.multiply(scratch.vec3_0, this.scaling, parentScale);
            this.worldTransform[0] = invView[0] * finalScale[0];
            this.worldTransform[1] = invView[1] * finalScale[0];
            this.worldTransform[2] = invView[2] * finalScale[0];
            this.worldTransform[4] = invView[4] * finalScale[1];
            this.worldTransform[5] = invView[5] * finalScale[1];
            this.worldTransform[6] = invView[6] * finalScale[1];
            this.worldTransform[8] = invView[8] * finalScale[2];
            this.worldTransform[9] = invView[9] * finalScale[2];
            this.worldTransform[10] = invView[10] * finalScale[2];
            break;

        default:
            mat4.multiply(this.worldTransform, parentTransform, this.localTransform);
    }

    for (var i = 0; i < this.children.length; ++i)
    {
        this.children[i].UpdateViewDependentData(this.worldTransform);
    }
};

EveTransform.Modifier = {
    NONE: 0,
    BILLBOARD: 1,
    TRANSLATE_WITH_CAMERA: 2,
    LOOK_AT_CAMERA: 3,
    SIMPLE_HALO: 4,
    EVE_CAMERA_ROTATION_ALIGNED: 100,
    EVE_BOOSTER: 101,
    EVE_SIMPLE_HALO: 102,
    EVE_CAMERA_ROTATION: 103
};
