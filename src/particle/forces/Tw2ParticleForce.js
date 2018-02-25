/* eslint no-unused-vars:0 */
import {vec3, vec4, util} from '../../math';

/**
 * Tw2ParticleForce base class
 *
 * @property {number|string} _id
 * @property {string} name
 * @class
 */
export class Tw2ParticleForce
{
    constructor()
    {
        this._id = util.generateID();
        this.name = '';
    }

    /**
     * Applies forces
     * @param {Tw2ParticleElement} position
     * @param {Tw2ParticleElement} velocity
     * @param {Tw2ParticleElement} force
     * @param {number} dt
     * @param {number} mass
     */
    ApplyForce(position, velocity, force, dt, mass)
    {

    }

    /**
     * Per frame update (Called before ApplyForce)
     * @param {number} dt - delta time
     */
    Update(dt)
    {

    }
}

/**
 * Class globals
 * @type {*}
 */
Tw2ParticleForce.global = {
    vec3_0: vec3.create(),
    vec3_1: vec3.create(),
    vec4_0: vec3.create(),
};