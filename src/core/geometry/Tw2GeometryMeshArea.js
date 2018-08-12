import {vec3} from '../../global';

/**
 * Tw2GeometryMeshArea
 *
 * @property {string} name
 * @property {number} start
 * @property {number} count
 * @property {vec3} minBounds
 * @property {vec3} maxBounds
 * @property {vec3} boundsSpherePosition
 * @property {number} boundsSphereRadius
 */
export class Tw2GeometryMeshArea
{
    constructor()
    {
        this.name = '';
        this.start = 0;
        this.count = 0;
        this.minBounds = vec3.create();
        this.maxBounds = vec3.create();
        this.boundsSpherePosition = vec3.create();
        this.boundsSphereRadius = 0;
    }
}
