function Tw2InstancedMesh()
{
    this._super.constructor.call(this);
    this.instanceGeometryResource = null;
    this.instanceGeometryResPath = '';
    this.instanceMeshIndex = 0;
    this.minBounds = vec3.create();
    this.maxBounds = vec3.create();
}

Inherit(Tw2InstancedMesh, Tw2Mesh);

Tw2InstancedMesh.prototype.Initialize = function ()
{
    this._super.Initialize.call(this);
    if (this.instanceGeometryResPath != '')
    {
        this.instanceGeometryResource = resMan.GetResource(this.instanceGeometryResPath);
    }
};

Tw2InstancedMesh.prototype._GetAreaBatches = function (areas, mode, accumulator, perObjectData)
{
    if (!device.instancedArrays) {
        return;
    }
    for (var i = 0; i < areas.length; ++i)
    {
        var area = areas[i];
        if (area.effect == null || area.debugIsHidden)
        {
            continue;
        }
        var batch = new Tw2InstancedMeshBatch();
        batch.renderMode = mode;
        batch.perObjectData = perObjectData;
        batch.instanceMesh = this;
        batch.meshIx = area.meshIndex;
        batch.start = area.index;
        batch.count = area.count;
        batch.effect = area.effect;
        accumulator.Commit(batch);
    }
};

Tw2InstancedMesh.prototype.RenderAreas = function (meshIx, start, count, effect)
{
    if (this.geometryResource)
    {
        this.geometryResource.KeepAlive();
    }
    if (this.instanceGeometryResource && this.instanceGeometryResource.KeepAlive)
    {
        this.instanceGeometryResource.KeepAlive();
    }
    if (this.geometryResource && this.instanceGeometryResource)
    {
        if (!this.geometryResource.IsGood())
        {
            return;
        }
        var buffer = this.instanceGeometryResource.GetInstanceBuffer(this.instanceMeshIndex);
        if (buffer) {
            this.geometryResource.RenderAreasInstanced(meshIx, start, count, effect,
                buffer,
                this.instanceGeometryResource.GetInstanceDeclaration(this.instanceMeshIndex),
                this.instanceGeometryResource.GetInstanceStride(this.instanceMeshIndex),
                this.instanceGeometryResource.GetInstanceCount(this.instanceMeshIndex));
        }
    }
};

function Tw2InstancedMeshBatch()
{
    this._super.constructor.call(this);
    this.instanceMesh = null;
    this.geometryRes = null;
    this.meshIx = 0;
    this.start = 0;
    this.count = 1;
    this.effect = null;
}

Inherit(Tw2InstancedMeshBatch, Tw2RenderBatch);

Tw2InstancedMeshBatch.prototype.Commit = function (overrideEffect)
{
    var effect = typeof (overrideEffect) == 'undefined' ? this.effect : overrideEffect;
    if (this.instanceMesh && effect)
    {
        this.instanceMesh.RenderAreas(this.meshIx, this.start, this.count, effect);
    }
};
