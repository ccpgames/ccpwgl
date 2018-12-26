import {vec3} from '../../global';
import {Tw2ParticleForce} from './Tw2ParticleForce';

/**
 * Tw2ParticleFluidDragForce
 *
 * @property {number} drag
 * @inherits Tw2ParticleForce
 * @class
 */
export class Tw2ParticleFluidDragForce extends Tw2ParticleForce
{

    drag = 0.1;


    /**
     * Applies forces
     * @param {Tw2ParticleElement} position
     * @param {Tw2ParticleElement} velocity
     * @param {Tw2ParticleElement} force
     * @param {number} dt - delta time
     * @param { number} mass
     */
    ApplyForce(position, velocity, force, dt, mass)
    {
        const
            vec3_0 = Tw2ParticleForce.global.vec3_0,
            vec3_1 = Tw2ParticleForce.global.vec3_1,
            speed = Math.sqrt(
                velocity.buffer[velocity.offset] * velocity.buffer[velocity.offset] +
                velocity.buffer[velocity.offset + 1] * velocity.buffer[velocity.offset + 1] +
                velocity.buffer[velocity.offset + 2] * velocity.buffer[velocity.offset + 2]
            );

        vec3_0[0] = velocity.buffer[velocity.offset] * -speed * this.drag;
        vec3_0[1] = velocity.buffer[velocity.offset + 1] * -speed * this.drag;
        vec3_0[2] = velocity.buffer[velocity.offset + 2] * -speed * this.drag;

        vec3.scale(vec3_1, vec3_0, dt * mass);
        vec3_1[0] += velocity.buffer[velocity.offset];
        vec3_1[1] += velocity.buffer[velocity.offset + 1];
        vec3_1[2] += velocity.buffer[velocity.offset + 2];

        const dot =
            velocity.buffer[velocity.offset] * vec3_1[0] +
            velocity.buffer[velocity.offset + 1] * vec3_1[1] +
            velocity.buffer[velocity.offset + 2] * vec3_1[2];

        if (dot < 0)
        {
            force[0] = -velocity.buffer[velocity.offset] / dt / mass;
            force[1] = -velocity.buffer[velocity.offset + 1] / dt / mass;
            force[2] = -velocity.buffer[velocity.offset + 2] / dt / mass;
        }
        else
        {
            vec3.copy(force, vec3_0);
        }
    }

}
