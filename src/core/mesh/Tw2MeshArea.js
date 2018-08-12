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
    constructor()
    {
        this._id = util.generateID();
        this.name = '';
        this.effect = null;
        this.meshIndex = 0;
        this.index = 0;
        this.count = 1;
        this.display = true;
    }
}

/**
 * Render Batch Constructor
 * @type {Tw2RenderBatch}
 */
Tw2MeshArea.batchType = Tw2GeometryBatch;