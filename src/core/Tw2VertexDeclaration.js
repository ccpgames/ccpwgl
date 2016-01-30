/**
 * Tw2VertexElement
 * @param {number} usage - vertex data type
 * @param {number} usageIndex
 * @param {number} type
 * @param {number} elements - How many variables this vertex data type uses
 * @param {number} offset
 * @property {number} usage
 * @property {number} usageIndex
 * @property {number} type
 * @property {number} elements
 * @property {number} offset
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
 * @type {number}
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
 * @param {number} [usageOffset=0]
 * @returns {number}
 * @function
 */
function CompareDeclarationElements(a, b, usageOffset)
{
    usageOffset = usageOffset || 0;
    if (a.usage < b.usage) return -1;
    if (a.usage > b.usage) return 1;
    if (a.usageIndex + usageOffset < b.usageIndex) return -1;
    if (a.usageIndex + usageOffset > b.usageIndex) return 1;
    return 0;
}

/**
 * Re-sorts elements
 * @prototype
 */
Tw2VertexDeclaration.prototype.RebuildHash = function()
{
    this._elementsSorted = [];
    for (var i = 0; i < this.elements.length; ++i)
    {
        this._elementsSorted[i] = this.elements[i];
    }
    this._elementsSorted.sort(CompareDeclarationElements);
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
            var cmp = CompareDeclarationElements(input, el);
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
 * @param {number} stride
 * @param {number} usageOffset
 * @param [divisor=0]
 * @returns {Array} ResetData
 * @prototype
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
            var cmp = CompareDeclarationElements(input, el, usageOffset);
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
                break;
            }
            index++;
            if (index >= this._elementsSorted.length)
            {
                this.ResetInstanceDivisors(resetData);
                return false;
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
            device.instancedArrays.vertexAttribDivisorANGLE(resetData[i], 0);
        }
    }
};
