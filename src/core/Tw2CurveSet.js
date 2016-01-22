/**
 * Tw2CurveSet
 * @property {string} name
 * @property {Array.<Tw2Curve>} curves
 * @property {Array} bindings
 * @property {number} scale
 * @property {boolean} playOnLoad
 * @property {boolean} isPlaying
 * @property {number} scaledTime
 * @constructor
 */
function Tw2CurveSet()
{
    this.name = '';
    this.curves = [];
    this.bindings = [];
    this.scale = 1;
    this.playOnLoad = true;
    this.isPlaying = false;
    this.scaledTime = 0;
}

/**
 * Initializes the Tw2CurveSet
 * @prototype
 */
Tw2CurveSet.prototype.Initialize = function()
{
    if (this.playOnLoad)
    {
        this.Play();
    }
};

/**
 * Plays the Tw2CurveSet
 * @prototype
 */
Tw2CurveSet.prototype.Play = function()
{
    this.isPlaying = true;
    this.scaledTime = 0;
};

/**
 * Plays the Tw2CurveSet from a specific time
 * @param {number} time
 * @prototype
 */
Tw2CurveSet.prototype.PlayFrom = function(time)
{
    this.isPlaying = true;
    this.scaledTime = time;
};

/**
 * Stops the Tw2CurveSet from playing
 * @prototype
 */
Tw2CurveSet.prototype.Stop = function()
{
    this.isPlaying = false;
};

/**
 * Internal render/update function which is called every frame
 * @param {number} dt - Delta Time
 * @prototype
 */
Tw2CurveSet.prototype.Update = function(dt)
{
    if (this.isPlaying)
    {
        this.scaledTime += dt * this.scale;
        var scaledTime = this.scaledTime;
        var curves = this.curves;
        for (var i = 0; i < curves.length; ++i)
        {
            curves[i].UpdateValue(scaledTime);
        }
        var bindings = this.bindings;
        for (var b = 0; b < bindings.length; ++b)
        {
            bindings[b].CopyValue();
        }
    }
};

/**
 * Gets the maximum curve duration
 * @returns {number}
 * @prototype
 */
Tw2CurveSet.prototype.GetMaxCurveDuration = function()
{
    var length = 0;
    for (var i = 0; i < this.curves.length; ++i)
    {
        if ('GetLength' in this.curves[i])
        {
            length = Math.max(length, this.curves[i].GetLength());
        }
    }
    return length;
};
