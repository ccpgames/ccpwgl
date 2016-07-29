/**
 * EveMissile
 * @property {String} name
 * @property {Boolean} display
 * @property {Array} warheads
 * @property {Array} curveSets
 * @property {vec3} boundingSphereCenter
 * @property {Number} boundingSphereRadius
 * @property {vec3} position
 * @property {vec3} target
 * @property {Number} speed
 * @property {!function(EveMissileWarhead): void} warheadExplosionCallback
 * @property {!function(EveMissile): void} missileFinishedCallback
 * @constructor
 */
function EveMissile()
{
    this.name = '';
    this.display = true;
    this.warheads = [];
    this.curveSets = [];
    this.boundingSphereCenter = vec3.create();
    this.boundingSphereRadius = 0;

    this.position = vec3.create();
    this.target = vec3.create();
    this.speed = 1;

    this.warheadExplosionCallback = null;
    this.missileFinishedCallback = null;
}

/**
 * Gets missile res objects
 * @param {Array} out - Receiving array
 */
EveMissile.prototype.GetResources = function(out)
{
    for (var i = 0; i < this.warheads.length; ++i)
    {
        this.warheads[i].GetResources(out);
    }
};

/**
 * Per frame view dependent data update
 */
EveMissile.prototype.UpdateViewDependentData = function()
{
    for (var i = 0; i < this.warheads.length; ++i)
    {
        this.warheads[i].UpdateViewDependentData();
    }
};

/**
 * Accumulates render batches
 * @param {RenderMode} mode
 * @param {Tw2BatchAccumulator} accumulator
 */
EveMissile.prototype.GetBatches = function(mode, accumulator)
{
    if (this.display)
    {
        for (var i = 0; i < this.warheads.length; ++i)
        {
            this.warheads[i].GetBatches(mode, accumulator);
        }
    }
};

/**
 * Per frame update
 * @param {Number} dt - Time since previous frame
 */
EveMissile.prototype.Update = function(dt)
{
    var tmp = vec3.create();
    var distance = vec3.length(vec3.subtract(this.target, this.position, tmp));
    if (distance > 0.1)
    {
        vec3.normalize(tmp);
        vec3.scale(tmp, Math.min(dt * this.speed, distance));
        vec3.add(this.position, tmp);
    }
    for (var i = 0; i < this.curveSets.length; ++i)
    {
        this.curveSets[i].Update(dt);
    }
    var checkDead = false;
    for (i = 0; i < this.warheads.length; ++i)
    {
        var state = this.warheads[i].state;
        this.warheads[i].Update(dt, this.position, this.target);
        if (state != EveMissileWarhead.STATE_DEAD && this.warheads[i].state == EveMissileWarhead.STATE_DEAD)
        {
            if (this.warheadExplosionCallback)
            {
                this.warheadExplosionCallback(this.warheads[i]);
            }
            checkDead = true;
        }
    }
    if (checkDead && this.missileFinishedCallback)
    {
        for (i = 0; i < this.warheads.length; ++i)
        {
            if (this.warheads[i].state != EveMissileWarhead.STATE_DEAD)
            {
                return;
            }
        }
        this.missileFinishedCallback(this);
    }
};

/**
 * Prepares missile for rendering
 * @param {vec3} position - Missile starting position
 * @param {Array} turretTransforms - Turret muzzle local to world transforms
 * @param {vec3} target - Target position
 */
EveMissile.prototype.Launch = function(position, turretTransforms, target)
{
    vec3.set(position, this.position);
    vec3.set(target, this.target);
    if (this.warheads.length > turretTransforms.length)
    {
        this.warheads.splice(turretTransforms.length);
    }
    else
    {
        while (this.warheads.length < turretTransforms.length)
        {
            this.warheads.push(this.warheads[0].Copy());
        }
    }
    for (var i = 0; i < this.warheads.length; ++i)
    {
        this.warheads[0].Launch(turretTransforms[i]);
    }
};
