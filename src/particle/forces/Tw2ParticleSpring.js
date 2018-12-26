import {vec3} from '../../global';
import {Tw2ParticleForce} from './Tw2ParticleForce';

/**
 * Tw2ParticleSpring
 *
 * @property {number} springConstant
 * @property {vec3} position
 * @inherits Tw2ParticleForce
 * @class
 */
export class Tw2ParticleSpring extends Tw2ParticleForce
{

    springConstant = 0;
    position = vec3.create();


    /**
     * ApplyForce
     * @param {Tw2ParticleElement} position
     * @param {Tw2ParticleElement} velocity
     * @param {Tw2ParticleElement} force
     */
    ApplyForce(position, velocity, force)
    {
        force[0] += (this.position[0] - position.buffer[position.offset]) * this.springConstant;
        force[1] += (this.position[1] - position.buffer[position.offset + 1]) * this.springConstant;
        force[2] += (this.position[2] - position.buffer[position.offset + 2]) * this.springConstant;
    }

}
