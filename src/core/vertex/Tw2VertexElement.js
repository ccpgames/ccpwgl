/**
 * Tw2VertexElement
 *
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

    usage = null;
    usageIndex = null;
    type = null;
    elements = null;
    offset = 0;
    location = null;
    customSetter = null;


    /**
     * Constructor
     * @param {number} usage
     * @param {number} usageIndex
     * @param {number} type
     * @param {number} elements
     * @param {number} [offset=0]
     */
    constructor(usage, usageIndex, type, elements, offset = 0)
    {
        this.usage = usage;
        this.usageIndex = usageIndex;
        this.type = type;
        this.elements = elements;
        this.offset = offset;
    }
}
