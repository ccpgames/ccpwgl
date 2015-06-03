function Tw2VertexElement(usage, usageIndex, type, elements, offset)
{
    this.usage = usage;
    this.usageIndex = usageIndex;
    this.type = type;
    this.elements = elements;
    this.offset = typeof(offset)==='undefined' ? 0 : offset;
    this.location = null;
    this.customSetter = null;
}

function Tw2VertexDeclaration()
{
    this.elements = [];
    this._elementsSorted = [];
}

Tw2VertexDeclaration.DECL_POSITION = 0;
Tw2VertexDeclaration.DECL_COLOR = 1;
Tw2VertexDeclaration.DECL_NORMAL = 2;
Tw2VertexDeclaration.DECL_TANGENT = 3;
Tw2VertexDeclaration.DECL_BINORMAL = 4;
Tw2VertexDeclaration.DECL_TEXCOORD = 5;
Tw2VertexDeclaration.DECL_BLENDWEIGHT = 6;
Tw2VertexDeclaration.DECL_BLENDINDICES = 7;


function CompareDeclarationElements(a, b)
{
    if (a.usage < b.usage) return -1;
    if (a.usage > b.usage) return 1;
    if (a.usageIndex < b.usageIndex) return -1;
    if (a.usageIndex > b.usageIndex) return 1;
    return 0; 
}

Tw2VertexDeclaration.prototype.RebuildHash = function ()
{
    this._elementsSorted = [];
    for (var i = 0; i < this.elements.length; ++i)
    {
        this._elementsSorted[i] = this.elements[i];
    }
    this._elementsSorted.sort(CompareDeclarationElements);
};

Tw2VertexDeclaration.prototype.FindUsage = function (usage, usageIndex)
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

Tw2VertexDeclaration.prototype.SetDeclaration = function (inputDecl, stride)
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
            if (cmp > 0) {
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

Tw2VertexDeclaration.prototype.SetPartialDeclaration = function (inputDecl, stride)
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
            var input = this._elementsSorted[index];
            var cmp = CompareDeclarationElements(input, el);
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
            else if (cmp > 0)
            {
                break;
            }
            index++;
            if (index >= this._elementsSorted.length)
            {
                return false;
            }
        }
    }
    return true;
};
