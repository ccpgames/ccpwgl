import {vec3} from '../../global';
import {Tw2VertexDeclaration} from '../vertex';

/**
 * Tw2GeometryMesh
 *
 * @property {string} name
 * @property {Tw2VertexDeclaration} declaration
 * @property {Array.<Tw2GeometryMeshArea>} areas
 * @property {WebGLBuffer} buffer
 * @property {number} bufferLength
 * @property bufferData
 * @property {WebGLBuffer} indexes
 * @property indexData
 * @property {number} indexType
 * @property {vec3} minBounds
 * @property {vec3} maxBounds
 * @property {vec3} boundsSpherePosition
 * @property {number} boundsSphereRadius
 * @property {Array} bones
 * @property {Array.<string>} boneBindings
 */
export class Tw2GeometryMesh
{
    constructor()
    {
        this.name = '';
        this.declaration = new Tw2VertexDeclaration();
        this.areas = [];
        this.buffer = null;
        this.bufferLength = 0;
        this.bufferData = null;
        this.indexes = null;
        this.indexData = null;
        this.indexType = 0;
        this.minBounds = vec3.create();
        this.maxBounds = vec3.create();
        this.boundsSpherePosition = vec3.create();
        this.boundsSphereRadius = 0;
        this.bones = [];
        this.boneBindings = [];
    }
}