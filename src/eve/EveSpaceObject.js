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
 * @parameter {boolean} display                             - Enables/ disables all batch accumulations
 * @parameter {{}} visible                                  - Batch accumulation options for the space object's elements
 * @parameter {boolean} visible.mesh                        - Enables/ disables mesh batch accumulation
 * @parameter {boolean} visible.children                    - Enables/ disables child batch accumulation
 * @parameter {boolean} visible.effectChildren              - Enables/ disables effect child batch accumulation
 * @parameter {boolean} visible.spriteSets                  - Enables/ disables sprite set batch accumulation
 * @parameter {boolean} visible.decals                      - Enables/ disables decal batch accumulation
 * @parameter {boolean} visible.spotlightSets               - Enables/ disables spotlight set batch accumulation
 * @parameter {boolean} visible.planeSets                   - Enables/ disables plane set batch accumulation
 * @parameter {boolean} visible.lineSets                    - Enables/ disables lines set batch accumulation
 * @parameter {boolean} visible.overlayEffects              - Enables/ disables overlay effect batch accumulation
 * @parameter {boolean} visible.killmarks                   - Enables/ disables killmark batch accumulation
 * @parameter {number} killCount                            - number of kills to show on kill counter decals
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
    this.visible = {};
    this.visible.mesh = true;
    this.visible.children = true;
    this.visible.effectChildren = true;
    this.visible.planeSets = true;
    this.visible.spotlightSets = true;
    this.visible.decals = true;
    this.visible.spriteSets = true;
    this.visible.overlayEffects = true;
    this.visible.lineSets = true;
    this.visible.killmarks = true;
    this._customMasks = [];

    this.killCount = 0;


    this._tempVec = vec3.create();

    this._perObjectData = new Tw2PerObjectData();
    this._perObjectData.perObjectVSData = new Tw2RawData();
    this._perObjectData.perObjectVSData.Declare('WorldMat', 16);
    this._perObjectData.perObjectVSData.Declare('WorldMatLast', 16);
    this._perObjectData.perObjectVSData.Declare('Shipdata', 4);
    this._perObjectData.perObjectVSData.Declare('Clipdata1', 4);
    this._perObjectData.perObjectVSData.Declare('EllipsoidRadii', 4);
    this._perObjectData.perObjectVSData.Declare('EllipsoidCenter', 4);
    this._perObjectData.perObjectVSData.Declare('CustomMaskMatrix0', 16);
    this._perObjectData.perObjectVSData.Declare('CustomMaskMatrix1', 16);
    this._perObjectData.perObjectVSData.Declare('CustomMaskData0', 4);
    this._perObjectData.perObjectVSData.Declare('CustomMaskData1', 4);
    this._perObjectData.perObjectVSData.Declare('JointMat', 696);
    this._perObjectData.perObjectVSData.Create();

    this._perObjectData.perObjectPSData = new Tw2RawData();
    this._perObjectData.perObjectPSData.Declare('Shipdata', 4);
    this._perObjectData.perObjectPSData.Declare('Clipdata1', 4);
    this._perObjectData.perObjectPSData.Declare('Clipdata2', 4);
    this._perObjectData.perObjectPSData.Declare('ShLighting', 4 * 7);
    this._perObjectData.perObjectPSData.Declare('CustomMaskMaterialID0', 4);
    this._perObjectData.perObjectPSData.Declare('CustomMaskMaterialID1', 4);
    this._perObjectData.perObjectPSData.Declare('CustomMaskTarget0', 4);
    this._perObjectData.perObjectPSData.Declare('CustomMaskTarget1', 4);
    this._perObjectData.perObjectPSData.Create();

    this._perObjectData.perObjectVSData.Get('Shipdata')[1] = 1;
    this._perObjectData.perObjectPSData.Get('Shipdata')[1] = 1;
    this._perObjectData.perObjectVSData.Get('Shipdata')[3] = -10;
    this._perObjectData.perObjectPSData.Get('Shipdata')[3] = 1;

    mat4.identity(this._perObjectData.perObjectVSData.Get('CustomMaskMatrix0'));
    mat4.identity(this._perObjectData.perObjectVSData.Get('CustomMaskMatrix1'));
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
};


/**
 * Resets the lod
 */
EveSpaceObject.prototype.ResetLod = function()
{
    this.lod = 3;
};

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
};

EveSpaceObject.prototype.AddCustomMask = function (position, scaling, rotation, isMirrored, sourceMaterial, targetMaterials)
{
    var transform = mat4.create();

    mat4.scale(mat4.transpose(quat4.toMat4(rotation, transform)), scaling);
    transform[12] = position[0];
    transform[13] = position[1];
    transform[14] = position[2];
    mat4.inverse(transform, transform);
    mat4.transpose(transform, transform);

    this._customMasks.push({transform: transform, maskData: quat4.create([1, isMirrored ? 1 : 0, 0, 0]),
        materialID: quat4.create([sourceMaterial, 0, 0, 0]), targets: targetMaterials});
};

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


    for (i = 0; i < this._customMasks.length; ++i)
    {
        this._perObjectData.perObjectVSData.Set(i ? 'CustomMaskMatrix1' : 'CustomMaskMatrix0', this._customMasks[i].transform);
        this._perObjectData.perObjectVSData.Set(i ? 'CustomMaskData1' : 'CustomMaskData0', this._customMasks[i].maskData);
        this._perObjectData.perObjectPSData.Set(i ? 'CustomMaskMaterialID1' : 'CustomMaskMaterialID0', this._customMasks[i].materialID);
        this._perObjectData.perObjectPSData.Set(i ? 'CustomMaskTarget1' : 'CustomMaskTarget0', this._customMasks[i].targets);
    }

    if (this.animation.animations.length)
    {
        this._perObjectData.perObjectVSData.Set('JointMat', this.animation.GetBoneMatrices(0));
    }

    for (var s = 0; s < this.lineSets.length; ++s)
    {
        this.lineSets[s].UpdateViewDependentData(this.transform);
    }
};

/**
 * Gets render batches
 * @param {RenderMode} mode
 * @param {Tw2BatchAccumulator} accumulator
 */
EveSpaceObject.prototype.GetBatches = function(mode, accumulator)
{
    if (this.display)
    {
        if (this.visible.mesh && this.mesh != null && this.lod > 0)
        {
            this.mesh.GetBatches(mode, accumulator, this._perObjectData);
        }

        if (this.lod > 1)
        {
            var i;

            if (this.visible.spriteSets)
            {
                for (i = 0; i < this.spriteSets.length; ++i)
                {
                    this.spriteSets[i].GetBatches(mode, accumulator, this._perObjectData, this.transform);
                }
            }

            if (this.visible.spotlightSets)
            {
                for (i = 0; i < this.spotlightSets.length; ++i)
                {
                    this.spotlightSets[i].GetBatches(mode, accumulator, this._perObjectData);
                }
            }

            if (this.visible.planeSets)
            {
                for (i = 0; i < this.planeSets.length; ++i)
                {
                    this.planeSets[i].GetBatches(mode, accumulator, this._perObjectData);
                }
            }

            if (this.visible.decals)
            {
                for (i = 0; i < this.decals.length; ++i)
                {
                    var killCount = (this.visible.killmarks) ? this.killCount : 0;
                    this.decals[i].GetBatches(mode, accumulator, this._perObjectData, killCount);
                }
            }

            if (this.visible.lineSets)
            {
                for (var i = 0; i < this.lineSets.length; ++i)
                {
                    this.lineSets[i].GetBatches(mode, accumulator);
                }
            }
        }

        if (this.visible.children)
        {
            for (i = 0; i < this.children.length; ++i)
            {
                this.children[i].GetBatches(mode, accumulator, this._perObjectData);
            }
        }

        if (this.visible.effectChildren)
        {
            for (i = 0; i < this.effectChildren.length; ++i)
            {
                this.effectChildren[i].GetBatches(mode, accumulator, this._perObjectData);
            }
        }

        if (this.visible.overlayEffects && this.mesh && this.mesh.geometryResource && this.mesh.geometryResource.IsGood())
        {
            for (i = 0; i < this.overlayEffects.length; ++i)
            {
                if (this.overlayEffects[i].display)
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
            this.effectChildren[i].Update(this.transform, dt);
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
