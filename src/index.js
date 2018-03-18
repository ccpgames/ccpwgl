import * as math from './math';
import * as core from './core';
import * as curve from './curve';
import * as eve from './eve';
import * as particle from './particle';

export * from './core';
export * from './curve';
export * from './eve';
export * from './particle';
export {math};

const {vec4, mat4} = math;

/**
 * Register globals
 */
core.store.Register({

    paths: {
        'res': 'https://developers.eveonline.com/ccpwgl/assetpath/1097993/',
        'cdn': 'https://developers.eveonline.com/res/'
    },

    extensions: {
        'sm_hi': core.Tw2EffectRes,
        'sm_lo': core.Tw2EffectRes,
        'wbg': core.Tw2GeometryRes,
        'png': core.Tw2TextureRes,
        'cube': core.Tw2TextureRes,
        'mp4' : core.Tw2VideoRes,
        'ogg' : core.Tw2VideoRes,
        'webm' : core.Tw2VideoRes
    },

    constructors: [
        core,
        curve,
        eve,
        particle
    ],

    types: {
        'float': core.Tw2FloatParameter,
        'number': core.Tw2FloatParameter,
        'texture': core.Tw2TextureParameter,
        'vector2': core.Tw2Vector2Parameter,
        'vector3': core.Tw2Vector3Parameter,
        'vector4': core.Tw2Vector4Parameter,
        'matrix4': core.Tw2MatrixParameter
    },

    variables: {
        'WorldMat': mat4.create(),
        'ViewMat': mat4.create(),
        'ProjectionMat': mat4.create(),
        'ViewProjectionMat': mat4.create(),
        'ViewportSize': vec4.create(),
        'Time': vec4.create(),
        'u_DecalMatrix': mat4.create(),
        'u_InvDecalMatrix': mat4.create(),
        'EveSpaceSceneEnvMap': '',
        'EnvMap1': '',
        'EnvMap2': '',
        'EnvMap3': '',
        'ShadowLightness': 0,
        'OccluderValue': vec4.fromValues(1, 1, 0, 0),
        'LensflareFxOccScale': vec4.fromValues(1, 1, 0, 0),
        'LensflareFxDirectionScale': vec4.create()
    }

});




