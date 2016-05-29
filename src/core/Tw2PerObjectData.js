/**
 * Tw2PerObjectData
 * @property {Tw2RawData} perObjectVSData
 * @property {Tw2RawData} perObjectPSData
 * @constructor
 */
function Tw2PerObjectData()
{
    this.perObjectVSData = null;
    this.perObjectPSData = null;
}

/**
 * SetPerObjectDataToDevice
 * @param constantBufferHandles
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
