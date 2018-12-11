import {Tw2GeometryBatch} from '../batch';
import {util} from '../../global';

/**
 * Tw2MeshArea
 *
 * @property {string} name
 * @property {Tw2Effect} effect
 * @property {number} meshIndex
 * @property {number} index
 * @property {number} count
 * @property {boolean} display
 * @class
 */
export class Tw2MeshArea
{

    _id = util.generateID();
    name = '';
    effect = null;
    meshIndex = 0;
    index = 0;
    count = 1;
    display = true;


    /**
     * Render Batch Constructor
     * @type {Tw2RenderBatch}
     */
    static batchType = Tw2GeometryBatch;

}