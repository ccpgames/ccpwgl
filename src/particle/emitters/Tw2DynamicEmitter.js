import {Tw2ParticleEmitter} from './Tw2ParticleEmitter';

/**
 * Tw2DynamicEmitter
 *
 * @property {string} name
 * @property {number} rate
 * @property {boolean} isValid
 * @property {number} _accumulatedRate
 * @property {Array<Tw2ParticleAttributeGenerator>}} generators
 * @inherits Tw2ParticleEmitter
 * @class
 */
export class Tw2DynamicEmitter extends Tw2ParticleEmitter
{

    rate = 0;
    isValid = false;
    _accumulatedRate = 0;
    generators = [];


    /**
     * Initializes the particle emitter
     */
    Initialize()
    {
        this.Rebind();
    }

    /**
     * Per frame update
     * @param {number} dt - delta time
     */
    Update(dt)
    {
        this.SpawnParticles(null, null, Math.min(dt, 0.1));
    }

    /**
     * Rebinds the emitter's generators to it's particle system
     */
    Rebind()
    {
        this.isValid = false;
        if (!this.particleSystem) return;

        for (let i = 0; i < this.generators.length; ++i)
        {
            if (!this.generators[i].Bind(this.particleSystem)) return;
        }

        this.isValid = true;
    }

    /**
     * Spawn particles
     * @param position
     * @param velocity
     * @param rateModifier
     */
    SpawnParticles(position, velocity, rateModifier)
    {
        if (!this.isValid) return;

        this._accumulatedRate += this.rate * rateModifier;
        const count = Math.floor(this._accumulatedRate);
        this._accumulatedRate -= count;

        for (let i = 0; i < count; ++i)
        {
            const index = this.particleSystem.BeginSpawnParticle();
            if (index === null) break;

            for (let j = 0; j < this.generators.length; ++j)
            {
                this.generators[j].Generate(position, velocity, index);
            }

            this.particleSystem.EndSpawnParticle();
        }
    }

}
