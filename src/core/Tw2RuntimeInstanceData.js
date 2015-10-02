function Tw2RuntimeInstanceData() {
    this.name = '';
    this.count = 0;
    var declaration = null;
    var vb = null;
    var vertexStride = 0;
    var count = 0;
    var data = null;
    var dataDirty = true;

    this.GetMaxInstanceCount = function () {
        return data ? data.length : 1;
    };
    this.SetElementLayout = function (decl) {
        declaration = decl;
        elements = [];

        if (vb)
        {
            device.gl.deleteBuffer(vb);
            vb = null;
        }
        declaration = null;

        vertexStride = 0;
        declaration = new Tw2VertexDeclaration();

        for (var i = 0; i < decl.length; ++i) {
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
    this.SetData = function (data_) {
        if (!declaration) {
            return;
        }
        data = data_;
        count = data.length;
        dataDirty = true;
        this.UpdateData();
    };
    this.SetItemElement = function (index, elementIndex, value) {
        if (declaration.elements[elementIndex].elements > 1) {
            for (var i = 0; i < declaration.elements[elementIndex].elements; ++i) {
                data[index][elementIndex][i] = value[i];
            }
        }
        else {
            data[index][elementIndex] = value;
        }
        dataDirty = true;
    };
    this.SetItemElementRef = function (index, elementIndex, value) {
        data[index][elementIndex] = value;
        dataDirty = true;
    };
    this.GetItemElement = function (index, elementIndex) {
        return data[index][elementIndex];
    };
    this.UpdateData = function () {
        if (!dataDirty || !declaration) {
            return;
        }
        var vbData = new Float32Array(data.length * vertexStride);
        var offset = 0;
        var i, j, k;
        for (i = 0; i < data.length; ++i) {
            for (j = 0; j < declaration.elements.length; ++j) {
                if (declaration.elements[j].elements == 1) {
                    vbData[offset++] = data[i][j];
                }
                else {
                    for (k = 0; k < declaration.elements[j].elements; ++k) {
                        vbData[offset++] = data[i][j][k];
                    }
                }
            }
        }
        if (!vb) {
            vb = device.gl.createBuffer();
        }
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, vb);
        device.gl.bufferData(device.gl.ARRAY_BUFFER, vbData, device.gl.STATIC_DRAW);
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, null);
        dataDirty = false;
    };

    this.Unload = function () {
        if (vb) {
            device.gl.deleteBuffer(vb);
            vb = null;
        }
    };

    this.GetInstanceBuffer = function () {
        return vb;
    };

    this.GetInstanceDeclaration = function () {
        return declaration;
    };

    this.GetInstanceStride = function () {
        return vertexStride * 4;
    };

    this.GetInstanceCount = function () {
        return count;
    };
}