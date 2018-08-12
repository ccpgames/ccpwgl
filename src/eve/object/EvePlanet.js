import {util, device, resMan} from '../../global';
import {Tw2Effect, Tw2RenderTarget, Tw2TextureParameter, Tw2FloatParameter} from '../../core';
import {EveTransform} from './EveTransform';
import {EveObject} from './EveObject';

/**
 * EvePlanet
 *
 * @property {string} name
 * @property {boolean} display
 * @property {EveTransform} highDetail
 * @property {Tw2Effect} effectHeight
 * @property {Tw2RenderTarget} heightMap
 * @property {*} zOnlyModel
 * @property {number} itemID
 * @property {string} heightMapResPath1
 * @property {string} heightMapResPath2
 * @property {boolean} heightDirty
 * @property {Array} lockedResources
 * @property {Array.<Resource>} watchedResources
 * @class
 */
export class EvePlanet extends EveObject
{
    constructor()
    {
        super();
        this.highDetail = new EveTransform();
        this.effectHeight = new Tw2Effect();
        this.heightMap = new Tw2RenderTarget();
        this.zOnlyModel = null;
        this.itemID = 0;
        this.heightMapResPath1 = '';
        this.heightMapResPath2 = '';
        this.heightDirty = false;
        this.lockedResources = [];
        this.watchedResources = [];
    }

    /**
     * Creates the planet
     * @param {number} itemID - the item id is used for randomization
     * @param {string} planetPath - .red file for a planet, or planet template
     * @param {string} [atmospherePath] - optional .red file for a planet's atmosphere
     * @param {string} heightMap1
     * @param {string} heightMap2
     */
    Create(itemID, planetPath, atmospherePath, heightMap1, heightMap2)
    {
        this.itemID = itemID;
        this.heightMapResPath1 = heightMap1;
        this.heightMapResPath2 = heightMap2;
        this.highDetail.children = [];
        this.heightDirty = true;

        resMan.GetObject(planetPath, obj => EvePlanet.MeshLoaded(this, obj));
        resMan.GetObject('res:/dx9/model/worldobject/planet/planetzonly.red', obj => this.zOnlyModel = obj);

        if (atmospherePath)
        {
            resMan.GetObject(atmospherePath, obj => this.highDetail.children.push(obj));
        }
    }

    /**
     * GetPlanetResources
     * Todo: Replace this, using this.GetResources();
     * @param obj
     * @param visited
     * @param result
     */
    GetPlanetResources(obj, visited, result)
    {
        if (visited.includes(obj)) return;
        visited.push(obj);

        if (obj && !util.isUndefined(obj['doNotPurge']))
        {
            result.push(obj);
            return;
        }

        for (let prop in obj)
        {
            if (obj.hasOwnProperty(prop))
            {
                if (util.isObjectLike(obj[prop]))
                {
                    this.GetPlanetResources(obj[prop], visited, result);
                }
            }
        }
    }

    /**
     * Gets planet res objects
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.highDetail) this.highDetail.GetResources(out);
        if (this.effectHeight) this.effectHeight.GetResources(out);
        return out;
    }

    /**
     * Updates view dependent data
     * @param {mat4} parentTransform
     */
    UpdateViewDependentData(parentTransform)
    {
        this.highDetail.UpdateViewDependentData(parentTransform);
        if (this.zOnlyModel)
        {
            this.zOnlyModel.translation = this.highDetail.translation;
            this.zOnlyModel.scaling = this.highDetail.scaling;
            this.zOnlyModel.UpdateViewDependentData(parentTransform);
        }
    }

    /**
     * Per frame update
     * @param {number} dt - delta time
     */
    Update(dt)
    {
        this.highDetail.Update(dt);
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    GetBatches(mode, accumulator)
    {
        if (this.display && this.heightDirty && this.watchedResources.length && this.heightMapResPath1 !== '')
        {
            for (let i = 0; i < this.watchedResources.length; ++i)
            {
                if (this.watchedResources[i] && !this.watchedResources[i].IsGood()) return;
            }

            this.watchedResources = [];

            this.heightMap.Set();
            device.SetStandardStates(device.RM_FULLSCREEN);
            device.gl.clearColor(0.0, 0.0, 0.0, 0.0);
            device.gl.clear(device.gl.COLOR_BUFFER_BIT);
            device.RenderFullScreenQuad(this.effectHeight);
            this.heightMap.Unset();

            this.heightDirty = false;
            for (let i = 0; i < this.lockedResources.length; ++i)
            {
                this.lockedResources[i].doNotPurge--;
            }

            const mainMesh = this.highDetail.children[0].mesh;
            let originalEffect = null;

            if (mainMesh.transparentAreas.length)
            {
                originalEffect = mainMesh.transparentAreas[0].effect;
            }
            else if (mainMesh.opaqueAreas.length)
            {
                originalEffect = mainMesh.opaqueAreas[0].effect;
            }

            if (originalEffect)
            {
                originalEffect.parameters['HeightMap'].textureRes = this.heightMap.texture;
            }
        }

        if (this.display)
        {
            this.highDetail.GetBatches(mode, accumulator);
        }
    }

    /**
     * Gets z buffer only batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    GetZOnlyBatches(mode, accumulator)
    {
        if (this.display && this.zOnlyModel)
        {
            this.zOnlyModel.GetBatches(mode, accumulator);
        }
    }

    /**
     * Internal helper function that fires when a planet's mesh has loaded
     * @property {EvePlanet} planet
     * @property {*} obj
     */
    static MeshLoaded(planet, obj)
    {
        planet.highDetail.children.unshift(obj);
        planet.lockedResources = [];
        planet.GetPlanetResources(planet.highDetail, [], planet.lockedResources);

        let mainMesh = planet.highDetail.children[0].mesh,
            originalEffect = null,
            resPath;

        if (mainMesh.transparentAreas.length)
        {
            originalEffect = mainMesh.transparentAreas[0].effect;
            resPath = originalEffect.effectFilePath;
        }
        else if (mainMesh.opaqueAreas.length)
        {
            originalEffect = mainMesh.opaqueAreas[0].effect;
            resPath = originalEffect.effectFilePath;
        }
        else
        {
            resPath = 'res:/Graphics/Effect/Managed/Space/Planet/EarthlikePlanet.fx';
        }
        resPath = resPath.replace('.fx', 'BlitHeight.fx');

        planet.watchedResources = [];
        for (let param in originalEffect.parameters)
        {
            if (originalEffect.parameters.hasOwnProperty(param))
            {
                planet.effectHeight.parameters[param] = originalEffect.parameters[param];
                if ('textureRes' in originalEffect.parameters[param])
                {
                    planet.watchedResources.push(originalEffect.parameters[param].textureRes);
                }
            }
        }

        for (let i = 0; i < planet.highDetail.children[0].children.length; ++i)
        {
            mainMesh = planet.highDetail.children[0].children[i].mesh;
            if (!mainMesh) continue;

            originalEffect = null;
            if (mainMesh.transparentAreas.length)
            {
                originalEffect = mainMesh.transparentAreas[0].effect;
            }
            else if (mainMesh.opaqueAreas.length)
            {
                originalEffect = mainMesh.opaqueAreas[0].effect;
            }
            else
            {
                continue;
            }

            for (let param in originalEffect.parameters)
            {
                if (originalEffect.parameters.hasOwnProperty(param))
                {
                    planet.effectHeight.parameters[param] = originalEffect.parameters[param];
                    if ('textureRes' in originalEffect.parameters[param])
                    {
                        planet.watchedResources.push(originalEffect.parameters[param].textureRes);
                    }
                }
            }
        }

        const NormalHeight1 = new Tw2TextureParameter('NormalHeight1', planet.heightMapResPath1);
        NormalHeight1.Initialize();
        planet.watchedResources.push(NormalHeight1.textureRes);
        planet.lockedResources.push(NormalHeight1.textureRes);
        planet.effectHeight.parameters.NormalHeight1 = NormalHeight1;

        const NormalHeight2 = new Tw2TextureParameter('NormalHeight2', planet.heightMapResPath2);
        NormalHeight2.Initialize();
        planet.watchedResources.push(NormalHeight2.textureRes);
        planet.lockedResources.push(NormalHeight2.textureRes);
        planet.effectHeight.parameters.NormalHeight2 = NormalHeight2;

        planet.effectHeight.parameters.Random = new Tw2FloatParameter('Random', planet.itemID % 100);
        planet.effectHeight.parameters.TargetTextureHeight = new Tw2FloatParameter('TargetTextureHeight', 1024);

        planet.effectHeight.effectFilePath = resPath;
        planet.effectHeight.Initialize();
        planet.heightDirty = true;
        planet.heightMap.Create(2048, 1024, false);
        planet.watchedResources.push(planet.effectHeight.effectRes);

        for (let i = 0; i < planet.lockedResources.length; ++i)
        {
            planet.lockedResources[i].doNotPurge++;
            if (planet.lockedResources[i].IsPurged())
            {
                planet.lockedResources[i].Reload();
            }
        }
    }
}
