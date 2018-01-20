import {vec3, vec4, quat, mat4} from '../math';
import {device} from '../core';
import {resMan} from '../core';
import {variableStore} from '../core';
import {Tw2BatchAccumulator} from '../core';
import {Tw2RawData} from '../core';
import {Tw2Frustum} from '../core';


/**
 * EveSpaceScene
 * @property {string} name
 * @property {boolean} display
 * @property {{}} visible
 * @property {boolean} visible.lensflare
 * @property {boolean} visible.objects
 * @property {boolean} visible.planets
 * @property {boolean} visible.fog
 * @property {boolean} visible.clearColor
 * @property {boolean} visible.nebula
 * @property {Array.<EveLensflare>} lensflares - Scene lensflares
 * @property {Array.<EveObject>} objects - Scene objects
 * @property {Array.<EvePlanet>} planets - Scene planets
 * @property {number} nebulaIntensity - controls nebula intensity on scene objects
 * @property {vec4} ambientColor - unused
 * @property {null|Tw2Effect} backgroundEffect
 * @property {boolean} backgroundRenderingEnabled - Toggles background effect visibility
 * @property {vec3} endMapScaling - controls the scale of the environment maps
 * @property {quat} envMapRotation - controls the rotation of the environment maps
 * @property {boolean} logEnabled - toggles LOD
 * @property {number} fogStart - fog start distance
 * @property {number} fogEnd - fog end distance
 * @property {number} fogMax - fog maximum opacity
 * @property {number} fogType - fog blend type
 * @property {number} fogBlur - fog blur mode
 * @property {vec4} fogColor - fog color
 * @property {vec3} sunDirection - the direction of the scene sun
 * @property {vec4} sunDiffuseColor - the colour of the light from the sun
 * @property {String} envMapResPath - nebula reflection map path
 * @property {String} envMap1ResPath - nebula diffuse map path
 * @property {String} envMap2ResPath - nebular blur map path
 * @property {String} envMap3ResPath - unused
 * @property {null|Tw2TextureRes} envMapRes
 * @property {null|Tw2TextureRes} envMap1Res
 * @property {null|Tw2TextureRes} envMap2Res
 * @property {null} envMap3Res - unused
 * @property {null|Tw2TextureParameter} _envMapHandle
 * @property {null|Tw2TextureParameter} _envMap1Handle
 * @property {null|Tw2TextureParameter} _envMap2Handle
 * @property {null|Tw2TextureParameter} _envMap3Handle
 * @property {Tw2BatchAccumulator} _batches - Scene batch accumulator
 * @property {Tw2RawData} _perFrameVS
 * @property {Tw2RawData} _perFramePS
 * @property {boolean} renderDebugInfo
 * @property {*} _debugHelper
 * @constructor
 */
export function EveSpaceScene()
{
    this.name = '';

    this.display = true;
    this.visible = {};
    this.visible.lensflares = true;
    this.visible.objects = true;
    this.visible.planets = true;
    this.visible.fog = true;
    this.visible.clearColor = true;
    this.visible.reflection = true;

    var self = this;
    Object.defineProperty(this.visible, 'nebula',
        {
            get: function ()
            {
                return !!self.backgroundRenderingEnabled;
            },
            set: function (bool)
            {
                self.backgroundRenderingEnabled = bool;
            }
        });

    this.lensflares = [];
    this.objects = [];
    this.planets = [];

    this.nebulaIntensity = 1;
    this.ambientColor = quat.fromValues(0.25, 0.25, 0.25, 1);
    this.backgroundEffect = null;
    this.backgroundRenderingEnabled = true;
    this.envMapScaling = vec3.fromValues(1, 1, 1);
    this.envMapRotation = quat.create();

    this.lodEnabled = false;

    this.fogStart = 0;
    this.fogEnd = 0;
    this.fogMax = 0;
    this.fogType = 0;
    this.fogBlur = 0;
    this.fogColor = vec4.fromValues(0.25, 0.25, 0.25, 1);

    this.sunDirection = vec3.fromValues(1, -1, 1);
    this.sunDiffuseColor = vec4.fromValues(1, 1, 1, 1);

    this.envMapResPath = '';
    this.envMap1ResPath = '';
    this.envMap2ResPath = '';
    this.envMap3ResPath = '';
    this.envMapRes = null;
    this.envMap1Res = null;
    this.envMap2Res = null;
    this.envMap3Res = null;

    this.clearColor = vec4.fromValues(0, 0, 0, 0);

    this._envMapHandle = variableStore.RegisterVariable('EveSpaceSceneEnvMap', '');
    this._envMap1Handle = variableStore.RegisterVariable('EnvMap1', '');
    this._envMap2Handle = variableStore.RegisterVariable('EnvMap2', '');
    this._envMap3Handle = variableStore.RegisterVariable('EnvMap3', '');

    this._batches = new Tw2BatchAccumulator();

    this._perFrameVS = new Tw2RawData();
    this._perFrameVS.Declare('ViewInverseTransposeMat', 16);
    this._perFrameVS.Declare('ViewProjectionMat', 16);
    this._perFrameVS.Declare('ViewMat', 16);
    this._perFrameVS.Declare('ProjectionMat', 16);
    this._perFrameVS.Declare('ShadowViewMat', 16);
    this._perFrameVS.Declare('ShadowViewProjectionMat', 16);
    this._perFrameVS.Declare('EnvMapRotationMat', 16);
    this._perFrameVS.Declare('SunData.DirWorld', 4);
    this._perFrameVS.Declare('SunData.DiffuseColor', 4);
    this._perFrameVS.Declare('FogFactors', 4);
    this._perFrameVS.Declare('TargetResolution', 4);
    this._perFrameVS.Declare('ViewportAdjustment', 4);
    this._perFrameVS.Declare('MiscSettings', 4);
    this._perFrameVS.Create();

    this._perFramePS = new Tw2RawData();
    this._perFramePS.Declare('ViewInverseTransposeMat', 16);
    this._perFramePS.Declare('ViewMat', 16);
    this._perFramePS.Declare('EnvMapRotationMat', 16);
    this._perFramePS.Declare('SunData.DirWorld', 4);
    this._perFramePS.Declare('SunData.DiffuseColor', 4);
    this._perFramePS.Declare('SceneData.AmbientColor', 3);
    this._perFramePS.Declare('SceneData.NebulaIntensity', 1);
    this._perFramePS.Declare('SceneData.FogColor', 4);
    this._perFramePS.Declare('ViewportOffset', 2);
    this._perFramePS.Declare('ViewportSize', 2);
    this._perFramePS.Declare('TargetResolution', 4);
    this._perFramePS.Declare('ShadowMapSettings', 4);
    this._perFramePS.Declare('ShadowCameraRange', 4);
    this._perFramePS.Declare('ProjectionToView', 2);
    this._perFramePS.Declare('FovXY', 2);
    this._perFramePS.Declare('MiscSettings', 4);
    this._perFramePS.Create();

    this.renderDebugInfo = false;
    this._debugHelper = null;
}

/**
 * Initializes the space scene
 */
EveSpaceScene.prototype.Initialize = function ()
{
    variableStore.RegisterVariable('ShadowLightness', 0);
    if (!EveSpaceScene.EmptyTexture)
    {
        EveSpaceScene.EmptyTexture = resMan.GetResource('res:/texture/global/black.dds.0.png');
    }

    if (this.envMapResPath !== '')
    {
        this.envMapRes = resMan.GetResource(this.envMapResPath);
    }

    if (this.envMap1ResPath !== '')
    {
        this.envMap1Res = resMan.GetResource(this.envMap1ResPath);
    }

    if (this.envMap2ResPath !== '')
    {
        this.envMap2Res = resMan.GetResource(this.envMap2ResPath);
    }

    if (this.envMap3ResPath !== '')
    {
        this.envMap3Res = resMan.GetResource(this.envMap3ResPath);
    }
};

/**
 * Gets scene's res objects
 * @param {Array} [out=[]] - Optional receiving array
 * @returns {Array.<Tw2EffectRes|Tw2TextureRes|Tw2GeometryRes>} [out]
 */
EveSpaceScene.prototype.GetResources = function (out)
{
    if (out === undefined)
    {
        out = [];
    }

    if (this.backgroundEffect)
    {
        this.backgroundEffect.GetResources(out);
    }

    for (var i = 0; i < this.lensflares.length; i++)
    {
        this.lensflares[i].GetResources(out);
    }

    function getEnvMapResource(out, envMap)
    {
        if (envMap !== null && out.indexOf(envMap) === -1) out.push(envMap);
    }

    getEnvMapResource(out, this.envMapRes);
    getEnvMapResource(out, this.envMap1Res);
    getEnvMapResource(out, this.envMap2Res);
    getEnvMapResource(out, this.envMap3Res);

    return out;
};

/**
 * Gets scene's children's res objects
 * @param {Array} [out=[]] - Optional receiving array
 * @returns {Array.<Tw2EffectRes|Tw2TextureRes|Tw2GeometryRes>} [out]
 */
EveSpaceScene.prototype.GetChildResources = function (out)
{
    if (out === undefined)
    {
        out = [];
    }

    for (var p = 0; p < this.planets.length; p++)
    {
        this.planets[p].GetResources(out);
    }

    for (var i = 0; i < this.objects.length; i++)
    {
        this.objects[i].GetResources(out);
    }

    return out;
};

/**
 * Sets the environment reflection map
 * @param {String} path
 */
EveSpaceScene.prototype.SetEnvMapReflection = function (path)
{
    this.envMapResPath = path;

    if (this.envMapResPath !== '')
    {
        this.envMapRes = resMan.GetResource(path);
    }
};

/**
 * Sets an environment map
 * @param {number} index
 * @param {String} path
 */
EveSpaceScene.prototype.SetEnvMapPath = function (index, path)
{
    switch (index)
    {
        case 0:
            this.envMap1ResPath = path;
            if (this.envMap1ResPath !== '')
            {
                this.envMap1Res = resMan.GetResource(this.envMap1ResPath);
            }
            else
            {
                this.envMap1Res = null;
            }
            break;

        case 1:
            this.envMap2ResPath = path;
            if (this.envMap2ResPath !== '')
            {
                this.envMap2Res = resMan.GetResource(this.envMap2ResPath);
            }
            else
            {
                this.envMap2Res = null;
            }
            break;

        case 2:
            this.envMap3ResPath = path;
            if (this.envMap3ResPath !== '')
            {
                this.envMap3Res = resMan.GetResource(this.envMap3ResPath);
            }
            else
            {
                this.envMap3Res = null;
            }
            break;
    }
};

/**
 * Gets batches for rendering
 * @param {number} mode
 * @param {Array.<EveObject>} objectArray
 * @param {Tw2BatchAccumulator} accumulator
 */
EveSpaceScene.prototype.RenderBatches = function (mode, objectArray, accumulator)
{
    accumulator = (accumulator) ? accumulator : this._batches;

    for (var i = 0; i < objectArray.length; ++i)
    {
        if (typeof(objectArray[i].GetBatches) !== 'undefined')
        {
            objectArray[i].GetBatches(mode, accumulator);
        }
    }
};

/**
 * Enables LOD
 * @param {boolean} enable
 */
EveSpaceScene.prototype.EnableLod = function (enable)
{
    this.lodEnabled = enable;

    if (!enable)
    {
        for (var i = 0; i < this.objects.length; ++i)
        {
            if (this.objects[i].ResetLod)
            {
                this.objects[i].ResetLod();
            }
        }
    }
};

/**
 * Scratch vectors
 *
 * @type {*}
 */
EveSpaceScene.scratch = {
    vec3_0: vec3.create(),
    vec4_0: vec4.create(),
    mat4_0: mat4.create(),
    mat4_1: mat4.create(),
    mat4_2: mat4.create(),
    mat4_ID: mat4.create(),
    frustum: new Tw2Frustum()
};

EveSpaceScene.prototype.ApplyPerFrameData = function ()
{
    var d = device,
        s = EveSpaceScene.scratch;

    // Nebula
    var envMapTransform = s.mat4_2;
    mat4.fromQuat(envMapTransform, this.envMapRotation);
    mat4.scale(envMapTransform, envMapTransform, this.envMapScaling);
    mat4.transpose(envMapTransform, envMapTransform);

    // Sun
    var sunDir = vec3.negate(s.vec3_0, this.sunDirection);
    vec3.normalize(sunDir, sunDir);

    // Fog
    var distance = this.fogEnd - this.fogStart;
    if (Math.abs(distance) < 1e-5) distance = 1e-5;
    var f = 1.0 / distance;

    this._perFrameVS.Set('FogFactors', [this.fogEnd * f, f, this.visible.fog ? this.fogMax : 0, 1]);
    this._perFrameVS.Set('ViewportAdjustment', [1, 1, 1, 1]);
    this._perFrameVS.Set('MiscSettings', [d.currentTime, 0, d.viewportWidth, d.viewportHeight]);
    this._perFrameVS.Set('SunData.DirWorld', sunDir);
    this._perFrameVS.Set('SunData.DiffuseColor', this.sunDiffuseColor);
    this._perFrameVS.Set('TargetResolution', d.targetResolution);
    this._perFrameVS.Set('ViewInverseTransposeMat', d.viewInverse);
    this._perFrameVS.Set('ViewProjectionMat', d.viewProjectionTranspose);
    this._perFrameVS.Set('ViewMat', d.viewTranspose);
    this._perFrameVS.Set('ProjectionMat', d.projectionTranspose);
    this._perFramePS.Set('FovXY', [d.targetResolution[3], d.targetResolution[2]]);
    this._perFramePS.Set('ShadowMapSettings', [1, 1, 0, 0]);
    this._perFramePS.Set('TargetResolution', d.targetResolution);
    this._perFrameVS.Set('EnvMapRotationMat', envMapTransform);
    device.perFrameVSData = this._perFrameVS;

    this._perFramePS.Set('ViewInverseTransposeMat', d.viewInverse);
    this._perFramePS.Set('ViewMat', d.viewTranspose);
    this._perFramePS.Set('EnvMapRotationMat', envMapTransform);
    this._perFramePS.Set('SunData.DirWorld', sunDir);
    this._perFramePS.Set('SunData.DiffuseColor', this.sunDiffuseColor);
    this._perFramePS.Set('SceneData.AmbientColor', this.ambientColor);
    this._perFramePS.Set('MiscSettings', [d.currentTime, this.fogType, this.fogBlur, 1]);
    this._perFramePS.Set('SceneData.FogColor', this.fogColor);
    this._perFramePS.Get('SceneData.NebulaIntensity')[0] = this.nebulaIntensity;
    this._perFramePS.Get('ViewportSize')[0] = d.viewportWidth;
    this._perFramePS.Get('ViewportSize')[1] = d.viewportHeight;
    this._perFramePS.Get('ShadowCameraRange')[0] = 1;
    this._perFramePS.Get('ProjectionToView')[0] = -d.projection[14];
    this._perFramePS.Get('ProjectionToView')[1] = -d.projection[10] - 1;
    device.perFramePSData = this._perFramePS;

    this._envMapHandle.textureRes = this.visible.reflection ? this.envMapRes : EveSpaceScene.EmptyTexture;
    this._envMap1Handle.textureRes = this.envMap1Res;
    this._envMap2Handle.textureRes = this.envMap2Res;
    this._envMap3Handle.textureRes = this.envMap3Res;
};

/**
 * Updates children's view dependent data and renders them
 */
EveSpaceScene.prototype.Render = function ()
{
    this.ApplyPerFrameData();
    var i,
        d = device,
        scratch = EveSpaceScene.scratch,
        id = mat4.identity(scratch.mat4_ID);

    if (this.backgroundRenderingEnabled && this.backgroundEffect)
    {
        d.SetStandardStates(d.RM_FULLSCREEN);
        d.RenderCameraSpaceQuad(this.backgroundEffect);
    }

    if (this.visible.planets && this.planets.length)
    {
        var tempProj = mat4.copy(scratch.mat4_0, d.projection);
        var newProj = mat4.copy(scratch.mat4_1, d.projection);
        var zn = 10000;
        var zf = 1e11;
        newProj[10] = zf / (zn - zf);
        newProj[14] = (zf * zn) / (zn - zf);
        d.SetProjection(newProj, true);
        this.ApplyPerFrameData();

        for (i = 0; i < this.planets.length; ++i)
        {
            if (this.planets[i].UpdateViewDependentData)
            {
                this.planets[i].UpdateViewDependentData(id);
            }
        }

        this._batches.Clear();

        d.gl.depthRange(0.9, 1);
        this.RenderBatches(d.RM_OPAQUE, this.planets);
        this.RenderBatches(d.RM_DECAL, this.planets);
        this.RenderBatches(d.RM_TRANSPARENT, this.planets);
        this.RenderBatches(d.RM_ADDITIVE, this.planets);
        this._batches.Render();
        d.SetProjection(tempProj, true);
        this.ApplyPerFrameData();
        d.gl.depthRange(0, 0.9);
    }

    if (this.lodEnabled)
    {
        var frustum = scratch.frustum;
        frustum.Initialize(d.view, d.projection, d.viewportWidth, d.viewInverse, d.viewProjection);
        for (i = 0; i < this.objects.length; ++i)
        {
            if (this.objects[i].UpdateLod)
            {
                this.objects[i].UpdateLod(frustum);
            }
        }
    }

    if (this.visible.objects)
    {
        for (i = 0; i < this.objects.length; ++i)
        {
            if (this.objects[i].UpdateViewDependentData)
            {
                this.objects[i].UpdateViewDependentData(id);
            }
        }
    }

    if (this.visible.lensflares)
    {
        for (i = 0; i < this.lensflares.length; ++i)
        {
            this.lensflares[i].PrepareRender();
        }
    }

    this._batches.Clear();

    if (this.visible.planets)
    {
        for (i = 0; i < this.planets.length; ++i)
        {
            this.planets[i].GetZOnlyBatches(d.RM_OPAQUE, this._batches);
        }
    }

    if (this.visible.objects)
    {
        this.RenderBatches(d.RM_OPAQUE, this.objects);
        this.RenderBatches(d.RM_DECAL, this.objects);
        this.RenderBatches(d.RM_TRANSPARENT, this.objects);
        this.RenderBatches(d.RM_ADDITIVE, this.objects);
    }

    if (this.visible.lensflares)
    {
        for (i = 0; i < this.lensflares.length; ++i)
        {
            this.lensflares[i].GetBatches(d.RM_ADDITIVE, this._batches);
        }
    }

    this._batches.Render();

    if (this.visible.lensflares)
    {
        for (i = 0; i < this.lensflares.length; ++i)
        {
            this.lensflares[i].UpdateOccluders();
        }
    }

    if (this.renderDebugInfo)
    {
        if (this._debugHelper === null)
        {
            this._debugHelper = new Tw2DebugRenderer();
        }
        for (i = 0; i < this.objects.length; ++i)
        {
            if (typeof(this.objects[i].RenderDebugInfo) !== 'undefined')
            {
                this.objects[i].RenderDebugInfo(this._debugHelper);
            }
        }
        this._debugHelper.Render();
    }
};

/**
 * Per frame update that is called per frame
 * @param {number} dt - delta time
 */
EveSpaceScene.prototype.Update = function (dt)
{
    for (var i = 0; i < this.planets.length; ++i)
    {
        if (typeof(this.planets[i].Update) !== 'undefined')
        {
            this.planets[i].Update(dt);
        }
    }
    for (var i = 0; i < this.objects.length; ++i)
    {
        if (typeof(this.objects[i].Update) !== 'undefined')
        {
            this.objects[i].Update(dt);
        }
    }
};

/**
 * Empty texture
 * @type {null}
 */
EveSpaceScene.EmptyTexture = null;
