function Tw2SkinnedObject()
{
    this.name = '';
    this.meshes = [];
    this.animationResPath = '';
    this._animationRes = null;
    
    this.transform = mat4.create();
    mat4.identity(this.transform);

    this._perObjectData = [];

    
    this.animation = new Tw2AnimationController();
}

Tw2SkinnedObject.prototype.Initialize = function ()
{
    if (this.animationResPath != '')
    {
        this._animationRes = resMan.GetResource(this.animationResPath);
        this.animation.SetGeometryResource(this._animationRes);
    }
    for (var i = 0; i < this.meshes.length; ++i)
    {
        this.animation.AddGeometryResource(this.meshes[i].geometryResource);
        this._perObjectData[i] = new Tw2PerObjectData();
        this._perObjectData[i].perObjectVSData = new Tw2RawData();
        this._perObjectData[i].perObjectVSData.Declare('WorldMat', 16);
        this._perObjectData[i].perObjectVSData.Declare('JointMat', 1040);
        this._perObjectData[i].perObjectVSData.Create();

        this._perObjectData[i].perObjectPSData = new Tw2RawData();
        this._perObjectData[i].perObjectPSData.Declare('Shipdata', 4);
        this._perObjectData[i].perObjectPSData.Create();
        mat4.transpose(this.transform, this._perObjectData[i].perObjectVSData.Get('WorldMat'));
    }
};

Tw2SkinnedObject.prototype.GetBatches = function (mode, accumulator)
{
    for (var i = 0; i < this.meshes.length; ++i)
    {
        //mat4.transpose(this.transform, this._perObjectData[i].perObjectVSData.Get('WorldMat'));
        this._perObjectData[i].perObjectVSData.Set('JointMat', this.animation.GetBoneMatrixes(this.meshes[i].meshIndex, this.meshes[i].geometryResource));
        this.meshes[i].GetBatches(mode, accumulator, this._perObjectData[i]);
    }
};

Tw2SkinnedObject.prototype.Update = function (dt)
{
    this.animation.Update(dt);
};

Tw2SkinnedObject.prototype.RenderDebugInfo = function (debugHelper)
{
    this.animation.RenderDebugInfo(debugHelper);
};

Tw2SkinnedObject.prototype.ResetBlendShapes = function ()
{
    if (!this.meshes.length)
    {
        return;
    }
    if (!this.meshes[0].geometryResource || !this.meshes[0].geometryResource.IsGood())
    {
        return;
    }

    for (var m = 0; m < this.meshes[0].geometryResource.meshes.length; ++m)
    {
        var mesh = this.meshes[0].geometryResource.meshes[m];

        if (mesh.initialData)
        {
            for (var i = 0; i < mesh.initialData.length; ++i)
            {
                mesh.bufferData[i] = mesh.initialData[i];
            }
            device.gl.bindBuffer(device.gl.ARRAY_BUFFER, mesh.buffer);
            device.gl.bufferSubData(device.gl.ARRAY_BUFFER, 0, mesh.bufferData);
        }
    }
};

Tw2SkinnedObject.prototype.ApplyBlendShapes = function ()
{
    if (!this.meshes.length)
    {
        return;
    }
    if (!this.meshes[0].geometryResource || !this.meshes[0].geometryResource.IsGood())
    {
        return;
    }

    for (var m = 0; m < this.meshes[0].geometryResource.meshes.length; ++m)
    {
        var mesh = this.meshes[0].geometryResource.meshes[m];
        var positionIndex = mesh.declaration.FindUsage(Tw2VertexDeclaration.DECL_POSITION, 0);
        var normalIndex = mesh.declaration.FindUsage(Tw2VertexDeclaration.DECL_NORMAL, 0);
        var positionOffset = positionIndex.offset / 4;
        var normalOffset = normalIndex.offset / 4;
        var stride = mesh.declaration.stride / 4;

        if (!mesh.initialData)
        {
            mesh.initialData = new Float32Array(mesh.bufferData);
        }
        else
        {
            for (var i = 0; i < mesh.initialData.length; ++i)
            {
                mesh.bufferData[i] = mesh.initialData[i];
            }
        }
        for (var i = 0; i < mesh.blendShapes.length; ++i)
        {
            var shape = mesh.blendShapes[i];
            if (shape.weightProxy == null || shape.weightProxy.weight == 0 || shape.indexes == null)
            {
                continue;
            }
            var weight = shape.weightProxy.weight;
            // This code has some assumptions about blend shape data layout
            for (var j = 0; j < shape.indexes.length; ++j)
            {
                var index = shape.indexes[j];
                mesh.bufferData[index * stride + positionOffset] += weight * shape.buffer[j * 6];
                mesh.bufferData[index * stride + positionOffset + 1] += weight * shape.buffer[j * 6 + 1];
                mesh.bufferData[index * stride + positionOffset + 2] += weight * shape.buffer[j * 6 + 2];
                mesh.bufferData[index * stride + normalOffset] += weight * shape.buffer[j * 6 + 3];
                mesh.bufferData[index * stride + normalOffset + 1] += weight * shape.buffer[j * 6 + 4];
                mesh.bufferData[index * stride + normalOffset + 2] += weight * shape.buffer[j * 6 + 5];
            }
        }
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, mesh.buffer);
        device.gl.bufferSubData(device.gl.ARRAY_BUFFER, 0, mesh.bufferData);
    }
};

