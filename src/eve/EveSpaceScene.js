import {vec3, vec4, quat, mat4, util} from '../math';
import {device as d, resMan, store, Tw2BatchAccumulator, Tw2RawData, Tw2Frustum} from '../core';

/**
 * EveSpaceScene
 *
 * @property {number|string} _id
 * @property {string} name
 * @property {boolean} display
 * @property {{}} visible
 * @property {boolean} visible.lensflare
 * @property {boolean} visible.objects
 * @property {boolean} visible.planets
 * @property {boolean} visible.fog
 * @property {boolean} visible.clearColor
 * @property {boolean} visible.nebula
 * @property {Array.<EveLensflare>} lensflares - Scene lensflares
 * @property {Array.<*>} objects - Scene objects
 * @property {Array.<EvePlanet>} planets - Scene planets
 * @property {number} nebulaIntensity - controls nebula intensity on scene objects
 * @property {vec4} ambientColor - unused
 * @property {null|Tw2Effect} backgroundEffect
 * @property {number} backgroundRenderingEnabled - Toggles background effect visibility
 * @property {vec3} endMapScaling - controls the scale of the environment maps
 * @property {quat} envMapRotation - controls the rotation of the environment maps
 * @property {boolean} logEnabled - toggles LOD
 * @property {number} fogStart - fog start distance
 * @property {number} fogEnd - fog end distance
 * @property {number} fogMax - fog maximum opacity
 * @property {number} fogType - fog blend type
 * @property {number} fogBlur - fog blur mode
 * @property {vec4} fogColor - fog color
 * @property {vec3} sunDirection - the direction of the scene sun
 * @property {vec4} sunDiffuseColor - the colour of the light from the sun
 * @property {String} envMapResPath - nebula reflection map path
 * @property {String} envMap1ResPath - nebula diffuse map path
 * @property {String} envMap2ResPath - nebular blur map path
 * @property {String} envMap3ResPath - unused
 * @property {null|Tw2TextureRes} envMapRes
 * @property {null|Tw2TextureRes} envMap1Res
 * @property {null|Tw2TextureRes} envMap2Res
 * @property {null} envMap3Res - unused
 * @property {Tw2BatchAccumulator} _batches - Scene batch accumulator
 * @property {Tw2RawData} _perFrameVS
 * @property {Tw2RawData} _perFramePS
 * @property {boolean} renderDebugInfo
 * @property {*} _debugHelper
 * @class
 */
export class EveSpaceScene
{
    constructor()
    {
        this._id = util.generateID();
        this.name = '';
        this.display = true;
        this.visible = {};
        this.visible.lensflares = true;
        this.visible.objects = true;
        this.visible.planets = true;
        this.visible.fog = true;
        this.visible.clearColor = true;
        this.visible.reflection = true;
        this.visible.diffuse = true;
        this.visible.blur = true;
        this.lensflares = [];
        this.objects = [];
        this.planets = [];
        this.nebulaIntensity = 1;
        this.ambientColor = quat.fromValues(0.25, 0.25, 0.25, 1);
        this.backgroundEffect = null;
        this.backgroundRenderingEnabled = 1;
        this.clearColor = vec4.fromValues(0, 0, 0, 0);
        this.lodEnabled = false;
        this.fogStart = 0;
        this.fogEnd = 0;
        this.fogMax = 0;
        this.fogType = 0;
        this.fogBlur = 0;
        this.fogColor = vec4.fromValues(0.25, 0.25, 0.25, 1);
        this.sunDirection = vec3.fromValues(1, -1, 1);
        this.sunDiffuseColor = vec4.fromValues(1, 1, 1, 1);
        this.envMapScaling = vec3.fromValues(1, 1, 1);
        this.envMapRotation = quat.create();
        this.envMapResPath = '';
        this.envMap1ResPath = '';
        this.envMap2ResPath = '';
        this.envMap3ResPath = '';
        this.envMapRes = null;
        this.envMap1Res = null;
        this.envMap2Res = null;
        this.envMap3Res = null;
        this.renderDebugInfo = false;
        this._debugHelper = null;
        this._batches = new Tw2BatchAccumulator();
        this._perFrameVS = new Tw2RawData(EveSpaceScene.perObjectDataDecl.VSData);
        this._perFramePS = new Tw2RawData(EveSpaceScene.perObjectDataDecl.PSData);

        Object.defineProperty(this.visible, 'environment', {
            get: () => { return this.backgroundRenderingEnabled; },
            set: bool => { this.backgroundRenderingEnabled = bool ? 1 : 0; }
        });

        EveSpaceScene.init();
    }

    /**
     * Initializes the space scene
     */
    Initialize()
    {
        this.SetEnvMapReflection(this.envMapResPath);
        this.SetEnvMapDiffuse(this.envMap1ResPath);
        this.SetEnvMapBlur(this.envMap2ResPath);
        this.SetEnvMapPath(3, this.envMap3ResPath);
    }

    /**
     * Keeps the scene and it's object's resources alive
     */
    KeepAlive()
    {
        const res = this.GetResources();
        for (let i = 0; i < res.length; i++)
        {
            res[i].KeepAlive();
        }
    }

    /**
     * Enables LOD
     * @param {boolean} enable
     */
    EnableLod(enable)
    {
        this.lodEnabled = enable;

        if (!enable)
        {
            for (let i = 0; i < this.objects.length; ++i)
            {
                if (this.objects[i].ResetLod)
                {
                    this.objects[i].ResetLod();
                }
            }
        }
    }

    /**
     * Sets the environment's reflection map
     * @param {String} path
     */
    SetEnvMapReflection(path)
    {
        this.SetEnvMapPath(0, path);
    }

    /**
     * Sets the environment's diffuse map
     * @param {string} path
     */
    SetEnvMapDiffuse(path)
    {
        this.SetEnvMapPath(1, path);
    }

    /**
     * Sets the environment's blur map (used for fog)
     * @param {string} path
     */
    SetEnvMapBlur(path)
    {
        this.SetEnvMapPath(2, path);
    }

    /**
     * Sets an environment map
     * @param {number} index
     * @param {String} path
     */
    SetEnvMapPath(index, path)
    {
        const setEnvPath = (path, pathTarget, resTarget) =>
        {
            path = path.toLowerCase();
            this[pathTarget] = path;
            this[resTarget] = path === '' ? null : resMan.GetResource(path);
            return true;
        };

        switch (index)
        {
            case 0: // Reflection
                return setEnvPath(path, 'envMapResPath', 'envMapRes');

            case 1: // Diffuse
                return setEnvPath(path, 'envMap1ResPath', 'envMap1Res');

            case 2: // Blur
                return setEnvPath(path, 'envMap2ResPath', 'envMap2Res');

            case 3: // Unused
                return setEnvPath(path, 'envMap3ResPath', 'envMap3Res');
        }

        return false;
    }

    /**
     * Gets scene's resources
     * @param {Array} [out=[]] - Optional receiving array
     * @param {boolean} [excludeChildren]
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [], excludeChildren)
    {
        for (let i = 0; i < this.lensflares.length; i++)
        {
            this.lensflares[i].GetResources(out);
        }

        if (this.backgroundEffect)
        {
            this.backgroundEffect.GetResources(out);
        }

        if (this.envMapRes && !out.includes(this.envMapRes)) out.push(this.envMapRes);
        if (this.envMap1Res && !out.includes(this.envMap1Res)) out.push(this.envMapRes);
        if (this.envMap2Res && !out.includes(this.envMap2Res)) out.push(this.envMapRes);
        if (this.envMap3Res && !out.includes(this.envMap3Res)) out.push(this.envMapRes);

        if (!excludeChildren)
        {
            for (let i = 0; i < this.planets.length; i++)
            {
                this.planets[i].GetResources(out);
            }

            for (let i = 0; i < this.objects.length; i++)
            {
                if ('GetResources' in this.objects[i])
                {
                    this.objects[i].GetResources(out);
                }
            }
        }

        return out;
    }

    /**
     * Per frame update that is called per frame
     * @param {number} dt - delta time
     */
    Update(dt)
    {
        for (let i = 0; i < this.planets.length; ++i)
        {
            if ('Update' in this.planets[i])
            {
                this.planets[i].Update(dt);
            }
        }

        for (let i = 0; i < this.objects.length; ++i)
        {
            if ('Update' in this.objects[i])
            {
                this.objects[i].Update(dt);
            }
        }
    }

    /**
     * Gets batches for rendering
     * @param {number} mode
     * @param {Array.<EveObject>} objectArray
     * @param {Tw2BatchAccumulator} accumulator
     */
    RenderBatches(mode, objectArray, accumulator=this._batches)
    {
        for (let i = 0; i < objectArray.length; ++i)
        {
            if ('GetBatches' in objectArray[i])
            {
                objectArray[i].GetBatches(mode, accumulator);
            }
        }
    }

    /**
     * Updates children's view dependent data and renders them
     */
    Render()
    {
        this.ApplyPerFrameData();

        const
            g = EveSpaceScene.global,
            id = mat4.identity(g.mat4_ID),
            show = this.visible;

        if (this.backgroundRenderingEnabled && this.backgroundEffect)
        {
            d.SetStandardStates(d.RM_FULLSCREEN);
            d.RenderCameraSpaceQuad(this.backgroundEffect);
        }

        if (show.planets && this.planets.length)
        {
            const
                tempProj = mat4.copy(g.mat4_0, d.projection),
                newProj = mat4.copy(g.mat4_1, d.projection),
                zn = 10000,
                zf = 1e11;

            newProj[10] = zf / (zn - zf);
            newProj[14] = (zf * zn) / (zn - zf);
            d.SetProjection(newProj, true);
            this.ApplyPerFrameData();

            for (let i = 0; i < this.planets.length; ++i)
            {
                if (this.planets[i].UpdateViewDependentData)
                {
                    this.planets[i].UpdateViewDependentData(id);
                }
            }

            this._batches.Clear();
            d.gl.depthRange(0.9, 1);
            this.RenderBatches(d.RM_OPAQUE, this.planets);
            this.RenderBatches(d.RM_DECAL, this.planets);
            this.RenderBatches(d.RM_TRANSPARENT, this.planets);
            this.RenderBatches(d.RM_ADDITIVE, this.planets);
            this._batches.Render();
            d.SetProjection(tempProj, true);
            this.ApplyPerFrameData();
            d.gl.depthRange(0, 0.9);
        }

        if (this.lodEnabled)
        {
            g.frustum.Initialize(d.view, d.projection, d.viewportWidth, d.viewInverse, d.viewProjection);
            for (let i = 0; i < this.objects.length; ++i)
            {
                if (this.objects[i].UpdateLod)
                {
                    this.objects[i].UpdateLod(g.frustum);
                }
            }
        }

        if (show.objects)
        {
            for (let i = 0; i < this.objects.length; ++i)
            {
                if (this.objects[i].UpdateViewDependentData)
                {
                    this.objects[i].UpdateViewDependentData(id);
                }
            }
        }

        if (show.lensflares)
        {
            for (let i = 0; i < this.lensflares.length; ++i)
            {
                this.lensflares[i].PrepareRender();
            }
        }

        this._batches.Clear();

        if (this.visible.planets)
        {
            for (let i = 0; i < this.planets.length; ++i)
            {
                this.planets[i].GetZOnlyBatches(d.RM_OPAQUE, this._batches);
            }
        }

        if (this.visible.objects)
        {
            this.RenderBatches(d.RM_OPAQUE, this.objects);
            this.RenderBatches(d.RM_DECAL, this.objects);
            this.RenderBatches(d.RM_TRANSPARENT, this.objects);
            this.RenderBatches(d.RM_ADDITIVE, this.objects);
        }

        if (this.visible.lensflares)
        {
            for (let i = 0; i < this.lensflares.length; ++i)
            {
                this.lensflares[i].GetBatches(d.RM_ADDITIVE, this._batches);
            }
        }

        this._batches.Render();

        if (this.visible.lensflares)
        {
            for (let i = 0; i < this.lensflares.length; ++i)
            {
                this.lensflares[i].UpdateOccluders();
            }
        }

        if (this.renderDebugInfo)
        {
            if (EveSpaceScene.DebugRenderer)
            {
                if (!this._debugHelper)
                {
                    this._debugHelper = new EveSpaceScene.DebugRenderer();
                }

                for (let i = 0; i < this.objects.length; ++i)
                {
                    if (typeof(this.objects[i].RenderDebugInfo) !== 'undefined')
                    {
                        this.objects[i].RenderDebugInfo(this._debugHelper);
                    }
                }

                this._debugHelper.Render();
            }
        }
    }

    /**
     * Applies per frame data
     */
    ApplyPerFrameData()
    {
        const
            g = EveSpaceScene.global,
            envMapTransform = g.mat4_2,
            sunDir = g.vec3_0;

        mat4.fromQuat(envMapTransform, this.envMapRotation);
        mat4.scale(envMapTransform, envMapTransform, this.envMapScaling);
        mat4.transpose(envMapTransform, envMapTransform);
        vec3.negate(sunDir, this.sunDirection);
        vec3.normalize(sunDir, sunDir);

        let distance = this.fogEnd - this.fogStart;
        if (Math.abs(distance) < 1e-5) distance = 1e-5;
        const f = 1.0 / distance;

        const VSData = this._perFrameVS;
        VSData.Set('FogFactors', [this.fogEnd * f, f, this.visible.fog ? this.fogMax : 0, 1]);
        VSData.Set('ViewportAdjustment', [1, 1, 1, 1]);
        VSData.Set('MiscSettings', [d.currentTime, 0, d.viewportWidth, d.viewportHeight]);
        VSData.Set('SunData.DirWorld', sunDir);
        VSData.Set('SunData.DiffuseColor', this.sunDiffuseColor);
        VSData.Set('TargetResolution', d.targetResolution);
        VSData.Set('ViewInverseTransposeMat', d.viewInverse);
        VSData.Set('ViewProjectionMat', d.viewProjectionTranspose);
        VSData.Set('ViewMat', d.viewTranspose);
        VSData.Set('ProjectionMat', d.projectionTranspose);
        VSData.Set('EnvMapRotationMat', envMapTransform);
        d.perFrameVSData = VSData;

        const PSData = this._perFramePS;
        PSData.Set('ViewInverseTransposeMat', d.viewInverse);
        PSData.Set('ViewMat', d.viewTranspose);
        PSData.Set('EnvMapRotationMat', envMapTransform);
        PSData.Set('SunData.DirWorld', sunDir);
        PSData.Set('SunData.DiffuseColor', this.sunDiffuseColor);
        PSData.Set('SceneData.AmbientColor', this.ambientColor);
        PSData.Set('MiscSettings', [d.currentTime, this.fogType, this.fogBlur, 1]);
        PSData.Set('SceneData.FogColor', this.fogColor);
        PSData.Set('FovXY', [d.targetResolution[3], d.targetResolution[2]]);
        PSData.Set('ShadowMapSettings', [1, 1, 0, 0]);
        PSData.Set('TargetResolution', d.targetResolution);
        PSData.Get('SceneData.NebulaIntensity')[0] = this.nebulaIntensity;
        PSData.Get('ViewportSize')[0] = d.viewportWidth;
        PSData.Get('ViewportSize')[1] = d.viewportHeight;
        PSData.Get('ShadowCameraRange')[0] = 1;
        PSData.Get('ProjectionToView')[0] = -d.projection[14];
        PSData.Get('ProjectionToView')[1] = -d.projection[10] - 1;
        d.perFramePSData = PSData;

        const {EveSpaceSceneEnvMap, EnvMap1, EnvMap2, EnvMap3} = store._variables;
        EveSpaceSceneEnvMap.textureRes = this.envMapRes && this.visible.reflection ? this.envMapRes : g.emptyTexture;
        EnvMap1.textureRes = this.envMap1Res && this.visible.diffuse ? this.envMap1Res : g.emptyTexture;
        EnvMap2.textureRes = this.envMap2Res && this.visible.blur ? this.envMap2Res : g.emptyTexture;
        EnvMap3.textureRes = this.envMap3Res ? this.envMap3Res : g.emptyTexture;
    }

    /**
     * Initializes class global and scratch variables
     */
    static init()
    {
        if (!EveSpaceScene.global)
        {
            EveSpaceScene.global = {
                vec3_0: vec3.create(),
                vec4_0: vec4.create(),
                mat4_0: mat4.create(),
                mat4_1: mat4.create(),
                mat4_2: mat4.create(),
                mat4_ID: mat4.create(),
                frustum: new Tw2Frustum(),
                emptyTexture: resMan.GetResource('res:/texture/global/black.dds.0.png')
            };
        }
    }
}

/**
 * Class global and scratch variables
 * @type {{string:*}}
 */
EveSpaceScene.global = null;

/**
 * Per object data declarations
 * @type {{VSData: *[], PSData: *[]}}
 */
EveSpaceScene.perObjectDataDecl = {
    VSData: [
        {name: 'ViewInverseTransposeMat', size: 16},
        {name: 'ViewProjectionMat', size: 16},
        {name: 'ViewMat', size: 16},
        {name: 'ProjectionMat', size: 16},
        {name: 'ShadowViewMat', size: 16},
        {name: 'ShadowViewProjectionMat', size: 16},
        {name: 'EnvMapRotationMat', size: 16},
        {name: 'SunData.DirWorld', size: 4},
        {name: 'SunData.DiffuseColor', size: 4},
        {name: 'FogFactors', size: 4},
        {name: 'TargetResolution', size: 4},
        {name: 'ViewportAdjustment', size: 4},
        {name: 'MiscSettings', size: 4}
    ],
    PSData: [
        {name: 'ViewInverseTransposeMat', size: 16},
        {name: 'ViewMat', size: 16},
        {name: 'EnvMapRotationMat', size: 16},
        {name: 'SunData.DirWorld', size: 4},
        {name: 'SunData.DiffuseColor', size: 4},
        {name: 'SceneData.AmbientColor', size: 3},
        {name: 'SceneData.NebulaIntensity', size: 1},
        {name: 'SceneData.FogColor', size: 4},
        {name: 'ViewportOffset', size: 2},
        {name: 'ViewportSize', size: 2},
        {name: 'TargetResolution', size: 4},
        {name: 'ShadowMapSettings', size: 4},
        {name: 'ShadowCameraRange', size: 4},
        {name: 'ProjectionToView', size: 2},
        {name: 'FovXY', size: 2},
        {name: 'MiscSettings', size: 4},
    ]
};

/**
 * Debug renderer
 * @type {?Function}
 */
EveSpaceScene.DebugRenderer = 'Tw2DebugRenderer' in window ? window['Tw2DebugRenderer'] : null;

