/**
 * Tw2EffectRes
 * @property {Array} passes
 * @property {Object.<string, Array>} annotations
 * @inherits Tw2Resource
 * @constructor
 */
function Tw2EffectRes()
{
    this._super.constructor.call(this);
    this.passes = [];
    this.annotations = {};
}

/**
 * Request Response Type
 * @type {string}
 * @prototype
 */
Tw2EffectRes.prototype.requestResponseType = 'arraybuffer';

/**
 * Prepares the effect
 * - Creates Shaders
 * - Sets shadow states for shaders
 * - Parses Jessica shader annotations
 * TODO: Fix commented out lines
 * TODO: @param xml is redundant
 * @param data
 * @param xml
 * @prototype
 */
Tw2EffectRes.prototype.Prepare = function(data, xml)
{
    this.passes = [];
    this.annotations = {};

    var reader = new Tw2BinaryReader(new Uint8Array(data));
    var stringTable = '';

    /**
     * ReadString
     * @returns {string}
     * @private
     */
    function ReadString()
    {
        var offset = reader.ReadUInt32();
        var end = offset;
        while (stringTable.charCodeAt(end))
        {
            ++end;
        }
        return stringTable.substr(offset, end - offset);
    }

    /**
     * Compiles shader
     * @param {number} stageType
     * @param {string} prefix
     * @param shaderCode
     * @param {string} path - Shader path
     * @returns {*}
     * @private
     */
    function CompileShader(stageType, prefix, shaderCode, path)
    {
        var shader = device.gl.createShader(stageType == 0 ? device.gl.VERTEX_SHADER : device.gl.FRAGMENT_SHADER);

        if (device.useBinaryShaders)
        {
            device.shaderBinary.shaderBinary(shader, shaderCode);
        }
        else
        {
            var source = prefix + String.fromCharCode.apply(null, shaderCode);
            source = source.substr(0, source.length - 1);
            device.gl.shaderSource(shader, source);
            device.gl.compileShader(shader);
        }
        if (!device.gl.getShaderParameter(shader, device.gl.COMPILE_STATUS))
        {
            console.error(
                'Tw2EffectRes:',
                ' error compiling ',
                stageType == 0 ? 'vertex' : 'fragment',
                ' shader (effect \'',
                path,
                '\'): ',
                device.gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }

    /**
     * Creates shader program
     * @param vertexShader
     * @param fragmentShader
     * @param pass
     * @param {string} path - Shader path
     * @returns {*}
     * @private
     */
    function CreateProgram(vertexShader, fragmentShader, pass, path)
    {
        var program = {};
        program.program = device.gl.createProgram();
        device.gl.attachShader(program.program, vertexShader);
        device.gl.attachShader(program.program, fragmentShader);
        device.gl.linkProgram(program.program);

        if (!device.gl.getProgramParameter(program.program, device.gl.LINK_STATUS))
        {
            console.error(
                'Tw2EffectRes:',
                ' error linking shaders (effect \'',
                path,
                '\'): ',
                device.gl.getProgramInfoLog(program.program));
            return null;
        }

        device.gl.useProgram(program.program);
        program.constantBufferHandles = [];
        for (var j = 0; j < 16; ++j)
        {
            program.constantBufferHandles[j] = device.gl.getUniformLocation(program.program, "cb" + j);
        }
        program.samplerHandles = [];
        for (var j = 0; j < 16; ++j)
        {
            program.samplerHandles[j] = device.gl.getUniformLocation(program.program, "s" + j);
            device.gl.uniform1i(program.samplerHandles[j], j);
        }
        for (var j = 0; j < 16; ++j)
        {
            program.samplerHandles[j + 12] = device.gl.getUniformLocation(program.program, "vs" + j);
            device.gl.uniform1i(program.samplerHandles[j + 12], j + 12);
        }
        program.input = new Tw2VertexDeclaration();
        for (var j = 0; j < pass.stages[0].inputDefinition.elements.length; ++j)
        {
            var location = device.gl.getAttribLocation(program.program, "attr" + j);
            if (location >= 0)
            {
                var el = new Tw2VertexElement(
                    pass.stages[0].inputDefinition.elements[j].usage,
                    pass.stages[0].inputDefinition.elements[j].usageIndex);
                el.location = location;
                program.input.elements.push(el);
            }
        }
        program.input.RebuildHash();

        program.shadowStateInt = device.gl.getUniformLocation(program.program, "ssi");
        program.shadowStateFloat = device.gl.getUniformLocation(program.program, "ssf");
        program.shadowStateYFlip = device.gl.getUniformLocation(program.program, "ssyf");
        device.gl.uniform3f(program.shadowStateYFlip, 0, 0, 1);
        program.volumeSlices = [];
        for (var j = 0; j < pass.stages[1].samplers.length; ++j)
        {
            if (pass.stages[1].samplers[j].isVolume)
            {
                program.volumeSlices[pass.stages[1].samplers[j].registerIndex] = device.gl.getUniformLocation(program.program, "s" + pass.stages[1].samplers[j].registerIndex + "sl");
            }
        }
        return program;
    }

    var version = reader.ReadUInt32();
    if (version < 2 || version > 4)
    {
        console.error('Tw2EffectRes:', ' invalid version of effect file \"', this.path, '\" (version ', version, ')');
        this.PrepareFinished(false);
        return;
    }

    var headerSize = reader.ReadUInt32();
    if (headerSize == 0)
    {
        console.error('Tw2EffectRes:', ' file \"', this.path, '\" contains no compiled effects');
        this.PrepareFinished(false);
        return;
    }

    /* var permutation = */
    reader.ReadUInt32();
    var offset = reader.ReadUInt32();
    reader.cursor = 2 * 4 + headerSize * 3 * 4;
    var stringTableSize = reader.ReadUInt32();
    stringTable = String.fromCharCode.apply(null, reader.data.subarray(reader.cursor, reader.cursor + stringTableSize));

    reader.cursor = offset;

    var passCount = reader.ReadUInt8();
    for (var passIx = 0; passIx < passCount; ++passIx)
    {
        var pass = {};
        pass.stages = [
            {},
            {}];
        var stageCount = reader.ReadUInt8();
        var validShadowShader = true;
        for (var stageIx = 0; stageIx < stageCount; ++stageIx)
        {
            var stage = {};
            stage.inputDefinition = new Tw2VertexDeclaration();
            stage.constants = [];
            stage.textures = [];
            stage.samplers = [];
            var stageType = reader.ReadUInt8();
            var inputCount = reader.ReadUInt8();
            for (var inputIx = 0; inputIx < inputCount; ++inputIx)
            {
                var usage = reader.ReadUInt8();
                /* var registerIndex = */
                reader.ReadUInt8();
                var usageIndex = reader.ReadUInt8();
                /* var usedMask = */
                reader.ReadUInt8();
                stage.inputDefinition.elements[inputIx] = new Tw2VertexElement(usage, usageIndex, 0);
            }
            stage.inputDefinition.RebuildHash();

            var shaderSize = reader.ReadUInt32();
            var shaderCode = reader.data.subarray(reader.cursor, reader.cursor + shaderSize);
            reader.cursor += shaderSize;

            var shadowShaderSize = reader.ReadUInt32();
            var shadowShaderCode = reader.data.subarray(reader.cursor, reader.cursor + shadowShaderSize);
            reader.cursor += shadowShaderSize;

            stage.shader = CompileShader(stageType, "", shaderCode, this.path);
            if (stage.shader == null)
            {
                this.PrepareFinished(false);
                return;
            }

            if (validShadowShader)
            {
                if (shadowShaderSize == 0)
                {
                    stage.shadowShader = CompileShader(stageType, "\n#define PS\n", shaderCode, this.path);
                }
                else
                {
                    stage.shadowShader = CompileShader(stageType, "", shadowShaderCode, this.path);
                }
                if (stage.shadowShader == null)
                {
                    validShadowShader = false;
                }
            }
            else
            {
                stage.shadowShader = null;
            }

            if (version >= 3)
            {
                reader.ReadUInt32();
                reader.ReadUInt32();
                reader.ReadUInt32();
            }

            stage.constantSize = 0;
            var constantCount = reader.ReadUInt32();
            for (var constantIx = 0; constantIx < constantCount; ++constantIx)
            {
                var constant = {};
                constant.name = ReadString();
                constant.offset = reader.ReadUInt32() / 4;
                constant.size = reader.ReadUInt32() / 4;
                constant.type = reader.ReadUInt8();
                constant.dimension = reader.ReadUInt8();
                constant.elements = reader.ReadUInt32();
                constant.isSRGB = reader.ReadUInt8();
                constant.isAutoregister = reader.ReadUInt8();
                stage.constants[constantIx] = constant;

                if (constant.name == 'PerFrameVS' ||
                    constant.name == 'PerObjectVS' ||
                    constant.name == 'PerFramePS' ||
                    constant.name == 'PerObjectPS')
                {
                    continue;
                }

                var last = constant.offset + constant.size;
                if (last > stage.constantSize)
                {
                    stage.constantSize = last;
                }
            }

            var constantValueSize = reader.ReadUInt32() / 4;
            stage.constantValues = new Float32Array(constantValueSize);
            for (var i = 0; i < constantValueSize; ++i)
            {
                stage.constantValues[i] = reader.ReadFloat32();
            }

            stage.constantSize = Math.max(stage.constantSize, constantValueSize);

            var textureCount = reader.ReadUInt8();
            for (var textureIx = 0; textureIx < textureCount; ++textureIx)
            {
                var registerIndex = reader.ReadUInt8();
                var texture = {};
                texture.registerIndex = registerIndex;
                texture.name = ReadString();
                texture.type = reader.ReadUInt8();
                texture.isSRGB = reader.ReadUInt8();
                texture.isAutoregister = reader.ReadUInt8();
                stage.textures.push(texture);
            }

            var samplerCount = reader.ReadUInt8();
            for (var samplerIx = 0; samplerIx < samplerCount; ++samplerIx)
            {
                var registerIndex = reader.ReadUInt8();
                var samplerName = '';
                if (version >= 4)
                {
                    samplerName = ReadString();
                }
                /* var comparison = */
                reader.ReadUInt8();
                var minFilter = reader.ReadUInt8();
                var magFilter = reader.ReadUInt8();
                var mipFilter = reader.ReadUInt8();
                var addressU = reader.ReadUInt8();
                var addressV = reader.ReadUInt8();
                var addressW = reader.ReadUInt8();
                var mipLODBias = reader.ReadFloat32();
                var maxAnisotropy = reader.ReadUInt8();
                /* var comparisonFunc = */
                reader.ReadUInt8();
                var borderColor = quat4.create();
                borderColor[0] = reader.ReadFloat32();
                borderColor[1] = reader.ReadFloat32();
                borderColor[2] = reader.ReadFloat32();
                borderColor[3] = reader.ReadFloat32();
                var minLOD = reader.ReadFloat32();
                var maxLOD = reader.ReadFloat32();
                if (version < 4)
                {
                    reader.ReadUInt8();
                }
                var sampler = new Tw2SamplerState();
                sampler.registerIndex = registerIndex;
                sampler.name = samplerName;
                if (minFilter == 1)
                {
                    switch (mipFilter)
                    {
                        case 0:
                            sampler.minFilter = device.gl.NEAREST;
                            break;
                        case 1:
                            sampler.minFilter = device.gl.NEAREST_MIPMAP_NEAREST;
                            break;
                        default:
                            sampler.minFilter = device.gl.NEAREST_MIPMAP_LINEAR;
                    }
                    sampler.minFilterNoMips = device.gl.NEAREST;
                }
                else
                {
                    switch (mipFilter)
                    {
                        case 0:
                            sampler.minFilter = device.gl.LINEAR;
                            break;
                        case 1:
                            sampler.minFilter = device.gl.LINEAR_MIPMAP_NEAREST;
                            break;
                        default:
                            sampler.minFilter = device.gl.LINEAR_MIPMAP_LINEAR;
                    }
                    sampler.minFilterNoMips = device.gl.LINEAR;
                }
                if (magFilter == 1)
                {
                    sampler.magFilter = device.gl.NEAREST;
                }
                else
                {
                    sampler.magFilter = device.gl.LINEAR;
                }
                var wrapModes = [
                    0,
                    device.gl.REPEAT,
                    device.gl.MIRRORED_REPEAT,
                    device.gl.CLAMP_TO_EDGE,
                    device.gl.CLAMP_TO_EDGE,
                    device.gl.CLAMP_TO_EDGE
                ];
                sampler.addressU = wrapModes[addressU];
                sampler.addressV = wrapModes[addressV];
                sampler.addressW = wrapModes[addressW];
                if (minFilter == 3 || magFilter == 3 || mipFilter == 3)
                {
                    sampler.anisotropy = Math.max(maxAnisotropy, 1);
                }
                for (var n = 0; n < stage.textures.length; ++n)
                {
                    if (stage.textures[n].registerIndex == sampler.registerIndex)
                    {
                        sampler.samplerType = stage.textures[n].type == 4 ? device.gl.TEXTURE_CUBE_MAP : device.gl.TEXTURE_2D;
                        sampler.isVolume = stage.textures[n].type == 3;
                        break;
                    }
                }
                sampler.ComputeHash();

                stage.samplers.push(sampler);
            }
            if (version >= 3)
            {
                reader.ReadUInt8();
            }

            pass.stages[stageType] = stage;
        }

        pass.states = [];
        var stateCount = reader.ReadUInt8();
        for (var stateIx = 0; stateIx < stateCount; ++stateIx)
        {
            var state = reader.ReadUInt32();
            var value = reader.ReadUInt32();
            pass.states.push(
                {
                    'state': state,
                    'value': value
                });
        }

        pass.shaderProgram = CreateProgram(pass.stages[0].shader, pass.stages[1].shader, pass, this.path);
        if (pass.shaderProgram == null)
        {
            this.PrepareFinished(false);
            return;
        }
        if (validShadowShader)
        {
            pass.shadowShaderProgram = CreateProgram(pass.stages[0].shadowShader, pass.stages[1].shadowShader, pass, this.path);
            if (pass.shadowShaderProgram == null)
            {
                pass.shadowShaderProgram = pass.shaderProgram;
            }
        }
        else
        {
            pass.shadowShaderProgram = pass.shaderProgram;
        }

        this.passes[passIx] = pass;
    }

    var parameterCount = reader.ReadUInt16();
    for (var paramIx = 0; paramIx < parameterCount; ++paramIx)
    {
        var name = ReadString();
        var annotations = [];
        var annotationCount = reader.ReadUInt8();
        for (var annotationIx = 0; annotationIx < annotationCount; ++annotationIx)
        {
            annotations[annotationIx] = {};
            annotations[annotationIx].name = ReadString();
            annotations[annotationIx].type = reader.ReadUInt8();
            switch (annotations[annotationIx].type)
            {
                case 0:
                    annotations[annotationIx].value = reader.ReadUInt32() != 0;
                    break;
                case 1:
                    annotations[annotationIx].value = reader.ReadInt32();
                    break;
                case 2:
                    annotations[annotationIx].value = reader.ReadFloat32();
                    break;
                default:
                    annotations[annotationIx].value = ReadString();
            }
        }
        this.annotations[name] = annotations;

    }

    this.PrepareFinished(true);
};

/**
 * Applies an Effect Pass
 * @param {number} pass - effect.passes index
 * @prototype
 */
Tw2EffectRes.prototype.ApplyPass = function(pass)
{
    pass = this.passes[pass];
    for (var i = 0; i < pass.states.length; ++i)
    {
        device.SetRenderState(pass.states[i].state, pass.states[i].value);
    }
    if (device.IsAlphaTestEnabled())
    {
        device.gl.useProgram(pass.shadowShaderProgram.program);
        device.shadowHandles = pass.shadowShaderProgram;
    }
    else
    {
        device.gl.useProgram(pass.shaderProgram.program);
        device.shadowHandles = null;
    }
};

/**
 * Finds out if a parameter name is a valid shader input
 * @param {string} name - An Effect Parameter name
 * @returns {boolean}
 * @prototype
 */
Tw2EffectRes.prototype.IsValidParameter = function(name)
{
    return (name in this.annotations);
};

/**
 * Returns an array of valid parameter names for a specific annotation group
 * - Compatible with pre V5 shaders
 * @param {string} groupName - The name of an annotation group
 * @returns {Array.< string >}
 * @prototype
 */
Tw2Effect.prototype.GetParametersByGroup = function(groupName)
{
    var parameters = [];

    for (var param in this.annotations)
    {
        if (this.annotations.hasOwnProperty(param))
        {
            for (var i = 0; i < this.annotations[param].length; i++)
            {
                if (this.annotations[param][i].name.toLowerCase() == "group" && this.annotations[param][i].value.toLowerCase() == groupName.toLowerCase())
                {
                    parameters.push(param);
                }
            }
        }
    }
    
    return parameters;
};

Inherit(Tw2EffectRes, Tw2Resource);

// Registers shader extension constructor
resMan.RegisterExtension('sm_hi', Tw2EffectRes);
resMan.RegisterExtension('sm_lo', Tw2EffectRes);
