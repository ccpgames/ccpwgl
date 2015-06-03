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
        this.instanceGeometryResource.RegisterNotification(this);
    }
    else
    {
        if (this.instanceGeometryResource && this.geometryResource)
        {
            this.geometryResource.SetInstanceCount(this.instanceGeometryResource.GetMaxInstanceCount(this.instanceMeshIndex));
        }
    }
};

Tw2InstancedMesh.prototype.RebuildCachedData = function (res)
{
    if (this.instanceGeometryResource && this.geometryResource)
    {
        this.geometryResource.SetInstanceCount(this.instanceGeometryResource.GetMaxInstanceCount(this.instanceMeshIndex));
    }
};

Tw2InstancedMesh.prototype._GetAreaBatches = function (areas, mode, accumulator, perObjectData)
{
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

Tw2InstancedMesh.prototype.RenderAreas = function (effect)
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
        if (this.instanceGeometryResource.GetMaxInstanceCount(this.instanceMeshIndex) > this.geometryResource.GetInstanceCount()) {
            this.geometryResource.SetInstanceCount(this.instanceGeometryResource.GetMaxInstanceCount(this.instanceMeshIndex));
        }
        if (!this.geometryResource.IsGood())
        {
            return;
        }
        this.instanceGeometryResource.Render(effect, this.geometryResource.meshes[0].buffer, this.geometryResource.meshes[0].indexes, this.geometryResource.meshes[0].declaration, this.geometryResource.meshes[0].declaration.stride);
    }
};

function Tw2InstancedMeshBatch()
{
    this._super.constructor.call(this);
    this.instanceMesh = null;
}

Inherit(Tw2InstancedMeshBatch, Tw2RenderBatch);

Tw2InstancedMeshBatch.prototype.Commit = function (overrideEffect)
{
    var effect = typeof (overrideEffect) == 'undefined' ? this.effect : overrideEffect;
    if (this.instanceMesh && effect)
    {
        this.instanceMesh.RenderAreas(effect);
    }
};
