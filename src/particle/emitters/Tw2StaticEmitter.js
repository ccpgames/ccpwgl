import {resMan,} from '../../global';
import {Tw2GeometryMeshElementComponentError, Tw2GeometryMeshParticleElementError} from '../../core';
import {Tw2ParticleEmitter} from './Tw2ParticleEmitter';

/**
 * Tw2StaticEmitter
 *
 * @property {string} name
 * @property {string} geometryResourcePath
 * @property {Tw2GeometryRes} geometryResource
 * @property {Number} geometryIndex
 * @property {Boolean} _spawned
 * @inherits Tw2ParticleEmitter
 * @class
 */
export class Tw2StaticEmitter extends Tw2ParticleEmitter
{
    constructor()
    {
        super();
        this.geometryResourcePath = '';
        this.geometryResource = null;
        this.geometryIndex = 0;
        this._spawned = false;
    }

    /**
     * Initializes the particle emitter
     */
    Initialize()
    {
        if (this.geometryResourcePath !== '')
        {
            this.geometryResource = resMan.GetResource(this.geometryResourcePath);
            this.geometryResource.systemMirror = true;
            this.geometryResource.RegisterNotification(this);
        }
        this._spawned = false;
    }

    /**
     * Rebuilds cached data
     */
    RebuildCachedData()
    {
        if (this.geometryResource && this.geometryResource.meshes.length)
        {
            if (!this.geometryResource.meshes[0].bufferData)
            {
                this.geometryResource.systemMirror = true;
                this.geometryResource.Reload();
            }
        }
    }

    /**
     * Per frame update
     */
    Update()
    {
        const res = this.geometryResource;

        if (!this._spawned &&
            this.particleSystem &&
            res &&
            res.IsGood() &&
            res.meshes.length > this.geometryIndex &&
            res.meshes[this.geometryIndex].bufferData)
        {
            this._spawned = true;

            const
                mesh = res.meshes[this.geometryIndex],
                elts = this.particleSystem.elements,
                inputs = new Array(elts.length);

            for (let i = 0; i < elts.length; ++i)
            {
                const
                    d = elts[i].GetDeclaration(),
                    input = mesh.declaration.FindUsage(d.usage, d.usageIndex - 8);

                if (input === null)
                {
                    res.OnError(new Tw2GeometryMeshParticleElementError({
                        path: res.path,
                        elementUsage: d.usage,
                        elementUsageIndex: d.usageIndex
                    }));
                    return;
                }

                if (input.elements < d.elements)
                {
                    res.OnError(new Tw2GeometryMeshElementComponentError({
                        path: res.path,
                        inputCount: input.elements,
                        elementCount: d.elements,
                        elementUsage: d.usage,
                        elementUsageIndex: d.usageIndex
                    }));
                    return;
                }

                inputs[i] = input.offset / 4;
            }

            const vertexCount = mesh.bufferData.length / mesh.declaration.stride * 4;
            for (let i = 0; i < vertexCount; ++i)
            {
                const index = this.particleSystem.BeginSpawnParticle();
                if (index === null) break;

                for (let j = 0; j < this.particleSystem._elements.length; ++j)
                {
                    const e = this.particleSystem._elements[j];
                    for (let k = 0; k < e.dimension; ++k)
                    {
                        e.buffer[e.instanceStride * index + e.startOffset + k] = mesh.bufferData[inputs[j] + k + i * mesh.declaration.stride / 4];
                    }
                }
                this.particleSystem.EndSpawnParticle();
            }
        }
    }
}
