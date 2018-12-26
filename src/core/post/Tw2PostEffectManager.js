import {generateID} from '../../global/util';
import {Tw2PostEffect} from './Tw2PostEffect';

/**
 * Tw2PostEffectManager
 *
 * @property {number|string} _id
 * @property {string} name
 * @property {boolean} display
 * @property {Array<Tw2PostEffect>} effects
 */
export class Tw2PostEffectManager
{

    _id = generateID();
    name = 'Post manager';
    display = true;
    items = [];


    /**
     * Alias for items
     * @returns {Array}
     */
    get effects()
    {
        return this.items;
    }

    /**
     * Creates an item from an object
     * @param {*} [opt={}]
     * @returns {Tw2PostEffect}
     */
    CreateItem(opt = {})
    {
        const postEffect = Tw2PostEffect.create(opt);
        this.AddItem(postEffect);
        return postEffect;
    }

    /**
     * Adds a post effect
     * @param {Tw2PostEffect} postEffect
     */
    AddItem(postEffect)
    {
        if (!this.items.includes(postEffect))
        {
            if (postEffect.index === -1)
            {
                postEffect.index = this.items.length;
            }

            this.items.push(postEffect);
        }
    }

    /**
     * Removes a post effect
     * @param {Tw2PostEffect} postEffect
     */
    RemoveItem(postEffect)
    {
        const index = this.items.indexOf(postEffect);
        if (index !== -1)
        {
            this.items.splice(index, 1);
        }
    }

    /**
     * Clears all post effects
     */
    ClearItems()
    {
        for (let i = 0; i < this.items.length; i++)
        {
            this.items[i].ClearItems();
        }
        this.items = [];
    }

    /**
     * Checks if all post effects are good
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
     * Keeps the post effects alive
     */
    KeepAlive()
    {
        for (let i = 0; i < this.items.length; i++)
        {
            this.items[i].KeepAlive();
        }
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
     * Per frame update
     * @param {number} dt - delta time
     */
    Update(dt)
    {
        for (let i = 0; i < this.items.length; i++)
        {
            this.items[i].Update(dt);
        }
    }

    /**
     * Per frame update
     * @returns {boolean} true if post was rendered
     */
    Render()
    {
        if (!this.display)
        {
            this.KeepAlive();
            return false;
        }

        let rendered = 0;
        for (let i = 0; i < this.items.length; i++)
        {
            if (this.items[i].Render())
            {
                rendered++;
            }
        }
        return !!rendered;
    }

    /**
     * Child constructor
     * @type {Tw2PostEffect}
     */
    static Item = Tw2PostEffect;

}
