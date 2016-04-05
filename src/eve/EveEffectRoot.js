/**
 * EveEffectRoot
 * @property {string} name
 * @property {boolean} display
 * @property {EveTransform|EveStretch|EveTransform} highDetail
 * @property {boolean} isPlaying
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
    this.highDetail = null;
    this.isPlaying = false;
    this.duration = 0;
    this.boundingSphereCenter = vec3.create();
    this.boundingSphereRadius = 0;

    this.scaling = vec3.create([1, 1, 1]);
    this.rotation = quat4.create([0, 0, 0, 1]);
    this.translation = vec3.create();
    this.localTransform = mat4.identity(mat4.create());
    this.rotationTransform = mat4.create();

    this._perObjectData = new Tw2PerObjectData();
    this._perObjectData.perObjectVSData = new Tw2RawData();
    this._perObjectData.perObjectVSData.Declare('WorldMat', 16);
    this._perObjectData.perObjectVSData.Declare('Shipdata', 4);
    this._perObjectData.perObjectVSData.Declare('JointMat', 696);
    this._perObjectData.perObjectVSData.Create();

    this._perObjectData.perObjectPSData = new Tw2RawData();
    this._perObjectData.perObjectPSData.Declare('Shipdata', 4);
    this._perObjectData.perObjectPSData.Create();
}

/**
 * Internal per frame update
 * @param {number} dt - Delta Time
 */
EveEffectRoot.prototype.Update = function(dt)
{
    if (this.highDetail)
    {
        this.highDetail.Update(dt);
    }

    mat4.identity(this.localTransform);
    mat4.translate(this.localTransform, this.translation);
    mat4.transpose(quat4.toMat4(quat4.normalize(this.rotation), this.rotationTransform));
    mat4.multiply(this.localTransform, this.rotationTransform, this.localTransform);
    mat4.scale(this.localTransform, this.scaling);
}

/**
 * Gets render batches
 * @param {RenderMode} mode
 * @param {Tw2BatchAccumulator} accumulator
 */
EveEffectRoot.prototype.GetBatches = function(mode, accumulator)
{
    if (!this.display || !this.isPlaying || !this.highDetail)
    {
        return;
    }

    this.highDetail.UpdateViewDependentData(this.localTransform);
    mat4.transpose(this.localTransform, this._perObjectData.perObjectVSData.Get('WorldMat'));
    this.highDetail.GetBatches(mode, accumulator, this._perObjectData);
}

/**
 * Starts playing the effectRoot's curveSets if they exist
 */
EveEffectRoot.prototype.Start = function()
{
    if (this.highDetail)
    {
        this.isPlaying = true;
        for (var i = 0; i < this.highDetail.curveSets.length; ++i)
        {
            this.highDetail.curveSets[i].Play();
        }
    }
}

/**
 * Stops the effectRoot's curveSets from playing
 */
EveEffectRoot.prototype.Stop = function()
{
    this.isPlaying = false;
}
