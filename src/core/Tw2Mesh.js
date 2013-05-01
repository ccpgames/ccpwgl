function Tw2MeshArea()
{
    this.name = '';
    this.effect = null;
    this.meshIndex = 0;
    this.index = 0;
    this.count = 1;
    this.debugIsHidden = false;
}
Tw2MeshArea.batchType = Tw2GeometryBatch;

function Tw2MeshLineArea()
{
    this.name = '';
    this.effect = null;
    this.meshIndex = 0;
    this.index = 0;
    this.count = 1;
    this.debugIsHidden = false;
}
Tw2MeshLineArea.batchType = Tw2GeometryLineBatch;


function Tw2Mesh()
{
    this.name = '';
    this.meshIndex = 0;
    this.geometryResPath = '';
    this.lowDetailGeometryResPath = '';
    this.geometryResource = null;
    this.opaqueAreas = [];
    this.transparentAreas = [];
    this.transparentAreas = [];
    this.additiveAreas = [];
    this.pickableAreas = [];
    this.decalAreas = [];
    this.depthAreas = [];
    this.debugIsHidden = false;
}

Tw2Mesh.prototype.Initialize = function ()
{
    if (this.geometryResPath != '')
    {
        this.geometryResource = resMan.GetResource(this.geometryResPath);
    }
};

Tw2Mesh.prototype._GetAreaBatches = function (areas, mode, accumulator, perObjectData)
{
    for (var i = 0; i < areas.length; ++i)
    {
        var area = areas[i];
        if (area.effect == null || area.debugIsHidden)
        {
            continue;
        }
        var batch = new area.constructor.batchType();
        batch.renderMode = mode;
        batch.perObjectData = perObjectData;
        batch.geometryRes = this.geometryResource;
        batch.meshIx = area.meshIndex;
        batch.start = area.index;
        batch.count = area.count;
        batch.effect = area.effect;
        accumulator.Commit(batch);
    }
};

Tw2Mesh.prototype.GetBatches = function (mode, accumulator, perObjectData)
{
    if (this.geometryResource == null || this.debugIsHidden)
    {
        return false;
    }
    if (mode == device.RM_OPAQUE)
    {
        this._GetAreaBatches(this.opaqueAreas, mode, accumulator, perObjectData);
    }
    else if (mode == device.RM_DECAL)
    {
        this._GetAreaBatches(this.decalAreas, mode, accumulator, perObjectData);
    }
    else if (mode == device.RM_TRANSPARENT)
    {
        this._GetAreaBatches(this.transparentAreas, mode, accumulator, perObjectData);
    }
    else if (mode == device.RM_ADDITIVE)
    {
        this._GetAreaBatches(this.additiveAreas, mode, accumulator, perObjectData);
    }
    return true;
};
