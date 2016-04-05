/**
 * EvePlanet
 * @property {boolean} display
 * @property {EveTransform} highDetail
 * @property {Tw2Effect} effectHeight
 * @property {number} itemID
 * @property {string} heightMapResPath1
 * @property {string} heightMapResPath2
 * @property {Tw2RenderTarget} heightMap
 * @property {boolean} heightDirty
 * @property {Array} lockedResources
 * @property {boolean} zOnlyModel
 * @property {Array.<Tw2Res>} watchedResources
 * @constructor
 */
function EvePlanet()
{
    this.display = true;
    this.highDetail = new EveTransform();
    this.effectHeight = new Tw2Effect();
    this.itemID = 0;
    this.heightMapResPath1 = '';
    this.heightMapResPath2 = '';
    this.heightMap = new Tw2RenderTarget();
    this.heightDirty = false;
    this.lockedResources = [];
    this.zOnlyModel = null;
    this.watchedResources = [];
}

/**
 * Creates the planet
 * @param {number} itemID - the item id is used for randomization
 * @param {string} planetPath - .red file for a planet, or planet template
 * @param {string} [atmospherePath] - optional .red file for a planet's atmosphere
 * @param {string} heightMap1
 * @param {string} heightMap2
 */
EvePlanet.prototype.Create = function(itemID, planetPath, atmospherePath, heightMap1, heightMap2)
{
    this.itemID = itemID;
    this.heightMapResPath1 = heightMap1;
    this.heightMapResPath2 = heightMap2;
    this.highDetail.children = [];
    var self = this;

    resMan.GetObject(planetPath, function(obj)
    {
        self.highDetail.children.unshift(obj);
        self._MeshLoaded();
    });

    if (atmospherePath)
    {
        resMan.GetObject(atmospherePath, function(obj)
        {
            self.highDetail.children.push(obj);
        });
    }
    this.heightDirty = true;
    resMan.GetObject('res:/dx9/model/worldobject/planet/planetzonly.red', function(obj)
    {
        self.zOnlyModel = obj;
    })
};

/**
 * GetResources
 * @param obj
 * @param visited
 * @param result
 * @constructor
 */
EvePlanet.prototype.GetResources = function(obj, visited, result)
{
    if (visited.indexOf(obj) != -1)
    {
        return;
    }
    visited.push(obj);
    if (obj && typeof(obj['doNotPurge']) != typeof(undefined))
    {
        result.push(obj);
        return;
    }
    for (var prop in obj)
    {
        if (obj.hasOwnProperty(prop))
        {
            if (typeof(obj[prop]) == "object")
            {
                this.GetResources(obj[prop], visited, result);
            }
        }
    }
};

/**
 * Internal helper function that fires when the planet's mesh has loaded
 * @private
 */
EvePlanet.prototype._MeshLoaded = function()
{
    this.lockedResources = [];
    this.GetResources(this.highDetail, [], this.lockedResources);

    var mainMesh = this.highDetail.children[0].mesh;
    var originalEffect = null;
    var resPath;
    if (mainMesh.transparentAreas.length)
    {
        originalEffect = mainMesh.transparentAreas[0].effect;
        resPath = originalEffect.effectFilePath;
    }
    else if (mainMesh.opaqueAreas.length)
    {
        originalEffect = mainMesh.opaqueAreas[0].effect;
        resPath = originalEffect.effectFilePath;
    }
    else
    {
        resPath = "res:/Graphics/Effect/Managed/Space/Planet/EarthlikePlanet.fx";
    }
    resPath = resPath.replace('.fx', 'BlitHeight.fx');
    this.watchedResources = [];

    for (var param in originalEffect.parameters)
    {
        this.effectHeight.parameters[param] = originalEffect.parameters[param];
        if ('textureRes' in originalEffect.parameters[param])
        {
            this.watchedResources.push(originalEffect.parameters[param].textureRes);
        }
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
        for (param in originalEffect.parameters)
        {
            if (originalEffect.parameters.hasOwnProperty(param))
            {
                this.effectHeight.parameters[param] = originalEffect.parameters[param];
                if ('textureRes' in originalEffect.parameters[param])
                {
                    this.watchedResources.push(originalEffect.parameters[param].textureRes);
                }
            }
        }
    }

    param = new Tw2TextureParameter();
    param.name = 'NormalHeight1';
    param.resourcePath = this.heightMapResPath1;
    param.Initialize();
    this.watchedResources.push(param.textureRes);
    this.lockedResources.push(param.textureRes);
    this.effectHeight.parameters[param.name] = param;
    param = new Tw2TextureParameter();
    param.name = 'NormalHeight2';
    param.resourcePath = this.heightMapResPath2;
    param.Initialize();
    this.lockedResources.push(param.textureRes);
    this.watchedResources.push(param.textureRes);
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
    this.heightDirty = true;
    this.heightMap.Create(2048, 1024, false);
    this.watchedResources.push(this.effectHeight.effectRes);

    for (i = 0; i < this.lockedResources.length; ++i)
    {
        this.lockedResources[i].doNotPurge++;
        if (this.lockedResources[i].IsPurged())
        {
            this.lockedResources[i].Reload();
        }
    }
};

/**
 * Gets render batches
 * @param {RenderMode} mode
 * @param {Tw2BatchAccumulator} accumulator
 */
EvePlanet.prototype.GetBatches = function(mode, accumulator)
{
    if (this.display && this.heightDirty && this.watchedResources.length && this.heightMapResPath1 != '')
    {
        for (var i = 0; i < this.watchedResources.length; ++i)
        {
            if (this.watchedResources[i] && !this.watchedResources[i].IsGood())
            {
                return;
            }
        }
        this.watchedResources = [];
        this.heightMap.Set();
        device.SetStandardStates(device.RM_FULLSCREEN);
        device.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        device.gl.clear(device.gl.COLOR_BUFFER_BIT);
        device.RenderFullScreenQuad(this.effectHeight);
        this.heightMap.Unset();
        this.heightDirty = false;
        for (i = 0; i < this.lockedResources.length; ++i)
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
    
    if (this.display)
    {
        this.highDetail.GetBatches(mode, accumulator);
    }
};

/**
 * Gets z buffer only batches
 * @param {RenderMode} mode
 * @param {Tw2BatchAccumulator} accumulator
 */
EvePlanet.prototype.GetZOnlyBatches = function(mode, accumulator)
{
    if (this.display && this.zOnlyModel)
    {
        this.zOnlyModel.GetBatches(mode, accumulator);
    }
};

/**
 * Per frame update
 * @param {number} dt - delta time
 */
EvePlanet.prototype.Update = function(dt)
{
    this.highDetail.Update(dt);
};

/**
 * Updates view dependent data
 * @param {mat4} parentTransform
 */
EvePlanet.prototype.UpdateViewDependentData = function(parentTransform)
{
    this.highDetail.UpdateViewDependentData(parentTransform);
    if (this.zOnlyModel)
    {
        this.zOnlyModel.translation = this.highDetail.translation;
        this.zOnlyModel.scaling = this.highDetail.scaling;
        this.zOnlyModel.UpdateViewDependentData(parentTransform);
    }
};
