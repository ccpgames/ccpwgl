/**
 * Mesh attachment to space object
 * @property {string} name
 * @property {boolean} display
 * @property {boolean} useSpaceObjectData
 * @property {Number} lowestLodVisible
 * @property {quat4} rotation
 * @property {vec3} translation
 * @property {vec3} scaling
 * @property {boolean} useSRT
 * @property {boolean} staticTransform
 * @property {mat4} localTransform
 * @property {mat4} worldTransform
 * @property {mat4} worldTransformLast
 * @property {Tw2Mesh} mesh
 * @property {boolean} isEffectChild
 * @property {Tw2PerObjectData} _perObjectData
 * @constructor
 */
function EveChildMesh()
{
    this.name = '';
    this.display = true;
    this.useSpaceObjectData = true;
    this.lowestLodVisible = 2;
    this.rotation = quat4.create([0, 0, 0, 1]);
    this.translation = vec3.create();
    this.scaling = vec3.create([1, 1, 1]);
    this.useSRT = true;
    this.staticTransform = false;
    this.localTransform = mat4.create();
    this.worldTransform = mat4.create();
    this.worldTransformLast = mat4.create();
    this.mesh = null;

    this.isEffectChild = true;

    this._perObjectData = null;
}

/**
 * Updates mesh transform
 * @param {mat4} parentTransform
 */
EveChildMesh.prototype.Update = function(parentTransform)
{
    if (this.useSRT)
    {
        var temp = this.worldTransformLast;
        mat4.identity(this.localTransform);
        mat4.translate(this.localTransform, this.translation);
        mat4.transpose(quat4.toMat4(quat4.normalize(this.rotation), temp));
        mat4.multiply(this.localTransform, temp, this.localTransform);
        mat4.scale(this.localTransform, this.scaling);
    }
    mat4.set(this.worldTransform, this.worldTransformLast);
    mat4.multiply(this.localTransform, parentTransform, this.worldTransform)
};


/**
 * Gets render batches
 * @param {RenderMode} mode
 * @param {Tw2BatchAccumulator} accumulator
 * @param {Tw2PerObjectData} perObjectData
 */
EveChildMesh.prototype.GetBatches = function(mode, accumulator, perObjectData)
{
    if (!this.display || !this.mesh)
    {
        return;
    }
    if (this.useSpaceObjectData)
    {
        if (!this._perObjectData)
        {
            this._perObjectData = new Tw2PerObjectData();
            this._perObjectData.perObjectVSData = new Tw2RawData();
            this._perObjectData.perObjectVSData.data = new Float32Array(perObjectData.perObjectVSData.data.length);

            this._perObjectData.perObjectVSData.data[33] = 1;
            this._perObjectData.perObjectVSData.data[35] = 1;

            this._perObjectData.perObjectPSData = new Tw2RawData();
            this._perObjectData.perObjectPSData.data = new Float32Array(perObjectData.perObjectPSData.data.length);

            this._perObjectData.perObjectPSData.data[1] = 1;
            this._perObjectData.perObjectPSData.data[3] = 1;
        }
        this._perObjectData.perObjectVSData.data.set(perObjectData.perObjectVSData.data);
        this._perObjectData.perObjectPSData.data.set(perObjectData.perObjectPSData.data);

        mat4.transpose(this.worldTransform, this._perObjectData.perObjectVSData.data);
        mat4.transpose(this.worldTransformLast, this._perObjectData.perObjectVSData.data.subarray(16));
    }
    else
    {
        if (!this._perObjectData)
        {
            this._perObjectData = new Tw2PerObjectData();
            this._perObjectData.perObjectVSData = new Tw2RawData();
            this._perObjectData.perObjectVSData.Declare('world', 16);
            this._perObjectData.perObjectVSData.Declare('worldInverseTranspose', 16);
            this._perObjectData.perObjectVSData.Create();
        }
        mat4.transpose(this.worldTransform, this._perObjectData.perObjectVSData.Get('world'));
        mat4.inverse(this.worldTransform, this._perObjectData.perObjectVSData.Get('worldInverseTranspose'));
    }

    this.mesh.GetBatches(mode, accumulator, this._perObjectData);

};



/**
 * Gets child mesh res objects
 * @param {Array} [out=[]] - Optional receiving array
 * @returns {Array.<Tw2EffectRes|Tw2TextureRes|Tw2GeometryRes>} [out]
 */
EveChildMesh.prototype.GetResources = function(out)
{
    if (out === undefined)
    {
        out = [];
    }

    if (this.mesh !== null)
    {
        this.mesh.GetResources(out);
    }

    return out;
}
