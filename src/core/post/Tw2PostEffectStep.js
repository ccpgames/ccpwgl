import {assignIfExists, generateID} from '../../global/util';
import {Tw2Effect} from '../mesh/Tw2Effect';

/**
 * Post effect step
 *
 * @property {string|number| _id                - A unique id
 * @property {string} name                      - the step's name
 * @property {boolean} display                  - toggles rendering
 * @property {number} [index=-1]                - the step's render order (defaults to the order it was added)
 * @property {Tw2Effect} effect                 - the step's effect
 * @property {?string} [target]                 - the step's render target name
 * @property {{string:string}} inputs           - the step's input render targets
 * @property {?Tw2RenderTarget} [_renderTarget] - the step's render target (if none is defined the current target is used)
 * @property {boolean} _rebuildPending          - identifies if the post is pending a rebuild
 * @property {?Function} _onModified            - a function which is called when the step is modified
 */
export class Tw2PostEffectStep
{
    constructor()
    {
        this._id = generateID();
        this.name = '';
        this.index = -1;
        this.display = true;
        this.effect = null;
        this.target = null;
        this.inputs = {};
        this._renderTarget = null;
        this._rebuildPending = true;
        this._onModified = null;
    }

    /**
     * Fires on value changes
     */
    OnValueChanged()
    {
        this._rebuildPending = true;
        if (this._onModified)
        {
            this._onModified(this);
        }
    }

    /**
     * Checks if the step is good
     * @returns {boolean}
     */
    IsGood()
    {
        return this.effect ? this.effect.IsGood() : false;
    }

    /**
     * Keeps the step alive
     */
    KeepAlive()
    {
        if (this.effect)
        {
            this.effect.KeepAlive();
        }
    }

    /**
     * Gets resources
     * @param {Array} [out=[]]
     * @returns {Array<Tw2Resource>} out
     */
    GetResources(out = [])
    {
        if (this.effect)
        {
            this.effect.GetResources(out);
        }
        return out;
    }

    /**
     * Creates a post effect step from an object
     * @param {*} [opt={}]
     * @returns {Tw2PostEffectStep}
     */
    static create(opt={})
    {
        const item = new this();
        assignIfExists(item, opt, ['name', 'display', 'target', 'index']);

        if (opt.inputs)
        {
            Object.assign(item.inputs, opt.inputs);
        }

        item.effect = Tw2Effect.create({
            name: opt.name,
            autoParameter: true,
            effectFilePath: opt.effectFilePath,
            parameters: opt.parameters,
            textures: opt.textures,
            overrides: opt.overrides
        });

        return item;
    }
}