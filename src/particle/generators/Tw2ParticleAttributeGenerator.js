/* eslint no-unused-vars:0 */
import {util, vec3} from '../../math';

/**
 * Tw2ParticleAttributeGenerator base class
 *
 * @property {number|string} id
 * @property {string} name
 * @class
 */
export class Tw2ParticleAttributeGenerator
{
    constructor()
    {
        this._id = util.generateID();
        this.name = '';
    }

    /**
     * Binds a particle system element to the generator
     * @param {Tw2ParticleSystem} ps
     * @returns {boolean} True if successfully bound
     */
    Bind(ps)
    {
        return false;
    }

    /**
     * Generates the attributes
     * @param {Tw2ParticleElement} position
     * @param {Tw2ParticleElement} velocity
     * @param {number} index
     */
    Generate(position, velocity, index)
    {

    }
}

Tw2ParticleAttributeGenerator.global = {
    vec3_0: vec3.create()
};