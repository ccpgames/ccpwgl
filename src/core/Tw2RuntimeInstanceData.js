/**
 * Tw2RuntimeInstanceData
 * @property {string} name
 * @property {Number} count
 * @constructor
 */
function Tw2RuntimeInstanceData()
{
    this.name = '';
    this.count = 0;

    var declaration = null;
    var vb = null;
    var vertexStride = 0;
    var count = 0;
    var data = null;
    var dataDirty = true;

    /**
     * GetMaxInstanceCount
     * @returns {Number}
     */
    this.GetMaxInstanceCount = function()
    {
        return data ? data.length : 1;
    };

    /**
     * SetElementLayout
     * @param decl
     */
    this.SetElementLayout = function(decl)
    {
        if (vb)
        {
            device.gl.deleteBuffer(vb);
            vb = null;
        }

        vertexStride = 0;
        declaration = new Tw2VertexDeclaration();

        for (var i = 0; i < decl.length; ++i)
        {
            var element = new Tw2ParticleElementDeclaration();
            element.elementType = decl[i][0];
            element.dimension = decl[i][2];
            element.usageIndex = decl[i][1];

            var d = element.GetDeclaration();
            d.offset = vertexStride * 4;
            declaration.elements.push(d);
            vertexStride += element.dimension;
        }

        declaration.RebuildHash();
    };

    /**
     * SetData
     * @param data_
     */
    this.SetData = function(data_)
    {
        if (!declaration)
        {
            return;
        }
        data = data_;
        count = data.length;
        dataDirty = true;
        this.UpdateData();
    };

    /**
     * SetItemElement
     * @param index
     * @param elementIndex
     * @param value
     */
    this.SetItemElement = function(index, elementIndex, value)
    {
        if (declaration.elements[elementIndex].elements > 1)
        {
            for (var i = 0; i < declaration.elements[elementIndex].elements; ++i)
            {
                data[index][elementIndex][i] = value[i];
            }
        }
        else
        {
            data[index][elementIndex] = value;
        }

        dataDirty = true;
    };

    /**
     * SetItemElementRef
     * @param index
     * @param elementIndex
     * @param value
     */
    this.SetItemElementRef = function(index, elementIndex, value)
    {
        data[index][elementIndex] = value;
        dataDirty = true;
    };

    /**
     * GetItemElement
     * @param index
     * @param elementIndex
     * @returns {*}
     */
    this.GetItemElement = function(index, elementIndex)
    {
        return data[index][elementIndex];
    };

    /**
     * UpdateData
     */
    this.UpdateData = function()
    {
        if (!dataDirty || !declaration)
        {
            return;
        }

        var vbData = new Float32Array(data.length * vertexStride);
        var offset = 0;
        var i, j, k;

        for (i = 0; i < data.length; ++i)
        {
            for (j = 0; j < declaration.elements.length; ++j)
            {
                if (declaration.elements[j].elements == 1)
                {
                    vbData[offset++] = data[i][j];
                }
                else
                {
                    for (k = 0; k < declaration.elements[j].elements; ++k)
                    {
                        vbData[offset++] = data[i][j][k];
                    }
                }
            }
        }

        if (!vb)
        {
            vb = device.gl.createBuffer();
        }

        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, vb);
        device.gl.bufferData(device.gl.ARRAY_BUFFER, vbData, device.gl.STATIC_DRAW);
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, null);
        dataDirty = false;
    };

    /**
     * Unloads the webgl buffer
     */
    this.Unload = function()
    {
        if (vb)
        {
            device.gl.deleteBuffer(vb);
            vb = null;
        }
    };

    /**
     * GetInstanceBuffer
     * @returns {WebglArrayBuffer}
     */
    this.GetInstanceBuffer = function()
    {
        return vb;
    };

    /**
     * GetInstanceDeclaration
     * @returns {Tw2VertexDeclaration}
     */
    this.GetInstanceDeclaration = function()
    {
        return declaration;
    };

    /**
     * GetInstanceStride
     * @returns {Number}
     */
    this.GetInstanceStride = function()
    {
        return vertexStride * 4;
    };

    /**
     * GetInstanceCount
     * @returns {Number}
     */
    this.GetInstanceCount = function()
    {
        return count;
    };
}
