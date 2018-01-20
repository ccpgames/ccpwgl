import {vec3} from '../../math';
import {Tw2ParticleForce} from './Tw2ParticleForce';

/**
 * Tw2ParticleAttractorForce
 *
 * @property {number} magnitude
 * @property {vec3} position
 * @property {vec3} _tempVec
 * @inherits Tw2ParticleForce
 * @class
 */
export class Tw2ParticleAttractorForce extends Tw2ParticleForce
{
    super()
    {
        this.magnitude = 0;
        this.position = vec3.create();
    }

    /**
     * ApplyForce
     * @param {Tw2ParticleElement} position
     * @param {Tw2ParticleElement} velocity
     * @param {Tw2ParticleElement} force
     */
    ApplyForce(position, velocity, force)
    {
        const vec3_0 = Tw2ParticleForce.global.vec3_0;

        vec3_0[0] = this.position[0] - position.buffer[position.offset];
        vec3_0[1] = this.position[1] - position.buffer[position.offset + 1];
        vec3_0[2] = this.position[2] - position.buffer[position.offset + 2];

        vec3.normalize(vec3_0, vec3_0);
        vec3.scale(vec3_0, vec3_0, this.magnitude);
        vec3.add(force, force, vec3_0);
    }
}