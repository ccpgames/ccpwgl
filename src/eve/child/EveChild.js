/* eslint no-unused-vars:0 */
import {vec3, quat, mat4, util} from '../../global';

/**
 * EveChild base class
 *
 * @property {number|string} _id
 * @property {string} name
 * @property {boolean} display
 * @property {boolean} useSRT
 * @property {number} lowestLodVisible
 * @property {boolean} staticTransform
 * @property {quat} rotation
 * @property {vec3} translation
 * @property {vec3} scaling
 * @property {mat4} localTransform
 * @property {mat4} worldTransform
 * @property {mat4} worldTransformLast
 * @property {?|Tw2BasicPerObjectData|Tw2PerObjectData} _perObjectData
 * @class
 */
export class EveChild
{

    _id = util.generateID();
    name = '';
    display = true;
    useSRT = true;
    lowestLodVisible = 2;
    staticTransform = false;
    rotation = quat.create();
    translation = vec3.create();
    scaling = vec3.fromValues(1, 1, 1);
    localTransform = mat4.create();
    worldTransform = mat4.create();
    worldTransformLast = mat4.create();
    _perObjectData = null;
    isEffectChild = true;


    /**
     * Gets the child's resources
     * @param {Array} [out=[]]
     * @returns {Array<Tw2Resource>} out
     */
    GetResources(out = [])
    {
        return out;
    }

    /**
     * Per frame update
     * @param {number} dt
     * @param {mat4} parentTransform
     */
    Update(dt, parentTransform)
    {
        if (this.useSRT)
        {
            quat.normalize(this.rotation, this.rotation);
            mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);
        }

        mat4.copy(this.worldTransformLast, this.worldTransform);
        mat4.multiply(this.worldTransform, parentTransform, this.localTransform);
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     */
    GetBatches(mode, accumulator, perObjectData)
    {

    }

    /**
     * Class globals and scratch variables
     * @type {Object}
     */
    static global = {
        mat4_0: mat4.create(),
        vec3_0: vec3.create()
    };

    /**
     * Per object data
     * @type {{FFEData: *[]}}
     */
    static perObjectData = {
        FFEData: [
            ['world', 16],
            ['worldInverseTranspose', 16]
        ]
    };

}

