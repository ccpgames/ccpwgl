import {device} from '../core/Tw2Device';
import {Tw2PerObjectData} from '../core/Tw2PerObjectData';

/**
 * Tw2BasicPerObjectData
 *
 * @parameter perObjectFFEData - Fixed Function Emulation data
 * @class
 */
export class EveBasicPerObjectData extends Tw2PerObjectData
{
    constructor()
    {
        super();
        this.perObjectFFEData = null;
    }

    /**
     * SetPerObjectDataToDevice
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
}
