import {store} from '../global/Tw2Store';
import {emitter} from '../global/Tw2EventEmitter';
import {Tw2BinaryReader} from './Tw2BinaryReader';

/**
 * Tw2ObjectReader
 *
 * @param {*} [xmlNode]
 * @property {*} xmlNode
 * @property {?Array} _inputStack
 * @property {?Array} _initializeObjects
 * @property {?Array} _ids
 * @property {?Tw2BinaryReader} _reader
 * @property {??Array} _stringTable
 * @property {?number} _start
 * @class
 */
export class Tw2ObjectReader
{
    constructor(xmlNode = null)
    {
        this.xmlNode = xmlNode;
        this._inputStack = null;
        this._initializeObjects = null;
        this._ids = null;
        this._reader = null;
        this._stringTable = null;
        this._start = null;

        if (xmlNode) this.Initialize();
    }

    /**
     * Initializes the object reader
     * @returns {boolean}
     */
    Initialize()
    {
        if (!Tw2ObjectReader.IsValidXML(this.xmlNode))
        {
            throw new Error('Invalid XML, expected binred');
        }

        this._reader = new Tw2BinaryReader(new Uint8Array(this.xmlNode));
        this._reader.cursor += 6;
        this._stringTable = [];
        this._ids = [];

        const count = this._reader.ReadUInt32();
        for (let i = 0; i < count; ++i)
        {
            const len = this._reader.ReadUInt16();
            this._stringTable.push(String.fromCharCode.apply(null, this._reader.data.subarray(this._reader.cursor, this._reader.cursor + len)));
            this._reader.cursor += len;
        }

        this._start = this._reader.cursor;
    }

    /**
     * Constructs the xml
     * @returns {*}
     */
    Construct()
    {
        this._reader.cursor = this._start;
        return this._ReadElement();
    }

    /**
     * Reads a Uint
     * @param type
     * @returns {*}
     */
    _ReadUint(type)
    {
        switch (type & 0x30)
        {
            case Tw2ObjectReader.ElementSize.SMALL:
                return this._reader.ReadUInt8();

            case Tw2ObjectReader.ElementSize.MEDIUM:
                return this._reader.ReadUInt16();

            default:
                return this._reader.ReadUInt32();
        }
    }

    /**
     * Reads an element's data
     * @param type
     * @returns {*}
     */
    _ReadElementData(type)
    {
        let offset, result, count, elementType;

        switch (type & 0xf)
        {
            case Tw2ObjectReader.ElementRawType.NULL:
                return null;

            case Tw2ObjectReader.ElementRawType.BOOL:
                switch (type & 0x30)
                {
                    case Tw2ObjectReader.ElementSize.SMALL:
                        return this._reader.ReadUInt8() !== 0;

                    case Tw2ObjectReader.ElementSize.MEDIUM:
                        return false;

                    default:
                        return true;
                }

            case Tw2ObjectReader.ElementRawType.INT:
                switch (type & 0x30)
                {
                    case Tw2ObjectReader.ElementSize.SMALL:
                        return this._reader.ReadInt8();

                    case Tw2ObjectReader.ElementSize.MEDIUM:
                        return this._reader.ReadInt16();

                    default:
                        return this._reader.ReadInt32();
                }

            case Tw2ObjectReader.ElementRawType.UINT:
                return this._ReadUint(type);

            case Tw2ObjectReader.ElementRawType.FLOAT:
                switch (type & 0x30)
                {
                    case Tw2ObjectReader.ElementSize.SMALL:
                        return this._reader.ReadFloat16();

                    case Tw2ObjectReader.ElementSize.MEDIUM:
                        return this._reader.ReadFloat32();

                    default:
                        throw Error('float64 values are not yet supported');
                }

            case Tw2ObjectReader.ElementRawType.STRING:
                offset = this._ReadUint(type);
                return this._stringTable[offset];

            case Tw2ObjectReader.ElementRawType.ARRAY:
                count = this._ReadUint(type);
                result = [];
                for (let i = 0; i < count; ++i)
                {
                    result.push(this._ReadElement());
                }
                return result;

            case Tw2ObjectReader.ElementRawType.MAPPING:
                count = this._ReadUint(type);
                result = {};
                for (let i = 0; i < count; ++i)
                {
                    result[this._stringTable[this._ReadUint(type)]] = this._ReadElement();
                }
                return result;

            case Tw2ObjectReader.ElementRawType.OBJECT:
                count = this._ReadUint(type);
                result = {};
                for (let i = 0; i < count; ++i)
                {
                    result[this._stringTable[this._ReadUint(type)]] = this._ReadElement();
                }
                return Tw2ObjectReader.ConstructObject(result);

            case Tw2ObjectReader.ElementRawType.TYPED_ARRAY:
                count = this._ReadUint(type);
                elementType = this._reader.ReadUInt8();
                result = [];
                for (let i = 0; i < count; ++i)
                {
                    result.push(this._ReadElementData(elementType));
                }
                if (elementType in Tw2ObjectReader.TypedArrays)
                {
                    result = new Tw2ObjectReader.TypedArrays[elementType](result);
                }
                return result;

            case Tw2ObjectReader.ElementRawType.TYPED_MAPPING:
                count = this._ReadUint(type);
                elementType = this._reader.ReadUInt8();
                result = {};
                for (let i = 0; i < count; ++i)
                {
                    result[this._stringTable[this._ReadUint(type)]] = this._ReadElementData(elementType);
                }
                return result;
        }
    }

    /**
     * Reads an element
     * @returns {*}
     */
    _ReadElement()
    {
        const type = this._reader.ReadUInt8();
        if (type === Tw2ObjectReader.REFERENCE_BIT)
        {
            return this._ids[this._reader.ReadUInt16()];
        }

        let id;
        if ((type & Tw2ObjectReader.ID_BIT) !== 0)
        {
            id = this._reader.ReadUInt16();
        }

        const result = this._ReadElementData(type & 0x3F);
        if ((type & Tw2ObjectReader.ID_BIT) !== 0)
        {
            this._ids[id] = result;
        }

        return result;
    }

    /**
     * Checks if the supplied xml is valid
     * @param {*} xml
     * @returns {boolean}
     */
    static IsValidXML(xml)
    {
        return (xml && String.fromCharCode.apply(null, (new Uint8Array(xml)).subarray(0, 6)) === 'binred');
    }

    /**
     * Constructs an object
     * @param {*} data
     * @returns {*}
     */
    static ConstructObject(data)
    {
        let object;

        if (data.type === 'json')
        {
            return data;
        }

        try
        {
            const Constructor = store.GetConstructor(data.type);
            object = new Constructor();
        }
        catch (e)
        {
            emitter.log('res.error', {
                log: 'error',
                msg: 'Object with undefined type',
                type: 'xml.type',
                value: data.type,
                err: e
            });

            throw new Error(`YAML: object with undefined type '${data.type}'`);
        }

        for (let k in data)
        {
            if (data.hasOwnProperty(k) && k !== 'type')
            {
                if (object[k] && data[k].constructor === Object)
                {
                    for (let key in data[k])
                    {
                        if (data[k].hasOwnProperty(key))
                        {
                            object[k][key] = data[k][key];
                        }
                    }
                }
                else
                {
                    object[k] = data[k];
                }
            }
        }

        return object;
    }
}

Tw2ObjectReader.ID_BIT = 1 << 6;

Tw2ObjectReader.REFERENCE_BIT = 1 << 7;

Tw2ObjectReader.ElementRawType = {
    'NULL': 0,
    'BOOL': 1,
    'INT': 2,
    'UINT': 3,
    'FLOAT': 4,
    'STRING': 5,
    'ARRAY': 6,
    'MAPPING': 7,
    'OBJECT': 8,
    'TYPED_ARRAY': 9,
    'TYPED_MAPPING': 10
};

Tw2ObjectReader.ElementSize = {
    'SMALL': 0,
    'MEDIUM': 1 << 4,
    'LARGE': 2 << 4
};

Tw2ObjectReader.ElementTypes = {
    'NULL': Tw2ObjectReader.ElementRawType.NULL | Tw2ObjectReader.ElementSize.SMALL,

    'BOOL': Tw2ObjectReader.ElementRawType.BOOL | Tw2ObjectReader.ElementSize.SMALL,
    'FALSE': Tw2ObjectReader.ElementRawType.BOOL | Tw2ObjectReader.ElementSize.MEDIUM,
    'TRUE': Tw2ObjectReader.ElementRawType.BOOL | Tw2ObjectReader.ElementSize.LARGE,

    'INT8': Tw2ObjectReader.ElementRawType.INT | Tw2ObjectReader.ElementSize.SMALL,
    'UINT8': Tw2ObjectReader.ElementRawType.UINT | Tw2ObjectReader.ElementSize.SMALL,
    'INT16': Tw2ObjectReader.ElementRawType.INT | Tw2ObjectReader.ElementSize.MEDIUM,
    'UINT16': Tw2ObjectReader.ElementRawType.UINT | Tw2ObjectReader.ElementSize.MEDIUM,
    'INT32': Tw2ObjectReader.ElementRawType.INT | Tw2ObjectReader.ElementSize.LARGE,
    'UINT32': Tw2ObjectReader.ElementRawType.UINT | Tw2ObjectReader.ElementSize.LARGE,

    'FLOAT16': Tw2ObjectReader.ElementRawType.FLOAT | Tw2ObjectReader.ElementSize.SMALL,
    'FLOAT32': Tw2ObjectReader.ElementRawType.FLOAT | Tw2ObjectReader.ElementSize.MEDIUM,
    'FLOAT64': Tw2ObjectReader.ElementRawType.FLOAT | Tw2ObjectReader.ElementSize.LARGE,

    'SHORT_STRING': Tw2ObjectReader.ElementRawType.STRING | Tw2ObjectReader.ElementSize.SMALL,
    'MEDIUM_STRING': Tw2ObjectReader.ElementRawType.STRING | Tw2ObjectReader.ElementSize.MEDIUM,
    'LARGE_STRING': Tw2ObjectReader.ElementRawType.STRING | Tw2ObjectReader.ElementSize.LARGE,

    'SHORT_ARRAY': Tw2ObjectReader.ElementRawType.ARRAY | Tw2ObjectReader.ElementSize.SMALL,
    'MEDIUM_ARRAY': Tw2ObjectReader.ElementRawType.ARRAY | Tw2ObjectReader.ElementSize.MEDIUM,
    'LARGE_ARRAY': Tw2ObjectReader.ElementRawType.ARRAY | Tw2ObjectReader.ElementSize.LARGE,

    'SHORT_MAPPING': Tw2ObjectReader.ElementRawType.MAPPING | Tw2ObjectReader.ElementSize.SMALL,
    'MEDIUM_MAPPING': Tw2ObjectReader.ElementRawType.MAPPING | Tw2ObjectReader.ElementSize.MEDIUM,
    'LARGE_MAPPING': Tw2ObjectReader.ElementRawType.MAPPING | Tw2ObjectReader.ElementSize.LARGE,

    'SHORT_OBJECT': Tw2ObjectReader.ElementRawType.OBJECT | Tw2ObjectReader.ElementSize.SMALL,
    'MEDIUM_OBJECT': Tw2ObjectReader.ElementRawType.OBJECT | Tw2ObjectReader.ElementSize.MEDIUM,
    'LARGE_OBJECT': Tw2ObjectReader.ElementRawType.OBJECT | Tw2ObjectReader.ElementSize.LARGE,

    'SHORT_TYPED_ARRAY': Tw2ObjectReader.ElementRawType.TYPED_ARRAY | Tw2ObjectReader.ElementSize.SMALL,
    'MEDIUM_TYPED_ARRAY': Tw2ObjectReader.ElementRawType.TYPED_ARRAY | Tw2ObjectReader.ElementSize.MEDIUM,
    'LARGE_TYPED_ARRAY': Tw2ObjectReader.ElementRawType.TYPED_ARRAY | Tw2ObjectReader.ElementSize.LARGE,

    'SHORT_TYPED_MAPPING': Tw2ObjectReader.ElementRawType.TYPED_MAPPING | Tw2ObjectReader.ElementSize.SMALL,
    'MEDIUM_TYPED_MAPPING': Tw2ObjectReader.ElementRawType.TYPED_MAPPING | Tw2ObjectReader.ElementSize.MEDIUM,
    'LARGE_TYPED_MAPPING': Tw2ObjectReader.ElementRawType.TYPED_MAPPING | Tw2ObjectReader.ElementSize.LARGE
};

Tw2ObjectReader.TypedArrays = {
    2: Int8Array,
    3: Uint8Array,
    18: Int16Array,
    19: Uint16Array,
    34: Int32Array,
    35: Uint32Array,
    4: Float32Array,
    20: Float32Array,
    36: Float64Array
};
