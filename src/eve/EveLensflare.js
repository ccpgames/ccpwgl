/**
 * EveLensFlare
 * @property {String} [name='']
 * @property {boolean} display
 * @property {boolean} update
 * @property {boolean} doOcclusionQueries
 * @property {number} cameraFactor
 * @property {vec3} position
 * @property {Array} flares
 * @property {Array.<EveOccluder>} occluders
 * @property {Array.<EveOccluder>} backgroundOccluders
 * @property {number} occlusionIntensity
 * @property {number} backgroundOcclusionIntensity
 * @property {Array} distanceToEdgeCurves
 * @property {Array} distanceToCenterCurves
 * @property {Array} radialAngleCurves
 * @property {Array} xDistanceToCenter
 * @property {Array} yDistanceToCenter
 * @property {Array} bindings
 * @property {Array.<Tw2CurveSet> curveSets
 * @property {null|Tw2Mesh} mesh
 * @property {vec4} _directionVar
 * @property {vec4} _occlusionVar
 * @property {vec3} _direction
 * @property {mat4} _transform
 * @constructor
 */
function EveLensflare()
{
    this.name = '';
    this.display = true;
    this.update = true;
    this.doOcclusionQueries = true;
    this.cameraFactor = 20;
    this.position = vec3.create();
    this.flares = [];
    this.occluders = [];
    this.backgroundOccluders = [];
    this.occlusionIntensity = 1;
    this.backgroundOcclusionIntensity = 1;

    this.distanceToEdgeCurves = [];
    this.distanceToCenterCurves = [];
    this.radialAngleCurves = [];
    this.xDistanceToCenter = [];
    this.yDistanceToCenter = [];
    this.bindings = [];
    this.curveSets = [];

    this.mesh = null;

    this._directionVar = variableStore.RegisterVariable("LensflareFxDirectionScale", vec4.create());
    this._occlusionVar = variableStore.RegisterVariable("LensflareFxOccScale", vec4.fromValues(1, 1, 0, 0));
    this._direction = vec3.create();
    this._transform = mat4.zero();

    if (!EveLensflare.backBuffer)
    {
        EveLensflare.backBuffer = new Tw2TextureRes();
        EveLensflare.backBuffer.width = 0;
        EveLensflare.backBuffer.height = 0;
        EveLensflare.backBuffer.hasMipMaps = false;
        EveLensflare.occluderLevels = [new Tw2RenderTarget(), new Tw2RenderTarget(), new Tw2RenderTarget(), new Tw2RenderTarget()];
        EveLensflare.occludedLevelIndex = 0;
    }
}

/**
 * Internal helper function
 * @param {mat4} out
 * @param {vec3} v
 */
EveLensflare.prototype.MatrixArcFromForward = function(out, v)
{
    var norm = vec3.create();
    vec3.normalize(norm, v);
    mat4.identity(out);

    if (norm[2] < -0.99999)
    {
        return;
    }
    if (norm[2] > 0.99999)
    {
        out[5] = -1.0;
        out[10] = -1.0;
        return;
    }
    var h = (1 + norm[2]) / (norm[0] * norm[0] + norm[1] * norm[1]);
    out[0] = h * norm[1] * norm[1] - norm[2];
    out[1] = -h * norm[0] * norm[1];
    out[2] = norm[0];

    out[4] = out[1];
    out[5] = h * norm[0] * norm[0] - norm[2];
    out[6] = norm[1];

    out[8] = -norm[0];
    out[9] = -norm[1];
    out[10] = -norm[2];
};

/**
 * Prepares the lensflare for rendering
 */
EveLensflare.prototype.PrepareRender = function()
{
    if (!this.display)
    {
        return;
    }

    var cameraPos = vec3.create();
    vec3.transformMat4(cameraPos, cameraPos, device.viewInv);

    if (vec3.length(this.position) == 0)
    {
        var curPos = vec3.negate(vec3.create(), cameraPos);
        var distScale = vec3.length(curPos);
        if (distScale > 1.5)
        {
            distScale = 1 / Math.log(distScale);
        }
        else
        {
            distScale = 2.5;
        }
        vec3.normalize(this._direction, curPos);
    }
    else
    {
        var invPos = vec3.negate(vec3.create(), this.position);
        vec3.normalize(this._direction, invPos);
    }
    var viewDir = vec4.fromValues(0,0,1,0);
    vec4.transformMat4(viewDir, viewDir, device.viewInv);
    var cameraSpacePos = vec3.create();
    cameraSpacePos[0] = -this.cameraFactor * viewDir[0] + cameraPos[0];
    cameraSpacePos[1] = -this.cameraFactor * viewDir[1] + cameraPos[1];
    cameraSpacePos[2] = -this.cameraFactor * viewDir[2] + cameraPos[2];

    var negDirVec = vec3.negate(vec3.create(), this._direction);
    this.MatrixArcFromForward(this._transform, negDirVec);
    this._transform[12] = cameraSpacePos[0];
    this._transform[13] = cameraSpacePos[1];
    this._transform[14] = cameraSpacePos[2];

    // TODO: ScaleMat is redundant
    var scaleMat = mat4.fromScaling(mat4.create(), [this.occlusionIntensity, this.occlusionIntensity, 1]);
    //__mat4.multiply(this._transform, scaleMat);
    vec3.copy(this._directionVar.value, this._direction);
    this._directionVar.value[3] = 1;

    var d = quat.fromValues(this._direction[0], this._direction[1], this._direction[2], 0);
    vec4.transformMat4(d, d, device.view);
    vec4.transformMat4(d, d, device.projection);
    d[0] /= d[3];
    d[1] /= d[3];
    var distanceToEdge = 1 - Math.min(1 - Math.abs(d[0]), 1 - Math.abs(d[1]));
    var distanceToCenter = Math.sqrt(d[0] * d[0] + d[1] * d[1]);
    var radialAngle = Math.atan2(d[1], d[0]) + Math.PI;

    for (var i = 0; i < this.distanceToEdgeCurves.length; ++i)
    {
        this.distanceToEdgeCurves[i].UpdateValue(distanceToEdge);
    }
    for (i = 0; i < this.distanceToCenterCurves.length; ++i)
    {
        this.distanceToCenterCurves[i].UpdateValue(distanceToCenter);
    }
    for (i = 0; i < this.radialAngleCurves.length; ++i)
    {
        this.radialAngleCurves[i].UpdateValue(radialAngle);
    }
    for (i = 0; i < this.xDistanceToCenter.length; ++i)
    {
        this.xDistanceToCenter[i].UpdateValue(d[0] + 10);
    }
    for (i = 0; i < this.yDistanceToCenter.length; ++i)
    {
        this.yDistanceToCenter[i].UpdateValue(d[1] + 10);
    }
    for (i = 0; i < this.bindings.length; ++i)
    {
        this.bindings[i].CopyValue();
    }
    for (i = 0; i < this.flares.length; ++i)
    {
        this.flares[i].UpdateViewDependentData(this._transform);
    }

};

/**
 * Updates Occluders
 */
EveLensflare.prototype.UpdateOccluders = function()
{
    if (!this.doOcclusionQueries)
    {
        return;
    }
    this.occlusionIntensity = 1;
    this.backgroundOcclusionIntensity = 1;

    if (!EveLensflare.occluderLevels[0].texture || EveLensflare.occluderLevels[0].width < this.occluders.length * 2)
    {
        for (var i = 0; i < EveLensflare.occluderLevels.length; ++i)
        {
            EveLensflare.occluderLevels[i].Create(this.occluders.length * 2, 1, false);
        }
    }
    for (var j = 0; j < this.flares.length; ++j)
    {
        if ('_backBuffer' in this.flares[j])
        {
            this.flares[j]._backBuffer.textureRes = EveLensflare.occluderLevels.texture;
        }
    }

    EveLensflare.occluderLevels[EveLensflare.occludedLevelIndex].Set();
    device.SetStandardStates(device.RM_OPAQUE);
    device.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    device.gl.clear(device.gl.COLOR_BUFFER_BIT);
    EveLensflare.occluderLevels[EveLensflare.occludedLevelIndex].Unset();

    var samples = 1;
    if (device.antialiasing)
    {
        samples = device.msaaSamples;
        device.gl.sampleCoverage(1. / samples, false);
    }
    for (var i = 0; i < this.occluders.length; ++i)
    {
        device.SetRenderState(device.RS_COLORWRITEENABLE, 8);
        device.gl.colorMask(false, false, false, true);
        device.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        device.gl.clear(device.gl.COLOR_BUFFER_BIT);

        if (device.antialiasing)
        {
            // Turn off antialiasing
            device.gl.enable(device.gl.SAMPLE_COVERAGE);
            device.gl.sampleCoverage(0.25, false);
        }
        this.occluders[i].UpdateValue(this._transform, i);
        if (device.antialiasing)
        {
            device.gl.disable(device.gl.SAMPLE_COVERAGE);
        }

        // Copy back buffer into a texture
        if (!EveLensflare.backBuffer.texture)
        {
            EveLensflare.backBuffer.Attach(device.gl.createTexture());
        }
        device.gl.bindTexture(device.gl.TEXTURE_2D, EveLensflare.backBuffer.texture);
        if (EveLensflare.backBuffer.width != device.viewportWidth || EveLensflare.backBuffer.height != device.viewportHeight)
        {
            device.gl.texImage2D(device.gl.TEXTURE_2D, 0, device.gl.RGBA, device.viewportWidth, device.viewportHeight, 0, device.gl.RGBA, device.gl.UNSIGNED_BYTE, null);
            device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MAG_FILTER, device.gl.LINEAR);
            device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MIN_FILTER, device.gl.LINEAR);
            EveLensflare.backBuffer.width = device.viewportWidth;
            EveLensflare.backBuffer.height = device.viewportHeight;
        }
        device.gl.copyTexImage2D(device.gl.TEXTURE_2D, 0, device.alphaBlendBackBuffer ? device.gl.RGBA : device.gl.RGB, 0, 0, EveLensflare.backBuffer.width, EveLensflare.backBuffer.height, 0);
        device.gl.bindTexture(device.gl.TEXTURE_2D, null);

        // Collect samples
        EveLensflare.occluderLevels[EveLensflare.occludedLevelIndex].Set();
        this.occluders[i].CollectSamples(EveLensflare.backBuffer, i, EveLensflare.occluderLevels[0].width / 2, samples);
        EveLensflare.occluderLevels[EveLensflare.occludedLevelIndex].Unset();
    }
    if (device.antialiasing)
    {
        device.gl.sampleCoverage(1, false);
    }

    EveLensflare.occluderLevels[(EveLensflare.occludedLevelIndex + 1) % EveLensflare.occluderLevels.length].Set();
    var pixels = new Uint8Array(EveLensflare.occluderLevels[0].width * 4);
    device.gl.readPixels(0, 0, 2, 1, device.gl.RGBA, device.gl.UNSIGNED_BYTE, pixels);
    EveLensflare.occluderLevels[(EveLensflare.occludedLevelIndex + 1) % EveLensflare.occluderLevels.length].Unset();

    this.occlusionIntensity = 1;
    for (i = 0; i < EveLensflare.occluderLevels[0].width * 2; i += 4)
    {
        this.occlusionIntensity *= pixels[i + 1] ? pixels[i] / pixels[i + 1] : 1;
    }

    this.backgroundOcclusionIntensity = this.occlusionIntensity;
    this._occlusionVar.value[0] = this.occlusionIntensity;
    this._occlusionVar.value[1] = this._occlusionVar.value[0];
    EveLensflare.occludedLevelIndex = (EveLensflare.occludedLevelIndex + 1) % EveLensflare.occluderLevels.length;
};

/**
 * Gets render batches
 * @param {RenderMode} mode
 * @param {Tw2BatchAccumulator} accumulator
 * @param {Tw2PerObjectData} perObjectData
 */
EveLensflare.prototype.GetBatches = function(mode, accumulator, perObjectData)
{
    if (!this.display)
    {
        return;
    }
    var viewDir = quat.fromValues(0,0,1,0);
    vec4.transformMat4(viewDir, viewDir, device.viewInv);
    if (vec3.dot(viewDir, this._direction) < 0)
    {
        return;
    }

    for (var i = 0; i < this.flares.length; ++i)
    {
        this.flares[i].GetBatches(mode, accumulator, perObjectData);
    }
    if (this.mesh)
    {
        this.mesh.GetBatches(mode, accumulator, perObjectData);
    }
};
