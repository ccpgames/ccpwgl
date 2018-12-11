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

    angle = 0;
    innerAngle = 0;
    drag = 0;
    rate = 0;
    radius = 0;
    gravity = 0;
    maxSpeed = 0;
    minSpeed = 0;
    minLifeTime = 0;
    maxLifeTime = 0;
    sizeVariance = 0;
    attractorPosition = vec3.create();
    attractorStrength = 0;
    turbulenceAmplitude = 0;
    turbulenceFrequency = 0;
    textureIndex = 0;
    sizes = vec3.create();
    position = vec3.create();
    color0 = vec4.create();
    color1 = vec4.create();
    color2 = vec4.create();
    color3 = vec4.create();
    //maxDisplacement=null;
    //emissionDensity=null;
    //velocityStretchRotation=null;
    //inheritVelocity=null;


    /**
     * Identifies that the object is not yet fully implemented
     * @type {boolean}
     */
    static partialImplementation = true;

}
