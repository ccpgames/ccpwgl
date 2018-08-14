import {EveSpaceObject} from './EveSpaceObject';

/**
 * EveShip
 *
 * @property {boolean} visible.turretSets      - Enables/ disables turret set batch accumulation
 * @property {boolean} visible.boosters        - Enables/ disables booster batch accumulation
 * @property {Array.<EveBoosterSet>} boosters
 * @property {Array.<EveTurretSet>} turretSets
 * @property {number} boosterGain
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
        if (this.boosters)
        {
            this.boosters.UpdateItemsFromLocators(this.FindLocatorsByPrefix('locator_booster'));
        }
    }

    /**
     * Rebuilds turret sets
     */
    RebuildTurretPositions()
    {
        for (let i = 0; i < this.turretSets.length; i++)
        {
            this.RebuildTurretSet(i);
        }
    }

    /**
     * Rebuilds a turret set
     * @param {number} index
     */
    RebuildTurretSet(index)
    {
        if (this.turretSets[index] === undefined) return;

        const
            turretSet = this.turretSets[index],
            prefix = turretSet.locatorName,
            count = this.GetLocatorCount(prefix),
            locators = [];

        for (let j = 0; j < count; ++j)
        {
            const
                name = prefix + String.fromCharCode('a'.charCodeAt(0) + j),
                locator = this.FindLocatorByName(name);

            if (locator)
            {
                locator.FindBone(this.animation);
                locators.push(locator);
            }
        }

        turretSet.UpdateItemsFromLocators(locators);
    }

    /**
     * Gets ship's res objects
     * @param {Array} [out=[]] - Optional receiving array
     * @param {Boolean} excludeChildren - True to exclude children's res objects
     * @returns {Array.<Tw2EffectRes|Tw2TextureRes|Tw2GeometryRes>} [out]
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
            if (this.boosters._locatorRebuildPending)
            {
                this.RebuildBoosterSet();
            }

            this.boosters.Update(dt, this.transform);
        }

        for (let i = 0; i < this.turretSets.length; ++i)
        {
            if (this.turretSets[i]._locatorRebuildPending)
            {
                this.RebuildTurretSet(i);
            }

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

            if (this.boosters && this.visible.boosters)
            {
                this.boosters.GetBatches(mode, accumulator, this._perObjectData);
            }

            if (this.visible.turretSets)
            {
                if (this.lod > 1)
                {
                    for (let i = 0; i < this.turretSets.length; ++i)
                    {
                        this.turretSets[i].GetBatches(mode, accumulator, this._perObjectData, this.visible.firingEffects);
                    }
                }
                else if (this.visible.firingEffects)
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
        }
    }
}