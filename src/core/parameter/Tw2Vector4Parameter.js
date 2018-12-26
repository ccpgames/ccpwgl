import {vec4} from '../../global';
import {Tw2VectorParameter} from './Tw2Parameter';

/**
 * Tw2Vector4Parameter
 *
 * @class
 */
export class Tw2Vector4Parameter extends Tw2VectorParameter
{

    /**
     * Constructor
     * @param {string} [name='']
     * @param {vec4|Array|Float32Array} [value=vec4.fromValues(1,1,1,1)]
     */
    constructor(name = '', value = vec4.fromValues(1, 1, 1, 1))
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

    /**
     * Gets the fourth value index
     * @returns {number}
     */
    get w()
    {
        return this.GetIndexValue(3);
    }

    /**
     * Sets the fourth value index
     * @param {number} val
     */
    set w(val)
    {
        this.SetIndexValue(3, val);
    }

    /**
     * The parameter's constant buffer size
     * @type {number}
     */
    static constantBufferSize = 4;

}