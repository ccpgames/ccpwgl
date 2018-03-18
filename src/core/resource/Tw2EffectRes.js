import {quat} from '../../math';
import {device} from '../global/Tw2Device';
import {emitter} from '../global/Tw2Logger';
import {Tw2BinaryReader} from '../reader';
import {Tw2SamplerState} from '../sampler';
import {Tw2VertexElement, Tw2VertexDeclaration} from '../vertex';
import {Tw2Resource} from './Tw2Resource';

/**
 * Tw2EffectRes
 *
 * @property {Array} passes
 * @property {Object.<string, Array>} annotations
 * @inherits Tw2Resource
 */
export class Tw2EffectRes extends Tw2Resource
{
    constructor()
    {
        super();
        this.passes = [];
        this.annotations = {};
    }

    /**
     * Prepares the effect
     * - Creates Shaders
     * - Sets shadow states for shaders
     * - Parses Jessica shader annotations
     * @param data
     */
    Prepare(data)
    {
        const d = device;
        this.passes = [];
        this.annotations = {};

        const reader = new Tw2BinaryReader(new Uint8Array(data));
        let stringTable = '';

        /**
         * ReadString
         * @returns {string}
         * @private
         */
        function ReadString()
        {
            const offset = reader.ReadUInt32();
            let end = offset;
            while (stringTable.charCodeAt(end))
            {
                ++end;
            }
            return stringTable.substr(offset, end - offset);
        }

        const version = reader.ReadUInt32();
        if (version < 2 || version > 5)
        {
            emitter.log('res.error', {
                log: 'error',
                src: ['Tw2EffectRes', 'CreateProgram'],
                msg: 'Invalid version of effect file',
                type: 'shader.effectversion',
                path: this.path,
                value: version
            });

            this.PrepareFinished(false);
            return;
        }

        let headerSize,
            stringTableSize,
            stringTableOffset = 0;

        if (version < 5)
        {
            headerSize = reader.ReadUInt32();
            if (headerSize === 0)
            {
                emitter.log('res.error', {
                    log: 'error',
                    src: ['Tw2EffectRes', 'CreateProgram'],
                    msg: 'File contains no compiled effects',
                    path: this.path,
                    type: 'shader.effectheadersize',
                    value: 0
                });

                this.PrepareFinished(false);
                return;
            }

            /* let permutation = */
            reader.ReadUInt32();
            const offset = reader.ReadUInt32();
            reader.cursor = 2 * 4 + headerSize * 3 * 4;
            stringTableSize = reader.ReadUInt32();
            stringTable = String.fromCharCode.apply(null, reader.data.subarray(reader.cursor, reader.cursor + stringTableSize));
            reader.cursor = offset;
        }
        else
        {
            stringTableSize = reader.ReadUInt32();
            stringTableOffset = reader.cursor;
            stringTable = String.fromCharCode.apply(null, reader.data.subarray(reader.cursor, reader.cursor + stringTableSize));
            reader.cursor += stringTableSize;
            const permutationCount = reader.ReadUInt8();
            for (let perm = 0; perm < permutationCount; ++perm)
            {
                reader.ReadUInt32();
                reader.ReadUInt8();
                reader.ReadUInt32();
                let cnt = reader.ReadUInt8();
                for (let j = 0; j < cnt; ++j)
                {
                    reader.ReadUInt32();
                }
            }

            headerSize = reader.ReadUInt32();
            if (headerSize === 0)
            {
                emitter.log('res.error', {
                    log: 'error',
                    src: ['Tw2EffectRes', 'CreateProgram'],
                    msg: 'File contains no compiled effects',
                    path: this.path,
                    type: 'shader.effectheadersize',
                    value: 0
                });

                this.PrepareFinished(false);
                return;
            }

            reader.ReadUInt32();
            reader.cursor = reader.ReadUInt32();
        }

        const passCount = reader.ReadUInt8();
        for (let passIx = 0; passIx < passCount; ++passIx)
        {
            const pass = {};
            pass.stages = [{}, {}];
            const stageCount = reader.ReadUInt8();
            let validShadowShader = true;

            for (let stageIx = 0; stageIx < stageCount; ++stageIx)
            {
                const stage = {};
                stage.inputDefinition = new Tw2VertexDeclaration();
                stage.constants = [];
                stage.textures = [];
                stage.samplers = [];

                const
                    stageType = reader.ReadUInt8(),
                    inputCount = reader.ReadUInt8();

                for (let inputIx = 0; inputIx < inputCount; ++inputIx)
                {
                    const usage = reader.ReadUInt8();
                    /* let registerIndex = */
                    reader.ReadUInt8();
                    const usageIndex = reader.ReadUInt8();
                    /* let usedMask = */
                    reader.ReadUInt8();
                    stage.inputDefinition.elements[inputIx] = new Tw2VertexElement(usage, usageIndex, 0);
                }
                stage.inputDefinition.RebuildHash();

                let shaderSize,
                    shaderCode,
                    shadowShaderSize,
                    shadowShaderCode;

                if (version < 5)
                {
                    shaderSize = reader.ReadUInt32();
                    shaderCode = reader.data.subarray(reader.cursor, reader.cursor + shaderSize);
                    reader.cursor += shaderSize;

                    shadowShaderSize = reader.ReadUInt32();
                    shadowShaderCode = reader.data.subarray(reader.cursor, reader.cursor + shadowShaderSize);
                    reader.cursor += shadowShaderSize;
                }
                else
                {
                    shaderSize = reader.ReadUInt32();
                    let so = reader.ReadUInt32();
                    shaderCode = stringTable.substr(so, shaderSize);
                    shadowShaderSize = reader.ReadUInt32();
                    so = reader.ReadUInt32();
                    shadowShaderCode = stringTable.substr(so, shadowShaderSize);
                }

                stage.shader = Tw2EffectRes.CompileShader(stageType, '', shaderCode, this);
                if (stage.shader === null)
                {
                    this.PrepareFinished(false);
                    return;
                }

                if (validShadowShader)
                {
                    if (shadowShaderSize === 0)
                    {
                        stage.shadowShader = Tw2EffectRes.CompileShader(stageType, '\n#define PS\n', shaderCode, this);
                    }
                    else
                    {
                        stage.shadowShader = Tw2EffectRes.CompileShader(stageType, '', shadowShaderCode, this);
                    }

                    if (stage.shadowShader === null)
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
                const constantCount = reader.ReadUInt32();
                for (let constantIx = 0; constantIx < constantCount; ++constantIx)
                {
                    const constant = {};
                    constant.name = ReadString();
                    constant.offset = reader.ReadUInt32() / 4;
                    constant.size = reader.ReadUInt32() / 4;
                    constant.type = reader.ReadUInt8();
                    constant.dimension = reader.ReadUInt8();
                    constant.elements = reader.ReadUInt32();
                    constant.isSRGB = reader.ReadUInt8();
                    constant.isAutoregister = reader.ReadUInt8();
                    stage.constants[constantIx] = constant;

                    if (Tw2EffectRes.ConstantIgnore.includes(constant.name)) continue;

                    const last = constant.offset + constant.size;
                    if (last > stage.constantSize) stage.constantSize = last;
                }

                const constantValueSize = reader.ReadUInt32() / 4;
                stage.constantValues = new Float32Array(constantValueSize);
                if (version < 5)
                {
                    for (let i = 0; i < constantValueSize; ++i)
                    {
                        stage.constantValues[i] = reader.ReadFloat32();
                    }
                }
                else
                {
                    const
                        co = reader.ReadUInt32(),
                        bo = reader.cursor;

                    reader.cursor = stringTableOffset + co;
                    for (let i = 0; i < constantValueSize; ++i)
                    {
                        stage.constantValues[i] = reader.ReadFloat32();
                    }
                    reader.cursor = bo;
                }
                stage.constantSize = Math.max(stage.constantSize, constantValueSize);

                let textureCount = reader.ReadUInt8();
                for (let textureIx = 0; textureIx < textureCount; ++textureIx)
                {
                    const texture = {};
                    texture.registerIndex = reader.ReadUInt8();
                    texture.name = ReadString();
                    texture.type = reader.ReadUInt8();
                    texture.isSRGB = reader.ReadUInt8();
                    texture.isAutoregister = reader.ReadUInt8();
                    stage.textures.push(texture);
                }

                const samplerCount = reader.ReadUInt8();
                for (let samplerIx = 0; samplerIx < samplerCount; ++samplerIx)
                {
                    const
                        registerIndex = reader.ReadUInt8(),
                        samplerName = version >= 4 ? ReadString() : '';

                    reader.ReadUInt8(); // comparison

                    const
                        minFilter = reader.ReadUInt8(),
                        magFilter = reader.ReadUInt8(),
                        mipFilter = reader.ReadUInt8(),
                        addressU = reader.ReadUInt8(),
                        addressV = reader.ReadUInt8(),
                        addressW = reader.ReadUInt8();

                    reader.ReadFloat32(); // mipLODBias

                    const maxAnisotropy = reader.ReadUInt8();

                    reader.ReadUInt8(); //comparisonFunc

                    const borderColor = quat.create();
                    borderColor[0] = reader.ReadFloat32();
                    borderColor[1] = reader.ReadFloat32();
                    borderColor[2] = reader.ReadFloat32();
                    borderColor[3] = reader.ReadFloat32();

                    reader.ReadFloat32(); //minLOD
                    reader.ReadFloat32(); //maxLOD

                    if (version < 4) reader.ReadUInt8();

                    const sampler = new Tw2SamplerState();
                    sampler.registerIndex = registerIndex;
                    sampler.name = samplerName;

                    if (minFilter === 1)
                    {
                        switch (mipFilter)
                        {
                            case 0:
                                sampler.minFilter = d.gl.NEAREST;
                                break;

                            case 1:
                                sampler.minFilter = d.gl.NEAREST_MIPMAP_NEAREST;
                                break;

                            default:
                                sampler.minFilter = d.gl.NEAREST_MIPMAP_LINEAR;
                        }
                        sampler.minFilterNoMips = d.gl.NEAREST;
                    }
                    else
                    {
                        switch (mipFilter)
                        {
                            case 0:
                                sampler.minFilter = d.gl.LINEAR;
                                break;

                            case 1:
                                sampler.minFilter = d.gl.LINEAR_MIPMAP_NEAREST;
                                break;

                            default:
                                sampler.minFilter = d.gl.LINEAR_MIPMAP_LINEAR;
                        }
                        sampler.minFilterNoMips = d.gl.LINEAR;
                    }

                    sampler.magFilter = magFilter === 1 ? d.gl.NEAREST : d.gl.LINEAR;
                    sampler.addressU = d.wrapModes[addressU];
                    sampler.addressV = d.wrapModes[addressV];
                    sampler.addressW = d.wrapModes[addressW];

                    if (minFilter === 3 || magFilter === 3 || mipFilter === 3)
                    {
                        sampler.anisotropy = Math.max(maxAnisotropy, 1);
                    }

                    for (let n = 0; n < stage.textures.length; ++n)
                    {
                        if (stage.textures[n].registerIndex === sampler.registerIndex)
                        {
                            sampler.samplerType = stage.textures[n].type === 4 ? d.gl.TEXTURE_CUBE_MAP : d.gl.TEXTURE_2D;
                            sampler.isVolume = stage.textures[n].type === 3;
                            break;
                        }
                    }

                    sampler.ComputeHash();
                    stage.samplers.push(sampler);
                }

                if (version >= 3) reader.ReadUInt8();

                pass.stages[stageType] = stage;
            }

            pass.states = [];
            const stateCount = reader.ReadUInt8();
            for (let stateIx = 0; stateIx < stateCount; ++stateIx)
            {
                const
                    state = reader.ReadUInt32(),
                    value = reader.ReadUInt32();

                pass.states.push({
                    'state': state,
                    'value': value
                });
            }

            pass.shaderProgram = Tw2EffectRes.CreateProgram(pass.stages[0].shader, pass.stages[1].shader, pass, this);
            if (pass.shaderProgram === null)
            {
                this.PrepareFinished(false);
                return;
            }

            if (validShadowShader)
            {
                pass.shadowShaderProgram = Tw2EffectRes.CreateProgram(pass.stages[0].shadowShader, pass.stages[1].shadowShader, pass, this);
                if (pass.shadowShaderProgram === null)
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

        const parameterCount = reader.ReadUInt16();
        for (let paramIx = 0; paramIx < parameterCount; ++paramIx)
        {
            const
                name = ReadString(),
                annotations = [],
                annotationCount = reader.ReadUInt8();

            for (let annotationIx = 0; annotationIx < annotationCount; ++annotationIx)
            {
                annotations[annotationIx] = {};
                annotations[annotationIx].name = ReadString();
                annotations[annotationIx].type = reader.ReadUInt8();
                switch (annotations[annotationIx].type)
                {
                    case 0:
                        annotations[annotationIx].value = reader.ReadUInt32() !== 0;
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
    }

    /**
     * Applies an Effect Pass
     * @param {number} pass - effect.passes index
     */
    ApplyPass(pass)
    {
        const d = device;
        pass = this.passes[pass];

        for (let i = 0; i < pass.states.length; ++i)
        {
            d.SetRenderState(pass.states[i].state, pass.states[i].value);
        }

        if (d.IsAlphaTestEnabled())
        {
            d.gl.useProgram(pass.shadowShaderProgram.program);
            d.shadowHandles = pass.shadowShaderProgram;
        }
        else
        {
            d.gl.useProgram(pass.shaderProgram.program);
            d.shadowHandles = null;
        }
    }

    /**
     * Finds out if a parameter name is a valid shader input
     * @param {string} name - An Effect Parameter name
     * @returns {Boolean}
     */
    IsValidParameter(name)
    {
        return (name in this.annotations);
    }

    /**
     * Returns an array of valid parameter names for a specific annotation group
     * - Compatible with pre V5 shaders
     * @param {string} groupName - The name of an annotation group
     * @returns {Array.< string >}
     */
    GetParametersByGroup(groupName)
    {
        const parameters = [];
        for (let param in this.annotations)
        {
            if (this.annotations.hasOwnProperty(param))
            {
                for (let i = 0; i < this.annotations[param].length; i++)
                {
                    if (
                        this.annotations[param][i].name.toLowerCase() === 'group' &&
                        this.annotations[param][i].value.toLowerCase() === groupName.toLowerCase())
                    {
                        parameters.push(param);
                    }
                }
            }
        }
        return parameters;
    }

    /**
     * Compiles shader
     * @param {number} stageType
     * @param {string} prefix
     * @param shaderCode
     * @param {Tw2EffectRes} res - Shader path
     * @returns {*}
     */
    static CompileShader(stageType, prefix, shaderCode, res)
    {
        const
            d = device,
            shader = d.gl.createShader(stageType === 0 ? d.gl.VERTEX_SHADER : d.gl.FRAGMENT_SHADER);

        if (d.ext.ShaderBinary)
        {
            d.ext.ShaderBinary['shaderBinary'](shader, shaderCode);
        }
        else
        {
            let source = prefix + (typeof shaderCode === 'string' ? shaderCode : String.fromCharCode.apply(null, shaderCode));
            source = source.substr(0, source.length - 1);
            d.gl.shaderSource(shader, source);
            d.gl.compileShader(shader);
        }

        if (!d.gl.getShaderParameter(shader, d.gl.COMPILE_STATUS))
        {
            emitter.log('res.error', {
                log: 'error',
                src: ['Tw2EffectRes', 'CompileShader'],
                msg: 'Error compiling shader',
                path: res.path,
                type: 'shader.compile',
                value: (stageType === 0) ? 'VERTEX' : 'FRAGMENT',
                data: device.gl.getShaderInfoLog(shader)
            });
            return null;
        }
        return shader;
    }

    /**
     * Creates shader program
     * @param vertexShader
     * @param fragmentShader
     * @param pass
     * @param {Tw2EffectRes} res - Shader path
     * @returns {*}
     */
    static CreateProgram(vertexShader, fragmentShader, pass, res)
    {
        const
            d = device,
            program = {};

        program.program = d.gl.createProgram();
        d.gl.attachShader(program.program, vertexShader);
        d.gl.attachShader(program.program, fragmentShader);
        d.gl.linkProgram(program.program);

        if (!d.gl.getProgramParameter(program.program, d.gl.LINK_STATUS))
        {
            emitter.log('res.error', {
                log: 'error',
                src: ['Tw2EffectRes', 'CreateProgram'],
                msg: 'Error linking shaders',
                path: res.path,
                type: 'shader.linkstatus',
                data: device.gl.getProgramInfoLog(program.program)
            });
            return null;
        }

        d.gl.useProgram(program.program);
        program.constantBufferHandles = [];
        for (let j = 0; j < 16; ++j)
        {
            program.constantBufferHandles[j] = d.gl.getUniformLocation(program.program, 'cb' + j);
        }

        program.samplerHandles = [];
        for (let j = 0; j < 16; ++j)
        {
            program.samplerHandles[j] = d.gl.getUniformLocation(program.program, 's' + j);
            d.gl.uniform1i(program.samplerHandles[j], j);
        }

        for (let j = 0; j < 16; ++j)
        {
            program.samplerHandles[j + 12] = d.gl.getUniformLocation(program.program, 'vs' + j);
            d.gl.uniform1i(program.samplerHandles[j + 12], j + 12);
        }

        program.input = new Tw2VertexDeclaration();
        for (let j = 0; j < pass.stages[0].inputDefinition.elements.length; ++j)
        {
            let location = d.gl.getAttribLocation(program.program, 'attr' + j);
            if (location >= 0)
            {
                const el = new Tw2VertexElement(
                    pass.stages[0].inputDefinition.elements[j].usage,
                    pass.stages[0].inputDefinition.elements[j].usageIndex
                );
                el.location = location;
                program.input.elements.push(el);
            }
        }
        program.input.RebuildHash();

        program.shadowStateInt = d.gl.getUniformLocation(program.program, 'ssi');
        program.shadowStateFloat = d.gl.getUniformLocation(program.program, 'ssf');
        program.shadowStateYFlip = d.gl.getUniformLocation(program.program, 'ssyf');
        d.gl.uniform3f(program.shadowStateYFlip, 0, 0, 1);
        program.volumeSlices = [];
        for (let j = 0; j < pass.stages[1].samplers.length; ++j)
        {
            if (pass.stages[1].samplers[j].isVolume)
            {
                program.volumeSlices[pass.stages[1].samplers[j].registerIndex] = d.gl.getUniformLocation(program.program, 's' + pass.stages[1].samplers[j].registerIndex + 'sl');
            }
        }
        return program;
    }
}

/**
 * Constant names that are ignored
 * @type {string[]}
 */
Tw2EffectRes.ConstantIgnore = [
    'PerFrameVS',
    'PerObjectVS',
    'PerFramePS',
    'PerObjectPS'
];

/**
 * Request Response Type
 * @type {string}
 */
Tw2EffectRes.prototype.requestResponseType = 'arraybuffer';

