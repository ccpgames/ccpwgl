function EveSOF() {
    var data = null;
    var spriteEffectSkinned = null;
    var spriteEffect = null;

    function _get(obj, property, defaultValue) {
        if (property in obj) {
            return obj[property];
        }
        return defaultValue;
    }

    function GetFactionMeshAreaParameters(areaName, paramName, faction) {
        var areas = _get(faction, 'areas', {});
        if (areaName in areas) {
            var area = _get(areas, areaName, {});
            if (paramName in _get(area, 'parameters', {})) {
                return _get(area.parameters[paramName], 'value', [0, 0, 0, 0]);
            }
        }
    }

    /**
     * @return {string}
     */
    function GetShaderPrefix(isAnimated) {
        return isAnimated ? _get(data['generic'], 'shaderPrefixAnimated', '') : _get(data['generic'], 'shaderPrefix', '');
    }

    function ModifyTextureResPath(path, name, area, faction, commands) {
        var pathInsert = null;
        if (_get(faction, 'resPathInsert', '').length)
        {
            pathInsert = faction.resPathInsert;
        }
        if ('respathinsert' in commands && commands.respathinsert.length == 1)
        {
            if (commands.respathinsert[0] == 'none')
            {
                return path;
            }
            else
            {
                pathInsert = commands.respathinsert[0];
            }
        }
        if (name == 'MaterialMap' || name == 'PaintMaskMap' || name == 'PmdgMap') {
            var index = path.lastIndexOf('/');
            var pathCopy = path;
            if (index >= 0) {
                pathCopy = path.substr(0, index + 1) + pathInsert + '/' + path.substr(index + 1);
            }
            index = pathCopy.lastIndexOf('_');
            if (index >= 0) {
                pathCopy = pathCopy.substr(0, index) + '_' + pathInsert + pathCopy.substr(index);
                var textureOverrides = _get(area, 'textureOverrides', {});
                if ((name in  textureOverrides) && (faction.name in textureOverrides[name])) {
                    return pathCopy;
                }
            }
        }
        return path;
    }

    /**
     * @return {string}
     */
    function ModifyShaderPath(shader, isSkinned) {
        var prefix = GetShaderPrefix(isSkinned);
        shader = '/' + shader;
        var index = shader.lastIndexOf('/');
        return shader.substr(0, index + 1) + prefix + shader.substr(index + 1);
    }

    function GetOverridenParameter(name, area, commands)
    {
        if ('mesh' in commands)
        {
            var prefixes = data.generic.materialPrefixes;
            var materialIndex = null;
            for (var m = 0; m < prefixes.length; ++m)
            {
                if (name.substr(0, prefixes[m].length) == prefixes[m])
                {
                    materialIndex = m;
                    break;
                }
            }
            if (materialIndex !== null && materialIndex < commands.mesh.length && (_get(area, 'blockedMaterials', 0) & (1 << materialIndex)) == 0)
            {
                var materialData = _get(data.material, commands.mesh[materialIndex], null);
                if (materialData)
                {
                    var shortName = name.substr(prefixes[m].length);
                    return _get(materialData.parameters, shortName, undefined);
                }
            }
        }
    }

    function FillMeshAreas(areas, areasName, hull, faction, race, commands) {
        var hullAreas = _get(hull, areasName, []);
        for (var i = 0; i < hullAreas.length; ++i) {
            var area = hullAreas[i];
            var effect = new Tw2Effect();
            effect.effectFilePath = data['generic']['areaShaderLocation'] + ModifyShaderPath(area.shader, hull['isSkinned']);
            var names = _get(_get(data['generic']['areaShaders'], area.shader, {}), 'parameters', []);
            for (var j = 0; j < names.length; ++j) {
                var name = names[j];
                var param = GetOverridenParameter(name, area, commands);
                param = param || _get(_get(_get(data.generic.hullAreas, area.name, {}), 'parameters', {}), name);
                param = param || _get(_get(_get(race.hullAreas, area.name, {}), 'parameters', {}), name);
                param = param || _get(_get(_get(faction.areas, area.name, {}), 'parameters', {}), name);
                param = param || _get(_get(area, 'parameters', {}), name);
                if (param) {
                    effect.parameters[name] = new Tw2Vector4Parameter(name, param);
                }
            }

            var hullTextures = _get(area, 'textures', []);
            for (j in hullTextures) {
                var path = hullTextures[j];
                path = ModifyTextureResPath(path, j, area, faction, commands);
                effect.parameters[j] = new Tw2TextureParameter(j, path);
            }

            effect.Initialize();

            var newArea = new Tw2MeshArea();
            newArea.name = area.name;
            newArea.effect = effect;
            newArea.index = _get(area, 'index', 0);
            newArea.count = _get(area, 'count', 1);
            areas.push(newArea);
        }

    }
    function SetupMesh(ship, hull, faction, race, commands) {
        var mesh = new Tw2Mesh();
        mesh.geometryResPath = hull['geometryResFilePath'];
        ship.boundingSphereCenter[0] = hull.boundingSphere[0];
        ship.boundingSphereCenter[1] = hull.boundingSphere[1];
        ship.boundingSphereCenter[2] = hull.boundingSphere[2];
        ship.boundingSphereRadius = hull.boundingSphere[3];
        FillMeshAreas(_get(mesh, 'opaqueAreas', []), 'opaqueAreas', hull, faction, race, commands);
        FillMeshAreas(_get(mesh, 'transparentAreas', []), 'transparentAreas', hull, faction, race, commands);
        FillMeshAreas(_get(mesh, 'additiveAreas', []), 'additiveAreas', hull, faction, race, commands);
        FillMeshAreas(_get(mesh, 'decalAreas', []), 'decalAreas', hull, faction, race, commands);
        FillMeshAreas(_get(mesh, 'depthAreas', []), 'depthAreas', hull, faction, race, commands);
        mesh.Initialize();
        ship.mesh = mesh;
        if ('shapeEllipsoidCenter' in hull) {
            ship.shapeEllipsoidCenter = hull.shapeEllipsoidCenter;
        }
        if ('shapeEllipsoidRadius' in hull) {
            ship.shapeEllipsoidRadius = hull.shapeEllipsoidRadius;
        }
    }

    function SetupDecals(ship, hull, faction) {
        var hullDecals = _get(hull, 'hullDecals', []);
        for (var i = 0; i < hullDecals.length; ++i) {
            var hullDecal = hullDecals[i];
            var factionDecal = null;
            var factionIndex = 'group' + _get(hullDecal, 'groupIndex', -1);
            if (faction.decals && (factionIndex in faction.decals)) {
                factionDecal = faction.decals[factionIndex];
            }
            if (factionDecal && !factionDecal['isVisible']) {
                continue;
            }
            var effect = new Tw2Effect();
            if (factionDecal && factionDecal.shader && factionDecal.shader.length) {
                effect.effectFilePath = data['generic']['decalShaderLocation'] + '/' + GetShaderPrefix(false) + factionDecal.shader;
            }
            else if (hullDecal.shader && hullDecal.shader.length) {
                effect.effectFilePath = data['generic']['decalShaderLocation'] + '/' + GetShaderPrefix(false) + hullDecal.shader;
            }
            else {
                continue;
            }
            var hullParameters = _get(hullDecal, 'parameters', {});
            for (var j in hullParameters) {
                effect.parameters[j] = new Tw2Vector4Parameter(j, hullParameters[j]);
            }
            var hullTextures = _get(hullDecal, 'textures', {});
            for (j in hullTextures) {
                effect.parameters[j] = new Tw2TextureParameter(j, hullTextures[j]);
            }
            if (factionDecal) {
                var factionParameters = _get(factionDecal, 'parameters', {});
                for (j in factionParameters) {
                    effect.parameters[j] = new Tw2Vector4Parameter(j, factionParameters[j]);
                }
                var factionTextures = _get(factionDecal, 'textures', {});
                for (j in factionTextures) {
                    effect.parameters[j] = new Tw2TextureParameter(j, factionTextures[j]);
                }
            }
            effect.Initialize();

            var decal = new EveSpaceObjectDecal();
            vec3.set(_get(hullDecal, 'position', [0, 0, 0]), decal.position);
            quat4.set(_get(hullDecal, 'rotation', [0, 0, 0, 1]), decal.rotation);
            vec3.set(_get(hullDecal, 'scaling', [1, 1, 1]), decal.scaling);
            decal.parentBoneIndex = _get(hullDecal, 'boneIndex', -1);
            decal.indexBuffer = new Uint16Array(hullDecal.indexBuffer);
            decal.decalEffect = effect;
            decal.name = _get(hullDecals[i], 'name', '');
            if ('groupIndex' in hullDecals[i]) {
                    decal.groupIndex = hullDecals[i].groupIndex; 
            }
            decal.Initialize();
            ship.decals.push(decal);
        }
    }

    function SetupSpriteSets(ship, hull, faction) {
        var hullSets = _get(hull, 'spriteSets', []);
        var factionSets = _get(faction, 'spriteSets', {});
        for (var i = 0; i < hullSets.length; ++i) {
            var spriteSet = new EveSpriteSet();
            spriteSet.name = _get(hullSets[i], 'name', '');
            spriteSet.effect = hullSets[i]['skinned'] ? spriteEffectSkinned : spriteEffect;
            var hullData = _get(hullSets[i], 'items', []);
            for (var j = 0; j < hullData.length; ++j) {
                if (!('group' + _get(hullData[j], 'groupIndex', -1) in factionSets)) {
                    continue;
                }
                var factionSet = factionSets['group' + _get(hullData[j], 'groupIndex', -1)];
                var item = new EveSpriteSetItem();
                if ('color' in factionSet) {
                    item.color = factionSet.color;
                }
                item.blinkPhase = _get(hullData[j], 'blinkPhase', 0);
                item.blinkRate = _get(hullData[j], 'blinkRate', 0.1);
                item.boneIndex = _get(hullData[j], 'boneIndex', 0);
                item.falloff = _get(hullData[j], 'falloff', 0);
                item.maxScale = _get(hullData[j], 'maxScale', 10);
                item.minScale = _get(hullData[j], 'minScale', 1);
                item.name = _get(hullData[j], 'name', '');
                if ('groupIndex' in hullData[j]) {
                    item.groupIndex = hullData[j].groupIndex; 
                }
                item.groupName = factionSet.name;
                if ('position' in hullData[j]) {
                    item.position = hullData[j].position;
                }
                spriteSet.sprites.push(item);
            }
            spriteSet.Initialize();
            ship.spriteSets.push(spriteSet);
        }
    }

    function _scale(a, b, c) {
        c[0] = a[0] * b;
        c[1] = a[1] * b;
        c[2] = a[2] * b;
        c[3] = a[3] * b;
    }

    function SetupSpotlightSets(ship, hull, faction) {
        var hullSets = _get(hull, 'spotlightSets', []);
        var factionSets = _get(faction, 'spotlightSets', {});
        for (var i = 0; i < hullSets.length; ++i) {
            var spotlightSet = new EveSpotlightSet();
            spotlightSet.name = _get(hullSets[i], 'name', '');
            spotlightSet.coneEffect = new Tw2Effect();
            spotlightSet.glowEffect = new Tw2Effect();
            if (hullSets[i]['skinned']) {
                spotlightSet.coneEffect.effectFilePath = 'res:/graphics/effect/managed/space/spaceobject/fx/skinned_spotlightcone.fx';
                spotlightSet.glowEffect.effectFilePath = 'res:/graphics/effect/managed/space/spaceobject/fx/skinned_spotlightglow.fx';
            }
            else {
                spotlightSet.coneEffect.effectFilePath = 'res:/graphics/effect/managed/space/spaceobject/fx/spotlightcone.fx';
                spotlightSet.glowEffect.effectFilePath = 'res:/graphics/effect/managed/space/spaceobject/fx/spotlightglow.fx';
            }
            spotlightSet.coneEffect.parameters['TextureMap'] = new Tw2TextureParameter('TextureMap', hullSets[i]['coneTextureResPath']);
            spotlightSet.glowEffect.parameters['TextureMap'] = new Tw2TextureParameter('TextureMap', hullSets[i]['glowTextureResPath']);
            spotlightSet.coneEffect.parameters['zOffset'] = new Tw2FloatParameter('zOffset', _get(hullSets[i], 'zOffset', 0));
            spotlightSet.coneEffect.Initialize();
            spotlightSet.glowEffect.Initialize();

            var hullData = _get(hullSets[i], 'items', []);
            for (var j = 0; j < hullData.length; ++j) {
                var item = new EveSpotlightSetItem();
                item.name = _get(hullData[j], 'name', '');
                item.groupIndex = _get(hullData[j], 'groupIndex', -1);
                item.boneIndex = _get(hullData[j], 'boneIndex', 0);
                item.boosterGainInfluence = _get(hullData[j], 'boosterGainInfluence', 0);
                var factionSet = factionSets['group' + item.groupIndex];
                if (factionSet) {
                    _scale(_get(factionSet, 'coneColor', [0, 0, 0, 0]), _get(hullData[j], 'coneIntensity', 0), item.coneColor);
                    _scale(_get(factionSet, 'spriteColor', [0, 0, 0, 0]), _get(hullData[j], 'spriteIntensity', 0), item.spriteColor);
                    _scale(_get(factionSet, 'flareColor', [0, 0, 0, 0]), _get(hullData[j], 'flareIntensity', 0), item.flareColor);
                }
                item.spriteScale = _get(hullData[j], 'spriteScale', [1, 1, 1]);
                if ('transform' in hullData[j]) {
                    item.transform = hullData[j].transform;
                }
                else {
                    mat4.identity(item.transform);
                }
                spotlightSet.spotlightItems.push(item);
            }
            spotlightSet.Initialize();
            ship.spotlightSets.push(spotlightSet);
        }
    }

    function _assignIfExists(dest, src, attr) {
        if (attr in src) {
            dest[attr] = src[attr];
        }
    }

    function SetupPlaneSets(ship, hull, faction) {
        var hullSets = _get(hull, 'planeSets', []);
        var factionSets = _get(faction, 'planeSets', {});
        for (var i = 0; i < hullSets.length; ++i) {
            var planeSet = new EvePlaneSet();
            planeSet.name = _get(hullSets[i], 'name', '');
            planeSet.effect = new Tw2Effect();
            if (hullSets[i]['skinned']) {
                planeSet.effect.effectFilePath = 'res:/graphics/effect/managed/space/spaceobject/fx/skinned_planeglow.fx';
            }
            else {
                planeSet.effect.effectFilePath = 'res:/graphics/effect/managed/space/spaceobject/fx/planeglow.fx';
            }
            planeSet.effect.parameters['Layer1Map'] = new Tw2TextureParameter('Layer1Map', hullSets[i]['layer1MapResPath']);
            planeSet.effect.parameters['Layer2Map'] = new Tw2TextureParameter('Layer2Map', hullSets[i]['layer2MapResPath']);
            planeSet.effect.parameters['MaskMap'] = new Tw2TextureParameter('MaskMap', hullSets[i]['maskMapResPath']);
            planeSet.effect.parameters['PlaneData'] = new Tw2Vector4Parameter('PlaneData', _get(hullSets[i], 'planeData', [1, 0, 0, 0]));
            planeSet.effect.Initialize();

            var hullData = _get(hullSets[i], 'items', []);
            for (var j = 0; j < hullData.length; ++j) {
                var item = new EvePlaneSetItem();
                _assignIfExists(item, hullData[j], 'groupIndex');
                _assignIfExists(item, hullData[j], 'name');
                _assignIfExists(item, hullData[j], 'position');
                _assignIfExists(item, hullData[j], 'rotation');
                _assignIfExists(item, hullData[j], 'scaling');
                _assignIfExists(item, hullData[j], 'color');
                quat4.set(_get(hullData[j], 'layer1Transform', [0, 0, 0, 0]), item.layer1Transform);
                _assignIfExists(item, hullData[j], 'layer1Scroll');
                quat4.set(_get(hullData[j], 'layer2Transform', [0, 0, 0, 0]), item.layer2Transform);
                _assignIfExists(item, hullData[j], 'layer2Scroll');
                item.boneIndex = _get(hullData[j], 'boneIndex', -1);

                var factionSet = factionSets['group' + _get(hullData[j], 'groupIndex', -1)];
                if (factionSet) {
                    quat4.set(_get(factionSet, 'color', [0, 0, 0, 0]), item.color);
                }
                planeSet.planes.push(item);
            }
            planeSet.Initialize();
            ship.planeSets.push(planeSet);
        }
    }

    function SetupBoosters(ship, hull, race) {
        if (!('booster' in hull)) {
            return;
        }
        var booster = new EveBoosterSet();
        var hullBooster = hull['booster'];
        var raceBooster = _get(race, 'booster', {});
        _assignIfExists(booster, raceBooster, 'glowScale');
        _assignIfExists(booster, raceBooster, 'glowColor');
        _assignIfExists(booster, raceBooster, 'warpGlowColor');
        _assignIfExists(booster, raceBooster, 'symHaloScale');
        _assignIfExists(booster, raceBooster, 'haloScaleX');
        _assignIfExists(booster, raceBooster, 'haloScaleY');
        _assignIfExists(booster, raceBooster, 'haloColor');
        _assignIfExists(booster, raceBooster, 'warpHaloColor');

        booster.effect = new Tw2Effect();
        booster.effect.effectFilePath = 'res:/Graphics/Effect/Managed/Space/Booster/BoosterVolumetric.fx';
        booster.effect.parameters['NoiseFunction0'] = new Tw2FloatParameter('NoiseFunction0', _get(raceBooster.shape0, 'noiseFunction', 0));
        booster.effect.parameters['NoiseSpeed0'] = new Tw2FloatParameter('NoiseSpeed0', _get(raceBooster.shape0, 'noiseSpeed', 0));
        booster.effect.parameters['NoiseAmplitudeStart0'] = new Tw2Vector4Parameter('NoiseAmplitudeStart0', _get(raceBooster.shape0, 'noiseAmplitureStart', [0, 0, 0, 0]));
        booster.effect.parameters['NoiseAmplitudeEnd0'] = new Tw2Vector4Parameter('NoiseAmplitudeEnd0', _get(raceBooster.shape0, 'noiseAmplitureEnd', [0, 0, 0, 0]));
        booster.effect.parameters['NoiseFrequency0'] = new Tw2Vector4Parameter('NoiseFrequency0', _get(raceBooster.shape0, 'noiseFrequency', [0, 0, 0, 0]));
        booster.effect.parameters['Color0'] = new Tw2Vector4Parameter('Color0', _get(raceBooster.shape0, 'color', [0, 0, 0, 0]));

        booster.effect.parameters['NoiseFunction1'] = new Tw2FloatParameter('NoiseFunction1', _get(raceBooster.shape1, 'noiseFunction', 0));
        booster.effect.parameters['NoiseSpeed1'] = new Tw2FloatParameter('NoiseSpeed1', _get(raceBooster.shape1, 'noiseSpeed', 0));
        booster.effect.parameters['NoiseAmplitudeStart1'] = new Tw2Vector4Parameter('NoiseAmplitudeStart1', _get(raceBooster.shape1, 'noiseAmplitureStart', [0, 0, 0, 0]));
        booster.effect.parameters['NoiseAmplitudeEnd1'] = new Tw2Vector4Parameter('NoiseAmplitudeEnd1', _get(raceBooster.shape1, 'noiseAmplitureEnd', [0, 0, 0, 0]));
        booster.effect.parameters['NoiseFrequency1'] = new Tw2Vector4Parameter('NoiseFrequency1', _get(raceBooster.shape1, 'noiseFrequency', [0, 0, 0, 0]));
        booster.effect.parameters['Color1'] = new Tw2Vector4Parameter('Color1', _get(raceBooster.shape1, 'color', [0, 0, 0, 0]));

        booster.effect.parameters['WarpNoiseFunction0'] = new Tw2FloatParameter('WarpNoiseFunction0', _get(raceBooster.warpShape0, 'noiseFunction', 0));
        booster.effect.parameters['WarpNoiseSpeed0'] = new Tw2FloatParameter('WarpNoiseSpeed0', _get(raceBooster.warpShape0, 'noiseSpeed', 0));
        booster.effect.parameters['WarpNoiseAmplitudeStart0'] = new Tw2Vector4Parameter('WarpNoiseAmplitudeStart0', _get(raceBooster.warpShape0, 'noiseAmplitureStart', [0, 0, 0, 0]));
        booster.effect.parameters['WarpNoiseAmplitudeEnd0'] = new Tw2Vector4Parameter('WarpNoiseAmplitudeEnd0', _get(raceBooster.warpShape0, 'noiseAmplitureEnd', [0, 0, 0, 0]));
        booster.effect.parameters['WarpNoiseFrequency0'] = new Tw2Vector4Parameter('WarpNoiseFrequency0', _get(raceBooster.warpShape0, 'noiseFrequency', [0, 0, 0, 0]));
        booster.effect.parameters['WarpColor0'] = new Tw2Vector4Parameter('WarpColor0', _get(raceBooster.warpShape0, 'color', [0, 0, 0, 0]));

        booster.effect.parameters['WarpNoiseFunction1'] = new Tw2FloatParameter('WarpNoiseFunction1', _get(raceBooster.warpShape1, 'noiseFunction', 0));
        booster.effect.parameters['WarpNoiseSpeed1'] = new Tw2FloatParameter('WarpNoiseSpeed1', _get(raceBooster.warpShape1, 'noiseSpeed', 0));
        booster.effect.parameters['WarpNoiseAmplitudeStart1'] = new Tw2Vector4Parameter('WarpNoiseAmplitudeStart1', _get(raceBooster.warpShape1, 'noiseAmplitureStart', [0, 0, 0, 0]));
        booster.effect.parameters['WarpNoiseAmplitudeEnd1'] = new Tw2Vector4Parameter('WarpNoiseAmplitudeEnd1', _get(raceBooster.warpShape1, 'noiseAmplitureEnd', [0, 0, 0, 0]));
        booster.effect.parameters['WarpNoiseFrequency1'] = new Tw2Vector4Parameter('WarpNoiseFrequency1', _get(raceBooster.warpShape1, 'noiseFrequency', [0, 0, 0, 0]));
        booster.effect.parameters['WarpColor1'] = new Tw2Vector4Parameter('WarpColor1', _get(raceBooster.warpShape1, 'color', [0, 0, 0, 0]));

        booster.effect.parameters['ShapeAtlasSize'] = new Tw2Vector4Parameter('ShapeAtlasSize', [_get(raceBooster, 'shapeAtlasHeight', 0), _get(raceBooster, 'shapeAtlasCount', 0), 0, 0]);
        booster.effect.parameters['BoosterScale'] = new Tw2Vector4Parameter('BoosterScale', _get(raceBooster, 'scale', [1, 1, 1, 1]));

        booster.effect.parameters['ShapeMap'] = new Tw2TextureParameter('ShapeMap', raceBooster.shapeAtlasResPath);
        booster.effect.parameters['GradientMap0'] = new Tw2TextureParameter('GradientMap0', raceBooster.gradient0ResPath);
        booster.effect.parameters['GradientMap1'] = new Tw2TextureParameter('GradientMap1', raceBooster.gradient1ResPath);
        booster.effect.parameters['NoiseMap'] = new Tw2TextureParameter('ShapeMap', "res:/Texture/Global/noise32cube_volume.dds.0.png");

        booster.effect.Initialize();

        booster.glows = new EveSpriteSet();
        booster.glows.effect = new Tw2Effect();
        booster.glows.effect.effectFilePath = 'res:/Graphics/Effect/Managed/Space/Booster/BoosterGlow.fx';
        booster.glows.effect.parameters['DiffuseMap'] = new Tw2TextureParameter('DiffuseMap', 'res:/Texture/Particle/whitesharp.dds.0.png');
        booster.glows.effect.Initialize();

        var items = _get(hullBooster, 'items', []);
        for (var i = 0; i < items.length; ++i) {
            var locator = new EveLocator();
            locator.name = 'locator_booster_' + (i + 1);
            if ('transform' in items[i]) {
                locator.transform = items[i].transform;
            }
            else {
                mat4.identity(locator.transform);
            }
            locator.atlasIndex0 = _get(items[i], 'atlasIndex0', 0);
            locator.atlasIndex1 = _get(items[i], 'atlasIndex1', 0);
            ship.locators.push(locator);
        }
        booster.Initialize();
        ship.boosters = booster;
    }

    function SetupLocators(ship, hull) {
        var hullLocators = _get(hull, 'locatorTurrets', []);
        for (var i = 0; i < hullLocators.length; ++i) {
            var locator = new EveLocator();
            locator.name = hullLocators[i].name;
            if ('transform' in hullLocators[i]) {
                locator.transform = hullLocators[i].transform;
            }
            else {
                mat4.identity(locator.transform);
            }
            ship.locators.push(locator);
        }
    }

    function BindParticleEmitters(obj, curveSet, curve) {
        for (var i = 0; i < obj.particleEmitters.length; ++i) {
            if ('rate' in obj.particleEmitters[i]) {
                var binding = new Tw2ValueBinding();
                binding.sourceObject = curve;
                binding.sourceAttribute = 'currentValue';
                binding.destinationObject = obj.particleEmitters[i];
                binding.destinationAttribute = 'rate';
                binding.Initialize();
                curveSet.bindings.push(binding);
            }
        }
        for (i = 0; i < obj.children.length; ++i) {
            BindParticleEmitters(obj.children[i], curveSet, curve);
        }
    }

    function SetupChildren(ship, hull, curveSet, curves) {
        function onChildLoaded(child) {
            return function (obj) {
                ship.children.push(obj);
                _assignIfExists(obj, child, 'translation');
                _assignIfExists(obj, child, 'rotation');
                _assignIfExists(obj, child, 'scaling');
                var id = _get(child, 'id', -1);
                if (id != -1 && curves[id]) {
                    BindParticleEmitters(obj, curveSet, curves[id]);
                }
            };
        }
        var children = _get(hull, 'children', []);
        for (var i = 0; i < children.length; ++i) {
            resMan.GetObject(children[i]['redFilePath'], onChildLoaded(children[i]));
        }
    }

    function SetupAnimations(ship, hull) {
        var id_curves = [];
        var curveSet = null;
        var animations = _get(hull, 'animations', []);
        for (var i = 0; i < animations.length; ++i) {
            if (_get(animations[i], 'id', -1) != -1 && (_get(animations[i], 'startRate', -1) != -1)) {
                if (!curveSet) {
                    curveSet = new Tw2CurveSet();
                }
                var curve = new Tw2ScalarCurve2();
                curve.keys.push(new Tw2ScalarKey2());
                curve.keys.push(new Tw2ScalarKey2());
                curve.keys[0].value = _get(animations[i], 'startRate', -1);
                curve.keys[1].time = 1;
                curve.keys[1].value = _get(animations[i], 'endRate', -1);
                curve.Initialize();
                curveSet.curves.push(curve);
                ship.curveSets.push(curveSet);
                id_curves[_get(animations[i], 'id', -1)] = curve;
            }
        }
        if (curveSet) {
            curveSet.Initialize();
        }
        return [curveSet, id_curves];
    }

    var dataLoading = false;
    var pendingLoads = [];

    function Build(dna) {
        var parts = dna.split(':');
        var commands = {};
        for (var i = 3; i < parts.length; ++i)
        {
            var subparts = parts[i].split('?');
            commands[subparts[0]] = subparts[1].split(';');
        }
        var hull = data['hull'][parts[0]];
        var faction = data['faction'][parts[1]];
        var race = data['race'][parts[2]];
        var ship = new (_get(hull, 'buildClass', 0) == 2 ? EveSpaceObject : EveShip)();
        SetupMesh(ship, hull, faction, race, commands);
        SetupDecals(ship, hull, faction);
        SetupSpriteSets(ship, hull, faction);
        SetupSpotlightSets(ship, hull, faction);
        SetupPlaneSets(ship, hull, faction);
        SetupBoosters(ship, hull, race);
        SetupLocators(ship, hull);
        var curves = SetupAnimations(ship, hull);
        SetupChildren(ship, hull, curves[0], curves[1]);

        ship.Initialize();
        return ship;
    }

    this.LoadData = function (callback) {
        if (data == null) {
            if (callback) {
                pendingLoads.push(callback);
            }
            if (!dataLoading) {
                spriteEffect = new Tw2Effect();
                spriteEffect.effectFilePath = 'res:/graphics/effect/managed/space/spaceobject/fx/blinkinglights.fx';
                spriteEffect.parameters['MainIntensity'] = new Tw2FloatParameter('MainIntensity', 1);
                spriteEffect.parameters['GradientMap'] = new Tw2TextureParameter('GradientMap', 'res:/texture/particle/whitesharp_gradient.dds.0.png');
                spriteEffect.Initialize();

                spriteEffectSkinned = new Tw2Effect();
                spriteEffectSkinned.effectFilePath = 'res:/graphics/effect/managed/space/spaceobject/fx/skinned_blinkinglights.fx';
                spriteEffectSkinned.parameters['MainIntensity'] = new Tw2FloatParameter('MainIntensity', 1);
                spriteEffectSkinned.parameters['GradientMap'] = new Tw2TextureParameter('GradientMap', 'res:/texture/particle/whitesharp_gradient.dds.0.png');
                spriteEffectSkinned.Initialize();

                resMan.GetObject('res:/dx9/model/spaceobjectfactory/data.red', function (obj) {
                    data = obj;
                    for (var i = 0; i < pendingLoads.length; ++i) {
                        pendingLoads[i]();
                    }
                    pendingLoads = [];
                });
                dataLoading = true;
            }
        }
        else {
            if (callback) {
                callback();
            }
        }
    };

    this.BuildFromDNA = function (dna, callback) {
        if (data == null) {
            this.LoadData(function () {
                var result = Build(dna);
                if (callback) {
                    callback(result);
                }
            });
        }
        else {
            var result = Build(dna);
            if (callback) {
                callback(result);
            }
        }
    };

    function GetTurretMaterialParameter(name, parentFaction, areaData) {
        var materialIdx = -1;
        for (var i = 0; i < data['generic']['materialPrefixes'].length; ++i) {
            if (name.substr(0, data['generic']['materialPrefixes'][i].length) == data['generic']['materialPrefixes'][i]) {
                materialIdx = i;
                name = name.substr(data['generic']['materialPrefixes'][i].length);
            }
        }
        if (materialIdx != -1) {
            var turretMaterialIndex = _get(parentFaction, 'materialUsageMtl' + (materialIdx + 1), materialIdx);
            if (turretMaterialIndex >= 0 && turretMaterialIndex < data['generic']['materialPrefixes'].length) {
                name = data['generic']['materialPrefixes'][turretMaterialIndex] + name;
                if (name in areaData.parameters) {
                    return areaData.parameters[name];
                }
            }
        }
    }

    var zeroColor = [0, 0, 0, 0];

    function CombineTurretMaterial(name, parentValue, turretValue, overrideMethod) {
        switch (overrideMethod) {
            case 'overridable':
                return parentValue ? parentValue : turretValue ? turretValue : zeroColor;
            case 'half_overridable':
                if (name.indexOf('GlowColor') >= 0) {
                    return turretValue ? turretValue : zeroColor;
                }
                return parentValue ? parentValue : turretValue ? turretValue : zeroColor;
            case 'not_overridable':
            case 'half_overridable_2':
                return turretValue ? turretValue : zeroColor;
        }
        return zeroColor;
    }

    function SetupTurretMaterial(turretSet, parentFactionName, turretFactionName) {
        var parentFaction = data['faction'][parentFactionName];
        var turretFaction = data['faction'][turretFactionName];
        var parentArea = null;
        if (parentFaction && parentFaction.areas && ('hull' in parentFaction.areas)) {
            parentArea = parentFaction.areas.hull;
        }
        var turretArea = null;
        if (turretFaction && turretFaction.areas && ('hull' in turretFaction.areas)) {
            turretArea = turretFaction.areas.hull;
        }
        if (!parentArea && !turretArea) {
            return;
        }
        if (turretSet.turretEffect) {
            var params = turretSet.turretEffect.parameters;
            for (var i in params) {
                if (params[i].constructor.prototype != Tw2Vector4Parameter.prototype) {
                    continue;
                }
                var parentValue = null;
                var turretValue = null;
                if (parentArea) {
                    parentValue = GetTurretMaterialParameter(i, parentFaction, parentArea);
                }
                if (turretArea) {
                    turretValue = GetTurretMaterialParameter(i, parentFaction, parentArea);
                }
                quat4.set(CombineTurretMaterial(i, parentValue, turretValue, turretSet.turretEffect.name), params[i].value);
            }
            turretSet.turretEffect.BindParameters();
        }
    }

    this.SetupTurretMaterial = function (turretSet, parentFactionName, turretFactionName, callback) {
        if (data == null) {
            this.LoadData(function () {
                SetupTurretMaterial(turretSet, parentFactionName, turretFactionName);
                if (callback) {
                    callback();
                }
            });
        }
        else {
            SetupTurretMaterial(turretSet, parentFactionName, turretFactionName);
            if (callback) {
                callback();
            }
        }
    };

    function getDataKeys(name) {
        if (name !== 'all') {
            var names = {};
            for (var i in data[name]) {
                names[i] = data[name][i].description || '';
            }
            return names;
        } else {
            return data
        }
    }

    this.GetHullNames = function (callback) {
        this.LoadData(function () {
            callback(getDataKeys('hull'));
       });
    };

    this.GetFactionNames = function (callback) {
        this.LoadData(function () {
            callback(getDataKeys('faction'));
       });
    };

    this.GetRaceNames = function (callback) {
        this.LoadData(function () {
            callback(getDataKeys('race'));
       });
    };
    
    this.GetSofData = function (callback) {
        this.LoadData(function () {
            callback(getDataKeys('all'));
        })
    };

    
}
