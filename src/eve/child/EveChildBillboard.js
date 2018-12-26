import {vec3, mat4, device} from '../../global';
import {Tw2BasicPerObjectData} from '../../core';
import {EveChild} from './EveChild';

/**
 * Mesh attachment to space object and oriented towards the camera
 *
 * @property {Tw2Mesh|Tw2InstancedMesh} mesh
 * @property {Tw2BasicPerObjectData} _perObjectData
 * @class
 */
export class EveChildBillboard extends EveChild
{

    mesh = null;
    _perObjectData = new Tw2BasicPerObjectData(EveChild.perObjectData);


    /**
     * Gets the child's resources
     * @param {Array} [out=[]]
     * @returns {Array.<Tw2Resource>} out
     */
    GetResources(out)
    {
        if (this.mesh) this.mesh.GetResources(out);
        return out;
    }

    /**
     * Per frame update
     * @param {number} dt
     * @param {mat4} parentTransform
     */
    Update(dt, parentTransform)
    {
        super.Update(dt, parentTransform);

        const
            viewInverse = EveChild.global.mat4_0,
            finalScale = EveChild.global.vec3_0;

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
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    GetBatches(mode, accumulator)
    {
        if (this.display && this.mesh)
        {
            mat4.transpose(this._perObjectData.perObjectFFEData.Get('world'), this.worldTransform);
            mat4.invert(this._perObjectData.perObjectFFEData.Get('worldInverseTranspose'), this.worldTransform);
            this.mesh.GetBatches(mode, accumulator, this._perObjectData);
        }
    }

}