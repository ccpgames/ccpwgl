import { util } from '../../math';

/**
 * Stores raw data for {@link Tw2PerObjectData}
 *
 * @param {{string:Float32Array|Array|number}} [declarations] An optional object containing raw data declarations
 * @property {number} nextOffset
 * @property {Float32Array} data
 * @property {*} elements
 * @class
 */
export class Tw2RawData
{
    constructor(declarations)
    {
        this.nextOffset = 0;
        this.data = null;
        this.elements = {};

        if (declarations)
        {
            this.DeclareFromObject(declarations);
        }
    }

    /**
     * Sets a element value
     * @param {string} name
     * @param {Float32Array|Array} value
     */
    Set(name, value)
    {
        const el = this.elements[name];
        this.data.set(value.length > el.size ? value.subarray(0, el.size) : value, el.offset);
    }

    /**
     * Gets an element's array value
     * @param {string} name
     * @return {Float32Array}
     */
    Get(name)
    {
        return this.elements[name].array;
    }

    /**
     * Gets an element's array value from the share data array
     * @param {string} name
     * @return {Float32Array}
     */
    GetData(name)
    {
        return this.data.subarray(this.elements[name].offset, this.elements[name].offset + this.elements[name].array.length);
    }

    /**
     * Creates the raw data element arrays
     */
    Create()
    {
        this.data = new Float32Array(this.nextOffset);
        for (let name in this.elements)
        {
            if (this.elements.hasOwnProperty(name))
            {
                const el = this.elements[name];
                el.array = this.data.subarray(el.offset, el.offset + el.size);

                if (el.value !== null)
                {
                    if (el.size === 1)
                    {
                        el.array[0] = el.value;
                    }
                    else
                    {
                        for (let i = 0; i < el.size; i++)
                        {
                            el.array[i] = el.value[i];
                        }
                    }
                    el.value = null;
                }
            }
        }
    }

    /**
     * Declares a raw data element
     * @param {String} name
     * @param {number} size
     * @param {!|number|Array|Float32Array} [value=null] optional value to set on raw data creation
     */
    Declare(name, size, value=null)
    {
        this.elements[name] = {
            offset: this.nextOffset,
            size: size,
            array: null,
            value: value
        };

        this.nextOffset += size;
    }

    /**
     * Declares raw data from an object and then creates the elements
     * @param {{string:Float32Array|Array|number}} declarations
     */
    DeclareFromObject(declarations = {})
    {
        for (let name in declarations)
        {
            if (declarations.hasOwnProperty(name))
            {
                const value = declarations[name];

                if (typeof value === 'number')
                {
                    this.Declare(name, 1, value);
                }
                else if (util.isArrayLike(value))
                {
                    if (value.length === 1)
                    {
                        this.Declare(name, value.length, value);
                    }
                }
                else
                {
                    throw new Error(`Invalid declaration type: ${typeof value}`);
                }
            }
        }

        this.Create();
    }

}
