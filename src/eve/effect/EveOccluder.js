import {vec3, vec4, mat4, util} from '../../math';
import {device as d, store, Tw2Effect, Tw2VertexDeclaration, Tw2BatchAccumulator} from '../../core';

/**
 * EveOccluder
 *
 * @property {number|string} _id
 * @property {String} name
 * @property {boolean} display
 * @property {number} value
 * @property {Array.<EveSpriteSet>} sprites
 * @class
 */
export class EveOccluder
{
    constructor()
    {
        this._id = util.generateID();
        this.name = '';
        this.display = true;
        this.value = 1;
        this.sprites = [];

        EveOccluder.init();
    }

    /**
     * UpdateValues
     * @param {mat4} parentTransform
     * @param {number} index
     */
    UpdateValue(parentTransform, index)
    {
        if (!this.display || !d.alphaBlendBackBuffer) return;

        const
            g = EveOccluder.global,
            worldViewProj = g.mat4_0,
            center = g.vec4_0;

        g.accumulator.Clear();

        for (let i = 0; i < this.sprites.length; ++i)
        {
            this.sprites[i].UpdateViewDependentData(parentTransform);
            this.sprites[i].GetBatches(d.RM_DECAL, g.accumulator);
        }

        store.GetVariable('OccluderValue').value.set([(1 << (index * 2)) / 255.0, (2 << (index * 2)) / 255.0, 0, 0]);
        g.accumulator.Render();

        mat4.multiply(worldViewProj, d.viewProjection, this.sprites[0].worldTransform);
        vec4.transformMat4(center, [0, 0, 0, 1], worldViewProj);

        const
            x0 = (center[0] / center[3] + 1) * 0.5,
            y0 = (center[1] / center[3] + 1) * 0.5;

        vec4.set(center, 0.5, 0.5, 0, 1);
        vec4.transformMat4(center, center, worldViewProj);

        const
            x1 = (center[0] / center[3] + 1) * 0.5,
            y1 = (center[1] / center[3] + 1) * 0.5;

        center[0] = x0;
        center[1] = y0;
        center[2] = x1 - x0;
        center[3] = y1 - y0;

        g.effect.parameters.OccluderPosition.SetValue(center);
    }

    /**
     * CollectSamples
     * @param {Tw2TextureRes} tex
     * @param {number} index
     * @param {number} total
     * @param {number} samples
     * @returns boolean
     */
    static CollectSamples(tex, index, total, samples)
    {
        const
            g = this.global,
            effect= g.effect,
            vertexBuffer = g.vertexBuffer,
            decl = g.decl;

        if (!effect.IsGood()) return false;

        effect.parameters.BackBuffer.textureRes = tex;
        effect.parameters.OccluderIndex.SetValue([index, total, samples]);

        d.SetStandardStates(d.RM_ADDITIVE);
        d.gl.bindBuffer(d.gl.ARRAY_BUFFER, vertexBuffer);

        for (let pass = 0; pass < effect.GetPassCount(); ++pass)
        {
            effect.ApplyPass(pass);
            if (decl.SetDeclaration(effect.GetPassInput(pass), 16)) return false;
            d.ApplyShadowState();
            d.gl.drawArrays(d.gl.TRIANGLES, 0, 255 * 6);
        }
        return true;
    }

    /**
     * Initializes class globals and scratch variables
     */
    static init()
    {
        if (EveOccluder.global) return;

        const g = EveOccluder.global = {};
        g.mat4_0 = mat4.create();
        g.vec4_0 = vec4.create();
        g.accumulator = new Tw2BatchAccumulator();

        g.effect = Tw2Effect.create({
            name: 'Occluder sampler collector',
            effectFilePath: 'res:/graphics/effect/managed/space/specialfx/lensflares/collectsamples.fx',
            parameters: {
                OccluderPosition: vec4.fromValues(1, 1, 1, 1),
                OccluderIndex: vec3.fromValues(1, 1, 1)
            },
            textures: {
                BackBuffer: ''
            }
        });

        g.vertexBuffer = null;
        g.decl = new Tw2VertexDeclaration([
            ['POSITION', 0, 'FLOAT', 2, 0],
            ['TEXCOORD', 0, 'FLOAT', 2, 8]
        ]);

        const vb = new Float32Array(255 * 6 * 4);
        let index = 0;
        for (let i = 0; i < 16; ++i)
        {
            for (let j = 0; j < 16; ++j)
            {
                const
                    x = (i + Math.random()) / 16 * 2 - 1,
                    y = (j + Math.random()) / 16 * 2 - 1;

                vb[index++] = 1;
                vb[index++] = 1;
                vb[index++] = x;
                vb[index++] = y;
                vb[index++] = -1;
                vb[index++] = 1;
                vb[index++] = x;
                vb[index++] = y;
                vb[index++] = 1;
                vb[index++] = -1;
                vb[index++] = x;
                vb[index++] = y;

                vb[index++] = -1;
                vb[index++] = 1;
                vb[index++] = x;
                vb[index++] = y;
                vb[index++] = 1;
                vb[index++] = -1;
                vb[index++] = x;
                vb[index++] = y;
                vb[index++] = -1;
                vb[index++] = -1;
                vb[index++] = x;
                vb[index++] = y;
            }
        }

        g.vertexBuffer = d.gl.createBuffer();
        d.gl.bindBuffer(d.gl.ARRAY_BUFFER, g.vertexBuffer);
        d.gl.bufferData(d.gl.ARRAY_BUFFER, vb, d.gl.STATIC_DRAW);
        d.gl.bindBuffer(d.gl.ARRAY_BUFFER, null);
    }
}

/**
 * Class global and scratch variables
 * @type {{string:*}}
 */
EveOccluder.global = null;