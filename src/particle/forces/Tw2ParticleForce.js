/* eslint no-unused-vars:0 */
import {util, vec3, vec4} from '../../global';

/**
 * Tw2ParticleForce base class
 *
 * @property {number|string} id
 * @property {string} name
 * @class
 */
export class Tw2ParticleForce
{

    _id = util.generateID();
    name = '';


    /**
     * Applies forces
     * @param {Tw2ParticleElement} position
     * @param {Tw2ParticleElement} velocity
     * @param {Tw2ParticleElement} force
     * @param {number} [dt]
     * @param {number} [mass]
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

    /**
     * Global and scratch variables
     * @type {*}
     */
    static global = {
        vec3_0: vec3.create(),
        vec3_1: vec3.create(),
        vec4_0: vec4.create(),
    };

}
