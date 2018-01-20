/**
 * Particle Emitter base class
 *
 * @property {string} name
 * @property {Tw2ParticleSystem} particleSystem
 * @class
 */
export class Tw2ParticleEmitter
{
    constructor()
    {
        this.name = '';
        this.particleSystem = null;
    }

    /**
     * Initializes the particle emitter
     */
    Initialize()
    {

    }

    /**
     * Per frame update
     * @param {number} dt - delta time
     */
    Update(dt)
    {

    }
}