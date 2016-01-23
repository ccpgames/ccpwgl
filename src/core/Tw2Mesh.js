/**
 * Tw2MeshArea
 * @property {string} name
 * @property {Tw2Effect} effect
 * @property {number} meshIndex
 * @property {number} index
 * @property {number} count
 * @property {boolean} debugIsHidden
 * @constructor
 */
function Tw2MeshArea()
{
    this.name = '';
    this.effect = null;
    this.meshIndex = 0;
    this.index = 0;
    this.count = 1;
    this.debugIsHidden = false;
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
 * @property {boolean} debugIsHidden
 * @constructor
 */
function Tw2MeshLineArea()
{
    this.name = '';
    this.effect = null;
    this.meshIndex = 0;
    this.index = 0;
    this.count = 1;
    this.debugIsHidden = false;
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
 * @property {Array.<Tw2MeshArea>} depthAreas
 * @property {boolean} debugIsHidden
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
    this.debugIsHidden = false;
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
        if (area.effect == null || area.debugIsHidden)
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
    if (this.geometryResource == null || this.debugIsHidden)
    {
        return false;
    }
    if (mode == device.RM_OPAQUE)
    {
        this._GetAreaBatches(this.opaqueAreas, mode, accumulator, perObjectData);
    }
    else if (mode == device.RM_DECAL)
    {
        this._GetAreaBatches(this.decalAreas, mode, accumulator, perObjectData);
    }
    else if (mode == device.RM_TRANSPARENT)
    {
        this._GetAreaBatches(this.transparentAreas, mode, accumulator, perObjectData);
    }
    else if (mode == device.RM_ADDITIVE)
    {
        this._GetAreaBatches(this.additiveAreas, mode, accumulator, perObjectData);
    }
    return true;
};
