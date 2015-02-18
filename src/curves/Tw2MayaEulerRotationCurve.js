function Tw2MayaEulerRotationCurve() {
    this.xIndex = -1;
    this.yIndex = -1;
    this.zIndex = -1;
    this.animationEngine = null;
    this.name = '';
    this.eulerValue = vec3.create();
    this.updateQuaternion = false;
    this.quatValue = quat4.create();
}

Tw2MayaEulerRotationCurve.prototype.Initialize = function () {
    this.ComputeLength();
    return true;
}

Tw2MayaEulerRotationCurve.prototype.GetLength = function () {
    return this.length;
}

Tw2MayaEulerRotationCurve.prototype.UpdateValue = function (t) {
    if (this.animationEngine) {
        if (this.xIndex) {
            this.eulerValue[0] = this.animationEngine.Evaluate(this.xIndex, t);
        }
        if (this.yIndex) {
            if (this.yIndex == this.xIndex) {
                this.eulerValue[1] = this.eulerValue[0];
            }
            else {
                this.eulerValue[1] = this.animationEngine.Evaluate(this.yIndex, t);
            }
        }
        if (this.zIndex) {
            if (this.zIndex == this.xIndex) {
                this.eulerValue[2] = this.eulerValue[0];
            }
            else {
                this.eulerValue[2] = this.animationEngine.Evaluate(this.zIndex, t);
            }
        }
        if (this.updateQuaternion) {
            var sinYaw = Math.sin(this.eulerValue[0] / 2);
            var cosYaw = Math.cos(this.eulerValue[0] / 2);
            var sinPitch = Math.sin(this.eulerValue[1] / 2);
            var cosPitch = Math.cos(this.eulerValue[1] / 2);
            var sinRoll = Math.sin(this.eulerValue[2] / 2);
            var cosRoll = Math.cos(this.eulerValue[2] / 2);
            this.quatValue[0] = sinYaw * cosPitch * sinRoll + cosYaw * sinPitch * cosRoll;
            this.quatValue[1] = sinYaw * cosPitch * cosRoll - cosYaw * sinPitch * sinRoll;
            this.quatValue[2] = cosYaw * cosPitch * sinRoll - sinYaw * sinPitch * cosRoll;
            this.quatValue[3] = cosYaw * cosPitch * cosRoll + sinYaw * sinPitch * sinRoll;
        }
    }
}

Tw2MayaEulerRotationCurve.prototype.ComputeLength = function () {
    if (!this.animationEngine || this.animationEngine.GetNumberOfCurves() == 0) {
        return;
    }
    this.length = 0;
    if (this.xIndex >= 0) {
        this.length = this.animationEngine.GetLength(this.xIndex);
    }
    if (this.yIndex >= 0) {
        this.length = Math.max(this.length, this.animationEngine.GetLength(this.yIndex));
    }
    if (this.zIndex >= 0) {
        this.length = Math.max(this.length, this.animationEngine.GetLength(this.zIndex));
    }
}

