/*eslint no-unused-vars:0 */
import {EveObject} from './EveObject';
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
export class EveStarField extends EveObject
{
    constructor()
    {
        super();
        this.effect = null;
        this.maxDist = 0;
        this.maxFlashRate = 0;
        this.minFlashIntensity = 0;
        this.minFlashRate = 0;
        this.seed = 20;
    }
}