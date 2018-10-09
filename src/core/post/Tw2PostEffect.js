import {device} from '../../global';
import {assignIfExists, generateID} from '../../global/util';
import {Tw2RenderTarget} from '../Tw2RenderTarget';
import {Tw2TextureRes} from '../resource/Tw2TextureRes';
import {Tw2TextureParameter, Tw2Vector4Parameter} from '../parameter';
import {Tw2PostEffectStep} from './Tw2PostEffectStep';

/**
 * Tw2PostEffect
 *
 * @property {string|number} _id                      - A unique id
 * @property {string} name                            - the post effect's name
 * @property {boolean} display                        - toggles rendering
 * @property {number} [index=-1]                      - the post effect's render order (defaults to the order the effect is added)
 * @property {number} width                           - the post effect's width
 * @property {number} height                          - the post effect's height
 * @property {Tw2TextureRes} texture                  - the output texture
 * @property {?Tw2CurveSet} curveSet                  - optional curve set
 * @property {{string:Tw2RenderTarget}} targets       - render targets
 * @property {Array<Tw2PostEffectStep>} steps         - post effect steps
 * @property {Array<Tw2PostEffectStep>} _visibleItems - visible and ordered post effect steps
 * @property {boolean} _rebuildPending                - identifies if the post is pending a rebuild
 * @property {Function} _onChildModified              - a function called when a child step is modified
 * @property {?Function} _onModified                  - a function which is called when the post effect is modified
 */
export class Tw2PostEffect
{
    constructor()
    {
        this._id = generateID();
        this.name = '';
        this.display = true;
        this.index = -1;
        this.width = 0;
        this.height = 0;
        this.texture = null;
        this.curveSet = null;
        this.targets = {};
        this.items = [];
        this._visibleItems = [];
        this._rebuildPending = true;
        this._onChildModified = item => this.OnValueChanged(item);
    }

    /**
     * Alias for items
     * @returns {Array}
     */
    get steps()
    {
        return this.items;
    }

    /**
     * Fires on value changes
     */
    OnValueChanged()
    {
        this._rebuildPending = true;
    }

    /**
     * Checks if the post effect is good
     * @returns {boolean}
     */
    IsGood()
    {
        let isGood = 0;
        for (let i = 0; i < this.items.length; i++)
        {
            if (this.items[i].IsGood())
            {
                isGood++;
            }
        }
        return isGood === this.items.length;
    }

    /**
     * Keeps the post effect alive
     */
    KeepAlive()
    {
        this.items.forEach(item => item.KeepAlive());
    }

    /**
     * Gets resources
     * @param {Array} [out=[]]
     * @returns {Array<Tw2Resource>} out
     */
    GetResources(out = [])
    {
        for (let i = 0; i < this.items.length; i++)
        {
            this.items[i].GetResources(out);
        }
        return out;
    }

    /**
     * Creates an item
     * @param {*} [opt={}]
     * @returns {Tw2PostEffectStep}
     */
    CreateItem(opt = {})
    {
        const item = Tw2PostEffectStep.create(opt);
        this.AddItem(item);
        return item;
    }

    /**
     * Adds an item
     * @param {Tw2PostEffectStep} item
     */
    AddItem(item)
    {
        if (!this.items.includes(item))
        {
            item._onModified = this._onChildModified;

            if (item.index === -1)
            {
                item.index = this.items.length;
            }

            this.items.push(item);
            this.OnValueChanged();
        }
    }

    /**
     * Removes an item
     * @param {Tw2PostEffectStep} item
     */
    RemoveItem(item)
    {
        const index = this.items.indexOf(item);
        if (index !== -1)
        {
            item._onModified = null;
            this.items.splice(index, 1);
            this.OnValueChanged();
        }
    }

    /**
     * Clears all items
     */
    ClearItems()
    {
        for (let i = 0; i < this.items.length; i++)
        {
            this.items[i]._onModified = null;
        }
        this.items = [];
        this.OnValueChanged();
    }

    /**
     * Gets a render target by it's name
     * @param {?string} name
     * @returns {?Tw2RenderTarget}
     */
    GetTarget(name)
    {
        return name && name in this.targets ? this.targets[name] : null;
    }

    /**
     * Checks if a render target exists
     * @param {string} name
     * @returns {boolean}
     * @constructor
     */
    HasTarget(name)
    {
        return !!(name && this.targets[name]);
    }

    /**
     * Creates a render target
     * - If the render target doesn't exist it will be created
     * @param {string} name
     * @param {number} [width=device.viewportWidth]
     * @param {number} [height=device.viewportHeight]
     * @returns {Tw2RenderTarget}
     */
    CreateTarget(name, width=device.viewportWidth, height= device.viewportHeight)
    {
        if (!this.targets[name])
        {
            this.targets[name] = new Tw2RenderTarget();
            this.targets[name].name = name;
        }

        this.targets[name].Create(width, height, false);
        return this.targets[name];
    }
    
    /**
     * Per frame update
     * @param {number} dt
     */
    Update(dt)
    {
        if (this.curveSet)
        {
            this.curveSet.Update(dt);
        }
    }

    /**
     * Per frame update
     * @returns {boolean}
     */
    Render()
    {
        const
            d = device,
            gl = d.gl,
            width = d.viewportWidth,
            height = d.viewportHeight;

        if (!this.IsGood() || !this.display || width <= 0 || height <= 0)
        {
            return false;
        }

        if (width !== this.width || height !== this.height || this._rebuildPending || !this.texture)
        {
            if (!this.texture)
            {
                this.texture = new Tw2TextureRes();
                this.texture.Attach(gl.createTexture());
            }

            gl.bindTexture(gl.TEXTURE_2D, this.texture.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.bindTexture(gl.TEXTURE_2D, null);

            this.width = width;
            this.height = height;

            // Update targets (Defined on the effect)
            for (const name in this.targets)
            {
                if (this.targets.hasOwnProperty(name))
                {
                    this.CreateTarget(name, width, height);
                }
            }

            // Rebuild items
            this._visibleItems = [];
            for (let i = 0; i < this.items.length; ++i)
            {
                const
                    item = this.items[i],
                    inputs = item.inputs,
                    effect = item.effect,
                    shader = effect.shader,
                    parameters = effect.parameters;
                
                // Auto create current blit
                if (shader.HasTexture('BlitCurrent' && !parameters.BlitCurrent))
                {
                    parameters['BlitCurrent'] = new Tw2TextureParameter('BlitCurrent', 'rgba:/0,0,0,255');
                }
                
                // Auto create original blit
                if (shader.HasTexture('BlitOriginal' && !parameters.BlitOriginal))
                {
                    parameters['BlitOriginal'] = new Tw2TextureParameter('BlitOriginal', 'rgba:/0,0,0,255');
                }

                // Setup step render target
                if (item.target)
                {
                    // Auto create target (Defined on the step)
                    if (!this.HasTarget(item.target))
                    {
                        this.CreateTarget(item.target, width, height);
                    }

                    item._renderTarget = this.GetTarget(item.target);
                }
                else
                {
                    item._renderTarget = null;
                }

                // Assign render targets to textures
                for (let texture in inputs)
                {
                    if (inputs.hasOwnProperty(texture))
                    {
                        // Ensure input is supported
                        if (!shader.HasTexture(texture))
                        {
                            console.warn(`Invalid input parameter ${texture}`);
                            delete inputs[texture];
                        }
                        else
                        {
                            // Ensure step texture exists
                            if (!parameters[texture])
                            {
                                parameters[texture] = new Tw2TextureParameter(texture);
                            }

                            const
                                parameter = parameters[texture],
                                target = inputs[texture];

                            if (target)
                            {
                                // Auto create target
                                if (!this.HasTarget(target))
                                {
                                    this.CreateTarget(target, width, height);
                                }

                                parameter.SetTextureRes(this.GetTarget(target).texture);
                            }
                            else
                            {
                                parameter.SetTextureRes(this.texture);
                            }
                        }
                    }
                }

                // Update texel size if required
                if ('BlitCurrent' in inputs && shader.HasConstant('g_texelSize'))
                {
                    // Auto create parameter if required
                    if (!parameters['g_texelSize'])
                    {
                        parameters['g_texelSize'] = new Tw2Vector4Parameter('g_texelSize', [1, 1, 1, 1]);
                    }

                    const
                        size = parameters['g_texelSize'],
                        renderTarget = this.GetTarget(inputs.BlitCurrent);

                    if (renderTarget)
                    {
                        size.value[0] = 1.0 / renderTarget.width;
                        size.value[1] = 1.0 / renderTarget.width;
                    }
                    else
                    {
                        size.value[0] = 1.0 / width;
                        size.value[1] = 1.0 / width;
                    }

                    size.OnValueChanged();
                }

                if (item.display)
                {
                    this._visibleItems.push(item);
                }

                item._rebuildPending = false;
            }

            // Update item sort order
            this._visibleItems.sort((a, b) =>
            {
                return a.index - b.index;
            });

            this.rebuildPending = false;
        }

        gl.bindTexture(gl.TEXTURE_2D, this.texture.texture);
        gl.copyTexImage2D(gl.TEXTURE_2D, 0, d.alphaBlendBackBuffer ? gl.RGBA : gl.RGB, 0, 0, width, height, 0);
        gl.bindTexture(gl.TEXTURE_2D, null);
        d.SetStandardStates(device.RM_OPAQUE);

        let didPost = 0;
        for (let i = 0; i < this._visibleItems.length; ++i)
        {
            const item = this._visibleItems[i];
            if (item.display)
            {
                if (item._renderTarget)
                {
                    item._renderTarget.Set();
                }
                else
                {
                    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                    gl.viewport(0, 0, width, height);
                }
                d.RenderFullScreenQuad(item.effect);
                didPost++;
            }
        }

        return !!didPost;
    }

    /**
     * Creates a post effect from an object
     * @param {*} [opt={}]
     * @returns {Tw2PostEffect}
     */
    static create(opt={})
    {
        const postEffect = new this();

        assignIfExists(postEffect, opt, ['name', 'display', 'index']);

        if (opt.targets)
        {
            for (let i = 0; i < opt.targets.length; i++)
            {
                postEffect.targets[opt.targets[i]] = null;
            }
        }

        if (opt.steps)
        {
            for (let i = 0; i < opt.steps.length; i++)
            {
                postEffect.CreateItem(opt.steps[i]);
            }
        }

        return postEffect;
    }

    /**
     * Child constructor
     * @type {Tw2PostEffectStep}
     */
    static Item = Tw2PostEffectStep;
}
