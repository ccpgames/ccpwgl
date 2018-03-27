import {vec3, vec4, mat4, util} from '../../math';
import {device, store, Tw2TextureRes, Tw2RenderTarget} from '../../core';
import {EveOccluder} from './EveOccluder';

/**
 * EveLensFlare
 *
 * @property {number|string} _id
 * @property {String} name=
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
 * @property {Array.<Tw2CurveSet>} curveSets
 * @property {?Tw2Mesh} mesh
 * @property {vec3} _direction
 * @property {mat4} _transform
 * @property {*} _backBuffer
 * @class
 */
export class EveLensflare
{
    constructor()
    {
        this._id = util.generateID();
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
        this._direction = vec3.create();
        this._transform = mat4.create();
        this._backBuffer = null;

        EveLensflare.init();
    }

    /**
     * Gets lensflares's res objects
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out=[])
    {
        if (this.mesh) this.mesh.GetResources(out);

        for (let i = 0; i < this.flares.length; i++)
        {
            this.flares[i].GetResources(out);
        }

        if (EveOccluder.global && EveOccluder.global.effect && !out.includes(EveOccluder.global.effect))
        {
            out.push(EveOccluder.global.effect);
        }

        return out;
    }

    /**
     * Updates Occluders
     */
    UpdateOccluders()
    {
        if (!this.doOcclusionQueries) return;

        const
            d = device,
            g = EveLensflare.global;

        if (!g.occluderLevels[0].texture || g.occluderLevels[0].width < this.occluders.length * 2)
        {
            for (let i = 0; i < g.occluderLevels.length; ++i)
            {
                g.occluderLevels[i].Create(this.occluders.length * 2, 1, false);
            }
        }

        // TODO: Is this deprecated?
        for (let j = 0; j < this.flares.length; ++j)
        {
            if ('_backBuffer' in this.flares[j])
            {
                this.flares[j]._backBuffer.textureRes = g.occluderLevels.texture;
            }
        }

        this.occlusionIntensity = 1;
        this.backgroundOcclusionIntensity = 1;

        g.occluderLevels[g.occludedLevelIndex].Set();
        d.SetStandardStates(d.RM_OPAQUE);
        d.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        d.gl.clear(d.gl.COLOR_BUFFER_BIT);
        g.occluderLevels[g.occludedLevelIndex].Unset();

        let samples = 1;
        if (d.antialiasing)
        {
            samples = d.msaaSamples;
            d.gl.sampleCoverage(1.0 / samples, false);
        }

        for (let i = 0; i < this.occluders.length; ++i)
        {
            d.SetRenderState(d.RS_COLORWRITEENABLE, 8);
            d.gl.colorMask(false, false, false, true);
            d.gl.clearColor(0.0, 0.0, 0.0, 0.0);
            d.gl.clear(d.gl.COLOR_BUFFER_BIT);

            // Turn off antialiasing
            if (d.antialiasing)
            {
                d.gl.enable(d.gl.SAMPLE_COVERAGE);
                d.gl.sampleCoverage(0.25, false);
            }
            this.occluders[i].UpdateValue(this._transform, i);
            if (d.antialiasing) d.gl.disable(d.gl.SAMPLE_COVERAGE);

            // Copy back buffer into a texture
            if (!g.backBuffer.texture) g.backBuffer.Attach(d.gl.createTexture());
            d.gl.bindTexture(d.gl.TEXTURE_2D, g.backBuffer.texture);
            if (g.backBuffer.width !== d.viewportWidth || g.backBuffer.height !== d.viewportHeight)
            {
                d.gl.texImage2D(d.gl.TEXTURE_2D, 0, d.gl.RGBA, d.viewportWidth, d.viewportHeight, 0, d.gl.RGBA, d.gl.UNSIGNED_BYTE, null);
                d.gl.texParameteri(d.gl.TEXTURE_2D, d.gl.TEXTURE_MAG_FILTER, d.gl.LINEAR);
                d.gl.texParameteri(d.gl.TEXTURE_2D, d.gl.TEXTURE_MIN_FILTER, d.gl.LINEAR);
                g.backBuffer.width = d.viewportWidth;
                g.backBuffer.height = d.viewportHeight;
            }
            d.gl.copyTexImage2D(d.gl.TEXTURE_2D, 0, d.alphaBlendBackBuffer ? d.gl.RGBA : d.gl.RGB, 0, 0, g.backBuffer.width, g.backBuffer.height, 0);
            d.gl.bindTexture(d.gl.TEXTURE_2D, null);

            // Collect samples
            g.occluderLevels[g.occludedLevelIndex].Set();
            EveOccluder.CollectSamples(g.backBuffer, i, g.occluderLevels[0].width / 2, samples);
            g.occluderLevels[g.occludedLevelIndex].Unset();
        }

        if (d.antialiasing) d.gl.sampleCoverage(1, false);

        g.occluderLevels[(g.occludedLevelIndex + 1) % g.occluderLevels.length].Set();
        const pixels = new Uint8Array(g.occluderLevels[0].width * 4);
        d.gl.readPixels(0, 0, 2, 1, d.gl.RGBA, d.gl.UNSIGNED_BYTE, pixels);
        g.occluderLevels[(g.occludedLevelIndex + 1) % g.occluderLevels.length].Unset();

        this.occlusionIntensity = 1;
        for (let i = 0; i < g.occluderLevels[0].width * 2; i += 4)
        {
            this.occlusionIntensity *= pixels[i + 1] ? pixels[i] / pixels[i + 1] : 1;
        }

        this.backgroundOcclusionIntensity = this.occlusionIntensity;

        store.SetVariableValue('LensflareFxOccScale', [ this.occlusionIntensity, this.occlusionIntensity, 0, 0 ]);
        g.occludedLevelIndex = (g.occludedLevelIndex + 1) % g.occluderLevels.length;
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (this.display)
        {
            const viewDir = vec4.set(EveLensflare.global.vec4_0, 0, 0, 1, 0);

            vec4.transformMat4(viewDir, viewDir, device.viewInverse);
            if (vec3.dot(viewDir, this._direction) < 0) return;

            for (let i = 0; i < this.flares.length; ++i)
            {
                this.flares[i].GetBatches(mode, accumulator, perObjectData);
            }

            if (this.mesh)
            {
                this.mesh.GetBatches(mode, accumulator, perObjectData);
            }
        }
    }

    /**
     * Prepares the lensflare for rendering
     */
    PrepareRender()
    {
        if (!this.display) return;

        const
            g = EveLensflare.global,
            viewDir = g.vec4_0,
            cameraPos = g.vec3_0,
            scaleMat = mat4.identity(g.mat4_0),
            cameraSpacePos = g.vec3_2,
            negDirVec = g.vec3_3,
            negPos = g.vec3_1,
            dist = g.vec4_1;

        vec3.transformMat4(cameraPos, [ 0, 0, 0 ], device.viewInverse);

        if (vec3.length(this.position) === 0)
        {
            vec3.negate(negPos, cameraPos);
            //let distScale = vec3.length(negPos);
            //distScale = distScale > 1.5 ? 1 / Math.log(distScale) : 2.5;
        }
        else
        {
            vec3.negate(negPos, this.position);
            vec3.normalize(this._direction, negPos);
        }

        vec4.transformMat4(viewDir, [ 0, 0, 1, 0 ], device.viewInverse);
        vec3.scaleAndAdd(cameraSpacePos, cameraPos, viewDir, -this.cameraFactor);
        vec3.negate(negDirVec, this._direction);
        mat4.arcFromForward(this._transform, negDirVec);
        mat4.setTranslation(this._transform, cameraSpacePos);
        mat4.scale(scaleMat, scaleMat, [this.occlusionIntensity, this.occlusionIntensity, 1]);
        //mat4.multiply(scaleMat, scaleMat, this._transform);

        const dir = this._direction;

        store.SetVariableValue('LensflareFxDirectionScale', [ dir[0], dir[1], dir[2], 1 ]);

        vec4.set(dist, dir[0], dir[1], dir[2], 0);
        vec4.transformMat4(dist, dist, device.view);
        vec4.transformMat4(dist, dist, device.projection);
        dist[0] /= dist[3];
        dist[1] /= dist[3];

        const
            distToEdge = 1 - Math.min(1 - Math.abs(dist[0]), 1 - Math.abs(dist[1])),
            distToCenter = Math.sqrt(dist[0] * dist[0] + dist[1] * dist[1]),
            radialAngle = Math.atan2(dist[1], dist[0]) + Math.PI;

        for (let i = 0; i < this.distanceToEdgeCurves.length; ++i)
        {
            this.distanceToEdgeCurves[i].UpdateValue(distToEdge);
        }

        for (let i = 0; i < this.distanceToCenterCurves.length; ++i)
        {
            this.distanceToCenterCurves[i].UpdateValue(distToCenter);
        }

        for (let i = 0; i < this.radialAngleCurves.length; ++i)
        {
            this.radialAngleCurves[i].UpdateValue(radialAngle);
        }

        for (let i = 0; i < this.xDistanceToCenter.length; ++i)
        {
            this.xDistanceToCenter[i].UpdateValue(dist[0] + 10);
        }

        for (let i = 0; i < this.yDistanceToCenter.length; ++i)
        {
            this.yDistanceToCenter[i].UpdateValue(dist[1] + 10);
        }

        for (let i = 0; i < this.bindings.length; ++i)
        {
            this.bindings[i].CopyValue();
        }

        for (let i = 0; i < this.flares.length; ++i)
        {
            this.flares[i].UpdateViewDependentData(this._transform);
        }
    }

    /**
     * Initializes class global and scratch variables
     */
    static init()
    {
        if (!EveLensflare.global)
        {
            const g = EveLensflare.global = {};
            g.vec3_0 = vec3.create();
            g.vec3_1 = vec3.create();
            g.vec3_2 = vec3.create();
            g.vec3_3 = vec3.create();
            g.vec4_0 = vec4.create();
            g.vec4_1 = vec4.create();
            g.mat4_0 = mat4.create();

            g.backBuffer = new Tw2TextureRes();
            g.backBuffer.width = 0;
            g.backBuffer.height = 0;
            g.backBuffer.hasMipMaps = false;
            g.occludedLevelIndex = 0;
            g.occluderLevels = [
                new Tw2RenderTarget(),
                new Tw2RenderTarget(),
                new Tw2RenderTarget(),
                new Tw2RenderTarget()
            ];
        }
    }
}

/**
 * Class global and scratch variables
 * @type {{string:*}}
 */
EveLensflare.global = null;
