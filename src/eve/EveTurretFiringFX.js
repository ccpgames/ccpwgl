function EvePerMuzzleData() {
    this.started = false;
    this.readyToStart = false;
    this.muzzlePositionBone = null;
    this.muzzleTransform = mat4.create();
    this.muzzlePosition = this.muzzleTransform.subarray(12, 15);
    this.currentStartDelay = 0;
    this.constantDelay = 0;
    this.elapsedTime = 0;
}

function EveTurretFiringFX() {
    this.name = '';
    this.display = true;
    this.useMuzzleTransform = false;
    this.isFiring = false;
    this.isLoopFiring = false;
    this.firingDelay1 = 0;
    this.firingDelay2 = 0;
    this.firingDelay3 = 0;
    this.firingDelay4 = 0;
    this.firingDelay5 = 0;
    this.firingDelay6 = 0;
    this.firingDelay7 = 0;
    this.firingDelay8 = 0;
    this.stretch = [];
    this.endPosition = vec3.create();

    this._firingDuration = 0;
    this._perMuzzleData = [];
}

EveTurretFiringFX.prototype.Initialize = function () {
    this._firingDuration = this.GetCurveDuration();
    for (var i = 0; i < this.stretch.length; ++i) {
        this._perMuzzleData[i] = new EvePerMuzzleData();
    }
    if (this._perMuzzleData.length > 0) {
        this._perMuzzleData[0].constantDelay = this.firingDelay1;
    }
    if (this._perMuzzleData.length > 1) {
        this._perMuzzleData[1].constantDelay = this.firingDelay2;
    }
    if (this._perMuzzleData.length > 2) {
        this._perMuzzleData[2].constantDelay = this.firingDelay3;
    }
    if (this._perMuzzleData.length > 3) {
        this._perMuzzleData[3].constantDelay = this.firingDelay4;
    }
    if (this._perMuzzleData.length > 4) {
        this._perMuzzleData[4].constantDelay = this.firingDelay5;
    }
    if (this._perMuzzleData.length > 5) {
        this._perMuzzleData[5].constantDelay = this.firingDelay6;
    }
    if (this._perMuzzleData.length > 6) {
        this._perMuzzleData[6].constantDelay = this.firingDelay7;
    }
    if (this._perMuzzleData.length > 7) {
        this._perMuzzleData[7].constantDelay = this.firingDelay8;
    }
}

EveTurretFiringFX.prototype.GetCurveDuration = function () {
    var maxDuration = 0;
    for (var i = 0; i < this.stretch.length; ++i) {
        var stretch = this.stretch[i];
        for (var j = 0; j < stretch.curveSets.length; ++j) {
            maxDuration = Math.max(maxDuration, stretch.curveSets[j].GetMaxCurveDuration());
        }
    }
    return maxDuration;
}

EveTurretFiringFX.prototype.GetPerMuzzleEffectCount = function () {
    return this.stretch.length;
}

EveTurretFiringFX.prototype.SetMuzzleBoneID = function (index, bone) {
    this._perMuzzleData[index].muzzlePositionBone = bone;
}

EveTurretFiringFX.prototype.GetBatches = function (mode, accumulator, perObjectData) {
    if (!this.display || !this.isFiring) {
        return;
    }
    for (var i = 0; i < this.stretch.length; ++i) {
        if (this._perMuzzleData[i].started && (this._firingDuration >= this._perMuzzleData[i].elapsedTime || this.isLoopFiring)) {
            this.stretch[i].GetBatches(mode, accumulator, perObjectData);
        }
    }
}

EveTurretFiringFX.prototype.GetMuzzleTransform = function (index) {
    return this._perMuzzleData[index].muzzleTransform;
}

EveTurretFiringFX.prototype.Update = function (dt) {
    var retVal = false;
    for (var i = 0; i < this.stretch.length; ++i) {
        if (this._perMuzzleData[i].started) {
            this._perMuzzleData[i].elapsedTime += dt;
        }
        if (this._perMuzzleData[i].elapsedTime < this._firingDuration || this.isLoopFiring) {
            if (this.isFiring) {
                if (!this._perMuzzleData[i].started) {
                    if (this._perMuzzleData[i].readyToStart) {
                        this.StartMuzzleEffect(i);
                        this._perMuzzleData[i].currentStartDelay = 0;
                        this._perMuzzleData[i].elapsedTime = 0;
                        retVal = true;
                    }
                    else {
                        this._perMuzzleData[i].currentStartDelay -= dt;
                    }
                    if (this._perMuzzleData[i].currentStartDelay <= 0) {
                        this._perMuzzleData[i].readyToStart = true;
                    }
                }
                else {
                    if (this.useMuzzleTransform) {
                        this.stretch[i].SetSourceTransform(this._perMuzzleData[i].muzzleTransform);
                    }
                    else {
                        this.stretch[i].SetSourcePosition(this._perMuzzleData[i].muzzlePosition);
                    }
                    this.stretch[i].SetDestinationPosition(this.endPosition);
                    this.stretch[i].SetIsNegZForward(true);
                }
            }
        }
        this.stretch[i].Update(dt);
    }
}

EveTurretFiringFX.prototype.PrepareFiring = function (delay, muzzleID) {
    if (typeof (muzzleID) == 'undefined') {
        muzzleID = -1;
    }
    for (var i = 0; i < this.stretch.length; ++i) {
        if (muzzleID < 0 || muzzleID == i) {
            this._perMuzzleData[i].currentStartDelay = delay + this._perMuzzleData[i].constantDelay;
            this._perMuzzleData[i].started = false;
            this._perMuzzleData[i].readyToStart = false;
            this._perMuzzleData[i].elapsedTime = 0;
        }
        else {
            this._perMuzzleData[i].currentStartDelay = Number.MAX_VALUE;
            this._perMuzzleData[i].started = false;
            this._perMuzzleData[i].readyToStart = false;
            this._perMuzzleData[i].elapsedTime = 0;
        }
    }
    this.isFiring = true;
}

EveTurretFiringFX.prototype.StartMuzzleEffect = function (muzzleID) {
    var stretch = this.stretch[muzzleID];
    for (var i = 0; i < stretch.curveSets.length; ++i) {
        var curveSet = stretch.curveSets[i];
        if (curveSet.name == 'play_start') {
            curveSet.PlayFrom(-this._perMuzzleData[muzzleID].currentStartDelay);
        }
        else if (curveSet.name == 'play_loop') {
            curveSet.PlayFrom(-this._perMuzzleData[muzzleID].currentStartDelay);
        }
        else if (curveSet.name == 'play_stop') {
            curveSet.Stop();
        }
    }
    this._perMuzzleData[muzzleID].started = true;
    this._perMuzzleData[muzzleID].readyToStart = false;
}

EveTurretFiringFX.prototype.StopFiring = function () {
    for (var j = 0; j < this.stretch.length; ++j) {
        var stretch = this.stretch[j];
        for (var i = 0; i < stretch.curveSets.length; ++i) {
            var curveSet = stretch.curveSets[i];
            if (curveSet.name == 'play_start') {
                curveSet.Stop();
            }
            else if (curveSet.name == 'play_loop') {
                curveSet.Stop();
            }
            else if (curveSet.name == 'play_stop') {
                curveSet.Play();
            }
        }
        this._perMuzzleData[j].started = false;
        this._perMuzzleData[j].readyToStart = false;
        this._perMuzzleData[j].currentStartDelay = 0;
        this._perMuzzleData[j].elapsedTime = 0;
    }
    this.isFiring = false;
}

EveTurretFiringFX.prototype.UpdateViewDependentData = function () {
    for (var j = 0; j < this.stretch.length; ++j) {
        this.stretch[j].UpdateViewDependentData();
    }
}
