/* eslint no-unused-vars:0 */
import {mat4, util, vec3} from '../../math';

/**
 * EveObject base class
 * Todo: Normalize transforms, use get/set for compatibility
 *
 * @property {number} _id
 * @property {string} name
 * @property {boolean} display
 * @class
 */
export class EveObject
{
    constructor()
    {
        this._id = util.generateID();
        this.name = '';
        this.display = true;
    }

    /**
     * Initializes the object
     */
    Initialize()
    {

    }

    /**
     * Gets object resources
     * @param {Array} [out=[]]
     * @returns {Array<Tw2Resource>} out
     */
    GetResources(out=[])
    {
        return out;
    }

    /**
     * Update view dependant data
     */
    UpdateViewDependantData()
    {

    }

    /**
     * Per frame update
     * @param {number} dt - delta time
     */
    Update(dt)
    {

    }

    /**
     * Accumulates batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    GetBatches(mode, accumulator)
    {

    }
}

/**
 * Class global and scratch variables
 * @type {{string:*}}
 */
EveObject.global = null;