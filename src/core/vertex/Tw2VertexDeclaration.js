import {util, device} from '../../global';
import {Tw2VertexElement} from './Tw2VertexElement';

/**
 * Tw2VertexDeclaration
 *
 * @property {Array.<Tw2VertexElement>} elements
 * @property {Array.<Tw2VertexElement>} _elementsSorted
 * @class
 */
export class Tw2VertexDeclaration
{

    elements = [];
    _elementsSorted = [];
    stride = null;


    /**
     * Constructor
     * @param {Array<Array|Object>} [declarations]
     * @param {number} [stride]
     */
    constructor(declarations, stride)
    {
        if (stride !== undefined)
        {
            this.stride = stride;
        }

        if (declarations)
        {
            this.DeclareFromObject(declarations);
        }
    }

    /**
     * Re-sorts elements
     */
    RebuildHash()
    {
        this._elementsSorted = [];
        for (let i = 0; i < this.elements.length; ++i)
        {
            this._elementsSorted[i] = this.elements[i];
        }
        this._elementsSorted.sort(Tw2VertexDeclaration.CompareDeclarationElements);
    }

    /**
     * Finds an element by it's usage type and usage index
     * @param {number} usage
     * @param {number} usageIndex
     * @returns {Tw2VertexElement|null}
     */
    FindUsage(usage, usageIndex)
    {
        for (let i = 0; i < this._elementsSorted.length; ++i)
        {
            const e = this._elementsSorted[i];
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
    }

    /**
     * SetDeclaration
     * @param {Tw2VertexDeclaration} inputDecl
     * @param {number} stride
     * @returns {boolean}
     */
    SetDeclaration(inputDecl, stride)
    {
        const gl = device.gl;

        let index = 0;
        for (let i = 0; i < inputDecl._elementsSorted.length; ++i)
        {
            const el = inputDecl._elementsSorted[i];
            if (el.location < 0) continue;

            while (true)
            {
                if (index >= this._elementsSorted.length)
                {
                    gl.disableVertexAttribArray(el.location);
                    gl.vertexAttrib4f(el.location, 0, 0, 0, 0);
                    break;
                }

                const
                    input = this._elementsSorted[index],
                    cmp = Tw2VertexDeclaration.CompareDeclarationElements(input, el);

                if (cmp > 0)
                {
                    gl.disableVertexAttribArray(el.location);
                    gl.vertexAttrib4f(el.location, 0, 0, 0, 0);
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
                        gl.enableVertexAttribArray(el.location);
                        gl.vertexAttribPointer(
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
    }

    /**
     * SetPartialDeclaration
     * @param {Tw2VertexDeclaration} inputDecl
     * @param {number} stride
     * @param {number} [usageOffset=0]
     * @param {number} [divisor=0]
     * @returns {Array} ResetData
     */
    SetPartialDeclaration(inputDecl, stride, usageOffset = 0, divisor = 0)
    {
        const
            {ext, gl} = device,
            resetData = [];

        let index = 0;
        for (let i = 0; i < inputDecl._elementsSorted.length; ++i)
        {
            const el = inputDecl._elementsSorted[i];
            if (el.location < 0) continue;

            while (true)
            {
                const
                    input = this._elementsSorted[index],
                    cmp = Tw2VertexDeclaration.CompareDeclarationElements(input, el, usageOffset);

                if (cmp === 0)
                {
                    if (input.customSetter)
                    {
                        input.customSetter(el);
                    }
                    else
                    {
                        gl.enableVertexAttribArray(el.location);
                        gl.vertexAttribPointer(
                            el.location,
                            input.elements,
                            input.type,
                            false,
                            stride,
                            input.offset);

                        ext.vertexAttribDivisor(el.location, divisor);

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
                        gl.disableVertexAttribArray(el.location);
                        gl.vertexAttrib4f(el.location, 0, 0, 0, 0);
                    }
                    break;
                }

                index++;
                if (index >= this._elementsSorted.length)
                {
                    if (!divisor)
                    {
                        gl.disableVertexAttribArray(el.location);
                        gl.vertexAttrib4f(el.location, 0, 0, 0, 0);
                    }
                    return resetData;
                }
            }
        }
        return resetData;
    }

    /**
     * ResetInstanceDivisors
     * @param {Array} resetData
     */
    ResetInstanceDivisors(resetData)
    {
        if (resetData)
        {
            for (let i = 0; i < resetData.length; ++i)
            {
                device.ext.vertexAttribDivisor(resetData[i], 0);
            }
        }
    }

    /**
     * Sets vertex declarations from an array of arrays, or an array of objects
     * @param {Array<Array>|Array<Object>} declarations
     * @param {number} [stride]
     */
    DeclareFromObject(declarations, stride)
    {
        this.elements.splice(0, this.elements.length);
        let currentOffset = 0;

        for (let i = 0; i < declarations.length; i++)
        {
            const decl = declarations[i];
            let usage, usageIndex, type, elements, offset;

            if (util.isArray(decl))
            {
                usage = decl[0];
                usageIndex = decl[1];
                elements = decl[2];
                type = decl[3];
                offset = decl[4];
            }
            else
            {
                usage = decl.usage;
                usageIndex = decl.usageIndex;
                elements = decl.elements;
                type = decl.type;
                offset = decl.offset;
            }

            if (util.isString(usage))
            {
                usage = Tw2VertexDeclaration.Type[usage.toUpperCase()];
            }

            if (util.isNoU(type))
            {
                type = 'FLOAT';
            }

            if (util.isString(type))
            {
                type = device.gl[type.toUpperCase()];
            }

            if (util.isNoU(offset))
            {
                offset = currentOffset;
            }

            this.elements.push(new Tw2VertexElement(usage, usageIndex, type, elements, offset));
            currentOffset += elements * 4;
        }

        if (stride !== undefined)
        {
            this.stride = stride;
        }

        this.RebuildHash();
    }

    /**
     * CompareDeclarationElements
     * @param {Tw2VertexElement} a
     * @param {Tw2VertexElement} b
     * @param {number} [usageOffset=0]
     * @returns {number}
     * @function
     */
    static CompareDeclarationElements(a, b, usageOffset = 0)
    {
        if (a.usage < b.usage) return -1;
        if (a.usage > b.usage) return 1;
        if (a.usageIndex + usageOffset < b.usageIndex) return -1;
        if (a.usageIndex + usageOffset > b.usageIndex) return 1;
        return 0;
    }

    /**
     * Vertex Declaration Types
     * @type {*}
     */
    static Type = {
        POSITION: 0,
        COLOR: 1,
        NORMAL: 2,
        TANGENT: 3,
        BINORMAL: 4,
        TEXCOORD: 5,
        BLENDWEIGHT: 6,
        BLENDINDICES: 7
    };

}