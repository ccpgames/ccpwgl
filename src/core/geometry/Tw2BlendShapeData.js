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

    name = '';
    declaration = new Tw2VertexDeclaration();
    buffers = [];
    indexes = null;
    weightProxy = null;

}