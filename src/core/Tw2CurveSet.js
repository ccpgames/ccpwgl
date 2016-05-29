/**
 * Tw2CurveSet
 * @property {string} name
 * @property {Array.<Tw2Curve>} curves
 * @property {Array} bindings
 * @property {Number} scale
 * @property {Boolean} playOnLoad
 * @property {Boolean} isPlaying
 * @property {Number} scaledTime
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
 */
Tw2CurveSet.prototype.Play = function()
{
    this.isPlaying = true;
    this.scaledTime = 0;
};

/**
 * Plays the Tw2CurveSet from a specific time
 * @param {Number} time
 */
Tw2CurveSet.prototype.PlayFrom = function(time)
{
    this.isPlaying = true;
    this.scaledTime = time;
};

/**
 * Stops the Tw2CurveSet from playing
 */
Tw2CurveSet.prototype.Stop = function()
{
    this.isPlaying = false;
};

/**
 * Internal render/update function which is called every frame
 * @param {Number} dt - Delta Time
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
 * @returns {Number}
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
