import {vec3, vec4} from '../../global';
import {Tw2ParticleEmitter} from './Tw2ParticleEmitter';

/**
 * Tr2GpuUniqueEmitter - not implemented yet
 *
 * @property {number} angle
 * @property {number} innerAngle
 * @property {number} drag
 * @property {number} rate
 * @property {number} radius
 * @property {number} gravity
 * @property {number} maxSpeed
 * @property {number} minSpeed
 * @property {number} minLifeTime
 * @property {number} maxLifeTime
 * @property {number} sizeVariance
 * @property {vec3} attractorPosition
 * @property {number} attractorStrength
 * @property {number} textureIndex
 * @property {number} turbulenceAmplitude
 * @property {number} turbulenceFrequency
 * @property {vec3} sizes
 * @property {vec4} color0
 * @property {vec4} color1
 * @property {vec4} color2
 * @property {vec4} color3
 * @class
 */
export class Tw2GpuUniqueEmitter extends Tw2ParticleEmitter
{
    constructor()
    {
        super();
        this.angle = 0;
        this.innerAngle = 0;
        this.drag = 0;
        this.rate = 0;
        this.radius = 0;
        this.gravity = 0;
        this.maxSpeed = 0;
        this.minSpeed = 0;
        this.minLifeTime = 0;
        this.maxLifeTime = 0;
        this.sizeVariance = 0;
        this.attractorPosition = vec3.create();
        this.attractorStrength = 0;
        this.turbulenceAmplitude = 0;
        this.turbulenceFrequency = 0;
        this.textureIndex = 0;
        this.sizes = vec3.create();
        this.position = vec3.create();
        this.color0 = vec4.create();
        this.color1 = vec4.create();
        this.color2 = vec4.create();
        this.color3 = vec4.create();

        //this.maxDisplacement=null;
        //this.emissionDensity=null;
        //this.velocityStretchRotation=null;
        //this.inheritVelocity=null;
    }
}

// Temporary alias
export {Tw2GpuUniqueEmitter as Tr2GpuUniqueEmitter};