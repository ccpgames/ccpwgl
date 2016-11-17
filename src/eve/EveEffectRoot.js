/**
 * EveEffectRoot root objects for FX, can be put into scene's objects array
 * @property {string} name
 * @property {boolean} display
 * @property {[{}]} curveSets
 * @property {[{}]} effectChildren
 * @property {vec3} scaling
 * @property {quat4} rotation
 * @property {vec3} translation
 * @property {mat4} localTransform
 * @property {mat4} rotationTransform
 * @property {vec3} boundingSphereCenter
 * @property {number} boundingSphereRadius
 * @property {number} duration
 * @property {Tw2PerObjectData} _perObjectData
 * @constructor
 */
function EveEffectRoot()
{
    this.name = '';
    this.display = true;

    this.curveSets = [];
    this.boundingSphereCenter = vec3.create();
    this.boundingSphereRadius = 0;

    this.scaling = vec3.create([1, 1, 1]);
    this.rotation = quat4.create([0, 0, 0, 1]);
    this.translation = vec3.create();

    this.duration = 0;

    this.effectChildren = [];

    this.localTransform = mat4.identity(mat4.create());
    this.rotationTransform = mat4.create();

    this._perObjectData = new Tw2PerObjectData();
    this._perObjectData.perObjectVSData = new Tw2RawData();
    this._perObjectData.perObjectVSData.Declare('WorldMat', 16);
    this._perObjectData.perObjectVSData.Declare('WorldMatLast', 16);
    this._perObjectData.perObjectVSData.Declare('Shipdata', 4);
    this._perObjectData.perObjectVSData.Declare('Clipdata1', 4);
    this._perObjectData.perObjectVSData.Declare('EllipsoidRadii', 4);
    this._perObjectData.perObjectVSData.Declare('EllipsoidCenter', 4);
    this._perObjectData.perObjectVSData.Declare('CustomMaskMatrix0', 16);
    this._perObjectData.perObjectVSData.Declare('CustomMaskMatrix1', 16);
    this._perObjectData.perObjectVSData.Declare('CustomMaskData0', 4);
    this._perObjectData.perObjectVSData.Declare('CustomMaskData1', 4);
    this._perObjectData.perObjectVSData.Declare('JointMat', 696);
    this._perObjectData.perObjectVSData.Create();

    this._perObjectData.perObjectPSData = new Tw2RawData();
    this._perObjectData.perObjectPSData.Declare('Shipdata', 4);
    this._perObjectData.perObjectPSData.Declare('Clipdata1', 4);
    this._perObjectData.perObjectPSData.Declare('Clipdata2', 4);
    this._perObjectData.perObjectPSData.Declare('ShLighting', 4 * 7);
    this._perObjectData.perObjectPSData.Declare('CustomMaskMaterialID0', 4);
    this._perObjectData.perObjectPSData.Declare('CustomMaskMaterialID1', 4);
    this._perObjectData.perObjectPSData.Declare('CustomMaskTarget0', 4);
    this._perObjectData.perObjectPSData.Declare('CustomMaskTarget1', 4);
    this._perObjectData.perObjectPSData.Create();
}

/**
 * Gets effect root res objects
 * @param {Array} [out=[]] - Optional receiving array
 * @returns {Array.<Tw2EffectRes|Tw2TextureRes>} [out]
 */
EveEffectRoot.prototype.GetResources = function(out)
{
    if (out === undefined)
    {
        out = [];
    }

    for (var i = 0; i < this.effectChildren.length; ++i)
    {
        this.effectChildren[i].GetResources(out);
    }
    return out;
};

/**
 * Internal per frame update
 * @param {number} dt - Delta Time
 */
EveEffectRoot.prototype.Update = function(dt)
{
    mat4.identity(this.localTransform);
    mat4.translate(this.localTransform, this.translation);
    mat4.transpose(quat4.toMat4(quat4.normalize(this.rotation), this.rotationTransform));
    mat4.multiply(this.localTransform, this.rotationTransform, this.localTransform);
    mat4.scale(this.localTransform, this.scaling);

    for (var i = 0; i < this.curveSets.length; ++i)
    {
        this.curveSets[i].Update(dt);
    }
    for (i = 0; i < this.effectChildren.length; ++i)
    {
        this.effectChildren[i].Update(this.localTransform, dt);
    }
};

/**
 * Gets render batches
 * @param {RenderMode} mode
 * @param {Tw2BatchAccumulator} accumulator
 */
EveEffectRoot.prototype.GetBatches = function(mode, accumulator)
{
    if (!this.display)
    {
        return;
    }
    for (var i = 0; i < this.effectChildren.length; ++i)
    {
        this.effectChildren[i].GetBatches(mode, accumulator, this._perObjectData);
    }
};

/**
 * Starts playing the effectRoot's curveSets if they exist
 */
EveEffectRoot.prototype.Start = function()
{
    for (var i = 0; i < this.curveSets.length; ++i)
    {
        this.curveSets[i].Play();
    }
};

/**
 * Stops the effectRoot's curveSets from playing
 */
EveEffectRoot.prototype.Stop = function()
{
    for (var i = 0; i < this.curveSets.length; ++i)
    {
        this.curveSets[i].Stop();
    }
};
