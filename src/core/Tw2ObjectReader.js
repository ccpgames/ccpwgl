/**
 * Tw2ObjectReader
 * TODO: Identify if @property _inputStack @property _initializeObject and @property _ids should be defined here
 * @param xmlNode
 * @property xmlNode
 * @constructor
 */
function Tw2ObjectReader(xmlNode)
{
    this.xmlNode = xmlNode;
}

/**
 * Construct
 * @param initialize
 * @returns {Function}
 * @prototype
 */
Tw2ObjectReader.prototype.Construct = function(initialize)
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

/**
 * ConstructFromNode
 * @param initialize
 * @param async
 * @returns {boolean}
 * @prototype
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
                        console.warn('Tw2ObjectReader:', ' object \"', type.value, '\" does not have property \"', child.nodeName, '\"');
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
