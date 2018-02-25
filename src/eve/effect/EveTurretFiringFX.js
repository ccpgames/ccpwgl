import {vec3, mat4, util} from '../../math';

/**
 * EvePerMuzzleData
 * Todo: Remove reference in this.muzzlePosition
 *
 * @param {boolean} started
 * @param {boolean} readyToStart
 * @param muzzlePositionBone
 * @param {mat4} muzzleTransform
 * @param {vec3} muzzlePosition
 * @param {number} currentStartDelay
 * @param {number} constantDelay
 * @param {number} elapsedTime
 * @class
 */
export class EvePerMuzzleData
{
    constructor()
    {
        this._id = util.generateID();
        this.started = false;
        this.readyToStart = false;
        this.muzzlePositionBone = null;
        this.muzzleTransform = mat4.create();
        this.muzzlePosition = this.muzzleTransform.subarray(12, 15);
        this.currentStartDelay = 0;
        this.constantDelay = 0;
        this.elapsedTime = 0;
    }
}

/**
 * EveTurretFiringFX
 *
 * @param {string} name
 * @param {boolean} display
 * @param {Array.<EveStretch>} stretch
 * @param {boolean} useMuzzleTransform
 * @param {boolean} isFiring
 * @param {boolean} isLoopFiring
 * @param {number} firingDelay1
 * @param {number} firingDelay2
 * @param {number} firingDelay3
 * @param {number} firingDelay4
 * @param {number} firingDelay5
 * @param {number} firingDelay6
 * @param {number} firingDelay7
 * @param {number} firingDelay8
 * @param {vec3} endPosition
 * @param {number} _firingDuration
 * @param {Array.<EvePerMuzzleData>} _perMuzzleData
 * @class
 */
export class EveTurretFiringFX
{
    constructor()
    {
        this._id = util.generateID();
        this.name = '';
        this.display = true;
        this.stretch = [];
        this.useMuzzleTransform = false;
        this.isFiring = false;
        this.isLoopFiring = false;
        this.firingDelay1 = 0;
        this.firingDelay2 = 0;
        this.firingDelay3 = 0;
        this.firingDelay4 = 0;
        this.firingDelay5 = 0;
        this.firingDelay6 = 0;
        this.firingDelay7 = 0;
        this.firingDelay8 = 0;
        this.endPosition = vec3.create();
        this._firingDuration = 0;
        this._perMuzzleData = [];
    }

    /**
     * Initializes the turret firing fx
     */
    Initialize()
    {
        this._firingDuration = this.GetCurveDuration();
        for (let i = 0; i < this.stretch.length; ++i) this._perMuzzleData[i] = new EvePerMuzzleData();
        if (this._perMuzzleData.length > 0) this._perMuzzleData[0].constantDelay = this.firingDelay1;
        if (this._perMuzzleData.length > 1) this._perMuzzleData[1].constantDelay = this.firingDelay2;
        if (this._perMuzzleData.length > 2) this._perMuzzleData[2].constantDelay = this.firingDelay3;
        if (this._perMuzzleData.length > 3) this._perMuzzleData[3].constantDelay = this.firingDelay4;
        if (this._perMuzzleData.length > 4) this._perMuzzleData[4].constantDelay = this.firingDelay5;
        if (this._perMuzzleData.length > 5) this._perMuzzleData[5].constantDelay = this.firingDelay6;
        if (this._perMuzzleData.length > 6) this._perMuzzleData[6].constantDelay = this.firingDelay7;
        if (this._perMuzzleData.length > 7) this._perMuzzleData[7].constantDelay = this.firingDelay8;
    }

    /**
     * Gets the total curve duration
     * @returns {number}
     */
    GetCurveDuration()
    {
        let maxDuration = 0;
        for (let i = 0; i < this.stretch.length; ++i)
        {
            const stretch = this.stretch[i];
            for (let j = 0; j < stretch.curveSets.length; ++j)
            {
                maxDuration = Math.max(maxDuration, stretch.curveSets[j].GetMaxCurveDuration());
            }
        }
        return maxDuration;
    }

    /**
     * Gets a count of stretch effects
     * @returns {Number}
     */
    GetPerMuzzleEffectCount()
    {
        return this.stretch.length;
    }

    /**
     * Sets muzzle bone id
     * @param {number} index
     * @param bone
     */
    SetMuzzleBoneID(index, bone)
    {
        this._perMuzzleData[index].muzzlePositionBone = bone;
    }

    /**
     * Gets a muzzle's transform
     * @param {number} index
     * @returns {mat4}
     */
    GetMuzzleTransform(index)
    {
        return this._perMuzzleData[index].muzzleTransform;
    }

    /**
     * Prepares the firing effect
     * @param {number} delay
     * @param {number} [muzzleID=-1]
     */
    PrepareFiring(delay, muzzleID = -1)
    {
        for (let i = 0; i < this.stretch.length; ++i)
        {
            if (muzzleID < 0 || muzzleID === i)
            {
                this._perMuzzleData[i].currentStartDelay = delay + this._perMuzzleData[i].constantDelay;
                this._perMuzzleData[i].started = false;
                this._perMuzzleData[i].readyToStart = false;
                this._perMuzzleData[i].elapsedTime = 0;
            }
            else
            {
                this._perMuzzleData[i].currentStartDelay = Number.MAX_VALUE;
                this._perMuzzleData[i].started = false;
                this._perMuzzleData[i].readyToStart = false;
                this._perMuzzleData[i].elapsedTime = 0;
            }
        }
        this.isFiring = true;
    }

    /**
     * Starts a muzzle effect
     * @param {number} muzzleID
     */
    StartMuzzleEffect(muzzleID)
    {
        const stretch = this.stretch[muzzleID];
        for (let i = 0; i < stretch.curveSets.length; ++i)
        {
            const curveSet = stretch.curveSets[i];
            switch (curveSet.name)
            {
                case 'play_start':
                case 'play_loop':
                    curveSet.PlayFrom(-this._perMuzzleData[muzzleID].currentStartDelay);
                    break;

                case 'play_stop':
                    curveSet.Stop();
                    break;
            }
        }
        this._perMuzzleData[muzzleID].started = true;
        this._perMuzzleData[muzzleID].readyToStart = false;
    }

    /**
     * Stops the firing effect
     */
    StopFiring()
    {
        for (let j = 0; j < this.stretch.length; ++j)
        {
            const stretch = this.stretch[j];
            for (let i = 0; i < stretch.curveSets.length; ++i)
            {
                const curveSet = stretch.curveSets[i];
                switch (curveSet.name)
                {
                    case 'play_start':
                    case 'play_loop':
                        curveSet.Stop();
                        break;

                    case 'play_stop':
                        curveSet.Play();
                        break;
                }
            }
            this._perMuzzleData[j].started = false;
            this._perMuzzleData[j].readyToStart = false;
            this._perMuzzleData[j].currentStartDelay = 0;
            this._perMuzzleData[j].elapsedTime = 0;
        }
        this.isFiring = false;
    }

    /**
     * Gets resources
     * @param {Array} [out=[]}
     * @returns {Array<Resource>} out
     */
    GetResources(out = [])
    {
        for (let i = 0; i < this.stretch.length; i++)
        {
            this.stretch[i].GetResources(out);
        }
        return out;
    }

    /**
     * Updates view dependant data
     */
    UpdateViewDependentData()
    {
        for (let i = 0; i < this.stretch.length; ++i)
        {
            this.stretch[i].UpdateViewDependentData();
        }
    }

    /**
     * Per frame update
     * @param {number} dt - Delta time
     */
    Update(dt)
    {
        for (let i = 0; i < this.stretch.length; ++i)
        {
            if (this._perMuzzleData[i].started)
            {
                this._perMuzzleData[i].elapsedTime += dt;
            }

            if (this._perMuzzleData[i].elapsedTime < this._firingDuration || this.isLoopFiring)
            {
                if (this.isFiring)
                {
                    if (!this._perMuzzleData[i].started)
                    {
                        if (this._perMuzzleData[i].readyToStart)
                        {
                            this.StartMuzzleEffect(i);
                            this._perMuzzleData[i].currentStartDelay = 0;
                            this._perMuzzleData[i].elapsedTime = 0;
                        }
                        else
                        {
                            this._perMuzzleData[i].currentStartDelay -= dt;
                        }

                        if (this._perMuzzleData[i].currentStartDelay <= 0)
                        {
                            this._perMuzzleData[i].readyToStart = true;
                        }
                    }
                    else
                    {
                        if (this.useMuzzleTransform)
                        {
                            this.stretch[i].SetSourceTransform(this._perMuzzleData[i].muzzleTransform);
                        }
                        else
                        {
                            this.stretch[i].SetSourcePosition(this._perMuzzleData[i].muzzlePosition);
                        }
                        this.stretch[i].SetDestinationPosition(this.endPosition);
                        this.stretch[i].SetIsNegZForward(true);
                    }
                }
            }
            this.stretch[i].Update(dt);
        }
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (!this.display || !this.isFiring) return;

        for (let i = 0; i < this.stretch.length; ++i)
        {
            if (this._perMuzzleData[i].started && (this._firingDuration >= this._perMuzzleData[i].elapsedTime || this.isLoopFiring))
            {
                this.stretch[i].GetBatches(mode, accumulator, perObjectData);
            }
        }
    }
}
