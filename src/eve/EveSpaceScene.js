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
function EveSpaceScene()
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
        get: function()
        {
            return !!self.backgroundRenderingEnabled;
        },
        set: function(bool)
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

    variableStore.RegisterVariable('ShadowLightness', 0);
    if (!EveSpaceScene.EmptyTexture) EveSpaceScene.EmptyTexture = resMan.GetResource('res:/texture/global/black.dds.0.png');
}

/**
 * Empty texture
 * @type {null}
 */
EveSpaceScene.EmptyTexture = null;

/**
 * Initializes the space scene
 */
EveSpaceScene.prototype.Initialize = function()
{
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
EveSpaceScene.prototype.GetResources = function(out)
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
EveSpaceScene.prototype.GetChildResources = function(out)
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
EveSpaceScene.prototype.SetEnvMapReflection = function(path)
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
EveSpaceScene.prototype.SetEnvMapPath = function(index, path)
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
 * @param {RenderMode} mode
 * @param {Array.<EveObject>} objectArray
 * @param {Tw2BatchAccumulator} accumulator
 */
EveSpaceScene.prototype.RenderBatches = function(mode, objectArray, accumulator)
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
EveSpaceScene.prototype.EnableLod = function(enable)
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
    mat4_3: mat4.create(),
    mat4_4: mat4.create(),
    mat4_ID: mat4.create(),
    frustum: new Tw2Frustum()
};

/**
 * Applies per frame data, similar to an object's UpdateViewDependentData prototype
 * TODO: Return math functions to Tw2Device to save having to calculate them elsewhere
 */
EveSpaceScene.prototype.ApplyPerFrameData = function()
{
    var d = device,
        s = EveSpaceScene.scratch,
        view = d.view,
        projection = d.projection;

    var viewInverseTranspose = mat4.invert(s.mat4_2, view);
    this._perFrameVS.Set('ViewInverseTransposeMat', viewInverseTranspose);
    var viewProjectionTranspose = mat4.multiply(s.mat4_3, projection, view);
    mat4.transpose(this._perFrameVS.Get('ViewProjectionMat'), viewProjectionTranspose);
    mat4.transpose(this._perFrameVS.Get('ViewMat'), view);
    mat4.transpose(this._perFrameVS.Get('ProjectionMat'), projection);

    var envMapTransform = s.mat4_4;
    mat4.fromQuat(envMapTransform, this.envMapRotation);
    mat4.scale(envMapTransform, envMapTransform, this.envMapScaling);
    mat4.transpose(envMapTransform, envMapTransform);
    this._perFrameVS.Set('EnvMapRotationMat', envMapTransform);

    var sunDir = vec3.negate(s.vec3_0, this.sunDirection);
    vec3.normalize(sunDir, sunDir);
    this._perFrameVS.Set('SunData.DirWorld', sunDir);
    this._perFrameVS.Set('SunData.DiffuseColor', this.sunDiffuseColor);

    var fogFactors = this._perFrameVS.Get('FogFactors');
    var distance = this.fogEnd - this.fogStart;
    if (Math.abs(distance) < 1e-5) distance = 1e-5;
    var factor = 1.0 / distance;
    fogFactors[0] = this.fogEnd * factor;
    fogFactors[1] = factor;
    fogFactors[2] = this.fogMax;

    var targetResolution = this._perFrameVS.Get('TargetResolution');
    targetResolution[0] = device.viewportWidth;
    targetResolution[1] = device.viewportHeight;

    var aspectRatio = (projection[0] ? projection[5] / projection[0] : 0.0);
    var aspectAdjustment = 1.0;
    if (aspectRatio > 1.6) aspectAdjustment = aspectRatio / 1.6;
    var fov = 2.0 * Math.atan(aspectAdjustment / projection[5]);

    this._perFramePS.Get('FovXY')[0] = targetResolution[3] = fov;
    this._perFramePS.Get('FovXY')[1] = targetResolution[2] = targetResolution[3] * aspectRatio;

    var viewportAdj = this._perFrameVS.Get('ViewportAdjustment');
    viewportAdj[0] = 1;
    viewportAdj[1] = 1;
    viewportAdj[2] = 1;
    viewportAdj[3] = 1;

    this._perFramePS.Set('ViewInverseTransposeMat', viewInverseTranspose);
    mat4.transpose(this._perFramePS.Get('ViewMat'), view);
    this._perFramePS.Set('EnvMapRotationMat', envMapTransform);
    this._perFramePS.Set('SunData.DirWorld', sunDir);
    this._perFramePS.Set('SunData.DiffuseColor', this.sunDiffuseColor);
    this._perFramePS.Set('SceneData.AmbientColor', this.ambientColor);
    this._perFramePS.Get('SceneData.NebulaIntensity')[0] = this.nebulaIntensity;
    this._perFramePS.Set('SceneData.FogColor', this.fogColor);
    this._perFramePS.Get('ViewportSize')[0] = device.viewportWidth;
    this._perFramePS.Get('ViewportSize')[1] = device.viewportHeight;
    this._perFramePS.Get('ShadowCameraRange')[0] = 1;

    targetResolution = this._perFramePS.Get('TargetResolution');
    targetResolution[0] = device.viewportWidth;
    targetResolution[1] = device.viewportHeight;
    targetResolution[3] = fov;
    targetResolution[2] = targetResolution[3] * aspectRatio;

    var shadowMapSettings = this._perFramePS.Get('ShadowMapSettings');
    shadowMapSettings[0] = 1;
    shadowMapSettings[1] = 1;
    shadowMapSettings[2] = 0;
    shadowMapSettings[3] = 0;

    this._perFramePS.Get('ProjectionToView')[0] = -device.projection[14];
    this._perFramePS.Get('ProjectionToView')[1] = -device.projection[10] - 1;

    var miscSettings = this._perFramePS.Get('MiscSettings');
    miscSettings[0] = variableStore._variables['Time'].value[0];
    miscSettings[1] = this.fogType;
    miscSettings[2] = this.fogBlur;
    miscSettings[3] = 1;

    miscSettings = this._perFrameVS.Get('MiscSettings');
    miscSettings[0] = variableStore._variables['Time'].value[0];
    miscSettings[1] = 0;
    miscSettings[2] = variableStore._variables['ViewportSize'].value[0];
    miscSettings[3] = variableStore._variables['ViewportSize'].value[1];

    this._envMapHandle.textureRes = this.envMapRes;
    this._envMap1Handle.textureRes = this.envMap1Res;
    this._envMap2Handle.textureRes = this.envMap2Res;
    this._envMap3Handle.textureRes = this.envMap3Res;

    device.perFrameVSData = this._perFrameVS;
    device.perFramePSData = this._perFramePS;
};


/*
EveSpaceScene.prototype.ApplyPerFrameDataNew = function ()
{
    var d = device,
        v = variableStore._variables,
        s = EveSpaceScene.scratch;

    // Environment
    var envMapRotationMat = mat4.fromQuat(s.mat4_0, this.envMapRotation);
    mat4.scale(envMapRotationMat, envMapRotationMat, this.envMapScaling);
    mat4.transpose(envMapRotationMat, envMapRotationMat);
    // Sun
    var dirWorld = vec3.negate(s.vec3_0, this.sunDirection);
    vec3.normalize(dirWorld, dirWorld);
    // Fog
    var distance = this.fogEnd - this.fogStart;
    if (Math.abs(distance) < 1e-5) distance = 1e-5;
    var factor = 1.0 / distance;

    var viewInverse = d.viewInverse,
        projectionTranspose = d.projectionTranspose,
        viewProjectionTranspose = d.viewProjectionTranspose,
        viewTranspose = d.viewTranspose,
        targetResolution = d.targetResolution;

    // Vertex Data
    var vs = this._perFrameVS;
    mat4.copy(vs.Get('ViewInverseTransposeMat'), viewInverse);
    mat4.copy(vs.Get('ProjectionMat'), projectionTranspose);
    mat4.copy(vs.Get('ViewProjectionMat'), viewProjectionTranspose);
    mat4.copy(vs.Get('ViewMat'), viewTranspose);
    mat4.copy(vs.Get('EnvMapRotationMat'), envMapRotationMat);
    vec4.copy(vs.Get('TargetResolution'), targetResolution);
    vec4.copy(vs.Get('ViewportAdjustment'), [1, 1, 1, 1]);
    vec4.copy(vs.Get('MiscSettings'), [d.time, 0, d.viewportWidth, d.viewportHeight]);
    vec4.copy(vs.Get('SunData.DiffuseColor'), this.sunDiffuseColor);
    vec3.copy(vs.Get('FogFactors'), [this.fogEnd * factor, factor, this.visible.fog ? this.fogMax : 0]);
    vec3.copy(vs.Get('SunData.DirWorld'), dirWorld);
    d.perFrameVSData = vs;

    // Pixel Data
    var ps = this._perFramePS;
    mat4.copy(ps.Get('ViewMat'), viewTranspose);
    mat4.copy(ps.Get('ViewInverseTransposeMat'), viewInverse);
    mat4.copy(ps.Get('EnvMapRotationMat'), envMapRotationMat);
    vec4.copy(ps.Get('TargetResolution'), targetResolution);
    vec4.copy(ps.Get('ShadowMapSettings'), [1, 1, 0, 0]);
    vec4.copy(ps.Get('SceneData.FogColor'), this.fogColor);
    vec4.copy(ps.Get('MiscSettings'), [d.time, this.fogType, this.fogBlur, 1]);
    vec4.copy(ps.Get('SceneData.AmbientColor'), this.ambientColor);
    vec4.copy(ps.Get('SunData.DiffuseColor'), this.sunDiffuseColor);
    vec3.copy(ps.Get('SunData.DirWorld'), dirWorld);
    vec2.copy(ps.Get('FovXY'), [targetResolution[3], targetResolution[2]]);
    vec2.copy(ps.Get('ViewportSize'), [d.viewportWidth, d.viewportHeight]);
    vec2.copy(ps.Get('ProjectionToView'), [-d.projection[14], -d.projection[10] - 1]);
    ps.Get('ShadowCameraRange')[0] = 1;
    ps.Get('SceneData.NebulaIntensity')[0] = this.nebulaIntensity;
    d.perFramePSData = ps;

    this._envMapHandle.textureRes = this.visible.reflection ? this.envMapRes : EveSpaceScene.EmptyTexture;
    this._envMap1Handle.textureRes = this.envMap1Res;
    this._envMap2Handle.textureRes = this.envMap2Res;
    this._envMap3Handle.textureRes = this.envMap3Res;
};
*/

/**
 * Updates children's view dependent data and renders them
 */
EveSpaceScene.prototype.Render = function()
{
    this.ApplyPerFrameData();
    var i,
        scratch = EveSpaceScene.scratch,
        id = mat4.identity(scratch.mat4_ID);

    if (this.backgroundRenderingEnabled && this.backgroundEffect)
    {
        device.SetStandardStates(device.RM_FULLSCREEN);
        device.RenderCameraSpaceQuad(this.backgroundEffect);
    }

    if (this.visible.planets && this.planets.length)
    {
        var tempProj = mat4.copy(scratch.mat4_0, device.projection);
        var newProj = mat4.copy(scratch.mat4_1, device.projection);
        var zn = 10000;
        var zf = 1e11;
        newProj[10] = zf / (zn - zf);
        newProj[14] = (zf * zn) / (zn - zf);
        device.SetProjection(newProj);
        this.ApplyPerFrameData();

        for (i = 0; i < this.planets.length; ++i)
        {
            if (this.planets[i].UpdateViewDependentData)
            {
                this.planets[i].UpdateViewDependentData(id);
            }
        }

        this._batches.Clear();

        device.gl.depthRange(0.9, 1);
        this.RenderBatches(device.RM_OPAQUE, this.planets);
        this.RenderBatches(device.RM_DECAL, this.planets);
        this.RenderBatches(device.RM_TRANSPARENT, this.planets);
        this.RenderBatches(device.RM_ADDITIVE, this.planets);
        this._batches.Render();
        device.SetProjection(tempProj);
        this.ApplyPerFrameData();
        device.gl.depthRange(0, 0.9);
    }

    if (this.lodEnabled)
    {
        var frustum = scratch.frustum;
        frustum.Initialize(device.view, device.projection, device.viewportWidth, device.viewInverse, device.viewProjection);
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
            this.planets[i].GetZOnlyBatches(device.RM_OPAQUE, this._batches);
        }
    }

    if (this.visible.objects)
    {
        this.RenderBatches(device.RM_OPAQUE, this.objects);
        this.RenderBatches(device.RM_DECAL, this.objects);
        this.RenderBatches(device.RM_TRANSPARENT, this.objects);
        this.RenderBatches(device.RM_ADDITIVE, this.objects);
    }

    if (this.visible.lensflares)
    {
        for (i = 0; i < this.lensflares.length; ++i)
        {
            this.lensflares[i].GetBatches(device.RM_ADDITIVE, this._batches);
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
EveSpaceScene.prototype.Update = function(dt)
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
