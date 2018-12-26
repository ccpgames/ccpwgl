import {vec3, mat4, util} from '../../global';

/**
 * EvePerMuzzleData
 *
 * @property {boolean} started
 * @property {boolean} readyToStart
 * @property muzzlePositionBone
 * @property {mat4} muzzleTransform
 * @property {vec3} muzzlePosition
 * @property {number} currentStartDelay
 * @property {number} constantDelay
 * @property {number} elapsedTime
 * @class
 */
export class EvePerMuzzleData
{

    _id = util.generateID();
    started = false;
    readyToStart = false;
    muzzlePositionBone = null;
    muzzleTransform = mat4.create();
    currentStartDelay = 0;
    constantDelay = 0;
    elapsedTime = 0;


    /**
     * Muzzle position
     * @returns {TypedArray}
     */
    get muzzlePosition()
    {
        return this.muzzleTransform.subarray(12, 15);
    }

}


/**
 * EveTurretFiringFX
 *
 * @property {string|number} _id
 * @property {string} name
 * @property {boolean} display
 * @property {Array.<EveStretch>} stretch
 * @property {boolean} useMuzzleTransform
 * @property {boolean} isFiring
 * @property {boolean} isLoopFiring
 * @property {number} firingDelay1
 * @property {number} firingDelay2
 * @property {number} firingDelay3
 * @property {number} firingDelay4
 * @property {number} firingDelay5
 * @property {number} firingDelay6
 * @property {number} firingDelay7
 * @property {number} firingDelay8
 * @property {vec3} endPosition
 * @property {number} _firingDuration
 * @property {Array.<EvePerMuzzleData>} _perMuzzleData
 * @class
 */
export class EveTurretFiringFX
{

    _id = util.generateID();
    name = '';
    display = true;
    stretch = [];
    useMuzzleTransform = false;
    isFiring = false;
    isLoopFiring = false;
    firingDelay1 = 0;
    firingDelay2 = 0;
    firingDelay3 = 0;
    firingDelay4 = 0;
    firingDelay5 = 0;
    firingDelay6 = 0;
    firingDelay7 = 0;
    firingDelay8 = 0;
    endPosition = vec3.create();
    _firingDuration = 0;
    _perMuzzleData = [];


    /**
     * Initializes the turret firing fx
     */
    Initialize()
    {
        this._firingDuration = this.GetCurveDuration();
        for (let i = 0; i < this.stretch.length; ++i)
        {
            this._perMuzzleData[i] = new EvePerMuzzleData();
        }

        const data = this._perMuzzleData;
        if (data.length > 0) data[0].constantDelay = this.firingDelay1;
        if (data.length > 1) data[1].constantDelay = this.firingDelay2;
        if (data.length > 2) data[2].constantDelay = this.firingDelay3;
        if (data.length > 3) data[3].constantDelay = this.firingDelay4;
        if (data.length > 4) data[4].constantDelay = this.firingDelay5;
        if (data.length > 5) data[5].constantDelay = this.firingDelay6;
        if (data.length > 6) data[6].constantDelay = this.firingDelay7;
        if (data.length > 7) data[7].constantDelay = this.firingDelay8;
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
     * @returns {Array<Tw2Resource>} out
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
