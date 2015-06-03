function Tw2RuntimeInstanceData() {
    this.name = '';
    this.count = 0;
    var declaration = null;
    var vb = null;
    var ib = null;
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

        if (ib) {
            device.gl.deleteBuffer(ib);
        }
        ib = device.gl.createBuffer();
        var ibb = new Uint16Array(count * 6);
        for (var i = 0; i < count; ++i)
        {
            ibb[i * 6] = i * 4;
            ibb[i * 6 + 1] = i * 4 + 1;
            ibb[i * 6 + 2] = i * 4 + 2;
            ibb[i * 6 + 3] = i * 4 + 2;
            ibb[i * 6 + 4] = i * 4 + 1;
            ibb[i * 6 + 5] = i * 4 + 3;
        }
        device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, ib);
        device.gl.bufferData(device.gl.ELEMENT_ARRAY_BUFFER, ibb, device.gl.STATIC_DRAW);
        device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, null);
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
        var vbData = new Float32Array(data.length * 4 * vertexStride);
        var offset = 0;
        var i, j, k;
        for (i = 0; i < data.length; ++i) {
            var instanceOffset = offset;
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
            for (j = 0; j < 3; ++j) {
                for (k = 0; k < vertexStride; ++k) {
                    vbData[offset++] = vbData[instanceOffset + k];
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
        if (ib) {
            device.gl.deleteBuffer(ib);
            ib = null;
        }
    };

    /**
     * @return {boolean} True if the function did draw something
     */
    this.Render = function (effect, instanceVB, instanceIB, instanceDecl, instanceStride) {
        if (!vb) {
            return false;
        }
        var effectRes = effect.GetEffectRes();
        if (!effectRes._isGood) {
            return false;
        }
        if (dataDirty) {
            this.UpdateData();
        }

        var d = device;

        d.gl.bindBuffer(d.gl.ELEMENT_ARRAY_BUFFER, ib);

        var passCount = effect.GetPassCount();
        for (var pass = 0; pass < passCount; ++pass) {
            effect.ApplyPass(pass);
            var passInput = effect.GetPassInput(pass);
            d.gl.bindBuffer(d.gl.ARRAY_BUFFER, vb);
            declaration.SetPartialDeclaration(passInput, vertexStride * 4);
            d.gl.bindBuffer(d.gl.ARRAY_BUFFER, instanceVB);
            instanceDecl.SetPartialDeclaration(passInput, instanceStride);
            d.ApplyShadowState();

            d.gl.drawElements(d.gl.TRIANGLES, count * 6, d.gl.UNSIGNED_SHORT, 0);
        }
        return true;
    }
}