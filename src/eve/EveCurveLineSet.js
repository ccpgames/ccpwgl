/**
 * EveCurveLineSet
 * @property {String} name
 * @property {Boolean} display
 * @property {Boolean} disableDepth
 * @property {Number} lineWidthFactor
 * @property {Array} lines
 * @property {Array} emptyLineID
 * @property {vec3} translation
 * @property {quat} rotation
 * @property {vec3} scaling
 * @property {mat4} transform
 * @property {Tw2Effect} lineEffect
 * @property {null|Tw2Effect} pickEffect
 * @property {Boolean} additive
 * @property {Tw2PerObjectData} perObjectData
 * @property {Number} _vertexSize
 * @property {WebGLBuffer} _vertexBuffer
 * @property {Number} _vertexBufferSize
 * @property {Tw2VertexDeclaration} declaration
 * @constructor
 */
function EveCurveLineSet()
{
    this.name = '';
    this.display = true;
    this.disableDepth = false;
    this.lineWidthFactor = 1;
    this.lines = [];
    this.emptyLineID = [];

    this.translation = vec3.create();
    this.rotation = quat.create();
    this.scaling = vec3.one();
    this.transform = mat4.create();

    this.lineEffect = new Tw2Effect();
    this.lineEffect.effectFilePath = "res:/Graphics/Effect/Managed/Space/SpecialFX/Lines3D.fx";
    this.lineEffect.parameters['TexMap'] = new Tw2TextureParameter('TexMap', 'res:/texture/global/white.dds.0.png');
    this.lineEffect.parameters['OverlayTexMap'] = new Tw2TextureParameter('OverlayTexMap', 'res:/texture/global/white.dds.0.png');
    this.lineEffect.Initialize();
    this.pickEffect = null;

    this.additive = false;
    this.pickable = true;

    this.perObjectData = new Tw2PerObjectData();
    this.perObjectData.perObjectVSData = new Tw2RawData();
    this.perObjectData.perObjectVSData.Declare('WorldMat', 16);
    this.perObjectData.perObjectVSData.Create();
    this.perObjectData.perObjectPSData = new Tw2RawData();
    this.perObjectData.perObjectPSData.Declare('WorldMat', 16);
    this.perObjectData.perObjectPSData.Create();

    this._vertexSize = 26;
    this._vertexBuffer = null;
    this._vertexBufferSize = 0;
    this.declaration = new Tw2VertexDeclaration();
    this.declaration.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_POSITION, 0, device.gl.FLOAT, 3, 0));
    this.declaration.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 0, device.gl.FLOAT, 4, 12));
    this.declaration.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 1, device.gl.FLOAT, 4, 28));
    this.declaration.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 2, device.gl.FLOAT, 3, 44));
    this.declaration.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_COLOR, 0, device.gl.FLOAT, 4, 56));
    this.declaration.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_COLOR, 1, device.gl.FLOAT, 4, 72));
    this.declaration.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_COLOR, 2, device.gl.FLOAT, 4, 88));
    this.declaration.stride = 4 * this._vertexSize;
    this.declaration.RebuildHash();
}

/**
 * Initializes the Curve line set
 */
EveCurveLineSet.prototype.Initialize = function()
{
    // TODO: Test this conversion
    mat4.fromRotationTranslationScale(this.transform, this.translation, this.rotation, this.scaling);
};

/**
 * Adds a line
 * @param line
 * @returns {Number} Line index
 * @private
 */
EveCurveLineSet.prototype._addLine = function(line)
{
    if (this.emptyLineID.length)
    {
        var index = this.emptyLineID.pop();
        this.lines[index] = line;
        return index;
    }
    this.lines.push(line);
    return this.lines.length - 1;
};

/**
 * Adds a straight line
 * @param {vec3} startPosition
 * @param {quat3} startColor
 * @param {vec3} endPosition
 * @param {quat4} endColor
 * @param {Number} lineWidth
 * @returns {Number} line index
 */
EveCurveLineSet.prototype.AddStraightLine = function(startPosition, startColor, endPosition, endColor, lineWidth)
{
    var line = {
        type: EveCurveLineSet.LINETYPE_STRAIGHT,
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
    return this._addLine(line)
};

/**
 * Adds a curved line using cartesian co-ordinates
 * @param {vec3} startPosition
 * @param {quat4} startColor
 * @param {vec3} endPosition
 * @param {quat4} endColor
 * @param {vec3} middle
 * @param {Number} lineWidth
 * @returns {Number} line index
 */
EveCurveLineSet.prototype.AddCurvedLineCrt = function(startPosition, startColor, endPosition, endColor, middle, lineWidth)
{
    var line = {
        type: EveCurveLineSet.LINETYPE_CURVED,
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
    return this._addLine(line)
};

/**
 * Adds a curved line using spherical co-ordinates
 * @param {vec3} startPosition
 * @param {quat4} startColor
 * @param {vec3} endPosition
 * @param {quat4} endColor
 * @param {vec3} center
 * @param {vec3} middle
 * @param {Number} lineWidth
 * @returns {Number} line index
 */
EveCurveLineSet.prototype.AddCurvedLineSph = function(startPosition, startColor, endPosition, endColor, center, middle, lineWidth)
{
    var phi1 = startPosition[0];
    var theta1 = startPosition[1];
    var radius1 = startPosition[2];
    var phi2 = endPosition[0];
    var theta2 = endPosition[1];
    var radius2 = endPosition[2];
    var phiM = middle[0];
    var thetaM = middle[1];
    var radiusM = middle[2];
    // is given in spherical coords, so convert them into cartesian
    var startPnt = [radius1 * Math.sin(phi1) * Math.sin(theta1), radius1 * Math.cos(theta1), radius1 * Math.cos(phi1) * Math.sin(theta1)];
    var endPnt = [radius2 * Math.sin(phi2) * Math.sin(theta2), radius2 * Math.cos(theta2), radius2 * Math.cos(phi2) * Math.sin(theta2)];
    var middlePnt = [radiusM * Math.sin(phiM) * Math.sin(thetaM), radiusM * Math.cos(thetaM), radiusM * Math.cos(phiM) * Math.sin(thetaM)];
    // don't forget center!
    vec3.add(startPnt, startPnt, center);
    vec3.add(endPnt, endPnt, center);
    vec3.add(middlePnt, middlePnt, center);
    // add it
    return this.AddCurvedLineCrt(startPnt, startColor, endPnt, endColor, middlePnt, lineWidth);
};

/**
 * Adds a sphered line using cartesian co-ordinates
 * @param {vec3} startPosition
 * @param {quat4} startColor
 * @param {vec3} endPosition
 * @param {quat4} endColor
 * @param {vec3} center
 * @param {Number} lineWidth
 * @returns {Number} line index
 */
EveCurveLineSet.prototype.AddSpheredLineCrt = function(startPosition, startColor, endPosition, endColor, center, lineWidth)
{
    var line = {
        type: EveCurveLineSet.LINETYPE_SPHERED,
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
    return this._addLine(line)
};

/**
 * Adds a sphered line using spherical co-ordinates
 * @param {vec3} startPosition
 * @param {quat4} startColor
 * @param {vec3} endPosition
 * @param {quat4} endColor
 * @param {vec3} center
 * @param {Number} lineWidth
 * @returns {Number} line index
 */
EveCurveLineSet.prototype.AddSpheredLineSph = function(startPosition, startColor, endPosition, endColor, center, lineWidth)
{
    var phi1 = startPosition[0];
    var theta1 = startPosition[1];
    var radius1 = startPosition[2];
    var phi2 = endPosition[0];
    var theta2 = endPosition[1];
    var radius2 = endPosition[2];
    // is given in spherical coords, so convert them into cartesian
    var startPnt = [radius1 * Math.sin(phi1) * Math.sin(theta1), radius1 * Math.cos(theta1), radius1 * Math.cos(phi1) * Math.sin(theta1)];
    var endPnt = [radius2 * Math.sin(phi2) * Math.sin(theta2), radius2 * Math.cos(theta2), radius2 * Math.cos(phi2) * Math.sin(theta2)];
    // don't forget center!
    vec3.add(startPnt, startPnt, center);
    vec3.add(endPnt, endPnt, center);
    // add it
    return this.AddSpheredLineCrt(startPnt, startColor, endPnt, endColor, center, lineWidth);
};

/**
 * Changes a line's colors
 * @param {Number} lineID
 * @param {quat4} startColor
 * @param {quat4} endColor
 */
EveCurveLineSet.prototype.ChangeLineColor = function(lineID, startColor, endColor)
{
    this.lines[lineID].color1 = startColor;
    this.lines[lineID].color2 = endColor;
};

/**
 * Changes a line's width
 * @param {Number} lineID
 * @param {Number} width
 */
EveCurveLineSet.prototype.ChangeLineWidth = function(lineID, width)
{
    this.lines[lineID].width = width;
};

/**
 * Changes a lines start and end positions using Cartesian co-ordinates
 * @param {Number} lineID
 * @param {vec3} startPosition
 * @param {vec3} endPosition
 */
EveCurveLineSet.prototype.ChangeLinePositionCrt = function(lineID, startPosition, endPosition)
{
    this.lines[lineID].position1 = startPosition;
    this.lines[lineID].position2 = endPosition;
};

/**
 * Changes a lines start, end and center positions using Spherical co-orindates
 * @param {Number} lineID
 * @param {vec3} startPosition
 * @param {vec3} endPosition
 * @param {vec3} center
 */
EveCurveLineSet.prototype.ChangeLinePositionSph = function(lineID, startPosition, endPosition, center)
{
    var phi1 = startPosition[0];
    var theta1 = startPosition[1];
    var radius1 = startPosition[2];
    var phi2 = endPosition[0];
    var theta2 = endPosition[1];
    var radius2 = endPosition[2];
    // is given in spherical coords, so convert them into cartesian
    var startPnt = [radius1 * Math.sin(phi1) * Math.sin(theta1), radius1 * Math.cos(theta1), radius1 * Math.cos(phi1) * Math.sin(theta1)];
    var endPnt = [radius2 * Math.sin(phi2) * Math.sin(theta2), radius2 * Math.cos(theta2), radius2 * Math.cos(phi2) * Math.sin(theta2)];
    // don't forget center!
    vec3.add(startPnt, startPnt, center);
    vec3.add(endPnt, endPnt, center);
    this.ChangeLinePositionCrt(lineID, startPnt, endPnt);
};

/**
 * Changes a line's intermediate position
 * @param {Number} lineID
 * @param {vec3} intermediatePosition
 */
EveCurveLineSet.prototype.ChangeLineIntermediateCrt = function(lineID, intermediatePosition)
{
    this.lines[lineID].intermediatePosition = intermediatePosition;
};

/**
 * Changes a line's intermediate and middle positions
 * @param {Number} lineID
 * @param {vec3} intermediatePosition
 * @param {vec3} middle
 */
EveCurveLineSet.prototype.ChangeLineIntermediateSph = function(lineID, intermediatePosition, middle)
{
    var phiM = middle[0];
    var thetaM = middle[1];
    var radiusM = middle[2];
    var middlePnt = [radiusM * Math.sin(phiM) * Math.sin(thetaM), radiusM * Math.cos(thetaM), radiusM * Math.cos(phiM) * Math.sin(thetaM)];;
    vec3.add(middlePnt, middlePnt, middle);
    this.lines[lineID].intermediatePosition = intermediatePosition;
};

/**
 * Changes line multi color parameters
 * @param {Number} lineID
 * @param {quat4} color
 * @param {Number} border
 */
EveCurveLineSet.prototype.ChangeLineMultiColor = function(lineID, color, border)
{
    this.lines[lineID].multiColor = color;
    this.lines[lineID].multiColorBorder = border;
};

/**
 * Changes a line's animation parameters
 * @param {Number} lineID
 * @param {quat4} color
 * @param {Number} speed
 * @param {Number} scale
 */
EveCurveLineSet.prototype.ChangeLineAnimation = function(lineID, color, speed, scale)
{
    this.lines[lineID].overlayColor = color;
    this.lines[lineID].animationSpeed = speed;
    this.lines[lineID].animationScale = scale;
};

/**
 * Changes a line's segmentation
 * @param {Number} lineID
 * @param {Number} numOfSegments
 */
EveCurveLineSet.prototype.ChangeLineSegmentation = function(lineID, numOfSegments)
{
    if (this.lines[lineID].type != EveCurveLineSet.LINETYPE_STRAIGHT)
    {
        this.lines[lineID].numOfSegments = numOfSegments;
    }
};

/**
 * Removes a line
 * @param {Number} lineID
 */
EveCurveLineSet.prototype.RemoveLine = function(lineID)
{
    this.emptyLineID.push(lineID);
    this.lines[lineID].type = EveCurveLineSet.LINETYPE_INVALID;
};

/**
 * Clears all lines
 */
EveCurveLineSet.prototype.ClearLines = function()
{
    this.lines = [];
    this.emptyLineID = [];
};

/**
 * Gets line count
 * @returns {Number}
 * @private
 */
EveCurveLineSet.prototype._lineCount = function()
{
    var count = 0;
    for (var i = 0; i < this.lines.length; ++i)
    {
        if (this.lines[i].type != EveCurveLineSet.LINETYPE_INVALID)
        {
            count += this.lines[i].numOfSegments;
        }
    }
    return count;
};

/**
 * Fills color vertices
 * @param lineData
 * @param buffer
 * @param offset
 * @returns {*}
 * @private
 */
EveCurveLineSet.prototype._fillColorVertices = function(lineData, buffer, offset)
{
    buffer[offset++] = lineData.multiColor[0];
    buffer[offset++] = lineData.multiColor[1];
    buffer[offset++] = lineData.multiColor[2];
    buffer[offset++] = lineData.multiColor[3];
    buffer[offset++] = lineData.overlayColor[0];
    buffer[offset++] = lineData.overlayColor[1];
    buffer[offset++] = lineData.overlayColor[2];
    buffer[offset++] = lineData.overlayColor[3];
    return offset;
};

/**
 * Writes line vertices to the vertex buffer
 * @param {EveCurveLineSet} self
 * @param {vec3} position1
 * @param {quat4} color1
 * @param length1
 * @param {vec3} position2
 * @param {quat4} color2
 * @param length2
 * @param {Number} lineID
 * @param buffer
 * @param {Number} offset
 * @private
 */
EveCurveLineSet.prototype._writeLineVerticesToBuffer = function(self, position1, color1, length1, position2, color2, length2, lineID, buffer, offset)
{
    var lineData = this.lines[lineID];

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
    offset = this._fillColorVertices(lineData, buffer, offset);

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
    offset = this._fillColorVertices(lineData, buffer, offset);

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
    offset = this._fillColorVertices(lineData, buffer, offset);

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
    offset = this._fillColorVertices(lineData, buffer, offset);

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
    offset = this._fillColorVertices(lineData, buffer, offset);

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
    offset = this._fillColorVertices(lineData, buffer, offset);
};

/**
 * Updates line changes
 */
EveCurveLineSet.prototype.SubmitChanges = function()
{
    this._vertexBuffer = null;
    if (!this.lines.length)
    {
        return;
    }

    this._vertexBufferSize = this._lineCount();
    var data = new Float32Array(this._vertexBufferSize * 6 * this._vertexSize);
    var offset = 0;

    var startDir = vec3.create();
    var endDir = vec3.create();
    var startDirNrm = vec3.create();
    var endDirNrm = vec3.create();
    var rotationAxis = vec3.create();
    var rotationMatrix = mat4.zero();
    var dir1 = vec3.create();
    var dir2 = vec3.create();
    var col1 = vec4.create();
    var col2 = vec4.create();
    var pt1 = vec3.create();
    var pt2 = vec3.create();
    var j, tmp, segmentFactor;

    for (var i = 0; i < this.lines.length; ++i)
    {
        switch (this.lines[i].type)
        {
            case EveCurveLineSet.LINETYPE_INVALID:
                break;

            case EveCurveLineSet.LINETYPE_STRAIGHT:
                this._writeLineVerticesToBuffer(this, this.lines[i].position1, this.lines[i].color1, 0, this.lines[i].position2, this.lines[i].color2, 1, i, data, offset);
                offset += 6 * this._vertexSize;
                break;

            case EveCurveLineSet.LINETYPE_SPHERED:
                vec3.subtract(startDir, this.lines[i].position1, this.lines[i].intermediatePosition);
                vec3.subtract(endDir, this.lines[i].position2, this.lines[i].intermediatePosition);
                vec3.normalize(startDirNrm, startDir);
                vec3.normalize(endDirNrm, endDir);
                vec3.cross(rotationAxis, startDir, endDir);
                var fullAngle = Math.acos(vec3.dot(startDirNrm, endDirNrm));
                var segmentAngle = fullAngle / this.lines[i].numOfSegments;
                mat4.identity(rotationMatrix);
                mat4.rotate(rotationMatrix, rotationMatrix, segmentAngle, rotationAxis);
                vec3.copy(dir1, startDir);
                vec4.copy(col1, this.lines[i].color1);

                for (j = 0; j < this.lines[i].numOfSegments; ++j)
                {
                    segmentFactor = (j + 1) / this.lines[i].numOfSegments;
                    // TODO: Test this refactoring, vec3.transformMat4 implicitly sets w to 1
                    vec3.transformMat4(dir2, dir1, rotationMatrix);
                    col2[0] = this.lines[i].color1[0] * (1 - segmentFactor) + this.lines[i].color2[0] * segmentFactor;
                    col2[1] = this.lines[i].color1[1] * (1 - segmentFactor) + this.lines[i].color2[1] * segmentFactor;
                    col2[2] = this.lines[i].color1[2] * (1 - segmentFactor) + this.lines[i].color2[2] * segmentFactor;
                    col2[3] = this.lines[i].color1[3] * (1 - segmentFactor) + this.lines[i].color2[3] * segmentFactor;
                    vec3.add(pt1, dir1, this.lines[i].intermediatePosition);
                    vec3.add(pt2, dir2, this.lines[i].intermediatePosition);

                    this._writeLineVerticesToBuffer(this, pt1, col1, j / this.lines[i].numOfSegments, pt2, col2, segmentFactor, i, data, offset);
                    offset += 6 * this._vertexSize;

                    tmp = dir1;
                    dir1 = dir2;
                    dir2 = tmp;
                    tmp = col1;
                    col1 = col2;
                    col2 = tmp;
                }
                break;

            case EveCurveLineSet.LINETYPE_CURVED:
                var tangent1 = vec3.create();
                var tangent2 = vec3.create();
                var pos1 = vec3.create();
                var pos2 = vec3.create();

                vec3.subtract(tangent1, this.lines[i].intermediatePosition, this.lines[i].position1);
                vec3.subtract(tangent2, this.lines[i].position2, this.lines[i].intermediatePosition);
                vec3.copy(pos1, this.lines[i].position1);
                vec3.copy(col1, this.lines[i].color1);

                for (j = 0; j < this.lines[i].numOfSegments; ++j)
                {
                    segmentFactor = (j + 1) / this.lines[i].numOfSegments;
                    vec3.hermite(pos2, this.lines[i].position1, tangent1, this.lines[i].position2, tangent2, segmentFactor);
                    col2[0] = this.lines[i].color1[0] * (1 - segmentFactor) + this.lines[i].color2[0] * segmentFactor;
                    col2[1] = this.lines[i].color1[1] * (1 - segmentFactor) + this.lines[i].color2[1] * segmentFactor;
                    col2[2] = this.lines[i].color1[2] * (1 - segmentFactor) + this.lines[i].color2[2] * segmentFactor;
                    col2[3] = this.lines[i].color1[3] * (1 - segmentFactor) + this.lines[i].color2[3] * segmentFactor;
                    this._writeLineVerticesToBuffer(this, pos1, col1, j / this.lines[i].numOfSegments, pos2, col2, segmentFactor, i, data, offset);
                    offset += 6 * this._vertexSize;

                    tmp = pos1;
                    pos1 = pos2;
                    pos2 = tmp;
                    tmp = col1;
                    col1 = col2;
                    col2 = tmp;
                }
        }
    }

    if (this._vertexBuffer)
    {
        device.gl.deleteBuffer(this._vertexBuffer);
    }

    this._vertexBuffer = device.gl.createBuffer();
    device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._vertexBuffer);
    device.gl.bufferData(device.gl.ARRAY_BUFFER, data, device.gl.STATIC_DRAW);
    device.gl.bindBuffer(device.gl.ARRAY_BUFFER, null);
};

EveCurveLineSet.LINETYPE_INVALID = 0;
EveCurveLineSet.LINETYPE_STRAIGHT = 1;
EveCurveLineSet.LINETYPE_SPHERED = 2;
EveCurveLineSet.LINETYPE_CURVED = 3;

/**
 * Accumulates render batches
 * @param {RenderMode} mode
 * @param {Tw2BatchAccumulator} accumulator
 */
EveCurveLineSet.prototype.GetBatches = function(mode, accumulator)
{
    if (!this.display || !this._vertexBuffer)
    {
        return;
    }

    switch (mode)
    {
        case device.RM_TRANSPARENT:
            if (!this.lineEffect || this.additive) return;
            break;

        case device.RM_ADDITIVE:
            if (!this.lineEffect || !this.additive) return;
            break;

        case device.RM_PICKABLE:
            if (!this.pickEffect || !this.pickable) return;
            break;

        default:
            return;
    }

    var batch = new Tw2ForwardingRenderBatch();
    mat4.transpose(this.perObjectData.perObjectVSData.Get('WorldMat'), this.transform);
    batch.perObjectData = this.perObjectData;
    batch.geometryProvider = this;
    batch.renderMode = mode;
    accumulator.Commit(batch);

};

/**
 * Unloads the curve line set vertex buffer
 */
EveCurveLineSet.prototype.Unload = function()
{
    if (this._vertexBuffer)
    {
        device.gl.deleteBuffer(this._vertexBuffer);
        this._vertexBuffer = null;
    }
};

/**
 * Renders lines
 * @param {RenderBatch} batch
 * @param {Tw2Effect} [overrideEffect]
 * @returns {Boolean}
 */
EveCurveLineSet.prototype.Render = function(batch, overrideEffect)
{
    var effect = overrideEffect || (batch.renderMode === device.RM_PICKABLE) ? this.pickEffect : this.lineEffect;
    var effectRes = effect.GetEffectRes();
    if (!effectRes._isGood)
    {
        return false;
    }

    var d = device;
    d.gl.bindBuffer(d.gl.ARRAY_BUFFER, this._vertexBuffer);

    if (this.disableDepth) device.gl.disable(device.gl.DEPTH_TEST);

    var passCount = effect.GetPassCount();
    for (var pass = 0; pass < passCount; ++pass)
    {
        effect.ApplyPass(pass);
        var passInput = effect.GetPassInput(pass);
        if (!this.declaration.SetDeclaration(passInput, this.declaration.stride))
        {
            return false;
        }
        d.ApplyShadowState();
        d.gl.drawArrays(d.gl.TRIANGLES, 0, this._vertexBufferSize * 6);
    }

    if (this.disableDepth) device.gl.enable(device.gl.DEPTH_TEST);
    return true;
};

/**
 * Per frame update
 */
EveCurveLineSet.prototype.Update = function() {};

/**
 * Per frame view dependent data update
 * @param {mat4} parentTransform
 */
EveCurveLineSet.prototype.UpdateViewDependentData = function(parentTransform)
{
    // TODO: Check this refactoring
    mat4.fromRotationTranslationScale(this.transform, this.translation, this.rotation, this.scaling);
    mat4.multiply(this.transform, this.transform, parentTransform);
};

/**
 * Gets curve line set res objects
 * @param {Array} [out=[]] - Optional receiving array
 * @returns {Array.<Tw2EffectRes|Tw2TextureRes>} [out]
 */
EveCurveLineSet.prototype.GetResources = function(out)
{
    if (out === undefined)
    {
        out = [];
    }

    this.lineEffect.GetResources(out);

    if (this.pickEffect !== null)
    {
        this.pickEffect.GetResources(out);
    }

    return out;
};
