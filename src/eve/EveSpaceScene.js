function EveSpaceScene()
{
    this.lensflares = new Array();
	this.objects = new Array();
	this.backgroundEffect = null;
	this.envMapResPath = '';
	this.envMap1ResPath = '';
	this.envMap2ResPath = '';
	this.envMap3ResPath = '';
	
	this.fogStart = 0;
	this.fogEnd = 0;
	this.fogMax = 0;
	
    this.sunDirection = vec3.create([1, -1, 1]);
    this.sunDiffuseColor = quat4.create([1, 1, 1, 1]);
    this.ambientColor = quat4.create([0.1, 0.1, 0.1, 1]);
    this.fogColor = quat4.create([1, 1, 1, 1]);
    
    this.envMapScaling = vec3.create([1,1,1]);
    this.envMapRotation = quat4.create([0,0,0,1]);

	this.renderDebugInfo = false;
	this.backgroundRenderingEnabled = true;
	
	this.envMapRes = null;
	this.envMap1Res = null;
	this.envMap2Res = null;
	this.envMap3Res = null;
	this._envMapHandle = variableStore.RegisterVariable('EveSpaceSceneEnvMap', '');
	this._envMap1Handle = variableStore.RegisterVariable('EnvMap1', '');
	this._envMap2Handle = variableStore.RegisterVariable('EnvMap2', '');
	this._envMap3Handle = variableStore.RegisterVariable('EnvMap3', '');
	this._debugHelper = null;
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
    this._perFrameVS.Declare('SceneData.AmbientColor', 4);
    this._perFrameVS.Declare('SceneData.FogColor', 4);
    this._perFrameVS.Create();
	
	this._perFramePS = new Tw2RawData();
    this._perFramePS.Declare('ViewInverseTransposeMat', 16);
    this._perFramePS.Declare('ProjectionMat', 16);
    this._perFramePS.Declare('ViewMat', 16);
    this._perFramePS.Declare('EnvMapRotationMat', 16);
    this._perFramePS.Declare('SunData.DirWorld', 4);
    this._perFramePS.Declare('SunData.DiffuseColor', 4);
    this._perFramePS.Declare('SceneData.AmbientColor', 4);
    this._perFramePS.Declare('SceneData.FogColor', 4);
    this._perFramePS.Declare('ShadowCameraRange', 4);
    this._perFramePS.Declare('TargetResolution', 4);
    this._perFramePS.Create();
    
    variableStore.RegisterVariable('ShadowLightness', 0);
}

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
}

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
}

EveSpaceScene.prototype.RenderBatches = function (mode)
{
	for (var i = 0; i < this.objects.length; ++i)
	{
        if (typeof(this.objects[i].GetBatches) != 'undefined')
        {
    		this.objects[i].GetBatches(mode, this._batches);
    	}
	}
}

EveSpaceScene.prototype.ApplyPerFrameData = function ()
{
    var view = device.view;
    var projection = device.projection;

    var viewInverseTranspose = mat4.inverse(view, mat4.create());
    this._perFrameVS.Set('ViewInverseTransposeMat', viewInverseTranspose);
    mat4.transpose(mat4.multiply(projection, view, this._perFrameVS.Get('ViewProjectionMat')));
    mat4.transpose(view, this._perFrameVS.Get('ViewMat'));
    mat4.transpose(projection, this._perFrameVS.Get('ProjectionMat'));

    var envMapTransform = mat4.scale(quat4.toMat4(this.envMapRotation), this.envMapScaling, mat4.create());
    mat4.transpose(envMapTransform);
    this._perFrameVS.Set('EnvMapRotationMat', envMapTransform);
    vec3.normalize(vec3.negate(this.sunDirection, this._perFrameVS.Get('SunData.DirWorld')));
    this._perFrameVS.Set('SunData.DiffuseColor', this.sunDiffuseColor);
    var fogFactors = this._perFrameVS.Get('FogFactors');
    var distance = this.fogEnd - this.fogStart;
    if (Math.abs(distance) < 1e-5)
    {
        distance = 1e-5;
    }
    var factor = 1.0 / distance;
    fogFactors[0] = this.fogEnd * factor;
    fogFactors[1] = factor;
    fogFactors[2] = this.fogMax;

    var targetResolution = this._perFrameVS.Get('TargetResolution');
    // resolution of rendertarget
    targetResolution[0] = device.viewportWidth;
    targetResolution[1] = device.viewportHeight;
    // fov in both ways: width (x) and (height (y)
    var aspectRatio = (projection[0] ? projection[5] / projection[0] : 0.0);
    var aspectAdjustment = 1.0;
    if (aspectRatio > 1.6)
    {
        aspectAdjustment = aspectRatio / 1.6;
    }

    var fov = 2.0 * Math.atan(aspectAdjustment / projection[5]);

    targetResolution[3] = fov;
    targetResolution[2] = targetResolution[3] * aspectRatio;

    var viewportAdj = this._perFrameVS.Get('ViewportAdjustment');
    viewportAdj[0] = 1;
    viewportAdj[1] = 1;
    viewportAdj[2] = 1;
    viewportAdj[3] = 1;

    this._perFrameVS.Set('SceneData.AmbientColor', this.ambientColor);
    this._perFrameVS.Set('SceneData.FogColor', this.fogColor);

    this._perFramePS.Set('ViewInverseTransposeMat', viewInverseTranspose);
    mat4.transpose(view, this._perFramePS.Get('ViewMat'));
    mat4.transpose(projection, this._perFramePS.Get('ProjectionMat'));
    this._perFramePS.Set('EnvMapRotationMat', envMapTransform);
    vec3.normalize(vec3.negate(this.sunDirection, this._perFramePS.Get('SunData.DirWorld')));
    this._perFramePS.Set('SunData.DiffuseColor', this.sunDiffuseColor);
    this._perFramePS.Set('SceneData.AmbientColor', this.ambientColor);
    this._perFramePS.Set('SceneData.FogColor', this.fogColor);
    this._perFramePS.Get('ShadowCameraRange')[0] = 1;
    var targetResolution = this._perFramePS.Get('TargetResolution');
    targetResolution[0] = device.viewportWidth;
    targetResolution[1] = device.viewportHeight;
    targetResolution[3] = fov;
    targetResolution[2] = targetResolution[3] * aspectRatio;

    this._envMapHandle.textureRes = this.envMapRes;
    this._envMap1Handle.textureRes = this.envMap1Res;
    this._envMap2Handle.textureRes = this.envMap2Res;
    this._envMap3Handle.textureRes = this.envMap3Res;

    device.perFrameVSData = this._perFrameVS;
    device.perFramePSData = this._perFramePS;
}

EveSpaceScene.prototype.Render = function ()
{
    this.ApplyPerFrameData();

    if (this.backgroundRenderingEnabled && this.backgroundEffect)
    {
        device.SetStandardStates(device.RM_FULLSCREEN);
        device.RenderCameraSpaceQuad(this.backgroundEffect);
    }

    var id = mat4.identity(mat4.create());
    for (var i = 0; i < this.objects.length; ++i)
    {
        if (this.objects[i].UpdateViewDependentData)
        {
            this.objects[i].UpdateViewDependentData(id);
        }
    }
    for (var i = 0; i < this.lensflares.length; ++i)
    {
        this.lensflares[i].PrepareRender();
    }

    this._batches.Clear();

    this.RenderBatches(device.RM_OPAQUE);
    this.RenderBatches(device.RM_DECAL);
    this.RenderBatches(device.RM_TRANSPARENT);
    this.RenderBatches(device.RM_ADDITIVE);

    for (var i = 0; i < this.lensflares.length; ++i)
    {
        this.lensflares[i].GetBatches(device.RM_ADDITIVE, this._batches);
    }

    this._batches.Render();

    for (var i = 0; i < this.lensflares.length; ++i)
    {
        this.lensflares[i].UpdateOccluders();
    }

    if (this.renderDebugInfo)
    {
        if (this._debugHelper == null)
        {
            this._debugHelper = new Tw2DebugRenderer();
        }
        for (var i = 0; i < this.objects.length; ++i)
        {
            if (typeof (this.objects[i].RenderDebugInfo) != 'undefined')
            {
                this.objects[i].RenderDebugInfo(this._debugHelper);
            }
        }
        this._debugHelper.Render();
    }
}

EveSpaceScene.prototype.Update = function (dt)
{
	for (var i = 0; i < this.objects.length; ++i)
	{
        if (typeof(this.objects[i].Update) != 'undefined')
        {
            this.objects[i].Update(dt);
        }
	}
}