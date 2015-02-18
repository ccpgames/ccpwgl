function Tw2MayaVector3Curve() {
    this.xIndex = -1;
    this.yIndex = -1;
    this.zIndex = -1;
    this.animationEngine = null;
    this.name = '';
    this.value = vec3.create();
}

Tw2MayaVector3Curve.prototype.Initialize = function () {
    this.ComputeLength();
    return true;
}

Tw2MayaVector3Curve.prototype.GetLength = function () {
    return this.length;
}

Tw2MayaVector3Curve.prototype.UpdateValue = function (t) {
    if (this.animationEngine) {
        if (this.xIndex) {
            this.value[0] = this.animationEngine.Evaluate(this.xIndex, t);
        }
        if (this.yIndex) {
            if (this.yIndex == this.xIndex) {
                this.value[1] = this.value[0];
            }
            else {
                this.value[1] = this.animationEngine.Evaluate(this.yIndex, t);
            }
        }
        if (this.zIndex) {
            if (this.zIndex == this.xIndex) {
                this.value[2] = this.value[0];
            }
            else {
                this.value[2] = this.animationEngine.Evaluate(this.zIndex, t);
            }
        }
    }
}

Tw2MayaVector3Curve.prototype.ComputeLength = function () {
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

