/**
 * Tw2ParticleElement
 *
 * @property {number} elementType
 * @property {string} customName
 * @property {number} dimension
 * @property {number} usageIndex
 * @property {boolean} usedByGPU
 * @property buffer
 * @property {number} startOffset
 * @property {number} offset
 * @property {number} instanceStride
 * @property {number} vertexStride
 * @property {boolean} dirty
 * @class
 */
export class Tw2ParticleElement
{

    elementType = null;
    customName = null;
    dimension = null;
    usageIndex = null;
    usedByGPU = null;
    buffer = null;
    startOffset = 0;
    offset = 0;
    instanceStride = 0;
    vertexStride = 0;
    dirty = false;


    /**
     * Constructor
     * @param {Tw2ParticleElementDeclaration} decl
     */
    constructor(decl)
    {
        if (decl)
        {
            this.elementType = decl.elementType;
            this.customName = decl.customName;
            this.dimension = decl.GetDimension();
            this.usageIndex = decl.usageIndex;
            this.usedByGPU = decl.usedByGPU;
        }
    }

}
