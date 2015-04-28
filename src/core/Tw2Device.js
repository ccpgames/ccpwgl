// Tw2Device - creating WebGL context, some global rendering variables, 
// utility functions

window.requestAnimFrame = (function() {
  return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         window.oRequestAnimationFrame ||
         window.msRequestAnimationFrame ||
         function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
           window.setTimeout(callback, 1000/60);
         };
})();

function Tw2Device()
{
    this.RM_ANY = -1;
    this.RM_OPAQUE = 0;
    this.RM_DECAL = 1;
    this.RM_TRANSPARENT = 2;
    this.RM_ADDITIVE = 3;
    this.RM_DEPTH = 4;
    this.RM_FULLSCREEN = 5;
    
    
    this.RS_ZENABLE                   = 7;    /* D3DZBUFFERTYPE (or TRUE/FALSE for legacy) */
    this.RS_FILLMODE                  = 8;    /* D3DFILLMODE */
    this.RS_SHADEMODE                 = 9;    /* D3DSHADEMODE */
    this.RS_ZWRITEENABLE              = 14;   /* TRUE to enable z writes */
    this.RS_ALPHATESTENABLE           = 15;   /* TRUE to enable alpha tests */
    this.RS_LASTPIXEL                 = 16;   /* TRUE for last-pixel on lines */
    this.RS_SRCBLEND                  = 19;   /* D3DBLEND */
    this.RS_DESTBLEND                 = 20;   /* D3DBLEND */
    this.RS_CULLMODE                  = 22;   /* D3DCULL */
    this.RS_ZFUNC                     = 23;   /* D3DCMPFUNC */
    this.RS_ALPHAREF                  = 24;   /* D3DFIXED */
    this.RS_ALPHAFUNC                 = 25;   /* D3DCMPFUNC */
    this.RS_DITHERENABLE              = 26;   /* TRUE to enable dithering */
    this.RS_ALPHABLENDENABLE          = 27;   /* TRUE to enable alpha blending */
    this.RS_FOGENABLE                 = 28;   /* TRUE to enable fog blending */
    this.RS_SPECULARENABLE            = 29;   /* TRUE to enable specular */
    this.RS_FOGCOLOR                  = 34;   /* D3DCOLOR */
    this.RS_FOGTABLEMODE              = 35;   /* D3DFOGMODE */
    this.RS_FOGSTART                  = 36;   /* Fog start (for both vertex and pixel fog) */
    this.RS_FOGEND                    = 37;   /* Fog end      */
    this.RS_FOGDENSITY                = 38;   /* Fog density  */
    this.RS_RANGEFOGENABLE            = 48;   /* Enables range-based fog */
    this.RS_STENCILENABLE             = 52;   /* BOOL enable/disable stenciling */
    this.RS_STENCILFAIL               = 53;   /* D3DSTENCILOP to do if stencil test fails */
    this.RS_STENCILZFAIL              = 54;   /* D3DSTENCILOP to do if stencil test passes and Z test fails */
    this.RS_STENCILPASS               = 55;   /* D3DSTENCILOP to do if both stencil and Z tests pass */
    this.RS_STENCILFUNC               = 56;   /* D3DCMPFUNC fn.  Stencil Test passes if ((ref & mask) stencilfn (stencil & mask)) is true */
    this.RS_STENCILREF                = 57;   /* Reference value used in stencil test */
    this.RS_STENCILMASK               = 58;   /* Mask value used in stencil test */
    this.RS_STENCILWRITEMASK          = 59;   /* Write mask applied to values written to stencil buffer */
    this.RS_TEXTUREFACTOR             = 60;   /* D3DCOLOR used for multi-texture blend */
    this.RS_WRAP0                     = 128;  /* wrap for 1st texture coord. set */
    this.RS_WRAP1                     = 129;  /* wrap for 2nd texture coord. set */
    this.RS_WRAP2                     = 130;  /* wrap for 3rd texture coord. set */
    this.RS_WRAP3                     = 131;  /* wrap for 4th texture coord. set */
    this.RS_WRAP4                     = 132;  /* wrap for 5th texture coord. set */
    this.RS_WRAP5                     = 133;  /* wrap for 6th texture coord. set */
    this.RS_WRAP6                     = 134;  /* wrap for 7th texture coord. set */
    this.RS_WRAP7                     = 135;  /* wrap for 8th texture coord. set */
    this.RS_CLIPPING                  = 136;
    this.RS_LIGHTING                  = 137;
    this.RS_AMBIENT                   = 139;
    this.RS_FOGVERTEXMODE             = 140;
    this.RS_COLORVERTEX               = 141;
    this.RS_LOCALVIEWER               = 142;
    this.RS_NORMALIZENORMALS          = 143;
    this.RS_DIFFUSEMATERIALSOURCE     = 145;
    this.RS_SPECULARMATERIALSOURCE    = 146;
    this.RS_AMBIENTMATERIALSOURCE     = 147;
    this.RS_EMISSIVEMATERIALSOURCE    = 148;
    this.RS_VERTEXBLEND               = 151;
    this.RS_CLIPPLANEENABLE           = 152;
    this.RS_POINTSIZE                 = 154;   /* float point size */
    this.RS_POINTSIZE_MIN             = 155;   /* float point size min threshold */
    this.RS_POINTSPRITEENABLE         = 156;   /* BOOL point texture coord control */
    this.RS_POINTSCALEENABLE          = 157;   /* BOOL point size scale enable */
    this.RS_POINTSCALE_A              = 158;   /* float point attenuation A value */
    this.RS_POINTSCALE_B              = 159;   /* float point attenuation B value */
    this.RS_POINTSCALE_C              = 160;   /* float point attenuation C value */
    this.RS_MULTISAMPLEANTIALIAS      = 161;  // BOOL - set to do FSAA with multisample buffer
    this.RS_MULTISAMPLEMASK           = 162;  // DWORD - per-sample enable/disable
    this.RS_PATCHEDGESTYLE            = 163;  // Sets whether patch edges will use float style tessellation
    this.RS_DEBUGMONITORTOKEN         = 165;  // DEBUG ONLY - token to debug monitor
    this.RS_POINTSIZE_MAX             = 166;   /* float point size max threshold */
    this.RS_INDEXEDVERTEXBLENDENABLE  = 167;
    this.RS_COLORWRITEENABLE          = 168;  // per-channel write enable
    this.RS_TWEENFACTOR               = 170;   // float tween factor
    this.RS_BLENDOP                   = 171;   // D3DBLENDOP setting
    this.RS_POSITIONDEGREE            = 172;   // NPatch position interpolation degree. D3DDEGREE_LINEAR or D3DDEGREE_CUBIC (default)
    this.RS_NORMALDEGREE              = 173;   // NPatch normal interpolation degree. D3DDEGREE_LINEAR (default) or D3DDEGREE_QUADRATIC
    this.RS_SCISSORTESTENABLE         = 174;
    this.RS_SLOPESCALEDEPTHBIAS       = 175;
    this.RS_ANTIALIASEDLINEENABLE     = 176;
    this.RS_TWOSIDEDSTENCILMODE       = 185;   /* BOOL enable/disable 2 sided stenciling */
    this.RS_CCW_STENCILFAIL           = 186;   /* D3DSTENCILOP to do if ccw stencil test fails */
    this.RS_CCW_STENCILZFAIL          = 187;   /* D3DSTENCILOP to do if ccw stencil test passes and Z test fails */
    this.RS_CCW_STENCILPASS           = 188;   /* D3DSTENCILOP to do if both ccw stencil and Z tests pass */
    this.RS_CCW_STENCILFUNC           = 189;   /* D3DCMPFUNC fn.  ccw Stencil Test passes if ((ref & mask) stencilfn (stencil & mask)) is true */
    this.RS_COLORWRITEENABLE1         = 190;   /* Additional ColorWriteEnables for the devices that support D3DPMISCCAPS_INDEPENDENTWRITEMASKS */
    this.RS_COLORWRITEENABLE2         = 191;   /* Additional ColorWriteEnables for the devices that support D3DPMISCCAPS_INDEPENDENTWRITEMASKS */
    this.RS_COLORWRITEENABLE3         = 192;   /* Additional ColorWriteEnables for the devices that support D3DPMISCCAPS_INDEPENDENTWRITEMASKS */
    this.RS_BLENDFACTOR               = 193;   /* D3DCOLOR used for a constant blend factor during alpha blending for devices that support D3DPBLENDCAPS_BLENDFACTOR */
    this.RS_SRGBWRITEENABLE           = 194;   /* Enable rendertarget writes to be DE-linearized to SRGB (for formats that expose D3DUSAGE_QUERY_SRGBWRITE) */
    this.RS_DEPTHBIAS                 = 195;
    this.RS_SEPARATEALPHABLENDENABLE  = 206;  /* TRUE to enable a separate blending function for the alpha channel */
    this.RS_SRCBLENDALPHA             = 207;  /* SRC blend factor for the alpha channel when RS_SEPARATEDESTALPHAENABLE is TRUE */
    this.RS_DESTBLENDALPHA            = 208;  /* DST blend factor for the alpha channel when RS_SEPARATEDESTALPHAENABLE is TRUE */
    this.RS_BLENDOPALPHA              = 209;  /* Blending operation for the alpha channel when RS_SEPARATEDESTALPHAENABLE is TRUE */
    
    this.CULL_NONE                    = 1;
    this.CULL_CW                      = 2;
    this.CULL_CCW                     = 3;

    this.CMP_NEVER                    = 1;
    this.CMP_LESS                     = 2;
    this.CMP_EQUAL                    = 3;
    this.CMP_LEQUAL                   = 4;
    this.CMP_GREATER                  = 5;
    this.CMP_NOTEQUAL                 = 6;
    this.CMP_GREATEREQUAL             = 7;
    this.CMP_ALWAYS                   = 8;
    
    this.BLEND_ZERO                   = 1;
    this.BLEND_ONE                    = 2;
    this.BLEND_SRCCOLOR               = 3;
    this.BLEND_INVSRCCOLOR            = 4;
    this.BLEND_SRCALPHA               = 5;
    this.BLEND_INVSRCALPHA            = 6;
    this.BLEND_DESTALPHA              = 7;
    this.BLEND_INVDESTALPHA           = 8;
    this.BLEND_DESTCOLOR              = 9;
    this.BLEND_INVDESTCOLOR           = 10;
    this.BLEND_SRCALPHASAT            = 11;
    this.BLEND_BOTHSRCALPHA           = 12;
    this.BLEND_BOTHINVSRCALPHA        = 13;
    this.BLEND_BLENDFACTOR            = 14;
    this.BLEND_INVBLENDFACTOR         = 15;


    this.gl = null;
    this.debugMode = false;
    this.mipLevelSkipCount = 0;
    this.shaderModel = 'hi';
    this.enableAnisotropicFiltering = true;
    this.effectDir = "/effect.gles2/";

    this._scheduled = [];
    this._quadBuffer = null;
    this._cameraQuadBuffer = null;
    this._currentRenderMode = null;
    this._whiteTexture = null;
    this._whiteCube = null;
    
    this.world = mat4.create();
    mat4.identity(this.world);
    this.worldInverse = mat4.create();
    mat4.identity(this.worldInverse);
    this.view = mat4.create();
    mat4.identity(this.view);
    this.viewInv = mat4.create();
    mat4.identity(this.viewInv);
    this.projection = mat4.create();
    mat4.identity(this.projection);
    this.eyePosition = vec3.create();
    
    this.perObjectData = null;
    
    variableStore.RegisterVariable('WorldMat', this.world);
    variableStore.RegisterVariable('ViewMat', this.view);
    variableStore.RegisterVariable('ProjectionMat', this.projection);
    variableStore.RegisterType('ViewProjectionMat', Tw2MatrixParameter);
    variableStore.RegisterType('ViewportSize', Tw2Vector4Parameter);
    variableStore.RegisterType('Time', Tw2Vector4Parameter);
    
    this.frameCounter = 0;
    this.startTime = new Date();

    this.CreateDevice = function (canvas, params)
    {
        this.gl = null;
        try
        {
            this.gl = canvas.getContext("webgl", params) || canvas.getContext("experimental-webgl", params);
        }
        catch (e)
        {
        }
        if (!this.gl)
        {
            console.error("Could not initialise WebGL");
            return false;
        }
        else
        {
            if (this.debugMode)
            {
                this.gl = WebGLDebugUtils.makeDebugContext(this.gl);
            }
        }

        this.gl.getExtension("OES_standard_derivatives");
        this.gl.getExtension("OES_element_index_uint");

        this.alphaBlendBackBuffer = !params || typeof (params.alpha) == 'undefined' || params.alpha;
        this.msaaSamples = this.gl.getParameter(this.gl.SAMPLES);
        this.antialiasing = this.msaaSamples > 1;

        this.anisotropicFilter = this.gl.getExtension('EXT_texture_filter_anisotropic') ||
            this.gl.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
            this.gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
        if (this.anisotropicFilter)
        {
            this.anisotropicFilter.maxAnisotropy = this.gl.getParameter(this.anisotropicFilter.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
        }

        this.shaderTextureLod = this.gl.getExtension("EXT_shader_texture_lod");
        this.shaderBinary = this.gl.getExtension("CCP_shader_binary");
        this.useBinaryShaders = false;
        this.effectDir = "/effect.gles2/";
        if (this.shaderBinary)
        {
            var renderer = this.gl.getParameter(this.gl.RENDERER);
            var maliVer = renderer.match(/Mali-(\w+).*/);
            if (maliVer)
            {
                this.effectDir = "/effect.gles2.mali" + maliVer[1] + "/";
                this.useBinaryShaders = true;
            }
        }

        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        this.viewportWidth = canvas.clientWidth;
        this.viewportHeight = canvas.clientHeight;
        this.canvas = canvas;

        var self = this;


        this._quadBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._quadBuffer);

        var vertices = [
            1.0, 1.0, 0.0, 1.0, 1.0, 1.0,
            -1.0, 1.0, 0.0, 1.0, 0.0, 1.0,
            1.0, -1.0, 0.0, 1.0, 1.0, 0.0,
            -1.0, -1.0, 0.0, 1.0, 0.0, 0.0
        ];

        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

        this._cameraQuadBuffer = this.gl.createBuffer();


        this._quadDecl = new Tw2VertexDeclaration();
        this._quadDecl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_POSITION, 0, this.gl.FLOAT, 4, 0));
        this._quadDecl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 0, this.gl.FLOAT, 2, 16));
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

        this._blendTable = [
            -1,                                 // --
            this.gl.ZERO,                   // D3DBLEND_ZERO
            this.gl.ONE,                    // D3DBLEND_ONE
            this.gl.SRC_COLOR,              // D3DBLEND_SRCCOLOR
            this.gl.ONE_MINUS_SRC_COLOR,    // D3DBLEND_INVSRCCOLOR
            this.gl.SRC_ALPHA,              // D3DBLEND_SRCALPHA
            this.gl.ONE_MINUS_SRC_ALPHA,    // D3DBLEND_INVSRCALPHA
            this.gl.DST_ALPHA,              // D3DBLEND_DESTALPHA
            this.gl.ONE_MINUS_DST_ALPHA,    // D3DBLEND_INVDESTALPHA
            this.gl.DST_COLOR,              // D3DBLEND_DESTCOLOR
            this.gl.ONE_MINUS_DST_COLOR,    // D3DBLEND_INVDESTCOLOR
            this.gl.SRC_ALPHA_SATURATE,         // D3DBLEND_SRCALPHASAT
            -1,                                 // D3DBLEND_BOTHSRCALPHA
            -1,                                 // D3DBLEND_BOTHINVSRCALPHA
            this.gl.CONSTANT_COLOR,             // D3DBLEND_BLENDFACTOR
            this.gl.ONE_MINUS_CONSTANT_COLOR    // D3DBLEND_INVBLENDFACTOR
            ];

        this._shadowStateBuffer = new Float32Array(24);

        this._prevTime = null;

        function tick()
        {
            requestAnimFrame(tick);
            self.Tick();
        }
        requestAnimFrame(tick);
        return true;
    };

    this.Schedule = function (render)
    {
        this._scheduled[this._scheduled.length] = render;
    };

    this.Tick = function ()
    {
        if (this.canvas.clientWidth != this.viewportWidth || 
            this.canvas.clientHeight != this.viewportHeight)
        {
            this.canvas.width = this.canvas.clientWidth;
            this.canvas.height = this.canvas.clientHeight;
            this.viewportWidth = this.canvas.clientWidth; 
            this.viewportHeight = this.canvas.clientHeight; 
        }

        var now = new Date();
        now = now.getTime();
        var currentTime = (now - this.startTime) * 0.001;
        var time = variableStore._variables['Time'].value;
        time[3] = time[0];
        time[0] = currentTime;
        time[1] = currentTime - Math.floor(currentTime);
        time[2] = this.frameCounter;
        
        var viewportSize = variableStore._variables['ViewportSize'].value;
        viewportSize[0] = this.viewportWidth;
        viewportSize[1] = this.viewportHeight;
        viewportSize[2] = this.viewportWidth;
        viewportSize[3] = this.viewportHeight;
        
        var dt = this._prevTime == null ? 0 : (now - this._prevTime) * 0.001;
        this._prevTime = now;
        
        resMan.PrepareLoop(dt);
        
        for (var i = 0; i < this._scheduled.length; ++i)
        {
            if (!this._scheduled[i](dt))
            {
                this._scheduled.splice(i, 1);
                --i;
            }
        }
        this.frameCounter++;
    };

    this.SetWorld = function (matrix)
    {
        mat4.set(matrix, this.world);
    };

    this.SetView = function (matrix)
    {
        mat4.set(matrix, this.view);
        mat4.multiply(this.projection, this.view, variableStore._variables['ViewProjectionMat'].value);
        
        mat4.inverse(this.view, this.viewInv);
        this.eyePosition.set([this.viewInv[12], this.viewInv[13], this.viewInv[14]]);
    };

    this.SetProjection = function (matrix)
    {
        mat4.set(matrix, this.projection);
        mat4.multiply(this.projection, this.view, variableStore._variables['ViewProjectionMat'].value);
    };

    this.GetEyePosition = function ()
    {
        return this.eyePosition;
    };

    this.RenderFullScreenQuad = function (effect)
    {
        if (!effect)
        {
            return;
        }
        var effectRes = effect.GetEffectRes();
        if (!effectRes.IsGood())
        {
            return;
        }
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._quadBuffer);

        for (var pass = 0; pass < effect.GetPassCount(); ++pass)
        {
            effect.ApplyPass(pass);
            if (!this._quadDecl.SetDeclaration(effect.GetPassInput(pass), 24))
            {
                return false;
            }
            this.ApplyShadowState();
            device.gl.drawArrays(device.gl.TRIANGLE_STRIP, 0, 4);
        }
    };

    this.RenderTexture = function (texture)
    {
        if (!this.blitEffect)
        {
            this.blitEffect = new Tw2Effect();
            this.blitEffect.effectFilePath = 'res:/graphics/effect/managed/space/system/blit.fx';
            var param = new Tw2TextureParameter();
            param.name = 'BlitSource';
            this.blitEffect.parameters[param.name] = param;
            this.blitEffect.Initialize();
        }
        this.blitEffect.parameters['BlitSource'].textureRes = texture;
        this.RenderFullScreenQuad(this.blitEffect);
    };

    this.RenderCameraSpaceQuad = function (effect)
    {
        if (!effect)
        {
            return;
        }
        var effectRes = effect.GetEffectRes();
        if (!effectRes.IsGood())
        {
            return;
        }
        var vertices = [
            1.0,  1.0,  0.0, 1.0, 1.0, 1.0,
            -1.0, 1.0,  0.0, 1.0, 0.0, 1.0,
            1.0,  -1.0, 0.0, 1.0, 1.0, 0.0,
            -1.0, -1.0, 0.0, 1.0, 0.0, 0.0
        ];
        vertices = new Float32Array(vertices);
        
        var projInv = mat4.inverse(this.projection, mat4.create());
        for (var i = 0; i < 4; ++i)
        {
            var vec = vertices.subarray(i * 6, i * 6 + 4);
            mat4.multiplyVec4(projInv, vec);
            vec3.scale(vec, 1 / vec[3]);
            vec[3] = 1;
        }
        
        this.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._cameraQuadBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

        for (var pass = 0; pass < effect.GetPassCount(); ++pass)
        {
            effect.ApplyPass(pass);
            if (!this._quadDecl.SetDeclaration(effect.GetPassInput(pass), 24))
            {
                return false;
            }
            this.ApplyShadowState();
            device.gl.drawArrays(device.gl.TRIANGLE_STRIP, 0, 4);
        }
    };

    this._DwordToFloat = function (value)
    {
        var b4 = (value & 0xff);
        var b3 = (value & 0xff00) >> 8;
        var b2 = (value & 0xff0000) >> 16;
        var b1 = (value & 0xff000000) >> 24;
        var sign = 1 - (2 * (b1 >> 7));                     // sign = bit 0
        var exp = (((b1 << 1) & 0xff) | (b2 >> 7)) - 127; // exponent = bits 1..8
        var sig = ((b2 & 0x7f) << 16) | (b3 << 8) | b4;   // significand = bits 9..31
        if (sig == 0 && exp == -127)
            return 0.0;
        return sign * (1 + sig * Math.pow(2, -23)) * Math.pow(2, exp);
    };

    this.IsAlphaTestEnabled = function ()
    {
        return this.alphaTestState.states[this.RS_ALPHATESTENABLE];
    };

    this.SetRenderState = function (state, value)
    {
        this._currentRenderMode = this.RM_ANY;
        var gl = this.gl;
        switch (state)
        {
            case this.RS_ZENABLE:
                if (value)
                {
                    gl.enable(gl.DEPTH_TEST);
                }
                else
                {
                    gl.disable(gl.DEPTH_TEST);
                }
                return;
            case this.RS_ZWRITEENABLE:
                gl.depthMask(value ? true : false);
                return;
            case this.RS_ALPHATESTENABLE:
            case this.RS_ALPHAREF:
            case this.RS_ALPHAFUNC:
            case this.RS_CLIPPING:
            case this.RS_CLIPPLANEENABLE:
                if (this.alphaTestState[state] != value)
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
                if (this.alphaBlendState[state] != value)
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
                if (value)
                {
                    gl.enable(gl.BLEND);
                }
                else
                {
                    gl.disable(gl.BLEND);
                }
                return;
            case this.RS_COLORWRITEENABLE:
                gl.colorMask(
                (value & 1) != 0,
                (value & 2) != 0,
                (value & 4) != 0,
                (value & 8) != 0);
                return;
            case this.RS_SCISSORTESTENABLE:
                if (value)
                {
                    gl.enable(gl.SCISSOR_TEST);
                }
                else
                {
                    gl.disable(gl.SCISSOR_TEST);
                }
                return;
            case this.RS_SLOPESCALEDEPTHBIAS:
            case this.RS_DEPTHBIAS:
                value = this._DwordToFloat(value);
                if (this.depthOffsetState[state] != value)
                {
                    this.depthOffsetState.states[state] = value;
                    this.depthOffsetState.dirty = true;
                }
                return;
        }
    };

    this.shadowHandles = null;

    this.ApplyShadowState = function ()
    {
        if (this.alphaBlendState.dirty)
        {
            var blendOp = this.gl.FUNC_ADD;
            if (this.alphaBlendState.states[this.RS_BLENDOP] == 2)
            {
                blendOp = this.gl.FUNC_SUBTRACT;
            }
            else if (this.alphaBlendState.states[this.RS_BLENDOP] == 3)
            {
                blendOp = this.gl.FUNC_REVERSE_SUBTRACT;
            }
            var srcBlend = this._blendTable[this.alphaBlendState.states[this.RS_SRCBLEND]];
            var destBlend = this._blendTable[this.alphaBlendState.states[this.RS_DESTBLEND]];
            
            if (this.alphaBlendState.states[this.RS_SEPARATEALPHABLENDENABLE])
            {
                var blendOpAlpha = this.gl.FUNC_ADD;
                if (this.alphaBlendState.states[this.RS_BLENDOP] == 2)
                {
                    blendOpAlpha = this.gl.FUNC_SUBTRACT;
                }
                else if (this.alphaBlendState.states[this.RS_BLENDOP] == 3)
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

        if (this.shadowHandles && this.alphaTestState.states[this.RS_ALPHATESTENABLE])
        {
            switch (this.alphaTestState.states[this.RS_ALPHAFUNC])
            {
            case this.CMP_NEVER:
                var alphaTestFunc = 0;
                var invertedAlphaTest = 1;
                var alphaTestRef = -256;
                break;
            case this.CMP_LESS:
                var alphaTestFunc = 0;
                var invertedAlphaTest = -1;
                var alphaTestRef = this.alphaTestState.states[this.RS_ALPHAREF] - 1;
                break;
            case this.CMP_EQUAL:
                var alphaTestFunc = 1;
                var invertedAlphaTest = 0;
                var alphaTestRef = this.alphaTestState.states[this.RS_ALPHAREF];
                break;
            case this.CMP_LEQUAL:
                var alphaTestFunc = 0;
                var invertedAlphaTest = -1;
                var alphaTestRef = this.alphaTestState.states[this.RS_ALPHAREF];
                break;
            case this.CMP_GREATER:
                var alphaTestFunc = 0;
                var invertedAlphaTest = 1;
                var alphaTestRef = -this.alphaTestState.states[this.RS_ALPHAREF] - 1;
                break;
            /*case this.CMP_NOTEQUAL:
                var alphaTestFunc = 1;
                var invertedAlphaTest = 1;
                var alphaTestRef = this.alphaTestState.states[this.RS_ALPHAREF];
                break;*/
            case this.CMP_GREATEREQUAL:
                var alphaTestFunc = 0;
                var invertedAlphaTest = 1;
                var alphaTestRef = -this.alphaTestState.states[this.RS_ALPHAREF];
                break;
            default:
                var alphaTestFunc = 0;
                var invertedAlphaTest = 0;
                var alphaTestRef = 1;
                break;
            }
            var clipPlaneEnable = 0;
            device.gl.uniform4f(
                this.shadowHandles.shadowStateInt,
                invertedAlphaTest,
                alphaTestRef,
                alphaTestFunc,
                clipPlaneEnable);
            //this._shadowStateBuffers
        }
    };

    this.SetStandardStates = function (renderMode)
    {
        if (this._currentRenderMode == renderMode)
        {
            return;
        }
        this.gl.frontFace(this.gl.CW);
        switch (renderMode)
        {
            case this.RM_OPAQUE:
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

    this.GetFallbackTexture = function ()
    {
        if (this._whiteTexture == null)
        {
            this._whiteTexture = device.gl.createTexture();
            device.gl.bindTexture(device.gl.TEXTURE_2D, this._whiteTexture);
            device.gl.texImage2D(device.gl.TEXTURE_2D, 0, device.gl.RGBA, 1, 1, 0, device.gl.RGBA, device.gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,0]));
            device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_WRAP_S, device.gl.CLAMP_TO_EDGE);
            device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_WRAP_T, device.gl.CLAMP_TO_EDGE);
            device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MAG_FILTER, device.gl.NEAREST);
            device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MIN_FILTER, device.gl.NEAREST);
            //device.gl.generateMipmap(device.gl.TEXTURE_2D);
            device.gl.bindTexture(device.gl.TEXTURE_2D, null);
        }
        return this._whiteTexture;
    };

    this.GetFallbackCubeMap = function ()
    {
        if (this._whiteCube == null)
        {
            this._whiteCube = device.gl.createTexture();
            device.gl.bindTexture(device.gl.TEXTURE_CUBE_MAP, this._whiteCube);
            for (var j = 0; j < 6; ++j)
            {
                device.gl.texImage2D(device.gl.TEXTURE_CUBE_MAP_POSITIVE_X + j, 0, device.gl.RGBA, 1, 1, 0, device.gl.RGBA, device.gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,0]));
            }
            device.gl.texParameteri(device.gl.TEXTURE_CUBE_MAP, device.gl.TEXTURE_WRAP_S, device.gl.CLAMP_TO_EDGE);
            device.gl.texParameteri(device.gl.TEXTURE_CUBE_MAP, device.gl.TEXTURE_WRAP_T, device.gl.CLAMP_TO_EDGE);
            device.gl.texParameteri(device.gl.TEXTURE_CUBE_MAP, device.gl.TEXTURE_MAG_FILTER, device.gl.NEAREST);
            device.gl.texParameteri(device.gl.TEXTURE_CUBE_MAP, device.gl.TEXTURE_MIN_FILTER, device.gl.NEAREST);
            //device.gl.generateMipmap(device.gl.TEXTURE_CUBE_MAP);
            device.gl.bindTexture(device.gl.TEXTURE_CUBE_MAP, null);
        }
        return this._whiteCube;
    };
}

var device = new Tw2Device();