/**
 * Tw2PerObjectData
 * TODO: Identify if @property perObjectVSData and @property perObjectPSData should be defined here
 * @constructor
 */
function Tw2PerObjectData()
{}

/**
 * SetPerObjectDataToDevice
 * @param constantBufferHandles
 * @constructor
 */
Tw2PerObjectData.prototype.SetPerObjectDataToDevice = function(constantBufferHandles)
{
    if (this.perObjectVSData && constantBufferHandles[3])
    {
        device.gl.uniform4fv(constantBufferHandles[3], this.perObjectVSData.data);
    }
    if (this.perObjectPSData && constantBufferHandles[4])
    {
        device.gl.uniform4fv(constantBufferHandles[4], this.perObjectPSData.data);
    }
};
