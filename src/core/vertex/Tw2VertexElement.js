/**
 * Tw2VertexElement
 *
 * @param {number} usage
 * @param {number} usageIndex
 * @param {number} type
 * @param {number} elements
 * @param {number} [offset=0]
 * @property {number} usage
 * @property {number} usageIndex
 * @property {number} type
 * @property {number} elements
 * @property {number} offset
 * @property location
 * @property customSetter
 * @class
 */
export class Tw2VertexElement
{
    constructor(usage, usageIndex, type, elements, offset = 0)
    {
        this.usage = usage;
        this.usageIndex = usageIndex;
        this.type = type;
        this.elements = elements;
        this.offset = offset;
        this.location = null;
        this.customSetter = null;
    }
}
