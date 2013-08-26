function Tw2GeometryBatch()
{
    this._super.constructor.call(this);
    this.geometryRes = null;
    this.meshIx = 0;
    this.start = 0;
    this.count = 1;
    this.effect = null;
    this.batchDepth = 0;
}

Tw2GeometryBatch.prototype.Commit = function (overrideEffect)
{
    var effect = typeof (overrideEffect) == 'undefined' ? this.effect : overrideEffect;
    if (this.geometryRes && effect)
    {
        this.geometryRes.RenderAreas(this.meshIx, this.start, this.count, effect);
    }
};

Inherit(Tw2GeometryBatch, Tw2RenderBatch);

function Tw2GeometryLineBatch()
{
    this._super.constructor.call(this);
    this.geometryRes = null;
    this.meshIx = 0;
    this.start = 0;
    this.count = 1;
    this.effect = null;
    this.batchDepth = 0;
}

Tw2GeometryLineBatch.prototype.Commit = function (overrideEffect)
{
    var effect = typeof (overrideEffect) == 'undefined' ? this.effect : overrideEffect;
    if (this.geometryRes && effect)
    {
        this.geometryRes.RenderLines(this.meshIx, this.start, this.count, effect);
    }
};

Inherit(Tw2GeometryLineBatch, Tw2RenderBatch);


function Tw2GeometryMeshArea()
{
    this.name = '';
    this.start = 0;
    this.count = 0;
	this.minBounds = vec3.create();
	this.maxBounds = vec3.create();
	this.boundsSpherePosition = vec3.create();
	this.boundsSphereRadius = 0;
}

function Tw2GeometryMeshBinding()
{
    this.mesh = null;
    this.bones = [];
}

function Tw2GeometryModel()
{
    this.name = '';
    this.meshBindings = [];
    this.skeleton = null;
}

Tw2GeometryModel.prototype.FindBoneByName = function (name)
{
    if (this.skeleton == null)
    {
        return null;
    }
    for (var b = 0; b < this.skeleton.bones.length; ++b)
    {
        if (this.skeleton.bones[b].name == name)
        {
            return this.skeleton.bones[b];
        }
    }
    return null;
};

function Tw2GeometrySkeleton()
{
    this.bones = [];
}

function Tw2GeometryBone()
{
    this.name = '';
    this.parentIndex = -1;
    this.position = vec3.create();
    this.orientation = quat4.create();
    this.scaleShear = mat3.create();
    
    this.localTransform = mat4.create();
    this.worldTransform = mat4.create();
    this.worldTransformInv = mat4.create();
}

Tw2GeometryBone.prototype.UpdateTransform = function ()
{
    mat3.toMat4(this.scaleShear, this.localTransform);
    mat4.multiply(this.localTransform, mat4.transpose(quat4.toMat4(quat4.normalize(this.orientation))));
    //mat4.translate(this.localTransform, this.position);
    this.localTransform[12] = this.position[0];
    this.localTransform[13] = this.position[1];
    this.localTransform[14] = this.position[2];
    return this.localTransform;    
};

function Tw2GeometryAnimation()
{
    this.name = '';
    this.duration = 0;
    this.trackGroups = [];
}

function Tw2GeometryTrackGroup()
{
    this.name = '';
    this.model = null;
    this.transformTracks = [];
}

function Tw2GeometryTransformTrack()
{
    this.name = '';
    this.position = null;
    this.orientation = null;
    this.scaleShear = null;
}

function Tw2GeometryCurve()
{
    this.dimension = 0;
    this.degree = 0;
    this.knots = null;
    this.controls = null;
}

function Tw2BlendShapeData()
{
    this.name = '';
    this.declaration = new Tw2VertexDeclaration();
    this.buffers = [];
    this.indexes = null;
    this.weightProxy = null;
}

function Tw2GeometryMesh()
{
	this.name = '';
    this.declaration = new Tw2VertexDeclaration();
    this.areas = [];
    this.buffer = null;
    this.bufferData = null;
    this.indexes = null;
    this.indexType = 0;
	this.minBounds = vec3.create();
	this.maxBounds = vec3.create();
	this.boundsSpherePosition = vec3.create();
	this.boundsSphereRadius = 0;
	this.bones = [];
}

function Tw2GeometryRes()
{
	this._super.constructor.call(this);
    this.meshes = [];
	this.minBounds = vec3.create();
	this.maxBounds = vec3.create();
	this.boundsSpherePosition = vec3.create();
	this.boundsSphereRadius = 0;
	
	this.models = [];
	this.animations = [];

	this.systemMirror = false;

	this._instanceCount = 1;
}

function boundsIncludePoint(minBounds, maxBounds, point)
{
	if (minBounds[0] > point[0])
	{
		minBounds[0] = point[0];
	}
	if (minBounds[1] > point[0+1])
	{
		minBounds[1] = point[0+1];
	}
	if (minBounds[2] > point[0+2])
	{
		minBounds[2] = point[0+2];
	}
	if (maxBounds[0] < point[0])
	{
		maxBounds[0] = point[0];
	}
	if (maxBounds[1] < point[0+1])
	{
		maxBounds[1] = point[0+1];
	}
	if (maxBounds[2] < point[0+2])
	{
		maxBounds[2] = point[0+2];
	}
}

Tw2GeometryRes.prototype.requestResponseType = 'arraybuffer';

Tw2GeometryRes.prototype.SetInstanceCount = function (instanceCount)
{
    if (this._instanceCount < instanceCount)
    {
        this._instanceCount = instanceCount;
        if (this.IsGood())
        {
            this.Reload();
        }
    }
};

Tw2GeometryRes.prototype.Prepare = function (data)
{
    var reader = new Tw2BinaryReader(new Uint8Array(data));
    var self = this;

    function ReadVertexBuffer(declaration)
    {
        var declCount = reader.ReadUInt8();
        var vertexSize = 0;
        for (var declIx = 0; declIx < declCount; ++declIx)
        {
            var element = new Tw2VertexElement();
            element.usage = reader.ReadUInt8();
            element.usageIndex = reader.ReadUInt8();
            element.fileType = reader.ReadUInt8();
            element.type = device.gl.FLOAT;
            element.elements = (element.fileType >> 5) + 1;
            element.offset = vertexSize * 4;
            declaration.elements[declIx] = element;
            vertexSize += element.elements;
        }
        declaration.RebuildHash();
        declaration.stride = vertexSize * 4;
        if (reader.ReadVertexBuffer)
        {
            return reader.ReadVertexBuffer(declaration);
        }
        var vertexCount = reader.ReadUInt32();
        if (vertexCount == 0)
        {
            return null;
        }
        var buffer = new Float32Array(vertexSize * vertexCount);
        var index = 0;
        for (var vtxIx = 0; vtxIx < vertexCount; ++vtxIx)
        {
            for (var declIx = 0; declIx < declCount; ++declIx)
            {
                var el = declaration.elements[declIx];
                switch (el.fileType & 0xf)
                {
                    case 0:
                        if (el.fileType & 0x10)
                        {
                            for (var i = 0; i < el.elements; ++i)
                            {
                                buffer[index++] = reader.ReadInt8() / 127.0;
                            }
                        }
                        else
                        {
                            for (var i = 0; i < el.elements; ++i)
                            {
                                buffer[index++] = reader.ReadInt8();
                            }
                        }
                        break;
                    case 1:
                        if (el.fileType & 0x10)
                        {
                            for (var i = 0; i < el.elements; ++i)
                            {
                                buffer[index++] = reader.ReadInt8() / 32767.0;
                            }
                        }
                        else
                        {
                            for (var i = 0; i < el.elements; ++i)
                            {
                                buffer[index++] = reader.ReadInt16();
                            }
                        }
                        break;
                    case 2:
                        for (var i = 0; i < el.elements; ++i)
                        {
                            buffer[index++] = reader.ReadInt32();
                        }
                        break;
                    case 3:
                        for (var i = 0; i < el.elements; ++i)
                        {
                            buffer[index++] = reader.ReadFloat16();
                        }
                        break;
                    case 4:
                        for (var i = 0; i < el.elements; ++i)
                        {
                            buffer[index++] = reader.ReadFloat32();
                        }
                        break;
                    case 8:
                        if (el.fileType & 0x10)
                        {
                            for (var i = 0; i < el.elements; ++i)
                            {
                                buffer[index++] = reader.ReadUInt8() / 255.0;
                            }
                        }
                        else
                        {
                            for (var i = 0; i < el.elements; ++i)
                            {
                                buffer[index++] = reader.ReadUInt8();
                            }
                        }
                        break;
                    case 9:
                        if (el.fileType & 0x10)
                        {
                            for (var i = 0; i < declaration.elements[declIx].elements; ++i)
                            {
                                buffer[index++] = reader.ReadUInt8() / 65535.0;
                            }
                        }
                        else
                        {
                            for (var i = 0; i < el.elements; ++i)
                            {
                                buffer[index++] = reader.ReadUInt16();
                            }
                        }
                        break;
                    case 10:
                        for (var i = 0; i < el.elements; ++i)
                        {
                            buffer[index++] = reader.ReadUInt32();
                        }
                        break;
                    default:
                        console.error('Tw2GeometryRes:', ' error loading wbg data (file ', self.path, ')');
                        throw 1;
                }
            }
        }
        return buffer;
    }

    function ReadIndexBuffer()
    {
        if (reader.ReadIndexBuffer)
        {
            return reader.ReadIndexBuffer();
        }

        var ibType = reader.ReadUInt8();
        var indexCount = reader.ReadUInt32();
        if (ibType == 0)
        {
            var indexes = new Uint16Array(indexCount);
            for (var i = 0; i < indexCount; ++i)
            {
                indexes[i] = reader.ReadUInt16();
            }
            return indexes;
        }
        else
        {
            var indexes = new Uint32Array(indexCount);
            for (var i = 0; i < indexCount; ++i)
            {
                indexes[i] = reader.ReadUInt32();
            }
            return indexes;
        }
    }

    var fileVersion = reader.ReadUInt8();
    var meshCount = reader.ReadUInt8();
    for (var meshIx = 0; meshIx < meshCount; ++meshIx)
    {
        var mesh = new Tw2GeometryMesh();
        mesh.name = reader.ReadString();

        var buffer = ReadVertexBuffer(mesh.declaration);
        if (buffer)
        {
            mesh.buffer = device.gl.createBuffer();
            device.gl.bindBuffer(device.gl.ARRAY_BUFFER, mesh.buffer);
            if (this._instanceCount > 1)
            {
                var tmp = new Float32Array(buffer.length * this._instanceCount);
                for (var i = 0; i < this._instanceCount; ++i)
                {
                    tmp.set(buffer, buffer.length * i);
                }
                buffer = tmp;
            }
            device.gl.bufferData(device.gl.ARRAY_BUFFER, buffer, device.gl.STATIC_DRAW);
        }
        else
        {
            mesh.buffer = null;
        }

        var indexes = ReadIndexBuffer();
        if (indexes)
        {
            mesh.indexes = device.gl.createBuffer();
            mesh.indexType = indexes.BYTES_PER_ELEMENT == 2 ? device.gl.UNSIGNED_SHORT : device.gl.UNSIGNED_INT;
            device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, mesh.indexes);

            if (this._instanceCount > 1)
            {
                var tmp = indexes.BYTES_PER_ELEMENT == 2 ? new Uint16Array(indexes.length * this._instanceCount) : new Uint32Array(indexes.length * this._instanceCount);
                var offset = 0;
                for (var i = 0; i < this._instanceCount; ++i)
                {
                    for (var j = 0; j < indexes.length; ++j)
                    {
                        tmp[j + offset] = indexes[j] + offset;
                    }
                    offset += buffer.length;
                }
                indexes = tmp;
            }
            device.gl.bufferData(device.gl.ELEMENT_ARRAY_BUFFER, indexes, device.gl.STATIC_DRAW);
        }
        else
        {
            mesh.indexes = null;
        }

        var areaCount = reader.ReadUInt8();
        for (var i = 0; i < areaCount; ++i)
        {
            mesh.areas[i] = new Tw2GeometryMeshArea();
            mesh.areas[i].name = reader.ReadString();
            mesh.areas[i].start = reader.ReadUInt32() * indexes.BYTES_PER_ELEMENT;
            mesh.areas[i].count = reader.ReadUInt32() * 3;
            mesh.areas[i].minBounds = vec3.create([reader.ReadFloat32(), reader.ReadFloat32(), reader.ReadFloat32()]);
            mesh.areas[i].maxBounds = vec3.create([reader.ReadFloat32(), reader.ReadFloat32(), reader.ReadFloat32()]);
        }

        var boneBindingCount = reader.ReadUInt8();
        mesh.boneBindings = [];
        for (var i = 0; i < boneBindingCount; ++i)
        {
            mesh.boneBindings[i] = reader.ReadString();
        }

        var annotationSetCount = reader.ReadUInt16();
        if (annotationSetCount || this.systemMirror)
        {
            mesh.bufferData = buffer;
        }
        if (annotationSetCount)
        {
            mesh.blendShapes = [];
            for (var i = 0; i < annotationSetCount; ++i)
            {
                mesh.blendShapes[i] = new Tw2BlendShapeData();
                mesh.blendShapes[i].name = reader.ReadString();
                mesh.blendShapes[i].buffer = ReadVertexBuffer(mesh.blendShapes[i].declaration);
                mesh.blendShapes[i].indexes = ReadIndexBuffer();
            }
        }
        this.meshes[meshIx] = mesh;
    }

    var modelCount = reader.ReadUInt8();
    for (var modelIx = 0; modelIx < modelCount; ++modelIx)
    {
        var model = new Tw2GeometryModel();
        model.name = reader.ReadString();

        model.skeleton = new Tw2GeometrySkeleton();
        var boneCount = reader.ReadUInt8();
        for (var j = 0; j < boneCount; ++j)
        {
            var bone = new Tw2GeometryBone();
            bone.name = reader.ReadString();
            var flags = reader.ReadUInt8();
            bone.parentIndex = reader.ReadUInt8();
            if (bone.parentIndex == 255)
            {
                bone.parentIndex = -1;
            }
            if (flags & 1)
            {
                vec3.set([reader.ReadFloat32(), reader.ReadFloat32(), reader.ReadFloat32()], bone.position);
            }
            else
            {
                vec3.set([0, 0, 0], bone.position);
            }
            if (flags & 2)
            {
                quat4.set([reader.ReadFloat32(), reader.ReadFloat32(), reader.ReadFloat32(), reader.ReadFloat32()], bone.orientation);
            }
            else
            {
                quat4.set([0, 0, 0, 1], bone.orientation);
            }
            if (flags & 4)
            {
                for (var k = 0; k < 9; ++k)
                {
                    bone.scaleShear[k] = reader.ReadFloat32();
                }
            }
            else
            {
                mat3.identity(bone.scaleShear);
            }
            model.skeleton.bones[j] = bone;
        }
        for (var j = 0; j < model.skeleton.bones.length; ++j)
        {
            model.skeleton.bones[j].UpdateTransform();
            if (model.skeleton.bones[j].parentIndex != -1)
            {
                mat4.multiply(model.skeleton.bones[model.skeleton.bones[j].parentIndex].worldTransform, model.skeleton.bones[j].localTransform, model.skeleton.bones[j].worldTransform);
            }
            else
            {
                mat4.set(model.skeleton.bones[j].localTransform, model.skeleton.bones[j].worldTransform);
            }
            mat4.inverse(model.skeleton.bones[j].worldTransform, model.skeleton.bones[j].worldTransformInv);
        }

        var meshBindingCount = reader.ReadUInt8();
        for (var j = 0; j < meshBindingCount; ++j)
        {
            var binding = new Tw2GeometryMeshBinding();
            binding.mesh = this.meshes[reader.ReadUInt8()];
            for (var b = 0; b < binding.mesh.boneBindings.length; ++b)
            {
                var name = binding.mesh.boneBindings[b];
                var bone = model.FindBoneByName(name);
                if (bone == null)
                {
                    console.error(
                        'Tw2GeometryRes:',
                        'mesh \'',
                        binding.mesh.name,
                        '\' in file \'',
                        this.path,
                        '\' has invalid bone name \'',
                        name,
                        '\' for model \'',
                        model.name,
                        '\'');
                }
                else
                {
                    binding.bones[binding.bones.length] = bone;
                }
            }
            model.meshBindings[model.meshBindings.length] = binding;
        }
        this.models[this.models.length] = model;
    }

    function ReadCurve()
    {
        var type = reader.ReadUInt8();
        if (type == 0)
        {
            return null;
        }
        var dimension = reader.ReadUInt8();
        var curve = new Tw2GeometryCurve();
        curve.dimension = dimension;
        curve.degree = reader.ReadUInt8();
        var knotCount = reader.ReadUInt32();
        curve.knots = new Float32Array(knotCount);
        for (var i = 0; i < knotCount; ++i)
        {
            curve.knots[i] = reader.ReadFloat32();
        }
        var controlCount = reader.ReadUInt32();
        curve.controls = new Float32Array(controlCount);
        for (var i = 0; i < controlCount; ++i)
        {
            curve.controls[i] = reader.ReadFloat32();
        }
        return curve;
    }

    var animationCount = reader.ReadUInt8();
    for (var i = 0; i < animationCount; ++i)
    {
        var animation = new Tw2GeometryAnimation();
        animation.name = reader.ReadString();
        animation.duration = reader.ReadFloat32();
        var groupCount = reader.ReadUInt8();
        for (var j = 0; j < groupCount; ++j)
        {
            var group = new Tw2GeometryTrackGroup();
            group.name = reader.ReadString();
            for (var m = 0; m < this.models.length; ++m)
            {
                if (this.models[m].name == name)
                {
                    group.model = this.models[m];
                    break;
                }
            }
            var transformTrackCount = reader.ReadUInt8();
            for (var k = 0; k < transformTrackCount; ++k)
            {
                var track = new Tw2GeometryTransformTrack();
                track.name = reader.ReadString();
                track.orientation = ReadCurve();
                track.position = ReadCurve();
                track.scaleShear = ReadCurve();
                if (track.orientation)
                {
                    var lastX = 0;
                    var lastY = 0;
                    var lastZ = 0;
                    var lastW = 0;
                    for (var n = 0; n < track.orientation.controls.length; n += 4)
                    {
                        var x = track.orientation.controls[n];
                        var y = track.orientation.controls[n + 1];
                        var z = track.orientation.controls[n + 2];
                        var w = track.orientation.controls[n + 3];
                        if (lastX * x + lastY * y + lastZ * z + lastW * w < 0)
                        {
                            track.orientation.controls[n] = -x;
                            track.orientation.controls[n + 1] = -y;
                            track.orientation.controls[n + 2] = -z;
                            track.orientation.controls[n + 3] = -w;
                        }
                        lastX = x;
                        lastY = y;
                        lastZ = z;
                        lastW = w;
                    }
                }
                group.transformTracks[group.transformTracks.length] = track;
            }
            animation.trackGroups[animation.trackGroups.length] = group;
        }
        this.animations[this.animations.length] = animation;
    }
    this.PrepareFinished(true);
};

Tw2GeometryRes.prototype.RenderAreas = function (meshIx, start, count, effect, cb)
{
    this.KeepAlive();
    if (!this._isGood)
    {
        return false;
    }
    var effectRes = effect.GetEffectRes();
    if (!effectRes._isGood)
    {
        return false;
    }
    var d = device;
    var mesh = this.meshes[meshIx];
    d.gl.bindBuffer(d.gl.ARRAY_BUFFER, mesh.buffer);
    d.gl.bindBuffer(d.gl.ELEMENT_ARRAY_BUFFER, mesh.indexes);

    var passCount = effect.GetPassCount();
    for (var pass = 0; pass < passCount; ++pass)
    {
        effect.ApplyPass(pass);
        var passInput = effect.GetPassInput(pass);
        if (!mesh.declaration.SetDeclaration(passInput, mesh.declaration.stride))
        {
            console.error('Tw2GeometryRes:', ' error binding mesh to effect');
            return false;
        }
        d.ApplyShadowState();

        if (typeof (cb) != 'undefined')
        {
            var drawElements = [];
            for (var i = 0; i < count; ++i)
            {
                if (i + start < mesh.areas.length)
                {
                    var area = mesh.areas[i + start];
                    drawElements.push([d.gl.TRIANGLES, area.count, mesh.indexType, area.start]);
                }
            }
            cb(pass, drawElements);
        }
        else
        {
            for (var i = 0; i < count; ++i)
            {
                if (i + start < mesh.areas.length)
                {
                    var area = mesh.areas[i + start];
                    var start = area.start;
                    var acount = area.count;
                    while (i + 1 < count)
                    {
                        var area = mesh.areas[i + 1 + start];
                        if (area.start != start + acount * 2)
                        {
                            break;
                        }
                        acount += area.count;
                        ++i;
                    }
                    d.gl.drawElements(d.gl.TRIANGLES, acount, mesh.indexType, start);
                }
            }
        }
    }
    return true;
};

Tw2GeometryRes.prototype.RenderLines = function (meshIx, start, count, effect, cb)
{
    this.KeepAlive();
    if (!this._isGood)
    {
        return false;
    }
    var effectRes = effect.GetEffectRes();
    if (!effectRes._isGood)
    {
        return false;
    }
    if (meshIx >= this.meshes.length)
    {
        return false;
    }
    var d = device;
    var mesh = this.meshes[meshIx];
    d.gl.bindBuffer(d.gl.ARRAY_BUFFER, mesh.buffer);
    d.gl.bindBuffer(d.gl.ELEMENT_ARRAY_BUFFER, mesh.indexes);

    var passCount = effect.GetPassCount();
    for (var pass = 0; pass < passCount; ++pass)
    {
        effect.ApplyPass(pass);
        var passInput = effect.GetPassInput(pass);
        if (!mesh.declaration.SetDeclaration(passInput, mesh.declaration.stride))
        {
            console.error('Tw2GeometryRes:', ' error binding mesh to effect');
            return false;
        }
        d.ApplyShadowState();

        if (typeof (cb) != 'undefined')
        {
            var drawElements = [];
            for (var i = 0; i < count; ++i)
            {
                if (i + start < mesh.areas.length)
                {
                    var area = mesh.areas[i + start];
                    drawElements.push([d.gl.LINES, area.count, mesh.indexType, area.start]);
                }
            }
            cb(pass, drawElements);
        }
        else
        {
            for (var i = 0; i < count; ++i)
            {
                if (i + start < mesh.areas.length)
                {
                    var area = mesh.areas[i + start];
                    var start = area.start;
                    var acount = area.count;
                    while (i + 1 < count)
                    {
                        var area = mesh.areas[i + 1 + start];
                        if (area.start != start + acount * 2)
                        {
                            break;
                        }
                        acount += area.count;
                        ++i;
                    }
                    d.gl.drawElements(d.gl.LINES, acount, mesh.indexType, start);
                }
            }
        }
    }
    return true;
};



Tw2GeometryRes.prototype.RenderDebugInfo = function (debugHelper)
{
    if (!this.IsGood())
    {
        return false;
    }
    for (var i = 0; i < this.models.length; ++i)
    {
        if (this.models[i].skeleton)
        {
            for (var j = 0; j < this.models[i].skeleton.bones.length; ++j)
            {
                var b0 = this.models[i].skeleton.bones[j];
                if (b0.parentIndex >= 0)
                {
                    var b1 = this.models[i].skeleton.bones[b0.parentIndex];
                    debugHelper.AddLine(
                        [b0.worldTransform[12], b0.worldTransform[13], b0.worldTransform[14]], 
                        [b1.worldTransform[12], b1.worldTransform[13], b1.worldTransform[14]],
                        [0, 0.7, 0, 1],
                        [0, 0.7, 0, 1] );
                }
            }
        }
    }
};

Tw2GeometryRes.prototype.Unload = function ()
{
    for (var i = 0; i < this.meshes.length; ++i)
    {
        if (this.meshes[i].buffer)
        {
            device.gl.deleteBuffer(this.meshes[i].buffer);
            this.meshes[i].buffer = null;
        }
        if (this.meshes[i].indexes)
        {
            device.gl.deleteBuffer(this.meshes[i].indexes);
            this.meshes[i].indexes = null;
        }
    }
    this._isPurged = true;
    this._isGood = false;
    return true;
};

Inherit(Tw2GeometryRes, Tw2Resource);

resMan.RegisterExtension('wbg', Tw2GeometryRes);