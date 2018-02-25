/**
 * Stores raw data for {@link Tw2PerObjectData} perObject objects and {@link EveSpaceScene} perFrame objects
 *
 * @param {[]} [declarationArray]
 * @param {boolean} [skipCreate]
 * @property {number} nextOffset
 * @property {Float32Array} data
 * @property {{}} elements
 */

export class Tw2RawData
{
    constructor(declarationArray, skipCreate)
    {
        this.nextOffset = 0;
        this.data = null;
        this.elements = {};

        if (declarationArray)
        {
            this.DeclareFromArray(declarationArray, skipCreate);
        }
    }
    
    /**
     * Sets an element's value
     * @param {string|Object} name
     * @param {Float32Array|Array} [value]
     */
    Set(name, value)
    {
        const el = this.elements[name];

        if (typeof value !== 'number' && value.length > el.size)
        {
            value = 'subarray' in value ? value.subarray(0, el.size) : value.splice(0, el.size);
        }

        this.data.set(value, el.offset);
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
     * Declares a raw data element and then returns the raw data element
     * @param {String} name
     * @param {number} size
     * @param {Array|Float32Array} [value=null] optional value to set on raw data creation
     * @returns {Tw2RawData}
     */
    Declare(name, size, value = null)
    {
        this.elements[name] = {
            'offset': this.nextOffset,
            'size': size,
            'array': null,
            'value': value
        };
        this.nextOffset += size;
    }

    /**
     * Creates the raw data element arrays and then returns the raw data element
     * @returns {Tw2RawData}
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
     * Declares elements from an array
     * @param {[]} declarationArray
     * @param {boolean} [skipCreate]
     * @returns {Tw2RawData}
     */
    DeclareFromArray(declarationArray, skipCreate)
    {
        if (declarationArray)
        {
            for (let i = 0; i < declarationArray.length; i++)
            {
                const el = declarationArray[i];
                this.Declare(el.name, el.size, el.value);
            }
            if (!skipCreate) this.Create();
        }
    }
}
