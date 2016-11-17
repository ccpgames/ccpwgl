/**
 * Tw2ObjectReader
 * @param xmlNode
 * @property xmlNode
 * @property {null|Array} _inputStack
 * @property {null|Array} _initializeObjects
 * @property {null|Array} _ids
 * @constructor
 */
function Tw2ObjectReader(xmlNode)
{
    this.xmlNode = xmlNode;
    this._inputStack = null;
    this._initializeObjects = null;
    this._ids = {};
    this._reader = null;

    if (String.fromCharCode.apply(null, (new Uint8Array(xmlNode)).subarray(0, 6)) != 'binred')
    {
        emitter.log('res.error',
        {
            log: 'error',
            src: ['Tw2ObjectReader', 'constructor'],
            msg: 'Invalid Binary',
            path: this.path,
            type: 'redbin.invalid',
            data: xmlNode
        });
        return;
    }
    this._reader = new Tw2BinaryReader(new Uint8Array(xmlNode));
    this._reader.cursor += 6;

    this._stringTable = [];
    var count = this._reader.ReadUInt32();
    for (var i = 0; i < count; ++i)
    {
        var len = this._reader.ReadUInt16();
        this._stringTable.push(String.fromCharCode.apply(null, this._reader.data.subarray(this._reader.cursor, this._reader.cursor + len)));
        this._reader.cursor += len;
    }

    this._start = this._reader.cursor;
}

Tw2ObjectReader.ElementRawType = {
    NULL: 0,
    BOOL: 1,
    INT: 2,
    UINT: 3,
    FLOAT: 4,
    STRING: 5,
    ARRAY: 6,
    MAPPING: 7,
    OBJECT: 8,
    TYPED_ARRAY: 9,
    TYPED_MAPPING: 10
};

Tw2ObjectReader.ElementSize = {
    SMALL: 0,
    MEDIUM: 1 << 4,
    LARGE: 2 << 4
};

Tw2ObjectReader.ID_BIT = 1 << 6;
Tw2ObjectReader.REFERENCE_BIT = 1 << 7;

Tw2ObjectReader.ElementTypes = {
    NULL: Tw2ObjectReader.ElementRawType.NULL | Tw2ObjectReader.ElementSize.SMALL,

    BOOL: Tw2ObjectReader.ElementRawType.BOOL | Tw2ObjectReader.ElementSize.SMALL,
    FALSE: Tw2ObjectReader.ElementRawType.BOOL | Tw2ObjectReader.ElementSize.MEDIUM,
    TRUE: Tw2ObjectReader.ElementRawType.BOOL | Tw2ObjectReader.ElementSize.LARGE,

    INT8: Tw2ObjectReader.ElementRawType.INT | Tw2ObjectReader.ElementSize.SMALL,
    UINT8: Tw2ObjectReader.ElementRawType.UINT | Tw2ObjectReader.ElementSize.SMALL,
    INT16: Tw2ObjectReader.ElementRawType.INT | Tw2ObjectReader.ElementSize.MEDIUM,
    UINT16: Tw2ObjectReader.ElementRawType.UINT | Tw2ObjectReader.ElementSize.MEDIUM,
    INT32: Tw2ObjectReader.ElementRawType.INT | Tw2ObjectReader.ElementSize.LARGE,
    UINT32: Tw2ObjectReader.ElementRawType.UINT | Tw2ObjectReader.ElementSize.LARGE,

    FLOAT16: Tw2ObjectReader.ElementRawType.FLOAT | Tw2ObjectReader.ElementSize.SMALL,
    FLOAT32: Tw2ObjectReader.ElementRawType.FLOAT | Tw2ObjectReader.ElementSize.MEDIUM,
    FLOAT64: Tw2ObjectReader.ElementRawType.FLOAT | Tw2ObjectReader.ElementSize.LARGE,

    SHORT_STRING: Tw2ObjectReader.ElementRawType.STRING | Tw2ObjectReader.ElementSize.SMALL,
    MEDIUM_STRING: Tw2ObjectReader.ElementRawType.STRING | Tw2ObjectReader.ElementSize.MEDIUM,
    LARGE_STRING: Tw2ObjectReader.ElementRawType.STRING | Tw2ObjectReader.ElementSize.LARGE,

    SHORT_ARRAY: Tw2ObjectReader.ElementRawType.ARRAY | Tw2ObjectReader.ElementSize.SMALL,
    MEDIUM_ARRAY: Tw2ObjectReader.ElementRawType.ARRAY | Tw2ObjectReader.ElementSize.MEDIUM,
    LARGE_ARRAY: Tw2ObjectReader.ElementRawType.ARRAY | Tw2ObjectReader.ElementSize.LARGE,

    SHORT_MAPPING: Tw2ObjectReader.ElementRawType.MAPPING | Tw2ObjectReader.ElementSize.SMALL,
    MEDIUM_MAPPING: Tw2ObjectReader.ElementRawType.MAPPING | Tw2ObjectReader.ElementSize.MEDIUM,
    LARGE_MAPPING: Tw2ObjectReader.ElementRawType.MAPPING | Tw2ObjectReader.ElementSize.LARGE,

    SHORT_OBJECT: Tw2ObjectReader.ElementRawType.OBJECT | Tw2ObjectReader.ElementSize.SMALL,
    MEDIUM_OBJECT: Tw2ObjectReader.ElementRawType.OBJECT | Tw2ObjectReader.ElementSize.MEDIUM,
    LARGE_OBJECT: Tw2ObjectReader.ElementRawType.OBJECT | Tw2ObjectReader.ElementSize.LARGE,

    SHORT_TYPED_ARRAY: Tw2ObjectReader.ElementRawType.TYPED_ARRAY | Tw2ObjectReader.ElementSize.SMALL,
    MEDIUM_TYPED_ARRAY: Tw2ObjectReader.ElementRawType.TYPED_ARRAY | Tw2ObjectReader.ElementSize.MEDIUM,
    LARGE_TYPED_ARRAY: Tw2ObjectReader.ElementRawType.TYPED_ARRAY | Tw2ObjectReader.ElementSize.LARGE,

    SHORT_TYPED_MAPPING: Tw2ObjectReader.ElementRawType.TYPED_MAPPING | Tw2ObjectReader.ElementSize.SMALL,
    MEDIUM_TYPED_MAPPING: Tw2ObjectReader.ElementRawType.TYPED_MAPPING | Tw2ObjectReader.ElementSize.MEDIUM,
    LARGE_TYPED_MAPPING: Tw2ObjectReader.ElementRawType.TYPED_MAPPING | Tw2ObjectReader.ElementSize.LARGE
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


Tw2ObjectReader.prototype._ConstructObject = function (data)
{
    if (data.type == 'json')
    {
        return data;
    }
    try
    {
        var object = eval("new " + data.type + "()");
    }
    catch (e)
    {
        emitter.log('res.error',
        {
            log: 'throw',
            src: ['Tw2ObjectReader', 'ConstructFromNode'],
            msg: 'Object with undefined type',
            type: 'xml.type',
            value: data.type
        });

        throw new Error('YAML: object with undefined type \"' + data.type + '\"');
    }
    for (var k in data)
    {
        if (data.hasOwnProperty(k) && k != 'type')
        {
            object[k] = data[k];
        }
    }
    if ('Initialize' in object)
    {
        object.Initialize();
    }
    return object;
};


Tw2ObjectReader.prototype._ReadUint = function (type)
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
};

Tw2ObjectReader.prototype._ReadElementData = function (type)
{
    var offset, i, result, count, elementType;
    switch (type & 0xf)
    {
        case Tw2ObjectReader.ElementRawType.NULL:
            return null;
        case Tw2ObjectReader.ElementRawType.BOOL:
            switch (type & 0x30)
            {
                case Tw2ObjectReader.ElementSize.SMALL:
                    return this._reader.ReadUInt8() != 0;
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
            for (i = 0; i < count; ++i)
                result.push(this._ReadElement());
            return result;
        case Tw2ObjectReader.ElementRawType.MAPPING:
            count = this._ReadUint(type);
            result = {};
            for (i = 0; i < count; ++i)
                result[this._stringTable[this._ReadUint(type)]] = this._ReadElement();
            return result;
        case Tw2ObjectReader.ElementRawType.OBJECT:
            count = this._ReadUint(type);
            result = {};
            for (i = 0; i < count; ++i)
                result[this._stringTable[this._ReadUint(type)]] = this._ReadElement();
            return this._ConstructObject(result);
        case Tw2ObjectReader.ElementRawType.TYPED_ARRAY:
            count = this._ReadUint(type);
            elementType = this._reader.ReadUInt8();
            result = [];
            for (i = 0; i < count; ++i)
                result.push(this._ReadElementData(elementType));
            if (elementType in Tw2ObjectReader.TypedArrays)
            {
                result = new Tw2ObjectReader.TypedArrays[elementType](result);
            }
            return result;
        case Tw2ObjectReader.ElementRawType.TYPED_MAPPING:
            count = this._ReadUint(type);
            elementType = this._reader.ReadUInt8();
            result = {};
            for (i = 0; i < count; ++i)
                result[this._stringTable[this._ReadUint(type)]] = this._ReadElementData(elementType);
            return result;
    }
};

Tw2ObjectReader.prototype._ReadElement = function()
{
    var type = this._reader.ReadUInt8();
    if (type == Tw2ObjectReader.REFERENCE_BIT)
    {
        return this._ids[this._reader.ReadUInt16()];
    }
    var id;
    if ((type & Tw2ObjectReader.ID_BIT) != 0)
    {
        id = this._reader.ReadUInt16();
    }
    var result = this._ReadElementData(type & 0x3F);
    if ((type & Tw2ObjectReader.ID_BIT) != 0)
    {
        this._ids[id] = result;
    }
    return result;
};

Tw2ObjectReader.prototype.Construct = function()
{
    this._reader.cursor = this._start;
    return this._ReadElement();
};


/**
 * Construct
 * @param initialize
 * @returns {Function}
 */
/*Tw2ObjectReader.prototype.Construct = function(initialize)
{
    this._inputStack = [];
    this._inputStack.push([this.xmlNode.documentElement, this, 'result']);
    this._initializeObjects = [];
    this._ids = [];
    var self = this;
    return function()
    {
        return self.ConstructFromNode(initialize, true);
    };
};
*/


/**
 * ConstructFromNode
 * @param initialize
 * @param async
 * @returns {Boolean}
 */
Tw2ObjectReader.prototype.ConstructFromNode = function(initialize, async)
{
    var now = new Date();
    var startTime = now.getTime();
    while (this._inputStack.length)
    {
        var endTime = now.getTime();
        if (async && resMan.prepareBudget < (endTime - startTime) * 0.001)
        {
            return false;
        }
        var inputData = this._inputStack.pop();
        var xmlNode = inputData[0];
        var parent = inputData[1];
        var index = inputData[2];
        if (xmlNode == null)
        {
            if (initialize && typeof(parent.Initialize) != 'undefined')
            {
                this._initializeObjects.push(parent);
                //parent.Initialize();
            }
            continue;
        }
        var ref = xmlNode.attributes.getNamedItem('ref');
        if (ref)
        {
            var object = this._ids[ref.value];
            //this._inputStack.push([null, object, null]);
            parent[index] = object;
            continue;
        }
        var type = xmlNode.attributes.getNamedItem('type');
        if (type)
        {
            var object = null;
            if (type.value == 'dict')
            {
                object = {};
            }
            else
            {
                try
                {
                    object = eval("new " + type.value + "()");
                }
                catch (e)
                {
                    emitter.log('res.error',
                    {
                        log: 'throw',
                        src: ['Tw2ObjectReader', 'ConstructFromNode'],
                        msg: 'Object with undefined type',
                        type: 'xml.type',
                        value: type.value
                    });

                    throw new Error('YAML: object with undefined type \"' + type.value + '\"');
                }
            }
            this._inputStack.push([null, object, null]);
            for (var i = 0; i < xmlNode.childNodes.length; ++i)
            {
                var child = xmlNode.childNodes[xmlNode.childNodes.length - 1 - i];
                if (child.nodeName == '#text')
                {
                    continue;
                }
                if (type.value != 'dict')
                {
                    if (typeof(object[child.nodeName]) == 'undefined')
                    {
                        emitter.log('res.error',
                        {
                            log: 'warn',
                            src: ['Tw2ObjectReader', 'ConstructFromNode'],
                            msg: 'Object "' + type.value + '" missing property: ' + child.nodeName,
                            value: child.nodeName,
                            type: 'xml.property',
                            value: child.nodeName
                        });

                        continue;
                    }
                }
                this._inputStack.push([child, object, child.nodeName]);
            }
            var id = xmlNode.attributes.getNamedItem('id');
            if (id)
            {
                this._ids[id.value] = object;
            }
            parent[index] = object;
            continue;
        }

        var list = xmlNode.attributes.getNamedItem('list');
        if (list)
        {
            object = [];
            var arrayIndex = 0;
            this._inputStack.push([null, object, null]);
            for (var i = 0; i < xmlNode.childNodes.length; ++i)
            {
                var child = xmlNode.childNodes[xmlNode.childNodes.length - 1 - i];
                if (child.nodeName == '#text')
                {
                    continue;
                }
                arrayIndex++;
            }
            for (var i = 0; i < xmlNode.childNodes.length; ++i)
            {
                var child = xmlNode.childNodes[xmlNode.childNodes.length - 1 - i];
                if (child.nodeName == '#text')
                {
                    continue;
                }
                this._inputStack.push([child, object, --arrayIndex]);
            }
            var id = xmlNode.attributes.getNamedItem('id');
            if (id)
            {
                this._ids[id.value] = object;
            }
            parent[index] = object;
            continue;
        }

        var value = '';
        for (var i = 0; i < xmlNode.childNodes.length; ++i)
        {
            var child = xmlNode.childNodes[i];
            if (child.nodeName == '#text')
            {
                value += child.data;
            }
        }

        var json = xmlNode.attributes.getNamedItem('json');
        if (json)
        {
            try
            {
                parent[index] = JSON.parse(value);
            }
            catch (e)
            {
                emitter.log('res.error',
                {
                    log: 'throw',
                    src: ['Tw2ObjectReader', 'ConstructFromNode'],
                    msg: 'Invalid JSON property',
                    type: 'xml.json',
                    value: value,
                    data: e
                });

                throw new Error('YAML: property \"' + value + '\" is not a valid JSON property');
            }
            if (!xmlNode.attributes.getNamedItem('notnum'))
            {
                try
                {
                    parent[index] = new Float32Array(parent[index]);
                }
                catch (e)
                {}
            }
            var id = xmlNode.attributes.getNamedItem('id');
            if (id)
            {
                this._ids[id.value] = parent[index];
            }
            continue;
        }

        var capture = (/^(\-?\d+\.\d+(?:e|E\-?\d+)?)/).exec(value);
        if (capture)
        {
            parent[index] = parseFloat(capture[1]);
            continue;
        }

        capture = (/^(\-?\d+)/).exec(value);
        if (capture)
        {
            parent[index] = parseInt(capture[1], 10);
            continue;
        }

        capture = (/^\b(enabled|true|yes|on)\b/).exec(value);
        if (capture)
        {
            parent[index] = true;
            continue;
        }

        capture = (/^\b(disabled|false|no|off)\b/).exec(value);
        if (capture)
        {
            parent[index] = false;
            continue;
        }

        parent[index] = value;
    }
    while (this._initializeObjects.length)
    {
        var endTime = now.getTime();
        if (async && resMan.prepareBudget < (endTime - startTime) * 0.001)
        {
            return false;
        }
        var object = this._initializeObjects.shift();
        object.Initialize();
    }
    return true;
};
