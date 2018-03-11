/* eslint no-unused-vars:0 */
import { util } from '../../math';

/**
 * Tw2Parameter base class
 *
 * @param {string} [name='']
 * @property {string|number} _id
 * @property {string} name
 * @property {Array<Function>} _onModified
 */
export class Tw2Parameter
{
    constructor(name = '')
    {
        this._id = util.generateID();
        this.name = name;
        this._onModified = [];
    }

    /**
     * Gets the parameter's constant buffer size
     * @returns {number} 0 if invalid
     */
    get size()
    {
        return this.constructor.constantBufferSize;
    }

    /**
     * Fire on value changes
     * @property {*} [controller]        - An optional object which changed the parameter's value
     * @property {string[]} [properties] - An optional array for tracking the parameters that were updated
     */
    OnValueChanged(controller, properties)
    {
        for (let i = 0; i < this._onModified.length; i++)
        {
            this._onModified[i](this, controller, properties);
        }
    }

    /**
     * Adds a callback which is fired when the parameter's OnValueChanged method is called
     * @param {function} func
     * @returns {boolean} true if successful
     */
    AddCallback(func)
    {
        if (!this._onModified.includes(func))
        {
            this._onModified.push(func);
        }
        return true;
    }

    /**
     * Removes a callback
     * @param {Function} func
     */
    RemoveCallback(func)
    {
        const index = this._onModified.indexOf(func);
        if (index !== -1)
        {
            this._onModified.splice(index, 1);
        }
    }

    /**
     * Gets the parameter's value
     * @param {boolean} [serialize] - forces serialized result
     * @returns {null}
     */
    GetValue(serialize)
    {
        return null;
    }

    /**
     * Binds the parameter
     * @param {*} a
     * @param {*} b
     * @param {*} c
     * @returns {boolean} false if not bound
     */
    Bind(a, b, c)
    {
        return false;
    }

    /**
     * Unbinds the parameter
     */
    UnBind()
    {

    }

    /**
     * Applies the parameter to a constant buffer
     * @param {*} a
     * @param {*} b
     * @param {*} c
     */
    Apply(a, b, c)
    {

    }

    /**
     * Copies another parameter's value
     * @param {*} parameter
     */
    Copy(parameter)
    {

    }

    /**
     * Clones the parameter
     * @returns {Tw2Parameter}
     */
    Clone()
    {
        const parameter = new this.constructor();
        parameter.Copy(this, true);
        return parameter;
    }
}

/**
 * The parameter's constant buffer size
 * @type {number}
 */
Tw2Parameter.constantBufferSize = 0;


/**
 * Tw2VectorParameter base class
 *
 * @property {Float32Array} value
 * @property {?Float32Array} constantBuffer
 * @property {?number} offset
 * @class
 */
export class Tw2VectorParameter extends Tw2Parameter
{
    constructor(name, value)
    {
        super(name);
        this.value = new Float32Array(this.size);
        this.constantBuffer = null;
        this.offset = null;
        if (value) this.value.set(value);
    }

    /**
     * Sets the parameter's value
     * @param {Float32Array} value
     */
    SetValue(value)
    {
        this.value.set(value);
        this.OnValueChanged();
    }

    /**
     * Sets a parameter's value at a given index
     * @param {number} index   - the parameter's value index to change
     * @param {number} value   - the value to set
     * @throw Index Error
     */
    SetIndexValue(index, value)
    {
        if (this.value[index] !== undefined)
        {
            if (this.value[index] !== value)
            {
                this.value[index] = value;
                this.OnValueChanged();
            }
            return;
        }

        throw new Error('Index Error');
    }

    /**
     * Gets the parameter's value
     * @param {boolean} [serialize] - An optional parameter to force a serialized result
     * @returns {Array|Float32Array}
     */
    GetValue(serialize)
    {
        const value = this.constantBuffer ? this.constantBuffer.subarray(this.offset, this.offset + this.size) : this.value;
        return serialize ? Array.from(value) : new Float32Array(value);
    }

    /**
     * Gets a parameter's value at a given index
     * @param index
     * @returns {number}
     * @throw Index Error
     */
    GetIndexValue(index)
    {
        if (this.value[index] !== undefined)
        {
            return this.value[index];
        }
        throw new Error('Index Error');
    }

    /**
     * Fire on value changes
     * @param {*} [controller]        - An optional parameter for tracking the object that called the function
     * @param {string[]} [properties] - An optional array for tracking the parameters that were updated
     */
    OnValueChanged(controller, properties)
    {
        if (this.constantBuffer)
        {
            this.Apply(this.constantBuffer, this.offset);
        }

        super.OnValueChanged(controller, properties);
    }

    /**
     * Binds the parameter to a constant buffer
     * @param {Float32Array} constantBuffer
     * @param {number} offset
     * @param {number} size
     * @returns {boolean} true if bound
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
     * Unbinds the parameter from a constant buffer
     */
    Unbind()
    {
        this.constantBuffer = null;
    }

    /**
     * Applies the parameter's value to it's constant buffer
     * @param {Float32Array} constantBuffer
     * @param {number} offset
     * @param {number} [size]
     */
    Apply(constantBuffer, offset, size)
    {
        constantBuffer.set(this.value, offset);
    }

    /**
     * Checks if a value equals the parameter's value
     * - Assumes the correct length array or typed array is passed
     * @param {Array|Float32Array} value
     * @returns {boolean}
     */
    EqualsValue(value)
    {
        for (let i = 0; i < this.size; i++)
        {
            if (this.value[i] !== value[i])
            {
                return false;
            }
        }
        return true;
    }

    /**
     * Copies another parameter's value
     * @param {Tw2VectorParameter|*} parameter
     * @param {boolean} [includeName]
     */
    Copy(parameter, includeName)
    {
        if (includeName) this.name = parameter.name;
        this.SetValue(parameter.GetValue());
    }

    /**
     * Checks if a value is a valid parameter input
     * @param {Float32Array|Array} value
     * @returns {boolean}
     */
    static is(value)
    {
        return (util.isArrayLike(value) && value.length === this.constantBufferSize);
    }
}
