/* eslint no-unused-vars:0 */
import {util} from '../../global';

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

    _id = util.generateID();
    name = '';
    particleSystem = null;


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