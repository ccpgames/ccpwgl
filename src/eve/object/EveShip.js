import {EveSpaceObject} from './EveSpaceObject';

/**
 * Eve Turret Set Locator Info
 * @property {boolean} isJoint
 * @property {Array.<mat4>} locatorTransforms
 */
export class EveTurretSetLocatorInfo
{
    constructor()
    {
        this.isJoint = false;
        this.locatorTransforms = [];
    }
}

/**
 * EveShip
 *
 * @property {number} boosterGain
 * @property {Array.<EveBoosterSet>} boosters
 * @property {Array.<EveTurretSet>} turretSets
 * @property {Array} _turretSetsLocatorInfo
 * @property {boolean} visible.turretSets      - Enables/ disables turret set batch accumulation
 * @property {boolean} visible.turretEffects   - Enabled/ disables turret set effects
 * @property {boolean} visible.boosters        - Enables/ disables booster batch accumulation
 * @class
 */
export class EveShip extends EveSpaceObject
{
    constructor()
    {
        super();
        this.visible.turretSets = true;
        this.visible.boosters = true;
        this.boosters = null;
        this.turretSets = [];
        this._turretSetsLocatorInfo = [];
        this.boosterGain = 1;
    }

    /**
     * Initializes the ship
     */
    Initialize()
    {
        super.Initialize();

        if (this.boosters)
        {
            this.RebuildBoosterSet();
        }
    }

    /**
     * Rebuilds the ship's booster set
     */
    RebuildBoosterSet()
    {
        if (this.boosters)
        {
            this.boosters.Clear();
            const locators = this.FindLocatorsByPrefix('locator_booster');
            for (let i = 0; i < locators.length; ++i)
            {
                this.boosters.Add(locators[i].transform, locators[i].atlasIndex0, locators[i].atlasIndex1, locators[i].name);
            }
            this.boosters.Rebuild();
        }
    }

    /**
     * Rebuilds turret positions
     */
    RebuildTurretPositions()
    {
        this._turretSetsLocatorInfo = [];
        for (let i = 0; i < this.turretSets.length; ++i)
        {
            const
                name = this.turretSets[i].locatorName,
                locatorCount = this.GetLocatorCount(name),
                locator = new EveTurretSetLocatorInfo();

            for (let j = 0; j < locatorCount; ++j)
            {
                const locatorName = name + String.fromCharCode('a'.charCodeAt(0) + j);

                let locatorTransform = this.FindLocatorJointByName(locatorName);
                if (locatorTransform !== null)
                {
                    locator.isJoint = true;
                }
                else
                {
                    locatorTransform = this.FindLocatorTransformByName(locatorName);
                }

                if (locatorTransform !== null)
                {
                    this.turretSets[i].SetLocalTransform(j, locatorTransform, locatorName);
                    locator.locatorTransforms.push(locatorTransform);
                }
            }
            this._turretSetsLocatorInfo.push(locator);
        }
    }

    /**
     * Gets ship's resources
     * @param {Array} [out=[]] - Optional receiving array
     * @param {Boolean} [excludeChildren] - True to exclude children's res objects
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [], excludeChildren)
    {
        super.GetResources(out, excludeChildren);

        for (let i = 0; i < this.turretSets.length; i++)
        {
            this.turretSets[i].GetResources(out);
        }

        if (this.boosters)
        {
            this.boosters.GetResources(out);
        }

        return out;
    }

    /**
     * Updates view dependant data
     */
    UpdateViewDependentData()
    {
        super.UpdateViewDependentData();
        for (let i = 0; i < this.turretSets.length; ++i)
        {
            this.turretSets[i].UpdateViewDependentData();
        }
    }

    /**
     * Per frame update
     * @param {number} dt - deltaTime
     */
    Update(dt)
    {
        super.Update(dt);

        if (this.boosters)
        {
            if (this.boosters.rebuildPending)
            {
                this.RebuildBoosterSet();
            }
            this.boosters.Update(dt, this.transform);
        }

        for (let i = 0; i < this.turretSets.length; ++i)
        {
            if (i < this._turretSetsLocatorInfo.length)
            {
                if (this._turretSetsLocatorInfo[i].isJoint)
                {
                    const locatorInfo = this._turretSetsLocatorInfo[i];
                    for (let j = 0; j < locatorInfo.locatorTransforms.length; ++j)
                    {
                        this.turretSets[i].SetLocalTransform(j, locatorInfo.locatorTransforms[j]);
                    }
                }
            }
        }

        for (let i = 0; i < this.turretSets.length; ++i)
        {
            this.turretSets[i].Update(dt, this.transform);
        }
    }


    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    GetBatches(mode, accumulator)
    {
        if (!this.display) return;

        super.GetBatches(mode, accumulator);

        this._perObjectData.perObjectVSData.Get('Shipdata')[0] = this.boosterGain;
        this._perObjectData.perObjectPSData.Get('Shipdata')[0] = this.boosterGain;

        for (let i = 0; i < this.turretSets.length; ++i)
        {
            if (this.lod > 1 && this.visible.turretSets)
            {
                this.turretSets[i].GetBatches(mode, accumulator, this._perObjectData, this.visible.turretEffects);
            }
            else if (this.visible.turretEffects)
            {
                this.turretSets[i].GetEffectBatches(mode, accumulator, this._perObjectData);
            }
        }

        if (this.boosters && this.visible.boosters)
        {
            this.boosters.GetBatches(mode, accumulator, this._perObjectData);
        }
    }
}