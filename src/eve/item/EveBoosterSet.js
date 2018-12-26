import {vec3, vec4, mat4, util, device} from '../../global';
import {Tw2VertexDeclaration, Tw2PerObjectData, Tw2RenderBatch} from '../../core';
import {EveObjectSet, EveObjectSetItem} from './EveObjectSet';

/**
 * Booster render batch
 *
 * @property {EveBoosterSet} boosters
 * @class
 */
export class EveBoosterBatch extends Tw2RenderBatch
{

    boosters = null;


    /**
     * Commits the batch
     * @param {string} technique - technique name
     */
    Commit(technique)
    {
        this.boosters.Render(technique);
    }
}

/**
 * EveBoosterSetItem
 *
 * @param {boolean} enableCustomValues   - Enables custom values
 * @property {{}} visible                - Visibility options
 * @property {boolean} visible.halo      - Toggles halo visibility
 * @property {boolean} visible.symHalo   - Toggles symmetrical halo visibility
 * @property {boolean} visible.glow      - Toggles glow visibility
 * @property {boolean} visible.trail     - Toggles trail visibility (not implemented)
 * @property {?string} locatorName       - The item's locator name, if it was built from one
 * @property {boolean} updateFromLocator - Sets whether the item should be updated when it's locator is
 * @property {mat4} transform            - The item's local transform
 * @property {number} atlas0             - The item's atlas index 0
 * @property {number} atlas1             - The item's atlas index 1
 * @property {number} seed               - A random seed which affects any glows built from this item
 * @property {number} wavePhase          - A random seed which affects the booster wave pattern
 * @property {*} customValues            - An optional object containing custom values
 * @class
 */
export class EveBoosterSetItem extends EveObjectSetItem
{

    visible = {
        glow: true,
        symHalo: true,
        halo: true,
        trail: true,
        customValues: true
    };
    locatorName = null;
    updateFromLocator = false;
    seed = Math.random() * 7;
    wavePhase = Math.random();
    atlas0 = 0;
    atlas1 = 0;
    transform = mat4.create();
    customValues = null;


    /**
     * Gets the item's position
     * @param {vec3} out
     * @returns {vec3} out
     */
    GetPosition(out)
    {
        return mat4.getTranslation(out, this.transform);
    }

    /**
     * Gets the item's direction
     * @param {vec3} out
     * @returns {vec3} out
     */
    GetDirection(out)
    {
        vec3.set(out, this.transform[8], this.transform[9], this.transform[10]);
        vec3.normalize(out, out);
        const scale = this.GetScale();
        if (scale < 3) vec3.scale(out, out, scale / 3);
        return out;
    }

    /**
     * Gets the item's scale
     * @returns {number}
     */
    GetScale()
    {
        const tr = this.transform;
        return Math.max(vec3.length([tr[0], tr[1], tr[2]]), vec3.length([tr[4], tr[5], tr[6]]));
    }

    /**
     * Creates an item from an object
     * @param {*} [opt={}]
     * @returns {EveBoosterSetItem}
     */
    static create(opt = {})
    {
        const item = new this();
        util.assignIfExists(item.visible, opt.visible, ['glow', 'symHalo', 'halo', 'trail']);
        util.assignIfExists(item, opt, [
            'name', 'display', 'seed', 'wavePhase', 'transform',
            'locatorName', 'updateFromLocator', 'atlas0', 'atlas1'
        ]);
        return item;
    }

}


/**
 * EveBoosterSet
 *
 * @property {{}} visible                      - Visibility controls
 * @property {boolean} visible.glows           - Toggles glow visibility
 * @property {boolean} visible.symHalos        - Toggles symmetrical halo visibility
 * @property {boolean} visible.halos           - Toggles halo visibility
 * @property {boolean} visible.trails          - Toggles trails visibility (Not implemented)
 * @property {Tw2Effect} effect                - The booster's booster effect
 * @property {?Tw2Effect} glows                - The booster's glows (sprites)
 * @property {number} maxVel                   - (Not implemented)
 * @property {boolean} alwaysOn                - (Not implemented)
 * @property {number} glowDistance             - The distance between the booster's locators and glow sprites
 * @property {number} glowScale                - The base scale of the booster's glow sprites
 * @property {vec4} glowColor                  - The color of the booster set's glow sprites
 * @property {vec4} warpGlowColor              - The color of the booster set's glow sprites when warping (Not implemented)
 * @property {number} haloDistance             - The distance between the booster set's locators and halo sprites
 * @property {number} haloScaleX               - The base vertical scale of the booster set's halos
 * @property {number} haloScaleY               - The base horizontal scale of the booster set's halos
 * @property {vec4} haloColor                  - The color of the booster set's halo sprites
 * @property {vec4} warpHaloColor              - The color of the booster set's halo sprites when warping (Not implemented)
 * @property {vec4} trailSize                  - The booster set's trail size (Not implemented)
 * @property {vec4} trailColor                 - The booster set's trail color (Not implemented)
 * @property {number} symHaloDistance          - The distance between the booster set's locators and symmetrical halo sprites
 * @property {number} symHaloScale             - The base scale of the booster set's symmetrical halos
 * @property {mat4} _parentTransform           - The booster set's parent's transform
 * @property {WebGLBuffer} _positions          - The booster set's webgl buffer
 * @property {Tw2VertexDeclaration} _decl      - The booster set's vertex declarations
 * @property {Tw2PerObjectData} _perObjectData - The booster set's shader data
 * @property {boolean} _locatorRebuildPending  - Identifies that the booster set needs to be rebuilt from locators
 * @class
 */
export class EveBoosterSet extends EveObjectSet
{

    visible = {
        glows: true,
        symHalos: true,
        halos: true,
        trails: true
    };
    effect = null;
    glows = null;
    alwaysOn = true;
    maxVel = 250;
    glowDistance = 2.5;
    glowScale = 1.0;
    glowColor = vec4.create();
    warpGlowColor = vec4.create();
    haloDistance = 3.01;
    haloScaleX = 1.0;
    haloScaleY = 1.0;
    haloColor = vec4.create();
    warpHaloColor = vec4.create();
    symHaloDistance = 3;
    symHaloScale = 1.0;
    trailColor = vec4.create();
    trailSize = vec4.create();
    _parentTransform = mat4.create();
    _positions = null;
    _decl = new Tw2VertexDeclaration(EveBoosterSet.vertexDeclarations);
    _perObjectData = new Tw2PerObjectData(EveBoosterSet.perObjectData);
    _locatorRebuildPending = true;


    /**
     * Finds a booster item that belongs to a locator by it's name
     * @param {string} locatorName
     * @returns {?EveBoosterSetItem}
     */
    FindItemByLocatorName(locatorName)
    {
        for (let i = 0; i < this.items.length; i++)
        {
            if (this.items[i].locatorName && this.items[i].locatorName === locatorName)
            {
                return this.items[i];
            }
        }
        return null;
    }

    /**
     * Updates booster items that were built from locators
     * @param {Array.<EveLocator>} locators
     */
    UpdateItemsFromLocators(locators)
    {
        const items = Array.from(this.items);

        for (let i = 0; i < locators.length; i++)
        {
            const {name, transform, atlasIndex0, atlasIndex1} = locators[i];

            let item = this.FindItemByLocatorName(name);
            if (!item)
            {
                this.CreateItem({
                    name: name,
                    locatorName: name,
                    updateFromLocator: true,
                    atlas0: atlasIndex0,
                    atlas1: atlasIndex1,
                    transform: transform
                });
            }
            else
            {
                items.splice(items.indexOf(item), 1);

                if (item.updateFromLocator)
                {
                    mat4.copy(item.transform, transform);
                    item.atlas0 = atlasIndex0;
                    item.atlas1 = atlasIndex1;
                    item.OnValueChanged();
                }
            }
        }

        for (let i = 0; i < items.length; i++)
        {
            if (items[i].locatorName !== null)
            {
                this.RemoveItem(items[i]);
                i--;
            }
        }

        this._locatorRebuildPending = false;

        if (this._rebuildPending)
        {
            this.Rebuild();
        }
    }

    /**
     * Rebuilds the booster set from it's parent's locators
     */
    RebuildItemsFromLocators()
    {
        this._locatorRebuildPending = true;
    }

    /**
     * Gets booster set resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.effect)
        {
            this.effect.GetResources(out);
        }

        if (this.glows)
        {
            this.glows.effect.GetResources(out);
        }

        return out;
    }

    /**
     * Per frame update
     * @param {number} dt - DeltaTime
     * @param {mat4} parentMatrix
     */
    Update(dt, parentMatrix)
    {
        mat4.copy(this._parentTransform, parentMatrix);
        if (this._rebuildPending) this.Rebuild();
        if (this.glows) this.glows.Update(dt);
    }

    /**
     * Unloads the booster's buffers
     */
    Unload()
    {
        if (this._positions)
        {
            device.gl.deleteBuffer(this._positions);
            this._positions = null;
        }

        if (this.glows)
        {
            this.glows.Unload();
        }
    }

    /**
     * Rebuilds the boosters
     */
    Rebuild()
    {
        this.constructor.RebuildItems(this);
        const itemCount = this._visibleItems.length;
        this._rebuildPending = false;
        if (!itemCount) return;

        const
            d = device,
            box = EveBoosterSet._box,
            data = new Float32Array(itemCount * box.length * 6 * 28),
            order = [0, 3, 1, 3, 2, 1];

        let index = 0;
        for (let i = 0; i < itemCount; ++i)
        {
            const item = this._visibleItems[i];
            for (let b = 0; b < box.length; ++b)
            {
                for (let j = 0; j < order.length; ++j)
                {
                    data[index++] = box[b][order[j]][0];
                    data[index++] = box[b][order[j]][1];
                    data[index++] = box[b][order[j]][2];
                    data[index++] = 0;
                    data[index++] = 0;
                    data.set(item.transform, index);
                    index += 16;
                    data[index++] = 0;
                    data[index++] = 1;
                    data[index++] = 1;
                    data[index++] = 1;
                    data[index++] = item.wavePhase;
                    data[index++] = item.atlas0;
                    data[index++] = item.atlas1;
                }
            }
        }

        this._positions = d.gl.createBuffer();
        d.gl.bindBuffer(d.gl.ARRAY_BUFFER, this._positions);
        d.gl.bufferData(d.gl.ARRAY_BUFFER, data, d.gl.STATIC_DRAW);
        d.gl.bindBuffer(d.gl.ARRAY_BUFFER, null);
        this._positions.count = itemCount * 12 * 3;

        if (this.glows) this.glows.Rebuild();
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (!this.display || mode !== device.RM_ADDITIVE || !this._positions || !this._visibleItems.length) return;

        if (this.effect)
        {
            const batch = new EveBoosterBatch();
            mat4.transpose(this._perObjectData.perObjectVSData.Get('WorldMat'), this._parentTransform);
            this._perObjectData.perObjectVSData.Set('Shipdata', perObjectData.perObjectVSData.Get('Shipdata'));
            this._perObjectData.perObjectPSData = perObjectData.perObjectPSData;
            batch.perObjectData = this._perObjectData;
            batch.boosters = this;
            batch.renderMode = device.RM_ADDITIVE;
            accumulator.Commit(batch);
        }

        if (this.glows)
        {
            this.glows.GetBoosterGlowBatches(
                mode,
                accumulator,
                perObjectData,
                this._parentTransform,
                perObjectData.perObjectVSData.Get('Shipdata')[0],
                0
            );
        }
    }

    /**
     * Renders the accumulated batches
     * @param {string} technique - technique name
     * @returns {boolean}
     */
    Render(technique)
    {
        if (!this.effect || !this.effect.IsGood()) return false;

        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._positions);
        for (let pass = 0; pass < this.effect.GetPassCount(technique); ++pass)
        {
            this.effect.ApplyPass(technique, pass);
            if (!this._decl.SetDeclaration(this.effect.GetPassInput(technique, pass), 112)) return false;
            device.ApplyShadowState();
            device.gl.drawArrays(device.gl.TRIANGLES, 0, this._positions.count);
        }
        return true;
    }

    /**
     * Rebuilds a booster set's items
     * @param {EveBoosterSet} boosters
     */
    static RebuildItems(boosters)
    {
        const
            glows = boosters.glows,
            g = EveBoosterSet.global,
            spritePos = g.vec3_0;

        if (glows) glows.ClearItems();
        boosters._visibleItems = [];

        for (let i = 0; i < boosters.items.length; i++)
        {
            const item = boosters.items[i];
            item._onModified = boosters._onChildModified;

            if (item.display)
            {
                boosters._visibleItems.push(item);

                if (glows)
                {
                    const
                        src = item.customValues && item.customValues.display ? item.customValues : boosters,
                        pos = item.GetPosition(g.vec3_1),
                        dir = item.GetDirection(g.vec3_2),
                        scale = item.GetScale();

                    if (boosters.visible.glows && item.visible.glow)
                    {
                        glows.CreateItem({
                            name: item.name + '_glow',
                            position: vec3.subtract(spritePos, pos, vec3.scale(spritePos, dir, src.glowDistance)),
                            blinkRate: item.seed,
                            blinkPhase: item.seed,
                            minScale: src.glowScale * scale,
                            maxScale: src.glowScale * scale,
                            color: src.glowColor,
                            warpColor: src.warpGlowColor
                        });
                    }

                    if (boosters.visible.symHalos && item.visible.symHalo)
                    {
                        glows.CreateItem({
                            name: item.name + '_symHalo',
                            position: vec3.subtract(spritePos, pos, vec3.scale(spritePos, dir, src.symHaloDistance)),
                            blinkRate: item.seed,
                            blinkPhase: item.seed + 1,
                            minScale: src.symHaloScale * scale,
                            maxScale: src.symHaloScale * scale,
                            color: src.haloColor,
                            warpColor: src.warpHaloColor
                        });
                    }

                    if (boosters.visible.halos && item.visible.halo)
                    {
                        glows.CreateItem({
                            name: item.name + '_halo',
                            position: vec3.subtract(spritePos, pos, vec3.scale(spritePos, dir, src.haloDistance)),
                            blinkRate: item.seed,
                            blinkPhase: item.seed + 1,
                            minScale: src.haloScaleX * scale,
                            maxScale: src.haloScaleY * scale,
                            color: src.haloColor,
                            warpColor: src.warpHaloColor
                        });
                    }
                }

                item._rebuildPending = false;
            }
        }
    }

    /**
     * The booster set's item constructor
     * @type {EveBoosterSetItem}
     */
    static Item = EveBoosterSetItem;

    /**
     * Per object data
     * @type {*}
     */
    static perObjectData = {
        VSData: [
            ['WorldMat', 16],
            ['Shipdata', 4]
        ]
    };

    /**
     * Vertex declarations
     * @type {*}
     */
    static vertexDeclarations = [
        ['POSITION', 0, 3],
        ['TEXCOORD', 0, 2],
        ['TEXCOORD', 1, 4],
        ['TEXCOORD', 2, 4],
        ['TEXCOORD', 3, 4],
        ['TEXCOORD', 4, 4],
        ['TEXCOORD', 5, 4],
        ['TEXCOORD', 6, 1],
        ['TEXCOORD', 7, 2]
    ];

    /**
     * Internal helper
     * @type {Array}
     */
    static _box = [
        [
            [-1.0, -1.0, 0.0],
            [1.0, -1.0, 0.0],
            [1.0, 1.0, 0.0],
            [-1.0, 1.0, 0.0]
        ],
        [
            [-1.0, -1.0, -1.0],
            [-1.0, 1.0, -1.0],
            [1.0, 1.0, -1.0],
            [1.0, -1.0, -1.0]
        ],
        [
            [-1.0, -1.0, 0.0],
            [-1.0, 1.0, 0.0],
            [-1.0, 1.0, -1.0],
            [-1.0, -1.0, -1.0]
        ],
        [
            [1.0, -1.0, 0.0],
            [1.0, -1.0, -1.0],
            [1.0, 1.0, -1.0],
            [1.0, 1.0, 0.0]
        ],
        [
            [-1.0, -1.0, 0.0],
            [-1.0, -1.0, -1.0],
            [1.0, -1.0, -1.0],
            [1.0, -1.0, 0.0]
        ],
        [
            [-1.0, 1.0, 0.0],
            [1.0, 1.0, 0.0],
            [1.0, 1.0, -1.0],
            [-1.0, 1.0, -1.0]
        ]
    ];

}
