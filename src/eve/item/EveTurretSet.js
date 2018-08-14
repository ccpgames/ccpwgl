import {vec3, vec4, quat, mat4, util, resMan, device} from '../../global';
import {
    Tw2PerObjectData,
    Tw2VertexElement,
    Tw2VertexDeclaration,
    Tw2AnimationController,
    Tw2ForwardingRenderBatch
} from '../../core';
import {EveObjectSet, EveObjectSetItem} from './EveObjectSet';
import {Tw2RawData} from '../../core';


/**
 * EveTurretSetItem
 *
 * @property {?Tw2Bone} bone                - The bone the turret is on
 * @property {boolean} isJoint              - Identifies if the turret is on a joint
 * @property {?string} locatorName          - The item's locator name
 * @property {boolean} updateFromLocator    - Allows the turret to be updated from a locator's transforms
 * @property {boolean} canFireWhenHidden    - Enables firing effects when hidden
 * @property {vec3} position                - The turret's position
 * @property {quat} rotation                - The turret's rotation
 * @property {mat4} _localTransform         - The turret's local transform
 * @property {quat} _localRotation          - the turret's local rotation
 */
export class EveTurretSetItem extends EveObjectSetItem
{
    constructor()
    {
        super();
        this.bone = null;
        this.locatorName = null;
        this.updateFromLocator = false;
        this.canFireWhenHidden = false;
        this.position = vec3.create();
        this.rotation = quat.create();
        this._localTransform = mat4.create();
        this._localRotation = quat.create();
    }

    /**
     * Updates the turret's transforms
     */
    UpdateTransforms()
    {
        mat4.fromRotationTranslation(this._localTransform, this.rotation, this.position);

        if (this.bone)
        {
            mat4.multiply(this._localTransform, this.bone.offsetTransform, this._localTransform);
            mat4.getRotation(this._localRotation, this._localTransform);
        }
        else
        {
            quat.copy(this._localRotation, this.rotation);
        }
    }

    /**
     * Creates a turret item from an object
     * @param {*} [opt={}]
     * @returns {EveTurretSetItem}
     */
    static create(opt = {})
    {
        const item = new this();
        util.assignIfExists(item, opt, [
            'name', 'display', 'locatorName', 'updateFromLocator', 'position', 'rotation', 'bone', 'canFireWhenHidden'
        ]);
        item.UpdateTransforms();
        return item;
    }
}


/**
 * EveTurretSet
 *
 * @property {Array.<EveTurretSetItem>} turrets
 * @property {Tw2AnimationController} activeAnimation
 * @property {Tw2AnimationController} inactiveAnimation
 * @property {string} geometryResPath
 * @property {Tw2GeometryRes} geometryResource
 * @property {number} bottomClipHeight
 * @property {string} locatorName
 * @property {Tw2Effect} turretEffect
 * @property {vec3} targetPosition
 * @property {number} sysBoneHeight
 * @property {string} firingEffectResPath
 * @property {EveTurretFiringFX} firingEffect
 * @property {number} state
 * @property {boolean} hasCyclingFiringPos
 * @property {mat4} parentMatrix
 * @property {quat} boundingSphere
 * @property {number} _activeTurret
 * @property {number} _recheckTimeLeft
 * @property {number} _currentCyclingFiresPos
 * @property {Tw2PerObjectData} _perObjectDataActive
 * @property {Tw2PerObjectData} _perObjectDataInactive
 * @property {boolean} _locatorRebuildPending
 * @class
 */
export class EveTurretSet extends EveObjectSet
{
    constructor()
    {
        super();
        this.visible = {};
        this.visible.turrets = true;
        this.visible.firingEffects = true;
        this.activeAnimation = new Tw2AnimationController();
        this.inactiveAnimation = new Tw2AnimationController();
        this.geometryResPath = '';
        this.geometryResource = null;
        this.turretEffect = null;
        this.firingEffectResPath = '';
        this.firingEffect = null;
        this.fireCallback = null;
        this.fireCallbackPending = false;
        this.state = EveTurretSet.State.IDLE;
        this.bottomClipHeight = 0;
        this.locatorName = '';
        this.sysBoneHeight = 0;
        this.hasCyclingFiringPos = false;
        this.targetPosition = vec3.create();
        this.parentMatrix = mat4.create();
        this.boundingSphere = quat.create();
        this._activeTurret = -1;
        this._recheckTimeLeft = 0;
        this._currentCyclingFiresPos = 0;

        this._perObjectDataActive = new Tw2PerObjectData();
        this._perObjectDataActive.perObjectVSData = new Tw2RawData();
        this._perObjectDataActive.perObjectVSData.Declare('baseCutoffData', 4);
        this._perObjectDataActive.perObjectVSData.Declare('turretSetData', 4);
        this._perObjectDataActive.perObjectVSData.Declare('shipMatrix', 16);
        this._perObjectDataActive.perObjectVSData.Declare('turretTranslation', 4 * 24);
        this._perObjectDataActive.perObjectVSData.Declare('turretRotation', 4 * 24);
        this._perObjectDataActive.perObjectVSData.Declare('turretPoseTransAndRot', 2 * 4 * 72);
        this._perObjectDataActive.perObjectVSData.Create();

        this._perObjectDataInactive = new Tw2PerObjectData();
        this._perObjectDataInactive.perObjectVSData = new Tw2RawData();
        this._perObjectDataInactive.perObjectVSData.Declare('baseCutoffData', 4);
        this._perObjectDataInactive.perObjectVSData.Declare('turretSetData', 4);
        this._perObjectDataInactive.perObjectVSData.Declare('shipMatrix', 16);
        this._perObjectDataInactive.perObjectVSData.Declare('turretTranslation', 4 * 24);
        this._perObjectDataInactive.perObjectVSData.Declare('turretRotation', 4 * 24);
        this._perObjectDataInactive.perObjectVSData.Declare('turretPoseTransAndRot', 2 * 4 * 72);
        this._perObjectDataInactive.perObjectVSData.Create();

        this._locatorRebuildPending = true;
    }

    /**
     * Alias for this.items
     * @returns {Array}
     */
    get turrets()
    {
        return this.items;
    }

    /**
     * Alias for this.items
     * @param {Array} arr
     */
    set turrets(arr)
    {
        this.items = arr;
    }

    /**
     * Initializes the Turret Set
     */
    Initialize()
    {
        if (this.turretEffect && this.geometryResPath !== '')
        {
            this.geometryResource = resMan.GetResource(this.geometryResPath);
            this.activeAnimation.SetGeometryResource(this.geometryResource);
            this.inactiveAnimation.SetGeometryResource(this.geometryResource);
            if (this.geometryResource) this.geometryResource.RegisterNotification(this);
        }

        if (this.firingEffectResPath !== '')
        {
            resMan.GetObject(this.firingEffectResPath, object => this.firingEffect = object);
        }

        this.Rebuild();
    }

    /**
     * Initializes turret set's firing effect
     */
    InitializeFiringEffect()
    {
        if (!this.firingEffect) return;

        if (this.geometryResource && this.geometryResource.models.length)
        {
            const model = this.geometryResource.models[0];
            for (let i = 0; i < this.firingEffect.GetPerMuzzleEffectCount(); ++i)
            {
                this.firingEffect.SetMuzzleBoneID(i, model.FindBoneByName(EveTurretSet.positionBoneSkeletonNames[i]));
            }
        }
    }

    /**
     * Helper function for finding out what turret should be firing
     * @returns {number}
     */
    GetClosestTurret()
    {
        let closestTurret = -1,
            closestAngle = -2;

        const
            g = EveTurretSet.global,
            nrmToTarget = g.vec3_0,
            nrmUp = g.vec4_0,
            turretPosition = g.vec4_1;

        for (let i = 0; i < this.items.length; ++i)
        {
            const item = this.items[i];
            if (!item.display && !item.canFireWhenHidden) continue;

            turretPosition[0] = item._localTransform[12];
            turretPosition[1] = item._localTransform[13];
            turretPosition[2] = item._localTransform[14];
            turretPosition[3] = 1;
            vec4.transformMat4(turretPosition, turretPosition, this.parentMatrix);
            vec3.subtract(nrmToTarget, this.targetPosition, turretPosition);
            vec3.normalize(nrmToTarget, nrmToTarget);
            vec4.set(nrmUp, 0, 1, 0, 0);
            vec4.transformMat4(nrmUp, nrmUp, item._localTransform);
            vec4.transformMat4(nrmUp, nrmUp, this.parentMatrix);
            const angle = vec3.dot(nrmUp, nrmToTarget);
            if (angle > closestAngle)
            {
                closestTurret = this.items.indexOf(item);
                closestAngle = angle;
            }
        }

        return closestTurret;
    }

    /**
     * Animation helper function for deactivating a turret set
     */
    EnterStateDeactive()
    {
        if (this.state === EveTurretSet.State.INACTIVE || this.state === EveTurretSet.State.PACKING) return;

        if (this.turretEffect)
        {
            this.activeAnimation.StopAllAnimations();
            this.inactiveAnimation.StopAllAnimations();

            this.activeAnimation.PlayAnimation('Pack', false, () =>
            {
                this.state = EveTurretSet.State.INACTIVE;
                this.activeAnimation.PlayAnimation('Inactive', true);
            });

            this.inactiveAnimation.PlayAnimation('Pack', false, () =>
            {
                this.state = EveTurretSet.State.INACTIVE;
                this.inactiveAnimation.PlayAnimation('Inactive', true);
            });

            this.state = EveTurretSet.State.PACKING;
        }
        else
        {
            this.state = EveTurretSet.State.INACTIVE;
        }

        this._activeTurret = -1;

        if (this.firingEffect)
        {
            this.firingEffect.StopFiring();
        }
    }

    /**
     * Animation helper function for putting a turret set into idle state
     */
    EnterStateIdle()
    {
        if (this.state === EveTurretSet.State.IDLE || this.state === EveTurretSet.State.UNPACKING) return;

        if (this.turretEffect)
        {
            this.activeAnimation.StopAllAnimations();
            this.inactiveAnimation.StopAllAnimations();

            if (this.state === EveTurretSet.State.FIRING)
            {
                this.activeAnimation.PlayAnimation('Active', true);
                this.inactiveAnimation.PlayAnimation('Active', true);
            }
            else
            {
                this.activeAnimation.PlayAnimation('Deploy', false, () =>
                {
                    this.state = EveTurretSet.State.IDLE;
                    this.activeAnimation.PlayAnimation('Active', true);
                });

                this.inactiveAnimation.PlayAnimation('Deploy', false, () =>
                {
                    this.state = EveTurretSet.State.IDLE;
                    this.inactiveAnimation.PlayAnimation('Active', true);
                });
            }

            this.state = EveTurretSet.State.UNPACKING;
        }
        else
        {
            this.state = EveTurretSet.State.IDLE;
        }

        this._activeTurret = -1;

        if (this.firingEffect)
        {
            this.firingEffect.StopFiring();
        }
    }

    /**
     * Animation helper function for putting a turret set into a firing state
     */
    EnterStateFiring()
    {
        if (!this.turretEffect || this.state === EveTurretSet.State.FIRING)
        {
            EveTurretSet.DoStartFiring(this);
            if (this.turretEffect)
            {
                this.activeAnimation.PlayAnimation('Fire', false, () =>
                {
                    this.activeAnimation.PlayAnimation('Active', true);
                });
            }
            return;
        }

        this.activeAnimation.StopAllAnimations();
        this.inactiveAnimation.StopAllAnimations();
        if (this.state === EveTurretSet.State.INACTIVE)
        {
            this.activeAnimation.PlayAnimation('Deploy', false, () =>
            {
                EveTurretSet.DoStartFiring(this);
                this.activeAnimation.PlayAnimation('Fire', false, () =>
                {
                    this.activeAnimation.PlayAnimation('Active', true);
                });
            });

            this.inactiveAnimation.PlayAnimation('Deploy', false, () =>
            {
                this.inactiveAnimation.PlayAnimation('Active', true);
            });
            this.state = EveTurretSet.State.UNPACKING;
        }
        else
        {
            EveTurretSet.DoStartFiring(this);
            this.activeAnimation.PlayAnimation('Fire', false, () =>
            {
                this.activeAnimation.PlayAnimation('Active', true);
            });

            this.inactiveAnimation.PlayAnimation('Active', true);
        }
    }

    /**
     * Rebuilds the turret sets cached data
     */
    RebuildCachedData()
    {
        const
            instancedElement = new Tw2VertexElement(Tw2VertexDeclaration.Type.TEXCOORD, 1, device.gl.FLOAT, 2),
            meshes = this.geometryResource.meshes,
            active = this.activeAnimation,
            inactive = this.inactiveAnimation;

        for (let i = 0; i < meshes.length; ++i)
        {
            meshes[i].declaration.elements.push(instancedElement);
            meshes[i].declaration.RebuildHash();
        }

        switch (this.state)
        {
            case EveTurretSet.State.INACTIVE:
                active.PlayAnimation('Inactive', true);
                inactive.PlayAnimation('Inactive', true);
                break;

            case EveTurretSet.State.IDLE:
                active.PlayAnimation('Active', true);
                inactive.PlayAnimation('Active', true);
                break;

            case EveTurretSet.State.FIRING:
                active.PlayAnimation('Fire', false, () => active.PlayAnimation('Active', true));
                inactive.PlayAnimation('Active', true);
                break;

            case EveTurretSet.State.PACKING:
                this.EnterStateIdle();
                break;

            case EveTurretSet.State.UNPACKING:
                this.EnterStateDeactive();
                break;
        }
    }

    /**
     * Finds a turret item by name
     * @param {string} name
     * @returns {?EveTurretSetItem}
     */
    FindItemByLocatorName(name)
    {
        for (let i = 0; i < this.items.length; i++)
        {
            if (this.items[i].locatorName === name)
            {
                return this.items[i];
            }
        }
        return null;
    }

    /**
     * Updates the turret set's items that were created from locators
     * - Turrets without locator names are ignored
     * @param {Array<EveLocator>} locators
     */
    UpdateItemsFromLocators(locators)
    {
        const
            g = EveTurretSet.global,
            toRemove = Array.from(this.items),
            norm = g.mat4_0;

        for (let i = 0; i < locators.length; i++)
        {
            const {name, transform, bone = null} = locators[i];

            let item = this.FindItemByLocatorName(name);
            if (!item)
            {
                item = this.CreateItem({
                    name: name,
                    locatorName: name,
                    updateFromLocator: true,
                });
            }
            else
            {
                toRemove.splice(toRemove.indexOf(item), 1);
            }

            if (item.updateFromLocator)
            {
                item.bone = bone;
                mat4.copy(norm, transform);
                vec3.normalize(norm.subarray(0, 3), norm.subarray(0, 3));
                vec3.normalize(norm.subarray(4, 7), norm.subarray(4, 7));
                vec3.normalize(norm.subarray(8, 11), norm.subarray(8, 11));
                mat4.getRotation(item.rotation, norm);
                mat4.getTranslation(item.position, norm);
                item.OnValueChanged();
            }
        }

        for (let i = 0; i < toRemove.length; i++)
        {
            if (toRemove[i].locatorName)
            {
                this.RemoveItem(toRemove[i]);
                i--;
            }
        }

        this._locatorRebuildPending = false;
        if (this._rebuildPending) this.Rebuild();
    }

    /**
     * Rebuilds the turret set's items from it's parent's locators
     */
    RebuildItemsFromLocators()
    {
        this._locatorRebuildPending = true;
    }

    /**
     * Gets turret set res objects
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.geometryResource && !out.includes(this.geometryResource))
        {
            out.push(this.geometryResource);
        }

        if (this.turretEffect)
        {
            this.turretEffect.GetResources(out);
        }

        if (this.firingEffect)
        {
            this.firingEffect.GetResources(out);
        }

        return out;
    }

    /**
     * Updates view dependent data
     */
    UpdateViewDependentData()
    {
        if (this.firingEffect)
        {
            this.firingEffect.UpdateViewDependentData();
        }
    }

    /**
     * Per frame update
     * @param {number} dt - Delta Time
     * @param {mat4} parentMatrix
     */
    Update(dt, parentMatrix)
    {
        if (this._rebuildPending)
        {
            this.Rebuild();
        }

        if (this.turretEffect)
        {
            this.activeAnimation.Update(dt);
            this.inactiveAnimation.Update(dt);
        }

        mat4.copy(this.parentMatrix, parentMatrix);

        if (this.firingEffect && this._visibleItems.length)
        {
            if (this._activeTurret !== -1)
            {
                if (this.firingEffect.isLoopFiring)
                {
                    if (this.state === EveTurretSet.State.FIRING)
                    {
                        this._recheckTimeLeft -= dt;
                        if (this._recheckTimeLeft <= 0)
                        {
                            EveTurretSet.DoStartFiring(this);
                        }
                    }
                }

                const activeItem = this.items[this._activeTurret];

                if (this.activeAnimation.models.length)
                {
                    const bones = this.activeAnimation.models[0].bonesByName;
                    for (let i = 0; i < this.firingEffect.GetPerMuzzleEffectCount(); ++i)
                    {
                        const
                            transform = bones[EveTurretSet.positionBoneSkeletonNames[i]].worldTransform,
                            out = this.firingEffect.GetMuzzleTransform(i);

                        mat4.multiply(out, activeItem._localTransform, transform);
                        mat4.multiply(out, out, parentMatrix);
                    }
                }
                else
                {
                    for (let i = 0; i < this.firingEffect.GetPerMuzzleEffectCount(); ++i)
                    {
                        mat4.multiply(this.firingEffect.GetMuzzleTransform(i), parentMatrix, activeItem._localTransform);
                    }
                }

                if (this.fireCallbackPending)
                {
                    if (this.fireCallback)
                    {
                        const cbTransforms = [];
                        for (let i = 0; i < this.firingEffect.GetPerMuzzleEffectCount(); ++i)
                        {
                            cbTransforms.push(this.firingEffect.GetMuzzleTransform(i));
                        }
                        this.fireCallback(this, cbTransforms);
                    }
                    this.fireCallbackPending = false;
                }
            }

            vec3.copy(this.firingEffect.endPosition, this.targetPosition);
            this.firingEffect.Update(dt);
        }
    }

    /**
     * Gets turret set render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @param {boolean} [hideFiringEffect]
     */
    GetBatches(mode, accumulator, perObjectData, hideFiringEffect)
    {
        if (!this.turretEffect || !this.geometryResource || !this.display || !this._visibleItems.length) return;

        if (mode === device.RM_OPAQUE && this.visible.turrets)
        {
            const transforms = this.inactiveAnimation.GetBoneMatrices(0);
            if (transforms.length !== 0)
            {
                EveTurretSet.UpdatePerObjectData(this, this._perObjectDataInactive.perObjectVSData, transforms);
                this._perObjectDataInactive.perObjectPSData = perObjectData.perObjectPSData;

                const batch = new Tw2ForwardingRenderBatch();
                batch.renderMode = mode;
                batch.renderActive = false;
                batch.perObjectData = this._perObjectDataInactive;
                batch.geometryProvider = this;
                accumulator.Commit(batch);

                if (this.state === EveTurretSet.State.FIRING)
                {
                    const transforms = this.activeAnimation.GetBoneMatrices(0);
                    if (transforms.length !== 0)
                    {
                        EveTurretSet.UpdatePerObjectData(this, this._perObjectDataActive.perObjectVSData, transforms, true);
                        this._perObjectDataActive.perObjectPSData = perObjectData.perObjectPSData;

                        const batch = new Tw2ForwardingRenderBatch();
                        batch.renderActive = true;
                        batch.perObjectData = this._perObjectDataActive;
                        batch.geometryProvider = this;
                        accumulator.Commit(batch);
                    }
                }
            }
        }

        this.GetFiringEffectBatches(mode, accumulator, perObjectData, hideFiringEffect);
    }

    /**
     * Gets turret firing effect batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @param {boolean} [hideFiringEffect]
     */
    GetFiringEffectBatches(mode, accumulator, perObjectData, hideFiringEffect)
    {
        if (this.firingEffect && this.display && this._visibleItems.length && this.visible.firingEffects && !hideFiringEffect)
        {
            this.firingEffect.GetBatches(mode, accumulator, perObjectData);
        }
    }

    /**
     * Renders the turret set
     * @param batch
     * @param {string} technique - technique name
     * @returns {boolean}
     */
    Render(batch, technique)
    {
        if (!this.turretEffect || !this.turretEffect.IsGood() || !this._visibleItems.length) return false;

        let index = 0;
        const customSetter = function(el)
        {
            device.gl.disableVertexAttribArray(el.location);
            device.gl.vertexAttrib2f(el.location, index, index);
        };

        for (let i = 0; i < this.geometryResource.meshes.length; ++i)
        {
            const decl = this.geometryResource.meshes[i].declaration;
            decl.FindUsage(Tw2VertexDeclaration.Type.TEXCOORD, 1).customSetter = customSetter;
        }

        let rendered = 0;
        for (; index < this.items.length; ++index)
        {
            if (this.items[index].display)
            {
                const isActive = this.state === EveTurretSet.State.FIRING && index === this._activeTurret;
                if (batch.renderActive === isActive)
                {
                    this.geometryResource.RenderAreas(0, 0, 1, this.turretEffect, technique);
                    rendered++;
                }
            }
        }

        return !!rendered;
    }

    /**
     * Rebuilds the set's items
     *
     * @param {EveTurretSet} turretSet
     */
    static RebuildItems(turretSet)
    {
        turretSet._visibleItems = [];

        for (let i = 0; i < turretSet.items.length; i++)
        {
            const item = turretSet.items[i];
            item._onModified = turretSet._onChildModified;

            if (item.display)
            {
                turretSet._visibleItems.push(item);
                if (item._rebuildPending)
                {
                    item.UpdateTransforms();
                    item._rebuildPending = false;
                }
            }
        }
    }

    /**
     * Updates per object data
     * @param {EveTurretSet} turretSet
     * @param {Tw2RawData} perObjectData
     * @param transforms
     * @param {boolean} [skipBoneCalculations]
     */
    static UpdatePerObjectData(turretSet, perObjectData, transforms, skipBoneCalculations)
    {
        mat4.transpose(perObjectData.Get('shipMatrix'), turretSet.parentMatrix);
        const transformCount = transforms.length / 12;
        perObjectData.Get('turretSetData')[0] = transformCount;
        perObjectData.Get('baseCutoffData')[0] = turretSet.bottomClipHeight;

        const
            translation = perObjectData.Get('turretTranslation'),
            rotation = perObjectData.Get('turretRotation'),
            pose = perObjectData.Get('turretPoseTransAndRot');

        for (let i = 0; i < turretSet._visibleItems.length; ++i)
        {
            const item = turretSet._visibleItems[i];

            for (let j = 0; j < transformCount; ++j)
            {
                pose[(i * transformCount + j) * 2 * 4] = transforms[j * 12 + 3];
                pose[(i * transformCount + j) * 2 * 4 + 1] = transforms[j * 12 + 7];
                pose[(i * transformCount + j) * 2 * 4 + 2] = transforms[j * 12 + 11];
                pose[(i * transformCount + j) * 2 * 4 + 3] = 1;
                EveTurretSet.mat3x4toquat(transforms, j, pose, (i * transformCount + j) * 2 + 1);
            }

            if (item.bone && !skipBoneCalculations)
            {
                item.UpdateTransforms();
            }

            translation[i * 4] = item._localTransform[12];
            translation[i * 4 + 1] = item._localTransform[13];
            translation[i * 4 + 2] = item._localTransform[14];
            translation[i * 4 + 3] = 1;

            rotation[i * 4] = item.rotation[0];
            rotation[i * 4 + 1] = item.rotation[1];
            rotation[i * 4 + 2] = item.rotation[2];
            rotation[i * 4 + 3] = item.rotation[3];
        }
    }

    /**
     * Animation helper function for turret firing
     * @param {EveTurretSet} turretSet
     * @returns {EveTurretSetItem} the closest turret
     */
    static DoStartFiring(turretSet)
    {
        if (turretSet.hasCyclingFiringPos)
        {
            turretSet._currentCyclingFiresPos = 1 - turretSet._currentCyclingFiresPos;
        }

        if (turretSet.firingEffect)
        {
            turretSet.firingEffect.PrepareFiring(0, turretSet.hasCyclingFiringPos ? turretSet._currentCyclingFiresPos : -1);
        }

        turretSet._activeTurret = turretSet.GetClosestTurret();
        turretSet.state = EveTurretSet.State.FIRING;
        turretSet._recheckTimeLeft = 2;

        if (turretSet.fireCallback)
        {
            turretSet.fireCallbackPending = true;
        }
    }
}

/**
 * mat3x4 to quat
 */
EveTurretSet.mat3x4toquat = (function()
{
    let m, q;

    return function mat3x4toquat(mm, index, out, outIndex)
    {
        if (!m)
        {
            m = mat4.create();
            q = quat.create();
        }

        index *= 12;
        outIndex *= 4;

        m[0] = mm[index];
        m[1] = mm[index + 4];
        m[2] = mm[index + 8];
        m[3] = 0;
        m[4] = mm[index + 1];
        m[5] = mm[index + 5];
        m[6] = mm[index + 9];
        m[7] = 0;
        m[8] = mm[index + 2];
        m[9] = mm[index + 6];
        m[10] = mm[index + 10];
        m[11] = 0;
        m[12] = mm[index + 3];
        m[13] = mm[index + 7];
        m[14] = mm[index + 11];
        m[15] = 1;

        mat4.getRotation(q, m);
        out[outIndex] = q[0];
        out[outIndex + 1] = q[1];
        out[outIndex + 2] = q[2];
        out[outIndex + 3] = q[3];
    };
})();

/**
 * The eve turret set's item constructor
 * @type {EveTurretSetItem}
 */
EveTurretSet.Item = EveTurretSetItem;

/**
 * Turret states
 * @type {{INACTIVE: number, IDLE: number, FIRING: number, PACKING: number, UNPACKING: number}}
 */
EveTurretSet.State = {
    INACTIVE: 0,
    IDLE: 1,
    FIRING: 2,
    PACKING: 2,
    UNPACKING: 4
};

/**
 * World turret bone names
 * @type {string[]}
 */
EveTurretSet.worldNames = [
    'turretWorld0',
    'turretWorld1',
    'turretWorld2'
];

/**
 * Bone Skeleton Names
 * @type {string[]}
 */
EveTurretSet.positionBoneSkeletonNames = [
    'Pos_Fire01',
    'Pos_Fire02',
    'Pos_Fire03',
    'Pos_Fire04',
    'Pos_Fire05',
    'Pos_Fire06',
    'Pos_Fire07',
    'Pos_Fire08'
];
