/**
 * Tw2TransformTrack
 * @property {string} name
 * @property {string} resPath
 * @property {Object} res
 * @property {string} group
 * @property {boolean} cycle
 * @property {vec3} translation
 * @property {quat} rotation
 * @property {vec3} scale
 * @property positionCurve
 * @property orientationCurve
 * @property scaleCurve
 * @property {mat4} _scaleShear
 * @constructor
 */
function Tw2TransformTrack()
{
    this.name = '';
    this.resPath = '';
    this.res = null;
    this.group = '';
    this.cycle = false;
    this.translation = vec3.create();
    this.rotation = quat.create();
    this.scale = vec3.fromValues(0,0,0);
    this.positionCurve = null;
    this.orientationCurve = null;
    this.scaleCurve = null;
}

/**
 * Initializes the Curve
 * @prototype
 */
Tw2TransformTrack.prototype.Initialize = function()
{
    if (this.resPath !== '')
    {
        this.res = resMan.GetResource(this.resPath);
    }
};

/**
 * Gets curve length
 * @returns {number}
 * @prototype
 */
Tw2TransformTrack.prototype.GetLength = function()
{
    return this.duration;
};

/**
 * Updates a value at a specific time
 * @param {number} time
 * @prototype
 */
Tw2TransformTrack.prototype.UpdateValue = function(time)
{
    if (!this.res || !this.res.IsGood())
    {
        return;
    }
    if (!this.positionCurve)
    {
        this.FindTracks();
    }
    if (!this.positionCurve)
    {
        return;
    }

    if (this.cycle)
    {
        time = time % this.duration;
    }
    if (time > this.duration || time < 0)
    {
        return;
    }

    var scaleShear = Tw2TransformTrack.scratch.mat4_0;
    Tw2AnimationController.EvaluateCurve(this.positionCurve, time, this.translation, this.cycle, this.duration);
    Tw2AnimationController.EvaluateCurve(this.orientationCurve, time, this.rotation, this.cycle, this.duration);
    quat.normalize(this.rotation);
    Tw2AnimationController.EvaluateCurve(this.scaleCurve, time, scaleShear, this.cycle, this.duration);
    mat4.getScaling(this.scale, this.scaleCurve);
};

/**
 * FindTracks
 * @prototype
 */
Tw2TransformTrack.prototype.FindTracks = function()
{
    var i;

    var group = null;
    for (i = 0; i < this.res.animations.length; ++i)
    {
        for (var j = 0; j < this.res.animations[i].trackGroups.length; ++j)
        {
            if (this.res.animations[i].trackGroups[j].name === this.group)
            {
                this.duration = this.res.animations[i].duration;
                group = this.res.animations[i].trackGroups[j];
                break;
            }
        }
    }
    if (!group)
    {
        return;
    }
    for (i = 0; i < group.transformTracks.length; ++i)
    {
        if (this.name === group.transformTracks[i].name)
        {
            this.positionCurve = group.transformTracks[i].position;
            this.orientationCurve = group.transformTracks[i].orientation;
            this.scaleCurve = group.transformTracks[i].scaleShear;
            break;
        }
    }
};

/**
 * Scratch variables
 */
Tw2TransformTrack.scratch = {
    mat4_0 : mat4.create()
};