import {vec3, quat, mat4} from '../../math';
import {Tw2PerObjectData} from '../../core';
import {EveObject} from './EveObject';

/**
 * EveEffectRoot root objects for FX, can be put into scene's objects array
 *
 * @property {string} name
 * @property {boolean} display
 * @property {[{}]} curveSets
 * @property {[{}]} effectChildren
 * @property {vec3} scaling
 * @property {quat} rotation
 * @property {vec3} translation
 * @property {mat4} localTransform
 * @property {mat4} rotationTransform
 * @property {vec3} boundingSphereCenter
 * @property {number} boundingSphereRadius
 * @property {number} duration
 * @property {Tw2PerObjectData} _perObjectData
 * @class
 */
export class EveEffectRoot extends EveObject
{
    constructor()
    {
        super();
        this.curveSets = [];
        this.effectChildren = [];
        this.duration = 0;
        this.scaling = vec3.fromValues(1, 1, 1);
        this.rotation = quat.create();
        this.translation = vec3.create();
        this.localTransform = mat4.create();
        this.rotationTransform = mat4.create();
        this.boundingSphereCenter = vec3.create();
        this.boundingSphereRadius = 0;
        this._perObjectData = new Tw2PerObjectData(EveEffectRoot.perObjectDataDecl);
    }

    /**
     * Gets effect root res objects
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2EffectRes|Tw2TextureRes>} [out]
     */
    GetResources(out = [])
    {
        for (let i = 0; i < this.effectChildren.length; ++i)
        {
            this.effectChildren[i].GetResources(out);
        }
        return out;
    }

    /**
     * Internal per frame update
     * @param {number} dt - Delta Time
     */
    Update(dt)
    {
        quat.normalize(this.rotation, this.rotation); // Don't really need to normalize...
        mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);

        for (let i = 0; i < this.curveSets.length; ++i)
        {
            this.curveSets[i].Update(dt);
        }

        for (let i = 0; i < this.effectChildren.length; ++i)
        {
            this.effectChildren[i].Update(dt, this.localTransform);
        }
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    GetBatches(mode, accumulator)
    {
        if (!this.display) return;

        for (let i = 0; i < this.effectChildren.length; ++i)
        {
            this.effectChildren[i].GetBatches(mode, accumulator, this._perObjectData);
        }
    }

    /**
     * Starts playing the effectRoot's curveSets if they exist
     */
    Start()
    {
        for (let i = 0; i < this.curveSets.length; ++i)
        {
            this.curveSets[i].Play();
        }
    }

    /**
     * Stops the effectRoot's curveSets from playing
     */
    Stop()
    {
        for (let i = 0; i < this.curveSets.length; ++i)
        {
            this.curveSets[i].Stop();
        }
    }
}

/**
 * Per object data declarations
 * @type {{VSData: *[], PSData: *[]}}
 */
EveEffectRoot.perObjectDataDecl = {
    VSData: [
        {name: 'WorldMat', size: 16},
        {name: 'WorldMatLast', size: 16},
        {name: 'Shipdata', size: 4},
        {name: 'Clipdata1', size: 4},
        {name: 'EllipsoidRadii', size: 4},
        {name: 'EllipsoidCenter', size: 4},
        {name: 'CustomMaskMatrix0', size: 16},
        {name: 'CustomMaskMatrix1', size: 16},
        {name: 'CustomMaskData0', size: 4},
        {name: 'CustomMaskData1', size: 4},
        {name: 'JointMat', size: 696}
    ],
    PSData: [
        {name: 'Shipdata', size: 4},
        {name: 'Clipdata1', size: 4},
        {name: 'Clipdata2', size: 4},
        {name: 'ShLighting', size: 4 * 7},
        {name: 'CustomMaskMaterialID0', size: 4},
        {name: 'CustomMaskMaterialID1', size: 4},
        {name: 'CustomMaskTarget0', size: 4},
        {name: 'CustomMaskTarget1', size: 4}
    ]
};
