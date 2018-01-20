import {mat4} from '../math';

/**
 * Contains transform information for Boosters, Turrets and XLTurrets
 * @property {string} name
 * @property {mat4} transform
 * @constructor
 */
export function EveLocator()
{
    this.name = '';
    this.transform = mat4.create();
}
