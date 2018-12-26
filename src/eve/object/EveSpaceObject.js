import {vec3, vec4, mat4, util} from '../../global';
import {Tw2AnimationController, Tw2PerObjectData} from '../../core';
import {EveObject} from './EveObject';

/**
 * EveSpaceObject
 *
 * @property {String} name
 * @property {boolean} display                             - Enables/ disables visibility
 * @property {{}} visible                                  - Visibility options for the space object's elements
 * @property {boolean} visible.mesh                        - Enables/ disables mesh visibility
 * @property {boolean} visible.children                    - Enables/ disables child visibility
 * @property {boolean} visible.effectChildren              - Enables/ disables effect child visibility
 * @property {boolean} visible.spriteSets                  - Enables/ disables sprite visibility
 * @property {boolean} visible.decals                      - Enables/ disables decal visibility
 * @property {boolean} visible.spotlightSets               - Enables/ disables spotlight visibility
 * @property {boolean} visible.planeSets                   - Enables/ disables plane visibility
 * @property {boolean} visible.lineSets                    - Enables/ disables lines visibility
 * @property {boolean} visible.overlayEffects              - Enables/ disables overlay effect visibility
 * @property {boolean} visible.killmarks                   - Enables/ disables killmark visibility
 * @property {boolean} visible.customMasks                 - Enables/ disables custom mask visibility
 * @property {boolean} visible.turretSets      - Enables/ disables turret set batch accumulation
 * @property {boolean} visible.boosters        - Enables/ disables booster batch accumulation
 * @property {Number} lod
 * @property {Tw2Mesh} mesh
 * @property {Array.<EveLocator>} locators
 * @property {Array.<EveSpriteSet>} spriteSets
 * @property {Array.<EveTurretSet>} turretSets
 * @property {Array.<EveSpaceObjectDecal>} decals
 * @property {Array.<EveSpotlightSet>} spotlightSets
 * @property {Array.<EvePlaneSet>} planeSets
 * @property {Array.<Tw2CurveSet>} curveSets
 * @property {Array.<EveCurveLineSet>} lineSets
 * @property {Array.<EveMeshOverlayEffect>} overlayEffects
 * @property {Array.<{}>} children
 * @property {vec3} boundingSphereCenter
 * @property {Number} boundingSphereRadius
 * @property {vec3} shapeEllipsoidRadius
 * @property {vec3} shapeEllipsoidCenter
 * @property {mat4} transform
 * @property {Tw2AnimationController} animation
 * @property {number} killCount                            - number of kills to show on kill counter decals
 * @property {Tw2PerObjectData} _perObjectData
 * @class
 */
export class EveSpaceObject extends EveObject
{

    visible = {
        mesh: true,
        children: true,
        effectChildren: true,
        planeSets: true,
        spotlightSets: true,
        decals: true,
        spriteSets: true,
        overlayEffects: true,
        lineSets: true,
        killmarks: true,
        customMasks: true,
        turretSets: true,
        boosters: true
    };
    mesh = null;
    animation = new Tw2AnimationController();
    locators = [];
    spriteSets = [];
    turretSets = [];
    decals = [];
    spotlightSets = [];
    planeSets = [];
    curveSets = [];
    lineSets = [];
    overlayEffects = [];
    children = [];
    effectChildren = [];
    customMasks = [];
    lod = 3;
    killCount = 0;
    transform = mat4.create();
    boundingSphereCenter = vec3.create();
    boundingSphereRadius = 0;
    shapeEllipsoidRadius = vec3.create();
    shapeEllipsoidCenter = vec3.create();
    _perObjectData = new Tw2PerObjectData(EveSpaceObject.perObjectData);


    /**
     * Initializes the EveSpaceObject
     */
    Initialize()
    {
        if (this.mesh)
        {
            this.animation.SetGeometryResource(this.mesh.geometryResource);

            for (let i = 0; i < this.decals.length; ++i)
            {
                this.decals[i].SetParentGeometry(this.mesh.geometryResource);
            }
        }
    }

    /**
     * Resets the lod
     */
    ResetLod()
    {
        this.lod = 3;
    }

    /**
     * Updates the lod
     * @param {Tw2Frustum} frustum
     */
    UpdateLod(frustum)
    {
        const center = vec3.transformMat4(EveSpaceObject.global.vec3_0, this.boundingSphereCenter, this.transform);

        if (frustum.IsSphereVisible(center, this.boundingSphereRadius))
        {
            if (frustum.GetPixelSizeAcross(center, this.boundingSphereRadius) < 100)
            {
                this.lod = 1;
            }
            else
            {
                this.lod = 2;
            }
        }
        else
        {
            this.lod = 0;
        }
    }

    /**
     * Adds a custom mask
     * @param {vec3} position
     * @param {vec3} scaling
     * @param {quat} rotation
     * @param {vec4} isMirrored
     * @param {vec4} sourceMaterial
     * @param {vec4} targetMaterials
     */
    AddCustomMask(position, scaling, rotation, isMirrored, sourceMaterial, targetMaterials)
    {
        const transform = mat4.fromRotationTranslationScale(mat4.create(), rotation, position, scaling);
        mat4.invert(transform, transform);
        mat4.transpose(transform, transform);

        this.customMasks.push({
            transform: transform,
            maskData: vec4.fromValues(1, isMirrored ? 1 : 0, 0, 0),
            materialID: vec4.fromValues(sourceMaterial, 0, 0, 0),
            targets: targetMaterials
        });
    }

    /**
     * Gets locator count for a specific locator group
     * @param {String} prefix
     * @returns {number}
     */
    GetLocatorCount(prefix)
    {
        const locators = this.FindLocatorsByPrefix(prefix);
        return locators.length;
    }

    /**
     * Finds a locator's joint by name
     * @param {string} name
     * @returns {?mat4}
     */
    FindLocatorJointByName(name)
    {
        const locator = this.FindLocatorBoneByName(name);
        return locator ? locator.worldTransform : null;
    }

    /**
     *
     * @param name
     * @returns {null}
     */
    FindLocatorTransformByName(name)
    {
        const locator = this.FindLocatorByName(name);
        return locator ? locator.transform : null;
    }

    /**
     * Checks if a locator prefix exists
     * @param {string} prefix
     * @returns {boolean}
     */
    HasLocatorPrefix(prefix)
    {
        for (let i = 0; i < this.locators.length; i++)
        {
            if (this.locators[i].name.substring(0, prefix.length) === prefix)
            {
                return true;
            }
        }
        return false;
    }

    /**
     * Finds a locator's bone by it's name
     * @param {String} name
     * @returns {?Tw2Bone} null if not found
     */
    FindLocatorBoneByName(name)
    {
        const model = this.animation.FindModelForMesh(0);
        if (model)
        {
            for (let i = 0; i < model.bones.length; ++i)
            {
                if (model.bones[i].boneRes.name === name)
                {
                    return model.bones[i];
                }
            }
        }
        return null;
    }

    /**
     * Finds a locator by name
     * @param {string} name
     * @returns {?EveLocator}
     */
    FindLocatorByName(name)
    {
        for (let i = 0; i < this.locators.length; i++)
        {
            if (this.locators[i].name === name)
            {
                return this.locators[i];
            }
        }
        return null;
    }

    /**
     * Finds locators with a given prefix
     * @param {string} prefix
     * @returns {Array<EveLocator>}
     */
    FindLocatorsByPrefix(prefix)
    {
        const locators = [];
        for (let i = 0; i < this.locators.length; i++)
        {
            if (this.locators[i].name.indexOf(prefix) === 0)
            {
                locators.push(this.locators[i]);
            }
        }
        return locators;
    }

    /**
     * Gets object's res objects
     * @param {Array} [out=[]] - Optional receiving array
     * @param {Boolean} excludeChildren - True to exclude children's res objects
     * @returns {Array.<Tw2EffectRes|Tw2TextureRes|Tw2GeometryRes>} [out]
     */
    GetResources(out = [], excludeChildren)
    {
        if (this.mesh) this.mesh.GetResources(out);
        if (this.animation) this.animation.GetResources(out);

        util.perArrayChild(this.spriteSets, 'GetResources', out);
        util.perArrayChild(this.turretSets, 'GetResources', out);
        util.perArrayChild(this.decals, 'GetResources', out);
        util.perArrayChild(this.spotlightSets, 'GetResources', out);
        util.perArrayChild(this.planeSets, 'GetResources', out);
        util.perArrayChild(this.lineSets, 'GetResources', out);
        util.perArrayChild(this.overlayEffects, 'GetResources', out);
        util.perArrayChild(this.effectChildren, 'GetResources', out);

        if (!excludeChildren)
        {
            util.perArrayChild(this.children, 'GetResources', out);
        }

        return out;
    }

    /**
     * A Per frame function that updates view dependent data
     */
    UpdateViewDependentData()
    {
        for (let i = 0; i < this.children.length; ++i)
        {
            this.children[i].UpdateViewDependentData(this.transform);
        }

        mat4.transpose(this._perObjectData.perObjectVSData.Get('WorldMat'), this.transform);
        mat4.transpose(this._perObjectData.perObjectVSData.Get('WorldMatLast'), this.transform);

        const
            center = this._perObjectData.perObjectVSData.Get('EllipsoidCenter'),
            radii = this._perObjectData.perObjectVSData.Get('EllipsoidRadii');

        if (this.shapeEllipsoidRadius[0] > 0)
        {
            center[0] = this.shapeEllipsoidCenter[0];
            center[1] = this.shapeEllipsoidCenter[1];
            center[2] = this.shapeEllipsoidCenter[2];
            radii[0] = this.shapeEllipsoidRadius[0];
            radii[1] = this.shapeEllipsoidRadius[1];
            radii[2] = this.shapeEllipsoidRadius[2];
        }
        else if (this.mesh && this.mesh.IsGood())
        {
            vec3.subtract(center, this.mesh.geometryResource.maxBounds, this.mesh.geometryResource.minBounds);
            vec3.scale(center, center, 0.5 * 1.732050807);
            vec3.add(radii, this.mesh.geometryResource.maxBounds, this.mesh.geometryResource.minBounds);
            vec3.scale(radii, radii, 0.5);
        }

        for (let i = 0; i < this.customMasks.length; ++i)
        {
            const targets = this.visible.customMasks ? this.customMasks[i].targets : [0, 0, 0, 0];
            this._perObjectData.perObjectVSData.Set(i ? 'CustomMaskMatrix1' : 'CustomMaskMatrix0', this.customMasks[i].transform);
            this._perObjectData.perObjectVSData.Set(i ? 'CustomMaskData1' : 'CustomMaskData0', this.customMasks[i].maskData);
            this._perObjectData.perObjectPSData.Set(i ? 'CustomMaskMaterialID1' : 'CustomMaskMaterialID0', this.customMasks[i].materialID);
            this._perObjectData.perObjectPSData.Set(i ? 'CustomMaskTarget1' : 'CustomMaskTarget0', targets);
        }

        if (this.animation.animations.length)
        {
            this._perObjectData.perObjectVSData.Set('JointMat', this.animation.GetBoneMatrices(0));
        }

        for (let i = 0; i < this.lineSets.length; ++i)
        {
            this.lineSets[i].UpdateViewDependentData(this.transform);
        }
    }

    /**
     * Per frame update
     * @param {Number} dt - delta time
     */
    Update(dt)
    {
        if (this.lod > 0)
        {
            for (let i = 0; i < this.spriteSets.length; ++i)
            {
                this.spriteSets[i].Update(dt);
            }

            for (let i = 0; i < this.planeSets.length; i++)
            {
                this.planeSets[i].Update(dt);
            }

            for (let i = 0; i < this.spotlightSets.length; i++)
            {
                this.spotlightSets[i].Update(dt);
            }

            for (let i = 0; i < this.children.length; ++i)
            {
                this.children[i].Update(dt);
            }

            for (let i = 0; i < this.effectChildren.length; ++i)
            {
                this.effectChildren[i].Update(dt, this.transform);
            }

            for (let i = 0; i < this.curveSets.length; ++i)
            {
                this.curveSets[i].Update(dt);
            }

            for (let i = 0; i < this.overlayEffects.length; ++i)
            {
                this.overlayEffects[i].Update(dt);
            }

            for (let i = 0; i < this.lineSets.length; i++)
            {
                this.lineSets[i].Update(dt);
            }

            this.animation.Update(dt);
        }
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    GetBatches(mode, accumulator)
    {
        if (this.display)
        {
            const show = this.visible;

            if (show.mesh && this.mesh && this.lod > 0)
            {
                this.mesh.GetBatches(mode, accumulator, this._perObjectData);
            }

            if (this.lod > 1)
            {
                if (show.spriteSets)
                {
                    for (let i = 0; i < this.spriteSets.length; i++)
                    {
                        this.spriteSets[i].GetBatches(mode, accumulator, this._perObjectData, this.transform);
                    }
                }

                if (show.spotlightSets)
                {
                    for (let i = 0; i < this.spotlightSets.length; i++)
                    {
                        this.spotlightSets[i].GetBatches(mode, accumulator, this._perObjectData);
                    }
                }

                if (show.planeSets)
                {
                    for (let i = 0; i < this.planeSets.length; i++)
                    {
                        this.planeSets[i].GetBatches(mode, accumulator, this._perObjectData);
                    }
                }

                if (show.decals)
                {
                    for (let i = 0; i < this.decals.length; i++)
                    {
                        this.decals[i].GetBatches(mode, accumulator, this._perObjectData, show.killmarks ? this.killCount : 0);
                    }
                }

                if (show.lineSets)
                {
                    for (let i = 0; i < this.lineSets.length; i++)
                    {
                        this.lineSets[i].GetBatches(mode, accumulator);
                    }
                }
            }

            if (show.children)
            {
                for (let i = 0; i < this.children.length; i++)
                {
                    this.children[i].GetBatches(mode, accumulator, this._perObjectData);
                }
            }

            if (show.effectChildren)
            {
                for (let i = 0; i < this.effectChildren.length; i++)
                {
                    this.effectChildren[i].GetBatches(mode, accumulator, this._perObjectData);
                }
            }

            if (show.overlayEffects && this.mesh && this.mesh.IsGood())
            {
                for (let i = 0; i < this.overlayEffects.length; i++)
                {
                    this.overlayEffects[i].GetBatches(mode, accumulator, this._perObjectData, this.mesh);
                }
            }
        }
    }

    /**
     * RenderDebugInfo
     * @param debugHelper
     */
    RenderDebugInfo(debugHelper)
    {
        this.animation.RenderDebugInfo(debugHelper);
    }

    /**
     * Per object data
     * @type {{VSData: *[], PSData: *[]}}
     */
    static perObjectData = {
        VSData: [
            ['WorldMat', 16],
            ['WorldMatLast', 16],
            ['Shipdata', 4, [0, 1, 0, -10]],
            ['Clipdata1', 4],
            ['EllipsoidRadii', 4],
            ['EllipsoidCenter', 4],
            ['CustomMaskMatrix0', 16, mat4.identity([])],
            ['CustomMaskMatrix1', 16, mat4.identity([])],
            ['CustomMaskData0', 4],
            ['CustomMaskData1', 4],
            ['JointMat', 696]
        ],
        PSData: [
            ['Shipdata', 4, [0, 1, 0, 1]],
            ['Clipdata1', 4],
            ['Clipdata2', 4],
            ['ShLighting', 4 * 7],
            ['CustomMaskMaterialID0', 4],
            ['CustomMaskMaterialID1', 4],
            ['CustomMaskTarget0', 4],
            ['CustomMaskTarget1', 4]
        ]
    };

}

export {EveSpaceObject as EveStation};