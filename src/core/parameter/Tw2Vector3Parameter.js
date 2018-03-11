import {vec3} from '../../math';
import {Tw2VectorParameter} from './Tw2Parameter';

/**
 * Tw2Vector3Parameter
 *
 * @param {string} [name='']
 * @param {vec3|Array|Float32Array} [value=vec3.fromValues(1,1,1)]
 * @class
 */
export class Tw2Vector3Parameter extends Tw2VectorParameter
{
    constructor(name = '', value = vec3.fromValues(1, 1, 1))
    {
        super(name, value);
    }

    /**
     * Gets the first value index
     * @returns {number}
     */
    get x()
    {
        return this.GetIndexValue(0);
    }

    /**
     * Sets the first value index
     * @param {number} val
     */
    set x(val)
    {
        this.SetIndexValue(0, val);
    }

    /**
     * Gets the second value index
     * @returns {number}
     */
    get y()
    {
        return this.GetIndexValue(1);
    }

    /**
     * Sets the second value index
     * @param {number} val
     */
    set y(val)
    {
        this.SetIndexValue(1, val);
    }

    /**
     * Gets the third value index
     * @returns {number}
     */
    get z()
    {
        return this.GetIndexValue(2);
    }

    /**
     * Sets the third value index
     * @param {number} val
     */
    set z(val)
    {
        this.SetIndexValue(2, val);
    }
}

/**
 * The parameter's constant buffer size
 * @type {number}
 */
Tw2Vector3Parameter.constantBufferSize = 3;