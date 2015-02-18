function StarMap(scene)
{
    // graphics object (ccpwgl_int.EveTransform)
    this.model = null;
    // particle system from underneath this.model
    this.stars = null;
    // distance range parameter for fading stars in a distance
    this.distanceRange = new ccpwgl_int.Tw2Vector4Parameter();
    this.distanceRange.name = 'distanceRange';
    // corners of stars bounding box
    this.corners = [];
    // static map data from star map generator
    this.mapData = null;
    // data set texture (ccpwgl_int.Tw2TextureRes)
    this.dataSet = null;
    // data set texture size
    this.dataSetSize = new Float32Array([1024, 1024]);
    // particle size (min and max)
    this.particleSize = new Float32Array([30, 30]);
    // offsets into the data (offset0, offset1, mix)
    this.dataOffset = vec3.create();
    // color for jump routes
    this.jumpRoutesColor = quat4.create([1, 1, 1, 0.1]);
    
    var self = this;
    scene.loadObject(
        'res:/graphics/starmap/starmap.red',
        function ()
        {
            var obj = this.wrappedObjects[0];
            self.model = obj;
            self.stars = obj.particleSystems[0];
            var starEffect = obj.mesh.additiveAreas[0].effect;
            starEffect.parameters['distanceRange'] = self.distanceRange;
            starEffect.parameters['ParticleSize'] = new ccpwgl_int.Tw2Vector2Parameter('ParticleSize', self.particleSize);
            starEffect.parameters['DataOffset'] = new ccpwgl_int.Tw2Vector3Parameter('DataOffset', self.dataOffset);
            starEffect.parameters['DataSize'] = new ccpwgl_int.Tw2Vector2Parameter('DataSize', self.dataSetSize);
            if (self.dataSet)
            {
                starEffect.parameters['ParticleData'].SetTexturePath(self.dataSet.path);
            }
            starEffect.BindParameters();
            var lineEffect = obj.children[0].mesh.transparentAreas[0].effect;
            lineEffect.parameters['LineColor'] = new ccpwgl_int.Tw2Vector4Parameter('LineColor', self.jumpRoutesColor);
            obj.particleEmitters[0].geometryResource.RegisterNotification(self);
        }
    );
    // internal (private)
    this.RebuildCachedData = function (obj)
    {
        if (obj == this.dataSet)
        {
            this.dataSetSize[0] = obj.width;
            this.dataSetSize[1] = obj.height;
            if (this.model)
            {
                var starEffect = this.model.mesh.additiveAreas[0].effect;
                starEffect.parameters['DataSize'].SetValue(this.dataSetSize);
            }
        }
        else
        {
            this.mapData = obj.meshes[0].bufferData;
        }
    }
    // Assigns new data set
    // texturePath - res path to particle data texture
    // minStarSize, maxStarSize - star sizes for alpha 0 and 255 in data set texture
    this.SetDataSet = function (texturePath, minStarSize, maxStarSize)
    {
        this.dataCanvas = null;
        this.dataSet = ccpwgl_int.resMan.GetResource(texturePath);
        this.dataSet.RegisterNotification(this);
        if (this.dataSet.IsGood())
        {
            this.RebuildCachedData(this.dataSet);
        }
        this.particleSize[0] = minStarSize;
        this.particleSize[1] = maxStarSize;
        if (this.model)
        {
            var starEffect = this.model.mesh.additiveAreas[0].effect;
            starEffect.parameters['ParticleData'].SetTexturePath(texturePath);
            starEffect.parameters['ParticleSize'].SetValue(this.particleSize);
        }
    }
	this.SetStarColor = function (starID, colorAndSize, offset)
	{
		if (!this.dataSet.IsGood())
		{
			return;
		}
        if (!this.stars || !this.stars.aliveCount)
        {
            return null;
        }
		var index = this.stars.aliveCount * offset + starID;
		var x = index % this.dataSet.width;
		var y = Math.floor(index / this.dataSet.width);
		var d = ccpwgl_int.device;
		d.gl.bindTexture(d.gl.TEXTURE_2D, this.dataSet.texture);
		d.gl.texSubImage2D(d.gl.TEXTURE_2D, 0, x, y, 1, 1, d.gl.RGBA, d.gl.UNSIGNED_CHAR, colorAndSize)
		d.gl.bindTexture(d.gl.TEXTURE_2D, null);
	}
    // For animation/timeline
    // set offsets into the data texture for previous and next data sets
    // mix is the mix between them
    this.SetDataOffset = function (offset0, offset1, mix)
    {
        this.dataOffset[0] = offset0;
        this.dataOffset[1] = offset1;
        this.dataOffset[2] = mix;
        if (this.model)
        {
            var starEffect = this.model.mesh.additiveAreas[0].effect;
            starEffect.parameters['DataOffset'].SetValue(this.dataOffset);
        }
    }
    // constant color for jump routes
    this.SetJumpRoutesColor = function (color)
    {
        this.jumpRoutesColor = color;
        if (this.model)
        {
            var lineEffect = this.model.children[0].mesh.transparentAreas[0].effect;
            lineEffect.parameters['LineColor'].SetValue(this.jumpRoutesColor);
        }
    }
    this.Update = function ()
    {
        if (this.corners.length == 0)
        {
            if (this.stars && self.stars.aliveCount)
            {
                var aabbMin = vec3.create();
                var aabbMax = vec3.create();
                this.stars.GetBoundingBox(aabbMin, aabbMax);
                this.corners.push(quat4.create([aabbMin[0], aabbMax[1], aabbMin[2], 1]));
                this.corners.push(quat4.create([aabbMin[0], aabbMin[1], aabbMax[2], 1]));
                this.corners.push(quat4.create([aabbMin[0], aabbMax[1], aabbMax[2], 1]));
                this.corners.push(quat4.create([aabbMax[0], aabbMin[1], aabbMin[2], 1]));
                this.corners.push(quat4.create([aabbMax[0], aabbMax[1], aabbMin[2], 1]));
                this.corners.push(quat4.create([aabbMax[0], aabbMin[1], aabbMax[2], 1]));
                this.corners.push(quat4.create([aabbMax[0], aabbMax[1], aabbMax[2], 1]));
            }
        }
        if (this.corners.length == 0)
        {
            return;
        }
        var tmp = quat4.create();
        var znear = 0;
        var zfar = 0;
        for (var i = 0; i < this.corners.length; ++i)
        {
            mat4.multiplyVec4(ccpwgl_int.device.view, this.corners[i], tmp);
            var l = -tmp[2];
            if (i == 0 || znear > l)
            {
                znear = l;
            }
            if (i == 0 || zfar < l)
            {
                zfar = l;
            }
        }
        znear = Math.max(znear, 0);
        this.distanceRange.SetValue([znear, 1.0 / (zfar - znear), 0, 0]);
    }
    this.Pick = function (x, y)
    {
        if (!this.stars || !self.stars.aliveCount)
        {
            return null;
        }
        var viewProjInv = mat4.inverse(mat4.multiply(ccpwgl_int.device.projection, ccpwgl_int.device.view, mat4.create()));
        var end = quat4.create([(x / ccpwgl_int.device.viewportWidth) * 2 - 1, -(y / ccpwgl_int.device.viewportHeight) * 2 + 1, 1, 1]);
        mat4.multiplyVec4(viewProjInv, end);
        vec3.scale(end, 1.0 / end[3]);
        var eye = ccpwgl_int.device.eyePosition;
        vec3.normalize(vec3.subtract(end, eye));
        var closest = -1;
        var closestDist = 0;
        var position = this.stars.GetElement(ccpwgl_int.Tw2ParticleElementDeclaration.POSITION);
        var tmp1 = vec3.create();
        var tmp2 = vec3.create();
        var pc = vec3.create();
        var fov = Math.atan(1.0 / ccpwgl_int.device.projection[5]);
		var closestPos;
        for (var i = 0; i < this.stars.aliveCount; ++i)
        {
            var pos = position.buffer.subarray(position.offset, position.offset + 3);
            vec3.subtract(pos, eye, pc);
            var t = vec3.dot(end, pc);
            if (t < 0)
            {
                position.offset += position.instanceStride;
                continue;
            }
            var p = vec3.scale(end, t, tmp1);
            var d = vec3.subtract(p, pc, tmp2);
            var l = Math.sqrt(vec3.dot(d, d));


            var distSq = vec3.dot(pc, pc);
            var fovHeight = Math.sin(fov) * distSq;
            var scale = 0.2274 * Math.pow(Math.abs(fovHeight), 0.185);
            if (l < 15 * scale)
            {
                if (closest < 0 || closestDist > t)
                {
                    closest = i;
                    closestDist = t;
					closestPos = pos;
                }
            }
            position.offset += position.instanceStride;
        }
        if (closest >= 0)
        {
			console.log(closest, closest * 5 + 4, this.mapData[closest * 5 + 4]);
			console.log(pos);
            return [closest, closestPos];
        }
        else
        {
            return null;
        }
    }
}