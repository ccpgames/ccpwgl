/**
 * Creates a bloom post effect
 * @property {number} width
 * @property {number} height
 * @property {Tw2TextureRes} texture
 * @property {Tw2RenderTarget} quadRT0
 * @property {Tw2RenderTarget} quadRT1
 * @property {Array.<Tw2Effect|Object>} steps
 * @constructor
 */
function Tw2PostProcess()
{
    this.width = 0;
    this.height = 0;

    this.texture = null;
    this.quadRT0 = new Tw2RenderTarget();
    this.quadRT1 = new Tw2RenderTarget();

    this.steps = [];
    this.steps[0] = new Tw2Effect();
    this.steps[0] = {
        'effect': new Tw2Effect(),
        'rt': this.quadRT1,
        'inputs':
        {
            'BlitCurrent': null
        }
    };
    this.steps[0].effect.effectFilePath = 'res:/Graphics/Effect/Managed/Space/PostProcess/ColorDownFilter4.fx';
    this.steps[0].effect.Initialize();
    this.steps[0].effect.parameters['BlitCurrent'] = new Tw2TextureParameter('BlitCurrent');
    this.steps[0].effect.parameters['g_texelSize'] = new Tw2Vector4Parameter('g_texelSize');

    this.steps[1] = new Tw2Effect();
    this.steps[1] = {
        'effect': new Tw2Effect(),
        'rt': this.quadRT0,
        'inputs':
        {
            'BlitCurrent': this.quadRT1
        }
    };
    this.steps[1].effect.effectFilePath = 'res:/Graphics/Effect/Managed/Space/PostProcess/ColorHighPassFilter.fx';
    this.steps[1].effect.Initialize();
    this.steps[1].effect.parameters['BlitCurrent'] = new Tw2TextureParameter('BlitCurrent');
    this.steps[1].effect.parameters['LuminanceThreshold'] = new Tw2FloatParameter('LuminanceThreshold', 0.85);
    this.steps[1].effect.parameters['LuminanceScale'] = new Tw2FloatParameter('LuminanceScale', 2);

    this.steps[2] = new Tw2Effect();
    this.steps[2] = {
        'effect': new Tw2Effect(),
        'rt': this.quadRT1,
        'inputs':
        {
            'BlitCurrent': this.quadRT0
        }
    };
    this.steps[2].effect.effectFilePath = 'res:/Graphics/Effect/Managed/Space/PostProcess/ColorExpBlurHorizontalBig.fx';
    this.steps[2].effect.Initialize();
    this.steps[2].effect.parameters['BlitCurrent'] = new Tw2TextureParameter('BlitCurrent');
    this.steps[2].effect.parameters['g_texelSize'] = new Tw2Vector4Parameter('g_texelSize');

    this.steps[3] = new Tw2Effect();
    this.steps[3] = {
        'effect': new Tw2Effect(),
        'rt': this.quadRT0,
        'inputs':
        {
            'BlitCurrent': this.quadRT1
        }
    };
    this.steps[3].effect.effectFilePath = 'res:/Graphics/Effect/Managed/Space/PostProcess/ColorExpBlurVerticalBig.fx';
    this.steps[3].effect.Initialize();
    this.steps[3].effect.parameters['BlitCurrent'] = new Tw2TextureParameter('BlitCurrent');
    this.steps[3].effect.parameters['g_texelSize'] = new Tw2Vector4Parameter('g_texelSize');

    this.steps[4] = new Tw2Effect();
    this.steps[4] = {
        'effect': new Tw2Effect(),
        'rt': null,
        'inputs':
        {
            'BlitCurrent': this.quadRT0,
            'BlitOriginal': null
        }
    };
    this.steps[4].effect.effectFilePath = 'res:/Graphics/Effect/Managed/Space/PostProcess/ColorUpFilter4_Add.fx';
    this.steps[4].effect.Initialize();
    this.steps[4].effect.parameters['BlitCurrent'] = new Tw2TextureParameter('BlitCurrent');
    this.steps[4].effect.parameters['BlitOriginal'] = new Tw2TextureParameter('BlitOriginal');
    this.steps[4].effect.parameters['g_texelSize'] = new Tw2Vector4Parameter('g_texelSize');
    this.steps[4].effect.parameters['ScalingFactor'] = new Tw2FloatParameter('ScalingFactor', 1);
}

/**
 * Internal render/update function. It is called every frame.
 * @prototype
 */
Tw2PostProcess.prototype.Render = function()
{
    var step, i;

    var width = device.viewportWidth;
    var height = device.viewportHeight;
    if (width <= 0 || height <= 0)
    {
        return;
    }
    if (this.texture == null)
    {
        this.texture = new Tw2TextureRes();
        this.texture.Attach(device.gl.createTexture());
    }
    if (width != this.width || height != this.height)
    {
        device.gl.bindTexture(device.gl.TEXTURE_2D, this.texture.texture);
        device.gl.texImage2D(device.gl.TEXTURE_2D, 0, device.gl.RGBA, width, height, 0, device.gl.RGBA, device.gl.UNSIGNED_BYTE, null);
        device.gl.bindTexture(device.gl.TEXTURE_2D, null);

        this.quadRT0.Create(width / 4, height / 4, false);
        this.quadRT1.Create(width / 4, height / 4, false);

        this.width = width;
        this.height = height;

        for (i = 0; i < this.steps.length; ++i)
        {
            step = this.steps[i];
            for (var name in step.inputs)
            {
                if (step.inputs.hasOwnProperty(name))
                {
                    if (step.inputs[name])
                    {
                        step.effect.parameters[name].textureRes = step.inputs[name].texture;
                    }
                    else
                    {
                        step.effect.parameters[name].textureRes = this.texture;
                    }
                }
            }
            if ('g_texelSize' in step.effect.parameters && 'BlitCurrent' in step.inputs)
            {
                var size = step.effect.parameters['g_texelSize'];
                var rt = step.inputs['BlitCurrent'];
                if (rt)
                {
                    size.value[0] = 1.0 / rt.width;
                    size.value[1] = 1.0 / rt.width;
                }
                else
                {
                    size.value[0] = 1.0 / width;
                    size.value[1] = 1.0 / width;
                }
                size.OnValueChanged();
            }
        }
    }
    device.gl.bindTexture(device.gl.TEXTURE_2D, this.texture.texture);
    device.gl.copyTexImage2D(device.gl.TEXTURE_2D, 0, device.alphaBlendBackBuffer ? device.gl.RGBA : device.gl.RGB, 0, 0, width, height, 0);
    device.gl.bindTexture(device.gl.TEXTURE_2D, null);

    device.SetStandardStates(device.RM_OPAQUE);

    for (i = 0; i < this.steps.length; ++i)
    {
        step = this.steps[i];
        if (step.rt != null)
        {
            step.rt.Set();
        }
        else
        {
            device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, null);
            device.gl.viewport(0, 0, width, height);
        }
        device.RenderFullScreenQuad(step.effect);
    }
};
