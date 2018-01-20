import {vec3, vec4} from '../../math';

/**
 * Tw2ParticleForce base class
 * @property {string} name
 * @class
 */
export class Tw2ParticleForce
{
    constructor()
    {
        this.name = '';
        Tw2ParticleForce.init();
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

    /**
     * Initializes class globals
     */
    static init()
    {
        if (!Tw2ParticleForce.global)
        {
            Tw2ParticleForce.global = {
                vec3_0: vec3.create(),
                vec3_1: vec3.create(),
                vec4_0: vec4.create()
            };
        }
    }
}

/**
 * Class globals
 * @type {*}
 */
Tw2ParticleForce.global = null;