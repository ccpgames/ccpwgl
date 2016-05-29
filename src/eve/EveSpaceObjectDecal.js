/**
 * EveSpaceObjectDecal
 * @property {Boolean} display
 * @property {Tw2Effect} decalEffect
 * @property {String} name=''
 * @property {Number} groupIndex
 * @property {vec3} position
 * @property {quat4} rotation
 * @property {vec3} scaling
 * @property {mat4} decalMatrix
 * @property {mat4} invDecalMatrix
 * @property {Tw2GeometryRes} parentGeometry
 * @property {Array} indexBuffer
 * @property {*} _indexBuffer
 * @property {Number} parentBoneIndex
 * @property {Tw2PerObjectData} _perObjectData
 * @constructor
 */
function EveSpaceObjectDecal()
{
    this.display = true;
    this.decalEffect = null;
    this.name = '';
    this.groupIndex = -1;

    this.position = vec3.create();
    this.rotation = quat4.create();
    this.scaling = vec3.create();

    this.decalMatrix = mat4.create();
    this.invDecalMatrix = mat4.create();
    this.parentGeometry = null;
    this.indexBuffer = [];
    this._indexBuffer = null;
    this.parentBoneIndex = -1;

    this._perObjectData = new Tw2PerObjectData();
    this._perObjectData.perObjectVSData = new Tw2RawData();
    this._perObjectData.perObjectVSData.Declare('worldMatrix', 16);
    this._perObjectData.perObjectVSData.Declare('invWorldMatrix', 16);
    this._perObjectData.perObjectVSData.Declare('decalMatrix', 16);
    this._perObjectData.perObjectVSData.Declare('invDecalMatrix', 16);
    this._perObjectData.perObjectVSData.Declare('parentBoneMatrix', 16);
    this._perObjectData.perObjectVSData.Create();

    this._perObjectData.perObjectPSData = new Tw2RawData();
    this._perObjectData.perObjectPSData.Declare('displayData', 4);
    this._perObjectData.perObjectPSData.Declare('shipData', 4 * 3);
    this._perObjectData.perObjectPSData.Create();

    mat4.identity(this._perObjectData.perObjectVSData.Get('parentBoneMatrix'));

    variableStore.RegisterType('u_DecalMatrix', Tw2MatrixParameter);
    variableStore.RegisterType('u_InvDecalMatrix', Tw2MatrixParameter);
}

/**
 * Initializes the decal
 */
EveSpaceObjectDecal.prototype.Initialize = function()
{
    var indexes = new Uint16Array(this.indexBuffer);
    this._indexBuffer = device.gl.createBuffer();
    device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
    device.gl.bufferData(device.gl.ELEMENT_ARRAY_BUFFER, indexes, device.gl.STATIC_DRAW);

    mat4.scale(mat4.transpose(quat4.toMat4(this.rotation, this.decalMatrix)), this.scaling);
    this.decalMatrix[12] = this.position[0];
    this.decalMatrix[13] = this.position[1];
    this.decalMatrix[14] = this.position[2];
    mat4.inverse(this.decalMatrix, this.invDecalMatrix);
};

/**
 * Gets decal res objects
 * @param {Array} [out=[]] - Optional receiving array
 * @returns {Array.<Tw2Res>} [out]
 */
EveSpaceObjectDecal.prototype.GetResources = function(out)
{
    if (out === undefined)
    {
        out = [];
    }

    if (this.parentGeometry !== null)
    {
        if (out.indexOf(this.parentGeometry) === -1)
        {
            out.push(this.parentGeometry);
        }
    }

    if (this.decalEffect !== null)
    {
        this.decalEffect.GetResources(out);
    }

    return out;
};

/**
 * Sets the parent geometry
 * @param {Tw2GeometryRes} geometryRes
 */
EveSpaceObjectDecal.prototype.SetParentGeometry = function(geometryRes)
{
    this.parentGeometry = geometryRes;
};

/**
 * Gets batches for rendering
 * @param {RenderMode} mode
 * @param {Tw2BatchAccumulator} accumulator
 * @param {Tw2PerObjectData} perObjectData
 * @param {Number} [counter=0]
 */
EveSpaceObjectDecal.prototype.GetBatches = function(mode, accumulator, perObjectData, counter)
{
    if (mode != device.RM_DECAL)
    {
        return;
    }

    if (this.display && this.indexBuffer.length && this.decalEffect && this.parentGeometry && this.parentGeometry.IsGood())
    {
        var batch = new Tw2ForwardingRenderBatch();
        this._perObjectData.perObjectVSData.Set('worldMatrix', perObjectData.perObjectVSData.Get('WorldMat'));
        if (this.parentBoneIndex >= 0)
        {
            var bones = perObjectData.perObjectVSData.Get('JointMat');
            var offset = this.parentBoneIndex * 12;
            if (bones[offset + 0] || bones[offset + 4] || bones[offset + 8])
            {
                var bone = this._perObjectData.perObjectVSData.Get('parentBoneMatrix');
                bone[0] = bones[offset + 0];
                bone[1] = bones[offset + 4];
                bone[2] = bones[offset + 8];
                bone[3] = 0;
                bone[4] = bones[offset + 1];
                bone[5] = bones[offset + 5];
                bone[6] = bones[offset + 9];
                bone[7] = 0;
                bone[8] = bones[offset + 2];
                bone[9] = bones[offset + 6];
                bone[10] = bones[offset + 10];
                bone[11] = 0;
                bone[12] = bones[offset + 3];
                bone[13] = bones[offset + 7];
                bone[14] = bones[offset + 11];
                bone[15] = 1;
                mat4.transpose(bone);
            }
        }
        mat4.inverse(this._perObjectData.perObjectVSData.Get('worldMatrix'), this._perObjectData.perObjectVSData.Get('invWorldMatrix'));
        mat4.transpose(this.decalMatrix, this._perObjectData.perObjectVSData.Get('decalMatrix'));
        mat4.transpose(this.invDecalMatrix, this._perObjectData.perObjectVSData.Get('invDecalMatrix'));

        this._perObjectData.perObjectPSData.Get('displayData')[0] = counter || 0;
        this._perObjectData.perObjectPSData.Set('shipData', perObjectData.perObjectPSData.data);

        batch.perObjectData = this._perObjectData;
        batch.geometryProvider = this;
        batch.renderMode = device.RM_DECAL;
        accumulator.Commit(batch);
    }
};

/**
 * Render function
 * @param {Tw2ForwardingRenderBatch} batch
 * @param {Tw2Effect} overrideEffect
 */
EveSpaceObjectDecal.prototype.Render = function(batch, overrideEffect)
{
    var bkIB = this.parentGeometry.meshes[0].indexes;
    var bkStart = this.parentGeometry.meshes[0].areas[0].start;
    var bkCount = this.parentGeometry.meshes[0].areas[0].count;
    var bkIndexType = this.parentGeometry.meshes[0].indexType;
    mat4.set(this.decalMatrix, variableStore._variables['u_DecalMatrix'].value);
    mat4.set(this.invDecalMatrix, variableStore._variables['u_InvDecalMatrix'].value);
    this.parentGeometry.meshes[0].indexes = this._indexBuffer;
    this.parentGeometry.meshes[0].areas[0].start = 0;
    this.parentGeometry.meshes[0].areas[0].count = this.indexBuffer.length;
    this.parentGeometry.meshes[0].indexType = device.gl.UNSIGNED_SHORT;

    this.parentGeometry.RenderAreas(0, 0, 1, overrideEffect ? overrideEffect : this.decalEffect);
    this.parentGeometry.meshes[0].indexes = bkIB;
    this.parentGeometry.meshes[0].areas[0].start = bkStart;
    this.parentGeometry.meshes[0].areas[0].count = bkCount;
    this.parentGeometry.meshes[0].indexType = bkIndexType;
};
