import {vec3, quat, mat3, mat4, curve} from '../../math';
import {Tw2GeometryRes} from '../resource';
import {Tw2Animation} from './Tw2Animation';
import {Tw2Bone} from './Tw2Bone';
import {Tw2Model} from './Tw2Model';
import {Tw2Track} from './Tw2Track';
import {Tw2TrackGroup} from './Tw2TrackGroup';

/**
 * Tw2AnimationController
 *
 * @param {Tw2GeometryRes} [geometryResource]
 * @property {Array.<Tw2GeometryRes>} geometryResources
 * @property {Array.<Tw2Model>} models
 * @property {Array.<Tw2Animation>} animations
 * @property {Array} meshBindings
 * @property {boolean} loaded
 * @property {boolean} update
 * @property _geometryResource
 * @property {Array} pendingCommands
 * @property {Function} [onLoaded] an optional callback fired when any commands are cleared
 * @class
 */
export class Tw2AnimationController
{
    constructor(geometryResource)
    {
        this.geometryResources = [];
        this.models = [];
        this.animations = [];
        this.meshBindings = [];
        this.loaded = false;
        this.update = true;
        this.pendingCommands = [];
        this.onPendingCleared = null;
        this._geometryResource = null;

        if (geometryResource)
        {
            this.SetGeometryResource(geometryResource);
        }
    }

    /**
     * Gets a loaded Tw2Animation by it's name
     * @returns {?{ string: Tw2Animation}} an object containing animation names and animations, or null if not loaded
     */
    GetAnimationsByName()
    {
        if (!this.loaded) return null;

        const animations = {};
        for (let i = 0; i < this.animations.length; i++)
        {
            animations[this.animations[i].animationRes.name] = this.animations[i];
        }
        return animations;
    }

    /**
     * Gets a loaded Tw2Animation by it's name
     * @param {String} name
     * @returns {?Tw2Animation} Returns the animation if found
     */
    GetAnimation(name)
    {
        for (let i = 0; i < this.animations.length; i++)
        {
            if (this.animations[i].animationRes.name === name)
            {
                return this.animations[i];
            }
        }
        return null;
    }

    /**
     * Resets a Tw2Animation by it's name
     * @param {String} name
     * @return {boolean}
     */
    ResetAnimation(name)
    {
        const animation = this.GetAnimation(name);
        if (animation)
        {
            animation.time = 0;
            animation.isPlaying = false;
            animation.callback = null;
            return true;
        }
    }

    /**
     * Plays a specific animation by it's name
     * @param {string} name - Animation's Name
     * @param {boolean} [cycle]
     * @param {Function} [callback] - Optional callback which is fired once the animation has completed
     * @return {boolean}
     */
    PlayAnimation(name, cycle, callback)
    {
        if (this.animations.length === 0)
        {
            this.pendingCommands.push({
                'func': this.PlayAnimation,
                'args': [name, cycle, callback]
            });
            return true;
        }

        const animation = this.GetAnimation(name);
        if (animation)
        {
            animation.time = 0;
            animation.isPlaying = true;

            if (typeof(cycle) !== 'undefined')
            {
                animation.cycle = cycle;
            }

            if (callback)
            {
                animation.callback = callback;
            }

            return true;
        }
    }

    /**
     * Plays a specific animation from a specific time
     * @param {string} name - Animation's Name
     * @param {number} from - Time to play from
     * @param {boolean} [cycle]
     * @param {Function} [callback] - Optional callback which is fired once the animation has completed
     * @returns {boolean}
     */
    PlayAnimationFrom(name, from, cycle, callback)
    {
        if (this.animations.length === 0)
        {
            this.pendingCommands.push({
                'func': this.PlayAnimationFrom,
                'args': [name, from, cycle, callback]
            });
            return true;
        }

        const animation = this.GetAnimation(name);
        if (animation)
        {
            animation.time = Math.max(Math.min(from, animation.animationRes.duration), 0);
            animation.isPlaying = true;

            if (typeof(cycle) !== 'undefined')
            {
                animation.cycle = cycle;
            }

            if (callback)
            {
                animation.callback = callback;
            }

            return true;
        }
    }

    /**
     * Gets an array of all the currently playing animations by name
     * @returns {Array}
     */
    GetPlayingAnimations()
    {
        const result = [];
        for (let i = 0; i < this.animations.length; i++)
        {
            if (this.animations[i].isPlaying)
            {
                result.push(this.animations[i].animationRes.name);
            }
        }
        return result;
    }

    /**
     * Stops an animation or an array of animations from playing
     * @param {String| Array.<string>} names - Animation Name, or Array of Animation Names
     */
    StopAnimation(names)
    {
        if (this.animations.length === 0)
        {
            this.pendingCommands.push({
                'func': this.StopAnimation,
                'args': names
            });
            return;
        }

        if (typeof names === 'string' || names instanceof String)
        {
            names = [names];
        }

        const toStop = {};
        for (let n = 0; n < names.length; n++)
        {
            toStop[names[n]] = true;
        }

        for (let i = 0; i < this.animations.length; ++i)
        {
            if (this.animations[i].animationRes.name in toStop)
            {
                this.animations[i].isPlaying = false;
            }
        }
    }

    /**
     * Stops all animations from playing
     */
    StopAllAnimations()
    {
        if (this.animations.length === 0)
        {
            this.pendingCommands.push({
                'func': this.StopAllAnimations,
                'args': null
            });
            return;
        }

        for (let i = 0; i < this.animations.length; ++i)
        {
            this.animations[i].isPlaying = false;
        }
    }

    /**
     * Stops all but the supplied list of animations
     * @param {String| Array.<string>} names - Animation Names
     */
    StopAllAnimationsExcept(names)
    {
        if (this.animations.length === 0)
        {
            this.pendingCommands.push({
                'func': this.StopAllAnimationsExcept,
                'args': names
            });
            return;
        }

        if (typeof names === 'string' || names instanceof String)
        {
            names = [names];
        }

        const keepAnimating = {};
        for (let n = 0; n < names.length; n++)
        {
            keepAnimating[names[n]] = true;
        }

        for (let i = 0; i < this.animations.length; ++i)
        {
            if (!(this.animations[i].animationRes.name in keepAnimating))
            {
                this.animations[i].isPlaying = false;
            }
        }
    }

    /**
     * Clears any existing resources and loads the supplied geometry resource
     * @param {Tw2GeometryRes} geometryResource
     */
    SetGeometryResource(geometryResource)
    {
        this.models = [];
        this.animations = [];
        this.meshBindings = [];

        for (let i = 0; i < this.geometryResources.length; ++i)
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
    }

    /**
     * Adds a Geometry Resource
     * @param {Tw2GeometryRes} geometryResource
     */
    AddGeometryResource(geometryResource)
    {
        for (let i = 0; i < this.geometryResources.length; ++i)
        {
            if (this.geometryResources[i] === geometryResource)
            {
                return;
            }
        }
        this.geometryResources.push(geometryResource);
        geometryResource.RegisterNotification(this);
    }

    /**
     * Adds animations from a resource
     * @param {Tw2GeometryRes} resource
     */
    AddAnimationsFromRes(resource)
    {
        for (let i = 0; i < resource.animations.length; ++i)
        {
            let animation = null;
            for (let j = 0; j < this.animations.length; ++j)
            {
                if (this.animations[j].animationRes === resource.animations[i])
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

            for (let j = 0; j < animation.animationRes.trackGroups.length; ++j)
            {
                let found = false;
                for (let k = 0; k < animation.trackGroups.length; ++k)
                {
                    if (animation.trackGroups[k].trackGroupRes === animation.animationRes.trackGroups[j])
                    {
                        found = true;
                        break;
                    }
                }

                if (found)
                {
                    continue;
                }

                let model = null;
                for (let k = 0; k < this.models.length; ++k)
                {
                    if (this.models[k].modelRes.name === animation.animationRes.trackGroups[j].name)
                    {
                        model = this.models[k];
                        break;
                    }
                }

                if (model !== null)
                {
                    const group = new Tw2TrackGroup();
                    group.trackGroupRes = animation.animationRes.trackGroups[j];
                    for (let k = 0; k < group.trackGroupRes.transformTracks.length; ++k)
                    {
                        for (let m = 0; m < model.bones.length; ++m)
                        {
                            if (model.bones[m].boneRes.name === group.trackGroupRes.transformTracks[k].name)
                            {
                                const track = new Tw2Track();
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
    }
    
    /**
     * Resets the bone transforms
     */
    ResetBoneTransforms()
    {
        for (let i = 0; i < this.models.length; ++i)
        {
            for (let j = 0; j < this.models[i].bones.length; ++j)
            {
                const
                    bone = this.models[i].bones[j],
                    boneRes = bone.boneRes;

                mat4.copy(bone.localTransform, boneRes.localTransform);

                if (boneRes.parentIndex !== -1)
                {
                    mat4.multiply(bone.worldTransform, bone.localTransform, this.models[i].bones[bone.boneRes.parentIndex].worldTransform);
                }
                else
                {
                    mat4.set(bone.worldTransform, bone.localTransform);
                }
                mat4.identity(bone.offsetTransform);
            }
        }

        const id = mat4.identity(Tw2AnimationController.scratch.mat4_0);
        for (let i = 0; i < this.meshBindings.length; ++i)
        {
            for (let j = 0; j < this.meshBindings[i].length; ++j)
            {
                for (let k = 0; k * 16 < this.meshBindings[i][j].length; ++k)
                {
                    for (let m = 0; m < 16; ++m)
                    {
                        this.meshBindings[i][j][k * 16 + m] = id[m];
                    }
                }
            }
        }
    }

    /**
     * GetBoneMatrices
     * @param {number} meshIndex
     * @param {Tw2GeometryRes} [geometryResource=this.geometryResources[0]]
     * @returns {Float32Array}
     */
    GetBoneMatrices(meshIndex, geometryResource)
    {
        if (this.geometryResources.length === 0)
        {
            return new Float32Array();
        }

        if (!geometryResource)
        {
            geometryResource = this.geometryResources[0];
        }

        const meshBindings = Tw2AnimationController.FindMeshBindings(this, geometryResource);
        if (meshBindings && meshIndex < meshBindings.length)
        {
            return meshBindings[meshIndex];
        }
        return new Float32Array();
    }

    /**
     * FindModelForMesh
     * @param {number} meshIndex
     * @param {Tw2GeometryRes} [geometryResource=this.geometryResources[0]]
     * @returns {Tw2Model|null} Returns the Tw2Model for the mesh if found and is good, else returns null
     */
    FindModelForMesh(meshIndex, geometryResource)
    {
        if (this.geometryResources.length === 0)
        {
            return null;
        }

        if (!geometryResource)
        {
            geometryResource = this.geometryResources[0];
        }

        if (!geometryResource.IsGood())
        {
            return null;
        }

        const mesh = geometryResource.meshes[meshIndex];
        for (let i = 0; i < this.models.length; ++i)
        {
            for (let j = 0; j < this.models[i].modelRes.meshBindings.length; ++i)
            {
                if (this.models[i].modelRes.meshBindings[j].mesh === mesh)
                {
                    return this.models[i];
                }
            }
        }
        return null;
    }

    /**
     * Gets all animation controller res objects
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */

    GetResources(out = [])
    {
        for (let i = 0; i < this.geometryResources.length; i++)
        {
            if (!out.includes(this.geometryResources[i]))
            {
                out.push(this.geometryResources[i]);
            }
        }
        return out;
    }

    /**
     * Rebuilds the cached data for a resource (unless it doesn't exist or is already good)
     * @param {Tw2GeometryRes} resource
     */
    RebuildCachedData(resource)
    {
        let found = false;
        for (let i = 0; i < this.geometryResources.length; ++i)
        {
            if (this.geometryResources[i] === resource)
            {
                found = true;
                break;
            }
        }

        if (!found)
        {
            return;
        }

        for (let i = 0; i < this.geometryResources.length; ++i)
        {
            if (!this.geometryResources[i].IsGood())
            {
                return;
            }
        }

        for (let i = 0; i < this.geometryResources.length; ++i)
        {
            Tw2AnimationController.DoRebuildCachedData(this, this.geometryResources[i]);
        }
    }
    
    /**
     * Internal render/update function which is called every frame
     * @param {number} dt - Delta Time
     */
    Update(dt)
    {
        if (!this.models || !this.update)
        {
            return;
        }

        for (let i = 0; i < this.geometryResources.length; ++i)
        {
            this.geometryResources[i].KeepAlive();
        }

        const
            g = Tw2AnimationController.scratch,
            rotationMat = g.mat4_0,
            orientation = g.quat_0,
            position = g.vec3_0,
            scale = g.mat3_0;

        //var updateBones = false;
        for (let i = 0; i < this.animations.length; ++i)
        {
            const animation = this.animations[i];
            if (animation.isPlaying)
            {
                const res = animation.animationRes;
                animation.time += dt * animation.timeScale;
                if (animation.time > res.duration)
                {
                    if (animation.callback)
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

                for (let j = 0; j < animation.trackGroups.length; ++j)
                {
                    for (let k = 0; k < animation.trackGroups[j].transformTracks.length; ++k)
                    {
                        const track = animation.trackGroups[j].transformTracks[k];
                        if (track.trackRes.position)
                        {
                            curve.evaluate(track.trackRes.position, animation.time, position, animation.cycle, res.duration);
                        }
                        else
                        {
                            position[0] = position[1] = position[2] = 0;
                        }
                        if (track.trackRes.orientation)
                        {
                            curve.evaluate(track.trackRes.orientation, animation.time, orientation, animation.cycle, res.duration);
                            quat.normalize(orientation, orientation);
                        }
                        else
                        {
                            quat.identity(orientation);
                        }
                        if (track.trackRes.scaleShear)
                        {
                            curve.evaluate(track.trackRes.scaleShear, animation.time, scale, animation.cycle, res.duration);
                        }
                        else
                        {
                            mat3.identity(scale);
                        }

                        mat4.fromMat3(track.bone.localTransform, scale);
                        mat4.multiply(track.bone.localTransform, track.bone.localTransform, mat4.fromQuat(rotationMat, orientation));
                        track.bone.localTransform[12] = position[0];
                        track.bone.localTransform[13] = position[1];
                        track.bone.localTransform[14] = position[2];
                    }
                }
            }
        }

        for (let i = 0; i < this.models.length; ++i)
        {
            for (let j = 0; j < this.models[i].bones.length; ++j)
            {
                const bone = this.models[i].bones[j];
                if (bone.boneRes.parentIndex !== -1)
                {
                    mat4.multiply(bone.worldTransform, this.models[i].bones[bone.boneRes.parentIndex].worldTransform, bone.localTransform);
                }
                else
                {
                    mat4.copy(bone.worldTransform, bone.localTransform);
                }
                mat4.multiply(bone.offsetTransform, bone.worldTransform, bone.boneRes.worldTransformInv);
                if (bone.bindingArrays)
                {
                    for (let a = 0; a < bone.bindingArrays.length; ++a)
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

    /**
     * RenderDebugInfo
     * TODO: Fix commented out code
     * @param {function} debugHelper
     */
    RenderDebugInfo(debugHelper)
    {
        /*for (var i = 0; i < this.geometryResources.length; ++i)
         {
         this.geometryResources[i].RenderDebugInfo(debugHelper);
         }*/
        for (let i = 0; i < this.models.length; ++i)
        {
            for (let j = 0; j < this.models[i].bones.length; ++j)
            {
                const b0 = this.models[i].bones[j];
                if (b0.boneRes.parentIndex >= 0)
                {
                    const b1 = this.models[i].bones[b0.boneRes.parentIndex];
                    debugHelper['AddLine'](
                        [b0.worldTransform[12], b0.worldTransform[13], b0.worldTransform[14]],
                        [b1.worldTransform[12], b1.worldTransform[13], b1.worldTransform[14]]);
                }
            }
        }
    }

    /**
     * Adds a model resource to an animation controller
     * @param {Tw2AnimationController} animationController
     * @param {Tw2GeometryModel} modelRes
     * @returns {null|Tw2Model} Returns a newly created Tw2Model if the model resource doesn't already exist, and null if it does
     */
    static AddModel(animationController, modelRes)
    {
        for (let i = 0; i < animationController.models.length; ++i)
        {
            if (animationController.models[i].modelRes.name === modelRes.name)
            {
                return null;
            }
        }

        const model = new Tw2Model();
        model.modelRes = modelRes;
        const skeleton = modelRes.skeleton;
        if (skeleton !== null)
        {
            for (let j = 0; j < skeleton.bones.length; ++j)
            {
                const bone = new Tw2Bone();
                bone.boneRes = skeleton.bones[j];
                model.bones.push(bone);
                model.bonesByName[bone.boneRes.name] = bone;
            }
        }
        animationController.models.push(model);
        return model;
    }

    /**
     * Finds a mesh binding for a supplied resource from an animation controller
     * @param {Tw2AnimationController} animationController
     * @param {Tw2GeometryRes} resource
     * @returns {Object|null} Returns the mesh binding of a resource if it exists, null if it doesn't
     * @private
     */
    static FindMeshBindings(animationController, resource)
    {
        for (let i = 0; i < animationController.meshBindings.length; ++i)
        {
            if (animationController.meshBindings[i].resource === resource)
            {
                return animationController.meshBindings[i];
            }
        }
        return null;
    }

    /**
     * DoRebuildCachedData
     * @param {Tw2AnimationController) animationController
     * @param {Tw2GeometryRes} resource
     */
    static DoRebuildCachedData(animationController, resource)
    {
        const newModels = [];
        if (resource.meshes.length)
        {
            for (let i = 0; i < resource.models.length; ++i)
            {
                const model = Tw2AnimationController.AddModel(animationController, resource.models[i]);
                if (model)
                {
                    newModels.push(model);
                }
            }
        }

        for (let i = 0; i < animationController.geometryResources.length; ++i)
        {
            animationController.AddAnimationsFromRes(animationController.geometryResources[i]);
        }

        if (resource.models.length === 0)
        {
            for (let i = 0; i < resource.meshes.length; ++i)
            {
                Tw2GeometryRes.BindMeshToModel(resource.meshes[i], animationController.geometryResources[0].models[0]);
            }
            resource.models.push(animationController.geometryResources[0].models[0]);
        }

        for (let i = 0; i < resource.models.length; ++i)
        {
            let model = null;
            for (let j = 0; j < animationController.models.length; ++j)
            {
                if (animationController.models[j].modelRes.name === resource.models[i].name)
                {
                    model = animationController.models[j];
                    break;
                }
            }

            if (model === null)
            {
                continue;
            }

            for (let j = 0; j < resource.models[i].meshBindings.length; ++j)
            {
                const meshIx = resource.meshes.indexOf(resource.models[i].meshBindings[j].mesh);
                let meshBindings = Tw2AnimationController.FindMeshBindings(animationController, resource);

                if (meshBindings === null)
                {
                    meshBindings = [];
                    meshBindings.resource = resource;
                    animationController.meshBindings.push(meshBindings);
                }

                meshBindings[meshIx] = new Float32Array(resource.models[i].meshBindings[j].bones.length * 12);
                for (let k = 0; k < resource.models[i].meshBindings[j].bones.length; ++k)
                {
                    for (let n = 0; n < model.bones.length; ++n)
                    {
                        if (model.bones[n].boneRes.name === resource.models[i].meshBindings[j].bones[k].name)
                        {
                            if (!model.bones[n].bindingArrays)
                            {
                                model.bones[n].bindingArrays = [];
                            }

                            model.bones[n].bindingArrays[model.bones[n].bindingArrays.length] = {
                                'array': meshBindings[meshIx],
                                'offset': k * 12
                            };
                            //meshBindings[meshIx][k] = model.bones[n].offsetTransform;
                            break;
                        }
                    }
                }
            }
        }

        if (resource.meshes.length && resource.models.length)
        {
            animationController.ResetBoneTransforms();
        }

        animationController.loaded = true;
        if (animationController.animations.length)
        {
            if (animationController.pendingCommands.length)
            {
                for (let i = 0; i < animationController.pendingCommands.length; ++i)
                {
                    if (!animationController.pendingCommands[i].args)
                    {
                        animationController.pendingCommands[i].func.apply(animationController);
                    }
                    else
                    {
                        animationController.pendingCommands[i].func.apply(animationController, animationController.pendingCommands[i].args);
                    }
                }
            }
            animationController.pendingCommands = [];
            if (animationController.onPendingCleared) animationController.onPendingCleared(animationController);
        }
    }
}

/**
 * Scratch variables
 */
Tw2AnimationController.scratch = {
    vec3_0: vec3.create(),
    quat_0: quat.create(),
    mat3_0: mat3.create(),
    mat4_0: mat4.create()
};