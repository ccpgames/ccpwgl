import {mat4} from '../math';

/**
 * Contains transform information for T3 Attachments, Boosters, Turrets and XLTurrets
 *
 * @param {string} [name='']
 * @param {mat4} [transform=mat4.create()]
 * @property {string} name
 * @property {mat4} transform
 * @property {?number} atlasIndex0
 * @property {?number} atlasIndex1
 * @property {?Tw2Bone} bone
 */
export class EveLocator
{
    constructor(name='', transform=mat4.create())
    {
        this.name = name;
        this.transform = mat4.clone(transform);
        this.atlasIndex0 = null;
        this.atlasIndex1 = null;
        this.bone = null;
    }
}
