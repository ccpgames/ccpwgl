/**
 * Tw2ParticleElement
 *
 * @param {Tw2ParticleElementDeclaration} decl
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
    constructor(decl)
    {
        this.elementType = decl.elementType;
        this.customName = decl.customName;
        this.dimension = decl.GetDimension();
        this.usageIndex = decl.usageIndex;
        this.usedByGPU = decl.usedByGPU;
        this.buffer = null;
        this.startOffset = 0;
        this.offset = 0;
        this.instanceStride = 0;
        this.vertexStride = 0;
        this.dirty = false;
    }
}
