/* eslint no-unused-vars:0 */
import {vec3, vec4, mat4, util} from '../../global';

/**
 * EveObjectSetItem base class
 *
 * @property {string|number} _id     - The set item's id
 * @property {string} name           - The set item's name
 * @property {boolean} display       - Toggles the set item's visibility
 * @property {?Function} _onModified - A callback which is fired on value changes
 */
export class EveObjectSetItem
{
    constructor()
    {
        this._id = util.generateID();
        this.name = '';
        this.display = true;
        this._rebuildPending = true;
        this._onModified = null;
    }

    /**
     * Fire on value changes
     */
    OnValueChanged()
    {
        this._rebuildPending = true;
        if (this._onModified) this._onModified(this);
    }
}

/**
 * EveObjectSet base class
 *
 * @property {number|String} _id                     - The set's id
 * @property {string} name                           - The set's name
 * @property {boolean} display                       - Toggles set visibility
 * @property {Array<EveObjectSetItem>} items         - The set's items
 * @property {Array<EveObjectSetItem>} _visibleItems - The set's items that will be rendered when the set is visible
 * @property {boolean} _rebuildPending               - Identifies if the set requires rebuilding
 * @class
 */
export class EveObjectSet
{
    constructor()
    {
        this._id = util.generateID();
        this.name = '';
        this.display = true;
        this.items = [];
        this._visibleItems = [];
        this._rebuildPending = false;
        this._onChildModified = item => this.OnValueChanged(item);
    }

    /**
     * Initializes the set
     */
    Initialize()
    {
        this.Rebuild();
    }

    /**
     * Fires on value changes
     */
    OnValueChanged()
    {
        this._rebuildPending = true;
    }

    /**
     * Creates an item from an options object and then adds it to the set
     * @param {*} [opt={}]
     * @returns {?EveObjectSetItem|*}
     */
    CreateItem(opt = {})
    {
        const Item = this.constructor.Item;
        if (Item && 'create' in Item)
        {
            const item = Item.create(opt);
            this.AddItem(item);
            return item;
        }
        return null;
    }

    /**
     * Adds a set item
     * @param {EveObjectSetItem|*} item
     */
    AddItem(item)
    {
        if (!this.items.includes(item))
        {
            item._onModified = this._onChildModified;
            this.items.push(item);
            this.OnValueChanged();
        }
    }

    /**
     * Removes a set item
     * @param {EveObjectSetItem|*} item
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
     * Clears all set items
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
     * Finds an item by it's id
     * @param {?number} [id=null]
     * @returns {?EveObjectSetItem|*}
     */
    FindItemByID(id = null)
    {
        if (id !== null)
        {
            for (let i = 0; i < this.items.length; i++)
            {
                if (this.items[i]._id === id)
                {
                    return this.items[i];
                }
            }
        }
        return null;
    }

    /**
     * Gets the set's resources
     * @param {Array} [out=[]]
     * @returns {Array<Tw2Resource>}
     */
    GetResources(out = [])
    {
        return out;
    }

    /**
     * Per frame update
     * @param {number} dt
     */
    Update(dt)
    {
        if (this._rebuildPending)
        {
            this.Rebuild();
        }
    }

    /**
     * Unloads the set's buffers
     */
    Unload()
    {

    }

    /**
     * Rebuilds the set
     */
    Rebuild()
    {
        this.constructor.RebuildItems(this);
        this._rebuildPending = false;
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData|Tw2BasicPerObjectData} perObjectData
     */
    GetBatches(mode, accumulator, perObjectData)
    {

    }

    /**
     * Renders the set
     */
    Render()
    {

    }

    /**
     * Rebuilds the set's items
     *
     * @param {EveObjectSet|*} eveSet
     */
    static RebuildItems(eveSet)
    {
        eveSet._visibleItems = [];
        for (let i = 0; i < eveSet.items.length; i++)
        {
            const item = eveSet.items[i];
            item._onModified = eveSet._onChildModified;

            if (item.display)
            {
                eveSet._visibleItems.push(item);
                item._rebuildPending = false;
            }
        }
    }
}

/**
 * The object set's item
 * @type {?Function}
 */
EveObjectSet.Item = null;

/**
 * Class global and scratch variables
 * @type {{vec3_0, vec3_1, vec3_2}}
 */
EveObjectSet.global = {
    vec3_0: vec3.create(),
    vec3_1: vec3.create(),
    vec3_2: vec3.create(),
    vec4_0: vec4.create(),
    vec4_1: vec4.create(),
    mat4_0: mat4.create()
};


