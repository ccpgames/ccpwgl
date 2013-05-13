function EveSpaceObjectDecal()
{
    this.display = true;
    this.decalEffect = null;
    this.name = '';
    
    this.decalGeometryPath = '';
    this.decalIndex = 0;
    this.decalGeometry = null;
    
    this.position = vec3.create();
    this.rotation = quat4.create();
    this.scaling = vec3.create();
    
    this.decalMatrix = mat4.create();
    this.invDecalMatrix = mat4.create();
    this.parentGeometry = null;
    
    this._perObjectData = new Tw2PerObjectData();
    this._perObjectData.perObjectVSData = new Tw2RawData();
    this._perObjectData.perObjectVSData.Declare('worldMatrix', 16);
    this._perObjectData.perObjectVSData.Declare('invWorldMatrix', 16);
    this._perObjectData.perObjectVSData.Declare('decalMatrix', 16);
    this._perObjectData.perObjectVSData.Declare('invDecalMatrix', 16);
    this._perObjectData.perObjectVSData.Create();

	variableStore.RegisterType('u_DecalMatrix', Tw2MatrixParameter);
	variableStore.RegisterType('u_InvDecalMatrix', Tw2MatrixParameter);
}

EveSpaceObjectDecal.prototype.Initialize = function ()
{
    if (this.decalGeometryPath != '')
    {
        this.decalGeometry = resMan.GetResource(this.decalGeometryPath);
    }
    mat4.scale(mat4.transpose(quat4.toMat4(this.rotation, this.decalMatrix)), this.scaling);
    this.decalMatrix[12] = this.position[0];
    this.decalMatrix[13] = this.position[1];
    this.decalMatrix[14] = this.position[2];
    mat4.inverse(this.decalMatrix, this.invDecalMatrix);
};

EveSpaceObjectDecal.prototype.SetParentGeometry = function (geometryRes)
{
    this.parentGeometry = geometryRes;
};

EveSpaceObjectDecal.prototype.GetBatches = function (mode, accumulator, perObjectData)
{
    if (mode != device.RM_DECAL)
    {
        return;
    }
    if (this.display && this.decalEffect && this.parentGeometry && this.parentGeometry.IsGood() && this.decalGeometry && this.decalGeometry.IsGood())
    {
        var batch = new Tw2ForwardingRenderBatch();
        
        this._perObjectData.perObjectVSData.Set('worldMatrix', perObjectData.perObjectVSData.Get('WorldMat'));
        mat4.inverse(this._perObjectData.perObjectVSData.Get('worldMatrix'), this._perObjectData.perObjectVSData.Get('invWorldMatrix'));
        mat4.transpose(this.decalMatrix, this._perObjectData.perObjectVSData.Get('decalMatrix'));
        mat4.transpose(this.invDecalMatrix, this._perObjectData.perObjectVSData.Get('invDecalMatrix'));
        
        batch.perObjectData = this._perObjectData;
        batch.geometryProvider = this;
        batch.renderMode = device.RM_DECAL;
        accumulator.Commit(batch);
    }
};

EveSpaceObjectDecal.prototype.Render = function (batch, overrideEffect)
{
    var bkIB = this.parentGeometry.meshes[0].indexes;
    var bkStart = this.parentGeometry.meshes[0].areas[0].start;
    var bkCount = this.parentGeometry.meshes[0].areas[0].count;
    mat4.set(this.decalMatrix, variableStore._variables['u_DecalMatrix'].value);
    mat4.set(this.invDecalMatrix, variableStore._variables['u_InvDecalMatrix'].value);
    this.parentGeometry.meshes[0].indexes = this.decalGeometry.meshes[this.decalIndex].indexes;
    this.parentGeometry.meshes[0].areas[0].start = this.decalGeometry.meshes[this.decalIndex].areas[0].start;
    this.parentGeometry.meshes[0].areas[0].count = this.decalGeometry.meshes[this.decalIndex].areas[0].count;
    this.parentGeometry.RenderAreas(0, 0, 1, overrideEffect ? overrideEffect : this.decalEffect);
    this.parentGeometry.meshes[0].indexes = bkIB;
    this.parentGeometry.meshes[0].areas[0].start = bkStart;
    this.parentGeometry.meshes[0].areas[0].count = bkCount;
};
