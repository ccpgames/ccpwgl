/**
 * Tw2WbgTrack
 * @property {string} name
 * @property {string} geometryResPath
 * @property {Object} geometryRes
 * @property {string} group
 * @property {number} duration
 * @property {boolean} cycle
 * @constructor
 */
function Tw2WbgTrack()
{
    this.name = '';
    this.geometryResPath = '';
    this.geometryRes = null;
    this.group = '';
    this.duration = 0;
    this.cycle = false;

    /**
     * SetCurves
     * @param self
     * @private
     */
    function SetCurves(self)
    {
        if (!self.name || !self.group || !self.geometryRes)
        {
            return;
        }
        for (var i = 0; i < self.geometryRes.animations.length; ++i)
        {
            var animation = self.geometryRes.animations[i];
            for (var j = 0; j < animation.trackGroups.length; ++j)
            {
                if (animation.trackGroups[j].name == self.group)
                {
                    self._ApplyTracks(animation.trackGroups[j], animation.duration);
                }
            }
        }
    }

    /**
     * Initialize
     * @method
     */
    this.Initialize = function()
    {
        if (this.geometryResPath)
        {
            this.geometryRes = resMan.GetResource(this.geometryResPath);
            var self = this;
            var notification = {
                ReleaseCachedData: function() {},
                RebuildCachedData: function()
                {
                    SetCurves(self);
                }
            };
            this.geometryRes.RegisterNotification(notification);
        }
    };

    /**
     * Updates a value at a specific time
     * @param {number} time
     * @prototype
     */
    this.UpdateValue = function(time)
    {
        if (!this._TracksReady())
        {
            return;
        }
        if (this.cycle)
        {
            time = time % this.duration;
        }
        if (time <= this.duration && time >= 0)
        {
            this._UpdateValue(time);
        }
    }
}

/**
 * Tw2WbgTransformTrack
 * @property {vec3} translation
 * @property {quat4} rotation
 * @property {vec3} scale
 * @variable positionCurve
 * @variable rotationCurve
 * @variable scaleCurve
 * @variable {mat4} scaleShear
 * @constructor
 */
function Tw2WbgTransformTrack()
{
    this.translation = vec3.create();
    this.rotation = quat4.create();
    this.rotation[3] = 1;
    this.scale = vec3.create();
    var positionCurve = null;
    var rotationCurve = null;
    var scaleCurve = null;
    var scaleShear = mat4.identity(mat4.create());

    /**
     * _TracksReady
     * @returns {?}
     * @private
     */
    this._TracksReady = function()
    {
        return positionCurve || rotationCurve || scaleCurve;
    };

    /**
     * _ApplyTracks
     * @param trackGroup
     * @param duration
     * @private
     */
    this._ApplyTracks = function(trackGroup, duration)
    {
        for (var i = 0; i < trackGroup.transformTracks.length; ++i)
        {
            var track = trackGroup.transformTracks[i];
            if (track.name == this.name)
            {
                this.duration = duration;
                positionCurve = track.position;
                rotationCurve = track.orientation;
                scaleCurve = track.scaleShear;
            }
        }
        this.UpdateValue(0);
    };

    /**
     * Updates a value at a specific time
     * @param {number} time
     * @prototype
     */
    this._UpdateValue = function(time)
    {
        if (positionCurve)
        {
            Tw2AnimationController.EvaluateCurve(positionCurve, time, this.translation, this.cycle, this.duration);
        }
        if (rotationCurve)
        {
            Tw2AnimationController.EvaluateCurve(rotationCurve, time, this.rotation, this.cycle, this.duration);
            quat4.normalize(this.rotation);
        }
        if (scaleCurve)
        {
            Tw2AnimationController.EvaluateCurve(scaleCurve, time, scaleShear, this.cycle, this.duration);
        }
        this.scale[0] = scaleShear[0];
        this.scale[1] = scaleShear[5];
        this.scale[2] = scaleShear[10];
    }
}

/**
 * @type {Tw2WbgTrack}
 * @prototype
 */
Tw2WbgTransformTrack.prototype = new Tw2WbgTrack();
