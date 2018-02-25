import {device} from './Tw2Device';

/**
 * Tw2VertexElement
 * @param {number} usage - vertex data type
 * @param {number} usageIndex
 * @param {number} type
 * @param {number} elements - How many variables this vertex data type uses
 * @param {number} [offset=0]
 * @property {number} usage
 * @property {number} usageIndex
 * @property {number} type
 * @property {number} elements
 * @property {number} offset
 * @property location
 * @property customSetter
 * @constructor
 */
export function Tw2VertexElement(usage, usageIndex, type, elements, offset=0)
{
    this.usage = usage;
    this.usageIndex = usageIndex;
    this.type = type;
    this.elements = elements;
    this.offset = offset;
    this.location = null;
    this.customSetter = null;
}


/**
 * Tw2VertexDeclaration
 * @param {Array<Array>|Array<Object>} [declarations]
 * @param {number} [stride]
 * @property {Array.<Tw2VertexElement>} elements
 * @property {Array.<Tw2VertexElement>} _elementsSorted
 * @constructor
 */
export function Tw2VertexDeclaration(declarations, stride)
{
    this.elements = [];
    this._elementsSorted = [];

    if (stride !== undefined) this.stride = stride;
    if (declarations) this.DeclareFromArray(declarations);
}

/**
 * Tw2 Vertex Declaration Types
 */
Tw2VertexDeclaration.Type = {
    POSITION: 0,
    COLOR: 1,
    NORMAL: 2,
    TANGENT: 3,
    BINORMAL: 4,
    TEXCOORD: 5,
    BLENDWEIGHT: 6,
    BLENDINDICES: 7,
};

/**
 * CompareDeclarationElements
 * @param {Tw2VertexElement} a
 * @param {Tw2VertexElement} b
 * @param {number} [usageOffset=0]
 * @returns {number}
 * @function
 */
Tw2VertexDeclaration.CompareDeclarationElements = function(a, b, usageOffset=0)
{
    if (a.usage < b.usage) return -1;
    if (a.usage > b.usage) return 1;
    if (a.usageIndex + usageOffset < b.usageIndex) return -1;
    if (a.usageIndex + usageOffset > b.usageIndex) return 1;
    return 0;
};

/**
 * Re-sorts elements and then returns the declaration
 * @returns {Tw2VertexDeclaration}
 * @prototype
 */
Tw2VertexDeclaration.prototype.RebuildHash = function()
{
    this._elementsSorted = [];
    for (var i = 0; i < this.elements.length; ++i)
    {
        this._elementsSorted[i] = this.elements[i];
    }
    this._elementsSorted.sort(Tw2VertexDeclaration.CompareDeclarationElements);
    return this;
};

/**
 * Finds an element by it's usage type and usage index
 * @param {number} usage
 * @param {number} usageIndex
 * @returns {Tw2VertexElement|null}
 * @prototype
 */
Tw2VertexDeclaration.prototype.FindUsage = function(usage, usageIndex)
{
    for (var i = 0; i < this._elementsSorted.length; ++i)
    {
        var e = this._elementsSorted[i];
        if (e.usage === usage)
        {
            if (e.usageIndex === usageIndex)
            {
                return e;
            }
            else if (e.usageIndex > usageIndex)
            {
                return null;
            }
        }
        if (e.usage > usage)
        {
            return null;
        }
    }
    return null;
};

/**
 * SetDeclaration
 * @param {Tw2VertexDeclaration} inputDecl
 * @param {number} stride
 * @returns {boolean}
 * @prototype
 */
Tw2VertexDeclaration.prototype.SetDeclaration = function(inputDecl, stride)
{
    var index = 0;
    for (var i = 0; i < inputDecl._elementsSorted.length; ++i)
    {
        var el = inputDecl._elementsSorted[i];
        if (el.location < 0)
        {
            continue;
        }
        while (true)
        {
            if (index >= this._elementsSorted.length)
            {
                device.gl.disableVertexAttribArray(el.location);
                device.gl.vertexAttrib4f(el.location, 0, 0, 0, 0);
                break;
            }
            var input = this._elementsSorted[index];
            var cmp = Tw2VertexDeclaration.CompareDeclarationElements(input, el);
            if (cmp > 0)
            {
                device.gl.disableVertexAttribArray(el.location);
                device.gl.vertexAttrib4f(el.location, 0, 0, 0, 0);
                break;
            }
            if (cmp === 0)
            {
                if (input.customSetter)
                {
                    input.customSetter(el);
                }
                else
                {
                    device.gl.enableVertexAttribArray(el.location);
                    device.gl.vertexAttribPointer(
                        el.location,
                        input.elements,
                        input.type,
                        false,
                        stride,
                        input.offset);
                }
                break;
            }
            index++;
        }
    }
    return true;
};

/**
 * SetPartialDeclaration
 * @param {Tw2VertexDeclaration} inputDecl
 * @param {number} stride
 * @param {number} [usageOffset=0]
 * @param {number} [divisor=0]
 * @returns {Array} ResetData
 * @prototype
 */
Tw2VertexDeclaration.prototype.SetPartialDeclaration = function(inputDecl, stride, usageOffset=0, divisor=0)
{
    var resetData = [];
    divisor = divisor || 0;
    var index = 0;
    for (var i = 0; i < inputDecl._elementsSorted.length; ++i)
    {
        var el = inputDecl._elementsSorted[i];
        if (el.location < 0)
        {
            continue;
        }
        while (true)
        {
            var input = this._elementsSorted[index];
            var cmp = Tw2VertexDeclaration.CompareDeclarationElements(input, el, usageOffset);
            if (cmp === 0)
            {
                if (input.customSetter)
                {
                    input.customSetter(el);
                }
                else
                {
                    device.gl.enableVertexAttribArray(el.location);
                    device.gl.vertexAttribPointer(
                        el.location,
                        input.elements,
                        input.type,
                        false,
                        stride,
                        input.offset);
                    device.ext.vertexAttribDivisor(el.location, divisor);
                    if (divisor)
                    {
                        resetData.push(el.location);
                    }
                }
                break;
            }
            else if (cmp > 0)
            {
                if (!divisor)
                {
                    device.gl.disableVertexAttribArray(el.location);
                    device.gl.vertexAttrib4f(el.location, 0, 0, 0, 0);
                }
                break;
            }
            index++;
            if (index >= this._elementsSorted.length)
            {
                if (!divisor)
                {
                    device.gl.disableVertexAttribArray(el.location);
                    device.gl.vertexAttrib4f(el.location, 0, 0, 0, 0);
                }
                return resetData;
            }
        }
    }
    return resetData;
};

/**
 * ResetInstanceDivisors
 * @param {Array} resetData
 * @prototype
 */
Tw2VertexDeclaration.prototype.ResetInstanceDivisors = function(resetData)
{
    if (resetData)
    {
        for (var i = 0; i < resetData.length; ++i)
        {
            device.ext.vertexAttribDivisor(resetData[i], 0);
        }
    }
};

/**
 * Declares elements from an array
 * @param {Array} declarations
 */
Tw2VertexDeclaration.prototype.DeclareFromArray = function(declarations)
{
    if (this.elements.length)
    {
        this.elements.splice(0, this.elements.length);
    }

    for (let i = 0; i < declarations.length; i++)
    {
        const el = declarations[i];

        if (Array.isArray(el))
        {
            this.AddElement(...el);
        }
        else
        {
            this.AddElement(el.usage, el.usageIndex, el.type, el.elements, el.offset);
        }
    }

    this.RebuildHash();
};

/**
 * Creates and adds a Tw2VertexElement from arguments
 * @param {number|string} usage
 * @param {number} usageIndex
 * @param {number|string} type
 * @param {number} elements
 * @param {number} offset
 * @returns {Tw2VertexDeclaration}
 */
Tw2VertexDeclaration.prototype.AddElement = function(usage, usageIndex, type, elements, offset)
{
    if (typeof usage === 'string')
    {
        usage = Tw2VertexDeclaration.Type[usage.toUpperCase()];
    }

    if (typeof type === 'string')
    {
        type = device.gl[type.toUpperCase()];
    }

    this.elements.push(new Tw2VertexElement(usage, usageIndex, type, elements, offset));
};