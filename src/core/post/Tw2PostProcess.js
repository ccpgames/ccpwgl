import {device} from '../global';
import {Tw2RenderTarget} from '../Tw2RenderTarget';
import {Tw2Effect} from '../mesh';
import {Tw2TextureRes} from '../resource';

/**
 * Creates a bloom post effect
 *
 * @property {number} width
 * @property {number} height
 * @property {Tw2TextureRes} texture
 * @property {Tw2RenderTarget} quadRT0
 * @property {Tw2RenderTarget} quadRT1
 * @property {Array.<Tw2Effect|Object>} steps
 * @class
 */
export class Tw2PostProcess
{
    constructor()
    {
        this.width = 0;
        this.height = 0;
        this.texture = null;
        this.quadRT0 = new Tw2RenderTarget();
        this.quadRT1 = new Tw2RenderTarget();
        this.steps = [{
            'effect': Tw2Effect.create({
                effectFilePath: 'res:/Graphics/Effect/Managed/Space/PostProcess/ColorDownFilter4.fx',
                parameters: {
                    'g_texelSize': [1, 1, 1, 1],
                    'BlitCurrent': ''
                }
            }),
            'rt': this.quadRT1,
            'inputs': {
                'BlitCurrent': null
            }
        }, {
            'effect': Tw2Effect.create({
                effectFilePath: 'res:/Graphics/Effect/Managed/Space/PostProcess/ColorHighPassFilter.fx',
                parameters: {
                    'LuminanceThreshold': 0.85,
                    'LuminanceScale': 2,
                    'BlitCurrent': ''
                }
            }),
            'rt': this.quadRT0,
            'inputs': {
                'BlitCurrent': this.quadRT1
            }
        }, {
            'effect': Tw2Effect.create({
                effectFilePath: 'res:/Graphics/Effect/Managed/Space/PostProcess/ColorExpBlurHorizontalBig.fx',
                parameters: {
                    'g_texelSize': [1, 1, 1, 1],
                    'BlitCurrent': ''
                }
            }),
            'rt': this.quadRT1,
            'inputs': {
                'BlitCurrent': this.quadRT0
            }
        }, {
            'effect': Tw2Effect.create({
                effectFilePath: 'res:/Graphics/Effect/Managed/Space/PostProcess/ColorExpBlurVerticalBig.fx',
                parameters: {
                    'g_texelSize': [1, 1, 1, 1],
                    'BlitCurrent': ''
                }
            }),
            'rt': this.quadRT0,
            'inputs': {
                'BlitCurrent': this.quadRT1
            }
        }, {
            'effect': Tw2Effect.create({
                effectFilePath: 'res:/Graphics/Effect/Managed/Space/PostProcess/ColorUpFilter4_Add.fx',
                parameters: {
                    'g_texelSize': [1, 1, 1, 1],
                    'ScalingFactor': 1,
                    'BlitCurrent': '',
                    'BlitOriginal': ''
                }
            }),
            'rt': null,
            'inputs': {
                'BlitCurrent': this.quadRT0,
                'BlitOriginal': null
            }
        }];
    }

    /**
     * Internal render/update function. It is called every frame.
     */
    Render()
    {
        const
            width = device.viewportWidth,
            height = device.viewportHeight;

        if (width <= 0 || height <= 0) return;

        if (this.texture === null)
        {
            this.texture = new Tw2TextureRes();
            this.texture.Attach(device.gl.createTexture());
        }

        if (width !== this.width || height !== this.height)
        {
            device.gl.bindTexture(device.gl.TEXTURE_2D, this.texture.texture);
            device.gl.texImage2D(device.gl.TEXTURE_2D, 0, device.gl.RGBA, width, height, 0, device.gl.RGBA, device.gl.UNSIGNED_BYTE, null);
            device.gl.bindTexture(device.gl.TEXTURE_2D, null);

            this.quadRT0.Create(width / 4, height / 4, false);
            this.quadRT1.Create(width / 4, height / 4, false);

            this.width = width;
            this.height = height;

            for (let i = 0; i < this.steps.length; ++i)
            {
                const step = this.steps[i];
                for (let name in step.inputs)
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
                    const
                        size = step.effect.parameters['g_texelSize'],
                        rt = step.inputs['BlitCurrent'];

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

        for (let i = 0; i < this.steps.length; ++i)
        {
            const step = this.steps[i];
            if (step.rt !== null)
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
    }
}
