/**
 * Tw2VertexElement
 * @param {Number} usage - vertex data type
 * @param {Number} usageIndex
 * @param {Number} type
 * @param {Number} elements - How many variables this vertex data type uses
 * @param {Number} offset
 * @property {Number} usage
 * @property {Number} usageIndex
 * @property {Number} type
 * @property {Number} elements
 * @property {Number} offset
 * @property location
 * @property customSetter
 * @constructor
 */
function Tw2VertexElement(usage, usageIndex, type, elements, offset)
{
    this.usage = usage;
    this.usageIndex = usageIndex;
    this.type = type;
    this.elements = elements;
    this.offset = typeof(offset) === 'undefined' ? 0 : offset;
    this.location = null;
    this.customSetter = null;
}


/**
 * Tw2VertexDeclaration
 * @property {Array.<Tw2VertexElement>} elements
 * @property {Array.<Tw2VertexElement>} _elementsSorted
 * @constructor
 */
function Tw2VertexDeclaration()
{
    this.elements = [];
    this._elementsSorted = [];
}

/**
 * Tw2 Vertex Declaration Types
 * @type {Number}
 */
Tw2VertexDeclaration.DECL_POSITION = 0;
Tw2VertexDeclaration.DECL_COLOR = 1;
Tw2VertexDeclaration.DECL_NORMAL = 2;
Tw2VertexDeclaration.DECL_TANGENT = 3;
Tw2VertexDeclaration.DECL_BINORMAL = 4;
Tw2VertexDeclaration.DECL_TEXCOORD = 5;
Tw2VertexDeclaration.DECL_BLENDWEIGHT = 6;
Tw2VertexDeclaration.DECL_BLENDINDICES = 7;

/**
 * CompareDeclarationElements
 * @param {Tw2VertexElement} a
 * @param {Tw2VertexElement} b
 * @param {Number} [usageOffset=0]
 * @returns {Number}
 */
Tw2VertexDeclaration.CompareDeclarationElements = function(a, b, usageOffset)
{
    usageOffset = usageOffset || 0;
    if (a.usage < b.usage) return -1;
    if (a.usage > b.usage) return 1;
    if (a.usageIndex + usageOffset < b.usageIndex) return -1;
    if (a.usageIndex + usageOffset > b.usageIndex) return 1;
    return 0;
};

/**
 * Re-sorts elements
 */
Tw2VertexDeclaration.prototype.RebuildHash = function()
{
    this._elementsSorted = [];
    for (var i = 0; i < this.elements.length; ++i)
    {
        this._elementsSorted[i] = this.elements[i];
    }
    this._elementsSorted.sort(Tw2VertexDeclaration.CompareDeclarationElements);
};

/**
 * Finds an element by it's usage type and usage index
 * @param {Number} usage
 * @param {Number} usageIndex
 * @returns {Tw2VertexElement|null}
 *
 */
Tw2VertexDeclaration.prototype.FindUsage = function(usage, usageIndex)
{
    for (var i = 0; i < this._elementsSorted.length; ++i)
    {
        var e = this._elementsSorted[i];
        if (e.usage == usage)
        {
            if (e.usageIndex == usageIndex)
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
 * @param {Number} stride
 * @returns {Boolean}
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
            if (cmp == 0)
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
 * @param {Number} stride
 * @param {Number} usageOffset
 * @param [divisor=0]
 * @returns {Array} ResetData
 *
 */
Tw2VertexDeclaration.prototype.SetPartialDeclaration = function(inputDecl, stride, usageOffset, divisor)
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
            if (cmp == 0)
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
                    device.instancedArrays.vertexAttribDivisorANGLE(el.location, divisor);
                    if (divisor)
                    {
                        resetData.push(el.location)
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
 */
Tw2VertexDeclaration.prototype.ResetInstanceDivisors = function(resetData)
{
    if (resetData)
    {
        for (var i = 0; i < resetData.length; ++i)
        {
            device.instancedArrays.vertexAttribDivisorANGLE(resetData[i], 0);
        }
    }
};
