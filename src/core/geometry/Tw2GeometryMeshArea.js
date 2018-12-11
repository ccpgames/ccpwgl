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

    name = '';
    start = 0;
    count = 0;
    minBounds = vec3.create();
    maxBounds = vec3.create();
    boundsSpherePosition = vec3.create();
    boundsSphereRadius = 0;

}
