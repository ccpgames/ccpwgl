import {Tw2GeometryLineBatch} from '../batch';
import {Tw2MeshArea} from './Tw2MeshArea';

/**
 * Tw2MeshLineArea
 *
 * @class
 */
export class Tw2MeshLineArea extends Tw2MeshArea
{

    /**
     * Render Batch Constructor
     * @type {Tw2RenderBatch}
     */
    static batchType = Tw2GeometryLineBatch;

}

