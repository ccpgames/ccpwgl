import {mat4} from '../../math';

/**
 * Tw2Bone
 *
 * @property {Tw2GeometryBone} boneRes
 * @property {mat4} localTransform
 * @property {mat4} worldTransform
 * @property {mat4} offsetTransform
 * @class
 */
export class Tw2Bone
{
    constructor()
    {
        this.boneRes = null;
        this.localTransform = mat4.create();
        this.worldTransform = mat4.create();
        this.offsetTransform = mat4.create();
    }
}