import {EveSpaceObject} from './EveSpaceObject';

/**
 * Eve Turret Set Locator Info
 * @property {boolean} isJoint
 * @property {Array.<EveLocator|*>} locators
 */
export class EveTurretSetLocatorInfo
{
    constructor(name='')
    {
        this.name = name;
        this.isJoint = false;
        this.locators = [];
    }
}

/**
 * EveShip
 *
 * @property {boolean} visible.turretSets      - Enables/ disables turret set batch accumulation
 * @property {boolean} visible.boosters        - Enables/ disables booster batch accumulation
 * @property {Array.<EveBoosterSet>} boosters
 * @property {Array.<EveTurretSet>} turretSets
 * @property {number} boosterGain
 * @property {Array} _turretSetsLocatorInfo
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
        this.boosterGain = 1;
        this._turretSetsLocatorInfo = [];
    }

    /**
     * Initializes the Eve Ship
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
        if (!this.boosters) return;

        this.boosters.Clear();

        const locators = this.FindLocatorsByPrefix('locator_booster');
        for (let i = 0; i < locators.length; ++i)
        {
            this.boosters.Add(locators[i].transform, locators[i].atlasIndex0, locators[i].atlasIndex1, locators[i].name);
        }

        this.boosters.Rebuild();
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
                turretSet = this.turretSets[i],
                prefix = turretSet.locatorName,
                count = this.GetLocatorCount(prefix),
                info = new EveTurretSetLocatorInfo(prefix);

            for (let j = 0; j < count; ++j)
            {
                const
                    name = prefix + String.fromCharCode('a'.charCodeAt(0) + j),
                    locator = this.FindLocatorByName(name),
                    bone = this.FindLocatorBoneByName(name);

                if (locator)
                {
                    if (bone)
                    {
                        info.isJoint = true;
                        locator.bone = bone;
                    }

                    turretSet.SetLocalTransform(j, bone ? bone.worldTransform : locator.transform, name);
                    info.locators.push(locator);
                }
            }
            this._turretSetsLocatorInfo.push(info);
        }
    }

    /**
     * Gets ship's res objects
     * @param {Array} [out=[]] - Optional receiving array
     * @param {Boolean} excludeChildren - True to exclude children's res objects
     * @returns {Array.<Tw2EffectRes|Tw2TextureRes|Tw2GeometryRes>} [out]
     */
    GetResources(out=[], excludeChildren)
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

        // Update turrets that are on bones
        for (let i = 0; i < this.turretSets.length; ++i)
        {
            if (i < this._turretSetsLocatorInfo.length)
            {
                const info = this._turretSetsLocatorInfo[i];
                if (info.isJoint)
                {
                    for (let j = 0; j < info.locators.length; ++j)
                    {
                        if (info.locators[j].bone)
                        {
                            const locator = info.locators[j];
                            this.turretSets[i].SetLocalTransform(j, locator.bone.worldTransform, locator.name);
                        }
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
        if (this.display)
        {
            super.GetBatches(mode, accumulator);

            this._perObjectData.perObjectVSData.Get('Shipdata')[0] = this.boosterGain;
            this._perObjectData.perObjectPSData.Get('Shipdata')[0] = this.boosterGain;

            if (this.visible.turretSets)
            {
                if (this.lod > 1)
                {
                    for (let i = 0; i < this.turretSets.length; ++i)
                    {
                        this.turretSets[i].GetBatches(mode, accumulator, this._perObjectData);
                    }
                }
                else
                {
                    for (let i = 0; i < this.turretSets.length; ++i)
                    {
                        if (this.turretSets[i].firingEffect)
                        {
                            this.turretSets[i].firingEffect.GetBatches(mode, accumulator, this._perObjectData);
                        }
                    }
                }
            }

            if (this.boosters && this.visible.boosters)
            {
                this.boosters.GetBatches(mode, accumulator, this._perObjectData);
            }
        }
    }

}