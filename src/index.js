import * as math from './math';
import * as core from './core';
import * as curve from './curve';
import * as eve from './eve';
import * as particle from './particle';
import {resMan} from './core';

/**
 * Register globals
 */
resMan.Register({

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
});

export * from './core';
export * from './curve';
export * from './eve';
export * from './particle';
export {math};