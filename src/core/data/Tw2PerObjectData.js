import {device} from '../../global';
import {Tw2RawData} from './Tw2RawData';

/**
 * Tw2PerObjectData
 *
 * @param {RawDataObject} [rawDataObject]
 * @property {?Tw2RawData} perObjectVSData - Per object vertex shader data
 * @property {?Tw2RawData} perObjectPSData - Per object pixel shader data
 * @class
 */
export class Tw2PerObjectData
{
    constructor(rawDataObject)
    {
        this.perObjectVSData = null;
        this.perObjectPSData = null;

        if (rawDataObject)
        {
            this.DeclareFromObject(rawDataObject);
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
     * Defines and creates raw data from an object
     * @param {RawDataObject} rawDataObject
     */
    DeclareFromObject(rawDataObject = {})
    {
        if (rawDataObject.VSData)
        {
            this.perObjectVSData = new Tw2RawData(rawDataObject.VSData);
        }

        if (rawDataObject.PSData)
        {
            this.perObjectPSData = new Tw2RawData(rawDataObject.PSData);
        }
    }
}
