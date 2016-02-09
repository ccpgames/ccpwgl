function EveMeshOverlayEffect() {
    this.display = true;
    this.update = true;
    this.curveSet = null;
    this.name = '';
    this.opaqueEffects = [];
    this.decalEffects = [];
    this.transparentEffects = [];
    this.additiveEffects = [];
}

EveMeshOverlayEffect.prototype.Update = function (dt) {
    if (this.curveSet) {
        this.curveSet.Update(dt);
    }
};

EveMeshOverlayEffect.prototype.GetEffects = function (mode) {
    switch (mode) {
        case device.RM_OPAQUE:
            return this.opaqueEffects;
        case device.RM_DECAL:
            return this.decalEffects;
        case device.RM_TRANSPARENT:
            return this.transparentEffects;
        case device.RM_ADDITIVE:
            return this.additiveEffects;
        default:
            return null;
    }
};