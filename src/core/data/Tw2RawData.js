import {util} from '../../global';
import {Tw2DeclarationValueTypeError} from '../Tw2Error';

/**
 * Stores raw data for {@link Tw2PerObjectData}
 *
 * @property {number} nextOffset
 * @property {Float32Array} data
 * @property {*} elements
 * @class
 */
export class Tw2RawData
{

    nextOffset = 0;
    data = null;
    elements = {};


    /**
     * Constructor
     * @param {Array} [declarations] An optional array containing raw data declarations
     */
    constructor(declarations)
    {
        if (declarations) this.DeclareFromObject(declarations);
    }

    /**
     * Sets a element value
     * @param {string} name
     * @param {Float32Array|Array} value
     */
    Set(name, value)
    {
        const
            el = this.elements[name],
            subarray = 'subarray' in value ? 'subarray' : 'slice';

        this.data.set(value.length > el.size ? value[subarray](0, el.size) : value, el.offset);
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
                        if (util.isNumber(el.value))
                        {
                            el.array[0] = el.value;
                        }
                        else
                        {
                            el.array[0] = el.value[0];
                        }
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
    Declare(name, size, value = null)
    {
        if (value !== null && !(util.isArrayLike(value) || util.isNumber(value)))
        {
            throw new Tw2DeclarationValueTypeError({declaration: name, valueType: typeof value});
        }

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
     * @param {Array|Object} declarations
     */
    DeclareFromObject(declarations = [])
    {
        for (let i = 0; i < declarations.length; i++)
        {
            const decl = declarations[i];
            if (util.isArray(decl))
            {
                this.Declare(decl[0], decl[1], decl[2]);
            }
            else
            {
                this.Declare(decl.name, decl.size, decl.value);
            }
        }

        this.Create();
    }

}
