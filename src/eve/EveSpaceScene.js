/**
 * EveSpaceScene
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
 * @property {Array.<mat4>} _tempMat
 * @property {vec3} _tempVec
 * @property {*} _debugHelper
 * @constructor
 */
function EveSpaceScene()
{
    this.lensflares = [];
    this.objects = [];
    this.planets = [];

    this.nebulaIntensity = 1;
    this.ambientColor = vec4.fromValues(0.25, 0.25, 0.25, 1);
    this.backgroundEffect = null;
    this.backgroundRenderingEnabled = true;
    this.envMapScaling = vec3.one();
    this.envMapRotation = quat.create();

    this.lodEnabled = false;

    this.fogStart = 0;
    this.fogEnd = 0;
    this.fogMax = 0;
    this.fogType = 0;
    this.fogBlur = 0;
    this.fogColor = vec4.fromValues(0.25, 0.25, 0.25, 1);

    this.sunDirection = vec3.fromValues(1, -1, 1);
    this.sunDiffuseColor = vec4.one();

    this.envMapResPath = '';
    this.envMap1ResPath = '';
    this.envMap2ResPath = '';
    this.envMap3ResPath = '';
    this.envMapRes = null;
    this.envMap1Res = null;
    this.envMap2Res = null;
    this.envMap3Res = null;

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

    variableStore.RegisterVariable('ShadowLightness', 0);
    
    this._tempMat = [ mat4.create(), mat4.create(), mat4.create(), mat4.create(), mat4.create() ];
    this._tempVec = vec3.create();

    this.renderDebugInfo = false;
    this._debugHelper = null;
}

/**
 * Initializes the space scene
 */
EveSpaceScene.prototype.Initialize = function ()
{
    if (this.envMapResPath != '')
    {
        this.envMapRes = resMan.GetResource(this.envMapResPath);
    }

    if (this.envMap1ResPath != '')
    {
        this.envMap1Res = resMan.GetResource(this.envMap1ResPath);
    }

    if (this.envMap2ResPath != '')
    {
        this.envMap2Res = resMan.GetResource(this.envMap2ResPath);
    }

    if (this.envMap3ResPath != '')
    {
        this.envMap3Res = resMan.GetResource(this.envMap3ResPath);
    }
};

/**
 * Sets the environment reflection map
 * @param {String} path
 */
EveSpaceScene.prototype.SetEnvMapReflection = function (path)
{
    this.envMapResPath = path;

    if (this.envMapResPath != '')
    {
        this.envMapRes = resMan.GetResource(path)
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
            if (this.envMap1ResPath != '')
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
            if (this.envMap2ResPath != '')
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
            if (this.envMap3ResPath != '')
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
EveSpaceScene.prototype.RenderBatches = function (mode, objectArray, accumulator)
{
    accumulator = (accumulator) ? accumulator : this._batches;

    for (var i = 0; i < objectArray.length; ++i)
    {
        if (typeof(objectArray[i].GetBatches) != 'undefined')
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
 * Applies per frame data, similar to an object's UpdateViewDependentData prototype
 */
EveSpaceScene.prototype.ApplyPerFrameData = function ()
{
    // Shared
    var view = device.view;
    var projection = device.projection;
    var dirWorld = vec3.normalize(this._tempVec, vec3.negate(this._tempVec, this.sunDirection));
    var envMapRotationMat = mat4.transpose(this._tempMat[1], mat4.scale(this._tempMat[1], mat4.transpose(this._tempMat[1], mat4.fromQuat(this._tempMat[1], this.envMapRotation)), this.envMapScaling));
    var viewProjectionMat = mat4.transpose(this._tempMat[2], mat4.multiply(this._tempMat[2], projection, view));
    var viewInverseTransposeMat = mat4.invert(this._tempMat[3], view);
    var viewMat = mat4.transpose(this._tempMat[4], view);

    // VS Data
    mat4.transpose(this._perFrameVS.Get('ProjectionMat'), projection);
    this._perFrameVS.Set('EnvMapRotationMat', envMapRotationMat);
    this._perFrameVS.Set('ViewProjectionMat', viewProjectionMat);
    this._perFrameVS.Set('ViewInverseTransposeMat', viewInverseTransposeMat);
    this._perFrameVS.Set('ViewMat', viewMat);
    this._perFrameVS.Set('SunData.DirWorld', dirWorld);
    this._perFrameVS.Set('SunData.DiffuseColor', this.sunDiffuseColor);

    var fogFactors = this._perFrameVS.Get('FogFactors');
    var distance = this.fogEnd - this.fogStart;
    if (Math.abs(distance) < 1e-5) distance = 1e-5;
    var factor = 1.0 / distance;
    fogFactors[0] = this.fogEnd * factor;
    fogFactors[1] = factor;
    fogFactors[2] = this.fogMax;

    var targetResolution = this._perFrameVS.Get('TargetResolution');
    // resolution of renderTarget
    targetResolution[0] = device.viewportWidth;
    targetResolution[1] = device.viewportHeight;
    // fov in both ways: width (x) and (height (y)
    var aspectRatio = (projection[0] ? projection[5] / projection[0] : 0.0);
    var aspectAdjustment = 1.0;
    if (aspectRatio > 1.6) aspectAdjustment = aspectRatio / 1.6;
    var fov = 2.0 * Math.atan(aspectAdjustment / projection[5]);

    var viewportAdj = this._perFrameVS.Get('ViewportAdjustment');
    viewportAdj[0] = 1;
    viewportAdj[1] = 1;
    viewportAdj[2] = 1;
    viewportAdj[3] = 1;

    // PS Data
    this._perFramePS.Get('FovXY')[0] = targetResolution[3] = fov;
    this._perFramePS.Get('FovXY')[1] = targetResolution[2] = targetResolution[3] * aspectRatio;
    this._perFramePS.Get('ProjectionToView')[0] = -device.projection[14];
    this._perFramePS.Get('ProjectionToView')[1] = -device.projection[10] - 1;
    this._perFramePS.Get('ViewportSize')[0] = device.viewportWidth;
    this._perFramePS.Get('ViewportSize')[1] = device.viewportHeight;
    this._perFramePS.Set('EnvMapRotationMat', envMapRotationMat);
    this._perFramePS.Set('ViewInverseTransposeMat', viewInverseTransposeMat);
    this._perFramePS.Set('ViewMat', viewMat);
    this._perFramePS.Set('SunData.DirWorld', dirWorld);
    this._perFramePS.Set('SunData.DiffuseColor', this.sunDiffuseColor);
    this._perFramePS.Set('SceneData.AmbientColor', this.ambientColor);
    this._perFramePS.Get('SceneData.NebulaIntensity')[0] = this.nebulaIntensity;
    this._perFramePS.Set('SceneData.FogColor', this.fogColor);
    this._perFramePS.Get('ShadowCameraRange')[0] = 1;

    var targetResolution = this._perFramePS.Get('TargetResolution');
    targetResolution[0] = device.viewportWidth;
    targetResolution[1] = device.viewportHeight;
    targetResolution[3] = fov;
    targetResolution[2] = targetResolution[3] * aspectRatio;

    var shadowMapSettings = this._perFramePS.Get('ShadowMapSettings');
    shadowMapSettings[0] = 1;
    shadowMapSettings[1] = 1;
    shadowMapSettings[2] = 0;
    shadowMapSettings[3] = 0;

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

/**
 * Updates children's view dependent data and renders them
 */
EveSpaceScene.prototype.Render = function ()
{
    this.ApplyPerFrameData();
    var i;

    if (this.backgroundRenderingEnabled)
    {
        if (this.backgroundEffect)
        {
            device.SetStandardStates(device.RM_FULLSCREEN);
            device.RenderCameraSpaceQuad(this.backgroundEffect);
        }

        if (this.planets.length)
        {
            var tempProj = mat4.clone(device.projection);
            var tempProj = mat4.clone(device.projection);
            var newProj = mat4.clone(device.projection);
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
                    this.planets[i].UpdateViewDependentData(this._tempMat[0]);
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
    }

    if (this.lodEnabled)
    {
        var frustum = new Tw2Frustum();
        frustum.Initialize(device.view, device.projection, device.viewportWidth);
        for (i = 0; i < this.objects.length; ++i)
        {
            if (this.objects[i].UpdateLod)
            {
                this.objects[i].UpdateLod(frustum);
            }
        }
    }

    for (i = 0; i < this.objects.length; ++i)
    {
        if (this.objects[i].UpdateViewDependentData)
        {
            this.objects[i].UpdateViewDependentData(this._tempMat[0]);
        }
    }

    for (i = 0; i < this.lensflares.length; ++i)
    {
        this.lensflares[i].PrepareRender();
    }

    this._batches.Clear();

    for (i = 0; i < this.planets.length; ++i)
    {
        this.planets[i].GetZOnlyBatches(device.RM_OPAQUE, this._batches);
    }

    this.RenderBatches(device.RM_OPAQUE, this.objects);
    this.RenderBatches(device.RM_DECAL, this.objects);
    this.RenderBatches(device.RM_TRANSPARENT, this.objects);
    this.RenderBatches(device.RM_ADDITIVE, this.objects);

    for (i = 0; i < this.lensflares.length; ++i)
    {
        this.lensflares[i].GetBatches(device.RM_ADDITIVE, this._batches);
    }

    this._batches.Render();

    for (i = 0; i < this.lensflares.length; ++i)
    {
        this.lensflares[i].UpdateOccluders();
    }

    if (this.renderDebugInfo)
    {
        if (this._debugHelper == null)
        {
            this._debugHelper = new Tw2DebugRenderer();
        }
        for (i = 0; i < this.objects.length; ++i)
        {
            if (typeof(this.objects[i].RenderDebugInfo) != 'undefined')
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
        if (typeof(this.planets[i].Update) != 'undefined')
        {
            this.planets[i].Update(dt);
        }
    }
    for (var i = 0; i < this.objects.length; ++i)
    {
        if (typeof(this.objects[i].Update) != 'undefined')
        {
            this.objects[i].Update(dt);
        }
    }
};
