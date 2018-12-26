/*

    Webgl & Webgl2

*/
export const GL_COLOR_BUFFER_BIT = 16384;
export const GL_DEPTH_BUFFER_BIT = 256;
export const GL_STENCIL_BUFFER_BIT = 1024;

export const GL_TEXTURE_2D = 3553;
export const GL_TEXTURE_CUBE_MAP = 34067;
export const GL_TEXTURE_3D = 32879;

export const GL_TEXTURE_MAG_FILTER = 10240;
export const GL_TEXTURE_MIN_FILTER = 10241;
export const GL_TEXTURE_WRAP_S = 10242;
export const GL_TEXTURE_WRAP_T = 10243;

export const GL_BYTE = 5120;
export const GL_UNSIGNED_BYTE = 5121;
export const GL_SHORT = 5122;
export const GL_UNSIGNED_SHORT = 5123;
export const GL_INT = 5124;
export const GL_UNSIGNED_INT = 5125;
export const GL_FLOAT = 5126;
export const GL_HALF_FLOAT_OES = 36193;                                     //webgl only
export const GL_HALF_FLOAT = 5131;                                          //webgl2
export const GL_DEPTH_COMPONENT16 = 33189;                                  //webgl2
export const GL_DEPTH_COMPONENT24 = 33190;                                  //webgl2
export const GL_DEPTH_COMPONENT32F = 36012;                                 //webgl2

export const GL_FLOAT_VEC2 = 35664;
export const GL_FLOAT_VEC3 = 35665;
export const GL_FLOAT_VEC4 = 35666;
export const GL_INT_VEC2 = 35667;
export const GL_INT_VEC3 = 35668;
export const GL_INT_VEC4 = 35669;
export const GL_BOOL = 35670;
export const GL_BOOL_VEC2 = 35671;
export const GL_BOOL_VEC3 = 35672;
export const GL_BOOL_VEC4 = 35673;
export const GL_FLOAT_MAT2 = 35674;
export const GL_FLOAT_MAT3 = 35675;
export const GL_FLOAT_MAT4 = 35676;

export const GL_TYPE_LENGTH = {
    [GL_FLOAT]: 1,
    [GL_INT]: 1,
    [GL_BYTE]: 1,
    [GL_BOOL]: 1,
    [GL_FLOAT_VEC2]: 2,
    [GL_INT_VEC2]: 2,
    [GL_BOOL_VEC2]: 2,
    [GL_FLOAT_VEC3]: 3,
    [GL_INT_VEC3]: 3,
    [GL_BOOL_VEC3]: 3,
    [GL_FLOAT_VEC4]: 4,
    [GL_INT_VEC4]: 4,
    [GL_BOOL_VEC4]: 4,
    [GL_FLOAT_MAT3]: 9,
    [GL_FLOAT_MAT4]: 16
};

export const GL_SAMPLER_2D = 35678;
export const GL_SAMPLER_3D = 35679;
export const GL_SAMPLER_CUBE = 35680;

export const GL_DEPTH_COMPONENT = 6402;
export const GL_ALPHA = 6406;
export const GL_RGB = 6407;
export const GL_RGBA = 6408;
export const GL_LUMINANCE = 6409;
export const GL_LUMINANCE_ALPHA = 6410;
export const GL_DEPTH_STENCIL = 34041;
export const GL_UNSIGNED_INT_24_8_WEBGL = 34042;

export const GL_R8 = 33321;                                                 //webgl2
export const GL_R16F = 33325;                                               //webgl2
export const GL_R32F = 33326;                                               //webgl2
export const GL_R8UI = 33330;                                               //webgl2
export const GL_RG8 = 33323;                                                //webgl2
export const GL_RG16F = 33327;                                              //webgl2
export const GL_RG32F = 33328;                                              //webgl2
export const GL_RGB8 = 32849;                                               //webgl2
export const GL_SRGB8 = 35905;                                              //webgl2
export const GL_RGB565 = 36194;                                             //webgl2
export const GL_R11F_G11F_B10F = 35898;                                     //webgl2
export const GL_RGB9_E5 = 35901;                                            //webgl2
export const GL_RGB16F = 34843;                                             //webgl2
export const GL_RGB32F = 34837;                                             //webgl2
export const GL_RGB8UI = 36221;                                             //webgl2
export const GL_RGBA8 = 32856;                                              //webgl2
export const GL_RGB5_A1 = 32855;                                            //webgl2
export const GL_RGBA16F = 34842;                                            //webgl2
export const GL_RGBA32F = 34836;                                            //webgl2
export const GL_RGBA8UI = 36220;                                            //webgl2
export const GL_RGBA16I = 36232;                                            //webgl2
export const GL_RGBA16UI = 36214;                                           //webgl2
export const GL_RGBA32I = 36226;                                            //webgl2
export const GL_RGBA32UI = 36208;                                           //webgl2

export const GL_NEAREST = 9728;
export const GL_LINEAR = 9729;
export const GL_NEAREST_MIPMAP_NEAREST = 9984;
export const GL_LINEAR_MIPMAP_NEAREST = 9985;
export const GL_NEAREST_MIPMAP_LINEAR = 9986;
export const GL_LINEAR_MIPMAP_LINEAR = 9987;

export const GL_REPEAT = 10497;
export const GL_CLAMP_TO_EDGE = 33071;
export const GL_MIRRORED_REPEAT = 33648;

export const GL_ZERO = 0;
export const GL_ONE = 1;
export const GL_SRC_COLOR = 768;
export const GL_ONE_MINUS_SRC_COLOR = 769;
export const GL_SRC_ALPHA = 770;
export const GL_ONE_MINUS_SRC_ALPHA = 771;
export const GL_DST_ALPHA = 772;
export const GL_ONE_MINUS_DST_ALPHA = 773;
export const GL_DST_COLOR = 774;
export const GL_ONE_MINUS_DST_COLOR = 775;
export const GL_SRC_ALPHA_SATURATE = 776;
export const GL_CONSTANT_COLOR = 32769;
export const GL_ONE_MINUS_CONSTANT_COLOR = 32770;
export const GL_CONSTANT_ALPHA = 32771;
export const GL_ONE_MINUS_CONSTANT_ALPHA = 32772;

export const GL_VERTEX_SHADER = 35633;
export const GL_FRAGMENT_SHADER = 35632;

export const GL_FRONT = 1028;
export const GL_BACK = 1029;
export const GL_FRONT_AND_BACK = 1032;

export const GL_NEVER = 512;
export const GL_LESS = 513;
export const GL_EQUAL = 514;
export const GL_LEQUAL = 515;
export const GL_GREATER = 516;
export const GL_NOTEQUAL = 517;
export const GL_GEQUAL = 518;
export const GL_ALWAYS = 519;

export const GL_KEEP = 7680;
export const GL_REPLACE = 7681;
export const GL_INCR = 7682;
export const GL_DECR = 7683;
export const GL_INCR_WRAP = 34055;
export const GL_DECR_WRAP = 34056;
export const GL_INVERT = 5386;

export const GL_STREAM_DRAW = 35040;
export const GL_STATIC_DRAW = 35044;
export const GL_DYNAMIC_DRAW = 35048;

export const GL_ARRAY_BUFFER = 34962;
export const GL_ELEMENT_ARRAY_BUFFER = 34963;

export const GL_POINTS = 0;
export const GL_LINES = 1;
export const GL_LINE_LOOP = 2;
export const GL_LINE_STRIP = 3;
export const GL_TRIANGLES = 4;
export const GL_TRIANGLE_STRIP = 5;
export const GL_TRIANGLE_FAN = 6;

export const GL_CW = 2304;
export const GL_CCW = 2305;

export const GL_CULL_FACE = 2884;
export const GL_DEPTH_TEST = 2929;
export const GL_BLEND = 3042;


/*

    Direct 3D and CCP

*/
// Render Mode
export const RM_ANY = -1;
export const RM_OPAQUE = 0;
export const RM_DECAL = 1;
export const RM_TRANSPARENT = 2;
export const RM_ADDITIVE = 3;
export const RM_DEPTH = 4;
export const RM_FULLSCREEN = 5;
export const RM_PICKABLE = 6;
export const RM_DISTORTION = 7;

// Render States
export const RS_ZENABLE = 7;                                            // D3DZBUFFERTYPE (or TRUE/FALSE for legacy)
export const RS_FILLMODE = 8;                                           // D3DFILLMODE
export const RS_SHADEMODE = 9;                                          // D3DSHADEMODE
export const RS_ZWRITEENABLE = 14;                                      // TRUE to enable z writes
export const RS_ALPHATESTENABLE = 15;                                   // TRUE to enable alpha tests
export const RS_LASTPIXEL = 16;                                         // TRUE for last-pixel on lines
export const RS_SRCBLEND = 19;                                          // D3DBLEND
export const RS_DESTBLEND = 20;                                         // D3DBLEND
export const RS_CULLMODE = 22;                                          // D3DCULL
export const RS_ZFUNC = 23;                                             // D3DCMPFUNC
export const RS_ALPHAREF = 24;                                          // D3DFIXED
export const RS_ALPHAFUNC = 25;                                         // D3DCMPFUNC
export const RS_DITHERENABLE = 26;                                      // TRUE to enable dithering
export const RS_ALPHABLENDENABLE = 27;                                  // TRUE to enable alpha blending
export const RS_FOGENABLE = 28;                                         // TRUE to enable fog blending
export const RS_SPECULARENABLE = 29;                                    // TRUE to enable specular
export const RS_FOGCOLOR = 34;                                          // D3DCOLOR
export const RS_FOGTABLEMODE = 35;                                      // D3DFOGMODE
export const RS_FOGSTART = 36;                                          // Fog start (for both vertex and pixel fog)
export const RS_FOGEND = 37;                                            // Fog end
export const RS_FOGDENSITY = 38;                                        // Fog density
export const RS_RANGEFOGENABLE = 48;                                    // Enables range-based fog
export const RS_STENCILENABLE = 52;                                     // BOOL enable/disable stenciling
export const RS_STENCILFAIL = 53;                                       // D3DSTENCILOP to do if stencil test fails
export const RS_STENCILZFAIL = 54;                                      // D3DSTENCILOP to do if stencil test passes and Z test fails
export const RS_STENCILPASS = 55;                                       // D3DSTENCILOP to do if both stencil and Z tests pass
export const RS_STENCILFUNC = 56;                                       // D3DCMPFUNC fn.  Stencil Test passes if ((ref & mask) stencilfn (stencil & mask)) is true
export const RS_STENCILREF = 57;                                        // Reference value used in stencil test
export const RS_STENCILMASK = 58;                                       // Mask value used in stencil test
export const RS_STENCILWRITEMASK = 59;                                  // Write mask applied to values written to stencil buffer
export const RS_TEXTUREFACTOR = 60;                                     // D3DCOLOR used for multi-texture blend
export const RS_WRAP0 = 128;                                            // wrap for 1st texture coord. set
export const RS_WRAP1 = 129;                                            // wrap for 2nd texture coord. set
export const RS_WRAP2 = 130;                                            // wrap for 3rd texture coord. set
export const RS_WRAP3 = 131;                                            // wrap for 4th texture coord. set
export const RS_WRAP4 = 132;                                            // wrap for 5th texture coord. set
export const RS_WRAP5 = 133;                                            // wrap for 6th texture coord. set
export const RS_WRAP6 = 134;                                            // wrap for 7th texture coord. set
export const RS_WRAP7 = 135;                                            // wrap for 8th texture coord. set
export const RS_CLIPPING = 136;
export const RS_LIGHTING = 137;
export const RS_AMBIENT = 139;
export const RS_FOGVERTEXMODE = 140;
export const RS_COLORVERTEX = 141;
export const RS_LOCALVIEWER = 142;
export const RS_NORMALIZENORMALS = 143;
export const RS_DIFFUSEMATERIALSOURCE = 145;
export const RS_SPECULARMATERIALSOURCE = 146;
export const RS_AMBIENTMATERIALSOURCE = 147;
export const RS_EMISSIVEMATERIALSOURCE = 148;
export const RS_VERTEXBLEND = 151;
export const RS_CLIPPLANEENABLE = 152;
export const RS_POINTSIZE = 154;                                        // float point size
export const RS_POINTSIZE_MIN = 155;                                    // float point size min threshold
export const RS_POINTSPRITEENABLE = 156;                                // BOOL point texture coord control
export const RS_POINTSCALEENABLE = 157;                                 // BOOL point size scale enable
export const RS_POINTSCALE_A = 158;                                     // float point attenuation A value
export const RS_POINTSCALE_B = 159;                                     // float point attenuation B value
export const RS_POINTSCALE_C = 160;                                     // float point attenuation C value
export const RS_MULTISAMPLEANTIALIAS = 161;                             // BOOL - set to do FSAA with multisample buffer
export const RS_MULTISAMPLEMASK = 162;                                  // DWORD - per-sample enable/disable
export const RS_PATCHEDGESTYLE = 163;                                   // Sets whether patch edges will use float style tessellation
export const RS_DEBUGMONITORTOKEN = 165;                                // DEBUG ONLY - token to debug monitor
export const RS_POINTSIZE_MAX = 166;                                    // float point size max threshold
export const RS_INDEXEDVERTEXBLENDENABLE = 167;
export const RS_COLORWRITEENABLE = 168;                                 // per-channel write enable
export const RS_TWEENFACTOR = 170;                                      // float tween factor
export const RS_BLENDOP = 171;                                          // D3DBLENDOP setting
export const RS_POSITIONDEGREE = 172;                                   // NPatch position interpolation degree. D3DDEGREE_LINEAR or D3DDEGREE_CUBIC (default)
export const RS_NORMALDEGREE = 173;                                     // NPatch normal interpolation degree. D3DDEGREE_LINEAR (default) or D3DDEGREE_QUADRATIC
export const RS_SCISSORTESTENABLE = 174;
export const RS_SLOPESCALEDEPTHBIAS = 175;
export const RS_ANTIALIASEDLINEENABLE = 176;
export const RS_TWOSIDEDSTENCILMODE = 185;                              // BOOL enable/disable 2 sided stenciling
export const RS_CCW_STENCILFAIL = 186;                                  // D3DSTENCILOP to do if ccw stencil test fails
export const RS_CCW_STENCILZFAIL = 187;                                 // D3DSTENCILOP to do if ccw stencil test passes and Z test fails
export const RS_CCW_STENCILPASS = 188;                                  // D3DSTENCILOP to do if both ccw stencil and Z tests pass
export const RS_CCW_STENCILFUNC = 189;                                  // D3DCMPFUNC fn.  ccw Stencil Test passes if ((ref & mask) stencilfn (stencil & mask)) is true
export const RS_COLORWRITEENABLE1 = 190;                                // Additional ColorWriteEnables for the devices that support D3DPMISCCAPS_INDEPENDENTWRITEMASKS
export const RS_COLORWRITEENABLE2 = 191;                                // Additional ColorWriteEnables for the devices that support D3DPMISCCAPS_INDEPENDENTWRITEMASKS
export const RS_COLORWRITEENABLE3 = 192;                                // Additional ColorWriteEnables for the devices that support D3DPMISCCAPS_INDEPENDENTWRITEMASKS
export const RS_BLENDFACTOR = 193;                                      // D3DCOLOR used for a constant blend factor during alpha blending for devices that support D3DPBLENDCAPS_BLENDFACTOR
export const RS_SRGBWRITEENABLE = 194;                                  // Enable rendertarget writes to be DE-linearized to SRGB (for formats that expose D3DUSAGE_QUERY_SRGBWRITE)
export const RS_DEPTHBIAS = 195;
export const RS_SEPARATEALPHABLENDENABLE = 206;                         // TRUE to enable a separate blending function for the alpha channel
export const RS_SRCBLENDALPHA = 207;                                    // SRC blend factor for the alpha channel when RS_SEPARATEDESTALPHAENABLE is TRUE
export const RS_DESTBLENDALPHA = 208;                                   // DST blend factor for the alpha channel when RS_SEPARATEDESTALPHAENABLE is TRUE
export const RS_BLENDOPALPHA = 209;                                     // Blending operation for the alpha channel when RS_SEPARATEDESTALPHAENABLE is TRUE */// Cull Modes
export const CULL_NONE = 1;
export const CULL_CW = 2;
export const CULL_CCW = 3;

// Compare
export const CMP_NEVER = 1;
export const CMP_LESS = 2;
export const CMP_EQUAL = 3;
export const CMP_LEQUAL = 4;
export const CMP_GREATER = 5;
export const CMP_NOTEQUAL = 6;
export const CMP_GREATEREQUAL = 7;
export const CMP_ALWAYS = 8;

// Blend
export const BLEND_ZERO = 1;
export const BLEND_ONE = 2;
export const BLEND_SRCCOLOR = 3;
export const BLEND_INVSRCCOLOR = 4;
export const BLEND_SRCALPHA = 5;
export const BLEND_INVSRCALPHA = 6;
export const BLEND_DESTALPHA = 7;
export const BLEND_INVDESTALPHA = 8;
export const BLEND_DESTCOLOR = 9;
export const BLEND_INVDESTCOLOR = 10;
export const BLEND_SRCALPHASAT = 11;
export const BLEND_BOTHSRCALPHA = 12;
export const BLEND_BOTHINVSRCALPHA = 13;
export const BLEND_BLENDFACTOR = 14;
export const BLEND_INVBLENDFACTOR = 15;

// Blend Operations
export const BLENDOP_ADD = 1;
export const BLENDOP_SUBTRACT = 2;
export const BLENDOP_REVSUBTRACT = 3;
export const BLENDOP_MIN = 4;
export const BLENDOP_MAX = 5;

// Texture format aliases
export const TF_ALPHA = 0;
export const TF_LUMINANCE = 1;
export const TF_LUMINANCE_ALPHA = 2;
export const TF_RGB = 4;
export const TF_RGBA = 5;
export const TF_RED = 6;
export const TF_R = 6;
export const TF_RG = 7;
export const TF_RED_INTEGER = 8;
export const TF_R_INTEGER = 8;
export const TF_RG_INTEGER = 9;
export const TF_RGB_INTEGER = 10;
export const TF_RGBA_INTEGER = 11;

// Texture types aliases
export const TT_UNSIGNED_BYTE = 0;
export const TT_UNSIGNED_INT = 0;
export const TT_FLOAT = 1;
export const TT_HALF_FLOAT = 2;
export const TT_BYTE = 3;
export const TT_SHORT = 4;
export const TT_UNSIGNED_SHORT = 5;
export const TT_INT = 6;
export const TT_UNSIGNED_INTEGER = 7;
export const TT_UNSIGNED_SHORT_4_4_4_4 = 8;
export const TT_UNSIGNED_SHORT_5_5_5_1 = 9;
export const TT_UNSIGNED_SHORT_5_6_5 = 10;
export const TT_UNSIGNED_INT_2_10_10_10_REV = 11;
export const TT_UNSIGNED_INT_24_8 = 12;
export const TT_UNSIGNED_INT_10F_11F_11F_REV = 13;
export const TT_UNSIGNED_INT_5_9_9_9_REV = 14;
export const TT_FLOAT_32_UNSIGNED_INT_24_8_REV = 15;

// Texture Wrap modes
export const WrapModes = [
    0,
    GL_REPEAT,
    GL_MIRRORED_REPEAT,
    GL_CLAMP_TO_EDGE,
    GL_CLAMP_TO_EDGE,
    GL_CLAMP_TO_EDGE,
];

// Blend Table
export const BlendTable = [
    -1,                                                                 // --
    GL_ZERO,                                                            // D3DBLEND_ZERO
    GL_ONE,                                                             // D3DBLEND_ONE
    GL_SRC_COLOR,                                                       // D3DBLEND_SRCCOLOR
    GL_ONE_MINUS_SRC_COLOR,                                             // D3DBLEND_INVSRCCOLOR
    GL_SRC_ALPHA,                                                       // D3DBLEND_SRCALPHA
    GL_ONE_MINUS_SRC_ALPHA,                                             // D3DBLEND_INVSRCALPHA
    GL_DST_ALPHA,                                                       // D3DBLEND_DESTALPHA
    GL_ONE_MINUS_DST_ALPHA,                                             // D3DBLEND_INVDESTALPHA
    GL_DST_COLOR,                                                       // D3DBLEND_DESTCOLOR
    GL_ONE_MINUS_DST_COLOR,                                             // D3DBLEND_INVDESTCOLOR
    GL_SRC_ALPHA_SATURATE,                                              // D3DBLEND_SRCALPHASAT
    -1,                                                                 // D3DBLEND_BOTHSRCALPHA
    -1,                                                                 // D3DBLEND_BOTHINVSRCALPHA
    GL_CONSTANT_COLOR,                                                  // D3DBLEND_BLENDFACTOR
    GL_ONE_MINUS_CONSTANT_COLOR                                         // D3DBLEND_INVBLENDFACTOR
];

// Filter mode conversions
export const FilterMode = {
    [GL_NEAREST]: 1,
    [GL_LINEAR]: 2
};

// Mip filter mode conversions
export const MipFilterMode = {
    [GL_NEAREST]: 0,
    [GL_LINEAR]: 0,
    [GL_NEAREST_MIPMAP_NEAREST]: 1,
    [GL_LINEAR_MIPMAP_NEAREST]: 1,
    [GL_NEAREST_MIPMAP_LINEAR]: 2,
    [GL_LINEAR_MIPMAP_LINEAR]: 2
};

/*

  Direct Draw Surface
  https://docs.microsoft.com/en-us/windows/desktop/direct3ddds/dx-graphics-dds-pguide

*/
export const DDS_MAGIC = 0x20534444;
export const DDSD_CAPS = 0x1;
export const DDSD_HEIGHT = 0x2;
export const DDSD_WIDTH = 0x4;
export const DDSD_PITCH = 0x8;
export const DDSD_PIXELFORMAT = 0x1000;
export const DDSD_MIPMAPCOUNT = 0x20000;
export const DDSD_LINEARSIZE = 0x80000;
export const DDSD_DEPTH = 0x800000;

export const DDSCAPS_COMPLEX = 0x8;
export const DDSCAPS_MIPMAP = 0x400000;
export const DDSCAPS_TEXTURE = 0x1000;

export const DDSCAPS2_CUBEMAP = 0x200;
export const DDSCAPS2_CUBEMAP_POSITIVEX = 0x400;
export const DDSCAPS2_CUBEMAP_NEGATIVEX = 0x800;
export const DDSCAPS2_CUBEMAP_POSITIVEY = 0x1000;
export const DDSCAPS2_CUBEMAP_NEGATIVEY = 0x2000;
export const DDSCAPS2_CUBEMAP_POSITIVEZ = 0x4000;
export const DDSCAPS2_CUBEMAP_NEGATIVEZ = 0x8000;
export const DDSCAPS2_VOLUME = 0x200000;

export const DDPF_ALPHAPIXELS = 0x1;
export const DDPF_ALPHA = 0x2;
export const DDPF_FOURCC = 0x4;
export const DDPF_RGB = 0x40;
export const DDPF_YUV = 0x200;
export const DDPF_LUMINANCE = 0x20000;

export const DDS_HEADER_LENGTH_INT = 31;
export const DDS_HEADER_OFFSET_MAGIC = 0;
export const DDS_HEADER_OFFSET_SIZE = 1;
export const DDS_HEADER_OFFSET_FLAGS = 2;
export const DDS_HEADER_OFFSET_HEIGHT = 3;
export const DDS_HEADER_OFFSET_WIDTH = 4;
export const DDS_HEADER_OFFSET_MIPMAP_COUNT = 7;
export const DDS_HEADER_OFFSET_PF_FLAGS = 20;
export const DDS_HEADER_OFFSET_PF_FOURCC = 21;
export const DDS_HEADER_OFFSET_RGB_BPP = 22;
export const DDS_HEADER_OFFSET_R_MASK = 23;
export const DDS_HEADER_OFFSET_G_MASK = 24;
export const DDS_HEADER_OFFSET_B_MASK = 25;
export const DDS_HEADER_OFFSET_A_MASK = 26;
export const DDS_HEADER_OFFSET_CAPS1 = 27;
export const DDS_HEADER_OFFSET_CAPS2 = 28;
export const DDS_HEADER_OFFSET_CAPS3 = 29;
export const DDS_HEADER_OFFSET_CAPS4 = 30;
export const DDS_HEADER_OFFSET_DXGI_FORMAT = 32;

export const FOURCC_DXT1 = 827611204;
export const FOURCC_DXT5 = 894720068;
export const FOURCC_DXT3 = 861165636;
export const FOURCC_DXT10 = 827611204;
export const FOURCC_D3DFMT_R16G16B16A16F = 113;
export const FOURCC_D3DFMT_R32G32B32A32F = 116;
export const DXGI_FORMAT_R16G16B16A16_FLOAT = 10;
export const DXGI_FORMAT_B8G8R8X8_UNORM = 88;

/*

    Browser and Vendors

 */

/**
 * Vendor request animation frame names
 * @type {string[]}
 */
export const VendorRequestAnimationFrame = [
    'requestAnimationFrame',
    'webkitRequestAnimationFrame',
    'mozRequestAnimationFrame',
    'oRequestAnimationFrame',
    'msRequestAnimationFrame'
];

/**
 * Vendor cancel animation frame names
 * @type {string[]}
 */
export const VendorCancelAnimationFrame = [
    'cancelAnimationFrame',
    'webkitRequestAnimationFrame',
    'mozRequestAnimationFrame',
    'oRequestAnimationFrame',
    'msRequestAnimationFrame'
];

/**
 * Vendor request full screen
 * @type {string[]}
 */
export const VendorRequestFullScreen = [
    'requestFullscreen',
    'webkitRequestFullscreen',
    'mozRequestFullScreen',
    'msRequestFullscreen'
];

/**
 * Vendor exit full screen
 * @type {string[]}
 */
export const VendorExitFullScreen = [
    'exitFullscreen',
    'webkitExitFullscreen',
    'mozCancelFullScreen',
    'msExitFullscreen'
];

/**
 * Vendor get full screen element
 * @type {string[]}
 */
export const VendorGetFullScreenElement = [
    'fullscreenElement',
    'webkitFullscreenElement',
    'mozFullScreenElement',
    'msFullscreenElement'
];

/**
 * Webgl vendor prefixes
 * @type {string[]}
 */
export const VendorWebglPrefixes = [
    '',
    'MOZ_',
    'WEBKIT_',
    'WEBGL_'
];

/**
 * Webgl context names
 * @type {string[]}
 */
export const WebglContextNames = [
    'webgl',
    'experimental-webgl'
];

/**
 * Webgl2 context names
 * @type {string[]}
 */
export const Webgl2ContextNames = [
    'webgl2',
    'experimental-webgl2'
];

/**
 * Webgl version
 * @type {{NONE: number, WEBGL: number, WEBGL2: number}}
 */
export const WebglVersion = {
    NONE: 0,
    WEBGL: 1,
    WEBGL2: 2
};