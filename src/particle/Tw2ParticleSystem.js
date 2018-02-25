import {vec3, mat4, util} from '../math';
import {device} from '../core';
import {Tw2VertexDeclaration} from '../core';
import {Tw2ParticleElement} from './Tw2ParticleElement';
import {Tw2ParticleElementDeclaration} from './Tw2ParticleElement';


/**
 * Tw2ParticleSystem
 *
 * @property {number|string} _id
 * @property {string} name
 * @property {number} aliveCount
 * @property {number} maxParticleCount
 * @property {*} emitParticleOnDeathEmitter
 * @property {*} emitParticleDuringLifeEmitter
 * @property {Array.<Tw2ParticleElement>} elements
 * @property {boolean} isValid
 * @property {boolean} requiresSorting
 * @property {boolean} updateSimulation
 * @property {boolean} applyForce
 * @property {boolean} applyAging
 * @property {boolean} isGlobal
 * @property {Array<Tw2ParticleForce>} forces
 * @property {Array<Tw2ParticleConstraint>} constraints
 * @property {boolean} updateBoundingBox
 * @property {vec3} aabbMin
 * @property {vec3} aabbMax
 * @property {number} peakAliveCount
 * @property {boolean} bufferDirty
 * @property {WebGLBuffer} _vb
 * @property {Tw2VertexDeclaration} _declaration
 * @property {Array<Tw2ParticleElement>} _stdElements
 * @property {Array<Tw2ParticleElement>} _elements
 * @property {Array} instanceStride
 * @property {Array} vertexStride
 * @property {Array} buffers
 * @class
 */
export class Tw2ParticleSystem 
{
    constructor() 
    {
        this._id = util.generateID();
        this.name = '';
        this.aliveCount = 0;
        this.maxParticleCount = 0;
        this.emitParticleOnDeathEmitter = null;
        this.emitParticleDuringLifeEmitter = null;
        this.elements = [];
        this.isValid = false;
        this.requiresSorting = false;
        this.updateSimulation = true;
        this.applyForce = true;
        this.applyAging = true;
        this.isGlobal = false;
        this.forces = [];
        this.constraints = [];
        this.updateBoundingBox = false;
        this.aabbMin = vec3.create();
        this.aabbMax = vec3.create();
        this.peakAliveCount = 0;
        this.bufferDirty = false;
        this._vb = null;
        this._declaration = null;
        this._stdElements = [null, null, null, null];
        this._elements = [];
        this.instanceStride = [null, null];
        this.vertexStride = [null, null];
        this.buffers = [null, null];

        Tw2ParticleSystem.init();
    }

    /**
     * Initializes the Particle System
     */
    Initialize() 
    {
        this.UpdateElementDeclaration();
    }

    /**
     * Updates Element Declarations
     */
    UpdateElementDeclaration() 
    {
        this.isValid = false;

        if (this._vb) 
        {
            device.gl.deleteBuffer(this._vb);
            this._vb = null;
        }

        this._declaration = null;
        this.aliveCount = 0;

        if (this.elements.length === 0) return;

        this._stdElements = [null, null, null, null];
        this._elements = [];
        this.instanceStride = [0, 0];
        this.vertexStride = [0, 0];
        this._declaration = new Tw2VertexDeclaration();
        this.buffers = [null, null];

        for (let i = 0; i < this.elements.length; ++i) 
        {
            const
                bufferIndex = this.elements[i].usedByGPU ? 0 : 1,
                el = new Tw2ParticleElement(this.elements[i]);
            //el.buffer = this.buffers[bufferIndex];

            el.startOffset = this.vertexStride[bufferIndex];
            el.offset = el.startOffset;
            if (this.elements[i].elementType !== Tw2ParticleElementDeclaration.Type.CUSTOM) 
            {
                this._stdElements[this.elements[i].elementType] = el;
            }
            this.vertexStride[bufferIndex] += el.dimension;
            this._elements.push(el);
            if (bufferIndex === 0) 
            {
                const d = this.elements[i].GetDeclaration();
                d.offset = el.startOffset * 4;
                this._declaration.elements.push(d);
            }
        }

        this._declaration.RebuildHash();

        for (let i = 0; i < this._elements.length; ++i) 
        {
            const bufferIndex = this._elements[i].usedByGPU ? 0 : 1;
            this._elements[i].vertexStride = this.vertexStride[bufferIndex];
        }

        this.instanceStride[0] = this.vertexStride[0] * 4;
        this.instanceStride[1] = this.vertexStride[1] * 4;

        for (let i = 0; i < this._elements.length; ++i) 
        {
            const bufferIndex = this._elements[i].usedByGPU ? 0 : 1;
            this._elements[i].instanceStride = this.instanceStride[bufferIndex];
        }

        this.buffers = [null, null];
        if (this.instanceStride[0] && this.maxParticleCount) 
        {
            this.buffers[0] = new Float32Array(this.instanceStride[0] * this.maxParticleCount);
            this._vb = device.gl.createBuffer();
            device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._vb);
            device.gl.bufferData(device.gl.ARRAY_BUFFER, this.buffers[0].length, device.gl.DYNAMIC_DRAW);
            device.gl.bindBuffer(device.gl.ARRAY_BUFFER, null);
        }

        if (this.instanceStride[1]) 
        {
            this.buffers[1] = new Float32Array(this.instanceStride[1] * this.maxParticleCount);
        }

        for (let i = 0; i < this._elements.length; ++i) 
        {
            const bufferIndex = this._elements[i].usedByGPU ? 0 : 1;
            this._elements[i].buffer = this.buffers[bufferIndex];
        }

        if (this.requiresSorting) 
        {
            this._sortedIndexes = new Array(this.maxParticleCount);
            this._sortedBuffer = new Float32Array(this.instanceStride[0] * this.maxParticleCount);
            this._distancesBuffer = new Float32Array(this.maxParticleCount);
        }

        this.isValid = true;
        this.bufferDirty = true;
    }

    /**
     * Checks if an element type exists
     * @param {number} type
     * @returns {boolean}
     */
    HasElement(type) 
    {
        return this._stdElements[type] !== null;
    }

    /**
     * Gets an element by it's type
     * @param {number} type
     * @returns {Tw2ParticleElement}
     */
    GetElement(type) 
    {
        if (this._stdElements[type]) 
        {
            this._stdElements[type].offset = this._stdElements[type].startOffset;
        }
        return this._stdElements[type];
    }

    /**
     * Begins particle spawning
     * @returns {?number}
     */
    BeginSpawnParticle() 
    {
        if (!this.isValid || this.aliveCount >= this.maxParticleCount) return null;
        return this.aliveCount++;
    }

    /**
     * Ends particle spawning
     */
    EndSpawnParticle() 
    {
        this.bufferDirty = true;
    }

    /**
     * Per frame update
     * @param {number} dt - delta time
     */
    Update(dt) 
    {
        dt = Math.min(dt, 0.1);

        if (this.applyAging && this.HasElement(Tw2ParticleElementDeclaration.Type.LIFETIME)) 
        {
            const
                lifetime = this.GetElement(Tw2ParticleElementDeclaration.Type.LIFETIME),
                position = this.emitParticleOnDeathEmitter ? this.GetElement(Tw2ParticleElementDeclaration.Type.POSITION) : null,
                velocity = this.emitParticleOnDeathEmitter ? this.GetElement(Tw2ParticleElementDeclaration.Type.VELOCITY) : null;

            for (let i = 0; i < this.aliveCount; ++i) 
            {
                lifetime.buffer[lifetime.offset] += dt / lifetime.buffer[lifetime.offset + 1];
                if (lifetime.buffer[lifetime.offset] > 1) 
                {
                    if (this.emitParticleOnDeathEmitter) 
                    {
                        this.emitParticleOnDeathEmitter.SpawnParticles(position, velocity, 1);
                    }

                    this.aliveCount--;
                    if (i < this.aliveCount) 
                    {
                        for (let j = 0; j < 2; ++j) 
                        {
                            if (this.buffers[j]) 
                            {
                                this.buffers[j].set(this.buffers[j].subarray(this.instanceStride[j] * this.aliveCount, this.instanceStride[j] * this.aliveCount + this.instanceStride[j]), i * this.instanceStride[j]);
                            }
                        }
                        --i;
                        this.bufferDirty = true;
                    }
                }
                else 
                {
                    lifetime.offset += lifetime.instanceStride;
                    if (position) position.offset += position.instanceStride;
                    if (velocity) velocity.offset += velocity.instanceStride;
                }
            }
            lifetime.dirty = true;
        }

        const vec3_0 = Tw2ParticleSystem.global.vec3_0;

        if (this.updateSimulation && this.HasElement(Tw2ParticleElementDeclaration.Type.POSITION) && this.HasElement(Tw2ParticleElementDeclaration.Type.VELOCITY)) 
        {
            const hasForces = this.applyForce && this.forces.length;
            for (let i = 0; i < this.forces.length; ++i) 
            {
                this.forces[i].Update(dt);
            }

            const
                position = this.GetElement(Tw2ParticleElementDeclaration.Type.POSITION),
                velocity = this.GetElement(Tw2ParticleElementDeclaration.Type.VELOCITY),
                mass = hasForces ? this.GetElement(Tw2ParticleElementDeclaration.Type.MASS) : null;

            for (let i = 0; i < this.aliveCount; ++i) 
            {
                if (hasForces) 
                {
                    const
                        amass = mass ? mass.buffer[mass.offset] : 1,
                        force = vec3.set(vec3_0, 0, 0, 0);

                    for (let j = 0; j < this.forces.length; ++j) 
                    {
                        this.forces[j].ApplyForce(position, velocity, force, dt, amass);
                    }

                    if (mass) vec3.scale(force, force, 1 / mass.buffer[mass.offset]);

                    velocity.buffer[velocity.offset] += force[0] * dt;
                    velocity.buffer[velocity.offset + 1] += force[1] * dt;
                    velocity.buffer[velocity.offset + 2] += force[2] * dt;
                }

                position.buffer[position.offset] += velocity.buffer[velocity.offset] * dt;
                position.buffer[position.offset + 1] += velocity.buffer[velocity.offset + 1] * dt;
                position.buffer[position.offset + 2] += velocity.buffer[velocity.offset + 2] * dt;

                if (this.emitParticleDuringLifeEmitter) 
                {
                    this.emitParticleDuringLifeEmitter.SpawnParticles(position, velocity, dt);
                }

                position.offset += position.instanceStride;
                velocity.offset += velocity.instanceStride;

                if (mass) mass.offset += mass.instanceStride;
            }
            position.dirty = true;
            velocity.dirty = true;
        }

        if (this.updateSimulation && this.constraints.length) 
        {
            for (let i = 0; i < this.constraints.length; ++i) 
            {
                this.constraints[i].ApplyConstraint(this.buffers, this.instanceStride, this.aliveCount, dt);
            }
        }

        if (this.updateBoundingBox) 
        {
            this.GetBoundingBox(this.aabbMin, this.aabbMax);
        }

        if (this.emitParticleDuringLifeEmitter && !(this.HasElement(Tw2ParticleElementDeclaration.Type.POSITION) && this.HasElement(Tw2ParticleElementDeclaration.Type.VELOCITY)) && this.updateSimulation) 
        {
            const
                position = this.GetElement(Tw2ParticleElementDeclaration.Type.POSITION),
                velocity = this.GetElement(Tw2ParticleElementDeclaration.Type.VELOCITY);

            for (let i = 0; i < this.aliveCount; ++i) 
            {
                this.emitParticleDuringLifeEmitter.SpawnParticles(position, velocity, 1);
                if (position) position.offset += position.instanceStride;
                if (velocity) velocity.offset += velocity.instanceStride;
            }
        }

        for (let i = 0; i < this._elements.length; ++i) 
        {
            const el = this._elements[i];
            el.offset = el.startOffset;
            if (el.dirty) 
            {
                this.bufferDirty = true;
                el.dirty = false;
            }
        }
    }

    /**
     * Gets bounding box
     * @param {vec3} aabbMin
     * @param {vec3} aabbMax
     * @returns {boolean}
     */
    GetBoundingBox(aabbMin, aabbMax) 
    {
        if (this.aliveCount && this.HasElement(Tw2ParticleElementDeclaration.Type.POSITION)) 
        {
            const position = this.GetElement(Tw2ParticleElementDeclaration.Type.POSITION);
            aabbMin[0] = position.buffer[position.offset];
            aabbMin[1] = position.buffer[position.offset + 1];
            aabbMin[2] = position.buffer[position.offset + 2];
            aabbMax[0] = position.buffer[position.offset];
            aabbMax[1] = position.buffer[position.offset + 1];
            aabbMax[2] = position.buffer[position.offset + 2];
            for (let i = 0; i < this.aliveCount; ++i) 
            {
                aabbMin[0] = Math.min(aabbMin[0], position.buffer[position.offset]);
                aabbMin[1] = Math.min(aabbMin[1], position.buffer[position.offset + 1]);
                aabbMin[2] = Math.min(aabbMin[2], position.buffer[position.offset + 2]);
                aabbMax[0] = Math.max(aabbMax[0], position.buffer[position.offset]);
                aabbMax[1] = Math.max(aabbMax[1], position.buffer[position.offset + 1]);
                aabbMax[2] = Math.max(aabbMax[2], position.buffer[position.offset + 2]);
                position.offset += position.instanceStride;
            }
            return true;
        }
        return false;
    }

    /**
     * _Sort
     * @private
     */
    _Sort() 
    {
        const
            eye = mat4.multiply(Tw2ParticleSystem.global.mat4_0, device.projection, device.view), //device.viewInverse;
            position = this.GetElement(Tw2ParticleElementDeclaration.Type.POSITION),
            count = this.aliveCount,
            distances = this._distancesBuffer;

        for (let i = 0; i < count; ++i) 
        {
            const o0 = position.offset + position.instanceStride * i;
            let dd = position.buffer[o0] - eye[12],
                l0 = dd * dd;

            dd = position.buffer[o0 + 1] - eye[13];
            l0 += dd * dd;
            dd = position.buffer[o0 + 2] - eye[14];
            l0 += dd * dd;
            distances[i] = l0;
        }

        /**
         * sortItems
         * @param a
         * @param b
         * @returns {number}
         * @private
         */
        function sortItems(a, b) 
        {
            if (a >= count && b >= count) 
            {
                if (a < b) return -1;
                if (a > b) return 1;
                return 0;
            }

            if (a >= count) return 1;
            if (b >= count) return -1;

            const
                l0 = distances[a],
                l1 = distances[b];

            if (l0 < l1) return 1;
            if (l0 > l1) return -1;
            return 0;
        }

        for (let i = 0; i < this.maxParticleCount; ++i) 
        {
            this._sortedIndexes[i] = i;
        }

        this._sortedIndexes.sort(sortItems);
    }

    /**
     * Updates and gets the particle system's InstanceBuffer
     * @returns {?WebGLBuffer}
     */
    GetInstanceBuffer() 
    {
        if (this.aliveCount === 0) return undefined;

        const d = device;
        if (this.requiresSorting && this.HasElement(Tw2ParticleElementDeclaration.Type.POSITION) && this.buffers) 
        {
            this._Sort();

            const
                stride = this.instanceStride[0],
                gpuBuffer = this.buffers[0];

            for (let i = 0; i < this.aliveCount; ++i) 
            {
                const
                    toOffset = i * stride,
                    fromOffset = this._sortedIndexes[i] * stride;

                for (let j = 0; j < stride; ++j) 
                {
                    this._sortedBuffer[toOffset + j] = gpuBuffer[j + fromOffset];
                }
            }

            d.gl.bindBuffer(d.gl.ARRAY_BUFFER, this._vb);
            d.gl.bufferSubData(d.gl.ARRAY_BUFFER, 0, this._sortedBuffer.subarray(0, this.vertexStride[0] * this.aliveCount));
            this.bufferDirty = false;
        }
        else if (this.bufferDirty) 
        {
            d.gl.bindBuffer(d.gl.ARRAY_BUFFER, this._vb);
            d.gl.bufferSubData(d.gl.ARRAY_BUFFER, 0, this.buffers[0].subarray(0, this.vertexStride[0] * this.aliveCount));
            this.bufferDirty = false;
        }

        return this._vb;
    }

    /**
     * Gets the particle system's InstanceDeclaration
     * @returns {Tw2VertexDeclaration}
     */
    GetInstanceDeclaration() 
    {
        return this._declaration;
    }

    /**
     * Gets the particle system's InstanceStride
     * @returns {number}
     */
    GetInstanceStride() 
    {
        return this.instanceStride[0];
    }

    /**
     * Gets the particle system's InstanceCount
     * @returns {number}
     */
    GetInstanceCount() 
    {
        return this.aliveCount;
    }

    /**
     * Initializes class globals
     */
    static init() 
    {
        if (!Tw2ParticleSystem.global) 
        {
            Tw2ParticleSystem.global = {
                vec3_0: vec3.create(),
                mat4_0: mat4.create()
            };
        }
    }
}

/**
 * Class globals
 */
Tw2ParticleSystem.global = null;
