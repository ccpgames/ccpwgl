/* eslint no-unused-vars:0 */
import {mat4, util, vec3} from '../../global';

/**
 * EveObject base class
 *
 * @property {number} _id
 * @property {string} name
 * @property {boolean} display
 * @class
 */
export class EveObject
{

    _id = util.generateID();
    name = '';
    display = true;


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
    GetResources(out = [])
    {
        return out;
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

    /**
     * Global and scratch variables
     * @type {*}
     */
    static global = {
        vec3_0: vec3.create(),
        vec3_1: vec3.create(),
        vec3_2: vec3.create(),
        vec3_3: vec3.create(),
        vec3_4: vec3.create(),
        vec3_5: vec3.create(),
        vec3_6: vec3.create(),
        vec3_7: vec3.create(),
        mat4_0: mat4.create(),
        mat4_1: mat4.create(),
        mat4_2: mat4.create()
    };

}