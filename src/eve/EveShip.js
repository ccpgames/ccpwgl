function EveShip()
{
    this._super.constructor.call(this);

    this.boosterGain = 1;
    this.boosters = null;
    this.turretSets = [];

    this._turretSetsLocatorInfo = [];
}

function EveTurretSetLocatorInfo()
{
    this.isJoint = false;
    this.locatorTransforms = [];
}


EveShip.prototype.Initialize = function ()
{
    this._super.Initialize.call(this);
    if (this.boosters) {
        this.RebuildBoosterSet();
    }
};

EveShip.prototype.GetBatches = function (mode, accumulator)
{
    this._super.GetBatches.call(this, mode, accumulator);

    this._perObjectData.perObjectVSData.Get('Shipdata')[0] = this.boosterGain;
    this._perObjectData.perObjectPSData.Get('Shipdata')[0] = this.boosterGain;
    if (this.lod > 1) {
        for (var i = 0; i < this.turretSets.length; ++i) {
            this.turretSets[i].GetBatches(mode, accumulator, this._perObjectData);
        }
    }
    else {
        for (var i = 0; i < this.turretSets.length; ++i) {
            if (this.turretSets[i].firingEffect) {
                this.turretSets[i].firingEffect.GetBatches(mode, accumulator, this._perObjectData);
            }
        }
    }
    if (this.boosters)
    {
        this.boosters.GetBatches(mode, accumulator, this._perObjectData);
    }
};

EveShip.prototype.Update = function (dt)
{
    this._super.Update.call(this, dt);

    if (this.boosters)
    {
        if (this.boosters.rebuildPending)
        {
            this.RebuildBoosterSet();
        }
        this.boosters.Update(dt, this.transform);
    }
    for (var i = 0; i < this.turretSets.length; ++i)
    {
        if (i < this._turretSetsLocatorInfo.length)
        {
            if (this._turretSetsLocatorInfo[i].isJoint)
            {
                for (var j = 0; j < this._turretSetsLocatorInfo[i].locatorTransforms.length; ++j)
                {
                    this.turretSets[i].SetLocalTransform(j, this._turretSetsLocatorInfo[i].locatorTransforms[j]);
                }
            }
        }
    }
    for (var i = 0; i < this.turretSets.length; ++i)
    {
        this.turretSets[i].Update(dt, this.transform);
    }
};

EveShip.prototype.UpdateViewDependentData = function () {
    EveSpaceObject.prototype.UpdateViewDependentData.call(this);
    for (var i = 0; i < this.turretSets.length; ++i) {
        this.turretSets[i].UpdateViewDependentData();
    }
}

EveShip.prototype.RebuildBoosterSet = function ()
{
    if (!this.boosters)
    {
        return;
    }
    this.boosters.Clear();
    var prefix = 'locator_booster';
    for (var i = 0; i < this.locators.length; ++i)
    {
        if (this.locators[i].name.substr(0, prefix.length) == prefix)
        {
            this.boosters.Add(this.locators[i].transform, this.locators[i].atlasIndex0, this.locators[i].atlasIndex1);
        }
    }
    this.boosters.Rebuild();
};

EveShip.prototype.RebuildTurretPositions = function ()
{
    this._turretSetsLocatorInfo = [];
    for (var i = 0; i < this.turretSets.length; ++i)
    {
        var name = this.turretSets[i].locatorName;
        var locatorCount = this.GetLocatorCount(name);
        var locator = new EveTurretSetLocatorInfo();
        for (var j = 0; j < locatorCount; ++j)
        {
            var locatorName = name + String.fromCharCode('a'.charCodeAt(0) + j);
            var locatorTransform = this.FindLocatorJointByName(locatorName);
            if (locatorTransform != null)
            {
                locator.isJoint = true;
            }
            else
            {
                locatorTransform = this.FindLocatorTransformByName(locatorName);
            }
            if (locatorTransform != null)
            {
                this.turretSets[i].SetLocalTransform(j, locatorTransform);
                locator.locatorTransforms[locator.locatorTransforms.length] = locatorTransform;
            }
        }
        this._turretSetsLocatorInfo[this._turretSetsLocatorInfo.length] = locator;
    }
};

Inherit(EveShip, EveSpaceObject);
