import {util} from '../../global';

/**
 * EveStarField - not implemented yet
 *
 * @property {string|number} _id
 * @property {string} name
 * @property {boolean} display
 * @property {Tw2Effect} effect
 * @property {number} maxDist
 * @property {number} maxFlashRate
 * @property {number} minFlashIntensity
 * @property {number} minFlashRate
 * @property {number} seed
 */
export class EveStarField
{
    constructor()
    {
        this._id = util.generateID();
        this.name = '';
        this.display = true;
        this.effect = null;
        this.maxDist = 0;
        this.maxFlashRate = 0;
        this.minFlashIntensity = 0;
        this.minFlashRate = 0;
        this.seed = 20;
    }

    /**
     * Identifies that the object is not yet fully implemented
     * @type {boolean}
     */
    static partialImplementation = true;
}