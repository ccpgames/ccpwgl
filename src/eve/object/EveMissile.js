import {vec3, mat4, util} from '../../global';
import {Tw2PerObjectData} from '../../core';
import {EveObject} from './EveObject';

/**
 * EveMissileWarhead
 *
 * @property {String} name
 * @property {Boolean} display
 * @property {Tw2Mesh} mesh
 * @property {EveSpriteSet} spriteSet
 * @property {Number} state
 * @property {Number} time
 * @property {Number} durationEjectPhase
 * @property {Number} startEjectVelocity
 * @property {Number} acceleration
 * @property {Number} maxExplosionDistance
 * @property {Number} impactSize
 * @property {Number} impactDuration
 * @property {vec3} pathOffset
 * @property {mat4} transform
 * @property {vec3} velocity
 * @property {Tw2PerObjectData} _perObjectData
 * @class
 */
export class EveMissileWarhead extends EveObject
{

    mesh = null;
    spriteSet = null;
    state = EveMissileWarhead.State.READY;
    time = 0;
    durationEjectPhase = 0;
    startEjectVelocity = 0;
    acceleration = 1;
    maxExplosionDistance = 40;
    impactSize = 0;
    impactDuration = 0.6;
    pathOffset = vec3.create();
    transform = mat4.create();
    velocity = vec3.create();
    _perObjectData = new Tw2PerObjectData(EveMissileWarhead.perObjectData);


    /**
     * Initializes the warhead
     */
    Initialize()
    {
        if (this.spriteSet) this.spriteSet.UseQuads(true);
    }

    /**
     * Sets up the warhead for rendering
     * @param {mat4} transform - Initial local to world transform
     */
    Launch(transform)
    {
        mat4.copy(this.transform, transform);
        this.velocity[0] = transform[8] * this.startEjectVelocity;
        this.velocity[1] = transform[9] * this.startEjectVelocity;
        this.velocity[2] = transform[10] * this.startEjectVelocity;
        this.time = 0;
        this.state = EveMissileWarhead.State.IN_FLIGHT;
    }

    /**
     * Creates a clone of the warhead
     * @returns {EveMissileWarhead}
     */
    Clone()
    {
        const warhead = new EveMissileWarhead();
        warhead.mesh = this.mesh;
        warhead.spriteSet = this.spriteSet;
        return warhead;
    }

    /**
     * Gets warhead resources
     * @param {Array} [out=[]] - Receiving array
     * @returns {Array<Tw2Resource>} out
     */
    GetResources(out = [])
    {
        if (this.mesh) this.mesh.GetResources(out);
        if (this.spriteSet) this.spriteSet.GetResources(out);
    }

    /**
     * Per frame view dependent data update
     */
    UpdateViewDependentData()
    {
        if (!this.display || this.state === EveMissileWarhead.State.DEAD) return;
        mat4.transpose(this._perObjectData.perObjectVSData.Get('WorldMat'), this.transform);
        mat4.transpose(this._perObjectData.perObjectVSData.Get('WorldMatLast'), this.transform);
    }

    /**
     * Per frame update
     * @param {Number} dt - Time since previous frame
     * @param {vec3} missilePosition - Missile position
     * @param {vec3} missileTarget - Missile target position
     */
    Update(dt, missilePosition, missileTarget)
    {
        if (this.state === EveMissileWarhead.State.IN_FLIGHT)
        {
            const
                g = EveMissileWarhead.global,
                position = mat4.getTranslation(g.vec3_0, this.transform),
                tmp = g.vec3_1,
                x = g.vec3_2,
                y = g.vec3_3;

            this.time += dt;
            if (this.time > this.durationEjectPhase)
            {
                vec3.subtract(position, this.velocity, missilePosition);
                vec3.lerp(position, position, missilePosition, 1 - Math.exp(-dt * 0.9999));
                mat4.setTranslation(this.transform, position);
                vec3.subtract(tmp, missileTarget, position);
                if (vec3.length(tmp) < this.maxExplosionDistance)
                {
                    console.log(position, tmp);
                    this.state = EveMissileWarhead.State.DEAD;
                }
            }
            else
            {
                vec3.scale(tmp, this.velocity, dt);
                this.transform[12] += tmp[0];
                this.transform[13] += tmp[1];
                this.transform[14] += tmp[2];
            }

            const z = vec3.normalize(tmp, this.velocity);

            if (Math.abs(z[0]) < 0.99)
            {
                vec3.cross(x, z, [1, 0, 0]);
            }
            else
            {
                vec3.cross(x, z, [0, 1, 0]);
            }

            vec3.normalize(x, x);
            vec3.cross(y, x, z);
            this.transform[0] = x[0];
            this.transform[1] = x[1];
            this.transform[2] = x[2];
            this.transform[4] = y[0];
            this.transform[5] = y[1];
            this.transform[6] = y[2];
            this.transform[8] = z[0];
            this.transform[9] = z[1];
            this.transform[10] = z[2];
        }

        if (this.spriteSet)
        {
            this.spriteSet.Update(dt);
        }
    }

    /**
     * Accumulates render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    GetBatches(mode, accumulator)
    {
        if (this.display && this.mesh && this.state !== EveMissileWarhead.State.DEAD)
        {
            if (this.mesh)
            {
                this.mesh.GetBatches(mode, accumulator, this._perObjectData);
            }

            if (this.spriteSet)
            {
                this.spriteSet.GetBatches(mode, accumulator, this._perObjectData, this.transform);
            }
        }
    }

    /**
     * Per object data
     * @type {*}
     */
    static perObjectData = {
        VSData: [
            ['WorldMat', 16],
            ['WorldMatLast', 16],
            ['Shipdata', 4, [0, 1, 0, -10]],
            ['Clipdata1', 4],
            ['JointMat', 696]
        ],
        PSData: [
            ['Shipdata', 4, [0, 1, 0, 1]],
            ['Clipdata1', 4],
            ['Clipdata2', 4],
        ]
    };

    /**
     * Missile warhead states
     * @type {{READY: number, IN_FLIGHT: number, DEAD: number}}
     */
    static State = {
        READY: 0,
        IN_FLIGHT: 1,
        DEAD: 2
    };

}


/**
 * EveMissile
 *
 * @property {number|string} _id
 * @property {String} name
 * @property {Boolean} display
 * @property {Array} warheads
 * @property {Array} curveSets
 * @property {vec3} boundingSphereCenter
 * @property {Number} boundingSphereRadius
 * @property {vec3} position
 * @property {vec3} target
 * @property {Number} speed
 * @property {?function(EveMissileWarhead): void} warheadExplosionCallback
 * @property {?function(EveMissile): void} missileFinishedCallback
 * @class
 */
export class EveMissile
{

    _id = util.generateID();
    name = '';
    display = true;
    warheads = [];
    curveSets = [];
    speed = 1;
    position = vec3.create();
    target = vec3.create();
    boundingSphereCenter = vec3.create();
    boundingSphereRadius = 0;
    warheadExplosionCallback = null;
    missileFinishedCallback = null;


    /**
     * Prepares missile for rendering
     * @param {vec3} position - Missile starting position
     * @param {Array} turretTransforms - Turret muzzle local to world transforms
     * @param {vec3} target - Target position
     */
    Launch(position, turretTransforms, target)
    {
        vec3.copy(this.position, position);
        vec3.copy(this.target, target);

        if (this.warheads.length > turretTransforms.length)
        {
            this.warheads.splice(turretTransforms.length);
        }
        else
        {
            while (this.warheads.length < turretTransforms.length)
            {
                this.warheads.push(this.warheads[0].Clone());
            }
        }

        for (let i = 0; i < this.warheads.length; ++i)
        {
            this.warheads[0].Launch(turretTransforms[i]);
        }
    }

    /**
     * Gets missile res objects
     * @param {Array} [out=[]] - Receiving array
     * @returns {Array<Tw2Resource>} out
     */
    GetResources(out = [])
    {
        for (let i = 0; i < this.warheads.length; ++i)
        {
            this.warheads[i].GetResources(out);
        }
    }

    /**
     * Per frame view dependent data update
     */
    UpdateViewDependentData()
    {
        for (let i = 0; i < this.warheads.length; ++i)
        {
            this.warheads[i].UpdateViewDependentData();
        }
    }

    /**
     * Per frame update
     * @param {Number} dt - Time since previous frame
     */
    Update(dt)
    {
        const
            tmp = vec3.subtract(EveMissileWarhead.global.vec3_0, this.target, this.position),
            distance = vec3.length(tmp);

        if (distance > 0.1)
        {
            vec3.normalize(tmp, tmp);
            vec3.scale(tmp, tmp, Math.min(dt * this.speed, distance));
            vec3.add(this.position, this.position, tmp);
        }

        for (let i = 0; i < this.curveSets.length; ++i)
        {
            this.curveSets[i].Update(dt);
        }

        let checkDead = false;
        for (let i = 0; i < this.warheads.length; ++i)
        {
            const state = this.warheads[i].state;
            this.warheads[i].Update(dt, this.position, this.target);

            if (state !== EveMissileWarhead.State.DEAD && this.warheads[i].state === EveMissileWarhead.State.DEAD)
            {
                if (this.warheadExplosionCallback)
                {
                    this.warheadExplosionCallback(this.warheads[i]);
                }
                checkDead = true;
            }
        }

        if (checkDead && this.missileFinishedCallback)
        {
            for (let i = 0; i < this.warheads.length; ++i)
            {
                if (this.warheads[i].state !== EveMissileWarhead.State.DEAD)
                {
                    return;
                }
            }
            this.missileFinishedCallback(this);
        }
    }

    /**
     * Accumulates render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    GetBatches(mode, accumulator)
    {
        if (!this.display) return;

        for (let i = 0; i < this.warheads.length; ++i)
        {
            this.warheads[i].GetBatches(mode, accumulator);
        }
    }

}
