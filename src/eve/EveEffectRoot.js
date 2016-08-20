/**
 * EveEffectRoot
 * @property {string} name
 * @property {boolean} display
 * @property {EveTransform|EveStretch|EveTransform} highDetail
 * @property {boolean} isPlaying
 * @property {vec3} scaling
 * @property {quat} rotation
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

    this.scaling = vec3.one();
    this.rotation = quat.create();
    this.translation = vec3.create();
    this.localTransform = mat4.create();

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
 * Gets effect root res objects
 * @param {Array} [out=[]] - Optional receiving array
 * @returns {Array.<Tw2EffectRes|Tw2TextureRes>} [out]
 */
EveEffectRoot.prototype.GetResources = function(out)
{
    if (out === undefined)
    {
        out = [];
    };

    if (this.highDetail !== null)
    {
        this.highDetail.GetResources(out);
    }

    return out;
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

    // TODO: Check this refactoring
    quat.normalize(this.rotation, this.rotation);
    mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);
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
    mat4.transpose(this._perObjectData.perObjectVSData.Get('WorldMat'), this.localTransform);
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
