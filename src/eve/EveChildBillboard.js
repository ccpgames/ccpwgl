import {vec3, quat, mat4} from '../math';
import {device} from '../core';
import {Tw2RawData} from '../core';
import {EveBasicPerObjectData} from './EveTransform';

/**
 * Mesh attachment to space object and oriented towards the camera
 * @property {string} name
 * @property {boolean} display
 * @property {Number} lowestLodVisible
 * @property {quat} rotation
 * @property {vec3} translation
 * @property {vec3} scaling
 * @property {boolean} useSRT
 * @property {boolean} staticTransform
 * @property {mat4} localTransform
 * @property {mat4} worldTransform
 * @property {mat4} worldTransformLast
 * @property {Tw2Mesh} mesh
 * @property {boolean} isEffectChild
 * @property {EveBasicPerObjectData} _perObjectData
 * @constructor
 */
export function EveChildBillboard()
{
    this.name = '';
    this.display = true;
    this.lowestLodVisible = 2;
    this.rotation = quat.create();
    this.translation = vec3.create();
    this.scaling = vec3.fromValues(1, 1, 1);
    this.useSRT = true;
    this.staticTransform = false;
    this.localTransform = mat4.create();
    this.worldTransform = mat4.create();
    this.worldTransformLast = mat4.create();
    this.mesh = null;
    this.isEffectChild = true;

    this._perObjectData = new EveBasicPerObjectData();
    this._perObjectData.perObjectFFEData = new Tw2RawData();
    this._perObjectData.perObjectFFEData.Declare('world', 16);
    this._perObjectData.perObjectFFEData.Declare('worldInverseTranspose', 16);
    this._perObjectData.perObjectFFEData.Create();
}

/**
 * Scratch variables
 */
EveChildBillboard.scratch = {
    mat4_0: mat4.create(),
    vec3_0: vec3.create()
};

/**
 * Updates mesh transform
 * @param {mat4} parentTransform
 */
EveChildBillboard.prototype.Update = function(parentTransform)
{
    var viewInverse = EveChildBillboard.scratch.mat4_0,
        finalScale = EveChildBillboard.scratch.vec3_0;

    if (this.useSRT)
    {
        quat.normalize(this.rotation, this.rotation);
        mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);
    }

    mat4.copy(this.worldTransformLast, this.worldTransform);
    mat4.multiply(this.worldTransform, parentTransform, this.localTransform);

    mat4.lookAt(viewInverse, device.eyePosition, this.worldTransform.subarray(12), [0, 1, 0]);
    mat4.transpose(viewInverse, viewInverse);
    mat4.getScaling(finalScale, parentTransform);
    vec3.multiply(finalScale, finalScale, this.scaling);

    this.worldTransform[0] = viewInverse[0] * finalScale[0];
    this.worldTransform[1] = viewInverse[1] * finalScale[0];
    this.worldTransform[2] = viewInverse[2] * finalScale[0];
    this.worldTransform[4] = viewInverse[4] * finalScale[1];
    this.worldTransform[5] = viewInverse[5] * finalScale[1];
    this.worldTransform[6] = viewInverse[6] * finalScale[1];
    this.worldTransform[8] = viewInverse[8] * finalScale[2];
    this.worldTransform[9] = viewInverse[9] * finalScale[2];
    this.worldTransform[10] = viewInverse[10] * finalScale[2];
};


/**
 * Gets render batches
 * @param {number} mode
 * @param {Tw2BatchAccumulator} accumulator
 */
EveChildBillboard.prototype.GetBatches = function(mode, accumulator)
{
    if (!this.display || !this.mesh)
    {
        return;
    }
    mat4.transpose(this._perObjectData.perObjectFFEData.Get('world'), this.worldTransform);
    mat4.invert(this._perObjectData.perObjectFFEData.Get('worldInverseTranspose'), this.worldTransform);
    this.mesh.GetBatches(mode, accumulator, this._perObjectData);
};


/**
 * Gets child mesh res objects
 * @param {Array} [out=[]] - Optional receiving array
 * @returns {Array.<Tw2EffectRes|Tw2TextureRes|Tw2GeometryRes>} [out]
 */
EveChildBillboard.prototype.GetResources = function(out)
{
    if (out === undefined)
    {
        out = [];
    }

    if (this.mesh !== null)
    {
        this.mesh.GetResources(out);
    }

    return out;
};
