/*eslint no-unused-vars:0 */
import {util} from '../../math';

/**
 * EveItem base class
 *
 * @property {number|string} _id
 * @property {string} name
 * @property {boolean} display
 * @property {boolean} _rebuildPending
 * @class
 */
export class EveItem
{
    constructor()
    {
        this._id = util.generateID();
        this.name = '';
        this.display = true;
        this._rebuildPending = false;
    }

    /**
     * Initializes the item
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
     * Gets the item's resources
     * @param {Array} [out=[]]
     * @returns {Array<Tw2Resource>} out
     */
    GetResources(out=[])
    {
        return out;
    }

    /**
     * Rebuilds the item
     */
    Rebuild()
    {
        this._rebuildPending = false;
    }

    /**
     * Per frame update
     * @param {number} dt - delta time
     * @constructor
     */
    Update(dt)
    {
        if (this._rebuildPending)
        {
            this.Rebuild();
        }
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    GetBatches(mode, accumulator)
    {

    }

    /**
     * Per frame update
     */
    Render()
    {

    }
}


/**
 * EveSetItem base class
 *
 * @property {number|string} _id     - The item's id
 * @property {string} name           - The item's name
 * @property {boolean} display       - Toggles item visibility
 * @property {?Function} _onModified - A callback which is fired when the item is modified
 * @class
 */
export class EveSetItem
{
    constructor()
    {
        this._id = util.generateID();
        this.name = '';
        this.display = true;
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

    /**
     * Fires when the item needs to be rebuilt
     * @param {EveObjectSet} parent
     */
    Rebuild(parent)
    {
        this._rebuildPending = false;
    }

    /**
     * Fires when the item is about to be removed/destroyed by it's parent
     */
    Destroy()
    {
        this._onModified = null;
    }
}


/**
 * EveObjectSet base class
 *
 * @property {Array<EveSetItem>} items
 * @property {Array<EveSetItem>} _visibleItems
 */
export class EveSet extends EveItem
{
    constructor()
    {
        super();
        this.items = [];
        this._visibleItems = [];
    }

    /**
     * Rebuilds the set
     */
    Rebuild()
    {
        this.RebuildItems();
        this._rebuildPending = false;
    }

    /**
     * Creates an item from an options object
     * @param {{}} opt             - An object containing the options required
     * @param {boolean} [doNotAdd] - Stops the newly created item from being added to the set
     * @returns {?EveSetItem}      - The newly created item, or null if it failed to create
     */
    CreateItem(opt={}, doNotAdd)
    {
        return null;
    }

    /**
     * Adds an item
     * @param {EveSetItem} item
     */
    AddItem(item)
    {
        if (!this.items.includes(item))
        {
            this.items.push(item);
            item._onModified = child => this.OnValueChanged(child);
            this.RebuildItems();
        }
    }

    /**
     * Removes an item
     * @param {EveSetItem} item
     */
    RemoveItem(item)
    {
        const index = this.items.indexOf(item);
        if (index !== -1)
        {
            item.Destroy();
            this.items.splice(index, 1);
            this.RebuildItems();
        }
    }

    /**
     * Clears all items
     */
    ClearItems()
    {
        for (let i = 0; i < this.items.length; i++)
        {
            this.RemoveItem(this.items[i]);
        }
        this.items = [];
        this.RebuildItems();
    }

    /**
     * Rebuilds all items
     */
    RebuildItems()
    {
        this._visibleItems = [];

        for (let i = 0; i < this.items.length; i++)
        {
            const item = this.items[i];

            if (!item._onModified)
            {
                item._onModified = item => this.OnValueChanged(item);
            }

            if (item.display)
            {
                this._visibleItems.push(item);
            }

            if (item._rebuildPending)
            {
                item.Rebuild(this);
            }
        }

        this._rebuildPending = true;
    }
}
