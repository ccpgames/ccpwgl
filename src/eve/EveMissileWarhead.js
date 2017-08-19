/**
 * EveMissileWarhead
 * @property {String} name
 * @property {Boolean} display
 * @property {vec3} pathOffset
 * @property {Number} durationEjectPhase
 * @property {Number} startEjectVelocity
 * @property {Number} acceleration
 * @property {Number} maxExplosionDistance
 * @property {Number} impactSize
 * @property {Number} impactDuration
 * @property {EveSpriteSet} spriteSet
 * @property {Tw2Mesh} mesh
 * @property {Number} state
 * @property {mat4} transform
 * @property {vec3} velocity
 * @property {Number} time
 * @property {Tw2PerObjectData} _perObjectData
 * @constructor
 */
function EveMissileWarhead()
{
    this.name = '';
    this.display = true;
    this.pathOffset = vec3.create();
    this.durationEjectPhase = 0;
    this.startEjectVelocity = 0;
    this.acceleration = 1;
    this.maxExplosionDistance = 40;
    this.impactSize = 0;
    this.impactDuration = 0.6;
    this.spriteSet = null;
    this.mesh = null;
    this.state = EveMissileWarhead.STATE_READY;

    this.transform = mat4.create();
    this.velocity = vec3.create();
    this.time = 0;

    this._perObjectData = new Tw2PerObjectData();
    this._perObjectData.perObjectVSData = new Tw2RawData();
    this._perObjectData.perObjectVSData.Declare('WorldMat', 16);
    this._perObjectData.perObjectVSData.Declare('WorldMatLast', 16);
    this._perObjectData.perObjectVSData.Declare('Shipdata', 4);
    this._perObjectData.perObjectVSData.Declare('Clipdata1', 4);
    this._perObjectData.perObjectVSData.Create();

    this._perObjectData.perObjectPSData = new Tw2RawData();
    this._perObjectData.perObjectPSData.Declare('Shipdata', 4);
    this._perObjectData.perObjectPSData.Declare('Clipdata1', 4);
    this._perObjectData.perObjectPSData.Declare('Clipdata2', 4);
    this._perObjectData.perObjectPSData.Create();

    this._perObjectData.perObjectVSData.Get('Shipdata')[1] = 1;
    this._perObjectData.perObjectPSData.Get('Shipdata')[1] = 1;
    this._perObjectData.perObjectVSData.Get('Shipdata')[3] = -10;
    this._perObjectData.perObjectPSData.Get('Shipdata')[3] = 1;
}

EveMissileWarhead.STATE_READY = 0;
EveMissileWarhead.STATE_IN_FLIGHT = 1;
EveMissileWarhead.STATE_DEAD = 2;

/**
 * Initializes the warhead
 */
EveMissileWarhead.prototype.Initialize = function()
{
    if (this.spriteSet)
    {
        this.spriteSet.UseQuads(true);
    }
};

/**
 * Gets warhead res objects
 * @param {Array} out - Receiving array
 */
EveMissileWarhead.prototype.GetResources = function(out)
{
    if (this.mesh)
    {
        this.mesh.GetResources(out);
    }
    if (this.spriteSet)
    {
        this.spriteSet.GetResources(out);
    }
};

/**
 * Per frame view dependent data update
 */
EveMissileWarhead.prototype.UpdateViewDependentData = function()
{
    if (!this.display || this.state === EveMissileWarhead.STATE_DEAD)
    {
        return;
    }
    mat4.transpose(this._perObjectData.perObjectVSData.Get('WorldMat'), this.transform);
    mat4.transpose(this._perObjectData.perObjectVSData.Get('WorldMatLast'), this.transform);
};

/**
 * Accumulates render batches
 * @param {RenderMode} mode
 * @param {Tw2BatchAccumulator} accumulator
 */
EveMissileWarhead.prototype.GetBatches = function(mode, accumulator)
{
    if (this.display && this.mesh && this.state !== EveMissileWarhead.STATE_DEAD)
    {
        if (this.mesh)
        {
            this.mesh.GetBatches(mode, accumulator, this._perObjectData);
        }
        if (this.spriteSet)
        {
            this.spriteSet.GetBatches(mode, accumulator, this._perObjectData, this.transform);
        }
    }
};

/**
 * Scratch variables
 */
EveMissileWarhead.scratch = {
    vec3_0: vec3.create(),
    vec3_1: vec3.create(),
    vec3_2: vec3.create(),
    vec3_3: vec3.create()
};

/**
 * Per frame update
 * @param {Number} dt - Time since previous frame
 * @param {vec3} missilePosition - Missile position
 * @param {vec3} missileTarget - Missile target position
 */
EveMissileWarhead.prototype.Update = function(dt, missilePosition, missileTarget)
{
    if (this.state === EveMissileWarhead.STATE_IN_FLIGHT)
    {
        var scratch = EveMissileWarhead.scratch;
        var position = vec3.set(scratch.vec3_1, this.transform[12], this.transform[13], this.transform[14]);

        var tmp = scratch.vec3_0;
        this.time += dt;
        if (this.time > this.durationEjectPhase)
        {
            vec3.subtract(position, this.velocity, missilePosition);
            vec3.lerp(position, position, missilePosition, 1 - Math.exp(-dt * 0.9999));
            this.transform[12] = position[0];
            this.transform[13] = position[1];
            this.transform[14] = position[2];

            vec3.subtract(tmp, missileTarget, position);
            if (vec3.length(tmp) < this.maxExplosionDistance)
            {
                console.log(position, tmp);
                this.state = EveMissileWarhead.STATE_DEAD;
            }
        }
        else
        {
            vec3.scale(tmp, this.velocity, dt);
            this.transform[12] += tmp[0];
            this.transform[13] += tmp[1];
            this.transform[14] += tmp[2];
        }

        var x = scratch.vec3_2,
            y = scratch.vec3_3,
            z = vec3.normalize(tmp, this.velocity);

        if (Math.abs(z[0]) < 0.99)
        {
            vec3.cross(x, z, [1, 0, 0]);
        }
        else
        {
            vec3.cross(x, z, [0, 1, 0]);
        }

        vec3.normalize(x, x);
        vec3.cross(y, x, z);
        this.transform[0] = x[0];
        this.transform[1] = x[1];
        this.transform[2] = x[2];
        this.transform[4] = y[0];
        this.transform[5] = y[1];
        this.transform[6] = y[2];
        this.transform[8] = z[0];
        this.transform[9] = z[1];
        this.transform[10] = z[2];
    }

    if (this.spriteSet)
    {
        this.spriteSet.Update(dt);
    }
};

/**
 * Creates a copy of the warhead
 * @returns {EveMissileWarhead} copy of this object
 */
EveMissileWarhead.prototype.Copy = function()
{
    var warhead = new EveMissileWarhead();
    warhead.mesh = this.mesh;
    warhead.spriteSet = this.spriteSet;
    return warhead;
};

/**
 * Sets up the warhead for rendering
 * @param {mat4} transform - Initial local to world transform
 */
EveMissileWarhead.prototype.Launch = function(transform)
{
    mat4.copy(this.transform, transform);
    this.velocity[0] = transform[8] * this.startEjectVelocity;
    this.velocity[1] = transform[9] * this.startEjectVelocity;
    this.velocity[2] = transform[10] * this.startEjectVelocity;
    this.time = 0;
    this.state = EveMissileWarhead.STATE_IN_FLIGHT;
};
