import {mat4} from '../../math';
import {Tw2PerObjectData, Tw2BasicPerObjectData, Tw2RawData} from '../../core';
import {EveChild} from './EveChild';

/**
 * Mesh attachment to space object
 *
 * @property {boolean} useSpaceObjectData
 * @property {Tw2Mesh|Tw2InstancedMesh} mesh
 * @class
 */
export class EveChildMesh extends EveChild
{
    constructor()
    {
        super();
        this.useSpaceObjectData = true;
        this.mesh = null;
    }

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
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (!this.display || !this.mesh) return;

        if (this.useSpaceObjectData)
        {
            if (!this._perObjectData)
            {
                this._perObjectData = new Tw2PerObjectData();

                this._perObjectData.perObjectVSData = new Tw2RawData();
                this._perObjectData.perObjectVSData.data = new Float32Array(perObjectData.perObjectVSData.data.length);
                this._perObjectData.perObjectVSData.data[33] = 1;
                this._perObjectData.perObjectVSData.data[35] = 1;

                this._perObjectData.perObjectPSData = new Tw2RawData();
                this._perObjectData.perObjectPSData.data = new Float32Array(perObjectData.perObjectPSData.data.length);
                this._perObjectData.perObjectPSData.data[1] = 1;
                this._perObjectData.perObjectPSData.data[3] = 1;
            }
            
            this._perObjectData.perObjectVSData.data.set(perObjectData.perObjectVSData.data);
            this._perObjectData.perObjectPSData.data.set(perObjectData.perObjectPSData.data);

            mat4.transpose(this._perObjectData.perObjectVSData.data, this.worldTransform);
            mat4.transpose(this._perObjectData.perObjectVSData.data.subarray(16), this.worldTransformLast);
        }
        else
        {
            if (!this._perObjectData)
            {
                this._perObjectData = new Tw2BasicPerObjectData(EveChild.perObjectDataDecl);
            }
            
            mat4.transpose(this._perObjectData.perObjectFFEData.Get('world'), this.worldTransform);
            mat4.invert(this._perObjectData.perObjectFFEData.Get('worldInverseTranspose'), this.worldTransform);
        }

        this.mesh.GetBatches(mode, accumulator, this._perObjectData);
    }
}