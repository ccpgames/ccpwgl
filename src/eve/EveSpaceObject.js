/**
 * EveObject
 * @typedef {EveSpaceObject|EveStation|EveShip|EveTransform|EveEffectRoot|EvePlanet} EveObject
 */

/**
 * EveSpaceObject
 * @parameter {String} name
 * @parameter {Number} lod
 * @parameter {Tw2Mesh} mesh
 * @parameter {Array.<EveLocator>} locators
 * @parameter {Array.<EveSpriteSet>} spriteSets
 * @parameter {Array.<EveTurretSet>} turretSets
 * @parameter {Array.<EveSpaceObjectDecal>} decals
 * @parameter {Array.<EveSpotlightSet>} spotlightSets
 * @parameter {Array.<EvePlaneSet>} planeSets
 * @parameter {Array.<Tw2CurveSet>} curveSets
 * @parameter {Array.<EveCurveLineSet>} lineSets
 * @parameter {Array.<EveMeshOverlayEffect>} overlayEffects
 * @parameter {Array.<{}>} children
 * @parameter {vec3} boundingSphereCenter
 * @parameter {Number} boundingSphereRadius
 * @parameter {vec3} shapeEllipsoidRadius
 * @parameter {vec3} shapeEllipsoidCenter
 * @parameter {mat4} transform
 * @parameter {Tw2AnimationController} animation
 * @parameter {boolean} display - Toggles rendering of the whole space object
 * @parameter {boolean} displayMesh - Toggles mesh rendering
 * @parameter {boolean} displayChildren - toggles rendering of children
 * @parameter {boolean} displaySprites - Toggles sprite set rendering
 * @parameter {boolean} displayDecals - Toggles decal rendering
 * @parameter {boolean} displaySpotlights - Toggles spotlight set rendering
 * @parameter {boolean} displayPlanes - toggles plane set rendering
 * @parameter {boolean} displayLines - toggles line set rendering
 * @parameter {boolean} displayOverlays - toggles overlay effect rendering
 * @parameter {Number} displayKillCounterValue - number of kills to show on kill counter decals
 * @parameter {vec3} _tempVec
 * @parameter {Tw2PerObjectData} _perObjectData
 * @constructor
 */
function EveSpaceObject()
{
    this.name = '';
    this.lod = 3;
    this.mesh = null;
    this.locators = [];

    this.spriteSets = [];
    this.turretSets = [];
    this.decals = [];
    this.spotlightSets = [];
    this.planeSets = [];
    this.curveSets = [];
    this.lineSets = [];
    this.overlayEffects = [];
    this.children = [];
    this.effectChildren = [];

    this.boundingSphereCenter = vec3.create();
    this.boundingSphereRadius = 0;
    this.shapeEllipsoidRadius = vec3.create();
    this.shapeEllipsoidCenter = vec3.create();

    this.transform = mat4.identity(mat4.create());
    this.animation = new Tw2AnimationController();

    this.display = true;
    this.displayMesh = true;
    this.displayChildren = true;
    this.displayPlanes = true;
    this.displaySpotlights = true;
    this.displayDecals = true;
    this.displaySprites = true;
    this.displayOverlays = true;
    this.displayLines = true;

    this.displayKillCounterValue = 0;

    this._tempVec = vec3.create();

    this._perObjectData = new Tw2PerObjectData();
    this._perObjectData.perObjectVSData = new Tw2RawData();
    this._perObjectData.perObjectVSData.Declare('WorldMat', 16);
    this._perObjectData.perObjectVSData.Declare('WorldMatLast', 16);
    this._perObjectData.perObjectVSData.Declare('Shipdata', 4);
    this._perObjectData.perObjectVSData.Declare('Clipdata1', 4);
    this._perObjectData.perObjectVSData.Declare('EllipsoidRadii', 4);
    this._perObjectData.perObjectVSData.Declare('EllipsoidCenter', 4);
    this._perObjectData.perObjectVSData.Declare('JointMat', 696);
    this._perObjectData.perObjectVSData.Create();

    this._perObjectData.perObjectPSData = new Tw2RawData();
    this._perObjectData.perObjectPSData.Declare('Shipdata', 4);
    this._perObjectData.perObjectPSData.Declare('Clipdata1', 4);
    this._perObjectData.perObjectPSData.Declare('Clipdata2', 4);
    this._perObjectData.perObjectPSData.Declare('ShLighting', 4 * 7);
    this._perObjectData.perObjectPSData.Declare('customMaskMatrix', 16);
    this._perObjectData.perObjectPSData.Create();

    this._perObjectData.perObjectVSData.Get('Shipdata')[1] = 1;
    this._perObjectData.perObjectPSData.Get('Shipdata')[1] = 1;
    this._perObjectData.perObjectVSData.Get('Shipdata')[3] = -10;
    this._perObjectData.perObjectPSData.Get('Shipdata')[3] = 1;
}

/**
 * Initializes the EveSpaceObject
 */
EveSpaceObject.prototype.Initialize = function()
{
    if (this.mesh)
    {
        this.animation.SetGeometryResource(this.mesh.geometryResource);
        for (var i = 0; i < this.decals.length; ++i)
        {
            this.decals[i].SetParentGeometry(this.mesh.geometryResource);
        }
    }
};

/**
 * Gets object's res objects
 * @param {Array} [out=[]] - Optional receiving array
 * @param {Boolean} excludeChildren - True to exclude children's res objects
 * @returns {Array.<Tw2EffectRes|Tw2TextureRes|Tw2GeometryRes>} [out]
 */
EveSpaceObject.prototype.GetResources = function(out, excludeChildren)
{
    if (out === undefined)
    {
        out = [];
    }

    var self = this;

    if (this.mesh !== null)
    {
        this.mesh.GetResources(out);
    }

    if (this.animation !== null)
    {
        this.animation.GetResources(out);
    }

    function getSetResources(setName, out)
    {
        for (var i = 0; i < self[setName].length; i++)
        {
            if ('GetResources' in self[setName][i])
            {
                self[setName][i].GetResources(out);
            }
        }
    }

    getSetResources('spriteSets', out);
    getSetResources('turretSets', out);
    getSetResources('decals', out);
    getSetResources('spotlightSets', out);
    getSetResources('planeSets', out);
    getSetResources('lineSets', out);
    getSetResources('overlayEffects', out);
    getSetResources('effectChildren', out);

    if (!excludeChildren)
    {
        getSetResources('children', out);
    }

    return out;
}


/**
 * Resets the lod
 */
EveSpaceObject.prototype.ResetLod = function()
{
    this.lod = 3;
}

/**
 * Updates the lod
 * @param {Tw2Frustum} frustum
 */
EveSpaceObject.prototype.UpdateLod = function(frustum)
{
    var center = mat4.multiplyVec3(this.transform, this.boundingSphereCenter, this._tempVec);

    if (frustum.IsSphereVisible(center, this.boundingSphereRadius))
    {
        if (frustum.GetPixelSizeAcross(center, this.boundingSphereRadius) < 100)
        {
            this.lod = 1;
        }
        else
        {
            this.lod = 2;
        }
    }
    else
    {
        this.lod = 0;
    }
}

/**
 * A Per frame function that updates view dependent data
 */
EveSpaceObject.prototype.UpdateViewDependentData = function()
{
    for (var i = 0; i < this.children.length; ++i)
    {
        this.children[i].UpdateViewDependentData(this.transform);
    }

    mat4.transpose(this.transform, this._perObjectData.perObjectVSData.Get('WorldMat'));
    mat4.transpose(this.transform, this._perObjectData.perObjectVSData.Get('WorldMatLast'));
    var center = this._perObjectData.perObjectVSData.Get('EllipsoidCenter');
    var radii = this._perObjectData.perObjectVSData.Get('EllipsoidRadii');
    if (this.shapeEllipsoidRadius[0] > 0)
    {
        center[0] = this.shapeEllipsoidCenter[0];
        center[1] = this.shapeEllipsoidCenter[1];
        center[2] = this.shapeEllipsoidCenter[2];
        radii[0] = this.shapeEllipsoidRadius[0];
        radii[1] = this.shapeEllipsoidRadius[1];
        radii[2] = this.shapeEllipsoidRadius[2];
    }
    else if (this.mesh && this.mesh.geometryResource && this.mesh.geometryResource.IsGood())
    {
        vec3.subtract(this.mesh.geometryResource.maxBounds, this.mesh.geometryResource.minBounds, center);
        vec3.scale(center, 0.5 * 1.732050807);
        vec3.add(this.mesh.geometryResource.maxBounds, this.mesh.geometryResource.minBounds, radii);
        vec3.scale(radii, 0.5);
    }

    if (this.animation.animations.length)
    {
        this._perObjectData.perObjectVSData.Set('JointMat', this.animation.GetBoneMatrices(0));
    }

    for (var s = 0; s < this.lineSets.length; ++s)
    {
        this.lineSets[s].UpdateViewDependentData(this.transform);
    }
}

/**
 * Gets render batches
 * @param {RenderMode} mode
 * @param {Tw2BatchAccumulator} accumulator
 */
EveSpaceObject.prototype.GetBatches = function(mode, accumulator)
{
    if (this.display)
    {
        if (this.displayMesh && this.mesh != null && this.lod > 0)
        {
            this.mesh.GetBatches(mode, accumulator, this._perObjectData);
        }

        if (this.lod > 1)
        {
            var i;

            if (this.displaySprites)
            {
                for (i = 0; i < this.spriteSets.length; ++i)
                {
                    this.spriteSets[i].GetBatches(mode, accumulator, this._perObjectData, this.transform);
                }
            }

            if (this.displaySpotlights)
            {
                for (i = 0; i < this.spotlightSets.length; ++i)
                {
                    this.spotlightSets[i].GetBatches(mode, accumulator, this._perObjectData);
                }
            }

            if (this.displayPlanes)
            {
                for (i = 0; i < this.planeSets.length; ++i)
                {
                    this.planeSets[i].GetBatches(mode, accumulator, this._perObjectData);
                }
            }

            if (this.displayDecals)
            {
                for (i = 0; i < this.decals.length; ++i)
                {
                    this.decals[i].GetBatches(mode, accumulator, this._perObjectData, this.displayKillCounterValue);
                }
            }

            if (this.displayLines)
            {
                for (var i = 0; i < this.lineSets.length; ++i)
                {
                    this.lineSets[i].GetBatches(mode, accumulator);
                }
            }
        }

        if (this.displayChildren)
        {
            for (i = 0; i < this.children.length; ++i)
            {
                this.children[i].GetBatches(mode, accumulator, this._perObjectData);
            }
            for (i = 0; i < this.effectChildren.length; ++i)
            {
                this.effectChildren[i].GetBatches(mode, accumulator, this._perObjectData);
            }
        }

        if (this.displayOverlays && this.mesh && this.mesh.geometryResource && this.mesh.geometryResource.IsGood())
        {
            for (i = 0; i < this.overlayEffects.length; ++i)
            {
                var effects = this.overlayEffects[i].GetEffects(mode);
                if (effects)
                {
                    for (var j = 0; j < effects.length; ++j)
                    {
                        var batch = new Tw2GeometryBatch();
                        batch.renderMode = mode;
                        batch.perObjectData = this._perObjectData;
                        batch.geometryRes = this.mesh.geometryResource;
                        batch.meshIx = this.mesh.meshIndex;
                        batch.start = 0;
                        batch.count = this.mesh.geometryResource.meshes[this.mesh.meshIndex].areas.length;
                        batch.effect = effects[j];
                        accumulator.Commit(batch);
                    }
                }
            }
        }
    }
};

/**
 * Per frame update
 * @param {Number} dt - delta time
 */
EveSpaceObject.prototype.Update = function(dt)
{
    if (this.lod > 0)
    {
        var i;
        for (i = 0; i < this.spriteSets.length; ++i)
        {
            this.spriteSets[i].Update(dt);
        }
        for (i = 0; i < this.children.length; ++i)
        {
            this.children[i].Update(dt);
        }
        for (i = 0; i < this.effectChildren.length; ++i)
        {
            this.effectChildren[i].Update(this.transform);
        }
        for (i = 0; i < this.curveSets.length; ++i)
        {
            this.curveSets[i].Update(dt);
        }
        for (i = 0; i < this.overlayEffects.length; ++i)
        {
            this.overlayEffects[i].Update(dt);
        }
        this.animation.Update(dt);
    }
};

/**
 * Gets locator count for a specific locator group
 * @param {String} prefix
 * @returns {number}
 */
EveSpaceObject.prototype.GetLocatorCount = function(prefix)
{
    var count = 0;
    for (var i = 0; i < this.locators.length; ++i)
    {
        if (this.locators[i].name.substr(0, prefix.length) == prefix)
        {
            ++count;
        }
    }
    return count;
};

/**
 * Finds a locator joint by it's name
 * @param {String} name
 * @returns {null|mat4}
 */
EveSpaceObject.prototype.FindLocatorJointByName = function(name)
{
    var model = this.animation.FindModelForMesh(0);
    if (model != null)
    {
        for (var i = 0; i < model.bones.length; ++i)
        {
            if (model.bones[i].boneRes.name == name)
            {
                return model.bones[i].worldTransform;
            }
        }
    }
    return null;
};

/**
 * Finds a locator transform by it's name
 * @param {String} name
 * @returns {null|mat4}
 */
EveSpaceObject.prototype.FindLocatorTransformByName = function(name)
{
    for (var i = 0; i < this.locators.length; ++i)
    {
        if (this.locators[i].name == name)
        {
            return this.locators[i].transform;
        }
    }
    return null;
};

/**
 * RenderDebugInfo
 * @param debugHelper
 */
EveSpaceObject.prototype.RenderDebugInfo = function(debugHelper)
{
    this.animation.RenderDebugInfo(debugHelper);
};

/**
 * EveStation inherits from EveSpaceObject
 * @type {EveSpaceObject}
 */
var EveStation = EveSpaceObject;
