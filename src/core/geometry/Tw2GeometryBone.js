import {mat3, mat4, quat, vec3} from '../../math';

/**
 * Tw2GeometryBone
 *
 * @property {string} name
 * @property {number} parentIndex
 * @property {vec3} position
 * @property {quat} orientation
 * @property {mat3} scaleShear
 * @property {mat4} localTransform
 * @property {mat4} worldTransform
 * @property {mat4} worldTransformInv
 */
export class Tw2GeometryBone
{
    constructor()
    {
        this.name = '';
        this.parentIndex = -1;
        this.position = vec3.create();
        this.orientation = quat.create();
        this.scaleShear = mat3.create();
        this.localTransform = mat4.create();
        this.worldTransform = mat4.create();
        this.worldTransformInv = mat4.create();
    }

    /**
     * Updates the Bone's transform
     * @returns {mat4}
     */
    UpdateTransform()
    {
        mat4.fromMat3(this.localTransform, this.scaleShear);
        quat.normalize(this.orientation, this.orientation);
        let rm = mat4.fromQuat(Tw2GeometryBone.global.mat4_0, this.orientation);
        mat4.multiply(this.localTransform, this.localTransform, rm);
        this.localTransform[12] = this.position[0];
        this.localTransform[13] = this.position[1];
        this.localTransform[14] = this.position[2];
        return this.localTransform;
    }
}

/**
 * Class global variables and scratch
 */
Tw2GeometryBone.global = {
    mat4_0: mat4.create()
};
