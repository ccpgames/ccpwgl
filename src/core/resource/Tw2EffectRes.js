import {Tw2BinaryReader} from '../reader';
import {Tw2Resource} from './Tw2Resource';
import {Tw2Shader} from './Tw2Shader';
import {Tw2ShaderHeaderSizeError, Tw2ShaderPermutationValueError, Tw2ShaderVersionError} from '../Tw2Error';

/**
 * Tw2EffectRes
 *
 * @property {Array} passes
 * @inherits Tw2Resource
 */
export class Tw2EffectRes extends Tw2Resource
{
    constructor()
    {
        super();
        this.passes = [];
        this.annotations = {};
        this.permutations = [];
        this.offsets = [];
        this.reader = null;
        this.version = 0;
        this.stringTable = '';
        this.shaders = {};
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
        this.permutations = [];
        this.offsets = [];
        this.passes = [];
        this.annotations = {};
        this.reader = null;
        this.version = 0;
        this.stringTable = '';
        this.shaders = {};

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
        if (version < 2 || version > 7)
        {
            this.OnError(new Tw2ShaderVersionError({path: this.path, version}));
            return;
        }

        let headerSize,
            stringTableSize;

        if (version < 5)
        {
            headerSize = reader.ReadUInt32();
            if (headerSize === 0)
            {
                this.OnError(new Tw2ShaderHeaderSizeError({path: this.path}));
                return;
            }

            /* let permutation = */
            reader.ReadUInt32();
            const offset = reader.ReadUInt32();
            reader.cursor = 2 * 4 + headerSize * 3 * 4;
            stringTableSize = reader.ReadUInt32();
            this.stringTableOffset = reader.cursor;
            stringTable = String.fromCharCode.apply(null, reader.data.subarray(reader.cursor, reader.cursor + stringTableSize));
            reader.cursor = offset;
        }
        else
        {
            stringTableSize = reader.ReadUInt32();
            this.stringTableOffset = reader.cursor;
            stringTable = String.fromCharCode.apply(null, reader.data.subarray(reader.cursor, reader.cursor + stringTableSize));
            reader.cursor += stringTableSize;
            const permutationCount = reader.ReadUInt8();
            for (let perm = 0; perm < permutationCount; ++perm)
            {
                let permutation = {
                    name: ReadString(),
                    defaultOption: reader.ReadUInt8(),
                    description: ReadString(),
                    type: reader.ReadUInt8(),
                    options: {},
                    optionCount: reader.ReadUInt8()
                };
                for (let j = 0; j < permutation.optionCount; ++j)
                {
                    permutation.options[ReadString()] = j;
                }
                this.permutations.push(permutation);
            }

            headerSize = reader.ReadUInt32();
            if (headerSize === 0)
            {
                this.OnError(new Tw2ShaderHeaderSizeError({path: this.path}));
                return;
            }

            for (let i = 0; i < headerSize; ++i)
            {
                this.offsets.push({
                    index: reader.ReadUInt32(),
                    offset: reader.ReadUInt32(),
                    size: reader.ReadUInt32()
                });
            }

            reader.ReadUInt32();
            reader.cursor = reader.ReadUInt32();
        }
        this.reader = reader;
        this.version = version;
        this.stringTable = stringTable;

        this.OnPrepared();
    }

    /**
     * Gets/creates a shader for the given permutation options
     *
     * @param {Object.<string, string>} options - Permutation options
     * @returns {Tw2Shader|null}
     */
    GetShader(options)
    {
        if (!this.IsGood())
        {
            return null;
        }

        let index = 0;
        let multiplier = 1;

        for (let i = 0; i < this.permutations.length; ++i)
        {
            let permutation = this.permutations[i];
            let value = permutation.defaultOption;
            if (options.hasOwnProperty(permutation.name))
            {
                let valueName = options[permutation.name];
                if (!permutation.options.hasOwnProperty(valueName))
                {
                    this.OnError(new Tw2ShaderPermutationValueError({
                        path: this.path,
                        permutation: permutation.name,
                        valueName: valueName
                    }));
                    return null;
                }
                value = permutation.options[valueName];
            }
            index += value * multiplier;
            multiplier *= permutation.optionCount;
        }

        if (this.shaders.hasOwnProperty(index))
        {
            return this.shaders[index];
        }

        this.reader.cursor = this.offsets[index].offset;
        let shader = null;
        try
        {
            shader = new Tw2Shader(this.reader, this.version, this.stringTable, this.stringTableOffset, this.path);
        }
        catch (error)
        {
            this.OnError(error);
            return null;
        }
        this.shaders[index] = shader;
        return shader;
    }
}

/**
 * Request Response Type
 * @type {string}
 */
Tw2EffectRes.prototype.requestResponseType = 'arraybuffer';
