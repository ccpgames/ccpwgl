import {vec3, quat, mat4, curve, util, resMan} from '../../global';

/**
 * Tw2WbgTrack
 *
 * @property {string|number} _id
 * @property {string} name
 * @property {string} geometryResPath
 * @property {Object} geometryRes
 * @property {string} group
 * @property {number} duration
 * @property {boolean} cycle
 */
export function Tw2WbgTrack()
{
    this._id = util.generateID();
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

        for (let i = 0; i < self.geometryRes.animations.length; ++i)
        {
            let animation = self.geometryRes.animations[i];
            for (let j = 0; j < animation.trackGroups.length; ++j)
            {
                if (animation.trackGroups[j].name === self.group)
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
    this.Initialize = function ()
    {
        if (this.geometryResPath)
        {
            this.geometryRes = resMan.GetResource(this.geometryResPath);
            const self = this;
            let notification = {
                OnResPrepared: function ()
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
    this.UpdateValue = function (time)
    {
        if (!this._TracksReady()) return;
        if (this.cycle) time = time % this.duration;
        if (time <= this.duration && time >= 0) this._UpdateValue(time);
    };
}

/**
 * Tw2WbgTransformTrack
 *
 * @property {string|number} _id
 * @property {vec3} translation
 * @property {quat} rotation
 * @property {vec3} scale
 * @variable {*} positionCurve
 * @variable {*} rotationCurve
 * @variable {*} scaleCurve
 * @variable {mat4} scaleShear
 */
export function Tw2WbgTransformTrack()
{
    this._id = util.generateID();
    this.translation = vec3.create();
    this.rotation = quat.create();
    this.rotation[3] = 1;
    this.scale = vec3.create();
    let positionCurve = null;
    let rotationCurve = null;
    let scaleCurve = null;
    let scaleShear = mat4.create();

    /**
     * _TracksReady
     * @returns {*}
     * @private
     */
    this._TracksReady = function ()
    {
        return positionCurve || rotationCurve || scaleCurve;
    };

    /**
     * _ApplyTracks
     * @param trackGroup
     * @param duration
     * @private
     */
    this._ApplyTracks = function (trackGroup, duration)
    {
        for (let i = 0; i < trackGroup.transformTracks.length; ++i)
        {
            let track = trackGroup.transformTracks[i];
            if (track.name === this.name)
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
    this._UpdateValue = function (time)
    {
        if (positionCurve)
        {
            curve.evaluate(positionCurve, time, this.translation, this.cycle, this.duration);
        }

        if (rotationCurve)
        {
            curve.evaluate(rotationCurve, time, this.rotation, this.cycle, this.duration);
            quat.normalize(this.rotation, this.rotation);
        }

        if (scaleCurve)
        {
            curve.evaluate(scaleCurve, time, scaleShear, this.cycle, this.duration);
        }

        this.scale[0] = scaleShear[0];
        this.scale[1] = scaleShear[5];
        this.scale[2] = scaleShear[10];
    };
}

/**
 * @type {Tw2WbgTrack}
 * @prototype
 */
Tw2WbgTransformTrack.prototype = new Tw2WbgTrack();
