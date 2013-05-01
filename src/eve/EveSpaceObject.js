function EveSpaceObject()
{
	this.name = '';
	this.mesh = null;
	this.spriteSets = new Array();
	this.boundingSphereCenter = vec3.create();
	this.boundingSphereRadius = 0;
	this.locators = new Array();
	this.turretSets = new Array();
	this.decals = new Array();
	this.spotlightSets = new Array();
	
	this.transform = mat4.create();
	mat4.identity(this.transform);
	
	this.children = new Array();
	
	this._perObjectData = new Tw2PerObjectData();
	this._perObjectData.perObjectVSData = new Tw2RawData();
	this._perObjectData.perObjectVSData.Declare('WorldMat', 16);
	this._perObjectData.perObjectVSData.Declare('Shipdata', 4);
	this._perObjectData.perObjectVSData.Declare('JointMat', 196);
	this._perObjectData.perObjectVSData.Create();
	
	this._perObjectData.perObjectPSData = new Tw2RawData();
	this._perObjectData.perObjectPSData.Declare('Shipdata', 4);
	this._perObjectData.perObjectPSData.Create();
	
	this.animation = new Tw2AnimationController();
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

EveSpaceObject.prototype.GetBatches = function (mode, accumulator)
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
    
	if (this.mesh != null)
	{
		this.mesh.GetBatches(mode, accumulator, this._perObjectData);
	}
	
	
	for (var i = 0; i < this.spriteSets.length; ++i)
	{
		this.spriteSets[i].GetBatches(mode, accumulator, this._perObjectData);
	}
	for (var i = 0; i < this.spotlightSets.length; ++i)
	{
		this.spotlightSets[i].GetBatches(mode, accumulator, this._perObjectData);
	}
	for (var i = 0; i < this.children.length; ++i)
	{
		this.children[i].GetBatches(mode, accumulator, this._perObjectData);
	}
	for (var i = 0; i < this.decals.length; ++i)
	{
		this.decals[i].GetBatches(mode, accumulator, this._perObjectData);
	}
};

EveSpaceObject.prototype.Update = function (dt)
{
	for (var i = 0; i < this.spriteSets.length; ++i)
	{
		this.spriteSets[i].Update(dt);
	}
	for (var i = 0; i < this.children.length; ++i)
	{
		this.children[i].Update(dt);
	}
	this.animation.Update(dt);
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