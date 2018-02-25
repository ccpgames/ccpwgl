import {device} from '../Tw2Device';
import {Tw2PerObjectData} from './Tw2PerObjectData';
import {Tw2RawData} from './Tw2RawData';

/**
 * Tw2BasicPerObjectData/EveBasicPerObjectData
 *
 * @property {{}} [declarations]
 * @param {boolean} [skipCreate]
 * @property {Tw2RawData} [decl.FFEData]
 * @parameter {?Tw2RawData} perObjectFFEData - Fixed Function Emulation data
 * @class
 */
export class Tw2BasicPerObjectData extends Tw2PerObjectData
{
    constructor(declarations, skipCreate)
    {
        super();
        this.perObjectFFEData = null;

        if (declarations) this.DeclareFromObject(declarations, skipCreate);
    }

    /**
     * Sets per object data to the device
     * @param constantBufferHandles
     */
    SetPerObjectDataToDevice(constantBufferHandles)
    {
        super.SetPerObjectDataToDevice(constantBufferHandles);

        if (this.perObjectFFEData && constantBufferHandles[5])
        {
            device.gl.uniform4fv(constantBufferHandles[5], this.perObjectFFEData.data);
        }
    }

    /**
     * Declares raw data from an object
     * @param {{}} declarations
     * @param {{}} [declarations.VSData]
     * @param {{}} [declarations.PSData]
     * @param {{}} [declarations.FFEData}
     * @param {boolean} [skipCreate]
     */
    DeclareFromObject(declarations, skipCreate)
    {
        super.DeclareFromObject(declarations, skipCreate);

        if (declarations.FFEData)
        {
            this.perObjectFFEData = new Tw2RawData(declarations.FFEData, skipCreate);
        }
    }
}