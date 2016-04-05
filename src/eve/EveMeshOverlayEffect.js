/**
 * Constructor for Overlay Effects
 * @property {boolean} display
 * @property {boolean} update
 * @property {Tw2CurveSet} curveSet
 * @property {string} name
 * @property {Array.<Tw2Effect>} opaqueEffects
 * @property {Array.<Tw2Effect>} decalEffects
 * @property {Array.<Tw2Effect>} transparentEffects
 * @property {Array.<Tw2Effect>} additiveEffects
 * @property {Array.<Tw2Effect>} distortionEffects - Currently doesn't work in ccpwgl
 * @constructor
 */
function EveMeshOverlayEffect()
{
    this.display = true;
    this.update = true;
    this.curveSet = null;
    this.name = '';
    this.opaqueEffects = [];
    this.decalEffects = [];
    this.transparentEffects = [];
    this.additiveEffects = [];
    this.distortionEffects = [];
}

/**
 * Per frame update
 * @param {number} dt - delta Time
 */
EveMeshOverlayEffect.prototype.Update = function(dt)
{
    if (this.update && this.curveSet)
    {
        this.curveSet.Update(dt);
    }
};

/**
 * Gets effects
 * @param {RenderMode} mode
 * @returns {Array.<Tw2Effect>}
 */
EveMeshOverlayEffect.prototype.GetEffects = function(mode)
{
    if (this.display)
    {
        switch (mode)
        {
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
    }
};
