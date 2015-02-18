function Tw2WbgTrack() {
    this.name = '';
    this.geometryResPath = '';
    this.geometryRes = null;
    this.group = '';
    this.duration = 0;
    this.cycle = false;

    function SetCurves(self) {
        if (!self.name || !self.group || !self.geometryRes) {
            return;
        }
        for (var i = 0; i < self.geometryRes.animations.length; ++i) {
            var animation = self.geometryRes.animations[i];
            for (var j = 0; j < animation.trackGroups.length; ++j) {
                if (animation.trackGroups[j].name == self.group) {
                    self._ApplyTracks(animation.trackGroups[j], animation.duration);
                }
            }
        }
    }

    this.Initialize = function () {
        if (this.geometryResPath) {
            this.geometryRes = resMan.GetResource(this.geometryResPath);
            var self = this;
            var notification = {
                ReleaseCachedData: function () {},
                RebuildCachedData: function () {
                    SetCurves(self);
                }
            };
            this.geometryRes.RegisterNotification(notification);
        }
    };
    
    this.UpdateValue = function (t) {
        if (!this._TracksReady()) {
            return;
        }
        if (this.cycle) {
            t = t % this.duration;
        }
        if (t <= this.duration && t >= 0) {
            this._UpdateValue(t);
        }
    }
}

function Tw2WbgTransformTrack() {
    this.translation = vec3.create();
    this.rotation = quat4.create();
    this.rotation[3] = 1;
    this.scale = vec3.create();

    var positionCurve = null;
    var rotationCurve = null;
    var scaleCurve = null;

    this._TracksReady = function () {
        return positionCurve || rotationCurve || scaleCurve;
    };

    this._ApplyTracks = function (trackGroup, duration) {
        for (var i = 0; i < trackGroup.transformTracks.length; ++i) {
            var track = trackGroup.transformTracks[i];
            if (track.name == this.name) {
                this.duration = duration;
                positionCurve = track.position;
                rotationCurve = track.orientation;
                scaleCurve = track.scaleShear;
            }
        }
        this.UpdateValue(0);
    };

    var scaleShear = mat4.identity(mat4.create());

    this._UpdateValue = function (t) {
        if (positionCurve) {
            Tw2AnimationController.EvaluateCurve(positionCurve, t, this.translation, this.cycle, this.duration);
        }
        if (rotationCurve) {
            Tw2AnimationController.EvaluateCurve(rotationCurve, t, this.rotation, this.cycle, this.duration);
            quat4.normalize(this.rotation);
        }
        if (scaleCurve) {
            Tw2AnimationController.EvaluateCurve(scaleCurve, t, scaleShear, this.cycle, this.duration);
        }
        this.scale[0] = scaleShear[0];
        this.scale[1] = scaleShear[5];
        this.scale[2] = scaleShear[10];
    }
}

Tw2WbgTransformTrack.prototype = new Tw2WbgTrack();