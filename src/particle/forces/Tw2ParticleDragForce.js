import {Tw2ParticleForce} from './Tw2ParticleForce';

/**
 * Tw2ParticleDragForce
 *
 * @property {number} drag
 * @inherits Tw2ParticleForce
 * @class
 */
export class Tw2ParticleDragForce extends Tw2ParticleForce
{

    drag = 0.1;


    /**
     * ApplyForce
     * @param {Tw2ParticleElement} position
     * @param {Tw2ParticleElement} velocity
     * @param {Tw2ParticleElement} force
     */
    ApplyForce(position, velocity, force)
    {
        force[0] += velocity.buffer[velocity.offset] * -this.drag;
        force[1] += velocity.buffer[velocity.offset + 1] * -this.drag;
        force[2] += velocity.buffer[velocity.offset + 2] * -this.drag;
    }

}