import {vec3, vec4, mat4} from '../../math';
import {store} from './Tw2Store';
import {resMan} from './Tw2ResMan';
import {emitter} from './Tw2EventEmitter';
import {Tw2Effect} from '../mesh/Tw2Effect';
import {Tw2VertexElement, Tw2VertexDeclaration} from '../vertex';
import {Tw2TextureParameter} from '../parameter';
const WebGLDebugUtil = require('webgl-debug');

/**
 * Tw2Device
 * - creates WebGL context
 * - stores global rendering variables
 * - contains utility functions
 * @constructor
 */
function Tw2Device()
{
    this.gl = null;
    this.glVersion = Tw2Device.WebglVersion.NONE;
    this.ext = null;

    this.dt = 0;
    this.frameCounter = 0;
    this.startTime = new Date();
    this.currentTime = this.startTime;
    this.previousTime = null;

    this.eyePosition = vec3.create();
    this.targetResolution = vec4.create();
    this.world = mat4.create();
    this.view = mat4.create();
    this.viewInverse = mat4.create();
    this.viewTranspose = mat4.create();
    this.projection = mat4.create();
    this.projectionInverse = mat4.create();
    this.projectionTranspose = mat4.create();
    this.viewProjection = mat4.create();
    this.viewProjectionTranspose = mat4.create();

    this.canvas = null;
    this.viewportAspect = 0;
    this.viewportWidth = 0;
    this.viewportHeight = 0;

    this.shadowHandles = null;
    this.wrapModes = [];
    this.perObjectData = null;
    this.effectDir = '/effect.gles2/';
    this.debugMode = false;

    this.mipLevelSkipCount = 0;
    this.shaderModel = 'hi';
    this.enableAnisotropicFiltering = true;

    this._scheduled = [];
    this._quadBuffer = null;
    this._cameraQuadBuffer = null;
    this._currentRenderMode = null;
    this._onResize = null;

    this.utils = WebGLDebugUtil;
}

/**
 * Creates gl Device
 * @param {canvas} canvas
 * @param {Object} [params]
 * @returns {boolean}
 */
Tw2Device.prototype.CreateDevice = function(canvas, params)
{
    this.gl = null;
    this.glVersion = Tw2Device.WebglVersion.NONE;
    this.effectDir = '/effect.gles2/';
    this.ext = {
        drawElementsInstanced: function()
        {
            return false;
        },
        drawArraysInstanced: function()
        {
            return false;
        },
        vertexAttribDivisor: function()
        {
            return false;
        },
        hasInstancedArrays: function()
        {
            return false;
        }
    };

    // Try webgl2 if enabled
    if (params && params.webgl2)
    {
        this.gl = Tw2Device.CreateContext(canvas, params, Tw2Device.Webgl2ContextNames);
        if (this.gl) this.glVersion = Tw2Device.WebglVersion.WEBGL2;
    }
    // Fallback to webgl
    if (!this.gl)
    {
        this.gl = Tw2Device.CreateContext(canvas, params, Tw2Device.WebglContextNames);
        if (this.gl) this.glVersion = Tw2Device.WebglVersion.WEBGL;
    }

    var gl = this.gl;
    // Setup webgl compatibility (performance of closure is better than binding)
    switch (this.glVersion)
    {
        case Tw2Device.WebglVersion.WEBGL2:
            this.ext = {
                drawElementsInstanced: function(mode, count, type, offset, instanceCount)
                {
                    gl.drawElementsInstanced(mode, count, type, offset, instanceCount);
                },
                drawArraysInstanced: function(mode, first, count, instanceCount)
                {
                    gl.drawArraysInstanced(mode, first, count, instanceCount);
                },
                vertexAttribDivisor: function(location, divisor)
                {
                    gl.vertexAttribDivisor(location, divisor);
                },
                hasInstancedArrays: function()
                {
                    return true;
                }
            };
            break;

        case Tw2Device.WebglVersion.WEBGL:
            this.GetExtension('OES_standard_derivatives');
            this.GetExtension('OES_element_index_uint');
            this.GetExtension('OES_texture_float');
            this.GetExtension('EXT_shader_texture_lod');
            var instancedArrays = this.GetExtension('ANGLE_instanced_arrays');
            if (instancedArrays)
            {
                this.ext = {
                    drawElementsInstanced: function(mode, count, type, offset, instanceCount)
                    {
                        instancedArrays['drawElementsInstancedANGLE'](mode, count, type, offset, instanceCount);
                    },
                    drawArraysInstanced: function(mode, first, count, instanceCount)
                    {
                        instancedArrays['drawArraysInstancedANGLE'](mode, first, count, instanceCount);
                    },
                    vertexAttribDivisor: function(location, divisor)
                    {
                        instancedArrays['vertexAttribDivisorANGLE'](location, divisor);
                    },
                    hasInstancedArrays: function()
                    {
                        return true;
                    }
                };
            }
            break;

        default:
            return false;
    }

    emitter.log('webgl',
        {
            log: 'warn',
            type: 'Context created',
            value: this.glVersion
        });

    // Optional extensions
    this.ext.CompressedTexture = this.GetExtension('compressed_texture_s3tc');
    this.ext.AnisotropicFilter = this.GetExtension('EXT_texture_filter_anisotropic');
    if (this.ext.AnisotropicFilter)
    {
        this.ext.AnisotropicFilter.maxAnisotropy =
            gl.getParameter(this.ext.AnisotropicFilter['MAX_TEXTURE_MAX_ANISOTROPY_EXT']);
    }

    // CCP mobile shader binary (is this depreciated?)
    var shaderBinary = this.GetExtension('CCP_shader_binary');
    if (shaderBinary)
    {
        var renderer = gl.getParameter(this.gl.RENDERER);
        var maliVer = renderer.match(/Mali-(\w+).*/);
        if (maliVer)
        {
            this.effectDir = '/effect.gles2.mali' + maliVer[1] + '/';
            this.ext.ShaderBinary = shaderBinary;
        }
    }

    if (this.debugMode)
    {
        this.gl = this.utils.makeDebugContext(this.gl);
    }

    // Quality
    this.alphaBlendBackBuffer = !params || typeof(params.alpha) === 'undefined' || params.alpha;
    this.msaaSamples = this.gl.getParameter(this.gl.SAMPLES);
    this.antialiasing = this.msaaSamples > 1;

    this.canvas = canvas;
    this.Resize();

    var vertices = [
        1.0, 1.0, 0.0, 1.0, 1.0, 1.0, -1.0, 1.0, 0.0, 1.0, 0.0, 1.0,
        1.0, -1.0, 0.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, 0.0, 0.0
    ];

    this._quadBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._quadBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
    this._cameraQuadBuffer = this.gl.createBuffer();
    this._quadDecl = new Tw2VertexDeclaration();
    this._quadDecl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.Type.POSITION, 0, this.gl.FLOAT, 4, 0));
    this._quadDecl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.Type.TEXCOORD, 0, this.gl.FLOAT, 2, 16));
    this._quadDecl.RebuildHash();

    this.alphaTestState = {};
    this.alphaTestState.states = {};
    this.alphaTestState.states[this.RS_ALPHATESTENABLE] = 0;
    this.alphaTestState.states[this.RS_ALPHAREF] = -1;
    this.alphaTestState.states[this.RS_ALPHAFUNC] = this.CMP_GREATER;
    this.alphaTestState.states[this.RS_CLIPPING] = 0;
    this.alphaTestState.states[this.RS_CLIPPLANEENABLE] = 0;
    this.alphaTestState.dirty = false;

    this.alphaBlendState = {};
    this.alphaBlendState.states = {};
    this.alphaBlendState.states[this.RS_SRCBLEND] = this.BLEND_SRCALPHA;
    this.alphaBlendState.states[this.RS_DESTBLEND] = this.BLEND_INVSRCALPHA;
    this.alphaBlendState.states[this.RS_BLENDOP] = this.BLENDOP_ADD;
    this.alphaBlendState.states[this.RS_SEPARATEALPHABLENDENABLE] = 0;
    this.alphaBlendState.states[this.RS_BLENDOPALPHA] = this.BLENDOP_ADD;
    this.alphaBlendState.states[this.RS_SRCBLENDALPHA] = this.BLEND_SRCALPHA;
    this.alphaBlendState.states[this.RS_DESTBLENDALPHA] = this.BLEND_INVSRCALPHA;
    this.alphaBlendState.dirty = false;

    this.depthOffsetState = {};
    this.depthOffsetState.states = {};
    this.depthOffsetState.states[this.RS_SLOPESCALEDEPTHBIAS] = 0;
    this.depthOffsetState.states[this.RS_DEPTHBIAS] = 0;
    this.depthOffsetState.dirty = false;

    this.wrapModes = [];
    this.wrapModes[0] = 0;
    this.wrapModes[1] = this.gl.REPEAT;
    this.wrapModes[2] = this.gl.MIRRORED_REPEAT;
    this.wrapModes[3] = this.gl.CLAMP_TO_EDGE;
    this.wrapModes[4] = this.gl.CLAMP_TO_EDGE;
    this.wrapModes[5] = this.gl.CLAMP_TO_EDGE;

    this._shadowStateBuffer = new Float32Array(24);

    this._blendTable = [-1, // --
        this.gl.ZERO, // D3DBLEND_ZERO
        this.gl.ONE, // D3DBLEND_ONE
        this.gl.SRC_COLOR, // D3DBLEND_SRCCOLOR
        this.gl.ONE_MINUS_SRC_COLOR, // D3DBLEND_INVSRCCOLOR
        this.gl.SRC_ALPHA, // D3DBLEND_SRCALPHA
        this.gl.ONE_MINUS_SRC_ALPHA, // D3DBLEND_INVSRCALPHA
        this.gl.DST_ALPHA, // D3DBLEND_DESTALPHA
        this.gl.ONE_MINUS_DST_ALPHA, // D3DBLEND_INVDESTALPHA
        this.gl.DST_COLOR, // D3DBLEND_DESTCOLOR
        this.gl.ONE_MINUS_DST_COLOR, // D3DBLEND_INVDESTCOLOR
        this.gl.SRC_ALPHA_SATURATE, // D3DBLEND_SRCALPHASAT
        -1, // D3DBLEND_BOTHSRCALPHA
        -1, // D3DBLEND_BOTHINVSRCALPHA
        this.gl.CONSTANT_COLOR, // D3DBLEND_BLENDFACTOR
        this.gl.ONE_MINUS_CONSTANT_COLOR // D3DBLEND_INVBLENDFACTOR
    ];

    return this.glVersion;
};

/**
 * Schedule
 * @param render
 */
Tw2Device.prototype.Schedule = function(render)
{
    this._scheduled[this._scheduled.length] = render;
};

/**
 * Handles resize events
 */
Tw2Device.prototype.Resize = function()
{
    if (!this.canvas) return;

    if (this._onResize) this._onResize(this);
    else
    {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        this.viewportWidth = this.canvas.clientWidth;
        this.viewportHeight = this.canvas.clientHeight;
    }
    this.viewportAspect = this.viewportWidth / this.viewportHeight;
};

/**
 * Tick
 */
Tw2Device.prototype.Tick = function()
{
    if (this.canvas.clientWidth !== this.viewportWidth || this.canvas.clientHeight !== this.viewportHeight)
    {
        this.Resize();
    }

    let previousTime = this.currentTime;

    var now = this.Clock.now();
    this.currentTime = (now - this.startTime) * 0.001;
    this.dt = this.previousTime === null ? 0 : (now - this.previousTime) * 0.001;
    this.previousTime = now;

    store.SetVariableValue('Time', [
        this.currentTime,
        this.currentTime - Math.floor(this.currentTime),
        this.frameCounter,
        previousTime
    ]);

    store.SetVariableValue('ViewportSize', [
        this.viewportWidth,
        this.viewportHeight,
        this.viewportWidth,
        this.viewportHeight
    ]);

    resMan.PrepareLoop(this.dt);

    for (var i = 0; i < this._scheduled.length; ++i)
    {
        if (!this._scheduled[i](this.dt))
        {
            this._scheduled.splice(i, 1);
            --i;
        }
    }
    this.frameCounter++;
};

/**
 * Sets World transform matrix
 * @param {mat4} matrix
 */
Tw2Device.prototype.SetWorld = function(matrix)
{
    mat4.copy(this.world, matrix);
    //mat4.inverse(this.worldInverse, this.world);
};

/**
 * Sets view matrix
 * @param {mat4} matrix
 */
Tw2Device.prototype.SetView = function(matrix)
{
    mat4.copy(this.view, matrix);
    mat4.invert(this.viewInverse, this.view);
    mat4.transpose(this.viewTranspose, this.view);
    mat4.getTranslation(this.eyePosition, this.viewInverse);

    mat4.multiply(this.viewProjection, this.projection, this.view);
    mat4.transpose(this.viewProjectionTranspose, this.viewProjection);
    store.SetVariableValue('ViewProjectionMat', this.viewProjection);
};

/**
 * Sets projection matrix
 *
 * @param {mat4} matrix
 * @param {boolean} [forceUpdateViewProjection]
 */
Tw2Device.prototype.SetProjection = function(matrix, forceUpdateViewProjection)
{
    mat4.copy(this.projection, matrix);
    mat4.transpose(this.projectionTranspose, this.projection);
    mat4.invert(this.projectionInverse, this.projection);
    this.GetTargetResolution(this.targetResolution);

    if (forceUpdateViewProjection)
    {
        mat4.multiply(this.viewProjection, this.projection, this.view);
        mat4.transpose(this.viewProjectionTranspose, this.viewProjection);
        store.SetVariableValue('ViewProjectionMat', this.viewProjection);
    }
};

/**
 * Gets the device's target resolution
 * @param {vec4} out
 * @returns {vec4} out
 */
Tw2Device.prototype.GetTargetResolution = function(out)
{
    var aspectRatio = this.projection[0] ? this.projection[5] / this.projection[0] : 0.0;
    var aspectAdjustment = 1.0;
    if (aspectRatio > 1.6) aspectAdjustment = aspectRatio / 1.6;
    var fov = 2.0 * Math.atan(aspectAdjustment / this.projection[5]);
    out[0] = this.viewportWidth;
    out[1] = this.viewportHeight;
    out[2] = fov;
    out[3] = fov * aspectRatio;
    return out;
};

/**
 * GetEyePosition
 * @return {vec3}
 */
Tw2Device.prototype.GetEyePosition = function()
{
    return this.eyePosition;
};

/**
 * RenderFullScreenQuad
 * @param {Tw2Effect} effect
 */
Tw2Device.prototype.RenderFullScreenQuad = function(effect)
{
    if (!effect) return;
    var effectRes = effect.GetEffectRes();
    if (!effectRes.IsGood()) return;

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._quadBuffer);

    for (var pass = 0; pass < effect.GetPassCount(); ++pass)
    {
        effect.ApplyPass(pass);
        if (!this._quadDecl.SetDeclaration(effect.GetPassInput(pass), 24)) return;
        this.ApplyShadowState();
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
};

/**
 * Renders a Texture to the screen
 * @param texture
 */
Tw2Device.prototype.RenderTexture = (function()
{
    var blitEffect = null;
    return function RenderTexture(texture)
    {
        if (blitEffect === null)
        {
            blitEffect = new Tw2Effect();
            blitEffect.effectFilePath = 'res:/graphics/effect/managed/space/system/blit.fx';
            var param = new Tw2TextureParameter();
            param.name = 'BlitSource';
            blitEffect.parameters[param.name] = param;
            blitEffect.Initialize();
        }
        blitEffect.parameters['BlitSource'].textureRes = texture;
        this.RenderFullScreenQuad(blitEffect);
    };
})();

/**
 * RenderCameraSpaceQuad
 * @param {Tw2Effect} effect
 */
Tw2Device.prototype.RenderCameraSpaceQuad = function(effect)
{
    if (!effect) return;
    var effectRes = effect.GetEffectRes();
    if (!effectRes.IsGood()) return;

    var vertices = new Float32Array([
        1.0, 1.0, 0.0, 1.0, 1.0, 1.0, -1.0, 1.0, 0.0, 1.0, 0.0, 1.0,
        1.0, -1.0, 0.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, 0.0, 0.0
    ]);

    var projInv = this.projectionInverse;
    for (var i = 0; i < 4; ++i)
    {
        var vec = vertices.subarray(i * 6, i * 6 + 4);
        vec4.transformMat4(vec, vec, projInv);
        vec3.scale(vec, vec, 1 / vec[3]);
        vec[3] = 1;
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._cameraQuadBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
    for (var pass = 0; pass < effect.GetPassCount(); ++pass)
    {
        effect.ApplyPass(pass);
        if (!this._quadDecl.SetDeclaration(effect.GetPassInput(pass), 24)) return;
        this.ApplyShadowState();
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
};

/**
 * Converts a Dword to Float
 * @param value
 * @return {Number}
 */
Tw2Device.prototype._DwordToFloat = function(value)
{
    var b4 = (value & 0xff);
    var b3 = (value & 0xff00) >> 8;
    var b2 = (value & 0xff0000) >> 16;
    var b1 = (value & 0xff000000) >> 24;
    var sign = 1 - (2 * (b1 >> 7)); // sign = bit 0
    var exp = (((b1 << 1) & 0xff) | (b2 >> 7)) - 127; // exponent = bits 1..8
    var sig = ((b2 & 0x7f) << 16) | (b3 << 8) | b4; // significand = bits 9..31
    if (sig === 0 && exp === -127) return 0.0;
    return sign * (1 + sig * Math.pow(2, -23)) * Math.pow(2, exp);
};

/**
 * Returns whether or not Alpha Test is enabled
 * return {Boolean}
 */
Tw2Device.prototype.IsAlphaTestEnabled = function()
{
    return this.alphaTestState.states[this.RS_ALPHATESTENABLE];
};

/**
 * Set a render state
 * @param state
 * @param value
 */
Tw2Device.prototype.SetRenderState = function(state, value)
{
    this._currentRenderMode = this.RM_ANY;
    var gl = this.gl;
    switch (state)
    {
        case this.RS_ZENABLE:
            if (value) gl.enable(gl.DEPTH_TEST);
            else gl.disable(gl.DEPTH_TEST);
            return;

        case this.RS_ZWRITEENABLE:
            gl.depthMask(!!value);
            return;

        case this.RS_ALPHATESTENABLE:
        case this.RS_ALPHAREF:
        case this.RS_ALPHAFUNC:
        case this.RS_CLIPPING:
        case this.RS_CLIPPLANEENABLE:
            if (this.alphaTestState[state] !== value)
            {
                this.alphaTestState.states[state] = value;
                this.alphaTestState.dirty = true;
            }
            return;

        case this.RS_SRCBLEND:
        case this.RS_DESTBLEND:
        case this.RS_BLENDOP:
        case this.RS_SEPARATEALPHABLENDENABLE:
        case this.RS_BLENDOPALPHA:
        case this.RS_SRCBLENDALPHA:
        case this.RS_DESTBLENDALPHA:
            if (this.alphaBlendState[state] !== value)
            {
                this.alphaBlendState.states[state] = value;
                this.alphaBlendState.dirty = true;
            }
            return;

        case this.RS_CULLMODE:
            switch (value)
            {
                case this.CULL_NONE:
                    gl.disable(gl.CULL_FACE);
                    return;
                case this.CULL_CW:
                    gl.enable(gl.CULL_FACE);
                    gl.cullFace(gl.FRONT);
                    return;
                case this.CULL_CCW:
                    gl.enable(gl.CULL_FACE);
                    gl.cullFace(gl.BACK);
                    return;
            }
            return;

        case this.RS_ZFUNC:
            gl.depthFunc(0x0200 + value - 1);
            return;

        case this.RS_ALPHABLENDENABLE:
            if (value) gl.enable(gl.BLEND);
            else gl.disable(gl.BLEND);
            return;

        case this.RS_COLORWRITEENABLE:
            gl.colorMask((value & 1) !== 0, (value & 2) !== 0, (value & 4) !== 0, (value & 8) !== 0);
            return;

        case this.RS_SCISSORTESTENABLE:
            if (value) gl.enable(gl.SCISSOR_TEST);
            else gl.disable(gl.SCISSOR_TEST);
            return;

        case this.RS_SLOPESCALEDEPTHBIAS:
        case this.RS_DEPTHBIAS:
            value = this._DwordToFloat(value);
            if (this.depthOffsetState[state] !== value)
            {
                this.depthOffsetState.states[state] = value;
                this.depthOffsetState.dirty = true;
            }
            return;
    }
};

/**
 * ApplyShadowState
 */
Tw2Device.prototype.ApplyShadowState = function()
{
    if (this.alphaBlendState.dirty)
    {
        var blendOp = this.gl.FUNC_ADD;
        if (this.alphaBlendState.states[this.RS_BLENDOP] === this.BLENDOP_SUBTRACT)
        {
            blendOp = this.gl.FUNC_SUBTRACT;
        }
        else if (this.alphaBlendState.states[this.RS_BLENDOP] === this.BLENDOP_REVSUBTRACT)
        {
            blendOp = this.gl.FUNC_REVERSE_SUBTRACT;
        }
        var srcBlend = this._blendTable[this.alphaBlendState.states[this.RS_SRCBLEND]];
        var destBlend = this._blendTable[this.alphaBlendState.states[this.RS_DESTBLEND]];

        if (this.alphaBlendState.states[this.RS_SEPARATEALPHABLENDENABLE])
        {
            var blendOpAlpha = this.gl.FUNC_ADD;
            if (this.alphaBlendState.states[this.RS_BLENDOP] === this.BLENDOP_SUBTRACT)
            {
                blendOpAlpha = this.gl.FUNC_SUBTRACT;
            }
            else if (this.alphaBlendState.states[this.RS_BLENDOP] === this.BLENDOP_REVSUBTRACT)
            {
                blendOpAlpha = this.gl.FUNC_REVERSE_SUBTRACT;
            }
            var srcBlendAlpha = this._blendTable[this.alphaBlendState.states[this.RS_SRCBLENDALPHA]];
            var destBlendAlpha = this._blendTable[this.alphaBlendState.states[this.RS_DESTBLENDALPHA]];
            this.gl.blendEquationSeparate(blendOp, blendOpAlpha);
            this.gl.blendFuncSeparate(srcBlend,
                destBlend,
                srcBlendAlpha,
                destBlendAlpha);
        }
        else
        {
            this.gl.blendEquation(blendOp);
            this.gl.blendFunc(srcBlend, destBlend);
        }
        this.alphaBlendState.dirty = false;
    }
    if (this.depthOffsetState.dirty)
    {
        this.gl.polygonOffset(
            this.depthOffsetState.states[this.RS_SLOPESCALEDEPTHBIAS],
            this.depthOffsetState.states[this.RS_DEPTHBIAS]);
        this.depthOffsetState.dirty = false;
    }

    var alphaTestFunc, invertedAlphaTest, alphaTestRef;

    if (this.shadowHandles && this.alphaTestState.states[this.RS_ALPHATESTENABLE])
    {
        switch (this.alphaTestState.states[this.RS_ALPHAFUNC])
        {
            case this.CMP_NEVER:
                alphaTestFunc = 0;
                invertedAlphaTest = 1;
                alphaTestRef = -256;
                break;

            case this.CMP_LESS:
                alphaTestFunc = 0;
                invertedAlphaTest = -1;
                alphaTestRef = this.alphaTestState.states[this.RS_ALPHAREF] - 1;
                break;

            case this.CMP_EQUAL:
                alphaTestFunc = 1;
                invertedAlphaTest = 0;
                alphaTestRef = this.alphaTestState.states[this.RS_ALPHAREF];
                break;

            case this.CMP_LEQUAL:
                alphaTestFunc = 0;
                invertedAlphaTest = -1;
                alphaTestRef = this.alphaTestState.states[this.RS_ALPHAREF];
                break;

            case this.CMP_GREATER:
                alphaTestFunc = 0;
                invertedAlphaTest = 1;
                alphaTestRef = -this.alphaTestState.states[this.RS_ALPHAREF] - 1;
                break;

            /*case this.CMP_NOTEQUAL:
             var alphaTestFunc = 1;
             var invertedAlphaTest = 1;
             var alphaTestRef = this.alphaTestState.states[this.RS_ALPHAREF];
             break;*/

            case this.CMP_GREATEREQUAL:
                alphaTestFunc = 0;
                invertedAlphaTest = 1;
                alphaTestRef = -this.alphaTestState.states[this.RS_ALPHAREF];
                break;

            default:
                alphaTestFunc = 0;
                invertedAlphaTest = 0;
                alphaTestRef = 1;
                break;
        }

        var clipPlaneEnable = 0;
        this.gl.uniform4f(
            this.shadowHandles.shadowStateInt,
            invertedAlphaTest,
            alphaTestRef,
            alphaTestFunc,
            clipPlaneEnable);
        //this._shadowStateBuffers
    }
};

/**
 * Sets a render mode
 * @param {number} renderMode
 */
Tw2Device.prototype.SetStandardStates = function(renderMode)
{
    if (this._currentRenderMode === renderMode) return;

    this.gl.frontFace(this.gl.CW);
    switch (renderMode)
    {
        case this.RM_OPAQUE:
        case this.RM_PICKABLE:
            this.SetRenderState(this.RS_ZENABLE, true);
            this.SetRenderState(this.RS_ZWRITEENABLE, true);
            this.SetRenderState(this.RS_ZFUNC, this.CMP_LEQUAL);
            this.SetRenderState(this.RS_CULLMODE, this.CULL_CW);
            this.SetRenderState(this.RS_ALPHABLENDENABLE, false);
            this.SetRenderState(this.RS_ALPHATESTENABLE, false);
            this.SetRenderState(this.RS_SEPARATEALPHABLENDENABLE, false);
            this.SetRenderState(this.RS_SLOPESCALEDEPTHBIAS, 0);
            this.SetRenderState(this.RS_DEPTHBIAS, 0);
            this.SetRenderState(this.RS_COLORWRITEENABLE, 0xf);
            break;

        case this.RM_DECAL:
            this.SetRenderState(this.RS_ALPHABLENDENABLE, false);
            this.SetRenderState(this.RS_ALPHATESTENABLE, true);
            this.SetRenderState(this.RS_ALPHAFUNC, this.CMP_GREATER);
            this.SetRenderState(this.RS_ALPHAREF, 127);
            this.SetRenderState(this.RS_ZENABLE, true);
            this.SetRenderState(this.RS_ZWRITEENABLE, true);
            this.SetRenderState(this.RS_ZFUNC, this.CMP_LEQUAL);
            this.SetRenderState(this.RS_CULLMODE, this.CULL_CW);
            this.SetRenderState(this.RS_BLENDOP, this.BLENDOP_ADD);
            this.SetRenderState(this.RS_SLOPESCALEDEPTHBIAS, 0);
            this.SetRenderState(this.RS_DEPTHBIAS, 0);
            this.SetRenderState(this.RS_SEPARATEALPHABLENDENABLE, false);
            this.SetRenderState(this.RS_COLORWRITEENABLE, 0xf);
            break;

        case this.RM_TRANSPARENT:
            this.SetRenderState(this.RS_CULLMODE, this.CULL_CW);
            this.SetRenderState(this.RS_ALPHABLENDENABLE, true);
            this.SetRenderState(this.RS_SRCBLEND, this.BLEND_SRCALPHA);
            this.SetRenderState(this.RS_DESTBLEND, this.BLEND_INVSRCALPHA);
            this.SetRenderState(this.RS_BLENDOP, this.BLENDOP_ADD);
            this.SetRenderState(this.RS_ZENABLE, true);
            this.SetRenderState(this.RS_ZWRITEENABLE, false);
            this.SetRenderState(this.RS_ZFUNC, this.CMP_LEQUAL);
            this.SetRenderState(this.RS_ALPHATESTENABLE, false);
            this.SetRenderState(this.RS_SLOPESCALEDEPTHBIAS, 0); // -1.0
            this.SetRenderState(this.RS_DEPTHBIAS, 0);
            this.SetRenderState(this.RS_SEPARATEALPHABLENDENABLE, false);
            this.SetRenderState(this.RS_COLORWRITEENABLE, 0xf);
            break;

        case this.RM_ADDITIVE:
            this.SetRenderState(this.RS_CULLMODE, this.CULL_NONE);
            this.SetRenderState(this.RS_ALPHABLENDENABLE, true);
            this.SetRenderState(this.RS_SRCBLEND, this.BLEND_ONE);
            this.SetRenderState(this.RS_DESTBLEND, this.BLEND_ONE);
            this.SetRenderState(this.RS_BLENDOP, this.BLENDOP_ADD);
            this.SetRenderState(this.RS_ZENABLE, true);
            this.SetRenderState(this.RS_ZWRITEENABLE, false);
            this.SetRenderState(this.RS_ZFUNC, this.CMP_LEQUAL);
            this.SetRenderState(this.RS_ALPHATESTENABLE, false);
            this.SetRenderState(this.RS_SLOPESCALEDEPTHBIAS, 0);
            this.SetRenderState(this.RS_DEPTHBIAS, 0);
            this.SetRenderState(this.RS_SEPARATEALPHABLENDENABLE, false);
            this.SetRenderState(this.RS_COLORWRITEENABLE, 0xf);
            break;

        case this.RM_FULLSCREEN:
            this.SetRenderState(this.RS_ALPHABLENDENABLE, false);
            this.SetRenderState(this.RS_ALPHATESTENABLE, false);
            this.SetRenderState(this.RS_CULLMODE, this.CULL_NONE);
            this.SetRenderState(this.RS_ZENABLE, false);
            this.SetRenderState(this.RS_ZWRITEENABLE, false);
            this.SetRenderState(this.RS_ZFUNC, this.CMP_ALWAYS);
            this.SetRenderState(this.RS_SLOPESCALEDEPTHBIAS, 0);
            this.SetRenderState(this.RS_DEPTHBIAS, 0);
            this.SetRenderState(this.RS_SEPARATEALPHABLENDENABLE, false);
            this.SetRenderState(this.RS_COLORWRITEENABLE, 0xf);
            break;

        default:
            return;
    }
    this._currentRenderMode = renderMode;
};

/**
 * Gets a fallback texture
 * @returns {*}
 */
Tw2Device.prototype.GetFallbackTexture = (function()
{
    var whiteTexture = null;
    return function GetFallbackTexture()
    {
        if (whiteTexture === null)
        {
            whiteTexture = this.CreateSolidTexture([0, 0, 0, 0]);
        }
        return whiteTexture;
    };
})();

/**
 * Gets a fallback cube map
 * @returns {*}
 */
Tw2Device.prototype.GetFallbackCubeMap = (function()
{
    var whiteCube = null;
    return function GetFallbackCubeMap()
    {
        if (whiteCube === null)
        {
            whiteCube = this.gl.createTexture();
            this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, whiteCube);
            for (var j = 0; j < 6; ++j)
            {
                this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + j, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
            }
            this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
            //this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP);
            this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, null);
        }
        return whiteCube;
    };
})();

/**
 * Checks if a frame buffer is complete
 *
 * @param frameBuffer
 * @returns {boolean}
 */
Tw2Device.prototype.IsFrameBufferComplete = function(frameBuffer)
{
    return this.gl.checkFramebufferStatus(frameBuffer) === this.gl.FRAMEBUFFER_COMPLETE;
};

/**
 * Gets a gl extension
 * @param {string} extension - The gl extension name
 * @returns{*}
 */
Tw2Device.prototype.GetExtension = function(extension)
{
    for (var prefix in Tw2Device.WebglVendorPrefixes)
    {
        if (Tw2Device.WebglVendorPrefixes.hasOwnProperty(prefix))
        {
            var ext = this.gl.getExtension(Tw2Device.WebglVendorPrefixes[prefix] + extension);
            if (ext) return ext;
        }
    }

    return null;
};

/**
 * Creates a solid colored texture
 * @param {vec4|Array} [rgba] - The colour to create, if obmitted defaults to completely transparent
 * @returns {WebGLTexture}
 */
Tw2Device.prototype.CreateSolidTexture = function(rgba)
{
    rgba = rgba || [0, 0, 0, 0];
    var texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array(rgba));
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    return texture;
};

/**
 * Device clock
 * - Todo: Add performance timing (Currently doesn't work with boosterSets)
 */
Tw2Device.prototype.Clock = Date; //window['performance'] && window['performance'].now ? window['performance'] : Date;

var timeOuts;

/**
 * Requests and animation frame
 * @param {Function} callback
 * @param {HTMLElement} element
 * @returns {number} id
 */
Tw2Device.prototype.RequestAnimationFrame = (function()
{
    var requestFrame = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element)
        {
            if (!timeOuts) timeOuts = [];
            timeOuts.push(window.setTimeout(callback, 1000 / 60));
            return timeOuts.length - 1;
        };

    return function RequestAnimationFrame(callback, element)
    {
        return requestFrame(callback, element);
    };
})();

/**
 * Cancels an animation frame by it's id
 * @param {number} id
 */
Tw2Device.prototype.CancelAnimationFrame = (function()
{
    var cancelFrame = window.cancelAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(id)
        {
            if (!timeOuts) timeOuts = [];
            if (timeOuts[id] !== undefined)
            {
                window.clearTimeout(timeOuts[id]);
                timeOuts[id] = undefined;
                return true;
            }
        };

    return function CancelAnimationFrame(id)
    {
        cancelFrame(id);
    };
})();

/**
 * Creates a gl context
 *
 * @param {HTMLCanvasElement} canvas
 * @param {*} [params]
 * @param {*} [contextNames]
 * @returns {*}
 */
Tw2Device.CreateContext = function(canvas, params, contextNames)
{
    contextNames = Array.isArray(contextNames) ? contextNames : [contextNames];
    for (var i = 0; i < contextNames.length; i++)
    {
        try
        {
            return canvas.getContext(contextNames[i], params);
        }
        catch (err)
        {

        }
    }
    return null;
};

// Webgl details
Tw2Device.WebglVendorPrefixes = ['', 'MOZ_', 'WEBKIT_', 'WEBGL_'];
Tw2Device.WebglContextNames = ['webgl', 'experimental-webgl'];
Tw2Device.Webgl2ContextNames = ['webgl2', 'experimental-webgl2'];
Tw2Device.WebglVersion = {
    NONE: 0,
    WEBGL: 1,
    WEBGL2: 2
};

// Render Modes
Tw2Device.prototype.RM_ANY = -1;
Tw2Device.prototype.RM_OPAQUE = 0;
Tw2Device.prototype.RM_DECAL = 1;
Tw2Device.prototype.RM_TRANSPARENT = 2;
Tw2Device.prototype.RM_ADDITIVE = 3;
Tw2Device.prototype.RM_DEPTH = 4;
Tw2Device.prototype.RM_FULLSCREEN = 5;
Tw2Device.prototype.RM_PICKABLE = 6;

// Render States
Tw2Device.prototype.RS_ZENABLE = 7; // D3DZBUFFERTYPE (or TRUE/FALSE for legacy)
Tw2Device.prototype.RS_FILLMODE = 8; // D3DFILLMODE
Tw2Device.prototype.RS_SHADEMODE = 9; // D3DSHADEMODE
Tw2Device.prototype.RS_ZWRITEENABLE = 14; // TRUE to enable z writes
Tw2Device.prototype.RS_ALPHATESTENABLE = 15; // TRUE to enable alpha tests
Tw2Device.prototype.RS_LASTPIXEL = 16; // TRUE for last-pixel on lines
Tw2Device.prototype.RS_SRCBLEND = 19; // D3DBLEND
Tw2Device.prototype.RS_DESTBLEND = 20; // D3DBLEND
Tw2Device.prototype.RS_CULLMODE = 22; // D3DCULL
Tw2Device.prototype.RS_ZFUNC = 23; // D3DCMPFUNC
Tw2Device.prototype.RS_ALPHAREF = 24; // D3DFIXED
Tw2Device.prototype.RS_ALPHAFUNC = 25; // D3DCMPFUNC
Tw2Device.prototype.RS_DITHERENABLE = 26; // TRUE to enable dithering
Tw2Device.prototype.RS_ALPHABLENDENABLE = 27; // TRUE to enable alpha blending
Tw2Device.prototype.RS_FOGENABLE = 28; // TRUE to enable fog blending
Tw2Device.prototype.RS_SPECULARENABLE = 29; // TRUE to enable specular
Tw2Device.prototype.RS_FOGCOLOR = 34; // D3DCOLOR
Tw2Device.prototype.RS_FOGTABLEMODE = 35; // D3DFOGMODE
Tw2Device.prototype.RS_FOGSTART = 36; // Fog start (for both vertex and pixel fog)
Tw2Device.prototype.RS_FOGEND = 37; // Fog end
Tw2Device.prototype.RS_FOGDENSITY = 38; // Fog density
Tw2Device.prototype.RS_RANGEFOGENABLE = 48; // Enables range-based fog
Tw2Device.prototype.RS_STENCILENABLE = 52; // BOOL enable/disable stenciling
Tw2Device.prototype.RS_STENCILFAIL = 53; // D3DSTENCILOP to do if stencil test fails
Tw2Device.prototype.RS_STENCILZFAIL = 54; // D3DSTENCILOP to do if stencil test passes and Z test fails
Tw2Device.prototype.RS_STENCILPASS = 55; // D3DSTENCILOP to do if both stencil and Z tests pass
Tw2Device.prototype.RS_STENCILFUNC = 56; // D3DCMPFUNC fn.  Stencil Test passes if ((ref & mask) stencilfn (stencil & mask)) is true
Tw2Device.prototype.RS_STENCILREF = 57; // Reference value used in stencil test
Tw2Device.prototype.RS_STENCILMASK = 58; // Mask value used in stencil test
Tw2Device.prototype.RS_STENCILWRITEMASK = 59; // Write mask applied to values written to stencil buffer
Tw2Device.prototype.RS_TEXTUREFACTOR = 60; // D3DCOLOR used for multi-texture blend
Tw2Device.prototype.RS_WRAP0 = 128; // wrap for 1st texture coord. set
Tw2Device.prototype.RS_WRAP1 = 129; // wrap for 2nd texture coord. set
Tw2Device.prototype.RS_WRAP2 = 130; // wrap for 3rd texture coord. set
Tw2Device.prototype.RS_WRAP3 = 131; // wrap for 4th texture coord. set
Tw2Device.prototype.RS_WRAP4 = 132; // wrap for 5th texture coord. set
Tw2Device.prototype.RS_WRAP5 = 133; // wrap for 6th texture coord. set
Tw2Device.prototype.RS_WRAP6 = 134; // wrap for 7th texture coord. set
Tw2Device.prototype.RS_WRAP7 = 135; // wrap for 8th texture coord. set
Tw2Device.prototype.RS_CLIPPING = 136;
Tw2Device.prototype.RS_LIGHTING = 137;
Tw2Device.prototype.RS_AMBIENT = 139;
Tw2Device.prototype.RS_FOGVERTEXMODE = 140;
Tw2Device.prototype.RS_COLORVERTEX = 141;
Tw2Device.prototype.RS_LOCALVIEWER = 142;
Tw2Device.prototype.RS_NORMALIZENORMALS = 143;
Tw2Device.prototype.RS_DIFFUSEMATERIALSOURCE = 145;
Tw2Device.prototype.RS_SPECULARMATERIALSOURCE = 146;
Tw2Device.prototype.RS_AMBIENTMATERIALSOURCE = 147;
Tw2Device.prototype.RS_EMISSIVEMATERIALSOURCE = 148;
Tw2Device.prototype.RS_VERTEXBLEND = 151;
Tw2Device.prototype.RS_CLIPPLANEENABLE = 152;
Tw2Device.prototype.RS_POINTSIZE = 154; // float point size
Tw2Device.prototype.RS_POINTSIZE_MIN = 155; // float point size min threshold
Tw2Device.prototype.RS_POINTSPRITEENABLE = 156; // BOOL point texture coord control
Tw2Device.prototype.RS_POINTSCALEENABLE = 157; // BOOL point size scale enable
Tw2Device.prototype.RS_POINTSCALE_A = 158; // float point attenuation A value
Tw2Device.prototype.RS_POINTSCALE_B = 159; // float point attenuation B value
Tw2Device.prototype.RS_POINTSCALE_C = 160; // float point attenuation C value
Tw2Device.prototype.RS_MULTISAMPLEANTIALIAS = 161; // BOOL - set to do FSAA with multisample buffer
Tw2Device.prototype.RS_MULTISAMPLEMASK = 162; // DWORD - per-sample enable/disable
Tw2Device.prototype.RS_PATCHEDGESTYLE = 163; // Sets whether patch edges will use float style tessellation
Tw2Device.prototype.RS_DEBUGMONITORTOKEN = 165; // DEBUG ONLY - token to debug monitor
Tw2Device.prototype.RS_POINTSIZE_MAX = 166;
// float point size max threshold
Tw2Device.prototype.RS_INDEXEDVERTEXBLENDENABLE = 167;
Tw2Device.prototype.RS_COLORWRITEENABLE = 168; // per-channel write enable
Tw2Device.prototype.RS_TWEENFACTOR = 170; // float tween factor
Tw2Device.prototype.RS_BLENDOP = 171; // D3DBLENDOP setting
Tw2Device.prototype.RS_POSITIONDEGREE = 172; // NPatch position interpolation degree. D3DDEGREE_LINEAR or D3DDEGREE_CUBIC (default)
Tw2Device.prototype.RS_NORMALDEGREE = 173; // NPatch normal interpolation degree. D3DDEGREE_LINEAR (default) or D3DDEGREE_QUADRATIC
Tw2Device.prototype.RS_SCISSORTESTENABLE = 174;
Tw2Device.prototype.RS_SLOPESCALEDEPTHBIAS = 175;
Tw2Device.prototype.RS_ANTIALIASEDLINEENABLE = 176;
Tw2Device.prototype.RS_TWOSIDEDSTENCILMODE = 185; // BOOL enable/disable 2 sided stenciling
Tw2Device.prototype.RS_CCW_STENCILFAIL = 186; // D3DSTENCILOP to do if ccw stencil test fails
Tw2Device.prototype.RS_CCW_STENCILZFAIL = 187; // D3DSTENCILOP to do if ccw stencil test passes and Z test fails
Tw2Device.prototype.RS_CCW_STENCILPASS = 188; // D3DSTENCILOP to do if both ccw stencil and Z tests pass
Tw2Device.prototype.RS_CCW_STENCILFUNC = 189; // D3DCMPFUNC fn.  ccw Stencil Test passes if ((ref & mask) stencilfn (stencil & mask)) is true
Tw2Device.prototype.RS_COLORWRITEENABLE1 = 190; // Additional ColorWriteEnables for the devices that support D3DPMISCCAPS_INDEPENDENTWRITEMASKS
Tw2Device.prototype.RS_COLORWRITEENABLE2 = 191; // Additional ColorWriteEnables for the devices that support D3DPMISCCAPS_INDEPENDENTWRITEMASKS
Tw2Device.prototype.RS_COLORWRITEENABLE3 = 192; // Additional ColorWriteEnables for the devices that support D3DPMISCCAPS_INDEPENDENTWRITEMASKS
Tw2Device.prototype.RS_BLENDFACTOR = 193; // D3DCOLOR used for a constant blend factor during alpha blending for devices that support D3DPBLENDCAPS_BLENDFACTOR
Tw2Device.prototype.RS_SRGBWRITEENABLE = 194; // Enable rendertarget writes to be DE-linearized to SRGB (for formats that expose D3DUSAGE_QUERY_SRGBWRITE)
Tw2Device.prototype.RS_DEPTHBIAS = 195;
Tw2Device.prototype.RS_SEPARATEALPHABLENDENABLE = 206; // TRUE to enable a separate blending function for the alpha channel
Tw2Device.prototype.RS_SRCBLENDALPHA = 207; // SRC blend factor for the alpha channel when RS_SEPARATEDESTALPHAENABLE is TRUE
Tw2Device.prototype.RS_DESTBLENDALPHA = 208; // DST blend factor for the alpha channel when RS_SEPARATEDESTALPHAENABLE is TRUE
Tw2Device.prototype.RS_BLENDOPALPHA = 209; // Blending operation for the alpha channel when RS_SEPARATEDESTALPHAENABLE is TRUE */// Cull Modes
Tw2Device.prototype.CULL_NONE = 1;
Tw2Device.prototype.CULL_CW = 2;
Tw2Device.prototype.CULL_CCW = 3;
// Compare
Tw2Device.prototype.CMP_NEVER = 1;
Tw2Device.prototype.CMP_LESS = 2;
Tw2Device.prototype.CMP_EQUAL = 3;
Tw2Device.prototype.CMP_LEQUAL = 4;
Tw2Device.prototype.CMP_GREATER = 5;
Tw2Device.prototype.CMP_NOTEQUAL = 6;
Tw2Device.prototype.CMP_GREATEREQUAL = 7;
Tw2Device.prototype.CMP_ALWAYS = 8;
// Blend
Tw2Device.prototype.BLEND_ZERO = 1;
Tw2Device.prototype.BLEND_ONE = 2;
Tw2Device.prototype.BLEND_SRCCOLOR = 3;
Tw2Device.prototype.BLEND_INVSRCCOLOR = 4;
Tw2Device.prototype.BLEND_SRCALPHA = 5;
Tw2Device.prototype.BLEND_INVSRCALPHA = 6;
Tw2Device.prototype.BLEND_DESTALPHA = 7;
Tw2Device.prototype.BLEND_INVDESTALPHA = 8;
Tw2Device.prototype.BLEND_DESTCOLOR = 9;
Tw2Device.prototype.BLEND_INVDESTCOLOR = 10;
Tw2Device.prototype.BLEND_SRCALPHASAT = 11;
Tw2Device.prototype.BLEND_BOTHSRCALPHA = 12;
Tw2Device.prototype.BLEND_BOTHINVSRCALPHA = 13;
Tw2Device.prototype.BLEND_BLENDFACTOR = 14;
Tw2Device.prototype.BLEND_INVBLENDFACTOR = 15;
// Blend Operations
Tw2Device.prototype.BLENDOP_ADD = 1;
Tw2Device.prototype.BLENDOP_SUBTRACT = 2;
Tw2Device.prototype.BLENDOP_REVSUBTRACT = 3;
Tw2Device.prototype.BLENDOP_MIN = 4;
Tw2Device.prototype.BLENDOP_MAX = 5;

export const device = new Tw2Device();
