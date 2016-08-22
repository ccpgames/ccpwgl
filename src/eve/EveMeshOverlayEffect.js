/**
 * Constructor for Overlay Effects
 * @property {boolean} update
 * @property {Tw2CurveSet} curveSet
 * @property {string} name
 * @property {Array.<Tw2Effect>} opaqueEffects
 * @property {Array.<Tw2Effect>} decalEffects
 * @property {Array.<Tw2Effect>} transparentEffects
 * @property {Array.<Tw2Effect>} additiveEffects
 * @property {Array.<Tw2Effect>} distortionEffects - Currently not supported
 * @property {boolean} display                     - Enables/ disables all batch accumulations
 * @property {{}} visible                          - Batch accumulation options for the overlay effect
 * @property {boolean} visible.opaqueEffects       - Enables/ disables opaque effect batch accumulation
 * @property {boolean} visible.decalEffects        - Enables/ disables decal effect batch accumulation
 * @property {boolean} visible.transparentEffects  - Enables/ disables transparent effect batch accumulation
 * @property {boolean} visible.additiveEffects     - Enables/ disables additive effect batch accumulation
 * @property {boolean} visible.distortionEffects   - Currently not supported
 * @constructor
 */
function EveMeshOverlayEffect()
{
    this.update = true;
    this.curveSet = null;
    this.name = '';
    this.opaqueEffects = [];
    this.decalEffects = [];
    this.transparentEffects = [];
    this.additiveEffects = [];
    this.distortionEffects = [];

    this.display = true;
    this.visible = {};
    this.visible.opaqueEffects = true;
    this.visible.decalEffects = true;
    this.visible.transparentEffects = true;
    this.visible.additiveEffects = true;
    this.visible.distortionEffects = false;
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
        if (mode == device.RM_OPAQUE && this.visible.opaqueEffects)
        {
            return this.opaqueEffects;
        }
        else if (mode == device.RM_TRANSPARENT && this.visible.transparentEffects)
        {
            return this.transparentEffects;
        }
        else if (mode == device.RM_ADDITIVE && this.visible.additiveEffects)
        {
            return this.additiveEffects;
        }
        else if (mode == device.RM_DECAL && this.visible.decalEffects)
        {
            return this.decalEffects;
        }
    }
};

/**
 * Gets Mesh Overlay resource objects
 * @param {Array} [out=[]] - Optional receiving array
 * @returns {Array.<Tw2EffectRes|Tw2TextureRes|Tw2GeometryRes>} [out]
 */
EveMeshOverlayEffect.prototype.GetResources = function(out)
{
    if (out === undefined)
    {
        out = [];
    }

    for (var type in this.visible)
    {
        if (this.visible.hasOwnProperty(type) && this[type].length)
        {
            for (var i = 0; i < this[type].length; i++)
            {
                this[type][i].GetResources(out);
            }
        }
    }

    return out;
};
