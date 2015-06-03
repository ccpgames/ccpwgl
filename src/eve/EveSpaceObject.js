function EveSpaceObject()
{
	this.name = '';
	this.mesh = null;
	this.spriteSets = [];
	this.boundingSphereCenter = vec3.create();
	this.boundingSphereRadius = 0;
	this.locators = [];
	this.turretSets = [];
	this.decals = [];
	this.spotlightSets = [];
	this.planeSets = [];
	this.curveSets = [];
	
	this.transform = mat4.create();
	mat4.identity(this.transform);
	
	this.children = [];
	
	this._perObjectData = new Tw2PerObjectData();
	this._perObjectData.perObjectVSData = new Tw2RawData();
	this._perObjectData.perObjectVSData.Declare('WorldMat', 16);
	this._perObjectData.perObjectVSData.Declare('Shipdata', 4);
	this._perObjectData.perObjectVSData.Declare('Clipdata1', 4);
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

	this.animation = new Tw2AnimationController();

	this.lod = 3;
	this._tempVec = vec3.create();
}

EveSpaceObject.prototype.Initialize = function ()
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

EveSpaceObject.prototype.ResetLod = function ()
{
    this.lod = 3;
}

EveSpaceObject.prototype.UpdateLod = function (frustum)
{
    var center = mat4.multiplyVec3(this.transform, this.boundingSphereCenter, this._tempVec);

    if (frustum.IsSphereVisible(center, this.boundingSphereRadius))
    {
        if (frustum.GetPixelSizeAccross(center, this.boundingSphereRadius) < 100)
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

EveSpaceObject.prototype.UpdateViewDependentData = function ()
{
    for (var i = 0; i < this.children.length; ++i)
    {
        this.children[i].UpdateViewDependentData(this.transform);
    }
    mat4.transpose(this.transform, this._perObjectData.perObjectVSData.Get('WorldMat'));

    if (this.animation.animations.length)
    {
        this._perObjectData.perObjectVSData.Set('JointMat', this.animation.GetBoneMatrixes(0));
    }
}

EveSpaceObject.prototype.GetBatches = function (mode, accumulator)
{
    if (this.mesh != null && this.lod > 0)
    {
        this.mesh.GetBatches(mode, accumulator, this._perObjectData);
    }

    if (this.lod > 1)
    {
        for (var i = 0; i < this.spriteSets.length; ++i)
        {
            this.spriteSets[i].GetBatches(mode, accumulator, this._perObjectData);
        }
        for (var i = 0; i < this.spotlightSets.length; ++i)
        {
            this.spotlightSets[i].GetBatches(mode, accumulator, this._perObjectData);
        }
        for (var i = 0; i < this.planeSets.length; ++i)
        {
            this.planeSets[i].GetBatches(mode, accumulator, this._perObjectData);
        }
        for (var i = 0; i < this.decals.length; ++i)
        {
            this.decals[i].GetBatches(mode, accumulator, this._perObjectData);
        }
    }
    for (var i = 0; i < this.children.length; ++i)
    {
        this.children[i].GetBatches(mode, accumulator, this._perObjectData);
    }
};

EveSpaceObject.prototype.Update = function (dt)
{
    if (this.lod > 0)
    {
        for (var i = 0; i < this.spriteSets.length; ++i)
        {
            this.spriteSets[i].Update(dt);
        }
        for (var i = 0; i < this.children.length; ++i)
        {
            this.children[i].Update(dt);
        }
        for (var i = 0; i < this.curveSets.length; ++i)
        {
            this.curveSets[i].Update(dt);
        }
        this.animation.Update(dt);
    }
};

EveSpaceObject.prototype.GetLocatorCount = function (prefix)
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

EveSpaceObject.prototype.FindLocatorJointByName = function (name)
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

EveSpaceObject.prototype.FindLocatorTransformByName = function (name)
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


EveSpaceObject.prototype.RenderDebugInfo = function (debugHelper)
{
    this.animation.RenderDebugInfo(debugHelper);
};

EveStation = EveSpaceObject;