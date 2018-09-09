import {store} from '../../global';
import {Tw2BinaryReader} from './Tw2BinaryReader';
import {Tw2FeatureNotImplementedError, Tw2XMLBinaryError, Tw2XMLObjectTypeUndefinedError} from '../Tw2Error';

/**
 * Tw2ObjectReader
 *
 * @param {string} xmlNode
 * @property {string} xmlNode
 * @property {?Array} _inputStack
 * @property {?Array} _initializeObjects
 * @property {?Object} _ids
 * @property {Tw2BinaryReader} _reader
 * @property {?Array} _stringTable
 * @property {?number} _start
 * @class
 */
export class Tw2ObjectReader
{
    constructor(xmlNode)
    {
        this.xmlNode = xmlNode;
        this._inputStack = null;
        this._initializeObjects = null;
        this._ids = {};
        this._reader = null;
        this._stringTable = null;
        this._start = null;

        if (xmlNode) this.Initialize();
    }

    /**
     * Initializes the object reader
     */
    Initialize()
    {
        if (!Tw2ObjectReader.IsValidXML(this.xmlNode))
        {
            throw new Tw2XMLBinaryError({message: 'Invalid binary, expected binred'});
        }

        this._reader = new Tw2BinaryReader(new Uint8Array(this.xmlNode));
        this._reader.cursor += 6;
        this._stringTable = [];

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
     * Constructs the loaded xml
     * @returns {*}
     */
    Construct()
    {
        this._reader.cursor = this._start;
        return Tw2ObjectReader.ReadElement(this);
    }

    /**
     * Checks that the passed xml is valid
     * @param {*} xmlNode
     * @returns {boolean}
     */
    static IsValidXML(xmlNode)
    {
        return (xmlNode && String.fromCharCode.apply(null, (new Uint8Array(xmlNode)).subarray(0, 6)) === 'binred');
    }

    /**
     * Constructs an object
     * @param {*} data
     * @returns {*}
     */
    static ConstructObject(data)
    {
        if (data.type === 'json')
        {
            return data;
        }

        let Constructor = store.GetConstructor(data.type);
        if (!Constructor)
        {
            if (Tw2ObjectReader.DEBUG_ENABLED)
            {
                Constructor = Object;
            }
            else
            {
                throw new Tw2XMLObjectTypeUndefinedError({type: data.type});
            }
        }

        const object = new Constructor();
        for (let k in data)
        {
            if (data.hasOwnProperty(k) && k !== 'type')
            {
                if (data[k].constructor === Object)
                {
                    if (this.DEBUG_ENABLED)
                    {
                        object[k] = object[k] || {};
                    }

                    if (object[k])
                    {
                        for (let key in data[k])
                        {
                            if (data[k].hasOwnProperty(key))
                            {
                                object[k][key] = data[k][key];
                            }
                        }
                    }
                }
                else
                {
                    object[k] = data[k];
                }
            }
        }

        if ('Initialize' in object)
        {
            object.Initialize();
        }

        return object;
    }

    /**
     * Reads a Uint
     * @param {Tw2ObjectReader} objReader
     * @param {number} type
     * @returns {*}
     */
    static ReadUint(objReader, type)
    {
        switch (type & 0x30)
        {
            case this.ElementSize.SMALL:
                return objReader._reader.ReadUInt8();

            case this.ElementSize.MEDIUM:
                return objReader._reader.ReadUInt16();

            default:
                return objReader._reader.ReadUInt32();
        }
    }

    /**
     * Reads element data
     * @param {Tw2ObjectReader} objReader
     * @param {number} type
     * @returns {*}
     */
    static ReadElementData(objReader, type)
    {
        let offset, i, result, count, elementType;
        switch (type & 0xf)
        {
            case this.ElementRawType.NULL:
                return null;

            case this.ElementRawType.BOOL:
                switch (type & 0x30)
                {
                    case this.ElementSize.SMALL:
                        return objReader._reader.ReadUInt8() !== 0;

                    case this.ElementSize.MEDIUM:
                        return false;

                    default:
                        return true;
                }

            case this.ElementRawType.INT:
                switch (type & 0x30)
                {
                    case this.ElementSize.SMALL:
                        return objReader._reader.ReadInt8();

                    case this.ElementSize.MEDIUM:
                        return objReader._reader.ReadInt16();

                    default:
                        return objReader._reader.ReadInt32();
                }

            case this.ElementRawType.UINT:
                return this.ReadUint(objReader, type);

            case this.ElementRawType.FLOAT:
                switch (type & 0x30)
                {
                    case this.ElementSize.SMALL:
                        return objReader._reader.ReadFloat16();

                    case this.ElementSize.MEDIUM:
                        return objReader._reader.ReadFloat32();

                    default:
                        throw new Tw2FeatureNotImplementedError({value: 'Float64'});
                }

            case this.ElementRawType.STRING:
                offset = this.ReadUint(objReader, type);
                return objReader._stringTable[offset];

            case this.ElementRawType.ARRAY:
                count = this.ReadUint(objReader, type);
                result = [];
                for (i = 0; i < count; ++i)
                {
                    result.push(this.ReadElement(objReader));
                }
                return result;

            case this.ElementRawType.MAPPING:
                count = this.ReadUint(objReader, type);
                result = {};
                for (i = 0; i < count; ++i)
                {
                    result[objReader._stringTable[this.ReadUint(objReader, type)]] = this.ReadElement(objReader);
                }
                return result;

            case this.ElementRawType.OBJECT:
                count = this.ReadUint(objReader, type);
                result = {};
                for (i = 0; i < count; ++i)
                {
                    result[objReader._stringTable[this.ReadUint(objReader, type)]] = this.ReadElement(objReader);
                }
                return this.ConstructObject(result);

            case this.ElementRawType.TYPED_ARRAY:
                count = this.ReadUint(objReader, type);
                elementType = objReader._reader.ReadUInt8();
                result = [];
                for (i = 0; i < count; ++i)
                {
                    result.push(this.ReadElementData(objReader, elementType));
                }

                if (elementType in this.TypedArrays)
                {
                    result = new this.TypedArrays[elementType](result);
                }
                return result;

            case this.ElementRawType.TYPED_MAPPING:
                count = this.ReadUint(objReader, type);
                elementType = objReader._reader.ReadUInt8();
                result = {};
                for (i = 0; i < count; ++i)
                {
                    result[objReader._stringTable[this.ReadUint(objReader, type)]] = this.ReadElementData(objReader, elementType);
                }
                return result;
        }
    }

    /**
     * Reads an element
     * @property {Tw2ObjectReader} objReader
     * @returns {*}
     */
    static ReadElement(objReader)
    {
        const type = objReader._reader.ReadUInt8();
        if (type === this.REFERENCE_BIT)
        {
            return objReader._ids[objReader._reader.ReadUInt16()];
        }

        let id;
        if ((type & this.ID_BIT) !== 0)
        {
            id = objReader._reader.ReadUInt16();
        }

        const result = this.ReadElementData(objReader, type & 0x3F);
        if ((type & this.ID_BIT) !== 0)
        {
            objReader._ids[id] = result;
        }
        return result;
    }
}

/**
 * Enables debug mode
 * @type {boolean}
 */
Tw2ObjectReader.DEBUG_ENABLED = false;

/**
 * ID Bit
 * @type {number}
 */
Tw2ObjectReader.ID_BIT = 1 << 6;

/**
 * Reference Bit
 * @type {number}
 */
Tw2ObjectReader.REFERENCE_BIT = 1 << 7;

/**
 * Raw element types
 * @type {{}}
 */
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

/**
 * Element sizes
 * @type {{SMALL: number, MEDIUM: number, LARGE: number}}
 */
Tw2ObjectReader.ElementSize = {
    'SMALL': 0,
    'MEDIUM': 1 << 4,
    'LARGE': 2 << 4
};

/**
 * Element types
 * @type {{}}
 */
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

/**
 * Typed array types
 * @type {{number:Function}}
 */
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