function EveCurveLineSet() {
    this.lineEffect = new Tw2Effect();
    this.lineEffect.effectFilePath = "res:/Graphics/Effect/Managed/Space/SpecialFX/Lines3D.fx";
    this.lineEffect.Initialize();
    this.pickEffect = null;
    this.lineWidthFactor = 1;
    this.additive = false;
    this.translation = vec3.create();
    this.rotation = quat4.create([0, 0, 0, 1]);
    this.scaling = vec3.create([1, 1, 1]);
    this.name = '';
    this.display = true;
    this.depthOffset = 0;

	var perObjectData = new Tw2PerObjectData();
	perObjectData.perObjectVSData = new Tw2RawData();
	perObjectData.perObjectVSData.Declare('WorldMat', 16);
	perObjectData.perObjectVSData.Create();

	perObjectData.perObjectPSData = new Tw2RawData();
	perObjectData.perObjectPSData.Declare('WorldMat', 16);
	perObjectData.perObjectPSData.Create();

    var transform = mat4.identity(mat4.create());
    var lines = [];
    var emptyLineID = [];

    this.Initialize = function () {
        mat4.identity(transform);
        mat4.translate(transform, this.translation);
        var rotationTransform = mat4.transpose(quat4.toMat4(this.rotation, mat4.create()));
        mat4.multiply(transform, rotationTransform, transform);
        mat4.scale(transform, this.scaling);
    };

    var LINETYPE_INVALID = 0;
    var LINETYPE_STRAIGHT = 1;
    var LINETYPE_SPHERED = 2;
    var LINETYPE_CURVED = 3;

    function addLine(line) {
        if (emptyLineID.length) {
            var index = emptyLineID.pop();
            lines[index] = line;
            return index;
        }
        lines.push(line);
        return lines.length - 1;
    }
    this.AddStraightLine = function (startPosition, startColor, endPosition, endColor, lineWidth) {
        var line = {
            type: LINETYPE_STRAIGHT,
            position1: startPosition,
            color1: startColor,
            position2: endPosition,
            color2: endColor,
            intermediatePosition: [0, 0, 0],
            width: lineWidth,
            multiColor: [0, 0, 0, 0],
            multiColorBorder: -1,
            overlayColor: [0, 0, 0, 0],
            animationSpeed: 0,
            animationScale: 1,
            numOfSegments: 1
        };
        return addLine(line)
    };
    this.AddCurvedLineCrt = function (startPosition, startColor, endPosition, endColor, middle, lineWidth) {
        var line = {
            type: LINETYPE_CURVED,
            position1: startPosition,
            color1: startColor,
            position2: endPosition,
            color2: endColor,
            intermediatePosition: middle,
            width: lineWidth,
            multiColor: [0, 0, 0, 0],
            multiColorBorder: -1,
            overlayColor: [0, 0, 0, 0],
            animationSpeed: 0,
            animationScale: 1,
            numOfSegments: 20
        };
        return addLine(line)
    };
    this.AddCurvedLineSph = function (startPosition, startColor, endPosition, endColor, center, middle, lineWidth) {
        var phi1 = startPosition.x;
        var theta1 = startPosition.y;
        var radius1 = startPosition.z;
        var phi2 = endPosition.x;
        var theta2 = endPosition.y;
        var radius2 = endPosition.z;
        var phiM = middle.x;
        var thetaM = middle.y;
        var radiusM = middle.z;
        // is given in spherical coords, so convert them into cartesian
        var startPnt = [ radius1 * Math.sin( phi1 ) * Math.sin( theta1 ), radius1 * Math.cos( theta1 ), radius1 * Math.cos( phi1 ) * Math.sin( theta1 ) ];
        var endPnt = [ radius2 * Math.sin( phi2 ) * Math.sin( theta2 ), radius2 * Math.cos( theta2 ), radius2 * Math.cos( phi2 ) * Math.sin( theta2 ) ];
        var middlePnt = [ radiusM * Math.sin( phiM ) * Math.sin( thetaM ), radiusM * Math.cos( thetaM ), radiusM * Math.cos( phiM ) * Math.sin( thetaM ) ];
        // dont forget center!
        vec3.add(startPnt, center);
        vec3.add(endPnt, center);
        vec3.add(middlePnt, center);
        // add it
        return this.AddCurvedLineCrt( startPnt, startColor, endPnt, endColor, middlePnt, lineWidth );
    };
    this.AddSpheredLineCrt = function (startPosition, startColor, endPosition, endColor, center, lineWidth) {
        var line = {
            type: LINETYPE_SPHERED,
            position1: startPosition,
            color1: startColor,
            position2: endPosition,
            color2: endColor,
            intermediatePosition: center,
            width: lineWidth,
            multiColor: [0, 0, 0, 0],
            multiColorBorder: -1,
            overlayColor: [0, 0, 0, 0],
            animationSpeed: 0,
            animationScale: 1,
            numOfSegments: 20
        };
        return addLine(line)
    };
    this.AddSpheredLineSph = function (startPosition, startColor, endPosition, endColor, center, lineWidth) {
        var phi1 = startPosition.x;
        var theta1 = startPosition.y;
        var radius1 = startPosition.z;
        var phi2 = endPosition.x;
        var theta2 = endPosition.y;
        var radius2 = endPosition.z;
        // is given in spherical coords, so convert them into cartesian
        var startPnt = [ radius1 * Math.sin( phi1 ) * Math.sin( theta1 ), radius1 * Math.cos( theta1 ), radius1 * Math.cos( phi1 ) * Math.sin( theta1 ) ];
        var endPnt = [ radius2 * Math.sin( phi2 ) * Math.sin( theta2 ), radius2 * Math.cos( theta2 ), radius2 * Math.cos( phi2 ) * Math.sin( theta2 ) ];
        // dont forget center!
        vec3.add(startPnt, center);
        vec3.add(endPnt, center);
        // add it
        return this.AddSpheredLineCrt( startPnt, startColor, endPnt, endColor, lineWidth );
    };
    this.ChangeLineColor = function (lineID, startColor, endColor) {
        lines[lineID].color1 = startColor;
        lines[lineID].color2 = endColor;
    };
    this.ChangeLineWidth = function (lineID, width) {
        lines[lineID].width = width;
    };
    this.ChangeLinePositionCrt = function (lineID, startPosition, endPosition) {
        lines[lineID].position1 = startPosition;
        lines[lineID].position2 = endPosition;
    };
    this.ChangeLinePositionSph = function (lineID, startPosition, endPosition, center) {
        var phi1 = startPosition.x;
        var theta1 = startPosition.y;
        var radius1 = startPosition.z;
        var phi2 = endPosition.x;
        var theta2 = endPosition.y;
        var radius2 = endPosition.z;
        // is given in spherical coords, so convert them into cartesian
        var startPnt = [ radius1 * Math.sin( phi1 ) * Math.sin( theta1 ), radius1 * Math.cos( theta1 ), radius1 * Math.cos( phi1 ) * Math.sin( theta1 ) ];
        var endPnt = [ radius2 * Math.sin( phi2 ) * Math.sin( theta2 ), radius2 * Math.cos( theta2 ), radius2 * Math.cos( phi2 ) * Math.sin( theta2 ) ];
        // dont forget center!
        vec3.add(startPnt, center);
        vec3.add(endPnt, center);
        this.ChangeLinePositionCrt(lineID, startPnt, endPnt);
    };
    this.ChangeLineIntermediateCrt = function (lineID, intermediatePosition) {
        lines[lineID].intermediatePosition = intermediatePosition;
    };
    this.ChangeLineIntermediateSph = function (lineID, intermediatePosition, center) {
        var phiM = middle.x;
        var thetaM = middle.y;
        var radiusM = middle.z;
        var middlePnt = [ radiusM * Math.sin( phiM ) * Math.sin( thetaM ), radiusM * Math.cos( thetaM ), radiusM * Math.cos( phiM ) * Math.sin( thetaM ) ];
        vec3.add(middlePnt, center);
        lines[lineID].intermediatePosition = intermediatePosition;
    };
    this.ChangeLineMultiColor = function (lineID, color, border) {
        lines[lineID].multiColor = color;
        lines[lineID].multiColorBorder = border;
    };
    this.ChangeLineAnimation = function (lineID, color, speed, scale) {
        lines[lineID].overlayColor = color;
        lines[lineID].animationSpeed = speed;
        lines[lineID].animationScale = scale;
    };
    this.ChangeLineSegmentation = function (lineID, numOfSegments) {
        if (lines[lineID].type != LINETYPE_STRAIGHT) {
            lines[lineID].numOfSegments = numOfSegments;
        }

    };
    this.RemoveLine = function (lineID) {
        emptyLineID.push(lineID);
        lines[lineID].type = LINETYPE_INVALID;
    };
    this.ClearLines = function () {
        lines = [];
        emptyLineID = [];
    };

    var vertexSize = 26;
    var vb = null;
    var vbSize = 0;
    var declaration = new Tw2VertexDeclaration();
    declaration.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_POSITION, 0, device.gl.FLOAT, 3, 0));
    declaration.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 0, device.gl.FLOAT, 4, 12));
    declaration.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 1, device.gl.FLOAT, 4, 28));
    declaration.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 2, device.gl.FLOAT, 3, 44));

    declaration.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_COLOR, 0, device.gl.FLOAT, 4, 56));
    declaration.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_COLOR, 1, device.gl.FLOAT, 4, 72));
    declaration.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_COLOR, 2, device.gl.FLOAT, 4, 88));
    declaration.stride = 4 * vertexSize;
    declaration.RebuildHash();

    function lineCount() {
        var count = 0;
        for (var i = 0; i < lines.length; ++i) {
            if (lines[i].type != LINETYPE_INVALID) {
                count += lines[i].numOfSegments;
            }
        }
        return count;
    }

    function fillColorVertices(lineData, buffer, offset) {
        buffer[offset++] = lineData.multiColor[0];
        buffer[offset++] = lineData.multiColor[1];
        buffer[offset++] = lineData.multiColor[2];
        buffer[offset++] = lineData.multiColor[3];
        buffer[offset++] = lineData.overlayColor[0];
        buffer[offset++] = lineData.overlayColor[1];
        buffer[offset++] = lineData.overlayColor[2];
        buffer[offset++] = lineData.overlayColor[3];
        return offset;
    }

    function writeLineVerticesToBuffer(self, position1, color1, length1, position2, color2, length2, lineID, buffer, offset) {
        var lineData = lines[lineID];

        buffer[offset++] = position1[0];
        buffer[offset++] = position1[1];
        buffer[offset++] = position1[2];
        buffer[offset++] = position2[0] - position1[0];
        buffer[offset++] = position2[1] - position1[1];
        buffer[offset++] = position2[2] - position1[2];
        buffer[offset++] = -self.lineWidthFactor * lineData.width;
        buffer[offset++] = 0;
        buffer[offset++] = length1;
        buffer[offset++] = lineData.multiColorBorder;
        buffer[offset++] = length2 - length1;
        buffer[offset++] = lineData.animationSpeed;
        buffer[offset++] = lineData.animationScale;
        buffer[offset++] = lineID;
        buffer[offset++] = color1[0];
        buffer[offset++] = color1[1];
        buffer[offset++] = color1[2];
        buffer[offset++] = color1[3];
        offset = fillColorVertices(lineData, buffer, offset);

        buffer[offset++] = position1[0];
        buffer[offset++] = position1[1];
        buffer[offset++] = position1[2];
        buffer[offset++] = position2[0] - position1[0];
        buffer[offset++] = position2[1] - position1[1];
        buffer[offset++] = position2[2] - position1[2];
        buffer[offset++] = self.lineWidthFactor * lineData.width;
        buffer[offset++] = 0;
        buffer[offset++] = length1;
        buffer[offset++] = lineData.multiColorBorder;
        buffer[offset++] = length2 - length1;
        buffer[offset++] = lineData.animationSpeed;
        buffer[offset++] = lineData.animationScale;
        buffer[offset++] = lineID;
        buffer[offset++] = color1[0];
        buffer[offset++] = color1[1];
        buffer[offset++] = color1[2];
        buffer[offset++] = color1[3];
        offset = fillColorVertices(lineData, buffer, offset);

        buffer[offset++] = position2[0];
        buffer[offset++] = position2[1];
        buffer[offset++] = position2[2];
        buffer[offset++] = position1[0] - position2[0];
        buffer[offset++] = position1[1] - position2[1];
        buffer[offset++] = position1[2] - position2[2];
        buffer[offset++] = -self.lineWidthFactor * lineData.width;
        buffer[offset++] = 1;
        buffer[offset++] = length2;
        buffer[offset++] = lineData.multiColorBorder;
        buffer[offset++] = length2 - length1;
        buffer[offset++] = lineData.animationSpeed;
        buffer[offset++] = lineData.animationScale;
        buffer[offset++] = lineID;
        buffer[offset++] = color2[0];
        buffer[offset++] = color2[1];
        buffer[offset++] = color2[2];
        buffer[offset++] = color2[3];
        offset = fillColorVertices(lineData, buffer, offset);


        buffer[offset++] = position1[0];
        buffer[offset++] = position1[1];
        buffer[offset++] = position1[2];
        buffer[offset++] = position2[0] - position1[0];
        buffer[offset++] = position2[1] - position1[1];
        buffer[offset++] = position2[2] - position1[2];
        buffer[offset++] = self.lineWidthFactor * lineData.width;
        buffer[offset++] = 0;
        buffer[offset++] = length1;
        buffer[offset++] = lineData.multiColorBorder;
        buffer[offset++] = length2 - length1;
        buffer[offset++] = lineData.animationSpeed;
        buffer[offset++] = lineData.animationScale;
        buffer[offset++] = lineID;
        buffer[offset++] = color1[0];
        buffer[offset++] = color1[1];
        buffer[offset++] = color1[2];
        buffer[offset++] = color1[3];
        offset = fillColorVertices(lineData, buffer, offset);

        buffer[offset++] = position2[0];
        buffer[offset++] = position2[1];
        buffer[offset++] = position2[2];
        buffer[offset++] = position1[0] - position2[0];
        buffer[offset++] = position1[1] - position2[1];
        buffer[offset++] = position1[2] - position2[2];
        buffer[offset++] = self.lineWidthFactor * lineData.width;
        buffer[offset++] = 1;
        buffer[offset++] = length2;
        buffer[offset++] = lineData.multiColorBorder;
        buffer[offset++] = length2 - length1;
        buffer[offset++] = lineData.animationSpeed;
        buffer[offset++] = lineData.animationScale;
        buffer[offset++] = lineID;
        buffer[offset++] = color2[0];
        buffer[offset++] = color2[1];
        buffer[offset++] = color2[2];
        buffer[offset++] = color2[3];
        offset = fillColorVertices(lineData, buffer, offset);

        buffer[offset++] = position2[0];
        buffer[offset++] = position2[1];
        buffer[offset++] = position2[2];
        buffer[offset++] = position1[0] - position2[0];
        buffer[offset++] = position1[1] - position2[1];
        buffer[offset++] = position1[2] - position2[2];
        buffer[offset++] = -self.lineWidthFactor * lineData.width;
        buffer[offset++] = 1;
        buffer[offset++] = length2;
        buffer[offset++] = lineData.multiColorBorder;
        buffer[offset++] = length2 - length1;
        buffer[offset++] = lineData.animationSpeed;
        buffer[offset++] = lineData.animationScale;
        buffer[offset++] = lineID;
        buffer[offset++] = color2[0];
        buffer[offset++] = color2[1];
        buffer[offset++] = color2[2];
        buffer[offset++] = color2[3];
        offset = fillColorVertices(lineData, buffer, offset);

    }

    function vec3Hermite(out, v1, t1, v2, t2, s) {
        var k3 = 2 * s * s * s - 3 * s * s + 1;
        var k2 = -2 * s * s * s + 3 * s * s;
        var k1 = s * s * s - 2 * s * s + s;
        var k0 = s * s * s - s * s;

        out[0] = k3 * v1[0] + k2 * v2[0] + k1 * t1[0] + k0 * t2[0];
        out[1] = k3 * v1[1] + k2 * v2[1] + k1 * t1[1] + k0 * t2[1];
        out[2] = k3 * v1[2] + k2 * v2[2] + k1 * t1[2] + k0 * t2[2];
        return out;
    }

    this.SubmitChanges = function () {
        vb = null;
        if (!lines.length) {
            return;
        }
        vbSize = lineCount();
        var data = new Float32Array(vbSize * 6 * vertexSize);
        var offset = 0;

        var startDir = vec3.create();
        var endDir = vec3.create();
        var startDirNrm = vec3.create();
        var endDirNrm = vec3.create();
        var rotationAxis = vec3.create();
        var rotationMatrix = mat4.create();
        var dir1 = vec3.create();
        var dir2 = vec3.create();
        var col1 = quat4.create();
        var col2 = quat4.create();
        var pt1 = vec3.create();
        var pt2 = vec3.create();
        var j, tmp, segmentFactor;

        for (var i = 0; i < lines.length; ++i) {
            switch (lines[i].type) {
                case LINETYPE_INVALID:
                    break;
                case LINETYPE_STRAIGHT:
                    writeLineVerticesToBuffer(this, lines[i].position1, lines[i].color1, 0, lines[i].position2, lines[i].color2, 1, i, data, offset);
                    offset += 6 * vertexSize;
                    break;
                case LINETYPE_SPHERED:
                    vec3.subtract(lines[i].position1, lines[i].intermediatePosition, startDir);
                    vec3.subtract(lines[i].position2, lines[i].intermediatePosition, endDir);
                    vec3.normalize(startDir, startDirNrm);
                    vec3.normalize(endDir, endDirNrm);

                    vec3.cross(startDir, endDir, rotationAxis);
                    var fullAngle = Math.acos(vec3.dot(startDirNrm, endDirNrm));
                    var segmentAngle = fullAngle / lines[i].numOfSegments;
                    mat4.rotate(mat4.identity(rotationMatrix), segmentAngle, rotationAxis);

                    vec3.set(startDir, dir1);
                    quat4.set(lines[i].color1, col1);

                    for (j = 0; j < lines[i].numOfSegments; ++j) {
                        segmentFactor = (j + 1) / lines[i].numOfSegments;
                        mat4.multiplyVec3(rotationMatrix, dir1, dir2);
                        col2[0] = lines[i].color1[0] * (1 - segmentFactor) + lines[i].color2[0] * segmentFactor;
                        col2[1] = lines[i].color1[1] * (1 - segmentFactor) + lines[i].color2[1] * segmentFactor;
                        col2[2] = lines[i].color1[2] * (1 - segmentFactor) + lines[i].color2[2] * segmentFactor;
                        col2[3] = lines[i].color1[3] * (1 - segmentFactor) + lines[i].color2[3] * segmentFactor;
                        vec3.add(dir1, lines[i].intermediatePosition, pt1);
                        vec3.add(dir2, lines[i].intermediatePosition, pt2);

                        writeLineVerticesToBuffer(this, pt1, col1, j / lines[i].numOfSegments, pt2, col2, segmentFactor, i, data, offset);
                        offset += 6 * vertexSize;

                        tmp = dir1;
                        dir1 = dir2;
                        dir2 = tmp;
                        tmp = col1;
                        col1 = col2;
                        col2 = tmp;
                    }
                    break;
                case LINETYPE_CURVED:
                    var tangent1 = vec3.create();
                    var tangent2 = vec3.create();
                    var pos1 = vec3.create();
                    var pos2 = vec3.create();

                    vec3.subtract(lines[i].intermediatePosition, lines[i].position1, tangent1);
                    vec3.subtract(lines[i].position2, lines[i].intermediatePosition, tangent2);

                    vec3.set(lines[i].position1, pos1);
                    vec3.set(lines[i].color1, col1);
                    for (j = 0; j < lines[i].numOfSegments; ++j) {
                        segmentFactor = (s + 1) / lines[i].numOfSegments;
                        vec3Hermite(pos2, lines[i].position1, tangent1, lines[i].position2, tangent2, segmentFactor);
                        col2[0] = lines[i].color1[0] * (1 - segmentFactor) + lines[i].color2[0] * segmentFactor;
                        col2[1] = lines[i].color1[1] * (1 - segmentFactor) + lines[i].color2[1] * segmentFactor;
                        col2[2] = lines[i].color1[2] * (1 - segmentFactor) + lines[i].color2[2] * segmentFactor;
                        col2[3] = lines[i].color1[3] * (1 - segmentFactor) + lines[i].color2[3] * segmentFactor;
                        writeLineVerticesToBuffer(this, pos1, col1, j / lines[i].numOfSegments, pos2, col2, segmentFactor, i, data, offset);
                        offset += 6 * vertexSize;

                        tmp = pos1;
                        pos1 = pos2;
                        pos2 = tmp;
                        tmp = col1;
                        col1 = col2;
                        col2 = tmp;
                    }
            }
        }

        if (vb) {
            device.gl.deleteBuffer(vb);
        }
        vb = device.gl.createBuffer();
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, vb);
        device.gl.bufferData(device.gl.ARRAY_BUFFER, data, device.gl.STATIC_DRAW);
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, null);
    };
    this.GetBatches = function (mode, accumulator) {
        if (!this.display || !vb) {
            return;
        }
        if (mode == device.RM_TRANSPARENT && !this.additive || mode == device.RM_ADDITIVE && this.additive) {
            var batch = new Tw2ForwardingRenderBatch();
            mat4.transpose(transform, perObjectData.perObjectVSData.Get('WorldMat'));
            mat4.transpose(transform, perObjectData.perObjectPSData.Get('WorldMat'));
            batch.perObjectData = perObjectData;
            batch.geometryProvider = this;
            batch.renderMode = mode;
            accumulator.Commit(batch);
        }
    };
    this.Unload = function () {
        if (vb) {
            device.gl.deleteBuffer(vb);
            vb = null;
        }
    };
    /**
     * @return {boolean}
     */
    this.Render = function (batch, overrideEffect) {
        var effect = overrideEffect || this.lineEffect;
        var effectRes = effect.GetEffectRes();
        if (!effectRes._isGood)
        {
            return false;
        }
        var d = device;
        d.gl.bindBuffer(d.gl.ARRAY_BUFFER, vb);

        var passCount = effect.GetPassCount();
        for (var pass = 0; pass < passCount; ++pass) {
            effect.ApplyPass(pass);
            var passInput = effect.GetPassInput(pass);
            if (!declaration.SetDeclaration(passInput, declaration.stride)) {
                return false;
            }
            d.ApplyShadowState();
            d.gl.drawArrays(d.gl.TRIANGLES, 0, vbSize * 6);
        }
        return true;
    };

    this.Update = function () {
    };
    this.UpdateViewDependentData = function (parentTransform) {
        mat4.identity(transform);
        mat4.translate(transform, this.translation);
        var rotationTransform = mat4.transpose(quat4.toMat4(this.rotation, mat4.create()));
        mat4.multiply(transform, rotationTransform, transform);
        mat4.scale(transform, this.scaling);
        mat4.multiply(transform, parentTransform);
    };
}

