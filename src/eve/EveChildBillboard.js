/**
 * Mesh attachment to space object and oriented towards the camera
 * @property {string} name
 * @property {boolean} display
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
 * @property {EveBasicPerObjectData} _perObjectData
 * @constructor
 */
function EveChildBillboard()
{
    this.name = '';
    this.display = true;
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

    this._perObjectData = new EveBasicPerObjectData();
    this._perObjectData.perObjectFFEData = new Tw2RawData();
    this._perObjectData.perObjectFFEData.Declare('world', 16);
    this._perObjectData.perObjectFFEData.Declare('worldInverseTranspose', 16);
    this._perObjectData.perObjectFFEData.Create();
}

/**
 * Updates mesh transform
 * @param {mat4} parentTransform
 */
EveChildBillboard.prototype.Update = function(parentTransform)
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
    mat4.multiply(parentTransform, this.localTransform, this.worldTransform);

    var invView = mat4.create();
    mat4.lookAt(device.viewInv.subarray(12), this.worldTransform.subarray(12), [0, 1, 0], invView);
    mat4.transpose(invView);

    var finalScale = vec3.create();
    vec3.set(this.scaling, finalScale);
    var parentScaleX = vec3.length(parentTransform);
    var parentScaleY = vec3.length(parentTransform.subarray(4));
    var parentScaleZ = vec3.length(parentTransform.subarray(8));
    finalScale[0] *= parentScaleX;
    finalScale[1] *= parentScaleY;
    finalScale[2] *= parentScaleZ;

    this.worldTransform[0] = invView[0] * finalScale[0];
    this.worldTransform[1] = invView[1] * finalScale[0];
    this.worldTransform[2] = invView[2] * finalScale[0];
    this.worldTransform[4] = invView[4] * finalScale[1];
    this.worldTransform[5] = invView[5] * finalScale[1];
    this.worldTransform[6] = invView[6] * finalScale[1];
    this.worldTransform[8] = invView[8] * finalScale[2];
    this.worldTransform[9] = invView[9] * finalScale[2];
    this.worldTransform[10] = invView[10] * finalScale[2];
};


/**
 * Gets render batches
 * @param {RenderMode} mode
 * @param {Tw2BatchAccumulator} accumulator
 */
EveChildBillboard.prototype.GetBatches = function(mode, accumulator)
{
    if (!this.display || !this.mesh)
    {
        return;
    }
    mat4.transpose(this.worldTransform, this._perObjectData.perObjectFFEData.Get('world'));
    mat4.inverse(this.worldTransform, this._perObjectData.perObjectFFEData.Get('worldInverseTranspose'));

    this.mesh.GetBatches(mode, accumulator, this._perObjectData);

};



/**
 * Gets child mesh res objects
 * @param {Array} [out=[]] - Optional receiving array
 * @returns {Array.<Tw2EffectRes|Tw2TextureRes|Tw2GeometryRes>} [out]
 */
EveChildBillboard.prototype.GetResources = function(out)
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
};
