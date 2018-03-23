import {vec3, quat, mat4} from '../../math';
import {Tw2Parameter} from './Tw2Parameter';

/**
 * Tw2TransformParameter
 *
 * @param {string} [name='']
 * @parameter {string} name
 * @parameter {vec3} scaling=[1,1,1]
 * @parameter {quat} rotation=[0,0,0,1]
 * @parameter {vec3} translation=[0,0,0]
 * @parameter {mat4} transform
 * @parameter {mat4} transformTranspose
 * @class
 */
export class Tw2TransformParameter extends Tw2Parameter
{
    constructor(name = '')
    {
        super(name);
        this.scaling = vec3.fromValues(1, 1, 1);
        this.rotationCenter = vec3.create();
        this.rotation = quat.create();
        this.translation = vec3.create();
        this.transform = mat4.create();
        this.worldTransform = mat4.create();
        this.constantBuffer = null;
        this.offset = null;
    }

    /**
     * Initializes the transform parameter
     */
    Initialize()
    {
        this.OnValueChanged();
    }

    /**
     * Gets the parameter's value
     * @param {boolean} [serialize]
     * @returns {Array|Float32Array|mat4}
     */
    GetValue(serialize)
    {
        return serialize ? Array.from(this.transform) : new Float32Array(this.transform);
    }

    /**
     * Fire on value changes
     * @param {*} [controller]        - An optional argument to track the object that called this function
     * @param {string[]} [properties] - An option array containing the properties that were updated
     */
    OnValueChanged(controller, properties)
    {
        mat4.fromRotationTranslationScaleOrigin(this.transform, this.rotation, this.translation, this.scaling, this.rotationCenter);
        mat4.transpose(this.worldTransform, this.transform);
        super.OnValueChanged(controller, properties);
    }

    /**
     * Binds the parameter to a constant buffer
     * @param {Float32Array} constantBuffer
     * @param {number} offset
     * @param {number} size
     * @returns {boolean}
     */
    Bind(constantBuffer, offset, size)
    {
        if (!this.constantBuffer && size >= this.size)
        {
            this.constantBuffer = constantBuffer;
            this.offset = offset;
            this.Apply(constantBuffer, offset, size);
            return true;
        }
        return false;
    }

    /**
     * Applies the parameter's value to a constant buffer
     * @param {Float32Array} constantBuffer
     * @param {number} offset
     * @param {number} size
     */
    Apply(constantBuffer, offset, size)
    {
        if (size >= this.constructor.constantBufferSize)
        {
            constantBuffer.set(this.worldTransform, offset);
        }
        else
        {
            constantBuffer.set(this.worldTransform.subarray(0, size), offset);
        }
    }

    /**
     * Copies another transform parameter's values
     * @param {Tw2TransformParameter} parameter
     * @param {boolean} [includeName]
     */
    Copy(parameter, includeName)
    {
        if (includeName) this.name = parameter.name;
        quat.copy(this.rotation, parameter.rotation);
        vec3.copy(this.translation, parameter.translation);
        vec3.copy(this.scaling, parameter.scaling);
        vec3.copy(this.rotationCenter, parameter.rotationCenter);
        this.OnValueChanged();
    }
}

/**
 * The parameter's constant buffer size
 * @type {number}
 */
Tw2TransformParameter.constantBufferSize = 16;
