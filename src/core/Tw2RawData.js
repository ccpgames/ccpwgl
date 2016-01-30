/**
 * Stores raw data for {@link Tw2PerObjectData} perObject objects and {@link EveSpaceScene} perFrame objects
 * @property {number} nextOffset
 * @property {Float32Array} data
 * @property {Object} elements
 * @property {String} elements.offset
 * @property {number} elements.size
 * @property {Array|null} elements.array
 * @constructor
 */
function Tw2RawData()
{
    this.nextOffset = 0;
    this.data = null;
    this.elements = {};
}

/**
 * Declares a raw data element
 * @param {String} name
 * @param {number} size
 * @prototype
 */
Tw2RawData.prototype.Declare = function(name, size)
{
    this.elements[name] = {
        'offset': this.nextOffset,
        'size': size,
        'array': null
    };
    this.nextOffset += size;
};

/**
 * Create
 * @prototype
 */
Tw2RawData.prototype.Create = function()
{
    this.data = new Float32Array(this.nextOffset);
    for (var el in this.elements)
    {
        if (this.elements.hasOwnProperty(el))
        {
            this.elements[el].array = this.data.subarray(this.elements[el].offset, this.elements[el].offset + this.elements[el].size);
        }
    }
};

/**
 * Sets a element value
 * @param {string} name
 * @param {Float32Array} value
 * @prototype
 */
Tw2RawData.prototype.Set = function(name, value)
{
    var el = this.elements[name];
    this.data.set(value.length > el.size ? value.subarray(0, el.size) : value, el.offset);
};

/**
 * Gets an element's array value
 * TODO: Modifying the returned value will modify the raw data, is this intentional?
 * @param {string} name
 * @return {Float32Array}
 * @prototype
 */
Tw2RawData.prototype.Get = function(name)
{
    return this.elements[name].array;
};

/**
 * Gets an element's array value from the share data array
 * TODO: Modifying the returned value will modify the raw data, is this intentional?
 * @param {string} name
 * @return {Float32Array}
 * @prototype
 */
Tw2RawData.prototype.GetData = function(name)
{
    return this.data.subarray(this.elements[name].offset, this.elements[name].offset + this.elements[name].array.length);
};
