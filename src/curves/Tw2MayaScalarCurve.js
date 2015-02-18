function Tw2MayaScalarCurve() {
    this.index = -1;
    this.animationEngine = null;
    this.name = '';
    this.value = 0;
    this.length = 0;
}

Tw2MayaScalarCurve.prototype.Initialize = function () {
    this.ComputeLength();
    return true;
}

Tw2MayaScalarCurve.prototype.GetLength = function () {
    return this.length;
}

Tw2MayaScalarCurve.prototype.UpdateValue = function (t) {
    if (this.animationEngine) {
        this.value = this.animationEngine.Evaluate(this.index, t);
    }
}

Tw2MayaScalarCurve.prototype.ComputeLength = function () {
    if (!this.animationEngine || this.animationEngine.GetNumberOfCurves() == 0) {
        return;
    }
    if (this.index >= 0) {
        this.length = this.animationEngine.GetLength(this.index);
    }
}

