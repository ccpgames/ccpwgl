/**
 * Tw2MeshArea
 * @property {string} name
 * @property {Tw2Effect} effect
 * @property {number} meshIndex
 * @property {number} index
 * @property {number} count
 * @property {boolean} display
 * @constructor
 */
function Tw2MeshArea()
{
    this.name = '';
    this.effect = null;
    this.meshIndex = 0;
    this.index = 0;
    this.count = 1;
    this.display = true;
}

/**
 * Render Batch Constructor
 * @type {RenderBatch}
 * @prototype
 */
Tw2MeshArea.batchType = Tw2GeometryBatch;


/**
 * Tw2MeshLineArea
 * @property {string} name
 * @property {Tw2Effect} effect
 * @property {number} meshIndex
 * @property {number} index
 * @property {number} count
 * @property {Boolean} display
 * @constructor
 */
function Tw2MeshLineArea()
{
    this.name = '';
    this.effect = null;
    this.meshIndex = 0;
    this.index = 0;
    this.count = 1;
    this.display = true;
}

/**
 * Render Batch Constructor
 * @type {RenderBatch}
 * @prototype
 */
Tw2MeshLineArea.batchType = Tw2GeometryLineBatch;


/**
 * Tw2Mesh
 * @property {string} name
 * @property {number} meshIndex
 * @property {string} geometryResPath
 * @property {string} lowDetailGeometryResPath
 * @property {Tw2GeometryRes} geometryResource
 * @property {Array.<Tw2MeshArea>} opaqueAreas
 * @property {Array.<Tw2MeshArea>} transparentAreas
 * @property {Array.<Tw2MeshArea>} additiveAreas
 * @property {Array.<Tw2MeshArea>} pickableAreas
 * @property {Array.<Tw2MeshArea>} decalAreas
 * @property {Array.<Tw2MeshArea>} depthAreas       - Not supported
 * @property {boolean} display                      - Enables/ disables all mesh batch accumulations
 * @parameter {{}} visible                          - Batch accumulation options for the mesh's elements
 * @property {boolean} visible.opaqueAreas          - Enables/ disables opaque area batch accumulation
 * @property {boolean} visible.transparentAreas     - Enables/ disables transparent area batch accumulation
 * @property {boolean} visible.additiveAreas        - Enables/ disables additive area batch accumulation
 * @property {boolean} visible.pickableAreas        - Enables/ disables pickable area batch accumulation
 * @property {boolean} visible.decalAreas           - Enables/ disables decal area batch accumulation
 * @property {boolean} visible.depthAreas           - Not supported
 * @constructor
 */
function Tw2Mesh()
{
    this.name = '';
    this.meshIndex = 0;
    this.geometryResPath = '';
    this.lowDetailGeometryResPath = '';
    this.geometryResource = null;

    this.opaqueAreas = [];
    this.transparentAreas = [];
    this.additiveAreas = [];
    this.pickableAreas = [];
    this.decalAreas = [];
    this.depthAreas = [];

    this.display = true;
    this.visible = {};
    this.visible.opaqueAreas = true;
    this.visible.transparentAreas = true;
    this.visible.additiveAreas = true;
    this.visible.pickableAreas = true;
    this.visible.decalAreas = true;
    this.visible.depthAreas = true;
}

/**
 * Initializes the Tw2Mesh
 * @prototype
 */
Tw2Mesh.prototype.Initialize = function()
{
    if (this.geometryResPath != '')
    {
        this.geometryResource = resMan.GetResource(this.geometryResPath);
    }
};

/**
 * Gets Mesh res Objects
 * @param {Array} [out=[]] - Optional receiving array
 * @returns {Array.<Tw2EffectRes|Tw2TextureRes|Tw2GeometryRes>} [out]
 */
Tw2Mesh.prototype.GetResources = function(out)
{
    if (out === undefined)
    {
        out = [];
    }

    if (out.indexOf(this.geometryResource) === -1)
    {
        out.push(this.geometryResource);
    }

    for (var type in this.visible)
    {
        if (this.visible.hasOwnProperty(type) && this[type].length)
        {
            for (var i = 0; i < this[type].length; i++)
            {
                this[type][i].effect.GetResources(out);
            }
        }
    }

    return out;
};

/**
 * Gets render batches from a mesh area array and commits them to an accumulator
 * @param {Array.<Tw2MeshArea>} areas
 * @param {RenderMode} mode
 * @param {Tw2BatchAccumulator} accumulator
 * @param {Tw2PerObjectData} perObjectData
 * @private
 */
Tw2Mesh.prototype._GetAreaBatches = function(areas, mode, accumulator, perObjectData)
{
    for (var i = 0; i < areas.length; ++i)
    {
        var area = areas[i];
        if (area.effect == null || !area.display)
        {
            continue;
        }
        var batch = new area.constructor.batchType();
        batch.renderMode = mode;
        batch.perObjectData = perObjectData;
        batch.geometryRes = this.geometryResource;
        batch.meshIx = this.meshIndex;
        batch.start = area.index;
        batch.count = area.count;
        batch.effect = area.effect;
        accumulator.Commit(batch);
    }
};

/**
 * Gets render batches
 * @param {RenderMode} mode
 * @param {Tw2BatchAccumulator} accumulator
 * @param {Tw2PerObjectData} perObjectData
 * @returns {boolean}
 * @prototype
 */
Tw2Mesh.prototype.GetBatches = function(mode, accumulator, perObjectData)
{
    if (this.geometryResource == null)
    {
        return false;
    }

    if (this.display)
    {

        if (mode == device.RM_OPAQUE && this.visible.opaqueAreas)
        {
            this._GetAreaBatches(this.opaqueAreas, mode, accumulator, perObjectData);
        }
        else if (mode == device.RM_DECAL && this.visible.decalAreas)
        {
            this._GetAreaBatches(this.decalAreas, mode, accumulator, perObjectData);
        }
        else if (mode == device.RM_TRANSPARENT && this.visible.transparentAreas)
        {
            this._GetAreaBatches(this.transparentAreas, mode, accumulator, perObjectData);
        }
        else if (mode == device.RM_ADDITIVE && this.visible.additiveAreas)
        {
            this._GetAreaBatches(this.additiveAreas, mode, accumulator, perObjectData);
        }
        else if (mode == device.RM_PICKABLE && this.visible.pickableAreas)
        {
            this._GetAreaBatches(this.pickableAreas, mode, accumulator, perObjectData);
        }
    }

    return true;
};
