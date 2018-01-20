import {vec3} from '../../math';
import {Tw2ParticleForce} from './Tw2ParticleForce';

/**
 * Tw2ParticleDirectForce
 *
 * @property {vec3} force
 * @inherits Tw2ParticleForce
 * @class
 */
export class Tw2ParticleDirectForce extends Tw2ParticleForce
{
    constructor()
    {
        super();
        this.force = vec3.create();
    }

    /**
     * ApplyForce
     * @param {Tw2ParticleElement} position
     * @param {Tw2ParticleElement} velocity
     * @param {Tw2ParticleElement} force
     */
    ApplyForce(position, velocity, force)
    {
        force[0] += this.force[0];
        force[1] += this.force[1];
        force[2] += this.force[2];
    }
}
