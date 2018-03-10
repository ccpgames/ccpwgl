import {device} from '../global';

/**
 * Tw2PerObjectData
 *
 * @parameter {?Tw2RawData} perObjectVSData - Vertex shader data
 * @parameter {?Tw2RawData} perObjectPSData - Pixel shader data
 * @class
 */
export class Tw2PerObjectData
{
    constructor()
    {
        this.perObjectVSData = null;
        this.perObjectPSData = null;
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
}