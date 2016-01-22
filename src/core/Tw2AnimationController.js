/**
 * Tw2Track
 * @property {Tw2GeometryTransformTrack} trackRes
 * @property {Tw2Bone} bone
 * @constructor
 */
function Tw2Track()
{
    this.trackRes = null;
    this.bone = null;
}


/**
 * Tw2TrackGroup
 * @property {Tw2GeometryTrackGroup} trackGroupRes
 * @property {Tw2GeometryModel} model
 * @property {Array.<Tw2GeometryTransformTrack>} transformTracks
 * @constructor
 */
function Tw2TrackGroup()
{
    this.trackGroupRes = null;
    this.model = null;
    this.transformTracks = [];
}


/**
 * Tw2Animation
 * @property {Tw2GeometryAnimation} animationRes
 * @property {number} time
 * @property {number} timeScale
 * @property {boolean} cycle
 * @property {boolean} isPlaying
 * @property {Function} callback - Stores optional callback passed to prototypes
 * @property {Array} trackGroups - Array of {@link Tw2TrackGroup}
 * @constructor
 */
function Tw2Animation()
{
    this.animationRes = null;
    this.time = 0;
    this.timeScale = 1.0;
    this.cycle = false;
    this.isPlaying = false;
    this.callback = null;
    this.trackGroups = [];
}

/**
 * Checks to see if the animation has finished playing
 * @return {boolean}
 * @prototype
 */
Tw2Animation.prototype.IsFinished = function()
{
    return !this.cycle && this.time >= this.duration;
};


/**
 * Tw2Bone
 * TODO: Identify when/ where the property bindingArrays is defined
 * @property {Tw2GeometryBone} boneRes
 * @property {mat4} localTransform
 * @property {mat4} worldTransform
 * @property {mat4} offsetTransform
 * @constructor
 */
function Tw2Bone()
{
    this.boneRes = null;
    this.localTransform = mat4.create();
    this.worldTransform = mat4.create();
    this.offsetTransform = mat4.create();
}


/**
 * Tw2Model
 * @property {Tw2GeometryModel} modelRes
 * @property {Array.<Tw2Bone>} bones
 * @property {Object.<string, Tw2Bone>} bonesByName - An object containing every Tw2Bone name and it's object
 * @constructor
 */
function Tw2Model()
{
    this.modelRes = null;
    this.bones = [];
    this.bonesByName = {};
}


/**
 * Tw2AnimationController
 * @param {Tw2GeometryRes} geometryResource
 * @property {Array.<Tw2GeometryRes>} geometryResources
 * @property {Array.<Tw2Model>} models
 * @property {Array.<Tw2Animation>} animations
 * @property {Array} meshBindings
 * @property {boolean} loaded
 * @property {boolean} update
 * @property {mat4} _tempMat4
 * @property {mat3} _tempMat3
 * @property {quat4} _tempQuat4
 * @property {vec3} _tempVec3
 * @property _geometryResource
 * @prototype
 */
function Tw2AnimationController(geometryResource)
{
    this.geometryResources = [];
    this.models = [];
    this.animations = [];
    this.meshBindings = [];
    this.loaded = false;
    this.update = true;
    this._tempMat4 = mat4.create();
    this._tempMat3 = mat3.create();
    this._tempQuat4 = quat4.create();
    this._tempVec3 = vec3.create();
    this._geometryResource = null;

    if (typeof(geometryResource) != 'undefined')
    {
        this.SetGeometryResource(geometryResource);
    }
}

/**
 * Clears any existing resources and loads the supplied geometry resource
 * @param {Tw2GeometryRes} geometryResource
 * @prototype
 */
Tw2AnimationController.prototype.SetGeometryResource = function(geometryResource)
{
    this.models = [];
    this.animations = [];
    this.meshBindings = [];

    for (var i = 0; i < this.geometryResources.length; ++i)
    {
        this.geometryResources[i].UnregisterNotification(this);
    }

    this.loaded = false;
    this.geometryResources = [];

    if (geometryResource)
    {
        this.geometryResources.push(geometryResource);
        geometryResource.RegisterNotification(this);
    }
};

/**
 * Adds a Geometry Resource
 * @param {Tw2GeometryRes} geometryResource
 * @prototype
 */
Tw2AnimationController.prototype.AddGeometryResource = function(geometryResource)
{
    for (var i = 0; i < this.geometryResources.length; ++i)
    {
        if (this.geometryResources[i] == geometryResource)
        {
            return;
        }
    }
    this.geometryResources.push(geometryResource);
    geometryResource.RegisterNotification(this);
};

/**
 * Adds animations from a resource
 * @param {Tw2GeometryRes} resource
 * @prototype
 */
Tw2AnimationController.prototype.AddAnimationsFromRes = function(resource)
{
    for (var i = 0; i < resource.animations.length; ++i)
    {
        var animation = null;
        for (var j = 0; j < this.animations.length; ++j)
        {
            if (this.animations[j].animationRes == resource.animations[i])
            {
                animation = this.animations[i];

                break;
            }
        }
        if (!animation)
        {
            animation = new Tw2Animation();
            animation.animationRes = resource.animations[i];
            this.animations.push(animation);
        }
        for (var j = 0; j < animation.animationRes.trackGroups.length; ++j)
        {
            var found = false;
            for (var k = 0; k < animation.trackGroups.length; ++k)
            {
                if (animation.trackGroups[k].trackGroupRes == animation.animationRes.trackGroups[j])
                {
                    found = true;
                    break;
                }
            }
            if (found)
            {
                continue;
            }
            var model = null;
            for (var k = 0; k < this.models.length; ++k)
            {
                if (this.models[k].modelRes.name == animation.animationRes.trackGroups[j].name)
                {
                    model = this.models[k];
                    break;
                }
            }
            if (model != null)
            {
                var group = new Tw2TrackGroup();
                group.trackGroupRes = animation.animationRes.trackGroups[j];
                for (var k = 0; k < group.trackGroupRes.transformTracks.length; ++k)
                {
                    for (var m = 0; m < model.bones.length; ++m)
                    {
                        if (model.bones[m].boneRes.name == group.trackGroupRes.transformTracks[k].name)
                        {
                            var track = new Tw2Track();
                            track.trackRes = group.trackGroupRes.transformTracks[k];
                            track.bone = model.bones[m];
                            group.transformTracks.push(track);
                            break;
                        }
                    }
                }
                animation.trackGroups.push(group);
            }
        }
    }
};

/**
 * Adds a model resource
 * @param {Tw2GeometryModel} modelRes
 * @returns {null|Tw2Model} Returns a newly created Tw2Model if the model resource doesn't already exist, and null if it does
 * @private
 */
Tw2AnimationController.prototype._AddModel = function(modelRes)
{
    for (var i = 0; i < this.models.length; ++i)
    {
        if (this.models[i].modelRes.name == modelRes.name)
        {
            return null;
        }
    }
    var model = new Tw2Model();
    model.modelRes = modelRes;
    var skeleton = modelRes.skeleton;
    if (skeleton != null)
    {
        for (var j = 0; j < skeleton.bones.length; ++j)
        {
            var bone = new Tw2Bone();
            bone.boneRes = skeleton.bones[j];
            model.bones.push(bone);
            model.bonesByName[bone.boneRes.name] = bone;
        }
    }
    this.models.push(model);
    return model;
};

/**
 * Finds a mesh binding for a supplied resource
 * @param {Tw2GeometryRes} resource
 * @returns {Object|null} Returns the mesh binding of a resource if it exists, null if it doesn't
 * @private
 */
Tw2AnimationController.prototype._FindMeshBindings = function(resource)
{
    for (var i = 0; i < this.meshBindings.length; ++i)
    {
        if (this.meshBindings[i].resource == resource)
        {
            return this.meshBindings[i];
        }
    }
    return null;
};

/**
 * Rebuilds the cached data for a resource (unless it doesn't exist or is already good)
 * @param {Tw2GeometryRes} resource
 * @prototype
 */
Tw2AnimationController.prototype.RebuildCachedData = function(resource)
{
    var found = false;
    for (var i = 0; i < this.geometryResources.length; ++i)
    {
        if (this.geometryResources[i] == resource)
        {
            found = true;
            break;
        }
    }
    if (!found)
    {
        return;
    }
    for (var i = 0; i < this.geometryResources.length; ++i)
    {
        if (!this.geometryResources[i].IsGood())
        {
            return;
        }
    }
    for (var i = 0; i < this.geometryResources.length; ++i)
    {
        this._DoRebuildCachedData(this.geometryResources[i]);
    }
};

/**
 * _DoRebuildCachedData
 * TODO: Fix commented out code (line 339)
 * TODO: Too many arguments supplied to this.AddAnimationsFromRes prototype (line 352)
 * @param {Tw2GeometryRes} resource
 * @private
 */
Tw2AnimationController.prototype._DoRebuildCachedData = function(resource)
{
    var newModels = [];
    //if (resource.meshes.length)
    {
        for (var i = 0; i < resource.models.length; ++i)
        {
            var model = this._AddModel(resource.models[i]);
            if (model)
            {
                newModels.push(model);
            }
        }
    }
    for (var i = 0; i < this.geometryResources.length; ++i)
    {
        this.AddAnimationsFromRes(this.geometryResources[i], this.models);
    }

    if (resource.models.length == 0)
    {
        for (var i = 0; i < resource.meshes.length; ++i)
        {
            Tw2GeometryRes.BindMeshToModel(resource.meshes[i], this.geometryResources[0].models[0]);
        }
        resource.models.push(this.geometryResources[0].models[0]);
    }
    for (var i = 0; i < resource.models.length; ++i)
    {
        var model = null;
        for (var j = 0; j < this.models.length; ++j)
        {
            if (this.models[j].modelRes.name == resource.models[i].name)
            {
                model = this.models[j];
                break;
            }
        }
        if (model == null)
        {
            continue;
        }
        for (var j = 0; j < resource.models[i].meshBindings.length; ++j)
        {
            var meshIx = resource.meshes.indexOf(resource.models[i].meshBindings[j].mesh);
            var meshBindings = this._FindMeshBindings(resource);
            if (meshBindings == null)
            {
                meshBindings = [];
                meshBindings.resource = resource;
                this.meshBindings.push(meshBindings);
            }
            meshBindings[meshIx] = new glMatrixArrayType(resource.models[i].meshBindings[j].bones.length * 12);
            for (var k = 0; k < resource.models[i].meshBindings[j].bones.length; ++k)
            {
                for (var n = 0; n < model.bones.length; ++n)
                {
                    if (model.bones[n].boneRes.name == resource.models[i].meshBindings[j].bones[k].name)
                    {
                        if (!model.bones[n].bindingArrays)
                        {
                            model.bones[n].bindingArrays = [];
                        }
                        var arrayInfo = {
                            'array': meshBindings[meshIx],
                            'offset': k * 12
                        };
                        model.bones[n].bindingArrays[model.bones[n].bindingArrays.length] = arrayInfo;
                        //meshBindings[meshIx][k] = model.bones[n].offsetTransform;
                        break;
                    }
                }
            }
        }
    }
    if (resource.meshes.length && resource.models.length)
    {
        this.ResetBoneTransforms(resource.models);
    }
    this.loaded = true;
    if (this.animations.length)
    {
        if (this.pendingCommands)
        {
            for (var i = 0; i < this.pendingCommands.length; ++i)
            {
                this.pendingCommands[i].func.apply(this, this.pendingCommands[i].args);
            }
        }
        this.pendingCommands = null;
    }
};

/**
 * Plays a specific animation
 * @param {string} name - Animation Name
 * @param {boolean} [cycle]
 * @param {Function} [callback] - Optional callback which is fired once the animation has completed
 * @prototype
 */
Tw2AnimationController.prototype.PlayAnimation = function(name, cycle, callback)
{
    if (this.animations.length == 0)
    {
        if (!this.pendingCommands)
        {
            this.pendingCommands = [];
        }
        this.pendingCommands.push(
        {
            'func': this.PlayAnimation,
            'args': [name, cycle, callback]
        });
        return;
    }
    for (var i = 0; i < this.animations.length; ++i)
    {
        if (this.animations[i].animationRes.name == name)
        {
            this.animations[i].time = 0;
            this.animations[i].isPlaying = true;
            if (typeof(cycle) != 'undefined')
            {
                this.animations[i].cycle = cycle;
            }
            if (typeof(callback) != 'undefined')
            {
                this.animations[i].callback = callback;
            }
        }
    }
};

/**
 * Stops a specific animation from playing
 * @param {string} name - Animation Name
 * @prototype
 */
Tw2AnimationController.prototype.StopAnimation = function(name)
{
    for (var i = 0; i < this.animations.length; ++i)
    {
        if (this.animations[i].animationRes.name == name)
        {
            this.animations[i].isPlaying = false;
        }
    }
};

/**
 * Stops all animations from playing
 * @prototype
 */
Tw2AnimationController.prototype.StopAllAnimations = function()
{
    for (var i = 0; i < this.animations.length; ++i)
    {
        this.animations[i].isPlaying = false;
    }
};

/**
 * Resets the bone transforms for the supplied models
 * @param {Array.<Tw2Model>} models
 * @prototype
 */
Tw2AnimationController.prototype.ResetBoneTransforms = function(models)
{
    for (var i = 0; i < this.models.length; ++i)
    {
        for (var j = 0; j < this.models[i].bones.length; ++j)
        {
            var bone = this.models[i].bones[j];
            var boneRes = bone.boneRes;
            mat4.set(boneRes.localTransform, bone.localTransform);
            if (boneRes.parentIndex != -1)
            {
                mat4.multiply(bone.localTransform, this.models[i].bones[bone.boneRes.parentIndex].worldTransform, bone.worldTransform);
            }
            else
            {
                mat4.set(bone.localTransform, bone.worldTransform);
            }
            mat4.identity(bone.offsetTransform);
        }
    }
    var id = mat4.identity(mat4.create());
    for (var i = 0; i < this.meshBindings.length; ++i)
    {
        for (var j = 0; j < this.meshBindings[i].length; ++j)
        {
            for (var k = 0; k * 16 < this.meshBindings[i][j].length; ++k)
            {
                for (var m = 0; m < 16; ++m)
                {
                    this.meshBindings[i][j][k * 16 + m] = id[m];
                }
            }
        }
    }
};

/**
 * EvaluateCurve
 * @param {Tw2GeometryCurve} curve
 * @param {number} time
 * @param value
 * @param {boolean} cycle
 * @param {number} duration
 */
Tw2AnimationController.EvaluateCurve = function(curve, time, value, cycle, duration)
{
    var count = curve.knots.length;
    var knot = count - 1;
    var t = 0;
    for (var i = 0; i < curve.knots.length; ++i)
    {
        if (curve.knots[i] > time)
        {
            knot = i;
            break;
        }
    }

    if (curve.degree == 0)
    {
        for (var i = 0; i < curve.dimension; ++i)
        {
            value[i] = curve.controls[knot * curve.dimension + i];
        }
    }
    else if (curve.degree == 1)
    {
        var knot0 = cycle ? (knot + count - 1) % count : knot == 0 ? 0 : knot - 1;
        var dt = curve.knots[knot] - curve.knots[knot0];
        if (dt < 0)
        {
            dt += duration;
        }
        if (dt > 0)
        {
            t = (time - curve.knots[i - 1]) / dt;
        }
        for (var i = 0; i < curve.dimension; ++i)
        {
            value[i] = curve.controls[knot0 * curve.dimension + i] * (1 - t) + curve.controls[knot * curve.dimension + i] * t;
        }
    }
    else
    {
        var k_2 = cycle ? (knot + count - 2) % count : knot == 0 ? 0 : knot - 2;
        var k_1 = cycle ? (knot + count - 1) % count : knot == 0 ? 0 : knot - 1;

        var p1 = (k_2) * curve.dimension;
        var p2 = (k_1) * curve.dimension;
        var p3 = knot * curve.dimension;

        var ti_2 = curve.knots[k_2];
        var ti_1 = curve.knots[k_1];
        var ti = curve.knots[knot];
        var ti1 = curve.knots[(knot + 1) % count];
        if (ti_2 > ti)
        {
            ti += duration;
            ti1 += duration;
            time += duration;
        }
        if (ti_1 > ti)
        {
            ti += duration;
            ti1 += duration;
            time += duration;
        }
        if (ti1 < ti)
        {
            ti1 += duration;
        }

        var tmti_1 = (time - ti_1);
        var tmti_2 = (time - ti_2);
        var dL0 = ti - ti_1;
        var dL1_1 = ti - ti_2;
        var dL1_2 = ti1 - ti_1;

        var L0 = tmti_1 / dL0;
        var L1_1 = tmti_2 / dL1_1;
        var L1_2 = tmti_1 / dL1_2;

        var ci_2 = (L1_1 + L0) - L0 * L1_1;
        var ci = L0 * L1_2;
        var ci_1 = ci_2 - ci;
        ci_2 = 1 - ci_2;

        for (var i = 0; i < curve.dimension; ++i)
        {
            value[i] = ci_2 * curve.controls[p1 + i] + ci_1 * curve.controls[p2 + i] + ci * curve.controls[p3 + i];
        }
    }
};

/**
 * Internal render/update function which is called every frame
 * TODO: Fix commented out code (line 718)
 * @param {number} dt - Delta Time
 * @prototype
 */
Tw2AnimationController.prototype.Update = function(dt)
{
    if (this.models == null || !this.update)
    {
        return;
    }

    for (var i = 0; i < this.geometryResources.length; ++i)
    {
        this.geometryResources[i].KeepAlive();
    }


    var tempMat = this._tempMat4;
    var updateBones = false;
    for (var i = 0; i < this.animations.length; ++i)
    {
        var animation = this.animations[i];
        if (animation.isPlaying)
        {
            var res = animation.animationRes;
            animation.time += dt * animation.timeScale;
            if (animation.time > res.duration)
            {
                if (animation.callback != null)
                {
                    animation.callback(this, animation);
                }
                if (animation.cycle)
                {
                    animation.time = animation.time % res.duration;
                }
                else
                {
                    animation.isPlaying = false;
                    animation.time = res.duration;
                }
            }
            var orientation = this._tempQuat4;
            var scale = this._tempMat3;
            var position = this._tempVec3;
            for (var j = 0; j < animation.trackGroups.length; ++j)
            {
                for (var k = 0; k < animation.trackGroups[j].transformTracks.length; ++k)
                {
                    var track = animation.trackGroups[j].transformTracks[k];
                    if (track.trackRes.position)
                    {
                        Tw2AnimationController.EvaluateCurve(track.trackRes.position, animation.time, position, animation.cycle, res.duration);
                    }
                    else
                    {
                        position[0] = position[1] = position[2] = 0;
                    }
                    if (track.trackRes.orientation)
                    {
                        Tw2AnimationController.EvaluateCurve(track.trackRes.orientation, animation.time, orientation, animation.cycle, res.duration);
                        quat4.normalize(orientation);
                    }
                    else
                    {
                        orientation[0] = orientation[1] = orientation[2] = 0;
                        orientation[3] = 1;
                    }
                    if (track.trackRes.scaleShear)
                    {
                        Tw2AnimationController.EvaluateCurve(track.trackRes.scaleShear, animation.time, scale, animation.cycle, res.duration);
                    }
                    else
                    {
                        mat3.identity(scale);
                    }

                    mat3.toMat4(scale, track.bone.localTransform);
                    mat4.multiply(track.bone.localTransform, mat4.transpose(quat4.toMat4(orientation, tempMat)));
                    track.bone.localTransform[12] = position[0];
                    track.bone.localTransform[13] = position[1];
                    track.bone.localTransform[14] = position[2];
                    updateBones = true;
                }
            }
        }
    }
    //if (updateBones)
    {
        for (var i = 0; i < this.models.length; ++i)
        {
            for (var j = 0; j < this.models[i].bones.length; ++j)
            {
                var bone = this.models[i].bones[j];
                if (bone.boneRes.parentIndex != -1)
                {
                    mat4.multiply(this.models[i].bones[bone.boneRes.parentIndex].worldTransform, bone.localTransform, bone.worldTransform);
                }
                else
                {
                    mat4.set(bone.localTransform, bone.worldTransform);
                }
                mat4.multiply(bone.worldTransform, bone.boneRes.worldTransformInv, bone.offsetTransform);
                if (bone.bindingArrays)
                {
                    for (var a = 0; a < bone.bindingArrays.length; ++a)
                    {
                        bone.bindingArrays[a].array[bone.bindingArrays[a].offset + 0] = bone.offsetTransform[0];
                        bone.bindingArrays[a].array[bone.bindingArrays[a].offset + 1] = bone.offsetTransform[4];
                        bone.bindingArrays[a].array[bone.bindingArrays[a].offset + 2] = bone.offsetTransform[8];
                        bone.bindingArrays[a].array[bone.bindingArrays[a].offset + 3] = bone.offsetTransform[12];

                        bone.bindingArrays[a].array[bone.bindingArrays[a].offset + 4] = bone.offsetTransform[1];
                        bone.bindingArrays[a].array[bone.bindingArrays[a].offset + 5] = bone.offsetTransform[5];
                        bone.bindingArrays[a].array[bone.bindingArrays[a].offset + 6] = bone.offsetTransform[9];
                        bone.bindingArrays[a].array[bone.bindingArrays[a].offset + 7] = bone.offsetTransform[13];

                        bone.bindingArrays[a].array[bone.bindingArrays[a].offset + 8] = bone.offsetTransform[2];
                        bone.bindingArrays[a].array[bone.bindingArrays[a].offset + 9] = bone.offsetTransform[6];
                        bone.bindingArrays[a].array[bone.bindingArrays[a].offset + 10] = bone.offsetTransform[10];
                        bone.bindingArrays[a].array[bone.bindingArrays[a].offset + 11] = bone.offsetTransform[14];
                    }
                }
            }
        }
    }
};

/**
 * RenderDebugInfo
 * TODO: Fix commented out code (lines 767 - 770)
 * @param {function} debugHelper
 * @prototype
 */
Tw2AnimationController.prototype.RenderDebugInfo = function(debugHelper)
{
    /*for (var i = 0; i < this.geometryResources.length; ++i)
     {
     this.geometryResources[i].RenderDebugInfo(debugHelper);
     }*/
    for (var i = 0; i < this.models.length; ++i)
    {
        for (var j = 0; j < this.models[i].bones.length; ++j)
        {
            var b0 = this.models[i].bones[j];
            if (b0.boneRes.parentIndex >= 0)
            {
                var b1 = this.models[i].bones[b0.boneRes.parentIndex];
                debugHelper.AddLine([b0.worldTransform[12], b0.worldTransform[13], b0.worldTransform[14]], [b1.worldTransform[12], b1.worldTransform[13], b1.worldTransform[14]]);
            }
        }
    }
};

/**
 * GetBoneMatrixes
 * TODO: Matrixes is spelt wrong (should be Matrices), multiple refactors required
 * @param {number} meshIndex
 * @param {Tw2GeometryRes} [geometryResource=this.geometryResources[0]]
 * @returns {Float32Array}
 * @prototype
 */
Tw2AnimationController.prototype.GetBoneMatrixes = function(meshIndex, geometryResource)
{
    if (this.geometryResources.length == 0)
    {
        return new Float32Array();
    }

    if (typeof(geometryResource) == 'undefined')
    {
        geometryResource = this.geometryResources[0];
    }
    var meshBindings = this._FindMeshBindings(geometryResource);
    if (meshBindings && meshIndex < meshBindings.length)
    {
        return meshBindings[meshIndex];
    }
    return new Float32Array();
};

/**
 * FindModelForMesh
 * @param {number} meshIndex
 * @param {Tw2GeometryRes} [geometryResource=this.geometryResources[0]]
 * @returns {Tw2Model|null} Returns the Tw2Model for the mesh if found and is good, else returns null
 * @prototype
 */
Tw2AnimationController.prototype.FindModelForMesh = function(meshIndex, geometryResource)
{
    if (this.geometryResources.length == 0)
    {
        return null;
    }
    if (typeof(geometryResource) == 'undefined')
    {
        geometryResource = this.geometryResources[0];
    }
    if (!geometryResource.IsGood())
    {
        return null;
    }
    var mesh = geometryResource.meshes[meshIndex];
    for (var i = 0; i < this.models.length; ++i)
    {
        for (var j = 0; j < this.models[i].modelRes.meshBindings.length; ++i)
        {
            if (this.models[i].modelRes.meshBindings[j].mesh == mesh)
            {
                return this.models[i];
            }
        }
    }
    return null;
};
