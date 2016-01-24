/**
 * Tw2StaticEmitter
 * @property {string} name
 * @property {null|Tw2ParticleSystem} particleSystem
 * @property {string} geometryResourcePath
 * @property geometryResource
 * @property {number} geometryIndex
 * @property {boolean} _spawned
 * @constructor
 */
function Tw2StaticEmitter()
{
    this.name = '';
    this.particleSystem = null;
    this.geometryResourcePath = '';
    this.geometryResource = null;
    this.geometryIndex = 0;
    this._spawned = false;
}

/**
 * Initializes the emitter
 * @prototype
 */
Tw2StaticEmitter.prototype.Initialize = function()
{
    if (this.geometryResourcePath != '')
    {
        this.geometryResource = resMan.GetResource(this.geometryResourcePath);
        this.geometryResource.systemMirror = true;
        this.geometryResource.RegisterNotification(this);
    }
    this._spawned = false;
};

/**
 * Rebuilds cached data
 * @prototype
 */
Tw2StaticEmitter.prototype.RebuildCachedData = function()
{
    if (this.geometryResource && this.geometryResource.meshes.length)
    {
        if (!this.geometryResource.meshes[0].bufferData)
        {
            this.geometryResource.systemMirror = true;
            this.geometryResource.Reload();
        }
    }
};

/**
 * Internal render/update function. It is called every frame.
 * TODO: @param dt is redundant
 * @param {number} dt - delta time
 * @prototype
 */
Tw2StaticEmitter.prototype.Update = function(dt)
{
    var i;

    if (!this._spawned &&
        this.particleSystem &&
        this.geometryResource &&
        this.geometryResource.IsGood() &&
        this.geometryResource.meshes.length > this.geometryIndex &&
        this.geometryResource.meshes[this.geometryIndex].bufferData)
    {
        this._spawned = true;

        var mesh = this.geometryResource.meshes[this.geometryIndex];
        var elts = this.particleSystem.elements;
        var inputs = new Array(elts.length);
        for (i = 0; i < elts.length; ++i)
        {
            var d = elts[i].GetDeclaration();
            var input = mesh.declaration.FindUsage(d.usage, d.usageIndex - 8);
            if (input == null)
            {
                console.error('Tw2StaticEmitter: ',
                    'input geometry res \'',
                    this.geometryResource.path,
                    '\' mesh lacks (', d.usage, ', ', d.usageIndex,
                    ') element required by particle system');
                return;
            }
            if (input.elements < d.elements)
            {
                console.error('Tw2StaticEmitter: ',
                    'input geometry res \'',
                    this.geometryResource.path,
                    '\' mesh elements (', d.usage, ', ', d.usageIndex,
                    ') does not have required number of components');
                return;
            }
            inputs[i] = input.offset / 4;
        }
        var vertexCount = mesh.bufferData.length / mesh.declaration.stride * 4;
        for (i = 0; i < vertexCount; ++i)
        {
            var index = this.particleSystem.BeginSpawnParticle();
            if (index == null)
            {
                break;
            }
            for (var j = 0; j < this.particleSystem._elements.length; ++j)
            {
                var e = this.particleSystem._elements[j];
                for (var k = 0; k < e.dimension; ++k)
                {
                    e.buffer[e.instanceStride * index + e.startOffset + k] = mesh.bufferData[inputs[j] + k + i * mesh.declaration.stride / 4];
                }
            }
            this.particleSystem.EndSpawnParticle();
        }
    }
};
