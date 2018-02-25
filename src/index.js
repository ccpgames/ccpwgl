import * as math from './math';
import * as core from './core';
import * as curve from './curve';
import * as eve from './eve';
import * as particle from './particle';

import {store} from './core';
const {vec4, mat4} = math;

store.Register({

    uuid : false,

    resourcePaths: {
        'res': 'https://developers.eveonline.com/ccpwgl/assetpath/1097993/'
    },

    extensions: {
        'sm_hi': core.Tw2EffectRes,
        'sm_lo': core.Tw2EffectRes,
        'wbg': core.Tw2GeometryRes,
        'png': core.Tw2TextureRes,
        'cube': core.Tw2TextureRes
    },

    constructors: [
        core,
        curve,
        eve,
        particle
    ],

    types: {
        'float' : core.Tw2FloatParameter,
        'vector2' : core.Tw2Vector2Parameter,
        'vector3' : core.Tw2Vector3Parameter,
        'vector4' : core.Tw2Vector4Parameter,
        'matrix4' : core.Tw2MatrixParameter,
        'texture' : core.Tw2TextureParameter
    },

    variables: {
        'u_DecalMatrix': mat4.create(),
        'u_InvDecalMatrix': mat4.create(),
        'EveSpaceSceneEnvMap': '',
        'EnvMap1': '',
        'EnvMap2': '',
        'EnvMap3': '',
        'ShadowLightness': 0,
        'LensflareFxDirectionScale': vec4.create(),
        'LensflareFxOccScale': vec4.fromValues(1, 1, 0, 0),
        'OccluderValue': vec4.create(),
        'WorldMat': mat4.create(),
        'ViewMat': mat4.create(),
        'ProjectionMat': mat4.create(),
        'ViewProjectionMat': mat4.create(),
        'ViewportSize': vec4.create(),
        'Time': vec4.create()
    }
});

export * from './core';
export * from './curve';
export * from './eve';
export * from './particle';
export {math};