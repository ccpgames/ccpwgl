import {mat4} from '../../global';

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

    boneRes = null;
    localTransform = mat4.create();
    worldTransform = mat4.create();
    offsetTransform = mat4.create();

}