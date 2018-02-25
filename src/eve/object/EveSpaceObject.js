import {vec3, vec4, mat4, util} from '../../math';
import {Tw2AnimationController, Tw2PerObjectData} from '../../core';
import {EveObject} from './EveObject';

/**
 * EveSpaceObject
 *
 * @parameter {String} name
 * @parameter {boolean} display                             - Enables/ disables visibility
 * @parameter {{}} visible                                  - Visibility options for the space object's elements
 * @parameter {boolean} visible.mesh                        - Enables/ disables mesh visibility
 * @parameter {boolean} visible.children                    - Enables/ disables child visibility
 * @parameter {boolean} visible.effectChildren              - Enables/ disables effect child visibility
 * @parameter {boolean} visible.spriteSets                  - Enables/ disables sprite visibility
 * @parameter {boolean} visible.decals                      - Enables/ disables decal visibility
 * @parameter {boolean} visible.spotlightSets               - Enables/ disables spotlight visibility
 * @parameter {boolean} visible.planeSets                   - Enables/ disables plane visibility
 * @parameter {boolean} visible.lineSets                    - Enables/ disables lines visibility
 * @parameter {boolean} visible.overlayEffects              - Enables/ disables overlay effect visibility
 * @parameter {boolean} visible.killmarks                   - Enables/ disables killmark visibility
 * @parameter {boolean} visible.customMasks                 - Enables/ disables custom mask visibility
 * @parameter {Number} lod
 * @parameter {Tw2Mesh} mesh
 * @parameter {Array.<EveLocator>} locators
 * @parameter {Array.<EveSpriteSet>} spriteSets
 * @parameter {Array.<EveTurretSet>} turretSets
 * @parameter {Array.<EveSpaceObjectDecal>} decals
 * @parameter {Array.<EveSpotlightSet>} spotlightSets
 * @parameter {Array.<EvePlaneSet>} planeSets
 * @parameter {Array.<Tw2CurveSet>} curveSets
 * @parameter {Array.<EveCurveLineSet>} lineSets
 * @parameter {Array.<EveMeshOverlayEffect>} overlayEffects
 * @parameter {Array.<{}>} children
 * @parameter {vec3} boundingSphereCenter
 * @parameter {Number} boundingSphereRadius
 * @parameter {vec3} shapeEllipsoidRadius
 * @parameter {vec3} shapeEllipsoidCenter
 * @parameter {mat4} transform
 * @parameter {Tw2AnimationController} animation
 * @parameter {number} killCount                            - number of kills to show on kill counter decals
 * @parameter {Tw2PerObjectData} _perObjectData
 * @class
 */
export class EveSpaceObject extends EveObject
{
    constructor()
    {
        super();
        this.visible = {};
        this.visible.mesh = true;
        this.visible.children = true;
        this.visible.effectChildren = true;
        this.visible.planeSets = true;
        this.visible.spotlightSets = true;
        this.visible.decals = true;
        this.visible.spriteSets = true;
        this.visible.overlayEffects = true;
        this.visible.lineSets = true;
        this.visible.killmarks = true;
        this.visible.customMasks = true;
        this.mesh = null;
        this.animation = new Tw2AnimationController();
        this.locators = [];
        this.spriteSets = [];
        this.turretSets = [];
        this.decals = [];
        this.spotlightSets = [];
        this.planeSets = [];
        this.curveSets = [];
        this.lineSets = [];
        this.overlayEffects = [];
        this.children = [];
        this.effectChildren = [];
        this.customMasks = [];
        this.lod = 3;
        this.killCount = 0;
        this.transform = mat4.create();
        this.boundingSphereCenter = vec3.create();
        this.boundingSphereRadius = 0;
        this.shapeEllipsoidRadius = vec3.create();
        this.shapeEllipsoidCenter = vec3.create();
        this._perObjectData = new Tw2PerObjectData(EveSpaceObject.perObjectDataDecl);
    }

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
        let count = 0;
        for (let i = 0; i < this.locators.length; ++i)
        {
            if (this.locators[i].name.substr(0, prefix.length) === prefix)
            {
                ++count;
            }
        }
        return count;
    }

    /**
     * Finds a locator joint by it's name
     * @param {String} name
     * @returns {null|mat4}
     */
    FindLocatorJointByName(name)
    {
        const model = this.animation.FindModelForMesh(0);
        if (model)
        {
            for (let i = 0; i < model.bones.length; ++i)
            {
                if (model.bones[i].boneRes.name === name)
                {
                    return model.bones[i].worldTransform;
                }
            }
        }
        return null;
    }

    /**
     * Finds a locator transform by it's name
     * @param {String} name
     * @returns {null|mat4}
     */
    FindLocatorTransformByName(name)
    {
        for (let i = 0; i < this.locators.length; ++i)
        {
            if (this.locators[i].name === name)
            {
                return this.locators[i].transform;
            }
        }
        return null;
    }

    /**
     * Finds locators with a given prefix
     * @param {string} prefix
     * @returns {Array}
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
        else if (this.mesh && this.mesh.geometryResource && this.mesh.geometryResource.IsGood())
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

            /*
            for (let i = 0; i < this.spotlightSets.length; i++)
            {
                this.spotlightSets[i].Update(dt);
            }
            */

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
                    for (let i = 0; i <  this.lineSets.length; i++)
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

            if (show.overlayEffects)
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
}

/**
 * Class global and scratch variables
 * @type {{string:*}}
 */
EveSpaceObject.global = {
    vec3_0 : vec3.create()
};

/**
 * Per object data declarations
 * @type {{VSData: *[], PSData: *[]}}
 */
EveSpaceObject.perObjectDataDecl = {
    VSData: [
        {name: 'WorldMat', size: 16},
        {name: 'WorldMatLast', size: 16},
        {name: 'Shipdata', size: 4, value: [0, 1, 0, -10]},
        {name: 'Clipdata1', size: 4},
        {name: 'EllipsoidRadii', size: 4},
        {name: 'EllipsoidCenter', size: 4},
        {name: 'CustomMaskMatrix0', size: 16, value: mat4.create()},
        {name: 'CustomMaskMatrix1', size: 16, value: mat4.create()},
        {name: 'CustomMaskData0', size: 4},
        {name: 'CustomMaskData1', size: 4},
        {name: 'JointMat', size: 696}
    ],
    PSData: [
        {name: 'Shipdata', size: 4, value: [0, 1, 0, 1]},
        {name: 'Clipdata1', size: 4},
        {name: 'Clipdata2', size: 4},
        {name: 'ShLighting', size: 4 * 7},
        {name: 'CustomMaskMaterialID0', size: 4},
        {name: 'CustomMaskMaterialID1', size: 4},
        {name: 'CustomMaskTarget0', size: 4},
        {name: 'CustomMaskTarget1', size: 4}
    ]
};