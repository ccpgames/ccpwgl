/**
 * EveShip
 * @property {number} boosterGain
 * @property {Array.<EveBoosterSet>} boosters
 * @property {Array.<EveTurretSet>} turretSets
 * @property {Array} _turretSetsLocatorInfo
 * @property {boolean} displayTurrets - Toggles turret rendering
 * @property {boolean} displayBoosters - Toggles booster rendering
 * @inherits EveSpaceObject
 * @constructor
 */
function EveShip()
{
    this._super.constructor.call(this);
    this.boosterGain = 1;
    this.boosters = null;
    this.turretSets = [];
    this._turretSetsLocatorInfo = [];
    
    this.displayTurrets = true;
    this.displayBoosters = true;
}

/**
 * Eve Turret Set Locator Info
 * @property {boolean} isJoint
 * @property {Array.<mat4>} locatorTransforms
 */
function EveTurretSetLocatorInfo()
{
    this.isJoint = false;
    this.locatorTransforms = [];
}

/**
 * Initializes the Eve Ship
 */
EveShip.prototype.Initialize = function()
{
    this._super.Initialize.call(this);
    if (this.boosters)
    {
        this.RebuildBoosterSet();
    }
};

/**
 * Gets render batches
 * @param {RenderMode} mode
 * @param {Tw2BatchAccumulator} accumulator
 */
EveShip.prototype.GetBatches = function(mode, accumulator)
{
    if (this.display)
    {
        this._super.GetBatches.call(this, mode, accumulator);

        this._perObjectData.perObjectVSData.Get('Shipdata')[0] = this.boosterGain;
        this._perObjectData.perObjectPSData.Get('Shipdata')[0] = this.boosterGain;
        
        if (this.displayTurrets)
        {
            if (this.lod > 1)
            {
                for (var i = 0; i < this.turretSets.length; ++i)
                {
                    this.turretSets[i].GetBatches(mode, accumulator, this._perObjectData);
                }
            }
            else
            {
                for (var i = 0; i < this.turretSets.length; ++i)
                {
                    if (this.turretSets[i].firingEffect)
                    {
                        this.turretSets[i].firingEffect.GetBatches(mode, accumulator, this._perObjectData);
                    }
                }
            }
        }
        
        if (this.boosters && this.displayBoosters)
        {
            this.boosters.GetBatches(mode, accumulator, this._perObjectData);
        }
    }
};

/**
 * Per frame update
 * @param {number} dt - deltaTime
 */
EveShip.prototype.Update = function(dt)
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

/**
 * Updates view dependant data
 */
EveShip.prototype.UpdateViewDependentData = function()
{
    EveSpaceObject.prototype.UpdateViewDependentData.call(this);
    for (var i = 0; i < this.turretSets.length; ++i)
    {
        this.turretSets[i].UpdateViewDependentData();
    }
}

/**
 * Rebuilds the ship's booster set
 */
EveShip.prototype.RebuildBoosterSet = function()
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

/**
 * Rebuilds turret positions
 */
EveShip.prototype.RebuildTurretPositions = function()
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
                this.turretSets[i].SetLocalTransform(j, locatorTransform, locatorName);
                locator.locatorTransforms[locator.locatorTransforms.length] = locatorTransform;
            }
        }
        this._turretSetsLocatorInfo[this._turretSetsLocatorInfo.length] = locator;
    }
};

Inherit(EveShip, EveSpaceObject);
