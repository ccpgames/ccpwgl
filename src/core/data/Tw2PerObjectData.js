import {device} from '../Tw2Device';
import {Tw2RawData} from './Tw2RawData';


/**
 * Tw2PerObjectData
 *
 * @param {{}} [declarations]
 * @param {Tw2RawData} [decl.VSData]
 * @param {Tw2RawData} [decl.PSData]
 * @property {?Tw2RawData} perObjectVSData - Per object vertex shader data
 * @property {?Tw2RawData} perObjectPSData - Per object pixel shader data
 * @class
 */
export class Tw2PerObjectData
{
    constructor(declarations, skipCreate)
    {
        this.perObjectVSData = null;
        this.perObjectPSData = null;

        if (declarations)
        {
            this.DeclareFromObject(declarations, skipCreate);
        }
    }

    /**
     * Sets per object data to the device
     * @param constantBufferHandles
     */
    SetPerObjectDataToDevice(constantBufferHandles)
    {
        if (this.perObjectVSData && constantBufferHandles[3])
        {
            device.gl.uniform4fv(constantBufferHandles[3], this.perObjectVSData.data);
        }

        if (this.perObjectPSData && constantBufferHandles[4])
        {
            device.gl.uniform4fv(constantBufferHandles[4], this.perObjectPSData.data);
        }
    }

    /**
     * Declares raw data from an object
     * @param {{}} declarations
     * @param {{}} [declarations.VSData]
     * @param {{}} [declarations.PSData]
     * @param {boolean} [skipCreate]
     */
    DeclareFromObject(declarations, skipCreate)
    {
        if (declarations.VSData)
        {
            this.perObjectVSData = new Tw2RawData(declarations.VSData, skipCreate);
        }

        if (declarations.PSData)
        {
            this.perObjectPSData = new Tw2RawData(declarations.PSData, skipCreate);
        }
    }
}
