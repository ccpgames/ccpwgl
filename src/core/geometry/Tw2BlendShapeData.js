import {Tw2VertexDeclaration} from '../vertex';

/**
 * Tw2BlendShapeData
 *
 * @property {String} name
 * @property {Tw2VertexDeclaration} declaration
 * @property {Array} buffers
 * @property indexes
 * @property weightProxy
 */
export class Tw2BlendShapeData
{
    constructor()
    {
        this.name = '';
        this.declaration = new Tw2VertexDeclaration();
        this.buffers = [];
        this.indexes = null;
        this.weightProxy = null;
    }
}