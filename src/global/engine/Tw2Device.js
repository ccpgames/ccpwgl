import {num, vec3, vec4, mat4} from '../math';
import {get} from '../util';
import {store} from './Tw2Store';
import {resMan} from './Tw2ResMan';
import {Tw2Effect} from '../../core/mesh/Tw2Effect';
import {Tw2VertexDeclaration} from '../../core/vertex';
import {Tw2EventEmitter} from '../../core/Tw2EventEmitter';
import {
    RM_ANY,
    RM_OPAQUE,
    RM_DECAL,
    RM_TRANSPARENT,
    RM_ADDITIVE,
    RM_FULLSCREEN,
    RM_PICKABLE,
    RM_DEPTH,
    RM_DISTORTION,
    RS_ZENABLE,
    RS_ZWRITEENABLE,
    RS_ALPHATESTENABLE,
    RS_SRCBLEND,
    RS_DESTBLEND,
    RS_CULLMODE,
    RS_ZFUNC,
    RS_ALPHAREF,
    RS_ALPHAFUNC,
    RS_ALPHABLENDENABLE,
    RS_CLIPPING,
    RS_CLIPPLANEENABLE,
    RS_COLORWRITEENABLE,
    RS_BLENDOP,
    RS_SCISSORTESTENABLE,
    RS_SLOPESCALEDEPTHBIAS,
    RS_DEPTHBIAS,
    RS_SEPARATEALPHABLENDENABLE,
    RS_SRCBLENDALPHA,
    RS_DESTBLENDALPHA,
    RS_BLENDOPALPHA,
    CULL_NONE,
    CULL_CW,
    CULL_CCW,
    CMP_NEVER,
    CMP_LESS,
    CMP_EQUAL,
    CMP_LEQUAL,
    CMP_GREATER,
    CMP_GREATEREQUAL,
    CMP_ALWAYS,
    BLEND_ONE,
    BLEND_SRCALPHA,
    BLEND_INVSRCALPHA,
    BLENDOP_ADD,
    BLENDOP_SUBTRACT,
    BLENDOP_REVSUBTRACT,
    BlendTable,
    WrapModes,
    VendorRequestAnimationFrame,
    VendorCancelAnimationFrame,
    VendorWebglPrefixes,
    WebglVersion,
    Webgl2ContextNames,
    WebglContextNames,
} from './Tw2Constant';

const WebGLDebugUtil = require('webgl-debug');


/**
 * Tw2Device
 *
 * @property {?WebGLRenderingContext|*} gl         - The device's gl context
 * @property {?number} glVersion                   - The device's gl version
 * @property {?VRDisplay} vrDisplay                - An optional VRDisplay context
 * @property {?{}} ext                             - An object containing compatibility extensions
 * @property {boolean} debugMode                   - Toggles debug mode
 * @property {?{}} debugUtils                      - Webgl debug utils
 * @property {number} dt                           - Clock delta time
 * @property {number} startTime                    - Clock start time
 * @property {number} currentTime                  - Clock current time
 * @property {?number} previousTime                - Clock previous time
 * @property {vec3} eyePosition                    - The device's current eye position
 * @property {vec4} targetResolution               - The device's current target resolution
 * @property {mat4} world                          - The device's current world matrix
 * @property {mat4} view                           - The device's current view matrix
 * @property {mat4} viewInverse                    - The device's current inverse view matrix
 * @property {mat4} viewTranspose                  - The device's current view matrix transposed
 * @property {mat4} projection                     - The device's current projection matrix
 * @property {mat4} projectionInverse              - The device's current inverse projection matrix
 * @property {mat4} projectionTranspose            - The device's current projection matrix transposed
 * @property {mat4} viewProjection                 - The device's current view projection matrix
 * @property {mat4} viewProjectionTranspose        - The device's current view projection matrix transposed
 * @property {?HTMLCanvasElement} canvas           - The html canvas the gl context was created from
 * @property {number} viewportWidth                - The canvas's current width
 * @property {number} viewportHeight               - The canvas's current height
 * @property {number} viewportAspect               - The canvas's current display aspect
 * @property {number} viewportPixelRatio           - The canvas's pixel ratio
 * @property {string} effectDir                    - The directory used to translate ccp effect file paths
 * @property {number} mipLevelSkipCount            - Controls what quality ccp texture resource to load (mutates paths)
 * @property {string} shaderModel                  - Controls what quality ccp effect resource to load (mutates paths)
 * @property {boolean} enableAnisotropicFiltering  - Enables anisotropic filtering
 * @property {boolean} alphaBlendBackBuffer        - Enables alpha blending (glParams.alpha)
 * @property {boolean} antialiasing                - Identifies if antialiasing is enabled
 * @property {number} msaaSamples                  - The amount of samples used for antialiasing
 * @property {number[]} wrapModes                  - texture wrap modes
 * @property {*} shadowHandles                     - unused
 * @property {Tw2PerObjectData} perObjectData      - The current frame's per object data
 * @property {?{}} _alphaBlendState                - Alpha states for blending
 * @property {?{}} _alphaTestState                 - Alpha test states
 * @property {?{}} _depthOffsetState               - Depth states
 * @property {?Float32Array} _shadowStateBuffer    - unused
 * @property {Array<Function>} _scheduled          - Functions that are scheduled to be called per frame
 * @property {WebGLBuffer} _quadBuffer             - Webgl buffer for full screen quad
 * @property {Tw2VertexDeclaration} _quadDecl      - Quad vertex declarations
 * @property {WebGLBuffer} _cameraQuadBuffer       - Webgl buffer for camera space quad
 * @property {number} _currentRenderMode           - The device's current render mode
 * @property {WebGLTexture} _fallbackCube          - A fallback cube texture
 * @property {WebGLTexture} _fallbackTexture       - A fallback texture
 * @property {Tw2Effect} _blitEffect               - The blit effect used for rendering textures
 * @class
 */
export class Tw2Device extends Tw2EventEmitter
{
    constructor()
    {
        super();
        this.name = 'Device';
        this.gl = null;
        this.glVersion = WebglVersion.NONE;
        this.vrDisplay = null;
        this.ext = null;

        this.dt = 0;
        this.frameCounter = 0;
        this.startTime = this.Now();
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
        this.viewportWidth = 0;
        this.viewportHeight = 0;
        this.viewportAspect = 0;
        this.viewportPixelRatio = 'devicePixelRatio' in window ? window.devicePixelRatio : 1;

        this.effectDir = '/effect.gles2/';
        this.mipLevelSkipCount = 0;
        this.shaderModel = 'hi';
        this.enableAnisotropicFiltering = true;
        this.alphaBlendBackBuffer = true;

        this.antialiasing = true;
        this.msaaSamples = 0;
        this.wrapModes = [];
        this.shadowHandles = null;
        this.perObjectData = null;

        this._alphaBlendState = null;
        this._alphaTestState = null;
        this._depthOffsetState = null;
        this._shadowStateBuffer = null;
        this._scheduled = [];
        this._quadBuffer = null;
        this._quadDecl = null;
        this._cameraQuadBuffer = null;
        this._currentRenderMode = RM_ANY;
        this._fallbackCube = null;
        this._fallbackTexture = null;
        this._blitEffect = null;
    }

    /**
     * Gets the current device time
     * @returns {number}
     */
    Now()
    {
        return this.constructor.Clock.now();
    }

    /**
     * Creates webgl Device
     * @param {HTMLCanvasElement} canvas - The html canvas to create a webgl rendering context from
     * @param {{}} [params]              - Optional gl parameters
     * @param {boolean} [params.webgl2]  - Optional flag to enable a webgl2 rendering context
     * @returns {number}                 - The webgl rendering context create (0 if failed)
     */
    CreateDevice(canvas, params)
    {
        this.gl = null;
        this.glVersion = WebglVersion.NONE;
        this.effectDir = '/effect.gles2/';
        this.canvas = null;

        const
            returnFalse = () => (false),
            returnTrue = () => (true);

        this.ext = {
            drawElementsInstanced: returnFalse,
            drawArraysInstanced: returnFalse,
            vertexAttribDivisor: returnFalse,
            hasInstancedArrays: returnFalse
        };

        let { gl, version } = Tw2Device.CreateContext(canvas, params, params.webgl2);
        if (!gl) return this.glVersion;

        if (this.debugMode)
        {
            this.debugUtils = WebGLDebugUtil;
            gl = this.debugUtils.makeDebugContext(gl);
        }

        this.gl = gl;
        this.glVersion = version;
        this.canvas = canvas;

        this.emit('created', {
            device: this, gl, params, canvas,
            log: {
                type: 'debug',
                message: `Webgl${version} context created`,
            }
        });

        switch(this.glVersion)
        {
            case WebglVersion.WEBGL2:
                this.ext = {
                    drawElementsInstanced: function (mode, count, type, offset, instanceCount)
                    {
                        gl.drawElementsInstanced(mode, count, type, offset, instanceCount);
                    },
                    drawArraysInstanced: function (mode, first, count, instanceCount)
                    {
                        gl.drawArraysInstanced(mode, first, count, instanceCount);
                    },
                    vertexAttribDivisor: function (location, divisor)
                    {
                        gl.vertexAttribDivisor(location, divisor);
                    },
                    hasInstancedArrays: returnTrue
                };
                break;

            default:
                this.GetExtension('OES_standard_derivatives');
                this.GetExtension('OES_element_index_uint');
                this.GetExtension('OES_texture_float');
                this.GetExtension('EXT_shader_texture_lod');
                const instancedArrays = this.GetExtension('ANGLE_instanced_arrays');
                if (instancedArrays)
                {
                    this.ext = {
                        drawElementsInstanced: function (mode, count, type, offset, instanceCount)
                        {
                            instancedArrays['drawElementsInstancedANGLE'](mode, count, type, offset, instanceCount);
                        },
                        drawArraysInstanced: function (mode, first, count, instanceCount)
                        {
                            instancedArrays['drawArraysInstancedANGLE'](mode, first, count, instanceCount);
                        },
                        vertexAttribDivisor: function (location, divisor)
                        {
                            instancedArrays['vertexAttribDivisorANGLE'](location, divisor);
                        },
                        hasInstancedArrays: returnTrue
                    };
                }
        }

        // Optional extensions
        this.ext.CompressedTextureS3TC = this.GetExtension('compressed_texture_s3tc');
        this.ext.AnisotropicFilter = this.GetExtension('EXT_texture_filter_anisotropic');
        if (this.ext.AnisotropicFilter)
        {
            this.ext.AnisotropicFilter.maxAnisotropy =
                gl.getParameter(this.ext.AnisotropicFilter['MAX_TEXTURE_MAX_ANISOTROPY_EXT']);
        }

        // CCP mobile shader binary (is this depreciated?)
        const shaderBinary = this.GetExtension('CCP_shader_binary');
        if (shaderBinary)
        {
            const
                renderer = gl.getParameter(this.gl.RENDERER),
                maliVer = renderer.match(/Mali-(\w+).*/);

            if (maliVer)
            {
                this.effectDir = '/effect.gles2.mali' + maliVer[1] + '/';
                this.ext.ShaderBinary = shaderBinary;
            }
        }

        // Quality
        this.alphaBlendBackBuffer = !params || params['alpha'] === undefined || params['alpha'];
        this.msaaSamples = this.gl.getParameter(this.gl.SAMPLES);
        this.antialiasing = this.msaaSamples > 1;

        this.Resize();

        const vertices = [
            1.0, 1.0, 0.0, 1.0, 1.0, 1.0, -1.0, 1.0, 0.0, 1.0, 0.0, 1.0,
            1.0, -1.0, 0.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, 0.0, 0.0
        ];

        this._quadBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._quadBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        this._cameraQuadBuffer = gl.createBuffer();
        this._quadDecl = new Tw2VertexDeclaration([
            ['POSITION', 0, 4],
            ['TEXCOORD', 0, 2]
        ]);

        this.wrapModes = Array.from(WrapModes);

        this._alphaBlendState = {
            dirty: false,
            states: {
                [RS_SRCBLEND]: BLEND_SRCALPHA,
                [RS_DESTBLEND]: BLEND_INVSRCALPHA,
                [RS_BLENDOP]: BLENDOP_ADD,
                [RS_SEPARATEALPHABLENDENABLE]: 0,
                [RS_BLENDOPALPHA]: BLENDOP_ADD,
                [RS_SRCBLENDALPHA]: BLEND_SRCALPHA,
                [RS_DESTBLENDALPHA]: BLEND_INVSRCALPHA,
            }
        };

        this._alphaTestState = {
            dirty: false,
            states: {
                [RS_ALPHATESTENABLE]: 0,
                [RS_ALPHAREF]: -1,
                [RS_ALPHAFUNC]: CMP_GREATER,
                [RS_CLIPPING]: 0,
                [RS_CLIPPLANEENABLE]: 0
            }
        };

        this._depthOffsetState = {
            dirty: false,
            states: {
                [RS_SLOPESCALEDEPTHBIAS]: 0,
                [RS_DEPTHBIAS]: 0
            }
        };

        this._shadowStateBuffer = new Float32Array(24);


        return this.glVersion;
    }

    /**
     * Schedules a function to be called per tick
     * @param {Function} func
     */
    Schedule(func)
    {
        if (!this._scheduled.includes(func))
        {
            this._scheduled.push(func);
        }
    }

    /**
     * Handles resize events
     */
    Resize()
    {
        const vrEnabled = this.vrDisplay && this.vrDisplay['isPresenting'];
        if (vrEnabled)
        {
            const
                leftEye = this.vrDisplay['getEyeParameters']('left'),
                rightEye = this.vrDisplay['getEyeParameters']('right');

            this.canvas.width = Math.max(leftEye['renderWidth'], rightEye['renderWidth']) * 2;
            this.canvas.height = Math.max(rightEye['renderHeight'], rightEye['renderHeight']);
        }
        else
        {
            this.canvas.width = this.canvas.offsetWidth * this.viewportPixelRatio;
            this.canvas.height = this.canvas.offsetHeight * this.viewportPixelRatio;
        }

        this.viewportWidth = this.canvas.clientWidth;
        this.viewportHeight = this.canvas.clientHeight;
        this.viewportAspect = this.viewportWidth / this.viewportHeight;

        store.SetVariableValue('ViewportSize', [
            this.viewportWidth,
            this.viewportHeight,
            this.viewportWidth,
            this.viewportHeight
        ]);

        this.emit('resized', {
            width: this.viewportWidth,
            height: this.viewportHeight,
            aspect: this.viewportAspect,
            source: vrEnabled ? this.vrDisplay : this.canvas
        });
    }

    /**
     * Per frame Tick
     */
    Tick()
    {
        if (this.canvas.clientWidth !== this.viewportWidth || this.canvas.clientHeight !== this.viewportHeight)
        {
            this.Resize();
        }

        const
            previousTime = this.previousTime === null ? 0 : this.previousTime,
            now = this.Now();

        this.currentTime = (now - this.startTime) * 0.001;
        this.dt = this.previousTime === null ? 0 : (now - this.previousTime) * 0.001;
        this.previousTime = now;

        store.SetVariableValue('Time', [
            this.currentTime,
            this.currentTime - Math.floor(this.currentTime),
            this.frameCounter,
            previousTime
        ]);

        this.emit('tick', {
            dt: this.dt,
            previous: previousTime,
            current: this.currentTime,
            frame: this.frameCounter
        });

        resMan.PrepareLoop(this.dt);

        for (let i = 0; i < this._scheduled.length; ++i)
        {
            if (!this._scheduled[i](this.dt))
            {
                this._scheduled.splice(i, 1);
                --i;
            }
        }

        this.frameCounter++;
    }

    /**
     * Requests an animation frame
     * @param {Function} callback
     * @returns {number}
     */
    RequestAnimationFrame(callback)
    {
        return this.vrDisplay ? this.vrDisplay.requestAnimationFrame(callback) : Tw2Device.RequestAnimationFrame(callback);
    }

    /**
     * Cancels an animation frame
     * @param id
     * @returns {*}
     */
    CancelAnimationFrame(id)
    {
        return this.vrDisplay ? this.vrDisplay.cancelAnimationFrame(id) : Tw2Device.CancelAnimationFrame(id);
    }

    /**
     * Sets World transform matrix
     * @param {mat4} matrix
     */
    SetWorld(matrix)
    {
        mat4.copy(this.world, matrix);
        //mat4.inverse(this.worldInverse, this.world);
    }

    /**
     * Sets view matrix
     * @param {mat4} matrix
     */
    SetView(matrix)
    {
        mat4.copy(this.view, matrix);
        mat4.invert(this.viewInverse, this.view);
        mat4.transpose(this.viewTranspose, this.view);
        mat4.getTranslation(this.eyePosition, this.viewInverse);
        this.UpdateViewProjection();
    }

    /**
     * Sets projection matrix
     * @param {mat4} matrix
     * @param {boolean} [forceUpdateViewProjection]
     */
    SetProjection(matrix, forceUpdateViewProjection)
    {
        mat4.copy(this.projection, matrix);
        mat4.transpose(this.projectionTranspose, this.projection);
        mat4.invert(this.projectionInverse, this.projection);
        this.GetTargetResolution(this.targetResolution);
        if (forceUpdateViewProjection) this.UpdateViewProjection();
    }

    /**
     * Updates view projection matrices
     */
    UpdateViewProjection()
    {
        mat4.multiply(this.viewProjection, this.projection, this.view);
        mat4.transpose(this.viewProjectionTranspose, this.viewProjection);
        store.SetVariableValue('ViewProjectionMat', this.viewProjection);
    }

    /**
     * Gets the device's target resolution
     * @param {vec4} [out=vec4.create()]
     * @returns {vec4} out
     */
    GetTargetResolution(out = vec4.create())
    {
        const aspectRatio = this.projection[0] ? this.projection[5] / this.projection[0] : 0.0;
        let aspectAdjustment = 1.0;
        if (aspectRatio > 1.6) aspectAdjustment = aspectRatio / 1.6;
        const fov = 2.0 * Math.atan(aspectAdjustment / this.projection[5]);
        out[0] = this.viewportWidth;
        out[1] = this.viewportHeight;
        out[2] = fov;
        out[3] = fov * aspectRatio;
        return out;
    }

    /**
     * GetEyePosition
     * @param {vec3} [out=vec3.create()]
     * @return {vec3}
     */
    GetEyePosition(out = vec3.create())
    {
        return vec3.copy(out, this.eyePosition);
    }

    /**
     * Returns whether or not Alpha Test is enabled
     * return {Boolean}
     */
    IsAlphaTestEnabled()
    {
        return this._alphaTestState.states[RS_ALPHATESTENABLE];
    }

    /**
     * Checks if a frame buffer is complete
     *
     * @param frameBuffer
     * @returns {boolean}
     */
    IsFrameBufferComplete(frameBuffer)
    {
        return this.gl.checkFramebufferStatus(frameBuffer) === this.gl.FRAMEBUFFER_COMPLETE;
    }

    /**
     * Gets a gl extension
     * @param {string} extension - The gl extension name
     * @returns{*}
     */
    GetExtension(extension)
    {
        for (let i = 0; i < VendorWebglPrefixes.length; i++)
        {
            const ext = this.gl.getExtension(VendorWebglPrefixes[i] + extension);
            if (ext) return ext;
        }
        return null;
    }

    /**
     * Gets a fallback texture
     * @returns {*}
     */
    GetFallbackTexture()
    {
        if (!this._fallbackTexture)
        {
            this._fallbackTexture = this.CreateSolidTexture();
        }
        return this._fallbackTexture;
    }

    /**
     * Gets a fallback cube map
     * @returns {*}
     */
    GetFallbackCubeMap()
    {
        if (!this._fallbackCube)
        {
            this._fallbackCube = this.CreateSolidCube();
        }
        return this._fallbackCube;
    }

    /**
     * Creates a solid colored texture
     * @param {vec4|Array} [rgba] - The colour to create, if omitted defaults to completely transparent
     * @returns {WebGLTexture}
     */
    CreateSolidTexture(rgba = [0, 0, 0, 0])
    {
        const
            gl = this.gl,
            texture = this.gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(rgba));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return texture;
    }

    /**
     * Creates a solid coloured cube texture
     * @param {vec4|Array} rgba
     * @returns {WebGLTexture}
     */
    CreateSolidCube(rgba = [0, 0, 0, 0])
    {
        const
            gl = this.gl,
            texture = this.gl.createTexture();

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        for (let j = 0; j < 6; ++j)
        {
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + j, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(rgba));
        }
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        //gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
        return texture;
    }

    /**
     * RenderFullScreenQuad
     * @param {Tw2Effect} effect
     * @param {string} technique - Technique name
     * @returns {boolean}
     */
    RenderFullScreenQuad(effect, technique = 'Main')
    {
        if (!effect || !effect.IsGood()) return false;

        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this._quadBuffer);
        for (let pass = 0; pass < effect.GetPassCount(technique); ++pass)
        {
            effect.ApplyPass(technique, pass);
            if (!this._quadDecl.SetDeclaration(effect.GetPassInput(technique, pass), 24)) return false;
            this.ApplyShadowState();
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        return true;
    }

    /**
     * Renders a Texture to the screen
     * @param {Tw2TextureRes} texture
     * @returns {boolean}
     */
    RenderTexture(texture)
    {
        if (this._blitEffect === null)
        {
            this._blitEffect = Tw2Effect.create({
                effectFilePath: 'res:/graphics/effect/managed/space/system/blit.fx',
                textures: {
                    BlitSource: ''
                }
            });
        }

        this._blitEffect.parameters['BlitSource'].SetTextureRes(texture);
        return this.RenderFullScreenQuad(this._blitEffect);
    }

    /**
     * RenderCameraSpaceQuad
     * @param {Tw2Effect} effect
     * @param {string} technique - Technique name
     * @returns {boolean}
     */
    RenderCameraSpaceQuad(effect, technique = 'Main')
    {
        if (!effect || !effect.IsGood()) return false;

        const vertices = new Float32Array([
            1.0, 1.0, 0.0, 1.0, 1.0, 1.0, -1.0, 1.0, 0.0, 1.0, 0.0, 1.0,
            1.0, -1.0, 0.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, 0.0, 0.0
        ]);

        const projInv = this.projectionInverse;
        for (let i = 0; i < 4; ++i)
        {
            const vec = vertices.subarray(i * 6, i * 6 + 4);
            vec4.transformMat4(vec, vec, projInv);
            vec3.scale(vec, vec, 1 / vec[3]);
            vec[3] = 1;
        }

        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this._cameraQuadBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        for (let pass = 0; pass < effect.GetPassCount(technique); ++pass)
        {
            effect.ApplyPass(technique, pass);
            if (!this._quadDecl.SetDeclaration(effect.GetPassInput(technique, pass), 24)) return false;
            this.ApplyShadowState();
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        return true;
    }

    /**
     * Set a render state
     * @param state
     * @param value
     */
    SetRenderState(state, value)
    {
        const gl = this.gl;
        this._currentRenderMode = RM_ANY;

        switch (state)
        {
            case RS_ZENABLE:
                if (value)
                {
                    gl.enable(gl.DEPTH_TEST);
                }
                else
                {
                    gl.disable(gl.DEPTH_TEST);
                }
                return;

            case RS_ZWRITEENABLE:
                gl.depthMask(!!value);
                return;

            case RS_ALPHATESTENABLE:
            case RS_ALPHAREF:
            case RS_ALPHAFUNC:
            case RS_CLIPPING:
            case RS_CLIPPLANEENABLE:
                if (this._alphaTestState[state] !== value)
                {
                    this._alphaTestState.states[state] = value;
                    this._alphaTestState.dirty = true;
                }
                return;

            case RS_SRCBLEND:
            case RS_DESTBLEND:
            case RS_BLENDOP:
            case RS_SEPARATEALPHABLENDENABLE:
            case RS_BLENDOPALPHA:
            case RS_SRCBLENDALPHA:
            case RS_DESTBLENDALPHA:
                if (this._alphaBlendState[state] !== value)
                {
                    this._alphaBlendState.states[state] = value;
                    this._alphaBlendState.dirty = true;
                }
                return;

            case RS_CULLMODE:
                switch (value)
                {
                    case CULL_NONE:
                        gl.disable(gl.CULL_FACE);
                        return;

                    case CULL_CW:
                        gl.enable(gl.CULL_FACE);
                        gl.cullFace(gl.FRONT);
                        return;

                    case CULL_CCW:
                        gl.enable(gl.CULL_FACE);
                        gl.cullFace(gl.BACK);
                        return;
                }
                return;

            case RS_ZFUNC:
                gl.depthFunc(0x0200 + value - 1);
                return;

            case RS_ALPHABLENDENABLE:
                if (value) gl.enable(gl.BLEND);
                else gl.disable(gl.BLEND);
                return;

            case RS_COLORWRITEENABLE:
                gl.colorMask((value & 1) !== 0, (value & 2) !== 0, (value & 4) !== 0, (value & 8) !== 0);
                return;

            case RS_SCISSORTESTENABLE:
                if (value) gl.enable(gl.SCISSOR_TEST);
                else gl.disable(gl.SCISSOR_TEST);
                return;

            case RS_SLOPESCALEDEPTHBIAS:
            case RS_DEPTHBIAS:
                value = num.dwordToFloat(value);
                if (this._depthOffsetState[state] !== value)
                {
                    this._depthOffsetState.states[state] = value;
                    this._depthOffsetState.dirty = true;
                }
                return;
        }
    }

    /**
     * ApplyShadowState
     */
    ApplyShadowState()
    {
        const gl = this.gl;

        if (this._alphaBlendState.dirty)
        {
            let blendOp = gl.FUNC_ADD;
            if (this._alphaBlendState.states[RS_BLENDOP] === BLENDOP_SUBTRACT)
            {
                blendOp = gl.FUNC_SUBTRACT;
            }
            else if (this._alphaBlendState.states[RS_BLENDOP] === BLENDOP_REVSUBTRACT)
            {
                blendOp = gl.FUNC_REVERSE_SUBTRACT;
            }

            const
                srcBlend = BlendTable[this._alphaBlendState.states[RS_SRCBLEND]],
                destBlend = BlendTable[this._alphaBlendState.states[RS_DESTBLEND]];

            if (this._alphaBlendState.states[RS_SEPARATEALPHABLENDENABLE])
            {
                let blendOpAlpha = gl.FUNC_ADD;
                if (this._alphaBlendState.states[RS_BLENDOP] === BLENDOP_SUBTRACT)
                {
                    blendOpAlpha = gl.FUNC_SUBTRACT;
                }
                else if (this._alphaBlendState.states[RS_BLENDOP] === BLENDOP_REVSUBTRACT)
                {
                    blendOpAlpha = gl.FUNC_REVERSE_SUBTRACT;
                }

                const
                    srcBlendAlpha = BlendTable[this._alphaBlendState.states[RS_SRCBLENDALPHA]],
                    destBlendAlpha = BlendTable[this._alphaBlendState.states[RS_DESTBLENDALPHA]];

                gl.blendEquationSeparate(blendOp, blendOpAlpha);
                gl.blendFuncSeparate(srcBlend, destBlend, srcBlendAlpha, destBlendAlpha);
            }
            else
            {
                gl.blendEquation(blendOp);
                gl.blendFunc(srcBlend, destBlend);
            }
            this._alphaBlendState.dirty = false;
        }

        if (this._depthOffsetState.dirty)
        {
            gl.polygonOffset(
                this._depthOffsetState.states[RS_SLOPESCALEDEPTHBIAS],
                this._depthOffsetState.states[RS_DEPTHBIAS]);
            this._depthOffsetState.dirty = false;
        }

        let alphaTestFunc,
            invertedAlphaTest,
            alphaTestRef;

        if (this.shadowHandles && this._alphaTestState.states[RS_ALPHATESTENABLE])
        {
            switch (this._alphaTestState.states[RS_ALPHAFUNC])
            {
                case CMP_NEVER:
                    alphaTestFunc = 0;
                    invertedAlphaTest = 1;
                    alphaTestRef = -256;
                    break;

                case CMP_LESS:
                    alphaTestFunc = 0;
                    invertedAlphaTest = -1;
                    alphaTestRef = this._alphaTestState.states[RS_ALPHAREF] - 1;
                    break;

                case CMP_EQUAL:
                    alphaTestFunc = 1;
                    invertedAlphaTest = 0;
                    alphaTestRef = this._alphaTestState.states[RS_ALPHAREF];
                    break;

                case CMP_LEQUAL:
                    alphaTestFunc = 0;
                    invertedAlphaTest = -1;
                    alphaTestRef = this._alphaTestState.states[RS_ALPHAREF];
                    break;

                case CMP_GREATER:
                    alphaTestFunc = 0;
                    invertedAlphaTest = 1;
                    alphaTestRef = -this._alphaTestState.states[RS_ALPHAREF] - 1;
                    break;

                    /*
                case CMP_NOTEQUAL:
                    var alphaTestFunc = 1;
                    var invertedAlphaTest = 1;
                    var alphaTestRef = this._alphaTestState.states[RS_ALPHAREF];
                    break;
                    */

                case CMP_GREATEREQUAL:
                    alphaTestFunc = 0;
                    invertedAlphaTest = 1;
                    alphaTestRef = -this._alphaTestState.states[RS_ALPHAREF];
                    break;

                default:
                    alphaTestFunc = 0;
                    invertedAlphaTest = 0;
                    alphaTestRef = 1;
                    break;
            }

            const clipPlaneEnable = 0;
            gl.uniform4f(
                this.shadowHandles.shadowStateInt,
                invertedAlphaTest,
                alphaTestRef,
                alphaTestFunc,
                clipPlaneEnable);
            //this._shadowStateBuffers
        }
    }

    /**
     * Sets a render mode
     * @param {number} renderMode
     */
    SetStandardStates(renderMode)
    {
        if (this._currentRenderMode === renderMode) return;

        this.gl.frontFace(this.gl.CW);
        switch (renderMode)
        {
            case RM_OPAQUE:
            case RM_PICKABLE:
            case RM_DISTORTION:
                this.SetRenderState(RS_ZENABLE, true);
                this.SetRenderState(RS_ZWRITEENABLE, true);
                this.SetRenderState(RS_ZFUNC, CMP_LEQUAL);
                this.SetRenderState(RS_CULLMODE, CULL_CW);
                this.SetRenderState(RS_ALPHABLENDENABLE, false);
                this.SetRenderState(RS_ALPHATESTENABLE, false);
                this.SetRenderState(RS_SEPARATEALPHABLENDENABLE, false);
                this.SetRenderState(RS_SLOPESCALEDEPTHBIAS, 0);
                this.SetRenderState(RS_DEPTHBIAS, 0);
                this.SetRenderState(RS_COLORWRITEENABLE, 0xf);
                break;

            case RM_DECAL:
                this.SetRenderState(RS_ALPHABLENDENABLE, false);
                this.SetRenderState(RS_ALPHATESTENABLE, true);
                this.SetRenderState(RS_ALPHAFUNC, CMP_GREATER);
                this.SetRenderState(RS_ALPHAREF, 127);
                this.SetRenderState(RS_ZENABLE, true);
                this.SetRenderState(RS_ZWRITEENABLE, true);
                this.SetRenderState(RS_ZFUNC, CMP_LEQUAL);
                this.SetRenderState(RS_CULLMODE, CULL_CW);
                this.SetRenderState(RS_BLENDOP, BLENDOP_ADD);
                this.SetRenderState(RS_SLOPESCALEDEPTHBIAS, 0);
                this.SetRenderState(RS_DEPTHBIAS, 0);
                this.SetRenderState(RS_SEPARATEALPHABLENDENABLE, false);
                this.SetRenderState(RS_COLORWRITEENABLE, 0xf);
                break;

            case RM_TRANSPARENT:
                this.SetRenderState(RS_CULLMODE, CULL_CW);
                this.SetRenderState(RS_ALPHABLENDENABLE, true);
                this.SetRenderState(RS_SRCBLEND, BLEND_SRCALPHA);
                this.SetRenderState(RS_DESTBLEND, BLEND_INVSRCALPHA);
                this.SetRenderState(RS_BLENDOP, BLENDOP_ADD);
                this.SetRenderState(RS_ZENABLE, true);
                this.SetRenderState(RS_ZWRITEENABLE, false);
                this.SetRenderState(RS_ZFUNC, CMP_LEQUAL);
                this.SetRenderState(RS_ALPHATESTENABLE, false);
                this.SetRenderState(RS_SLOPESCALEDEPTHBIAS, 0); // -1.0
                this.SetRenderState(RS_DEPTHBIAS, 0);
                this.SetRenderState(RS_SEPARATEALPHABLENDENABLE, false);
                this.SetRenderState(RS_COLORWRITEENABLE, 0xf);
                break;

            case RM_ADDITIVE:
                this.SetRenderState(RS_CULLMODE, CULL_NONE);
                this.SetRenderState(RS_ALPHABLENDENABLE, true);
                this.SetRenderState(RS_SRCBLEND, BLEND_ONE);
                this.SetRenderState(RS_DESTBLEND, BLEND_ONE);
                this.SetRenderState(RS_BLENDOP, BLENDOP_ADD);
                this.SetRenderState(RS_ZENABLE, true);
                this.SetRenderState(RS_ZWRITEENABLE, false);
                this.SetRenderState(RS_ZFUNC, CMP_LEQUAL);
                this.SetRenderState(RS_ALPHATESTENABLE, false);
                this.SetRenderState(RS_SLOPESCALEDEPTHBIAS, 0);
                this.SetRenderState(RS_DEPTHBIAS, 0);
                this.SetRenderState(RS_SEPARATEALPHABLENDENABLE, false);
                this.SetRenderState(RS_COLORWRITEENABLE, 0xf);
                break;

            case RM_FULLSCREEN:
                this.SetRenderState(RS_ALPHABLENDENABLE, false);
                this.SetRenderState(RS_ALPHATESTENABLE, false);
                this.SetRenderState(RS_CULLMODE, CULL_NONE);
                this.SetRenderState(RS_ZENABLE, false);
                this.SetRenderState(RS_ZWRITEENABLE, false);
                this.SetRenderState(RS_ZFUNC, CMP_ALWAYS);
                this.SetRenderState(RS_SLOPESCALEDEPTHBIAS, 0);
                this.SetRenderState(RS_DEPTHBIAS, 0);
                this.SetRenderState(RS_SEPARATEALPHABLENDENABLE, false);
                this.SetRenderState(RS_COLORWRITEENABLE, 0xf);
                break;

            default:
                return;
        }

        this._currentRenderMode = renderMode;
    }

    /**
     * Creates webgl context
     * @param {HTMLCanvasElement} canvas
     * @param {*} params
     * @param {boolean} [enableWebgl2]
     * @returns {{gl: *, version: number}}
     */
    static CreateContext(canvas, params, enableWebgl2)
    {
        /**
         * Creates a gl context
         * @param {HTMLCanvasElement} canvas
         * @param {*} [params]
         * @param {*} [contextNames]
         * @returns {*}
         */
        function create(canvas, params, contextNames)
        {
            contextNames = Array.isArray(contextNames) ? contextNames : [contextNames];
            for (let i = 0; i < contextNames.length; i++)
            {
                try
                {
                    return canvas.getContext(contextNames[i], params);
                }
                catch (err)
                {
                    /* eslint-disable-line no-empty */
                }
            }
            return null;
        }

        let gl = null,
            version= WebglVersion.NONE;

        if (enableWebgl2)
        {
            gl = create(canvas, params, Webgl2ContextNames);
            if (gl) version = WebglVersion.WEBGL2;
        }

        if (!gl)
        {
            gl = create(canvas, params, WebglContextNames);
            if (gl) version = WebglVersion.WEBGL;
        }

        return { gl, version };
    }

    /**
     * The constructor used to generate the time
     * @type {DateConstructor}
     */
    static Clock = Date;

    /**
     * Requests an animation frame
     * @type {Function}
     */
    static RequestAnimationFrame = (function()
    {
        const request = get(window, VendorRequestAnimationFrame);
        return function(callback)
        {
            return request(callback);
        };
    })();

    /**
     * Cancels an animation frame
     * @type {Function}
     */
    static CancelAnimationFrame = (function()
    {
        const cancel = get(window, VendorCancelAnimationFrame);
        return function (id)
        {
            return cancel(id);
        };
    })();

    /**
     * Class category
     * @type {string}
     */
    static category = 'device';

}

// Render Modes
Tw2Device.prototype.RM_ANY = RM_ANY;
Tw2Device.prototype.RM_OPAQUE = RM_OPAQUE;
Tw2Device.prototype.RM_DECAL = RM_DECAL;
Tw2Device.prototype.RM_TRANSPARENT = RM_TRANSPARENT;
Tw2Device.prototype.RM_ADDITIVE = RM_ADDITIVE;
Tw2Device.prototype.RM_DEPTH = RM_DEPTH;
Tw2Device.prototype.RM_DISTORTION = RM_DISTORTION;
Tw2Device.prototype.RM_FULLSCREEN = RM_FULLSCREEN;
Tw2Device.prototype.RM_PICKABLE = RM_PICKABLE;
Tw2Device.prototype.RM_DISTORTION = RM_DISTORTION;


export const device = new Tw2Device();
