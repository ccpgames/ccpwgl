import {mat4} from '../../math';

/**
 * Contains transform information for Boosters, Turrets and XLTurrets
 *
 * @property {string} name
 * @property {?number} atlasIndex0
 * @property {?number} atlasIndex1
 * @property {mat4} transform
 * @class
 */
export class EveLocator
{
    constructor()
    {
        this.name = '';
        this.atlasIndex0 = null;
        this.atlasIndex1 = null;
        this.transform = mat4.create();
    }
}
