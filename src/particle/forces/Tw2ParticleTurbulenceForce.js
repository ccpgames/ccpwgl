import {vec3, vec4, noise} from '../../math';
import {Tw2ParticleForce} from './Tw2ParticleForce';

/**
 * Tw2ParticleTurbulenceForce
 *
 * @property {number} noiseLevel
 * @property {number} noiseRatio
 * @property {vec3} amplitude
 * @property {quat} frequency
 * @property {number} _time
 * @inherits Tw2ParticleForce
 * @class
 */
export class Tw2ParticleTurbulenceForce extends Tw2ParticleForce
{
    constructor()
    {
        super();
        this.noiseLevel = 3;
        this.noiseRatio = 0.5;
        this.amplitude = vec3.fromValues(1, 1, 1);
        this.frequency = vec4.fromValues(1, 1, 1, 1);
        this._time = 0;
    }

    /**
     * ApplyForce
     * @param {Tw2ParticleElement} position
     * @param {Tw2ParticleElement} velocity
     * @param {Tw2ParticleElement} force
     */
    ApplyForce(position, velocity, force)
    {
        if (this.noiseLevel === 0)
        {
            return;
        }

        let pos_0 = position.buffer[position.offset] * this.frequency[0],
            pos_1 = position.buffer[position.offset + 1] * this.frequency[1],
            pos_2 = position.buffer[position.offset + 2] * this.frequency[2],
            pos_3 = this._time * this.frequency[3];

        let sum = 0,
            power = 0.5,
            frequency = 1 / this.noiseRatio;

        const out = vec4.set(Tw2ParticleForce.global.vec4_0, 0, 0, 0, 0);

        for (let i = 0; i < this.noiseLevel; ++i)
        {
            noise.turbulence(out, pos_0, pos_1, pos_2, pos_3, power);
            sum += power;
            pos_0 *= frequency;
            pos_1 *= frequency;
            pos_2 *= frequency;
            pos_3 *= frequency;
            power *= this.noiseRatio;
        }

        force[0] += out[0] * this.amplitude[0] * sum;
        force[1] += out[1] * this.amplitude[1] * sum;
        force[2] += out[2] * this.amplitude[2] * sum;
    }

    /**
     * Per frame update (Called before ApplyForce)
     * @param {number} dt - delta Time
     */
    Update(dt)
    {
        this._time += dt;
    }
}