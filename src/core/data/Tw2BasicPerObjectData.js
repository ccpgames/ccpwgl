import {device} from '../../global';
import {Tw2PerObjectData} from './Tw2PerObjectData';
import {Tw2RawData} from './Tw2RawData';

/**
 * Tw2BasicPerObjectData
 *
 * @parameter {?Tw2RawData} perObjectFFEData - Fixed Function Emulation data
 * @class
 */
export class Tw2BasicPerObjectData extends Tw2PerObjectData
{

    perObjectFFEData = null;


    /**
     * Constructor
     * @param {RawDataObject} [rawDataObject] - An optional object containing raw data declarations
     */
    constructor(rawDataObject)
    {
        super();
        if (rawDataObject) this.DeclareFromObject(rawDataObject);
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
     * Defines and creates raw data from an object
     * @param {RawDataObject} rawDataObject
     */
    DeclareFromObject(rawDataObject = {})
    {
        super.DeclareFromObject(rawDataObject);

        if (rawDataObject.FFEData)
        {
            this.perObjectFFEData = new Tw2RawData(rawDataObject.FFEData);
        }
    }

}

export {Tw2BasicPerObjectData as EveBasicPerObjectData};