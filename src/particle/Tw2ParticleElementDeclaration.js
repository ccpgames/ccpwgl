import {Tw2VertexDeclaration, Tw2VertexElement} from '../core';
import {device} from '../global';


/**
 * Tw2ParticleElementDeclaration
 *
 * @property {number} elementType=4
 * @property {string} customName
 * @property {number} dimension=1
 * @property {number} usageIndex
 * @property {boolean} usedByGPU
 * @class
 */
export class Tw2ParticleElementDeclaration
{
    constructor()
    {
        this.elementType = 4;
        this.customName = '';
        this.dimension = 1;
        this.usageIndex = 0;
        this.usedByGPU = true;
    }

    /**
     * Gets the dimension of an element type
     * @returns {number}
     */
    GetDimension()
    {
        switch (this.elementType)
        {
            case Tw2ParticleElementDeclaration.Type.LIFETIME:
                return 2;

            case Tw2ParticleElementDeclaration.Type.POSITION:
                return 3;

            case Tw2ParticleElementDeclaration.Type.VELOCITY:
                return 3;

            case Tw2ParticleElementDeclaration.Type.MASS:
                return 1;
        }
        return this.dimension;
    }

    /**
     * GetDeclaration
     * @returns {Tw2VertexElement}
     */
    GetDeclaration()
    {
        let usage;
        switch (this.elementType)
        {
            case Tw2ParticleElementDeclaration.Type.LIFETIME:
                usage = Tw2VertexDeclaration.Type.TANGENT;
                break;

            case Tw2ParticleElementDeclaration.Type.POSITION:
                usage = Tw2VertexDeclaration.Type.POSITION;
                break;

            case Tw2ParticleElementDeclaration.Type.VELOCITY:
                usage = Tw2VertexDeclaration.Type.NORMAL;
                break;

            case Tw2ParticleElementDeclaration.Type.MASS:
                usage = Tw2VertexDeclaration.Type.BINORMAL;
                break;

            default:
                usage = Tw2VertexDeclaration.Type.TEXCOORD;
        }

        return new Tw2VertexElement(usage, this.usageIndex, device.gl.FLOAT, this.GetDimension());
    }
}

/**
 * Particle element declaration types
 * @type {{LIFETIME: number, POSITION: number, VELOCITY: number, MASS: number, CUSTOM: number}}
 */
Tw2ParticleElementDeclaration.Type = {
    LIFETIME: 0,
    POSITION: 1,
    VELOCITY: 2,
    MASS: 3,
    CUSTOM: 4
};
