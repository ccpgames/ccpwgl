function Tw2ParticleElementDeclaration()
{
    this.elementType = 4;
    this.customName = '';
    this.dimension = 1;
    this.usageIndex = 0;
    this.usedByGPU = true;
}

Tw2ParticleElementDeclaration.LIFETIME = 0;
Tw2ParticleElementDeclaration.POSITION = 1;
Tw2ParticleElementDeclaration.VELOCITY = 2;
Tw2ParticleElementDeclaration.MASS = 3;
Tw2ParticleElementDeclaration.CUSTOM = 4;

Tw2ParticleElementDeclaration.prototype.GetDimension = function ()
{
    switch (this.elementType)
    {
    case Tw2ParticleElementDeclaration.LIFETIME: return 2;
    case Tw2ParticleElementDeclaration.POSITION: return 3;
    case Tw2ParticleElementDeclaration.VELOCITY: return 3;
    case Tw2ParticleElementDeclaration.MASS: return 1;
    }
    return this.dimension;
};

Tw2ParticleElementDeclaration.prototype.GetDeclaration = function ()
{
    var usage = Tw2VertexDeclaration.DECL_TEXCOORD;
    var usageIndex = this.usageIndex + 8;
    switch (this.elementType)
    {
        case Tw2ParticleElementDeclaration.LIFETIME:
            usage = Tw2VertexDeclaration.DECL_TANGENT;
            break;
        case Tw2ParticleElementDeclaration.POSITION:
            usage = Tw2VertexDeclaration.DECL_POSITION;
            break;
        case Tw2ParticleElementDeclaration.VELOCITY:
            usage = Tw2VertexDeclaration.DECL_NORMAL;
            break;
        case Tw2ParticleElementDeclaration.MASS:
            usage = Tw2VertexDeclaration.DECL_BINORMAL;
            break;
        default:
            usageIndex = this.usageIndex + 8;
    }
    return new Tw2VertexElement(usage, usageIndex, device.gl.FLOAT, this.GetDimension());
};


function Tr2ParticleElement(decl)
{
    this.elementType = decl.elementType;
    this.customName = decl.customName;
    this.dimension = decl.GetDimension();
    this.usageIndex = decl.usageIndex;
    this.usedByGPU = decl.usedByGPU;

    this.buffer = null;
    this.startOffset = 0;
    this.offset = 0;
    this.instanceStride = 0;
    this.vertexStride = 0;
    this.dirty = false;
}

function Tw2ParticleSystem()
{
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
}

Tw2ParticleSystem.prototype.Initialize = function ()
{
    this.UpdateElementDeclaration();
};

Tw2ParticleSystem.prototype.UpdateElementDeclaration = function ()
{
    this.isValid = false;
    if (this._vb)
    {
        device.gl.deleteBuffer(this._vb);
        this._vb = null;
    }
    this._declaration = null;

    this.aliveCount = 0;

    if (this.elements.length == 0)
    {
        return;
    }

    this._stdElements = [null, null, null, null];
    this._elements = [];
    this.instanceStride = [0, 0];
    this.vertexStride = [0, 0];
    this._declaration = new Tw2VertexDeclaration();
    this.buffers = [null, null];

    for (var i = 0; i < this.elements.length; ++i)
    {
        var bufferIndex = this.elements[i].usedByGPU ? 0 : 1;
        var el = new Tr2ParticleElement(this.elements[i]);
        //el.buffer = this.buffers[bufferIndex];
        el.startOffset = this.vertexStride[bufferIndex];
        el.offset = el.startOffset;
        if (this.elements[i].elementType != Tw2ParticleElementDeclaration.CUSTOM)
        {
            this._stdElements[this.elements[i].elementType] = el;
        }
        this.vertexStride[bufferIndex] += el.dimension;
        this._elements.push(el);
        if (bufferIndex == 0)
        {
            var d = this.elements[i].GetDeclaration();
            d.offset = el.startOffset * 4;
            this._declaration.elements.push(d);
        }
    }

    this._declaration.RebuildHash();

    for (var i = 0; i < this._elements.length; ++i)
    {
        var bufferIndex = this._elements[i].usedByGPU ? 0 : 1;
        this._elements[i].vertexStride = this.vertexStride[bufferIndex];
    }
    this.instanceStride[0] = this.vertexStride[0] * 4;
    this.instanceStride[1] = this.vertexStride[1] * 4;
    for (var i = 0; i < this._elements.length; ++i)
    {
        var bufferIndex = this._elements[i].usedByGPU ? 0 : 1;
        this._elements[i].instanceStride = this.instanceStride[bufferIndex];
    }



    this.buffers = [null, null];
    if (this.instanceStride[0] && this.maxParticleCount)
    {
        this.buffers[0] = new Float32Array(this.instanceStride[0] * this.maxParticleCount);
        this._vb = device.gl.createBuffer();
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._vb);
        device.gl.bufferData(device.gl.ARRAY_BUFFER, this.buffers[0].length * 4, device.gl.DYNAMIC_DRAW);
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, null);
        this._ib = device.gl.createBuffer();
        var ib = new Uint16Array(this.maxParticleCount * 6);
        for (var i = 0; i < this.maxParticleCount; ++i)
        {
            ib[i * 6] = i * 4;
            ib[i * 6 + 1] = i * 4 + 1;
            ib[i * 6 + 2] = i * 4 + 2;
            ib[i * 6 + 3] = i * 4 + 2;
            ib[i * 6 + 4] = i * 4 + 1;
            ib[i * 6 + 5] = i * 4 + 3;
        }
        device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, this._ib);
        device.gl.bufferData(device.gl.ELEMENT_ARRAY_BUFFER, ib, device.gl.STATIC_DRAW);
        device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, null);
    }
    if (this.instanceStride[1])
    {
        this.buffers[1] = new Float32Array(this.instanceStride[1] * this.maxParticleCount);
    }
    for (var i = 0; i < this._elements.length; ++i)
    {
        var bufferIndex = this._elements[i].usedByGPU ? 0 : 1;
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
};

Tw2ParticleSystem.prototype.HasElement = function (type)
{
    return this._stdElements[type] != null;
};

Tw2ParticleSystem.prototype.GetElement = function (type)
{
    if (this._stdElements[type])
    {
        this._stdElements[type].offset = this._stdElements[type].startOffset;
    }
    return this._stdElements[type];
};

Tw2ParticleSystem.prototype.BeginSpawnParticle = function ()
{
    if (!this.isValid || this.aliveCount >= this.maxParticleCount)
    {
        return null;
    }
    return this.aliveCount++;
};

Tw2ParticleSystem.prototype.EndSpawnParticle = function ()
{
    var index = this.aliveCount - 1;
    for (var j = 0; j < 2; ++j)
    {
        if (this.buffers[j])
        {
            var original = this.buffers[j].subarray(this.instanceStride[j] * index, this.instanceStride[j] * index + this.vertexStride[j]);
            for (var i = 1; i < 4; ++i)
            {
                this.buffers[j].set(original, this.instanceStride[j] * index + i * this.vertexStride[j]);
            }
        }
    }
    this.bufferDirty = true;
};

Tw2ParticleSystem.prototype.Update = function (dt)
{
    dt = Math.min(dt, 0.1);
    if (this.applyAging && this.HasElement(Tw2ParticleElementDeclaration.LIFETIME))
    {
        var lifetime = this.GetElement(Tw2ParticleElementDeclaration.LIFETIME);
        var position = this.emitParticleOnDeathEmitter ? this.GetElement(Tw2ParticleElementDeclaration.POSITION) : null;
        var velocity = this.emitParticleOnDeathEmitter ? this.GetElement(Tw2ParticleElementDeclaration.VELOCITY) : null;

        for (var i = 0; i < this.aliveCount; ++i)
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
                    for (var j = 0; j < 2; ++j)
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
                if (position)
                {
                    position.offset += position.instanceStride;
                }
                if (velocity)
                {
                    velocity.offset += velocity.instanceStride;
                }
            }
        }
        lifetime.dirty = true;
    }
    var tmpVec3 = vec3.create();
    if (this.updateSimulation && this.HasElement(Tw2ParticleElementDeclaration.POSITION) && this.HasElement(Tw2ParticleElementDeclaration.VELOCITY))
    {
        var hasForces = this.applyForce && this.forces.length;
        for (var i = 0; i < this.forces.length; ++i)
        {
            this.forces[i].Update(dt);
        }
        var position = this.GetElement(Tw2ParticleElementDeclaration.POSITION);
        var velocity = this.GetElement(Tw2ParticleElementDeclaration.VELOCITY);
        var mass = hasForces ? this.GetElement(Tw2ParticleElementDeclaration.MASS) : null;
        for (var i = 0; i < this.aliveCount; ++i)
        {
            if (hasForces)
            {
                var amass = 1;
                if (mass)
                {
                    amass = mass.buffer[mass.offset];
                }
                var force = tmpVec3;
                force[0] = force[1] = force[2] = 0;
                for (var j = 0; j < this.forces.length; ++j)
                {
                    this.forces[j].ApplyForce(position, velocity, force, dt, amass);
                }
                if (mass)
                {
                    vec3.scale(force, 1. / mass.buffer[mass.offset]);
                }
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
            if (mass)
            {
                mass.offset += mass.instanceStride;
            }
        }
        position.dirty = true;
        velocity.dirty = true;
    }
    if (this.updateSimulation && this.constraints.length)
    {
        for (var i = 0; i < this.constraints.length; ++i)
        {
            this.constraints[i].ApplyConstraint(this.buffers, this.instanceStride, this.aliveCount, dt);
        }
    }

    if (this.updateBoundingBox)
    {
        this.GetBoundingBox(this.aabbMin, this.aabbMax);
    }

    if (this.emitParticleDuringLifeEmitter && !(this.HasElement(Tw2ParticleElementDeclaration.POSITION) && this.HasElement(Tw2ParticleElementDeclaration.VELOCITY)) && this.updateSimulation)
    {
        var position = this.GetElement(Tw2ParticleElementDeclaration.POSITION);
        var velocity = this.GetElement(Tw2ParticleElementDeclaration.VELOCITY);

        for (var i = 0; i < this.aliveCount; ++i)
        {
            this.emitParticleDuringLifeEmitter.SpawnParticles(position, velocity, 1);

            if (position)
            {
                position.offset += position.instanceStride;
            }
            if (velocity)
            {
                velocity.offset += velocity.instanceStride;
            }
        }
    }

    for (var i = 0; i < this._elements.length; ++i)
    {
        var el = this._elements[i];
        el.offset = el.startOffset;
        if (el.dirty)
        {
            this.bufferDirty = true;
            for (var j = 0; j < this.aliveCount; ++j)
            {
                for (var k = 1; k < 4; ++k)
                {
                    for (var m = 0; m < el.dimension; ++m)
                    {
                        el.buffer[el.offset + k * el.vertexStride + m] = el.buffer[el.offset + m];
                    }
                }
                el.offset += el.instanceStride;
            }
            el.dirty = false;
        }
    }
};

Tw2ParticleSystem.prototype.GetBoundingBox = function (aabbMin, aabbMax)
{
    if (this.aliveCount && this.HasElement(Tw2ParticleElementDeclaration.POSITION))
    {
        var position = this.GetElement(Tw2ParticleElementDeclaration.POSITION);
        aabbMin[0] = position.buffer[position.offset];
        aabbMin[1] = position.buffer[position.offset + 1];
        aabbMin[2] = position.buffer[position.offset + 2];
        aabbMax[0] = position.buffer[position.offset];
        aabbMax[1] = position.buffer[position.offset + 1];
        aabbMax[2] = position.buffer[position.offset + 2];
        for (var i = 0; i < this.aliveCount; ++i)
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
};

Tw2ParticleSystem.prototype._Sort = function () {
    var eye = device.viewInv;
    var position = this.GetElement(Tw2ParticleElementDeclaration.POSITION);
    var count = this.aliveCount;
    var distances = this._distancesBuffer;
    for (var i = 0; i < count; ++i) {
        var o0 = position.offset + position.instanceStride * i;
        var dd = position.buffer[o0] - eye[12];
        var l0 = dd * dd;
        dd = position.buffer[o0 + 1] - eye[13];
        l0 += dd * dd;
        dd = position.buffer[o0 + 2] - eye[14];
        l0 += dd * dd;
        distances[i] = l0;
    }
    var sortItems = function (a, b)
    {
        if (a >= count && b >= count)
        {
            if (a < b) return -1;
            if (a > b) return 1;
            return 0;
        }
        if (a >= count)
        {
            return 1;
        }
        if (b >= count)
        {
            return -1;
        }
        var l0 = distances[a];
        var l1 = distances[b];

        if (l0 < l1) return 1;
        if (l0 > l1) return -1;
        return 0;
    };
    for (i = 0; i < this.maxParticleCount; ++i)
    {
        this._sortedIndexes[i] = i;
    }
    this._sortedIndexes.sort(sortItems);
};

Tw2ParticleSystem.prototype.Render = function (effect, instanceVB, instanceIB, instanceDecl, instanceStride)
{
    if (this.aliveCount == 0)
    {
        return false;
    }
    var effectRes = effect.GetEffectRes();
    if (!effectRes._isGood)
    {
        return false;
    }

    var d = device;

    if (this.requiresSorting && this.HasElement(Tw2ParticleElementDeclaration.POSITION) && this.buffers)
    {
        this._Sort();
        var stride = this.instanceStride[0];
        var gpuBuffer = this.buffers[0];
        var toOffset, fromOffset, j;
        for (var i = 0; i < this.aliveCount; ++i)
        {
            toOffset = i * stride;
            fromOffset = this._sortedIndexes[i] * stride;
            for (j = 0; j < stride; ++j) {
                this._sortedBuffer[toOffset + j] = gpuBuffer[j + fromOffset];
            }
        }
        d.gl.bindBuffer(d.gl.ARRAY_BUFFER, this._vb);
        d.gl.bufferSubData(d.gl.ARRAY_BUFFER, 0, this._sortedBuffer.subarray(0, this.instanceStride[0] * this.aliveCount));
        this.bufferDirty = false;
    }
    else if (this.bufferDirty)
    {
        d.gl.bindBuffer(d.gl.ARRAY_BUFFER, this._vb);
        d.gl.bufferSubData(d.gl.ARRAY_BUFFER, 0, this.buffers[0].subarray(0, this.instanceStride[0] * this.aliveCount));
        this.bufferDirty = false;
    }

    d.gl.bindBuffer(d.gl.ELEMENT_ARRAY_BUFFER, this._ib);

    var passCount = effect.GetPassCount();
    for (var pass = 0; pass < passCount; ++pass)
    {
        effect.ApplyPass(pass);
        var passInput = effect.GetPassInput(pass);
        d.gl.bindBuffer(d.gl.ARRAY_BUFFER, this._vb);
        this._declaration.SetPartialDeclaration(passInput, this.vertexStride[0] * 4);
        d.gl.bindBuffer(d.gl.ARRAY_BUFFER, instanceVB);
        instanceDecl.SetPartialDeclaration(passInput, instanceStride);
        d.ApplyShadowState();

        d.gl.drawElements(d.gl.TRIANGLES, this.aliveCount * 6, d.gl.UNSIGNED_SHORT, 0);
    }
    return true;
};

Tw2ParticleSystem.prototype.GetMaxInstanceCount = function ()
{
    return this.maxParticleCount;
};


