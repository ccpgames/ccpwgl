function EvePlanet()
{
    this.highDetail = new EveTransform();
    this.effectHeight = new Tw2Effect();
    this.itemID = 0;
    this.heightMapResPath1 = '';
    this.heightMapResPath2 = '';
    this.heightMap = new Tw2RenderTarget();
    this.hightDirty = false;
    this.lockedResources = [];
}


EvePlanet.prototype.Create = function (itemID, planetPath, atmospherePath, heightMap1, heightMap2)
{
    this.itemID = itemID;
    this.heightMapResPath1 = heightMap1;
    this.heightMapResPath2 = heightMap2;

    this.highDetail.children = [];
    var self = this;
    resMan.GetObject(planetPath, function (obj) { self.highDetail.children.unshift(obj); self._MeshLoaded(); });
    if (atmospherePath)
    {
        resMan.GetObject(atmospherePath, function (obj) { self.highDetail.children.push(obj); });
    }
    this.hightDirty = true;
};

EvePlanet.prototype.GetResources = function (obj, visited, result)
{
    if (visited.indexOf(obj) != -1)
    {
        return;
    }
    visited.push(obj);
    if (obj && typeof (obj['doNotPurge']) != typeof (undefined))
    {
        result.push(obj);
        return;
    }
    for (var prop in obj)
    {
        if (typeof (obj[prop]) == "object")
        {
            this.GetResources(obj[prop], visited, result);
        }
    }
};

EvePlanet.prototype._MeshLoaded = function ()
{
    this.lockedResources = [];
    this.GetResources(this.highDetail, [], this.lockedResources);

    var mainMesh = this.highDetail.children[0].mesh;
    var originalEffect = null;
    if (mainMesh.transparentAreas.length)
    {
        originalEffect = mainMesh.transparentAreas[0].effect;
        var resPath = originalEffect.effectFilePath;
    }
    else if (mainMesh.opaqueAreas.length)
    {
        originalEffect = mainMesh.opaqueAreas[0].effect;
        var resPath = originalEffect.effectFilePath;
    }
    else
    {
        var resPath = "res:/Graphics/Effect/Managed/Space/Planet/EarthlikePlanet.fx";
    }
    resPath = resPath.replace('.fx', 'BlitHeight.fx');

    for (var param in originalEffect.parameters)
    {
        this.effectHeight.parameters[param] = originalEffect.parameters[param];
    }
    for (var i = 0; i < this.highDetail.children[0].children.length; ++i)
    {
        mainMesh = this.highDetail.children[0].children[i].mesh;
        if (!mainMesh)
        {
            continue;
        }
        originalEffect = null;
        if (mainMesh.transparentAreas.length)
        {
            originalEffect = mainMesh.transparentAreas[0].effect;
        }
        else if (mainMesh.opaqueAreas.length)
        {
            originalEffect = mainMesh.opaqueAreas[0].effect;
        }
        else
        {
            continue;
        }
        for (var param in originalEffect.parameters)
        {
            this.effectHeight.parameters[param] = originalEffect.parameters[param];
        }
    }

    var param = new Tw2TextureParameter();
    param.name = 'NormalHeight1';
    param.resourcePath = this.heightMapResPath1;
    param.Initialize();
    this.lockedResources.push(param.textureRes);
    this.effectHeight.parameters[param.name] = param;
    param = new Tw2TextureParameter();
    param.name = 'NormalHeight2';
    param.resourcePath = this.heightMapResPath2;
    param.Initialize();
    this.lockedResources.push(param.textureRes);
    this.effectHeight.parameters[param.name] = param;
    param = new Tw2FloatParameter();
    param.name = 'Random';
    param.value = this.itemID % 100;
    this.effectHeight.parameters[param.name] = param;
    param = new Tw2FloatParameter();
    param.name = 'TargetTextureHeight';
    param.value = 1024;
    this.effectHeight.parameters[param.name] = param;

    this.effectHeight.effectFilePath = resPath;
    this.effectHeight.Initialize();
    this.hightDirty = true;
    this.heightMap.Create(2048, 1024, false);

    for (var i = 0; i < this.lockedResources.length; ++i)
    {
        this.lockedResources[i].doNotPurge++;
        if (this.lockedResources[i].IsPurged())
        {
            this.lockedResources[i].Reload();
        }
    }
};

EvePlanet.prototype.GetBatches = function (mode, accumulator)
{
    if (this.hightDirty && !resMan.IsLoading() && this.heightMapResPath1 != '')
    {
        this.heightMap.Set();
        device.SetStandardStates(device.RM_FULLSCREEN);
        device.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        device.gl.clear(device.gl.COLOR_BUFFER_BIT);
        device.RenderFullScreenQuad(this.effectHeight);
        this.heightMap.Unset();
        this.hightDirty = false;
        for (var i = 0; i < this.lockedResources.length; ++i)
        {
            this.lockedResources[i].doNotPurge--;
        }
        var mainMesh = this.highDetail.children[0].mesh;
        var originalEffect = null;
        if (mainMesh.transparentAreas.length)
        {
            originalEffect = mainMesh.transparentAreas[0].effect;
        }
        else if (mainMesh.opaqueAreas.length)
        {
            originalEffect = mainMesh.opaqueAreas[0].effect;
        }
        if (originalEffect)
        {
            originalEffect.parameters['HeightMap'].textureRes = this.heightMap.texture;
        }
    }
    this.highDetail.GetBatches(mode, accumulator);
    //    if (!this.hightDirty)
    //    {
    //        device.gl.viewport(0, 0, 400, 200);
    //        device.SetStandardStates(device.RM_FULLSCREEN);
    //        device.RenderTexture(this.heightMap.texture);
    //        device.gl.viewport(0, 0, device.viewportWidth, device.viewportHeight);
    //    }
};

EvePlanet.prototype.Update = function (dt)
{
    this.highDetail.Update(dt);
};

EvePlanet.prototype.UpdateViewDependentData = function (parentTransform)
{
    this.highDetail.UpdateViewDependentData(parentTransform);
};
