/**
 * Constructor for Overlay Effects
 * @property {Boolean} display
 * @property {Boolean} update
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
 * @param {Number} dt - delta Time
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

/**
 * Gets Mesh Overlay resource objects
 * @param {Array} [out=[]] - Optional receiving array
 * @returns {Array.<Tw2Res>} [out]
 */
EveMeshOverlayEffect.prototype.GetResources = function(out)
{
    if (out === undefined)
    {
        out = [];
    }

    var self = this;

    function getEffectResources(effectName, out)
    {
        for (var i = 0; i < self[effectName].length; i++)
        {
            self[effectName].GetResources(out);
        }
    }

    getEffectResources('opaqueEffects', out);
    getEffectResources('decalEffects', out);
    getEffectResources('transparentEffects', out);
    getEffectResources('additiveEffects', out);
    getEffectResources('distortionEffects', out);

    return out;
};
