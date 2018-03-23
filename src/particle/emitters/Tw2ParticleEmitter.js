/* eslint no-unused-vars:0 */
import {util} from '../../math';

/**
 * Particle Emitter base class
 *
 * @property {number|string} id
 * @property {string} name
 * @property {Tw2ParticleSystem} particleSystem
 * @class
 */
export class Tw2ParticleEmitter
{
    constructor()
    {
        this._id = util.generateID();
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