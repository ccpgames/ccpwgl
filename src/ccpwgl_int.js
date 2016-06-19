/* ccpwgl 2016-06-19 */

var ccpwgl_int = (function()
{
    /**
     * Event Emitter
     * @param {String} [name='']
     * @property {String} [name=''] - The name of the emitter
     * @property {{}} events
     * @returns {Tw2EventEmitter}
     */
    var Tw2EventEmitter = function(name)
    {
        this.name = name || '';
        this.events = {};
        return this;
    };

    /**
     * Gets public only emitter methods (`on`, `off`, `once`, `del`)
     * @param {{}} [out={}] An optional receiving object
     * @returns {{}}
     *
     * @example var public = emitter.GetPublic()
     * // The public object now has the emitter's public functions
     */
    Tw2EventEmitter.prototype.GetPublic = function(out)
    {
        out || (out = {});
        this.inherit(out, false);
        return out;
    };

    /**
     * Checks if an event has any listeners
     * @param {String} eventName - The event to check
     * @returns {Boolean}
     *
     * @example emitter.HasListeners('myEvent');
     * // Returns true or false
     */
    Tw2EventEmitter.prototype.HasListeners = function(eventName)
    {
        if (!(eventName in this.events)) return false;
        return (this.events[eventName].size !== 0)
    };

    /**
     * Registers an Event
     * - Event names are case insensitive
     * - Emits an `EventAdded` event with the event's name as an argument
     * - When using the `on` and `once` methods an event is automatically registered
     * @param  {String} eventName - The event to register
     * @returns {Tw2EventEmitter}
     *
     * @example emitter.register('myEvent');
     * // creates the myEvent event
     * // emits a `EventAdded` event
     */
    Tw2EventEmitter.prototype.register = function(eventName)
    {
        eventName = eventName.toLowerCase();

        if (!(eventName in this.events))
        {
            this.events[eventName] = new Set();
            this.emit('EventAdded', eventName);
        }
        return this;
    };

    /**
     * Deregisters an event and removes all listeners
     * - Emits an `EventRemoved` event with the event's name as an argument
     * @param {String} eventName - The event to deregister
     * @returns {Tw2EventEmitter}
     *
     * @example emitter.deregister('myEvent');
     * // Removes all listeners from the event, and then deletes the event
     * // Emits an `EventRemoved` event
     */
    Tw2EventEmitter.prototype.deregister = function(eventName)
    {
        eventName = eventName.toLowerCase();

        if (eventName in this.events)
        {
            this.emit('EventRemoved', eventName);
            delete this.events[eventName];
        }
        return this;
    };

    /**
     * Emits an event
     * @param {String} eventName - The event to emit
     * @param {*} ...args - Any arguments to be passed to the event's listeners
     * @returns {Tw2EventEmitter}
     *
     * @example emitter.emit('myEvent', arg1, arg2, arg3);
     * // Emits the 'myEvent' event and calls all of it's listeners with the supplied arguments
     */
    Tw2EventEmitter.prototype.emit = function(eventName)
    {
        eventName = eventName.toLowerCase();

        if (!(eventName in this.events))
        {
            return this.register(eventName);
        }

        var args = Array.prototype.slice.call(arguments);
        args.splice(0, 1);

        this.events[eventName].forEach(
            function(listener)
            {
                listener.apply(undefined, args);
            }
        );

        return this;
    };

    /**
     * Adds a listener to an event
     * - A listener can only exist on an Event once unless using the `once` method, self removing listeners are preferred
     * @param {String} eventName - The target event
     * @param {Function} listener - The listener function to add
     * @returns {Tw2EventEmitter}
     *
     * @example emitter.on('myEvent', myListener);
     * // Adds `myListener` to the `myEvent` event
     */
    Tw2EventEmitter.prototype.on = function(eventName, listener)
    {
        eventName = eventName.toLowerCase();

        this.register(eventName);
        this.events[eventName].add(listener);
        return this;
    };

    /**
     * Adds a listener to an event and removes it after it's first emit
     * @param {String} eventName - The target event
     * @param {Function} listener - The listener function to add for one emit only
     * @returns {Tw2EventEmitter}
     *
     * @example emitter.once('myEvent', myListener);
     * // Adds `myListener` to the `myEvent` event
     * // After the first `myEvent` emit the listener is removed
     */
    Tw2EventEmitter.prototype.once = function(eventName, listener)
    {
        var self = this;
        eventName = eventName.toLowerCase();

        var once = function once()
        {
            listener.apply(undefined, arguments);
            self.off(eventName, once);
        };

        this.on(eventName, once);
        return this;
    };

    /**
     * Removes a listener from an event
     * @param {String} eventName - The target event
     * @param {Function} listener - The listener to remove from an event
     * @returns {Tw2EventEmitter}
     *
     * @example emitter.off('myEvent', myListener);
     * // Removes `myListener` from the `myEvent` event
     */
    Tw2EventEmitter.prototype.off = function(eventName, listener)
    {
        eventName = eventName.toLowerCase();

        if (eventName in this.events)
        {
            this.events[eventName].delete(listener)
        }
        return this;
    };

    /**
     * Deletes a listener from all of the emitter's events
     * @param {Function} listener - The listener to delete
     * @returns {Tw2EventEmitter}
     *
     * @example emitter.del(myListener);
     * // Removes `myListener` from every emitter event
     */
    Tw2EventEmitter.prototype.del = function(listener)
    {
        const self = this;
        for (var eventName in this.events)
        {
            if (this.events.hasOwnProperty(eventName))
            {
                self.off(eventName, listener);
            }
        }
        return this;
    };

    /**
     * Adds bound emitter functions to a target object
     * - No checks are made to see if these methods or property names already exist
     * @param {{}} target - The object inheriting the emitter's functions
     * @param {Boolean} [excludeEmit=false] - Optional control for excluding the `emit` method
     * @return {Tw2EventEmitter}
     *
     * @example emitter.inherit(myObject, true);
     * // `myObject` now has `on`, `off`, `del` and `log` emitter methods
     * @example emitter.inherit(myObject);
     * // `myObject` now has `on`, `off`, `del`, `log` and `emit` emitter methods
     */
    Tw2EventEmitter.prototype.inherit = function(target, excludeEmit)
    {
        target['on'] = this.on.bind(this);
        target['off'] = this.off.bind(this);
        target['del'] = this.del.bind(this);
        target['log'] = this.log.bind(this);

        if (!excludeEmit)
        {
            target['emit'] = this.emit.bind(this);
        }

        return this;
    };

    /**
     * An Emit wrapper that emits an event and also creates a console output from a supplied event data object
     * - The console output replicates the existing ccpwgl console logging
     * - Console output can be toggled globally with { @link<Tw2EventEmitter.consoleErrors> and @link<Tw2EventEmitter.consoleLogs> }
     * @param {String}  eventName               - The event to emit
     * @param {{}}      eventData               - event data
     * @param {String} [eventData.msg='']       - event message
     * @param {String} [eventData.log=log]      - desired console output type (log, info, debug, warn, error, throw)
     * @param {String} [eventData.path]         - the unmodified path for the file related to the event
     * @param {Number} [eventData.time]         - the time it took to process the event path (rounds to 3 decimal places)
     * @param {String} [eventData.type]         - a string representing the unique event type
     * @param {Object} [eventData.data]         - data relevant to the event type
     * @param {Number|String} [eventData.value] - a single value relevant to the event type
     * @param {Array.<String>} [eventData.src]  - an array of the functions involved in the event
     */
    Tw2EventEmitter.prototype.log = function(eventName, eventData)
    {
        var d = eventData;
        if (!d.log) d.log = 'log';
        this.emit(eventName, d);
        var log = d.log;

        switch (d.log)
        {
            case ('throw'):
                log = 'error';
                if (!Tw2EventEmitter.consoleErrors) return;
                break;

            case ('error'):
            case ('warn'):
                if (!Tw2EventEmitter.consoleErrors) return;
                break;

            default:
                if (!Tw2EventEmitter.consoleLogs) return;
        }

        var header = this.name.concat(': {', eventName, '}');
        var body = d.msg || '';
        if (d.path) body = body.concat(' \'', d.path, '\'', ('time' in d) ? ' in ' + d.time.toFixed(3) + 'secs' : '');
        if (d.type && (log === 'error' || log === 'warn')) body = body.concat(' (', d.type, (d.value !== undefined) ? ':' + d.value : '', ')');

        if ('data' in d)
        {
            console.group(header);
            console[log](body);
            console.dir(d.data);
            console.groupEnd();
        }
        else
        {
            console[log](header, body);
        }
    };

    /**
     * Global toggle to disable `warn`, `error` and `throw` console logging from Emitter `log` calls
     * @type {Boolean}
     */
    Tw2EventEmitter.consoleErrors = true;

    /**
     * Global toggle to disable `log`, `info` and `debug` console logging from Emitter `log` calls
     * @type {Boolean}
     */
    Tw2EventEmitter.consoleLogs = true;


    var emitter = new Tw2EventEmitter('CCPWGL');

    /**
     * Tw2Frustum
     * @property {Array.<quat4>} planes
     * @property {vec3} viewPos
     * @property {vec3} viewDir
     * @property {number} halfWidthProjection
     * @property {vec3} _tempVec
     * @constructor
     */
    function Tw2Frustum()
    {
        this.planes = [quat4.create(), quat4.create(), quat4.create(), quat4.create(), quat4.create(), quat4.create()];
        this.viewPos = vec3.create();
        this.viewDir = vec3.create();
        this.halfWidthProjection = 1;
        this._tempVec = vec3.create();
    }

    /**
     * Initializes the Tw2Frustum
     * @param {mat4} view - View Matrix
     * @param {mat4} proj - Projection Matrix
     * @param {number} viewportSize
     * @prototype
     */
    Tw2Frustum.prototype.Initialize = function(view, proj, viewportSize)
    {
        var viewProj = mat4.create();

        mat4.inverse(view, viewProj);
        this.viewPos.set(viewProj.subarray(12, 14));
        this.viewDir.set(viewProj.subarray(8, 10));

        this.halfWidthProjection = proj[0] * viewportSize * 0.5;

        mat4.multiply(proj, view, viewProj);
        this.planes[0][0] = viewProj[2];
        this.planes[0][1] = viewProj[6];
        this.planes[0][2] = viewProj[10];
        this.planes[0][3] = viewProj[14];

        this.planes[1][0] = viewProj[3] + viewProj[0];
        this.planes[1][1] = viewProj[7] + viewProj[4];
        this.planes[1][2] = viewProj[11] + viewProj[8];
        this.planes[1][3] = viewProj[15] + viewProj[12];

        this.planes[2][0] = viewProj[3] - viewProj[1];
        this.planes[2][1] = viewProj[7] - viewProj[5];
        this.planes[2][2] = viewProj[11] - viewProj[9];
        this.planes[2][3] = viewProj[15] - viewProj[13];

        this.planes[3][0] = viewProj[3] - viewProj[0];
        this.planes[3][1] = viewProj[7] - viewProj[4];
        this.planes[3][2] = viewProj[11] - viewProj[8];
        this.planes[3][3] = viewProj[15] - viewProj[12];

        this.planes[4][0] = viewProj[3] + viewProj[1];
        this.planes[4][1] = viewProj[7] + viewProj[5];
        this.planes[4][2] = viewProj[11] + viewProj[9];
        this.planes[4][3] = viewProj[15] + viewProj[13];

        this.planes[5][0] = viewProj[3] - viewProj[2];
        this.planes[5][1] = viewProj[7] - viewProj[6];
        this.planes[5][2] = viewProj[11] - viewProj[10];
        this.planes[5][3] = viewProj[15] - viewProj[14];

        for (var i = 0; i < 6; ++i)
        {
            var len = vec3.length(this.planes[i]);
            this.planes[i][0] /= len;
            this.planes[i][1] /= len;
            this.planes[i][2] /= len;
            this.planes[i][3] /= len;
        }
    };

    /**
     * Checks to see if a sphere is visible within the frustum
     * @param {vec3} center
     * @param {number} radius
     * @returns {boolean}
     * @prototype
     */
    Tw2Frustum.prototype.IsSphereVisible = function(center, radius)
    {
        for (var i = 0; i < 6; ++i)
        {
            if (this.planes[i][0] * center[0] + this.planes[i][1] * center[1] + this.planes[i][2] * center[2] + this.planes[i][3] < -radius)
            {
                return false;
            }
        }
        return true;
    };

    /**
     * GetPixelSizeAcross
     * @param {vec3} center
     * @param {number} radius
     * @returns {number}
     * @prototype
     */
    Tw2Frustum.prototype.GetPixelSizeAcross = function(center, radius)
    {
        var d = vec3.subtract(this.viewPos, center, this._tempVec);
        var depth = vec3.dot(this.viewDir, d);
        var epsilon = 1e-5;
        if (depth < epsilon)
        {
            depth = epsilon;
        }
        if (radius < epsilon)
        {
            return 0;
        }
        var ratio = radius / depth;
        return ratio * this.halfWidthProjection * 2;
    };

    /**
     * Stores raw data for {@link Tw2PerObjectData} perObject objects and {@link EveSpaceScene} perFrame objects
     * @property {number} nextOffset
     * @property {Float32Array} data
     * @property {Object} elements
     * @property {String} elements.offset
     * @property {number} elements.size
     * @property {Array|null} elements.array
     * @constructor
     */
    function Tw2RawData()
    {
        this.nextOffset = 0;
        this.data = null;
        this.elements = {};
    }

    /**
     * Declares a raw data element
     * @param {String} name
     * @param {number} size
     * @prototype
     */
    Tw2RawData.prototype.Declare = function(name, size)
    {
        this.elements[name] = {
            'offset': this.nextOffset,
            'size': size,
            'array': null
        };
        this.nextOffset += size;
    };

    /**
     * Create
     * @prototype
     */
    Tw2RawData.prototype.Create = function()
    {
        this.data = new Float32Array(this.nextOffset);
        for (var el in this.elements)
        {
            if (this.elements.hasOwnProperty(el))
            {
                this.elements[el].array = this.data.subarray(this.elements[el].offset, this.elements[el].offset + this.elements[el].size);
            }
        }
    };

    /**
     * Sets a element value
     * @param {string} name
     * @param {Float32Array} value
     * @prototype
     */
    Tw2RawData.prototype.Set = function(name, value)
    {
        var el = this.elements[name];
        this.data.set(value.length > el.size ? value.subarray(0, el.size) : value, el.offset);
    };

    /**
     * Gets an element's array value
     * TODO: Modifying the returned value will modify the raw data, is this intentional?
     * @param {string} name
     * @return {Float32Array}
     * @prototype
     */
    Tw2RawData.prototype.Get = function(name)
    {
        return this.elements[name].array;
    };

    /**
     * Gets an element's array value from the share data array
     * TODO: Modifying the returned value will modify the raw data, is this intentional?
     * @param {string} name
     * @return {Float32Array}
     * @prototype
     */
    Tw2RawData.prototype.GetData = function(name)
    {
        return this.data.subarray(this.elements[name].offset, this.elements[name].offset + this.elements[name].array.length);
    };

    /**
     * Tw2BinaryReader
     * @param data
     * @constructor
     */
    function Tw2BinaryReader(data)
    {
        this.data = data;
        this.cursor = 0;
    }

    /**
     * ReadUInt8
     * @returns {*}
     * @prototype
     */
    Tw2BinaryReader.prototype.ReadUInt8 = function()
    {
        return this.data[this.cursor++];
    };

    /**
     * ReadInt8
     * @returns {*}
     * @prototype
     */
    Tw2BinaryReader.prototype.ReadInt8 = function()
    {
        var val = this.data[this.cursor++];
        if (val > 0x7F)
        {
            val = (val - 0xff) - 1;
        }
        return val;
    };

    /**
     * ReadUInt16
     * @returns {*}
     * @prototype
     */
    Tw2BinaryReader.prototype.ReadUInt16 = function()
    {
        return this.data[this.cursor++] + (this.data[this.cursor++] << 8);
    };

    /**
     * ReadInt16
     * @returns {*}
     * @prototype
     */
    Tw2BinaryReader.prototype.ReadInt16 = function()
    {
        var val = this.data[this.cursor++] + (this.data[this.cursor++] << 8);
        if (val > 0x7FFF)
        {
            val = (val - 0xffff) - 1;
        }
        return val;
    };

    /**
     * ReadUInt32
     * @returns {*}
     * @prototype
     */
    Tw2BinaryReader.prototype.ReadUInt32 = function()
    {
        return this.data[this.cursor++] + (this.data[this.cursor++] << 8) + (this.data[this.cursor++] << 16) + ((this.data[this.cursor++] << 24) >>> 0);
    };

    /**
     * ReadInt32
     * @returns {*}
     * @prototype
     */
    Tw2BinaryReader.prototype.ReadInt32 = function()
    {
        var val = this.data[this.cursor++] + (this.data[this.cursor++] << 8) + (this.data[this.cursor++] << 16) + ((this.data[this.cursor++] << 24) >>> 0);
        if (val > 0x7FFFFFFF)
        {
            val = (val - 0xffffffff) - 1;
        }
        return val;
    };

    /**
     * ReadFloat16
     * @returns {number}
     * @prototype
     */
    Tw2BinaryReader.prototype.ReadFloat16 = function()
    {
        var b2 = this.data[this.cursor++],
            b1 = this.data[this.cursor++];
        var sign = 1 - (2 * (b1 >> 7)); // sign = bit 0
        var exp = ((b1 >> 2) & 0x1f) - 15; // exponent = bits 1..5
        var sig = ((b1 & 3) << 8) | b2; // significand = bits 6..15
        if (sig == 0 && exp == -15)
            return 0.0;
        return sign * (1 + sig * Math.pow(2, -10)) * Math.pow(2, exp);
    };

    /**
     * ReadFloat32
     * @returns {number}
     * @prototype
     */
    Tw2BinaryReader.prototype.ReadFloat32 = function()
    {
        var b4 = this.data[this.cursor++],
            b3 = this.data[this.cursor++],
            b2 = this.data[this.cursor++],
            b1 = this.data[this.cursor++];
        var sign = 1 - (2 * (b1 >> 7)); // sign = bit 0
        var exp = (((b1 << 1) & 0xff) | (b2 >> 7)) - 127; // exponent = bits 1..8
        var sig = ((b2 & 0x7f) << 16) | (b3 << 8) | b4; // significand = bits 9..31
        if (sig == 0 && exp == -127)
            return 0.0;
        return sign * (1 + sig * Math.pow(2, -23)) * Math.pow(2, exp);
    };

    /**
     * ReadString
     * @returns {string}
     * @prototype
     */
    Tw2BinaryReader.prototype.ReadString = function()
    {
        var length = this.data[this.cursor++];
        var str = '';
        for (var i = 0; i < length; ++i)
        {
            str += String.fromCharCode(this.data[this.cursor++]);
        }
        return str;
    };

    /**
     * Tw2VertexElement
     * @param {number} usage - vertex data type
     * @param {number} usageIndex
     * @param {number} type
     * @param {number} elements - How many variables this vertex data type uses
     * @param {number} offset
     * @property {number} usage
     * @property {number} usageIndex
     * @property {number} type
     * @property {number} elements
     * @property {number} offset
     * @property location
     * @property customSetter
     * @constructor
     */
    function Tw2VertexElement(usage, usageIndex, type, elements, offset)
    {
        this.usage = usage;
        this.usageIndex = usageIndex;
        this.type = type;
        this.elements = elements;
        this.offset = typeof(offset) === 'undefined' ? 0 : offset;
        this.location = null;
        this.customSetter = null;
    }


    /**
     * Tw2VertexDeclaration
     * @property {Array.<Tw2VertexElement>} elements
     * @property {Array.<Tw2VertexElement>} _elementsSorted
     * @constructor
     */
    function Tw2VertexDeclaration()
    {
        this.elements = [];
        this._elementsSorted = [];
    }

    /**
     * Tw2 Vertex Declaration Types
     * @type {number}
     */
    Tw2VertexDeclaration.DECL_POSITION = 0;
    Tw2VertexDeclaration.DECL_COLOR = 1;
    Tw2VertexDeclaration.DECL_NORMAL = 2;
    Tw2VertexDeclaration.DECL_TANGENT = 3;
    Tw2VertexDeclaration.DECL_BINORMAL = 4;
    Tw2VertexDeclaration.DECL_TEXCOORD = 5;
    Tw2VertexDeclaration.DECL_BLENDWEIGHT = 6;
    Tw2VertexDeclaration.DECL_BLENDINDICES = 7;

    /**
     * CompareDeclarationElements
     * @param {Tw2VertexElement} a
     * @param {Tw2VertexElement} b
     * @param {number} [usageOffset=0]
     * @returns {number}
     * @function
     */
    Tw2VertexDeclaration.CompareDeclarationElements = function(a, b, usageOffset)
    {
        usageOffset = usageOffset || 0;
        if (a.usage < b.usage) return -1;
        if (a.usage > b.usage) return 1;
        if (a.usageIndex + usageOffset < b.usageIndex) return -1;
        if (a.usageIndex + usageOffset > b.usageIndex) return 1;
        return 0;
    };

    /**
     * Re-sorts elements
     * @prototype
     */
    Tw2VertexDeclaration.prototype.RebuildHash = function()
    {
        this._elementsSorted = [];
        for (var i = 0; i < this.elements.length; ++i)
        {
            this._elementsSorted[i] = this.elements[i];
        }
        this._elementsSorted.sort(Tw2VertexDeclaration.CompareDeclarationElements);
    };

    /**
     * Finds an element by it's usage type and usage index
     * @param {number} usage
     * @param {number} usageIndex
     * @returns {Tw2VertexElement|null}
     * @prototype
     */
    Tw2VertexDeclaration.prototype.FindUsage = function(usage, usageIndex)
    {
        for (var i = 0; i < this._elementsSorted.length; ++i)
        {
            var e = this._elementsSorted[i];
            if (e.usage == usage)
            {
                if (e.usageIndex == usageIndex)
                {
                    return e;
                }
                else if (e.usageIndex > usageIndex)
                {
                    return null;
                }
            }
            if (e.usage > usage)
            {
                return null;
            }
        }
        return null;
    };

    /**
     * SetDeclaration
     * @param {Tw2VertexDeclaration} inputDecl
     * @param {number} stride
     * @returns {boolean}
     * @prototype
     */
    Tw2VertexDeclaration.prototype.SetDeclaration = function(inputDecl, stride)
    {
        var index = 0;
        for (var i = 0; i < inputDecl._elementsSorted.length; ++i)
        {
            var el = inputDecl._elementsSorted[i];
            if (el.location < 0)
            {
                continue;
            }
            while (true)
            {
                if (index >= this._elementsSorted.length)
                {
                    device.gl.disableVertexAttribArray(el.location);
                    device.gl.vertexAttrib4f(el.location, 0, 0, 0, 0);
                    break;
                }
                var input = this._elementsSorted[index];
                var cmp = Tw2VertexDeclaration.CompareDeclarationElements(input, el);
                if (cmp > 0)
                {
                    device.gl.disableVertexAttribArray(el.location);
                    device.gl.vertexAttrib4f(el.location, 0, 0, 0, 0);
                    break;
                }
                if (cmp == 0)
                {
                    if (input.customSetter)
                    {
                        input.customSetter(el);
                    }
                    else
                    {
                        device.gl.enableVertexAttribArray(el.location);
                        device.gl.vertexAttribPointer(
                            el.location,
                            input.elements,
                            input.type,
                            false,
                            stride,
                            input.offset);
                    }
                    break;
                }
                index++;
            }
        }
        return true;
    };

    /**
     * SetPartialDeclaration
     * @param {Tw2VertexDeclaration} inputDecl
     * @param {number} stride
     * @param {number} usageOffset
     * @param [divisor=0]
     * @returns {Array} ResetData
     * @prototype
     */
    Tw2VertexDeclaration.prototype.SetPartialDeclaration = function(inputDecl, stride, usageOffset, divisor)
    {
        var resetData = [];
        divisor = divisor || 0;
        var index = 0;
        for (var i = 0; i < inputDecl._elementsSorted.length; ++i)
        {
            var el = inputDecl._elementsSorted[i];
            if (el.location < 0)
            {
                continue;
            }
            while (true)
            {
                var input = this._elementsSorted[index];
                var cmp = Tw2VertexDeclaration.CompareDeclarationElements(input, el, usageOffset);
                if (cmp == 0)
                {
                    if (input.customSetter)
                    {
                        input.customSetter(el);
                    }
                    else
                    {
                        device.gl.enableVertexAttribArray(el.location);
                        device.gl.vertexAttribPointer(
                            el.location,
                            input.elements,
                            input.type,
                            false,
                            stride,
                            input.offset);
                        device.instancedArrays.vertexAttribDivisorANGLE(el.location, divisor);
                        if (divisor)
                        {
                            resetData.push(el.location)
                        }
                    }
                    break;
                }
                else if (cmp > 0)
                {
                    if (!divisor)
                    {
                        device.gl.disableVertexAttribArray(el.location);
                        device.gl.vertexAttrib4f(el.location, 0, 0, 0, 0);
                    }
                    break;
                }
                index++;
                if (index >= this._elementsSorted.length)
                {
                    if (!divisor)
                    {
                        device.gl.disableVertexAttribArray(el.location);
                        device.gl.vertexAttrib4f(el.location, 0, 0, 0, 0);
                    }
                    return resetData;
                }
            }
        }
        return resetData;
    };

    /**
     * ResetInstanceDivisors
     * @param {Array} resetData
     * @prototype
     */
    Tw2VertexDeclaration.prototype.ResetInstanceDivisors = function(resetData)
    {
        if (resetData)
        {
            for (var i = 0; i < resetData.length; ++i)
            {
                device.instancedArrays.vertexAttribDivisorANGLE(resetData[i], 0);
            }
        }
    };

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
        this._ids = null;
    }

    /**
     * Construct
     * @param initialize
     * @returns {Function}
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
                        emitter.log('ResMan',
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
                            emitter.log('ResMan',
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
                    emitter.log('ResMan',
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

    /**
     * Tw2Res - A Tw2Resource
     * @typedef {(Tw2Resource|Tw2EffectRes|Tw2GeometryRes|Tw2TextureRes)} Tw2Res
     */

    /**
     * Tw2Resource
     * @property {string} path
     * @property {boolean} _isLoading
     * @property {boolean} _isGood
     * @property {boolean} _isPurged
     * @property {Array} _notifications
     * @property {number} activeFrame
     * @property {number} doNotPurge
     * @property {null|Function} _onLoadStarted - optional callback fired on res loading: callback(this)
     * @property {null|Function} _onLoadFinished - optional callback fired on res loaded: callback(this, success)
     * @property {null|Function} _onLoadPrepareFinished - optional callback fired on res prepare finish: callback(this, success)
     * @constructor
     */
    function Tw2Resource()
    {
        this.path = '';
        this._isLoading = false;
        this._isGood = false;
        this._isPurged = false;
        this._notifications = [];
        this.activeFrame = 0;
        this.doNotPurge = 0;
        this._onLoadStarted = null;
        this._onLoadFinished = null;
        this._onPrepareFinished = null;
    }

    /**
     * Checks to see if the resource is loading
     * @returns {boolean}
     * @prototype
     */
    Tw2Resource.prototype.IsLoading = function()
    {
        this.KeepAlive();
        return this._isLoading;
    };

    /**
     * Checks to see if the resource is good
     * @returns {boolean}
     * @prototype
     */
    Tw2Resource.prototype.IsGood = function()
    {
        this.KeepAlive();
        return this._isGood;
    };

    /**
     * Checks to see if the resource is purged
     * @returns {boolean}
     * @prototype
     */
    Tw2Resource.prototype.IsPurged = function()
    {
        return this._isPurged;
    };

    /**
     * LoadStarted
     * @prototype
     */
    Tw2Resource.prototype.LoadStarted = function()
    {
        this._isLoading = true;

        for (var i = 0; i < this._notifications.length; ++i)
        {
            this._notifications[i].ReleaseCachedData(this);
        }

        if (this._onLoadStarted)
        {
            this._onLoadStarted(this);
        }
    };

    /**
     * LoadFinished
     * @param {boolean} success
     * @prototype
     */
    Tw2Resource.prototype.LoadFinished = function(success)
    {
        this._isLoading = false;

        if (!success)
        {
            this._isGood = false;
        }

        if (this._onLoadFinished)
        {
            this._onLoadFinished(this, success);
        }
    };

    /**
     * PrepareFinished
     * @param {boolean} success
     * @prototype
     */
    Tw2Resource.prototype.PrepareFinished = function(success)
    {
        this._isLoading = false;
        this._isGood = success;

        for (var i = 0; i < this._notifications.length; ++i)
        {
            this._notifications[i].RebuildCachedData(this);
        }

        if (this._onPrepareFinished)
        {
            this._onPrepareFinished(this, success);
        }
    };

    /**
     * Sets resource's isGood property
     * @param {boolean} success
     * @prototype
     */
    Tw2Resource.prototype.SetIsGood = function(success)
    {
        this._isGood = success;
    };

    /**
     * Unload
     * @prototype
     */
    Tw2Resource.prototype.Unload = function() {};

    /**
     * Reloads the resource
     * @prototype
     */
    Tw2Resource.prototype.Reload = function()
    {
        this.Unload();
        resMan.ReloadResource(this);
    };

    /**
     * Keeps the resource from being purged
     * @prototype
     */
    Tw2Resource.prototype.KeepAlive = function()
    {
        this.activeFrame = resMan.activeFrame;
        if (this._isPurged)
        {
            this.Reload();
        }
    };

    /**
     * Registers a notification
     * @param notification
     * @prototype
     */
    Tw2Resource.prototype.RegisterNotification = function(notification)
    {
        for (var i = 0; i < this._notifications.length; ++i)
        {
            if (this._notifications[i] == notification)
            {
                return;
            }
        }

        this._notifications[this._notifications.length] = notification;

        if (this._isGood)
        {
            notification.RebuildCachedData(this);
        }
    };

    /**
     * Deregisters a notification
     * @param notification
     * @prototype
     */
    Tw2Resource.prototype.UnregisterNotification = function(notification)
    {
        for (var i = 0; i < this._notifications.length; ++i)
        {
            if (this._notifications[i] == notification)
            {
                this._notifications.splice(i, 1);
                return;
            }
        }
    };



    /**
     * Inherit
     * @param derived
     * @param base
     * @constructor
     */
    function Inherit(derived, base)
    {
        for (var i in base.prototype)
        {
            if (base.prototype.hasOwnProperty(i))
            {
                if (!(i in derived.prototype))
                {
                    derived.prototype[i] = base.prototype[i];
                }
            }
        }

        derived.prototype._super = base.prototype;
    }

    /**
     * Tw2VariableStore
     * @property {Object.< string, Tw2Parameter>} _variables
     * @constructor
     */
    function Tw2VariableStore()
    {
        this._variables = {};
    }

    /**
     * Registers a variable
     * @param {string} name
     * @param {string|number|Float32Array|vec3|mat4} value
     * @param {Tw2Parameter} type
     * @returns {Tw2Parameter}
     * @constructor
     */
    Tw2VariableStore.prototype.RegisterVariableWithType = function(name, value, type)
    {
        return this._variables[name] = new type(name, value);
    };

    /**
     * Registers a variable without a value
     * @param {string} name
     * @param {Tw2Parameter} type
     * @returns {Tw2Parameter}
     * @constructor
     */
    Tw2VariableStore.prototype.RegisterType = function(name, type)
    {
        return this._variables[name] = new type(name);
    };

    /**
     * Gets A Tw2 parameter constructor from a supplied value
     * @param {Number|String|Array.<Number>|Float32Array} value
     * @returns {null|Function}
     */
    Tw2VariableStore.GetTw2ParameterType = function(value)
    {
        if (value.constructor === (new glMatrixArrayType()).constructor || value.constructor === [].constructor)
        {
            switch (value.length)
            {
                case (16):
                    return Tw2MatrixParameter;

                case (4):
                    return Tw2Vector4Parameter;

                case (3):
                    return Tw2Vector3Parameter;

                case (2):
                    return Tw2Vector2Parameter;
            }
        }
        else if (typeof(value) == 'number')
        {
            return Tw2FloatParameter;
        }
        else if (typeof(value) == 'string')
        {
            return Tw2TextureParameter;
        }
    }

    /**
     * Registers a variable without a type
     * @param {string} name
     * @param {string|number|Float32Array} value
     * @returns {Tw2Parameter}
     * @constructor
     */
    Tw2VariableStore.prototype.RegisterVariable = function(name, value)
    {
        return this.RegisterVariableWithType(name, value, Tw2VariableStore.GetTw2ParameterType(value));
    };

    var variableStore = new Tw2VariableStore();

    /**
     * Manages loaded resources
     * @property {Object} _loadedObjects
     * @constructor
     */
    function Tw2MotherLode()
    {
        this._loadedObjects = {};

        /**
         * Finds a loaded object by it's file path
         * @param {string} path
         * @returns {Tw2LoadingObject}
         */
        this.Find = function(path)
        {
            if (path in this._loadedObjects)
            {
                return this._loadedObjects[path];
            }
            return null;
        };

        /**
         * Adds a loaded object
         * @param {string} path
         * @param {Tw2LoadingObject} obj
         */
        this.Add = function(path, obj)
        {
            this._loadedObjects[path] = obj;
        };

        /**
         * Removes a loaded object by it's file path
         * @param {string} path
         */
        this.Remove = function(path)
        {
            delete this._loadedObjects[path];
        };

        /**
         * Clears the loaded object object
         */
        this.Clear = function()
        {
            this._loadedObjects = {};
        };

        /**
         * Unloads all loaded objects and then clears the loadedObject object
         */
        this.UnloadAndClear = function()
        {
            for (var path in this._loadedObjects)
            {
                if (this._loadedObjects.hasOwnProperty(path))
                {
                    this._loadedObjects[path].Unload();
                }
            }
            this._loadedObjects = {};
        };

        /**
         * Purges inactive loaded objects (resources that have been loaded but are not being actively used)
         * - Loaded objects can flagged with `doNotPurge` to ensure they are never removed
         * - Resource auto purging can be managed in `ccpwgl` or `ccpwgl_int.resMan` - {@link Tw2ResMan}
         *     ccpwgl.setResourceUnloadPolicy()
         *     ccpwgl_int.resMan.autoPurgeResources=true
         *     ccpwgl_int.resMan.purgeTime=30
         * @param {Number} curFrame - the current frame count
         * @param {Number} frameLimit - how many frames the object can stay alive for before being purged
         * @param {Number} frameDistance - how long the resource has been alive for
         */
        this.PurgeInactive = function(curFrame, frameLimit, frameDistance)
        {
            for (var path in this._loadedObjects)
            {
                if (this._loadedObjects.hasOwnProperty(path))
                {
                    var obj = this._loadedObjects[path];
                    if (!obj.doNotPurge)
                    {
                        if (obj._isPurged)
                        {
                            emitter.log('ResMan',
                            {
                                msg: 'Purged    ',
                                path: obj.path,
                                type: 'res.purged'
                            });

                            delete this._loadedObjects[path];
                        }
                        if (obj._isGood && (curFrame - obj.activeFrame) % frameLimit >= frameDistance)
                        {
                            if (obj.Unload())
                            {
                                emitter.log('ResMan',
                                {
                                    msg: 'Unloaded  ',
                                    path: obj.path,
                                    type: 'res.unused'
                                });
                                delete this._loadedObjects[path];
                            }
                        }
                    }
                }
            }
        };
    }

    /**
     * Tw2LoadingObject
     * @property {object} object
     * @property {string} _redContents - object's .red file xml contents
     * @property {Number} _inPrepare
     * @property {Array.<Object>} _objects
     * @property {Tw2ObjectReader} _constructor
     * @property {function} _constructorFunction - The constructor used to create the object once it's red contents have loaded
     * @inherit Tw2Resource
     * @constructor
     */
    function Tw2LoadingObject()
    {
        this._super.constructor.call(this);
        this.object = null;
        this._redContents = null;
        this._inPrepare = null;
        this._objects = [];
        this._constructor = null;
        this._constructorFunction = null;
    }

    /**
     * AddObject
     * @param {Object} object
     * @param {Function} callback
     * @param {Boolean} initialize
     * @returns {Boolean}
     */
    Tw2LoadingObject.prototype.AddObject = function(object, callback, initialize)
    {
        object._loadCallback = callback;
        object._initialize = initialize;
        this._objects.push(object);
        return false;
    };

    /**
     * Prepare
     * @param text
     * @param xml
     */
    Tw2LoadingObject.prototype.Prepare = function(text, xml)
    {
        if (xml == null)
        {
            emitter.log('ResMan',
            {
                log: 'error',
                src: ['Tw2LoadingObject', 'Prepare'],
                msg: 'Invalid XML',
                path: this.path,
                type: 'xml.invalid',
                data: xml
            });
            this.PrepareFinished(false);
            return;
        }

        if (this._inPrepare === null)
        {
            this._redContents = xml;
            this._constructor = new Tw2ObjectReader(this._redContents);
            this._constructorFunction = null;
            this._inPrepare = 0;
        }

        while (this._inPrepare < this._objects.length)
        {
            if (!this._constructorFunction)
            {
                var initialize = this._objects[this._inPrepare]._initialize;
                this._constructorFunction = this._constructor.Construct(initialize);
            }

            if (!this._constructorFunction())
            {
                return true;
            }

            this._constructorFunction = null;

            try
            {
                this._objects[this._inPrepare]._loadCallback(this._constructor.result);
            }
            catch (e)
            {
                emitter.log('ResMan',
                {
                    log: 'error',
                    src: ['Tw2LoadingObject', 'Prepare'],
                    msg: 'Prepare error',
                    path: this.path,
                    type: 'res.prepare',
                    data: e
                })
            }

            this._inPrepare++;
        }

        resMan.motherLode.Remove(this.path);

        emitter.log('ResMan',
        {
            msg: 'Prepared  ',
            path: this.path,
            type: 'res.prepare'
        });

        this.PrepareFinished(true);
    };

    Inherit(Tw2LoadingObject, Tw2Resource);

    /**
     * Resource Manager
     * @property {Boolean} systemMirror - Toggles whether {@link GeometryResource} Index and Buffer data arrays are visible
     * @property {Object.<string, string>} resourcePaths
     * @property {Object} resourcePaths.res - Default resource path for current ccpwgl version
     * @property {Object.<string, Function>} _extensions - an object of registered extensions and their constructors
     * @property {Tw2MotherLode} motherLode
     * @property {Number} maxPrepareTime
     * @property {Number} prepareBudget
     * @property {Array} _prepareQueue
     * @property {Boolean} autoPurgeResources=true - Sets whether resources should be purged automatically
     * @property {Number} purgeTime=30 = Sets how long resources can remain inactive before they are purged
     * @property {Number} activeFrame
     * @property {Number} _purgeTime
     * @property {Number} _purgeFrame
     * @property {Number} _purgeFrameLimit
     * @property {Number} _pendingLoads - a count of how many things are pending load
     * @property {Number} _noLoadFrames
     * @constructor
     */
    function Tw2ResMan()
    {
        this.systemMirror = false;
        this.resourcePaths = {};

        this.resourcePaths['res'] = 'https://developers.eveonline.com/ccpwgl/assetpath/1035524/';

        this._extensions = {};
        this.motherLode = new Tw2MotherLode();
        this.maxPrepareTime = 0.05;
        this.prepareBudget = 0;
        this._prepareQueue = [];
        this.autoPurgeResources = true;
        this.activeFrame = 0;
        this._purgeTime = 0;
        this._purgeFrame = 0;
        this._purgeFrameLimit = 1000;
        this.purgeTime = 30;
        this._pendingLoads = 0;
        this._noLoadFrames = 0;

        /**
         * IsLoading
         * @returns {Boolean}
         *
         */
        this.IsLoading = function()
        {
            return this._noLoadFrames < 2;
        };

        /**
         * Registeres extension's and their constructors
         * @param {string} extension
         * @param {Function} constructor
         */
        this.RegisterExtension = function(extension, constructor)
        {
            this._extensions[extension] = constructor;
        };

        /**
         * Creates an Http request
         * @returns {XMLHttpRequest|ActiveXObject}
         * @private
         */
        this._CreateHttpRequest = function()
        {
            var httpRequest = null;

            if (window.XMLHttpRequest)
            {
                // Mozilla, Safari, ...
                httpRequest = new XMLHttpRequest();
            }
            else if (window.ActiveXObject)
            {
                // IE
                try
                {
                    httpRequest = new ActiveXObject('Msxml2.XMLHTTP');
                }
                catch (e)
                {
                    try
                    {
                        httpRequest = new ActiveXObject('Microsoft.XMLHTTP');
                    }
                    catch (e)
                    {}
                }
            }

            if (!httpRequest)
            {
                emitter.log('ResMan',
                {
                    log: 'error',
                    src: ['Tw2LoadingObject', 'Prepare'],
                    msg: 'Could not create an XMLHTTP instance',
                    type: 'http.instance'
                })
            }
            return httpRequest;
        };

        /**
         * Normalizes a file path by making it lower case and replaces all '\\' with '/'
         * @param {string} path
         * @returns {string}
         * @private
         */
        function _NormalizePath(path)
        {
            if (path.substr(0, 5) == 'str:/')
            {
                return path;
            }
            path = path.toLowerCase();
            path.replace('\\', '/');
            return path;
        }

        /**
         * _GetPathExt
         * @param path
         * @returns {string}
         * @private
         */
        function _GetPathExt(path)
        {
            if (path.substr(0, 5) == 'str:/')
            {
                var slash = path.indexOf('/', 5);
                if (slash == -1)
                {
                    return null;
                }
                return path.substr(5, slash - 5);
            }
            else
            {
                var dot = path.lastIndexOf('.');
                if (dot == -1)
                {
                    return null;
                }
                return path.substr(dot + 1);
            }
        }

        /**
         * Returns a path suitable for logging by truncating really long file names
         * @param {string} path
         * @returns {string}
         */
        this.LogPathString = function(path)
        {
            if (path.substr(0, 5) == 'str:/' && path.length > 64)
            {
                return path.substr(0, 64) + '...';
            }
            return path;
        };

        /**
         * Internal update function. It is called every frame.
         * @param {Number} dt - deltaTime
         * @returns {Boolean}
         */
        this.PrepareLoop = function(dt)
        {
            if (this._prepareQueue.length == 0 && this._pendingLoads == 0)
            {
                if (this._noLoadFrames < 2)
                {
                    this._noLoadFrames++;
                }
            }
            else
            {
                this._noLoadFrames = 0;
            }

            resMan.prepareBudget = resMan.maxPrepareTime;

            var now = new Date();
            var startTime = now.getTime();
            var preparedCount = 0;

            while (resMan._prepareQueue.length)
            {
                try
                {
                    var result = resMan._prepareQueue[0][0].Prepare(resMan._prepareQueue[0][1], resMan._prepareQueue[0][2]);
                }
                catch (e)
                {
                    resMan._prepareQueue.shift();
                    throw e;
                }
                if (!result)
                {
                    now = new Date();

                    emitter.log('ResMan',
                    {
                        msg: 'Prepared  ',
                        path: resMan._prepareQueue[0][0].path,
                        time: (now.getTime() - startTime) * 0.001,
                        type: 'res.prepared'
                    });

                    resMan._prepareQueue.shift();
                    preparedCount++;
                }

                now = new Date();
                resMan.prepareBudget -= (now.getTime() - startTime) * 0.001;

                if (resMan.prepareBudget < 0)
                {
                    break;
                }
            }

            this._purgeTime += dt;

            if (this._purgeTime > 1)
            {
                this.activeFrame += 1;
                this._purgeTime -= Math.floor(this._purgeTime);
                this._purgeFrame += 1;

                if (this._purgeFrame >= 5)
                {
                    if (this.autoPurgeResources)
                    {
                        this.motherLode.PurgeInactive(this._purgeFrame, this._purgeFrameLimit, this.purgeTime);
                    }
                }
            }

            return true;
        };

        /**
         * _DoLoadResource
         * @param obj
         * @private
         */
        function _DoLoadResource(obj)
        {
            return function()
            {
                var readyState = 0;

                try
                {
                    readyState = this.readyState;
                }
                catch (e)
                {
                    emitter.log('ResMan',
                    {
                        log: 'error',
                        src: ['Tw2ResMan', '_DoLoadResource'],
                        msg: 'Communication error loading',
                        path: obj.path,
                        type: 'http.readystate',
                        value: readyState
                    });

                    obj.LoadFinished(false);
                    resMan._pendingLoads--;
                    return;
                }

                if (readyState === 4)
                {
                    if (this.status === 200)
                    {
                        obj.LoadFinished(true);
                        var data = null;
                        var xml = null;

                        try
                        {
                            data = this.responseText;
                            xml = this.responseXML;
                        }
                        catch (e)
                        {
                            data = this.response;
                        }

                        resMan._prepareQueue.push([obj, data, xml]);
                    }
                    else
                    {
                        emitter.log('ResMan',
                        {
                            log: 'error',
                            src: ['Tw2ResMan', '_DoLoadResource'],
                            msg: 'Communication error loading',
                            path: obj.path,
                            type: 'http.status',
                            value: this.status
                        });
                        obj.LoadFinished(false);
                    }
                    resMan._pendingLoads--;
                }
            };
        }

        /**
         * Builds a url from a resource path
         * - the prefix in the resource path is replaced with it's string value from `this.resourcePaths`
         * @param {string} resPath
         * @returns {string}
         */
        this.BuildUrl = function(resPath)
        {
            var prefixIndex = resPath.indexOf(':/');
            if (prefixIndex == -1)
            {
                emitter.log('ResMan',
                {
                    log: 'warn',
                    src: ['Tw2ResMan', 'BuildUrl'],
                    msg: 'Invalid path',
                    type: 'prefix.undefined',
                    path: resPath
                });

                return resPath;
            }

            var prefix = resPath.substr(0, prefixIndex);

            if (!(prefix in this.resourcePaths))
            {
                emitter.log('ResMan',
                {
                    log: 'warn',
                    src: ['Tw2ResMan', 'BuildUrl'],
                    msg: 'Invalid path',
                    path: resPath,
                    type: 'prefix.invalid',
                    value: prefix
                });
                return resPath;
            }

            return this.resourcePaths[prefix] + resPath.substr(prefixIndex + 2);
        };

        /**
         * _LoadResource
         * @param obj
         * @returns {*}
         * @private
         */
        this._LoadResource = function(obj)
        {
            obj._isPurged = false;
            var path = obj.path;
            this.motherLode.Add(path, obj);

            if (('DoCustomLoad' in obj) && obj.DoCustomLoad(path))
            {
                return obj;
            }

            var httpRequest = this._CreateHttpRequest();
            httpRequest.onreadystatechange = _DoLoadResource(obj);

            emitter.log('ResMan',
            {
                msg: 'Requesting',
                path: path,
                type: 'res.requesting'
            });

            httpRequest.open('GET', this.BuildUrl(path));

            if (obj.requestResponseType)
            {
                httpRequest.responseType = obj.requestResponseType;
            }

            obj.LoadStarted();

            try
            {
                httpRequest.send();
                this._pendingLoads++;
            }
            catch (e)
            {
                emitter.log('ResMan',
                {
                    log: 'error',
                    src: ['Tw2ResMan', '_LoadResource'],
                    msg: 'Error requesting',
                    path: path,
                    type: 'http.request',
                    value: e.toString()
                })
            }
        };

        /**
         * Reloads a specific resource
         * @param {Tw2LoadingObject} resource
         * @returns {Tw2LoadingObject} resource
         */
        this.ReloadResource = function(resource)
        {
            var path = resource.path;

            emitter.log('ResMan',
            {
                msg: 'Reloading ',
                path: path,
                type: 'res.reload'
            });

            var obj = this.motherLode.Find(path);

            if (obj !== null && !obj.IsPurged())
            {
                return obj;
            }

            this._LoadResource(resource);
            return resource;
        };

        /**
         * Gets a resource
         * @param {String} path
         * @returns resource
         */
        this.GetResource = function(path)
        {
            var obj;

            path = _NormalizePath(path);
            obj = this.motherLode.Find(path);

            if (obj !== null)
            {
                if (obj.IsPurged())
                {
                    obj.Reload();
                }
                return obj;
            }

            var ext = _GetPathExt(path);

            if (ext == null)
            {
                emitter.log('ResMan',
                {
                    log: 'error',
                    src: ['Tw2ResMan', 'ReloadResource'],
                    msg: 'Unknown extension',
                    type: 'extension.unknown',
                    path: this.LogPathString(path)
                });
                return null;
            }

            if (!(ext in this._extensions))
            {
                emitter.log('ResMan',
                {
                    log: 'error',
                    src: ['Tw2ResMan', 'ReloadResource'],
                    msg: 'Unregistered extension',
                    type: 'extension.unregistered',
                    path: this.LogPathString(path),
                    value: ext
                });
                return null;
            }

            obj = new this._extensions[ext]();
            obj.path = path;
            this._LoadResource(obj);
            return obj;
        };

        /**
         * Gets an object (with initialization)
         * @param {string} path
         * @param {Function} callback
         */
        this.GetObject = function(path, callback)
        {
            this._GetObject(path, callback, true);
        };

        /**
         * Gets an object (without initialization)
         * @param {string} path
         * @param {Function} callback
         */
        this.GetObjectNoInitialize = function(path, callback)
        {
            this._GetObject(path, callback, false);
        };

        /**
         * Core function for managing the processing and loading of an object
         * @param {string} path
         * @param {Function} callback
         * @param {Boolean} initialize
         * @private
         */
        this._GetObject = function(path, callback, initialize)
        {
            path = _NormalizePath(path);

            var obj = {};
            var res = this.motherLode.Find(path);

            if (res !== null)
            {
                res.AddObject(obj, callback, initialize);
                return;
            }

            res = new Tw2LoadingObject();
            res.path = path;
            res.AddObject(obj, callback, initialize);

            this.motherLode.Add(path, res);

            var httpRequest = this._CreateHttpRequest();
            httpRequest.onreadystatechange = _DoLoadResource(res);

            emitter.log('ResMan',
            {
                msg: 'Requesting',
                path: this.BuildUrl(path),
                _path: path,
                type: 'res.requesting'
            });

            httpRequest.open('GET', this.BuildUrl(path));
            res.LoadStarted();
            obj._objectLoaded = false;

            try
            {
                httpRequest.send();
                this._pendingLoads++;
            }
            catch (e)
            {
                emitter.log('ResMan',
                {
                    log: 'error',
                    src: ['Tw2ResMan', '_GetObject'],
                    msg: 'Error sending object HTTP request',
                    path: this.BuildUrl(path),
                    _path: path,
                    type: 'http.request',
                    value: e.toString()
                })
            }
        };

        /**
         * Clears the motherLode {@link Tw2MotherLode}
         */
        this.Clear = function()
        {
            this.motherLode.Clear();
        };

        /**
         * Unloads and Clears the motherLode {@link Tw2MotherLode}
         */
        this.UnloadAndClear = function()
        {
            this.motherLode.UnloadAndClear();
        }
    }

    // Global instance of Tw2ResMan
    var resMan = new Tw2ResMan();

    /**
     * Tw2PerObjectData
     * TODO: Identify if @property perObjectVSData and @property perObjectPSData should be defined here
     * @constructor
     */
    function Tw2PerObjectData()
    {}

    /**
     * SetPerObjectDataToDevice
     * @param constantBufferHandles
     * @constructor
     */
    Tw2PerObjectData.prototype.SetPerObjectDataToDevice = function(constantBufferHandles)
    {
        if (this.perObjectVSData && constantBufferHandles[3])
        {
            device.gl.uniform4fv(constantBufferHandles[3], this.perObjectVSData.data);
        }
        if (this.perObjectPSData && constantBufferHandles[4])
        {
            device.gl.uniform4fv(constantBufferHandles[4], this.perObjectPSData.data);
        }
    };

    /**
     * Tw2SamplerState
     * @property {number} registerIndex
     * @property {string} name
     * @property {number} minFilter
     * @property {number} maxFilter
     * @property {number} minFilterNoMips
     * @property {number} addressU
     * @property {number} addressV
     * @property {number} addressW
     * @property {number} anisotropy
     * @property samplerType
     * @property {boolean} isVolume
     * @property {number} hash
     * @constructor
     */
    function Tw2SamplerState()
    {
        this.registerIndex = 0;
        this.name = '';
        this.minFilter = device.gl.LINEAR;
        this.maxFilter = device.gl.LINEAR;
        this.minFilterNoMips = device.gl.LINEAR;
        this.addressU = device.gl.REPEAT;
        this.addressV = device.gl.REPEAT;
        this.addressW = device.gl.REPEAT;
        this.anisotropy = 1;
        this.samplerType = device.gl.TEXTURE_2D;
        this.isVolume = false;
        this.hash = 0;
    }

    /**
     * Computes the sampler hash
     * @prototype
     */
    Tw2SamplerState.prototype.ComputeHash = function()
    {
        this.hash = 2166136261;
        this.hash *= 16777619;
        this.hash ^= this.minFilter;
        this.hash *= 16777619;
        this.hash ^= this.maxFilter;
        this.hash *= 16777619;
        this.hash ^= this.addressU;
        this.hash *= 16777619;
        this.hash ^= this.addressV;
        this.hash *= 16777619;
        this.hash ^= this.anisotropy;
    };

    /**
     * Apply
     * @param {boolean} hasMipMaps
     * @prototype
     */
    Tw2SamplerState.prototype.Apply = function(hasMipMaps)
    {
        var targetType = this.samplerType;
        var d = device;
        var gl = d.gl;
        gl.texParameteri(targetType, gl.TEXTURE_WRAP_S, hasMipMaps ? this.addressU : gl.CLAMP_TO_EDGE);
        gl.texParameteri(targetType, gl.TEXTURE_WRAP_T, hasMipMaps ? this.addressV : gl.CLAMP_TO_EDGE);
        gl.texParameteri(targetType, gl.TEXTURE_MIN_FILTER, hasMipMaps ? this.minFilter : this.minFilterNoMips);
        gl.texParameteri(targetType, gl.TEXTURE_MAG_FILTER, this.magFilter);
        if (d.anisotropicFilter && d.enableAnisotropicFiltering)
        {
            gl.texParameterf(targetType,
                d.anisotropicFilter.TEXTURE_MAX_ANISOTROPY_EXT,
                Math.min(this.anisotropy, d.anisotropicFilter.maxAnisotropy));
        }
    };

    /**
     * A Tw2 Parameter
     * @typedef {(Tw2FloatParameter|Tw2TextureParameter|Tw2VariableParameter|Tw2Vector2Parameter|Tw2Vector3Parameter|Tw2Vector4Parameter|Tw2MatrixParameter)} Tw2Parameter
     */

    /**
     * Tw2FloatParameter
     * @param {string} [name='']
     * @param {number} [value=1]
     * @property {string} name
     * @property {number} value
     * @property {null|Array} constantBuffer
     * @property {null|number} offset
     * @constructor
     */
    function Tw2FloatParameter(name, value)
    {
        if (typeof(name) != 'undefined')
        {
            this.name = name;
        }
        else
        {
            this.name = '';
        }
        if (typeof(value) != 'undefined')
        {
            this.value = value;
        }
        else
        {
            this.value = 1;
        }
        this.constantBuffer = null;
        this.offset = null;
    }

    /**
     * Bind
     * TODO: Idenfify if @param size should be passed to the `Apply` prototype as it is currently redundant
     * @param {Array} constantBuffer
     * @param {number} offset
     * @param {number} size
     * @returns {boolean}
     * @prototype
     */
    Tw2FloatParameter.prototype.Bind = function(constantBuffer, offset, size)
    {
        if (this.constantBuffer != null || size < 1)
        {
            return false;
        }
        this.constantBuffer = constantBuffer;
        this.offset = offset;
        this.Apply(this.constantBuffer, this.offset, size);
    };

    /**
     * Unbind
     * @prototype
     */
    Tw2FloatParameter.prototype.Unbind = function()
    {
        this.constantBuffer = null;
    };

    /**
     * Updates the constant buffer to the current value
     * @prototype
     */
    Tw2FloatParameter.prototype.OnValueChanged = function()
    {
        if (this.constantBuffer != null)
        {
            this.constantBuffer[this.offset] = this.value;
        }
    };

    /**
     * Applies the current value to the supplied constant buffer at the supplied offset
     * TODO: @param size is currently redundant
     * @param {Array} constantBuffer
     * @param {number} offset
     * @param {number} size
     * @prototype
     */
    Tw2FloatParameter.prototype.Apply = function(constantBuffer, offset, size)
    {
        constantBuffer[offset] = this.value;
    };

    /**
     * Gets the current value
     * @prototype
     */
    Tw2FloatParameter.prototype.GetValue = function()
    {
        if (this.constantBuffer != null)
        {
            return this.constantBuffer[this.offset];
        }

        return this.value;
    };

    /**
     * Sets a supplied value
     * @prototype
     */
    Tw2FloatParameter.prototype.SetValue = function(value)
    {
        this.value = value;
        if (this.constantBuffer != null)
        {
            this.constantBuffer.set(this.value, this.offset);
        }
    };

    /**
     * Tw2Vector2Parameter
     * @param {string} [name='']
     * @param {Array|Float32Array} [value=[1,1]]
     * @property {string} name
     * @property {Float32Array} value
     * @property {Float32Array} constantBuffer
     * @property {number} offset
     * @constructor
     */
    function Tw2Vector2Parameter(name, value)
    {
        if (typeof(name) != 'undefined')
        {
            this.name = name;
        }
        else
        {
            this.name = '';
        }
        if (typeof(value) != 'undefined')
        {
            this.value = new Float32Array(value);
        }
        else
        {
            this.value = new Float32Array([1, 1]);
        }
        this.constantBuffer = null;
        this.offset = 0;
    }

    /**
     * Bind
     * TODO: Identify if @param size should be passed to the `Apply` prototype as it is currently redundant
     * @param {Float32Array} constantBuffer
     * @param {number} offset
     * @param {number} size
     * @returns {boolean}
     * @prototype
     */
    Tw2Vector2Parameter.prototype.Bind = function(constantBuffer, offset, size)
    {
        if (this.constantBuffer != null || size < 2)
        {
            return false;
        }
        this.constantBuffer = constantBuffer;
        this.offset = offset;
        this.Apply(this.constantBuffer, this.offset, size);
        return true;
    };

    /**
     * Unbind
     * @prototype
     */
    Tw2Vector2Parameter.prototype.Unbind = function()
    {
        this.constantBuffer = null;
    };

    /**
     * Sets a supplied value
     * @param {Array} value - Vector2 Array
     * @prototype
     */
    Tw2Vector2Parameter.prototype.SetValue = function(value)
    {
        this.value.set(value);
        if (this.constantBuffer != null)
        {
            this.constantBuffer.set(this.value, this.offset);
        }
    };

    /**
     * Updates the constant buffer to the current value
     * @prototype
     */
    Tw2Vector2Parameter.prototype.OnValueChanged = function()
    {
        if (this.constantBuffer != null)
        {
            this.constantBuffer.set(this.value, this.offset);
        }
    };

    /**
     * Applies the current value to the supplied constant buffer at the supplied offset
     * TODO: @param size is currently redundant
     * @param {Float32Array} constantBuffer
     * @param {number} offset
     * @param {number} size
     * @prototype
     */
    Tw2Vector2Parameter.prototype.Apply = function(constantBuffer, offset, size)
    {
        constantBuffer.set(this.value, offset);
    };

    /**
     * Gets the current value array
     * @return {Float32Array} Vector2 Array
     * @prototype
     */
    Tw2Vector2Parameter.prototype.GetValue = function()
    {
        if (this.constantBuffer != null)
        {
            return new Float32Array((this.constantBuffer.subarray(this.offset, this.offset + this.value.length)));
        }

        return new Float32Array(this.value);
    };

    /**
     * Returns a value from a specific index of the value array
     * @param {number} index
     * @returns {number}
     * @throw Invalid Index
     * @prototype
     */
    Tw2Vector2Parameter.prototype.GetIndexValue = function(index)
    {
        if (typeof this.value[index] === 'undefined')
        {
            throw "Invalid Index";
        }

        if (this.constantBuffer != null)
        {
            return this.constantBuffer[this.offset + index];
        }

        return this.value[index];
    };

    /**
     * Sets a value at a specific index of the value array
     * @param {number} index
     * @param {number} value
     * @throw Invalid Index
     * @prototype
     */
    Tw2Vector2Parameter.prototype.SetIndexValue = function(index, value)
    {
        if (typeof this.value[index] === 'undefined')
        {
            throw "Invalid Index";
        }

        this.value[index] = value;

        if (this.constantBuffer != null)
        {
            this.constantBuffer[this.offset + index] = value;
        }
    };

    /**
     * Sets all value array elements to a single value
     * @param {number} value - The value to fill the value array elements with
     * @prototype
     */
    Tw2Vector2Parameter.prototype.FillWith = function(value)
    {
        this.SetValue([value, value]);
    };

    /**
     * Tw2Vector3Parameter
     * @param {string} [name='']
     * @param {vec3|Float32Array} [value=[1,1,1]]
     * @property {string} name
     * @property {vec3|Float32Array} value
     * @property {Float32Array} constantBuffer
     * @property {number} offset
     * @constructor
     */
    function Tw2Vector3Parameter(name, value)
    {
        if (typeof(name) != 'undefined')
        {
            this.name = name;
        }
        else
        {
            this.name = '';
        }
        if (typeof(value) != 'undefined')
        {
            this.value = vec3.create(value);
        }
        else
        {
            this.value = vec3.create([1, 1, 1]);
        }
        this.constantBuffer = null;
        this.offset = 0;
    }

    /**
     * Bind
     * TODO: Identify if @param size should be passed to the `Apply` prototype as it is currently redundant
     * @param {Float32Array} constantBuffer
     * @param {number} offset
     * @param {number} size
     * @returns {boolean}
     * @prototype
     */
    Tw2Vector3Parameter.prototype.Bind = function(constantBuffer, offset, size)
    {
        if (this.constantBuffer != null || size < 3)
        {
            return false;
        }
        this.constantBuffer = constantBuffer;
        this.offset = offset;
        this.Apply(this.constantBuffer, this.offset, size);
        return true;
    };

    /**
     * Unbind
     * @prototype
     */
    Tw2Vector3Parameter.prototype.Unbind = function()
    {
        this.constantBuffer = null;
    };

    /**
     * Sets a supplied value
     * @param {vec3|Float32Array} value - Vector3 Array
     * @prototype
     */
    Tw2Vector3Parameter.prototype.SetValue = function(value)
    {
        this.value.set(value);
        if (this.constantBuffer != null)
        {
            this.constantBuffer.set(this.value, this.offset);
        }
    };

    /**
     * Updates the constant buffer to the current value
     * @prototype
     */
    Tw2Vector3Parameter.prototype.OnValueChanged = function()
    {
        if (this.constantBuffer != null)
        {
            this.constantBuffer.set(this.value, this.offset);
        }
    };

    /**
     * Applies the current value to the supplied constant buffer at the supplied offset
     * TODO: @param size is currently redundant
     * @param {Float32Array} constantBuffer
     * @param {number} offset
     * @param {number} size
     * @prototype
     */
    Tw2Vector3Parameter.prototype.Apply = function(constantBuffer, offset, size)
    {
        constantBuffer.set(this.value, offset);
    };

    /**
     * Gets the current value array
     * @return {vec3|Float32Array} Vector3 Array
     * @prototype
     */
    Tw2Vector3Parameter.prototype.GetValue = function()
    {
        if (this.constantBuffer != null)
        {
            return vec3.create(this.constantBuffer.subarray(this.offset, this.offset + this.value.length));
        }

        return vec3.create(this.value);
    };

    /**
     * Returns a value from a specific index of the value array
     * @param {number} index
     * @returns {number}
     * @throw Invalid Index
     * @prototype
     */
    Tw2Vector3Parameter.prototype.GetIndexValue = function(index)
    {
        if (typeof this.value[index] === 'undefined')
        {
            throw "Invalid Index";
        }

        if (this.constantBuffer != null)
        {
            return this.constantBuffer[this.offset + index];
        }

        return this.value[index];
    };

    /**
     * Sets a value at a specific index of the value array
     * @param {number} index
     * @param {number} value
     * @throw Invalid Index
     * @prototype
     */
    Tw2Vector3Parameter.prototype.SetIndexValue = function(index, value)
    {
        if (typeof this.value[index] === 'undefined')
        {
            throw "Invalid Index";
        }

        this.value[index] = value;

        if (this.constantBuffer != null)
        {
            this.constantBuffer[this.offset + index] = value;
        }
    };

    /**
     * Sets all value array elements to a single value
     * @param {number} value - The value to fill the value array elements with
     * @prototype
     */
    Tw2Vector3Parameter.prototype.FillWith = function(value)
    {
        this.SetValue([value, value, value]);
    };

    /**
     * Tw2Vector4Parameter
     * @param {string} [name='']
     * @param {quat4|Float32Array} [value=[1,1,1,1]]
     * @property {string} name
     * @property {quat4|Float32Array} value
     * @property {Array} constantBuffer
     * @property {number} offset
     * @constructor
     */
    function Tw2Vector4Parameter(name, value)
    {
        if (typeof(name) != 'undefined')
        {
            this.name = name;
        }
        else
        {
            this.name = '';
        }
        if (typeof(value) != 'undefined')
        {
            this.value = quat4.create(value);
        }
        else
        {
            this.value = quat4.create([1, 1, 1, 1]);
        }
        this.constantBuffer = null;
        this.offset = 0;
    }

    /**
     * Bind
     * TODO: Identify if @param size should be passed to the `Apply` prototype as it is currently redundant
     * @param {Float32Array} constantBuffer
     * @param {number} offset
     * @param {number} size
     * @returns {boolean}
     * @prototype
     */
    Tw2Vector4Parameter.prototype.Bind = function(constantBuffer, offset, size)
    {
        if (this.constantBuffer != null || size < 4)
        {
            return false;
        }
        this.constantBuffer = constantBuffer;
        this.offset = offset;
        this.Apply(this.constantBuffer, this.offset, size);
        return true;
    };

    /**
     * Unbind
     * @prototype
     */
    Tw2Vector4Parameter.prototype.Unbind = function()
    {
        this.constantBuffer = null;
    };

    /**
     * Sets a supplied value
     * @param {quat4|Float32Array|Array} value - Vector4 Array
     * @prototype
     */
    Tw2Vector4Parameter.prototype.SetValue = function(value)
    {
        this.value.set(value);
        if (this.constantBuffer != null)
        {
            this.constantBuffer.set(this.value, this.offset);
        }
    };

    /**
     * Updates the constant buffer to the current value
     * @prototype
     */
    Tw2Vector4Parameter.prototype.OnValueChanged = function()
    {
        if (this.constantBuffer != null)
        {
            this.constantBuffer.set(this.value, this.offset);
        }
    };

    /**
     * Applies the current value to the supplied constant buffer at the supplied offset
     * TODO: @param size is currently redundant
     * @param {Float32Array} constantBuffer
     * @param {number} offset
     * @param {number} size
     * @prototype
     */
    Tw2Vector4Parameter.prototype.Apply = function(constantBuffer, offset, size)
    {
        constantBuffer.set(this.value, offset);
    };

    /**
     * Gets the current value array
     * @return {quat4|Float32Array} Vector4 Array
     * @prototype
     */
    Tw2Vector4Parameter.prototype.GetValue = function()
    {
        if (this.constantBuffer != null)
        {
            return quat4.create(this.constantBuffer.subarray(this.offset, this.offset + this.value.length));
        }

        return quat4.create(this.value);
    };

    /**
     * Returns a value from a specific index of the value array
     * @param {number} index
     * @returns {number}
     * @throw Invalid Index
     * @prototype
     */
    Tw2Vector4Parameter.prototype.GetIndexValue = function(index)
    {
        if (typeof this.value[index] === 'undefined')
        {
            throw "Invalid Index";
        }

        if (this.constantBuffer != null)
        {
            return this.constantBuffer[this.offset + index];
        }

        return this.value[index];
    };

    /**
     * Sets a value at a specific index of the value array
     * @param {number} index
     * @param {number} value
     * @throw Invalid Index
     * @prototype
     */
    Tw2Vector4Parameter.prototype.SetIndexValue = function(index, value)
    {
        if (typeof this.value[index] === 'undefined')
        {
            throw "Invalid Index";
        }

        this.value[index] = value;

        if (this.constantBuffer != null)
        {
            this.constantBuffer[this.offset + index] = value;
        }
    };

    /**
     * Sets all value array elements to a single value
     * @param {number} value - The value to fill the value array elements with
     * @prototype
     */
    Tw2Vector4Parameter.prototype.FillWith = function(value)
    {
        this.SetValue([value, value, value, value]);
    };

    /**
     * Tw2MatrixParameter
     * @param {string} [name='']
     * @param {mat4|Float32Array|Array} [value=mat4.create()]
     * @property {string} name
     * @property {mat4|Float32Array} value
     * @property {Float32Array} constantBuffer
     * @property {number} offset
     * @constructor
     */
    function Tw2MatrixParameter(name, value)
    {
        if (typeof(name) != 'undefined')
        {
            this.name = name;
        }
        else
        {
            this.name = '';
        }
        if (typeof(value) != 'undefined')
        {
            this.value = mat4.create(value);
        }
        else
        {
            this.value = mat4.identity(mat4.create());
        }
        this.constantBuffer = null;
        this.offset = 0;
    }

    /**
     * Bind
     * TODO: Identify if @param size should be passed to the `Apply` prototype as it is currently redundant
     * @param {Float32Array} constantBuffer
     * @param {number} offset
     * @param {number} size
     * @returns {boolean}
     * @prototype
     */
    Tw2MatrixParameter.prototype.Bind = function(constantBuffer, offset, size)
    {
        if (this.constantBuffer != null || size < 16)
        {
            return false;
        }
        this.constantBuffer = constantBuffer;
        this.offset = offset;
        this.Apply(this.constantBuffer, this.offset, size);
    };

    /**
     * Sets a supplied value
     * @param {mat4} value
     * @prototype
     */
    Tw2MatrixParameter.prototype.SetValue = function(value)
    {
        this.value = mat4.create(value);
        if (this.constantBuffer != null)
        {
            this.constantBuffer.set(this.value, this.offset);
        }
    };

    /**
     * Gets the current value
     * @return {mat4|Float32Array}
     * @prototype
     */
    Tw2MatrixParameter.prototype.GetValue = function()
    {
        if (this.constantBuffer != null)
        {
            return mat4.create(this.constantBuffer.subarray(this.offset, this.offset + this.value.length));
        }

        return mat4.create(this.value);
    };

    /**
     * Applies the current value to the supplied constant buffer at the supplied offset
     * TODO: @param size is currently redundant
     * @param {Float32Array} constantBuffer
     * @param {number} offset
     * @param {number} size
     * @prototype
     */
    Tw2MatrixParameter.prototype.Apply = function(constantBuffer, offset, size)
    {
        constantBuffer.set(this.value, offset);
    };

    /**
     * Tw2VariableParameter
     * @param {string} [name=''] Parameter name
     * @param {string} [variableName='']
     * @property {string} name
     * @property {string} variableName
     * @constructor
     */
    function Tw2VariableParameter(name, variableName)
    {
        if (typeof(name) != 'undefined')
        {
            this.name = name;
        }
        else
        {
            this.name = '';
        }
        if (typeof(variableName) != 'undefined')
        {
            this.variableName = variableName;
        }
        else
        {
            this.variableName = '';
        }
    }

    /**
     * Bind
     * @param {Float32Array} constantBuffer
     * @param {number} offset
     * @param {number} size
     * @returns {boolean}
     * @prototype
     */
    Tw2VariableParameter.prototype.Bind = function(constantBuffer, offset, size)
    {
        return false;
    };

    /**
     * Apply
     * @param {Float32Array} constantBuffer
     * @param {number} offset
     * @param {number} size
     * @prototype
     */
    Tw2VariableParameter.prototype.Apply = function(constantBuffer, offset, size)
    {
        if (typeof(variableStore._variables[this.variableName]) != 'undefined')
        {
            variableStore._variables[this.variableName].Apply(constantBuffer, offset, size);
        }
    };

    /**
     * Tw2TextureParameter
     * @param {string} [name=''] - Name of the texture parameter
     * @param {string} [texturePath=''] - The texture's resource path
     * @property {string} name
     * @property {boolean} useAllOverrides
     * @property {number} addressUMode
     * @property {number} addressVMode
     * @property {number} addressWMode
     * @property {number} filterMode
     * @property {number} mapFilterMode
     * @property {number} maxAnisotropy
     * @property {Tw2TextureRes} textureRes
     * @property {Tw2SamplerState} _sampler
     * @constructor
     */
    function Tw2TextureParameter(name, texturePath)
    {
        if (typeof(name) != 'undefined')
        {
            this.name = name;
        }
        else
        {
            this.name = '';
        }

        this.useAllOverrides = false;
        this.addressUMode = 1;
        this.addressVMode = 1;
        this.addressWMode = 1;
        this.filterMode = 2;
        this.mipFilterMode = 2;
        this.maxAnisotropy = 4;
        this.textureRes = null;
        this._sampler = null;

        if (typeof(texturePath) != 'undefined')
        {
            this.resourcePath = texturePath;
            this.Initialize();
        }
        else
        {
            this.resourcePath = '';
        }
    }

    /**
     * Gets texture res object
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2TextureRes>} [out]
     */
    Tw2TextureParameter.prototype.GetResource = function(out)
    {
        if (out === undefined)
        {
            out = [];
        }

        if (this.textureRes !== null)
        {
            if (out.indexOf(this.textureRes) === -1)
            {
                out.push(this.textureRes);
            }
        }

        return out;
    }

    /**
     * Sets the texture's resource path
     * @param {string} texturePath
     * @constructor
     */
    Tw2TextureParameter.prototype.SetTexturePath = function(texturePath)
    {
        this.resourcePath = texturePath;
        if (this.resourcePath != '')
        {
            this.textureRes = resMan.GetResource(this.resourcePath);
        }
    };

    /**
     * Initializes the texture parameter
     * @prototype
     */
    Tw2TextureParameter.prototype.Initialize = function()
    {
        if (this.resourcePath != '')
        {
            this.textureRes = resMan.GetResource(this.resourcePath);
        }

        if (this.useAllOverrides)
        {
            this._sampler = new Tw2SamplerState();
            if (this.filterMode == 1)
            {
                switch (this.mipFilterMode)
                {
                    case 0:
                        this._sampler.minFilter = device.gl.NEAREST;
                        break;
                    case 1:
                        this._sampler.minFilter = device.gl.NEAREST_MIPMAP_NEAREST;
                        break;
                    default:
                        this._sampler.minFilter = device.gl.NEAREST_MIPMAP_LINEAR;
                }
                this._sampler.minFilterNoMips = device.gl.NEAREST;
                this._sampler.magFilter = device.gl.NEAREST;
            }
            else
            {
                switch (this.mipFilterMode)
                {
                    case 0:
                        this._sampler.minFilter = device.gl.LINEAR;
                        break;
                    case 1:
                        this._sampler.minFilter = device.gl.LINEAR_MIPMAP_NEAREST;
                        break;
                    default:
                        this._sampler.minFilter = device.gl.LINEAR_MIPMAP_LINEAR;
                }
                this._sampler.minFilterNoMips = device.gl.LINEAR;
                this._sampler.magFilter = device.gl.LINEAR;
            }
            var wrapModes = [
                0,
                device.gl.REPEAT,
                device.gl.MIRRORED_REPEAT,
                device.gl.CLAMP_TO_EDGE,
                device.gl.CLAMP_TO_EDGE,
                device.gl.CLAMP_TO_EDGE
            ];
            this._sampler.addressU = wrapModes[this.addressUMode];
            this._sampler.addressV = wrapModes[this.addressVMode];
            this._sampler.addressW = wrapModes[this.addressWMode];
            this._sampler.anisotropy = this.maxAnisotropy;
            this._sampler.ComputeHash();
        }
    };

    /**
     * Apply
     * @param stage
     * @param sampler
     * @param slices
     * @prototype
     */
    Tw2TextureParameter.prototype.Apply = function(stage, sampler, slices)
    {
        if (this.textureRes)
        {
            if (this.useAllOverrides)
            {
                this._sampler.samplerType = sampler.samplerType;
                this._sampler.isVolume = sampler.isVolume;
                this._sampler.registerIndex = sampler.registerIndex;
                sampler = this._sampler;
            }
            device.gl.activeTexture(device.gl.TEXTURE0 + stage);
            this.textureRes.Bind(sampler, slices);
        }
    };

    /**
     * Get Value
     * @return {string}
     */
    Tw2TextureParameter.prototype.GetValue = function()
    {
        if (this.textureRes)
        {
            return this.textureRes.path;
        }

        return this.resourcePath;
    }

    /**
     * Tw2TransformParameter
     * @param {string} [name='']
     * @parameter {string} name
     * @parameter {vec3} scaling=[1,1,1]
     * @parameter {quat4} rotation=[0,0,0,1]
     * @parameter {vec3} translation=[0,0,0]
     * @parameter {mat4} worldTransform
     * @constructor
     */
    function Tw2TransformParameter(name)
    {
        if (typeof(name) != 'undefined')
        {
            this.name = name;
        }
        else
        {
            this.name = '';
        }
        this.scaling = vec3.create([1, 1, 1]);
        this.rotationCenter = vec3.create([0, 0, 0]);
        this.rotation = quat4.create([0, 0, 0, 1]);
        this.translation = vec3.create([0, 0, 0]);
        this.worldTransform = mat4.identity(mat4.create());
    }

    /**
     * Initializes the transform parameter
     * @prototype
     */
    Tw2TransformParameter.prototype.Initialize = function()
    {
        this.OnModified();
    };

    /**
     * Updates the transform parameter's properties
     * @prototype
     */
    Tw2TransformParameter.prototype.OnModified = function()
    {
        mat4.identity(this.worldTransform);
        mat4.scale(this.worldTransform, this.scaling);

        var rotationCenter = mat4.create();
        mat4.identity(rotationCenter);
        mat4.translate(rotationCenter, this.rotationCenter);
        var rotationCenterInv = mat4.create();
        mat4.identity(rotationCenterInv);
        mat4.translate(rotationCenterInv, [-this.rotationCenter[0], -this.rotationCenter[1], -this.rotationCenter[2]]);

        var rotation = mat4.create();
        rotation[0] = 1.0 - 2.0 * this.rotation[1] * this.rotation[1] - 2 * this.rotation[2] * this.rotation[2];
        rotation[4] = 2 * this.rotation[0] * this.rotation[1] - 2 * this.rotation[2] * this.rotation[3];
        rotation[8] = 2 * this.rotation[0] * this.rotation[2] + 2 * this.rotation[1] * this.rotation[3];
        rotation[1] = 2 * this.rotation[0] * this.rotation[1] + 2 * this.rotation[2] * this.rotation[3];
        rotation[5] = 1 - 2 * this.rotation[0] * this.rotation[0] - 2 * this.rotation[2] * this.rotation[2];
        rotation[9] = 2 * this.rotation[1] * this.rotation[2] - 2 * this.rotation[0] * this.rotation[3];
        rotation[2] = 2 * this.rotation[0] * this.rotation[2] - 2 * this.rotation[1] * this.rotation[3];
        rotation[6] = 2 * this.rotation[1] * this.rotation[2] + 2 * this.rotation[0] * this.rotation[3];
        rotation[10] = 1 - 2 * this.rotation[0] * this.rotation[0] - 2 * this.rotation[1] * this.rotation[1];
        rotation[15] = 1;

        mat4.multiply(this.worldTransform, rotationCenterInv);
        mat4.multiply(this.worldTransform, rotation);
        mat4.multiply(this.worldTransform, rotationCenter);
        mat4.translate(this.worldTransform, this.translation);
        mat4.transpose(this.worldTransform);
    };

    /**
     * Bind
     * @param {Float32Array} constantBuffer
     * @param {number} offset
     * @param {number} size
     * @returns {boolean}
     * @prototype
     */
    Tw2TransformParameter.prototype.Bind = function(constantBuffer, offset, size)
    {
        if (this.constantBuffer != null || size < 16)
        {
            return false;
        }
        this.constantBuffer = constantBuffer;
        this.offset = offset;
        this.Apply(this.constantBuffer, this.offset, size);
    };

    /**
     * A function that should be called when any of the transform parameter's properties have been changed
     * @prototype
     */
    Tw2TransformParameter.prototype.OnValueChanged = function()
    {
        this.OnModified();
    };

    /**
     * Apply
     * @param {Float32Array} constantBuffer
     * @param {number} offset
     * @param {number} size
     * @constructor
     */
    Tw2TransformParameter.prototype.Apply = function(constantBuffer, offset, size)
    {
        if (size >= 16)
        {
            constantBuffer.set(this.worldTransform, offset);
        }
        else
        {
            constantBuffer.set(this.worldTransform.subarray(0, size), offset);
        }
    };

    /**
     * RenderMode
     * @typedef {(device.RM_ANY|device.RM_OPAQUE|device.RM_DECAL|device.RM_TRANSPARENT|device.RM_ADDITIVE|device.RM_DEPTH|device.RM_FULLSCREEN)} RenderMode
     */

    window.requestAnimFrame = (function()
    {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element)
            {
                window.setTimeout(callback, 1000 / 60);
            };
    })();

    /**
     * Tw2Device
     * - creates WebGL context
     * - stores global rendering variables
     * - contains utility functions
     * @constructor
     */
    function Tw2Device()
    {
        this.RM_ANY = -1;
        this.RM_OPAQUE = 0;
        this.RM_DECAL = 1;
        this.RM_TRANSPARENT = 2;
        this.RM_ADDITIVE = 3;
        this.RM_DEPTH = 4;
        this.RM_FULLSCREEN = 5;
        this.RM_PICKABLE = 6;

        this.RS_ZENABLE = 7; /* D3DZBUFFERTYPE (or TRUE/FALSE for legacy) */
        this.RS_FILLMODE = 8; /* D3DFILLMODE */
        this.RS_SHADEMODE = 9; /* D3DSHADEMODE */
        this.RS_ZWRITEENABLE = 14; /* TRUE to enable z writes */
        this.RS_ALPHATESTENABLE = 15; /* TRUE to enable alpha tests */
        this.RS_LASTPIXEL = 16; /* TRUE for last-pixel on lines */
        this.RS_SRCBLEND = 19; /* D3DBLEND */
        this.RS_DESTBLEND = 20; /* D3DBLEND */
        this.RS_CULLMODE = 22; /* D3DCULL */
        this.RS_ZFUNC = 23; /* D3DCMPFUNC */
        this.RS_ALPHAREF = 24; /* D3DFIXED */
        this.RS_ALPHAFUNC = 25; /* D3DCMPFUNC */
        this.RS_DITHERENABLE = 26; /* TRUE to enable dithering */
        this.RS_ALPHABLENDENABLE = 27; /* TRUE to enable alpha blending */
        this.RS_FOGENABLE = 28; /* TRUE to enable fog blending */
        this.RS_SPECULARENABLE = 29; /* TRUE to enable specular */
        this.RS_FOGCOLOR = 34; /* D3DCOLOR */
        this.RS_FOGTABLEMODE = 35; /* D3DFOGMODE */
        this.RS_FOGSTART = 36; /* Fog start (for both vertex and pixel fog) */
        this.RS_FOGEND = 37; /* Fog end      */
        this.RS_FOGDENSITY = 38; /* Fog density  */
        this.RS_RANGEFOGENABLE = 48; /* Enables range-based fog */
        this.RS_STENCILENABLE = 52; /* BOOL enable/disable stenciling */
        this.RS_STENCILFAIL = 53; /* D3DSTENCILOP to do if stencil test fails */
        this.RS_STENCILZFAIL = 54; /* D3DSTENCILOP to do if stencil test passes and Z test fails */
        this.RS_STENCILPASS = 55; /* D3DSTENCILOP to do if both stencil and Z tests pass */
        this.RS_STENCILFUNC = 56; /* D3DCMPFUNC fn.  Stencil Test passes if ((ref & mask) stencilfn (stencil & mask)) is true */
        this.RS_STENCILREF = 57; /* Reference value used in stencil test */
        this.RS_STENCILMASK = 58; /* Mask value used in stencil test */
        this.RS_STENCILWRITEMASK = 59; /* Write mask applied to values written to stencil buffer */
        this.RS_TEXTUREFACTOR = 60; /* D3DCOLOR used for multi-texture blend */
        this.RS_WRAP0 = 128; /* wrap for 1st texture coord. set */
        this.RS_WRAP1 = 129; /* wrap for 2nd texture coord. set */
        this.RS_WRAP2 = 130; /* wrap for 3rd texture coord. set */
        this.RS_WRAP3 = 131; /* wrap for 4th texture coord. set */
        this.RS_WRAP4 = 132; /* wrap for 5th texture coord. set */
        this.RS_WRAP5 = 133; /* wrap for 6th texture coord. set */
        this.RS_WRAP6 = 134; /* wrap for 7th texture coord. set */
        this.RS_WRAP7 = 135; /* wrap for 8th texture coord. set */
        this.RS_CLIPPING = 136;
        this.RS_LIGHTING = 137;
        this.RS_AMBIENT = 139;
        this.RS_FOGVERTEXMODE = 140;
        this.RS_COLORVERTEX = 141;
        this.RS_LOCALVIEWER = 142;
        this.RS_NORMALIZENORMALS = 143;
        this.RS_DIFFUSEMATERIALSOURCE = 145;
        this.RS_SPECULARMATERIALSOURCE = 146;
        this.RS_AMBIENTMATERIALSOURCE = 147;
        this.RS_EMISSIVEMATERIALSOURCE = 148;
        this.RS_VERTEXBLEND = 151;
        this.RS_CLIPPLANEENABLE = 152;
        this.RS_POINTSIZE = 154; /* float point size */
        this.RS_POINTSIZE_MIN = 155; /* float point size min threshold */
        this.RS_POINTSPRITEENABLE = 156; /* BOOL point texture coord control */
        this.RS_POINTSCALEENABLE = 157; /* BOOL point size scale enable */
        this.RS_POINTSCALE_A = 158; /* float point attenuation A value */
        this.RS_POINTSCALE_B = 159; /* float point attenuation B value */
        this.RS_POINTSCALE_C = 160; /* float point attenuation C value */
        this.RS_MULTISAMPLEANTIALIAS = 161; // BOOL - set to do FSAA with multisample buffer
        this.RS_MULTISAMPLEMASK = 162; // DWORD - per-sample enable/disable
        this.RS_PATCHEDGESTYLE = 163; // Sets whether patch edges will use float style tessellation
        this.RS_DEBUGMONITORTOKEN = 165; // DEBUG ONLY - token to debug monitor
        this.RS_POINTSIZE_MAX = 166; /* float point size max threshold */
        this.RS_INDEXEDVERTEXBLENDENABLE = 167;
        this.RS_COLORWRITEENABLE = 168; // per-channel write enable
        this.RS_TWEENFACTOR = 170; // float tween factor
        this.RS_BLENDOP = 171; // D3DBLENDOP setting
        this.RS_POSITIONDEGREE = 172; // NPatch position interpolation degree. D3DDEGREE_LINEAR or D3DDEGREE_CUBIC (default)
        this.RS_NORMALDEGREE = 173; // NPatch normal interpolation degree. D3DDEGREE_LINEAR (default) or D3DDEGREE_QUADRATIC
        this.RS_SCISSORTESTENABLE = 174;
        this.RS_SLOPESCALEDEPTHBIAS = 175;
        this.RS_ANTIALIASEDLINEENABLE = 176;
        this.RS_TWOSIDEDSTENCILMODE = 185; /* BOOL enable/disable 2 sided stenciling */
        this.RS_CCW_STENCILFAIL = 186; /* D3DSTENCILOP to do if ccw stencil test fails */
        this.RS_CCW_STENCILZFAIL = 187; /* D3DSTENCILOP to do if ccw stencil test passes and Z test fails */
        this.RS_CCW_STENCILPASS = 188; /* D3DSTENCILOP to do if both ccw stencil and Z tests pass */
        this.RS_CCW_STENCILFUNC = 189; /* D3DCMPFUNC fn.  ccw Stencil Test passes if ((ref & mask) stencilfn (stencil & mask)) is true */
        this.RS_COLORWRITEENABLE1 = 190; /* Additional ColorWriteEnables for the devices that support D3DPMISCCAPS_INDEPENDENTWRITEMASKS */
        this.RS_COLORWRITEENABLE2 = 191; /* Additional ColorWriteEnables for the devices that support D3DPMISCCAPS_INDEPENDENTWRITEMASKS */
        this.RS_COLORWRITEENABLE3 = 192; /* Additional ColorWriteEnables for the devices that support D3DPMISCCAPS_INDEPENDENTWRITEMASKS */
        this.RS_BLENDFACTOR = 193; /* D3DCOLOR used for a constant blend factor during alpha blending for devices that support D3DPBLENDCAPS_BLENDFACTOR */
        this.RS_SRGBWRITEENABLE = 194; /* Enable rendertarget writes to be DE-linearized to SRGB (for formats that expose D3DUSAGE_QUERY_SRGBWRITE) */
        this.RS_DEPTHBIAS = 195;
        this.RS_SEPARATEALPHABLENDENABLE = 206; /* TRUE to enable a separate blending function for the alpha channel */
        this.RS_SRCBLENDALPHA = 207; /* SRC blend factor for the alpha channel when RS_SEPARATEDESTALPHAENABLE is TRUE */
        this.RS_DESTBLENDALPHA = 208; /* DST blend factor for the alpha channel when RS_SEPARATEDESTALPHAENABLE is TRUE */
        this.RS_BLENDOPALPHA = 209; /* Blending operation for the alpha channel when RS_SEPARATEDESTALPHAENABLE is TRUE */

        this.CULL_NONE = 1;
        this.CULL_CW = 2;
        this.CULL_CCW = 3;

        this.CMP_NEVER = 1;
        this.CMP_LESS = 2;
        this.CMP_EQUAL = 3;
        this.CMP_LEQUAL = 4;
        this.CMP_GREATER = 5;
        this.CMP_NOTEQUAL = 6;
        this.CMP_GREATEREQUAL = 7;
        this.CMP_ALWAYS = 8;

        this.BLEND_ZERO = 1;
        this.BLEND_ONE = 2;
        this.BLEND_SRCCOLOR = 3;
        this.BLEND_INVSRCCOLOR = 4;
        this.BLEND_SRCALPHA = 5;
        this.BLEND_INVSRCALPHA = 6;
        this.BLEND_DESTALPHA = 7;
        this.BLEND_INVDESTALPHA = 8;
        this.BLEND_DESTCOLOR = 9;
        this.BLEND_INVDESTCOLOR = 10;
        this.BLEND_SRCALPHASAT = 11;
        this.BLEND_BOTHSRCALPHA = 12;
        this.BLEND_BOTHINVSRCALPHA = 13;
        this.BLEND_BLENDFACTOR = 14;
        this.BLEND_INVBLENDFACTOR = 15;

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

        /**
         * Creates gl Device
         * @param {canvas} canvas
         * @param {Object} params
         */
        this.CreateDevice = function(canvas, params)
        {
            this.gl = null;
            var err = null;

            try
            {
                this.gl = canvas.getContext("webgl", params) || canvas.getContext("experimental-webgl", params);
            }
            catch (e)
            {
                err = e.toString();
            }

            if (!this.gl)
            {
                emitter.log('WebGL',
                {
                    log: 'error',
                    msg: 'Could not initialise WebGL',
                    src: ['Tw2Device', 'CreateDevice'],
                    type: 'context',
                    data: err
                });
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
            this.instancedArrays = this.gl.getExtension("ANGLE_instanced_arrays");

            this.alphaBlendBackBuffer = !params || typeof(params.alpha) == 'undefined' || params.alpha;
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
                1.0, 1.0, 0.0, 1.0, 1.0, 1.0, -1.0, 1.0, 0.0, 1.0, 0.0, 1.0,
                1.0, -1.0, 0.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, 0.0, 0.0
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

            this._blendTable = [-1, // --
                this.gl.ZERO, // D3DBLEND_ZERO
                this.gl.ONE, // D3DBLEND_ONE
                this.gl.SRC_COLOR, // D3DBLEND_SRCCOLOR
                this.gl.ONE_MINUS_SRC_COLOR, // D3DBLEND_INVSRCCOLOR
                this.gl.SRC_ALPHA, // D3DBLEND_SRCALPHA
                this.gl.ONE_MINUS_SRC_ALPHA, // D3DBLEND_INVSRCALPHA
                this.gl.DST_ALPHA, // D3DBLEND_DESTALPHA
                this.gl.ONE_MINUS_DST_ALPHA, // D3DBLEND_INVDESTALPHA
                this.gl.DST_COLOR, // D3DBLEND_DESTCOLOR
                this.gl.ONE_MINUS_DST_COLOR, // D3DBLEND_INVDESTCOLOR
                this.gl.SRC_ALPHA_SATURATE, // D3DBLEND_SRCALPHASAT
                -1, // D3DBLEND_BOTHSRCALPHA
                -1, // D3DBLEND_BOTHINVSRCALPHA
                this.gl.CONSTANT_COLOR, // D3DBLEND_BLENDFACTOR
                this.gl.ONE_MINUS_CONSTANT_COLOR // D3DBLEND_INVBLENDFACTOR
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

        /**
         * Schedule
         * @param render
         */
        this.Schedule = function(render)
        {
            this._scheduled[this._scheduled.length] = render;
        };

        /**
         * Tick
         */
        this.Tick = function()
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

        /**
         * Sets World transform matrix
         * @param {mat4} matrix
         */
        this.SetWorld = function(matrix)
        {
            mat4.set(matrix, this.world);
        };

        /**
         * Sets view matrix
         * @param {mat4} matrix
         */
        this.SetView = function(matrix)
        {
            mat4.set(matrix, this.view);
            mat4.multiply(this.projection, this.view, variableStore._variables['ViewProjectionMat'].value);
            mat4.inverse(this.view, this.viewInv);
            this.eyePosition.set([this.viewInv[12], this.viewInv[13], this.viewInv[14]]);
        };

        /**
         * Sets projection matrix
         * @param {mat4} matrix
         */
        this.SetProjection = function(matrix)
        {
            mat4.set(matrix, this.projection);
            mat4.multiply(this.projection, this.view, variableStore._variables['ViewProjectionMat'].value);
        };

        /**
         * GetEyePosition
         * @return {vec3}
         */
        this.GetEyePosition = function()
        {
            return this.eyePosition;
        };

        /**
         * RenderFullScreenQuad
         * @param {Tw2Effect} effect
         */
        this.RenderFullScreenQuad = function(effect)
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
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._quadBuffer);

            for (var pass = 0; pass < effect.GetPassCount(); ++pass)
            {
                effect.ApplyPass(pass);
                if (!this._quadDecl.SetDeclaration(effect.GetPassInput(pass), 24))
                {
                    return false;
                }
                this.ApplyShadowState();
                this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
            }
        };

        /**
         * Renders a Texture to the screen
         * @param texture
         */
        this.RenderTexture = function(texture)
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

        /**
         * RenderCameraSpaceQuad
         * @param {Tw2Effect} effect
         */
        this.RenderCameraSpaceQuad = function(effect)
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
                1.0, 1.0, 0.0, 1.0, 1.0, 1.0, -1.0, 1.0, 0.0, 1.0, 0.0, 1.0,
                1.0, -1.0, 0.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, 0.0, 0.0
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

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._cameraQuadBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

            for (var pass = 0; pass < effect.GetPassCount(); ++pass)
            {
                effect.ApplyPass(pass);
                if (!this._quadDecl.SetDeclaration(effect.GetPassInput(pass), 24))
                {
                    return false;
                }
                this.ApplyShadowState();
                this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
            }
        };

        /**
         * Converts a Dword to Float
         * @param value
         * @return {Number}
         */
        this._DwordToFloat = function(value)
        {
            var b4 = (value & 0xff);
            var b3 = (value & 0xff00) >> 8;
            var b2 = (value & 0xff0000) >> 16;
            var b1 = (value & 0xff000000) >> 24;
            var sign = 1 - (2 * (b1 >> 7)); // sign = bit 0
            var exp = (((b1 << 1) & 0xff) | (b2 >> 7)) - 127; // exponent = bits 1..8
            var sig = ((b2 & 0x7f) << 16) | (b3 << 8) | b4; // significand = bits 9..31
            if (sig == 0 && exp == -127)
                return 0.0;
            return sign * (1 + sig * Math.pow(2, -23)) * Math.pow(2, exp);
        };

        /**
         * Returns whether or not Alpha Test is enabled
         * return {Boolean}
         */
        this.IsAlphaTestEnabled = function()
        {
            return this.alphaTestState.states[this.RS_ALPHATESTENABLE];
        };

        /**
         * Set a render state
         * @param state
         * @param value
         */
        this.SetRenderState = function(state, value)
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
                        (value & 1) != 0, (value & 2) != 0, (value & 4) != 0, (value & 8) != 0);
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

        /**
         * ApplyShadowState
         */
        this.ApplyShadowState = function()
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
                this.gl.uniform4f(
                    this.shadowHandles.shadowStateInt,
                    invertedAlphaTest,
                    alphaTestRef,
                    alphaTestFunc,
                    clipPlaneEnable);
                //this._shadowStateBuffers
            }
        };

        /**
         * Sets a render mode
         * @param {RenderMode} renderMode
         * @constructor
         */
        this.SetStandardStates = function(renderMode)
        {
            if (this._currentRenderMode == renderMode)
            {
                return;
            }
            this.gl.frontFace(this.gl.CW);
            switch (renderMode)
            {
                case this.RM_OPAQUE:
                case this.RM_PICKABLE:
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

        /**
         * Gets a fallback texture
         * @returns {*}
         */
        this.GetFallbackTexture = function()
        {
            if (this._whiteTexture == null)
            {
                this._whiteTexture = this.gl.createTexture();
                this.gl.bindTexture(this.gl.TEXTURE_2D, this._whiteTexture);
                this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
                //this.gl.generateMipmap(this.gl.TEXTURE_2D);
                this.gl.bindTexture(this.gl.TEXTURE_2D, null);
            }
            return this._whiteTexture;
        };

        /**
         * Gets a fallback cube map
         * @returns {*}
         */
        this.GetFallbackCubeMap = function()
        {
            if (this._whiteCube == null)
            {
                this._whiteCube = this.gl.createTexture();
                this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this._whiteCube);
                for (var j = 0; j < 6; ++j)
                {
                    this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + j, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
                }
                this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
                this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
                this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
                this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
                //this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP);
                this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, null);
            }
            return this._whiteCube;
        };
    }

    var device = new Tw2Device();

    /**
     * Render Batches
     * @typedef {(Tw2RenderBatch|Tw2ForwardingRenderBatch|Tw2GeometryBatch|Tw2GeometryLineBatch|Tw2InstancedMeshBatch|EvePlaneSetBatch|EveBoosterBatch|EveSpotlightSetBatch|EveSpriteSetBatch)} RenderBatch
     */

    /**
     * Accumulates render batches for rendering
     * @param {function} [sorting] - An optional function for sorting the collected render batches
     * @property {Array.<RenderBatch>} batches
     * @property {number} count - How many batch array elements will be processed
     * @property {function} _sortMethod - the stored sorting function
     * @constructor
     */
    function Tw2BatchAccumulator(sorting)
    {
        this.batches = [];
        this.count = 0;
        this._sortMethod = (sorting) ? sorting : undefined;
    }

    /**
     * Commits a batch to accumulation
     * @param {RenderBatch} batch
     * @prototype
     */
    Tw2BatchAccumulator.prototype.Commit = function(batch)
    {
        this.batches[this.count++] = batch;
    };

    /**
     * Clears any accumulated render batches
     * @prototype
     */
    Tw2BatchAccumulator.prototype.Clear = function()
    {
        this.count = 0;
        this.batches = [];
    };

    /**
     * Renders the accumulated render batches
     * - If a sorting function has been defined the render batches will be sorted before rendering
     * @param {Tw2Effect} [overrideEffect]
     * @prototype
     */
    Tw2BatchAccumulator.prototype.Render = function(overrideEffect)
    {
        if (typeof(this._sortMethod) != 'undefined')
        {
            this.batches.sort(this._sortMethod);
        }
        for (var i = 0; i < this.count; ++i)
        {
            if (this.batches[i].renderMode != device.RM_ANY)
            {
                device.SetStandardStates(this.batches[i].renderMode);
            }
            device.perObjectData = this.batches[i].perObjectData;
            this.batches[i].Commit(overrideEffect);
        }
    };


    /**
     * A standard render batch
     * @property {RenderMode} renderMode
     * @property {Tw2PerObjectData} perObjectData
     * @constructor
     */
    function Tw2RenderBatch()
    {
        this.renderMode = device.RM_ANY;
        this.perObjectData = null;
    }


    /**
     * A render batch that uses geometry provided from an external source
     * @property {GeometryProvider} geometryProvider
     * @inherits Tw2RenderBatch
     * @constructor
     */
    function Tw2ForwardingRenderBatch()
    {
        this.geometryProvider = null;
    }

    /**
     * Commits the batch for rendering
     * @param {Tw2Effect} [overrideEffect]
     * @prototype
     */
    Tw2ForwardingRenderBatch.prototype.Commit = function(overrideEffect)
    {
        if (this.geometryProvider)
        {
            this.geometryProvider.Render(this, overrideEffect);
        }
    };

    Inherit(Tw2ForwardingRenderBatch, Tw2RenderBatch);

    /**
     * Tw2GeometryBatch
     * @property {Tw2GeometryRes} geometryRes
     * @property {Number} meshIx
     * @property {Number} start
     * @property {Number} count
     * @property {Tw2Effect} effect
     * @inherit Tw2RenderBatch
     * @constructor
     */
    function Tw2GeometryBatch()
    {
        this._super.constructor.call(this);
        this.geometryRes = null;
        this.meshIx = 0;
        this.start = 0;
        this.count = 1;
        this.effect = null;
    }

    /**
     * Commits the Geometry Batch for rendering
     * @param {Tw2Effect} [overrideEffect]
     */
    Tw2GeometryBatch.prototype.Commit = function(overrideEffect)
    {
        var effect = typeof(overrideEffect) == 'undefined' ? this.effect : overrideEffect;
        if (this.geometryRes && effect)
        {
            this.geometryRes.RenderAreas(this.meshIx, this.start, this.count, effect);
        }
    };

    Inherit(Tw2GeometryBatch, Tw2RenderBatch);


    /**
     * Tw2GeometryLineBatch
     * @property {Tw2GeometryRes} geometryRes
     * @property {Number} meshIx
     * @property {Number} start
     * @property {Number} count
     * @property {Tw2Effect|null} effect
     * @inherit Tw2RenderBatch
     * @constructor
     */
    function Tw2GeometryLineBatch()
    {
        this._super.constructor.call(this);
        this.geometryRes = null;
        this.meshIx = 0;
        this.start = 0;
        this.count = 1;
        this.effect = null;
    }

    /**
     * Commits the Geometry Line Batch for rendering
     * @param {Tw2Effect} [overrideEffect]
     */
    Tw2GeometryLineBatch.prototype.Commit = function(overrideEffect)
    {
        var effect = typeof(overrideEffect) == 'undefined' ? this.effect : overrideEffect;
        if (this.geometryRes && effect)
        {
            this.geometryRes.RenderLines(this.meshIx, this.start, this.count, effect);
        }
    };

    Inherit(Tw2GeometryLineBatch, Tw2RenderBatch);


    /**
     * Tw2GeometryMeshArea
     * @property {string} name
     * @property {Number} start
     * @property {Number} count
     * @property {vec3} minBounds
     * @property {vec3} maxBounds
     * @property {vec3} boundsSpherePosition
     * @property {Number} boundsSphereRadius
     * @constructor
     */
    function Tw2GeometryMeshArea()
    {
        this.name = '';
        this.start = 0;
        this.count = 0;
        this.minBounds = vec3.create();
        this.maxBounds = vec3.create();
        this.boundsSpherePosition = vec3.create();
        this.boundsSphereRadius = 0;
    }


    /**
     * Tw2GeometryMeshBinding
     * @property {Tw2GeometryMesh} mesh
     * @property {Array.<Tw2GeometryBone>} bones
     * @constructor
     */
    function Tw2GeometryMeshBinding()
    {
        this.mesh = null;
        this.bones = [];
    }


    /**
     * Tw2GeometryModel
     * @property {string} name
     * @property {Array.<Tw2GeometryMeshBinding>} meshBindings
     * @property {Tw2GeometrySkeleton} skeleton
     * @constructor
     */
    function Tw2GeometryModel()
    {
        this.name = '';
        this.meshBindings = [];
        this.skeleton = null;
    }

    /**
     * Finds a bone by it's name
     * @param {string} name
     * @returns {Tw2GeometryBone|null}
     * @constructor
     */
    Tw2GeometryModel.prototype.FindBoneByName = function(name)
    {
        if (this.skeleton == null)
        {
            return null;
        }
        for (var b = 0; b < this.skeleton.bones.length; ++b)
        {
            if (this.skeleton.bones[b].name == name)
            {
                return this.skeleton.bones[b];
            }
        }
        return null;
    };


    /**
     * Tw2GeometrySkeleton
     * @property {Array.<Tw2GeometryBone>} bones
     * @constructor
     */
    function Tw2GeometrySkeleton()
    {
        this.bones = [];
    }


    /**
     * Tw2GeometryBone
     * @property {string} name
     * @property {Number} parentIndex
     * @property {vec3} position
     * @property {quat4} orientation
     * @property {mat3} scaleShear
     * @property {mat4} localTransform
     * @property {mat4} worldTransform
     * @property {mat4} worldTransformInv
     * @constructor
     */
    function Tw2GeometryBone()
    {
        this.name = '';
        this.parentIndex = -1;
        this.position = vec3.create();
        this.orientation = quat4.create();
        this.scaleShear = mat3.create();
        this.localTransform = mat4.create();
        this.worldTransform = mat4.create();
        this.worldTransformInv = mat4.create();
    }

    /**
     * Updates the Bone's transform
     * @returns {mat4}
     */
    Tw2GeometryBone.prototype.UpdateTransform = function()
    {
        mat3.toMat4(this.scaleShear, this.localTransform);
        mat4.multiply(this.localTransform, mat4.transpose(quat4.toMat4(quat4.normalize(this.orientation))));
        //mat4.translate(this.localTransform, this.position);
        this.localTransform[12] = this.position[0];
        this.localTransform[13] = this.position[1];
        this.localTransform[14] = this.position[2];
        return this.localTransform;
    };


    /**
     * Tw2GeometryAnimation
     * @property {string} name
     * @property {Number} duration
     * @property {Array.<Tw2GeometryTrackGroup>} trackGroups
     * @constructor
     */
    function Tw2GeometryAnimation()
    {
        this.name = '';
        this.duration = 0;
        this.trackGroups = [];
    }


    /**
     * Tw2GeometryTrackGroup
     * @property {string} name
     * @property {Tw2GeometryModel} model
     * @property {Array.<Tw2GeometryTransformTrack>} transformTracks
     * @constructor
     */
    function Tw2GeometryTrackGroup()
    {
        this.name = '';
        this.model = null;
        this.transformTracks = [];
    }


    /**
     *
     * @property {string} name
     * @property {Tw2GeometryCurve} position
     * @property {Tw2GeometryCurve} orientation
     * @property scaleShear
     * @constructor
     */
    function Tw2GeometryTransformTrack()
    {
        this.name = '';
        this.position = null;
        this.orientation = null;
        this.scaleShear = null;
    }


    /**
     * Tw2GeometryCurve
     * @property {Number} dimension
     * @property {Number} degree
     * @property {Float32Array} knots
     * @property {Float32Array} controls
     * @constructor
     */
    function Tw2GeometryCurve()
    {
        this.dimension = 0;
        this.degree = 0;
        this.knots = null;
        this.controls = null;
    }


    /**
     * Tw2BlendShapeData
     * @property {String} name
     * @property {Tw2VertexDeclaration} declaration
     * @property {Array} buffers
     * @property indexes
     * @property weightProxy
     * @constructor
     */
    function Tw2BlendShapeData()
    {
        this.name = '';
        this.declaration = new Tw2VertexDeclaration();
        this.buffers = [];
        this.indexes = null;
        this.weightProxy = null;
    }


    /**
     * Tw2GeometryMesh
     * @property {string} name
     * @property {Tw2VertexDeclaration} declaration
     * @property {Array.<Tw2GeometryMeshArea>} areas
     * @property {WebGLBuffer} buffer
     * @property {Number} bufferLength
     * @property bufferData
     * @property {WebGLBuffer} indexes
     * @property indexData
     * @property {Number} indexType
     * @property {vec3} minBounds
     * @property {vec3} maxBounds
     * @property {vec3} boundsSpherePosition
     * @property {Number} boundsSphereRadius
     * @property {Array} bones
     * @property {Array.<string>} boneBindings
     * @constructor
     */
    function Tw2GeometryMesh()
    {
        this.name = '';
        this.declaration = new Tw2VertexDeclaration();
        this.areas = [];
        this.buffer = null;
        this.bufferLength = 0;
        this.bufferData = null;
        this.indexes = null;
        this.indexData = null;
        this.indexType = 0;
        this.minBounds = vec3.create();
        this.maxBounds = vec3.create();
        this.boundsSpherePosition = vec3.create();
        this.boundsSphereRadius = 0;
        this.bones = [];
        this.boneBindings = [];
    }


    /**
     * Tw2GeometryRes
     * @property {Array} meshes
     * @property {vec3} minBounds
     * @property {vec3} maxBounds
     * @property {vec3} boundsSpherePosition
     * @property {Number} boundsSphereRadius
     * @property {Array} models
     * @property {Array} animations
     * @property {Boolean} systemMirror
     * @inherit Tw2Resource
     * @constructor
     */
    function Tw2GeometryRes()
    {
        this._super.constructor.call(this);
        this.meshes = [];
        this.minBounds = vec3.create();
        this.maxBounds = vec3.create();
        this.boundsSpherePosition = vec3.create();
        this.boundsSphereRadius = 0;
        this.models = [];
        this.animations = [];
        this.systemMirror = resMan.systemMirror;
    }

    /**
     * Request Response Type
     * @type {string}
     */
    Tw2GeometryRes.prototype.requestResponseType = 'arraybuffer';

    /**
     * GetInstanceBuffer
     * @param {Number} meshIndex
     * @returns {*}
     */
    Tw2GeometryRes.prototype.GetInstanceBuffer = function(meshIndex)
    {
        return meshIndex < this.meshes.length ? this.meshes[meshIndex].buffer : undefined;
    };

    /**
     * GetInstanceDeclaration
     * @param {Number} meshIndex
     * @returns {Tw2VertexDeclaration}
     */
    Tw2GeometryRes.prototype.GetInstanceDeclaration = function(meshIndex)
    {
        return this.meshes[meshIndex].declaration;
    };

    /**
     * GetInstanceStride
     * @param {Number} meshIndex
     * @returns {*}
     */
    Tw2GeometryRes.prototype.GetInstanceStride = function(meshIndex)
    {
        return this.meshes[meshIndex].declaration.stride;
    };

    /**
     * GetInstanceCount
     * @param {Number} meshIndex
     * @returns {*}
     */
    Tw2GeometryRes.prototype.GetInstanceCount = function(meshIndex)
    {
        return this.meshes[meshIndex].bufferLength * 4 / this.meshes[meshIndex].declaration.stride;
    };

    /**
     * Prepare
     * @param data
     */
    Tw2GeometryRes.prototype.Prepare = function(data)
    {
        var reader = new Tw2BinaryReader(new Uint8Array(data));
        var self = this;

        /**
         * ReadVertexBuffer
         * @param declaration
         * @returns {Float32Array}
         * @private
         */
        function ReadVertexBuffer(declaration)
        {
            var declCount = reader.ReadUInt8();
            var vertexSize = 0;
            var declIx, i;
            for (declIx = 0; declIx < declCount; ++declIx)
            {
                var element = new Tw2VertexElement();
                element.usage = reader.ReadUInt8();
                element.usageIndex = reader.ReadUInt8();
                element.fileType = reader.ReadUInt8();
                element.type = device.gl.FLOAT;
                element.elements = (element.fileType >> 5) + 1;
                element.offset = vertexSize * 4;
                declaration.elements[declIx] = element;
                vertexSize += element.elements;
            }
            declaration.RebuildHash();
            declaration.stride = vertexSize * 4;
            var vertexCount = reader.ReadUInt32();
            if (vertexCount == 0)
            {
                return null;
            }
            var buffer = new Float32Array(vertexSize * vertexCount);
            var index = 0;
            for (var vtxIx = 0; vtxIx < vertexCount; ++vtxIx)
            {
                for (declIx = 0; declIx < declCount; ++declIx)
                {
                    var el = declaration.elements[declIx];
                    switch (el.fileType & 0xf)
                    {
                        case 0:
                            if ((el.fileType & 0x10))
                            {
                                for (i = 0; i < el.elements; ++i)
                                {
                                    buffer[index++] = reader.ReadInt8() / 127.0;
                                }
                            }
                            else
                            {
                                for (i = 0; i < el.elements; ++i)
                                {
                                    buffer[index++] = reader.ReadInt8();
                                }
                            }
                            break;

                        case 1:
                            if ((el.fileType & 0x10))
                            {
                                for (i = 0; i < el.elements; ++i)
                                {
                                    buffer[index++] = reader.ReadInt8() / 32767.0;
                                }
                            }
                            else
                            {
                                for (i = 0; i < el.elements; ++i)
                                {
                                    buffer[index++] = reader.ReadInt16();
                                }
                            }
                            break;

                        case 2:
                            for (i = 0; i < el.elements; ++i)
                            {
                                buffer[index++] = reader.ReadInt32();
                            }
                            break;

                        case 3:
                            for (i = 0; i < el.elements; ++i)
                            {
                                buffer[index++] = reader.ReadFloat16();
                            }
                            break;

                        case 4:
                            for (i = 0; i < el.elements; ++i)
                            {
                                buffer[index++] = reader.ReadFloat32();
                            }
                            break;

                        case 8:
                            if ((el.fileType & 0x10))
                            {
                                for (i = 0; i < el.elements; ++i)
                                {
                                    buffer[index++] = reader.ReadUInt8() / 255.0;
                                }
                            }
                            else
                            {
                                for (i = 0; i < el.elements; ++i)
                                {
                                    buffer[index++] = reader.ReadUInt8();
                                }
                            }
                            break;

                        case 9:
                            if ((el.fileType & 0x10))
                            {
                                for (i = 0; i < declaration.elements[declIx].elements; ++i)
                                {
                                    buffer[index++] = reader.ReadUInt8() / 65535.0;
                                }
                            }
                            else
                            {
                                for (i = 0; i < el.elements; ++i)
                                {
                                    buffer[index++] = reader.ReadUInt16();
                                }
                            }
                            break;

                        case 10:
                            for (i = 0; i < el.elements; ++i)
                            {
                                buffer[index++] = reader.ReadUInt32();
                            }
                            break;

                        default:
                            emitter.log('ResMan',
                            {
                                log: 'error',
                                src: ['Tw2GeometryRes', 'ReadVertexBuffer'],
                                msg: 'Error loading wbg data',
                                path: self.path,
                                type: 'geometry.filetype',
                                value: el.fileType & 0xf
                            });
                            throw 1;
                    }
                }
            }
            return buffer;
        }

        /**
         * ReadIndexBuffer
         * @returns {Uint16Array|Uint32Array}
         * @private
         */
        function ReadIndexBuffer()
        {
            var ibType = reader.ReadUInt8();
            var indexCount = reader.ReadUInt32();
            var indexes, i;
            if (ibType == 0)
            {
                indexes = new Uint16Array(indexCount);
                for (i = 0; i < indexCount; ++i)
                {
                    indexes[i] = reader.ReadUInt16();
                }
                return indexes;
            }
            else
            {
                indexes = new Uint32Array(indexCount);
                for (i = 0; i < indexCount; ++i)
                {
                    indexes[i] = reader.ReadUInt32();
                }
                return indexes;
            }
        }

        /* var fileVersion = */
        reader.ReadUInt8();
        var meshCount = reader.ReadUInt8();
        for (var meshIx = 0; meshIx < meshCount; ++meshIx)
        {
            var mesh = new Tw2GeometryMesh();
            mesh.name = reader.ReadString();

            var buffer = ReadVertexBuffer(mesh.declaration);
            var i, j, k;
            if (buffer)
            {
                mesh.bufferLength = buffer.length;
                mesh.buffer = device.gl.createBuffer();
                device.gl.bindBuffer(device.gl.ARRAY_BUFFER, mesh.buffer);
                device.gl.bufferData(device.gl.ARRAY_BUFFER, buffer, device.gl.STATIC_DRAW);
            }
            else
            {
                mesh.buffer = null;
            }

            var indexes = ReadIndexBuffer();
            if (indexes)
            {
                mesh.indexes = device.gl.createBuffer();
                mesh.indexType = indexes.BYTES_PER_ELEMENT == 2 ? device.gl.UNSIGNED_SHORT : device.gl.UNSIGNED_INT;
                device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, mesh.indexes);
                device.gl.bufferData(device.gl.ELEMENT_ARRAY_BUFFER, indexes, device.gl.STATIC_DRAW);
            }
            else
            {
                mesh.indexes = null;
            }

            var areaCount = reader.ReadUInt8();
            for (i = 0; i < areaCount; ++i)
            {
                mesh.areas[i] = new Tw2GeometryMeshArea();
                mesh.areas[i].name = reader.ReadString();
                mesh.areas[i].start = reader.ReadUInt32() * indexes.BYTES_PER_ELEMENT;
                mesh.areas[i].count = reader.ReadUInt32() * 3;
                mesh.areas[i].minBounds = vec3.create([reader.ReadFloat32(), reader.ReadFloat32(), reader.ReadFloat32()]);
                mesh.areas[i].maxBounds = vec3.create([reader.ReadFloat32(), reader.ReadFloat32(), reader.ReadFloat32()]);
            }

            var boneBindingCount = reader.ReadUInt8();
            mesh.boneBindings = [];
            for (i = 0; i < boneBindingCount; ++i)
            {
                mesh.boneBindings[i] = reader.ReadString();
            }

            var annotationSetCount = reader.ReadUInt16();
            if (annotationSetCount || this.systemMirror)
            {
                mesh.bufferData = buffer;
                mesh.indexData = indexes;
            }
            if (annotationSetCount)
            {
                mesh.blendShapes = [];
                for (i = 0; i < annotationSetCount; ++i)
                {
                    mesh.blendShapes[i] = new Tw2BlendShapeData();
                    mesh.blendShapes[i].name = reader.ReadString();
                    mesh.blendShapes[i].buffer = ReadVertexBuffer(mesh.blendShapes[i].declaration);
                    mesh.blendShapes[i].indexes = ReadIndexBuffer();
                }
            }
            this.meshes[meshIx] = mesh;
        }

        var modelCount = reader.ReadUInt8();
        for (var modelIx = 0; modelIx < modelCount; ++modelIx)
        {
            var model = new Tw2GeometryModel();
            model.name = reader.ReadString();

            model.skeleton = new Tw2GeometrySkeleton();
            var boneCount = reader.ReadUInt8();
            for (j = 0; j < boneCount; ++j)
            {
                var bone = new Tw2GeometryBone();
                bone.name = reader.ReadString();
                var flags = reader.ReadUInt8();
                bone.parentIndex = reader.ReadUInt8();
                if (bone.parentIndex == 255)
                {
                    bone.parentIndex = -1;
                }
                if ((flags & 1))
                {
                    vec3.set([reader.ReadFloat32(), reader.ReadFloat32(), reader.ReadFloat32()], bone.position);
                }
                else
                {
                    vec3.set([0, 0, 0], bone.position);
                }
                if ((flags & 2))
                {
                    quat4.set([reader.ReadFloat32(), reader.ReadFloat32(), reader.ReadFloat32(), reader.ReadFloat32()], bone.orientation);
                }
                else
                {
                    quat4.set([0, 0, 0, 1], bone.orientation);
                }
                if ((flags & 4))
                {
                    for (k = 0; k < 9; ++k)
                    {
                        bone.scaleShear[k] = reader.ReadFloat32();
                    }
                }
                else
                {
                    mat3.identity(bone.scaleShear);
                }
                model.skeleton.bones[j] = bone;
            }
            for (j = 0; j < model.skeleton.bones.length; ++j)
            {
                model.skeleton.bones[j].UpdateTransform();
                if (model.skeleton.bones[j].parentIndex != -1)
                {
                    mat4.multiply(model.skeleton.bones[model.skeleton.bones[j].parentIndex].worldTransform, model.skeleton.bones[j].localTransform, model.skeleton.bones[j].worldTransform);
                }
                else
                {
                    mat4.set(model.skeleton.bones[j].localTransform, model.skeleton.bones[j].worldTransform);
                }
                mat4.inverse(model.skeleton.bones[j].worldTransform, model.skeleton.bones[j].worldTransformInv);
            }

            var meshBindingCount = reader.ReadUInt8();
            for (j = 0; j < meshBindingCount; ++j)
            {
                mesh = reader.ReadUInt8();
                if (mesh < this.meshes.length)
                {
                    Tw2GeometryRes.BindMeshToModel(this.meshes[mesh], model);
                }
            }
            this.models[this.models.length] = model;
        }

        /**
         * ReadCurve
         * @returns {Tw2GeometryCurve}
         * @private
         */
        function ReadCurve()
        {
            var type = reader.ReadUInt8();
            if (type == 0)
            {
                return null;
            }
            var dimension = reader.ReadUInt8();
            var curve = new Tw2GeometryCurve();
            curve.dimension = dimension;
            curve.degree = reader.ReadUInt8();
            var knotCount = reader.ReadUInt32();
            curve.knots = new Float32Array(knotCount);
            for (var i = 0; i < knotCount; ++i)
            {
                curve.knots[i] = reader.ReadFloat32();
            }
            var controlCount = reader.ReadUInt32();
            curve.controls = new Float32Array(controlCount);
            for (i = 0; i < controlCount; ++i)
            {
                curve.controls[i] = reader.ReadFloat32();
            }
            return curve;
        }

        var animationCount = reader.ReadUInt8();
        for (i = 0; i < animationCount; ++i)
        {
            var animation = new Tw2GeometryAnimation();
            animation.name = reader.ReadString();
            animation.duration = reader.ReadFloat32();
            var groupCount = reader.ReadUInt8();
            for (j = 0; j < groupCount; ++j)
            {
                var group = new Tw2GeometryTrackGroup();
                group.name = reader.ReadString();
                for (var m = 0; m < this.models.length; ++m)
                {
                    if (this.models[m].name == group.name)
                    {
                        group.model = this.models[m];
                        break;
                    }
                }
                var transformTrackCount = reader.ReadUInt8();
                for (k = 0; k < transformTrackCount; ++k)
                {
                    var track = new Tw2GeometryTransformTrack();
                    track.name = reader.ReadString();
                    track.orientation = ReadCurve();
                    track.position = ReadCurve();
                    track.scaleShear = ReadCurve();
                    if (track.orientation)
                    {
                        var lastX = 0;
                        var lastY = 0;
                        var lastZ = 0;
                        var lastW = 0;
                        for (var n = 0; n < track.orientation.controls.length; n += 4)
                        {
                            var x = track.orientation.controls[n];
                            var y = track.orientation.controls[n + 1];
                            var z = track.orientation.controls[n + 2];
                            var w = track.orientation.controls[n + 3];
                            if (lastX * x + lastY * y + lastZ * z + lastW * w < 0)
                            {
                                track.orientation.controls[n] = -x;
                                track.orientation.controls[n + 1] = -y;
                                track.orientation.controls[n + 2] = -z;
                                track.orientation.controls[n + 3] = -w;
                            }
                            lastX = x;
                            lastY = y;
                            lastZ = z;
                            lastW = w;
                        }
                    }
                    group.transformTracks[group.transformTracks.length] = track;
                }
                animation.trackGroups[animation.trackGroups.length] = group;
            }
            this.animations[this.animations.length] = animation;
        }
        this.PrepareFinished(true);
    };

    /**
     * BindMeshToModel
     * @param {Tw2GeometryMesh} mesh
     * @param {Tw2GeometryModel} model
     */
    Tw2GeometryRes.BindMeshToModel = function(mesh, model)
    {
        var binding = new Tw2GeometryMeshBinding();
        binding.mesh = mesh;
        for (var b = 0; b < binding.mesh.boneBindings.length; ++b)
        {
            var name = binding.mesh.boneBindings[b];
            var bone = model.FindBoneByName(name);
            if (bone == null)
            {
                emitter.log('ResMan',
                {
                    log: 'error',
                    src: ['Tw2GeometryRes', 'BindMeshToModel'],
                    msg: 'Mesh has invalid bone name for model',
                    path: this.path,
                    type: 'geometry.invalidbone',
                    data:
                    {
                        mesh: binding.mesh.name,
                        bone: name,
                        model: model.name
                    }
                });
            }
            else
            {
                binding.bones[binding.bones.length] = bone;
            }
        }
        model.meshBindings[model.meshBindings.length] = binding;
    };

    /**
     * RenderAreasInstanced
     * @param {Number} meshIx
     * @param {Number} start
     * @param {Number} count
     * @param {Tw2Effect} effect
     * @param instanceVB
     * @param instanceDecl
     * @param instanceStride
     * @param instanceCount
     * @returns {Boolean}
     */
    Tw2GeometryRes.prototype.RenderAreasInstanced = function(meshIx, start, count, effect, instanceVB, instanceDecl, instanceStride, instanceCount)
    {
        this.KeepAlive();
        if (!this._isGood)
        {
            return false;
        }
        var effectRes = effect.GetEffectRes();
        if (!effectRes._isGood)
        {
            return false;
        }
        var d = device;
        var mesh = this.meshes[meshIx];
        d.gl.bindBuffer(d.gl.ELEMENT_ARRAY_BUFFER, mesh.indexes);

        var passCount = effect.GetPassCount();
        var i, area;
        for (var pass = 0; pass < passCount; ++pass)
        {
            effect.ApplyPass(pass);
            var passInput = effect.GetPassInput(pass);
            if (passInput.elements.length == 0)
            {
                continue;
            }
            d.gl.bindBuffer(d.gl.ARRAY_BUFFER, mesh.buffer);
            mesh.declaration.SetPartialDeclaration(passInput, mesh.declaration.stride);
            d.gl.bindBuffer(d.gl.ARRAY_BUFFER, instanceVB);
            var resetData = instanceDecl.SetPartialDeclaration(passInput, instanceStride, 8, 1);
            d.ApplyShadowState();

            for (i = 0; i < count; ++i)
            {
                if (i + start < mesh.areas.length)
                {
                    area = mesh.areas[i + start];
                    var areaStart = area.start;
                    var acount = area.count;
                    while (i + 1 < count)
                    {
                        area = mesh.areas[i + 1 + start];
                        if (area.start != areaStart + acount * 2)
                        {
                            break;
                        }
                        acount += area.count;
                        ++i;
                    }
                    d.instancedArrays.drawElementsInstancedANGLE(d.gl.TRIANGLES, acount, mesh.indexType, areaStart, instanceCount);
                }
            }
            instanceDecl.ResetInstanceDivisors(resetData);
        }
        return true;
    };

    /**
     * RenderAreas
     * @param {Number} meshIx
     * @param {Number} start
     * @param {Number} count
     * @param {Tw2Effect} effect
     * @param {callback} cb - callback[pass, drawElements]
     * @returns {Boolean}
     */
    Tw2GeometryRes.prototype.RenderAreas = function(meshIx, start, count, effect, cb)
    {
        this.KeepAlive();
        if (!this._isGood)
        {
            return false;
        }
        var effectRes = effect.GetEffectRes();
        if (!effectRes._isGood)
        {
            return false;
        }
        var d = device;
        var mesh = this.meshes[meshIx] || this.meshes[0];
        d.gl.bindBuffer(d.gl.ARRAY_BUFFER, mesh.buffer);
        d.gl.bindBuffer(d.gl.ELEMENT_ARRAY_BUFFER, mesh.indexes);

        var passCount = effect.GetPassCount();
        var i, area;
        for (var pass = 0; pass < passCount; ++pass)
        {
            effect.ApplyPass(pass);
            var passInput = effect.GetPassInput(pass);
            if (!mesh.declaration.SetDeclaration(passInput, mesh.declaration.stride))
            {
                emitter.log('ResMan',
                {
                    log: 'error',
                    src: ['Tw2GeometryRes', 'RenderLines'],
                    msg: 'Error binding mesh to effect',
                    path: this.path,
                    type: 'geometry.meshbind',
                    data:
                    {
                        pass: pass,
                        passInput: passInput,
                        meshStride: mesh.declaration.stride
                    }
                });
                return false;
            }
            d.ApplyShadowState();

            if (typeof(cb) != 'undefined')
            {
                var drawElements = [];
                for (i = 0; i < count; ++i)
                {
                    if (i + start < mesh.areas.length)
                    {
                        area = mesh.areas[i + start];
                        drawElements.push([d.gl.TRIANGLES, area.count, mesh.indexType, area.start]);
                    }
                }
                cb(pass, drawElements);
            }
            else
            {
                for (i = 0; i < count; ++i)
                {
                    if (i + start < mesh.areas.length)
                    {
                        area = mesh.areas[i + start];
                        var areaStart = area.start;
                        var acount = area.count;
                        while (i + 1 < count)
                        {
                            area = mesh.areas[i + 1 + start];
                            if (area.start != areaStart + acount * 2)
                            {
                                break;
                            }
                            acount += area.count;
                            ++i;
                        }
                        d.gl.drawElements(d.gl.TRIANGLES, acount, mesh.indexType, areaStart);
                    }
                }
            }
        }
        return true;
    };

    /**
     * RenderLines
     * @param {Number} meshIx
     * @param {Number} start
     * @param {Number} count
     * @param {Tw2Effect} effect
     * @param {function} cb - callback[pass, drawElements]
     * @returns {Boolean}
     */
    Tw2GeometryRes.prototype.RenderLines = function(meshIx, start, count, effect, cb)
    {
        this.KeepAlive();
        if (!this._isGood)
        {
            return false;
        }
        var effectRes = effect.GetEffectRes();
        if (!effectRes._isGood)
        {
            return false;
        }
        if (meshIx >= this.meshes.length)
        {
            return false;
        }
        var d = device;
        var mesh = this.meshes[meshIx];
        d.gl.bindBuffer(d.gl.ARRAY_BUFFER, mesh.buffer);
        d.gl.bindBuffer(d.gl.ELEMENT_ARRAY_BUFFER, mesh.indexes);

        var passCount = effect.GetPassCount();
        var i, area;
        for (var pass = 0; pass < passCount; ++pass)
        {
            effect.ApplyPass(pass);
            var passInput = effect.GetPassInput(pass);
            if (!mesh.declaration.SetDeclaration(passInput, mesh.declaration.stride))
            {
                emitter.log('ResMan',
                {
                    log: 'error',
                    src: ['Tw2GeometryRes', 'RenderLines'],
                    msg: 'Error binding mesh to effect',
                    path: this.path,
                    type: 'geometry.meshbind',
                    data:
                    {
                        pass: pass,
                        passInput: passInput,
                        meshStride: mesh.declaration.stride
                    }
                });
                return false;
            }

            d.ApplyShadowState();

            if (typeof(cb) != 'undefined')
            {
                var drawElements = [];
                for (i = 0; i < count; ++i)
                {
                    if (i + start < mesh.areas.length)
                    {
                        area = mesh.areas[i + start];
                        drawElements.push([d.gl.LINES, area.count, mesh.indexType, area.start]);
                    }
                }
                cb(pass, drawElements);
            }
            else
            {
                for (i = 0; i < count; ++i)
                {
                    if (i + start < mesh.areas.length)
                    {
                        area = mesh.areas[i + start];
                        var areaStart = area.start;
                        var acount = area.count;
                        while (i + 1 < count)
                        {
                            area = mesh.areas[i + 1 + start];
                            if (area.start != areaStart + acount * 2)
                            {
                                break;
                            }
                            acount += area.count;
                            ++i;
                        }
                        d.gl.drawElements(d.gl.LINES, acount, mesh.indexType, areaStart);
                    }
                }
            }
        }
        return true;
    };

    /**
     * RenderDebugInfo
     * @param {function} debugHelper
     * @returns {Boolean}
     */
    Tw2GeometryRes.prototype.RenderDebugInfo = function(debugHelper)
    {
        if (!this.IsGood())
        {
            return false;
        }
        for (var i = 0; i < this.models.length; ++i)
        {
            if (this.models[i].skeleton)
            {
                for (var j = 0; j < this.models[i].skeleton.bones.length; ++j)
                {
                    var b0 = this.models[i].skeleton.bones[j];
                    if (b0.parentIndex >= 0)
                    {
                        var b1 = this.models[i].skeleton.bones[b0.parentIndex];
                        debugHelper.AddLine(
                            [b0.worldTransform[12], b0.worldTransform[13], b0.worldTransform[14]], [b1.worldTransform[12], b1.worldTransform[13], b1.worldTransform[14]], [0, 0.7, 0, 1], [0, 0.7, 0, 1]);
                    }
                }
            }
        }
    };

    /**
     * Unloads webgl and javascript resources
     * @returns {Boolean}
     */
    Tw2GeometryRes.prototype.Unload = function()
    {
        for (var i = 0; i < this.meshes.length; ++i)
        {
            if (this.meshes[i].buffer)
            {
                device.gl.deleteBuffer(this.meshes[i].buffer);
                this.meshes[i].buffer = null;
            }
            if (this.meshes[i].indexes)
            {
                device.gl.deleteBuffer(this.meshes[i].indexes);
                this.meshes[i].indexes = null;
            }
        }
        this._isPurged = true;
        this._isGood = false;
        return true;
    };

    Inherit(Tw2GeometryRes, Tw2Resource);

    // Register wgb constructor
    resMan.RegisterExtension('wbg', Tw2GeometryRes);

    /**
     * Tw2TextureRes
     * @property {WebglTexture} texture
     * @property {boolean} isCube
     * @property {Array} images
     * @property {number} width
     * @property {number} height
     * @property {number} _facesLoaded
     * @property {boolean} hasMipMaps
     * @property {number} _currentSampler
     * @inherit Tw2Resource
     * @constructor
     */
    function Tw2TextureRes()
    {
        this._super.constructor.call(this);
        this.texture = null;
        this.isCube = false;
        this.images = [];
        this.width = 0;
        this.height = 0;
        this._facesLoaded = 0;
        this.hasMipMaps = false;
        this._currentSampler = 0;
    }

    /**
     * Prepare
     * TODO: @param xml is redundant
     * @param {string} text - Used to identify the type of image, options are 'cube' or anything else
     * @param xml
     * @prototype
     */
    Tw2TextureRes.prototype.Prepare = function(text, xml)
    {
        var format = device.gl.RGBA;

        if (this.images[0].ccpGLFormat)
        {
            format = this.images[0].ccpGLFormat;
        }

        if (text == 'cube')
        {
            this.texture = device.gl.createTexture();
            device.gl.bindTexture(device.gl.TEXTURE_CUBE_MAP, this.texture);

            var canvas = document.createElement('canvas');
            canvas.width = canvas.height = this.images[0].height;
            var ctx = canvas.getContext('2d');
            for (var j = 0; j < 6; ++j)
            {
                ctx.drawImage(this.images[0], j * canvas.width, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
                device.gl.texImage2D(device.gl.TEXTURE_CUBE_MAP_POSITIVE_X + j, 0, format, format, device.gl.UNSIGNED_BYTE, canvas);
            }
            device.gl.generateMipmap(device.gl.TEXTURE_CUBE_MAP);
            device.gl.bindTexture(device.gl.TEXTURE_CUBE_MAP, null);
            this.width = canvas.width;
            this.height = canvas.height;
            this.hasMipMaps = true;
            this.PrepareFinished(true);
        }
        else
        {
            this.texture = device.gl.createTexture();
            device.gl.bindTexture(device.gl.TEXTURE_2D, this.texture);
            device.gl.texImage2D(device.gl.TEXTURE_2D, 0, format, format, device.gl.UNSIGNED_BYTE, this.images[0]);
            this.hasMipMaps = this.IsPowerOfTwo(this.images[0].width) && this.IsPowerOfTwo(this.images[0].height);
            if (this.hasMipMaps)
            {
                device.gl.generateMipmap(device.gl.TEXTURE_2D);
            }
            device.gl.bindTexture(device.gl.TEXTURE_2D, null);
            this.width = this.images[0].width;
            this.height = this.images[0].height;
            this.PrepareFinished(true);
        }
        delete this.images;
    };

    /**
     * Finds out if a number is to the power of 2
     * @param {number} x
     * @returns {boolean}
     * @prototype
     */
    Tw2TextureRes.prototype.IsPowerOfTwo = function(x)
    {
        return (x & (x - 1)) == 0;
    };

    /**
     * An optional method Tw2objects can have that allows them to take over the construction of it's components during resource loading
     * @param {string} path - texture resource path
     * @returns {boolean}
     * @prototype
     */
    Tw2TextureRes.prototype.DoCustomLoad = function(path)
    {
        var index;

        this.LoadStarted();
        this.images = [];
        var self = this;

        path = resMan.BuildUrl(path);

        var mipExt = '';
        if (device.mipLevelSkipCount > 0)
        {
            mipExt = '.' + device.mipLevelSkipCount.toString();
        }

        if (path.substr(-5) == '.cube')
        {
            resMan._pendingLoads++;
            this.isCube = true;
            this.images[0] = new Image();
            this.images[0].crossOrigin = 'anonymous';
            this.images[0].onload = function()
            {
                resMan._pendingLoads--;
                self.LoadFinished(true);
                resMan._prepareQueue.push([self, 'cube', null]);
            };
            path = path.substr(0, path.length - 5) + '.png';
            if (device.mipLevelSkipCount > 0)
            {
                index = path.lastIndexOf('.');
                if (index >= 0)
                {
                    path = path.substr(0, index - 2) + mipExt + path.substr(index);
                }
            }
            this.images[0].src = path;
        }
        else
        {
            resMan._pendingLoads++;
            this.isCube = false;
            this.images[0] = new Image();
            this.images[0].crossOrigin = 'anonymous';
            this.images[0].onload = function()
            {
                resMan._pendingLoads--;
                self.LoadFinished(true);
                resMan._prepareQueue.push([self, '', null]);
            };
            if (device.mipLevelSkipCount > 0)
            {
                index = path.lastIndexOf('.');
                if (index >= 0)
                {
                    path = path.substr(0, index - 2) + mipExt + path.substr(index);
                }
            }
            this.images[0].src = path;
        }
        return true;
    };

    /**
     * Unloads the texture from memory
     * @returns {boolean}
     * @constructor
     */
    Tw2TextureRes.prototype.Unload = function()
    {
        if (this.texture)
        {
            device.gl.deleteTexture(this.texture);
            this.texture = null;
            this.isPurged = true;
        }
        this._isPurged = true;
        this._isGood = false;
        return true;
    };

    /**
     * Attach
     * @param {WebglTexture} texture
     * @constructor
     */
    Tw2TextureRes.prototype.Attach = function(texture)
    {
        this.texture = texture;
        this.LoadFinished(true);
        this.PrepareFinished(true);
    };

    /**
     * Bind
     * @param sampler
     * @param slices
     * @constructor
     */
    Tw2TextureRes.prototype.Bind = function(sampler, slices)
    {
        this.KeepAlive();
        var targetType = sampler.samplerType;
        if (targetType != (this.isCube ? device.gl.TEXTURE_CUBE_MAP : device.gl.TEXTURE_2D))
        {
            return;
        }
        if (this.texture == null)
        {
            device.gl.bindTexture(
                targetType,
                targetType == device.gl.TEXTURE_2D ? device.GetFallbackTexture() : device.GetFallbackCubeMap());
            return;
        }
        if (sampler.isVolume)
        {
            device.gl.uniform1f(slices, this.height / this.width);
        }
        device.gl.bindTexture(targetType, this.texture);
        if (sampler.hash != this._currentSampler)
        {
            sampler.Apply(this.hasMipMaps);
            this._currentSampler = sampler.hash;
        }
    };

    Inherit(Tw2TextureRes, Tw2Resource);

    // Register 'png' and 'cube' extensions with the resource manager
    resMan.RegisterExtension('png', Tw2TextureRes);
    resMan.RegisterExtension('cube', Tw2TextureRes);

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
     */
    Tw2EffectRes.prototype.requestResponseType = 'arraybuffer';

    /**
     * Prepares the effect
     * - Creates Shaders
     * - Sets shadow states for shaders
     * - Parses Jessica shader annotations
     * @param data
     * @param xml
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
         * @param {Number} stageType
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
                emitter.log('ResMan',
                {
                    log: 'error',
                    src: ['Tw2EffectRes', 'CompileShader'],
                    msg: 'Error compiling shader',
                    path: path,
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
                emitter.log('ResMan',
                {
                    log: 'error',
                    src: ['Tw2EffectRes', 'CreateProgram'],
                    msg: 'Error linking shaders',
                    path: path,
                    type: 'shader.linkstatus',
                    data: device.gl.getProgramInfoLog(program.program)
                });
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
            emitter.log('ResMan',
            {
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

        var headerSize = reader.ReadUInt32();
        if (headerSize == 0)
        {
            emitter.log('ResMan',
            {
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
     * @param {Number} pass - effect.passes index
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
     * @returns {Boolean}
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
     */
    Tw2EffectRes.prototype.GetParametersByGroup = function(groupName)
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

    /**
     * Tw2SamplerOverride
     * @property {number} addressU
     * @property {number} addressV
     * @property {number} addressW
     * @property {number} filter
     * @property {number} mipFilter
     * @property {number} lodBias
     * @property {number} maxMipLevel
     * @property {number} maxAnisotropy
     * @constructor
     */
    function Tw2SamplerOverride()
    {
        this.name = '';

        this.addressU = 0;
        this.addressV = 0;
        this.addressW = 0;
        this.filter = 0;
        this.mipFilter = 0;
        this.lodBias = 0;
        this.maxMipLevel = 0;
        this.maxAnisotropy = 0;

        var sampler = null;

        /**
         * GetSampler
         * @param originalSampler
         * @returns {*}
         * @method
         */
        this.GetSampler = function(originalSampler)
        {
            if (!sampler)
            {
                sampler = new Tw2SamplerState();
                sampler.registerIndex = originalSampler.registerIndex;
                sampler.name = originalSampler.name;
                if (this.filter == 1)
                {
                    switch (this.mipFilter)
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
                    switch (this.mipFilter)
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
                if (this.filter == 1)
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
                sampler.addressU = wrapModes[this.addressU];
                sampler.addressV = wrapModes[this.addressV];
                sampler.addressW = wrapModes[this.addressW];
                if (this.filter == 3 || this.mipFilter == 3)
                {
                    sampler.anisotropy = Math.max(this.maxAnisotropy, 1);
                }
                sampler.samplerType = originalSampler.samplerType;
                sampler.isVolume = originalSampler.isVolume;
                sampler.ComputeHash();
            }
            return sampler;
        }
    }


    /**
     * Tw2Effect
     * @property {string} name
     * @property {string} effectFilePath
     * @property {Tw2EffectRes|null} effectRes
     * @property {Object.<string, Tw2Parameter>} parameters
     * @property {Array} passes
     * @property {Array} samplerOverrides
     * @constructor
     */
    function Tw2Effect()
    {
        this.name = '';
        this.effectFilePath = '';
        this.effectRes = null;
        this.parameters = {};
        this.passes = [];
        this.samplerOverrides = [];
    }

    /**
     * Initializes the Tw2Effect
     * @prototype
     */
    Tw2Effect.prototype.Initialize = function()
    {
        if (this.effectFilePath != '')
        {
            var path = this.effectFilePath;
            var dot = path.lastIndexOf('.');
            var ext = path.substr(dot);
            path = path.toLowerCase().substr(0, dot).replace("/effect/", device.effectDir) + ".sm_" + device.shaderModel;
            this.effectRes = resMan.GetResource(path);
            this.effectRes.RegisterNotification(this);
        }
    };

    /**
     * Gets all effect res objects
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2EffectRes|Tw2TextureRes>} [out]
     */
    Tw2Effect.prototype.GetResources = function(out)
    {
        if (out === undefined)
        {
            out = [];
        }

        if (this.effectRes !== null)
        {
            if (out.indexOf(this.effectRes) === -1)
            {
                out.push(this.effectRes);
            }
        }

        for (var param in this.parameters)
        {
            if (this.parameters.hasOwnProperty(param))
            {
                if (this.parameters[param] instanceof Tw2TextureParameter)
                {
                    this.parameters[param].GetResource(out);
                }
            }
        }

        return out;
    }

    /**
     * Returns the Tw2Effect's resource object
     * @prototype
     */
    Tw2Effect.prototype.GetEffectRes = function()
    {
        return this.effectRes;
    };

    /**
     * Rebuilds Cached Data
     * @param resource
     * @prototype
     */
    Tw2Effect.prototype.RebuildCachedData = function(resource)
    {
        if (resource.IsGood())
        {
            this.BindParameters();
        }
    };

    /**
     * BindParameters
     * @returns {boolean}
     * @prototype
     */
    Tw2Effect.prototype.BindParameters = function()
    {
        if (this.effectRes == null || !this.effectRes.IsGood())
        {
            return false;
        }

        for (var i = 0; i < this.passes.length; ++i)
        {
            for (var j = 0; j < this.passes[i].stages.length; ++j)
            {
                for (var k = 0; k < this.passes[i].stages[j].reroutedParameters.length; ++k)
                {
                    this.passes[i].stages[j].reroutedParameters[k].Unbind();
                }
            }
        }
        this.passes = [];
        for (var i = 0; i < this.effectRes.passes.length; ++i)
        {
            var pass = [];
            pass.stages = [];
            for (var j = 0; j < this.effectRes.passes[i].stages.length; ++j)
            {
                var stageRes = this.effectRes.passes[i].stages[j];
                var stage = {};
                stage.constantBuffer = new Float32Array(stageRes.constantSize);
                stage.reroutedParameters = [];
                stage.parameters = [];
                stage.textures = [];
                stage.constantBuffer.set(stageRes.constantValues);

                for (var k = 0; k < stageRes.constants.length; ++k)
                {
                    var constant = stageRes.constants[k];
                    var name = constant.name;
                    if (name == 'PerFrameVS' ||
                        name == 'PerObjectVS' ||
                        name == 'PerFramePS' ||
                        name == 'PerObjectPS' ||
                        name == 'PerObjectPSInt')
                    {
                        continue;
                    }
                    if (name in this.parameters)
                    {
                        var param = this.parameters[name];
                        if (param.Bind(stage.constantBuffer, constant.offset, constant.size))
                        {
                            stage.reroutedParameters.push(param);
                        }
                        else
                        {
                            var p = {};
                            p.parameter = param;
                            p.constantBuffer = stage.constantBuffer;
                            p.offset = constant.offset;
                            p.size = constant.size;
                            stage.parameters.push(p);
                        }
                    }
                    else if (name in variableStore._variables)
                    {
                        var param = variableStore._variables[name];
                        var p = {};
                        p.parameter = param;
                        p.constantBuffer = stage.constantBuffer;
                        p.offset = constant.offset;
                        p.size = constant.size;
                        stage.parameters.push(p);
                    }
                    else if (constant.isAutoregister)
                    {
                        variableStore.RegisterType(name, constant.type);
                        var param = variableStore._variables[name];
                        var p = {};
                        p.parameter = param;
                        p.constantBuffer = stage.constantBuffer;
                        p.offset = constant.offset;
                        p.size = constant.size;
                        stage.parameters.push(p);
                    }
                }

                for (var k = 0; k < stageRes.textures.length; ++k)
                {
                    var name = stageRes.textures[k].name;
                    var param = null;
                    if (name in this.parameters)
                    {
                        param = this.parameters[name];
                    }
                    else if (name in variableStore._variables)
                    {
                        param = variableStore._variables[name];
                    }
                    else if (stageRes.textures[k].isAutoregister)
                    {
                        variableStore.RegisterType(name, Tw2TextureParameter);
                        param = variableStore._variables[name];
                    }
                    else
                    {
                        continue;
                    }
                    var p = {};
                    p.parameter = param;
                    p.slot = stageRes.textures[k].registerIndex;
                    p.sampler = null;
                    for (var n = 0; n < stageRes.samplers.length; ++n)
                    {
                        if (stageRes.samplers[n].registerIndex == p.slot)
                        {
                            if (stageRes.samplers[n].name in this.samplerOverrides)
                            {
                                p.sampler = this.samplerOverrides[stageRes.samplers[n].name].GetSampler(stageRes.samplers[n]);
                            }
                            else
                            {
                                p.sampler = stageRes.samplers[n];
                            }
                            break;
                        }
                    }
                    if (j == 0)
                    {
                        p.slot += 12;
                    }
                    stage.textures.push(p);
                }
                pass.stages.push(stage);
            }
            this.passes.push(pass);
        }
        if (device.effectObserver)
        {
            device.effectObserver.OnEffectChanged(this);
        }
        return true;
    };

    /**
     * ApplyPass
     * @param pass
     * @prototype
     */
    Tw2Effect.prototype.ApplyPass = function(pass)
    {
        if (this.effectRes == null || !this.effectRes.IsGood() || pass >= this.passes.length)
        {
            return;
        }

        this.effectRes.ApplyPass(pass);
        var p = this.passes[pass];
        var rp = this.effectRes.passes[pass];
        var d = device;
        if (d.IsAlphaTestEnabled() && rp.shadowShaderProgram)
        {
            var program = rp.shadowShaderProgram;
        }
        else
        {
            var program = rp.shaderProgram;
        }
        for (var i = 0; i < 2; ++i)
        {
            var stages = p.stages[i];
            for (var j = 0; j < stages.parameters.length; ++j)
            {
                var pp = stages.parameters[j];
                pp.parameter.Apply(pp.constantBuffer, pp.offset, pp.size);
            }
            for (var j = 0; j < stages.textures.length; ++j)
            {
                var tex = stages.textures[j];
                tex.parameter.Apply(tex.slot, tex.sampler, program.volumeSlices[tex.sampler.registerIndex]);
            }
        }
        if (program.constantBufferHandles[0] != null)
        {
            d.gl.uniform4fv(program.constantBufferHandles[0], p.stages[0].constantBuffer);
        }
        if (program.constantBufferHandles[7] != null)
        {
            d.gl.uniform4fv(program.constantBufferHandles[7], p.stages[1].constantBuffer);
        }
        if (device.perFrameVSData && program.constantBufferHandles[1])
        {
            d.gl.uniform4fv(program.constantBufferHandles[1], d.perFrameVSData.data);
        }
        if (device.perFramePSData && program.constantBufferHandles[2])
        {
            d.gl.uniform4fv(program.constantBufferHandles[2], d.perFramePSData.data);
        }
        if (d.perObjectData)
        {
            d.perObjectData.SetPerObjectDataToDevice(program.constantBufferHandles);
        }
    };

    /**
     * GetPassCount
     * @returns {number}
     * @prototype
     */
    Tw2Effect.prototype.GetPassCount = function()
    {
        if (this.effectRes == null || !this.effectRes.IsGood())
        {
            return 0;
        }
        return this.passes.length;
    };

    /**
     * GetPassInput
     * @param {number} pass
     * @returns {*}
     * @prototype
     */
    Tw2Effect.prototype.GetPassInput = function(pass)
    {
        if (this.effectRes == null || !this.effectRes.IsGood() || pass >= this.passes.length)
        {
            return null;
        }
        if (device.IsAlphaTestEnabled() && this.effectRes.passes[pass].shadowShaderProgram)
        {
            return this.effectRes.passes[pass].shadowShaderProgram.input;
        }
        else
        {
            return this.effectRes.passes[pass].shaderProgram.input;
        }
    };

    /**
     * Render
     * @param {function} cb - callback
     * @prototype
     */
    Tw2Effect.prototype.Render = function(cb)
    {
        var count = this.GetPassCount();
        for (var i = 0; i < count; ++i)
        {
            this.ApplyPass(i);
            cb(this, i);
        }
    };


    /**
     * Gets an object containing the textures currently set in the Tw2Effect
     * - Matches sof texture objects
     * @returns {Object.<string, Tw2TextureParameter>}
     * @prototype
     */
    Tw2Effect.prototype.GetTextures = function()
    {
        var textures = {};

        for (var param in this.parameters)
        {
            if (this.parameters.hasOwnProperty(param) && this.parameters[param] instanceof Tw2TextureParameter)
            {
                textures[param] = this.parameters[param].resourcePath;
            }
        }

        return textures;
    };

    /**
     * Gets an object containing all non texture parameters currently set in the Tw2Effect
     * - Matches sof parameter object
     * @returns {Object.<string, Tw2FloatParameter|Tw2Vector2Parameter|Tw2Vector3Parameter|Tw2Vector4Parameter|Tw2VariableParameter>}
     * @prototype
     */
    Tw2Effect.prototype.GetParameters = function()
    {
        var parameters = {};

        for (var param in this.parameters)
        {
            if (this.parameters.hasOwnProperty(param) && !(this.parameters[param] instanceof Tw2TextureParameter))
            {
                if (!(this.parameters[param] instanceof Tw2VariableParameter))
                {
                    parameters[param] = this.parameters[param].GetValue();
                }
                else
                {
                    parameters[param] = this.parameters[param].variableName;
                }
            }
        }

        return parameters;
    };

    /**
     * Tw2MeshArea
     * @property {string} name
     * @property {Tw2Effect} effect
     * @property {number} meshIndex
     * @property {number} index
     * @property {number} count
     * @property {boolean} display
     * @constructor
     */
    function Tw2MeshArea()
    {
        this.name = '';
        this.effect = null;
        this.meshIndex = 0;
        this.index = 0;
        this.count = 1;
        this.display = true;
    }

    /**
     * Render Batch Constructor
     * @type {RenderBatch}
     * @prototype
     */
    Tw2MeshArea.batchType = Tw2GeometryBatch;


    /**
     * Tw2MeshLineArea
     * @property {string} name
     * @property {Tw2Effect} effect
     * @property {number} meshIndex
     * @property {number} index
     * @property {number} count
     * @property {Boolean} display
     * @constructor
     */
    function Tw2MeshLineArea()
    {
        this.name = '';
        this.effect = null;
        this.meshIndex = 0;
        this.index = 0;
        this.count = 1;
        this.display = true;
    }

    /**
     * Render Batch Constructor
     * @type {RenderBatch}
     * @prototype
     */
    Tw2MeshLineArea.batchType = Tw2GeometryLineBatch;


    /**
     * Tw2Mesh
     * @property {string} name
     * @property {number} meshIndex
     * @property {string} geometryResPath
     * @property {string} lowDetailGeometryResPath
     * @property {Tw2GeometryRes} geometryResource
     * @property {Array.<Tw2MeshArea>} opaqueAreas
     * @property {Array.<Tw2MeshArea>} transparentAreas
     * @property {Array.<Tw2MeshArea>} additiveAreas
     * @property {Array.<Tw2MeshArea>} pickableAreas
     * @property {Array.<Tw2MeshArea>} decalAreas
     * @property {Array.<Tw2MeshArea>} depthAreas
     * @property {boolean} display - enables/disables all render batch accumulations
     * @property {boolean} displayOpaque - enables/disables opaque area batch accumulations
     * @property {boolean} displayTransparent - enables/disables transparent area batch accumulations
     * @property {boolean} displayAdditive - enables/disables additive area batch accumulations
     * @property {boolean} displayPickable - enables/disables pickable area batch accumulations
     * @property {boolean} displayDecal - enables/disables decal area batch accumulations
     * @constructor
     */
    function Tw2Mesh()
    {
        this.name = '';
        this.meshIndex = 0;
        this.geometryResPath = '';
        this.lowDetailGeometryResPath = '';
        this.geometryResource = null;

        this.opaqueAreas = [];
        this.transparentAreas = [];
        this.additiveAreas = [];
        this.pickableAreas = [];
        this.decalAreas = [];
        this.depthAreas = [];

        this.display = true;
        this.displayOpaque = true;
        this.displayTransparent = true;
        this.displayAdditive = true;
        this.displayPickable = true;
        this.displayDecal = true;
    }

    /**
     * Initializes the Tw2Mesh
     * @prototype
     */
    Tw2Mesh.prototype.Initialize = function()
    {
        if (this.geometryResPath != '')
        {
            this.geometryResource = resMan.GetResource(this.geometryResPath);
        }
    };

    /**
     * Gets Mesh res Objects
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2EffectRes|Tw2TextureRes|Tw2GeometryRes>} [out]
     */
    Tw2Mesh.prototype.GetResources = function(out)
    {
        if (out === undefined)
        {
            out = [];
        }

        var self = this;

        if (out.indexOf(this.geometryResource) === -1)
        {
            out.push(this.geometryResource);
        }

        function getAreaResources(areaName, out)
        {
            for (var i = 0; i < self[areaName].length; i++)
            {
                self[areaName][i].effect.GetResources(out);
            }
        }

        getAreaResources('additiveAreas', out);
        getAreaResources('decalAreas', out);
        getAreaResources('depthAreas', out);
        getAreaResources('opaqueAreas', out);
        getAreaResources('pickableAreas', out);
        getAreaResources('transparentAreas', out);
        return out;
    }

    /**
     * Gets render batches from a mesh area array and commits them to an accumulator
     * @param {Array.<Tw2MeshArea>} areas
     * @param {RenderMode} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @private
     */
    Tw2Mesh.prototype._GetAreaBatches = function(areas, mode, accumulator, perObjectData)
    {
        for (var i = 0; i < areas.length; ++i)
        {
            var area = areas[i];
            if (area.effect == null || !area.display)
            {
                continue;
            }
            var batch = new area.constructor.batchType();
            batch.renderMode = mode;
            batch.perObjectData = perObjectData;
            batch.geometryRes = this.geometryResource;
            batch.meshIx = this.meshIndex;
            batch.start = area.index;
            batch.count = area.count;
            batch.effect = area.effect;
            accumulator.Commit(batch);
        }
    };

    /**
     * Gets render batches
     * @param {RenderMode} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @returns {boolean}
     * @prototype
     */
    Tw2Mesh.prototype.GetBatches = function(mode, accumulator, perObjectData)
    {
        if (this.geometryResource == null)
        {
            return false;
        }

        if (this.display)
        {

            if (this.displayOpaque && mode == device.RM_OPAQUE)
            {
                this._GetAreaBatches(this.opaqueAreas, mode, accumulator, perObjectData);
            }
            else if (this.displayDecal && mode == device.RM_DECAL)
            {
                this._GetAreaBatches(this.decalAreas, mode, accumulator, perObjectData);
            }
            else if (this.displayTransparent && mode == device.RM_TRANSPARENT)
            {
                this._GetAreaBatches(this.transparentAreas, mode, accumulator, perObjectData);
            }
            else if (this.displayAdditive && mode == device.RM_ADDITIVE)
            {
                this._GetAreaBatches(this.additiveAreas, mode, accumulator, perObjectData);
            }
            else if (this.displayPickable && mode == device.RM_PICKABLE)
            {
                this._GetAreaBatches(this.pickableAreas, mode, accumulator, perObjectData);
            }
        }

        return true;
    };

    /**
     * Tw2Track
     * @property {Tw2GeometryTransformTrack} trackRes
     * @property {Tw2Bone} bone
     * @constructor
     */
    function Tw2Track()
    {
        this.trackRes = null;
        this.bone = null;
    }


    /**
     * Tw2TrackGroup
     * @property {Tw2GeometryTrackGroup} trackGroupRes
     * @property {Tw2GeometryModel} model
     * @property {Array.<Tw2GeometryTransformTrack>} transformTracks
     * @constructor
     */
    function Tw2TrackGroup()
    {
        this.trackGroupRes = null;
        this.model = null;
        this.transformTracks = [];
    }


    /**
     * Tw2Animation
     * @property {Tw2GeometryAnimation} animationRes
     * @property {number} time
     * @property {number} timeScale
     * @property {boolean} cycle
     * @property {boolean} isPlaying
     * @property {Function} callback - Stores optional callback passed to prototypes
     * @property {Array} trackGroups - Array of {@link Tw2TrackGroup}
     * @constructor
     */
    function Tw2Animation()
    {
        this.animationRes = null;
        this.time = 0;
        this.timeScale = 1.0;
        this.cycle = false;
        this.isPlaying = false;
        this.callback = null;
        this.trackGroups = [];
    }

    /**
     * Checks to see if the animation has finished playing
     * @return {boolean}
     * @prototype
     */
    Tw2Animation.prototype.IsFinished = function()
    {
        return !this.cycle && this.time >= this.duration;
    };


    /**
     * Tw2Bone
     * @property {Tw2GeometryBone} boneRes
     * @property {mat4} localTransform
     * @property {mat4} worldTransform
     * @property {mat4} offsetTransform
     * @constructor
     */
    function Tw2Bone()
    {
        this.boneRes = null;
        this.localTransform = mat4.create();
        this.worldTransform = mat4.create();
        this.offsetTransform = mat4.create();
    }


    /**
     * Tw2Model
     * @property {Tw2GeometryModel} modelRes
     * @property {Array.<Tw2Bone>} bones
     * @property {Object.<string, Tw2Bone>} bonesByName - An object containing every Tw2Bone name and it's object
     * @constructor
     */
    function Tw2Model()
    {
        this.modelRes = null;
        this.bones = [];
        this.bonesByName = {};
    }


    /**
     * Tw2AnimationController
     * @param {Tw2GeometryRes} geometryResource
     * @property {Array.<Tw2GeometryRes>} geometryResources
     * @property {Array.<Tw2Model>} models
     * @property {Array.<Tw2Animation>} animations
     * @property {Array} meshBindings
     * @property {boolean} loaded
     * @property {boolean} update
     * @property {mat4} _tempMat4
     * @property {mat3} _tempMat3
     * @property {quat4} _tempQuat4
     * @property {vec3} _tempVec3
     * @property _geometryResource
     * @property {Array} pendingCommands
     * @prototype
     */
    function Tw2AnimationController(geometryResource)
    {
        this.geometryResources = [];
        this.models = [];
        this.animations = [];
        this.meshBindings = [];
        this.loaded = false;
        this.update = true;
        this._tempMat4 = mat4.create();
        this._tempMat3 = mat3.create();
        this._tempQuat4 = quat4.create();
        this._tempVec3 = vec3.create();
        this._geometryResource = null;
        this.pendingCommands = [];

        if (typeof(geometryResource) != 'undefined')
        {
            this.SetGeometryResource(geometryResource);
        }
    }

    /**
     * Gets all animation controller res objects
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2EffectRes|Tw2TextureRes|Tw2GeometryRes>} [out]
     */

    Tw2AnimationController.prototype.GetResources = function(out)
    {
        if (out === undefined)
        {
            out = [];
        }

        for (var i = 0; i < this.geometryResources.length; i++)
        {
            if (out.indexOf(this.geometryResources[i]) === -1)
            {
                out.push(this.geometryResources[i]);
            }
        }
        return out;
    }

    /**
     * Clears any existing resources and loads the supplied geometry resource
     * @param {Tw2GeometryRes} geometryResource
     * @prototype
     */
    Tw2AnimationController.prototype.SetGeometryResource = function(geometryResource)
    {
        this.models = [];
        this.animations = [];
        this.meshBindings = [];

        for (var i = 0; i < this.geometryResources.length; ++i)
        {
            this.geometryResources[i].UnregisterNotification(this);
        }

        this.loaded = false;
        this.geometryResources = [];

        if (geometryResource)
        {
            this.geometryResources.push(geometryResource);
            geometryResource.RegisterNotification(this);
        }
    };

    /**
     * Adds a Geometry Resource
     * @param {Tw2GeometryRes} geometryResource
     * @prototype
     */
    Tw2AnimationController.prototype.AddGeometryResource = function(geometryResource)
    {
        for (var i = 0; i < this.geometryResources.length; ++i)
        {
            if (this.geometryResources[i] == geometryResource)
            {
                return;
            }
        }
        this.geometryResources.push(geometryResource);
        geometryResource.RegisterNotification(this);
    };

    /**
     * Adds animations from a resource
     * @param {Tw2GeometryRes} resource
     * @prototype
     */
    Tw2AnimationController.prototype.AddAnimationsFromRes = function(resource)
    {
        for (var i = 0; i < resource.animations.length; ++i)
        {
            var animation = null;
            for (var j = 0; j < this.animations.length; ++j)
            {
                if (this.animations[j].animationRes == resource.animations[i])
                {
                    animation = this.animations[i];

                    break;
                }
            }
            if (!animation)
            {
                animation = new Tw2Animation();
                animation.animationRes = resource.animations[i];
                this.animations.push(animation);
            }
            for (var j = 0; j < animation.animationRes.trackGroups.length; ++j)
            {
                var found = false;
                for (var k = 0; k < animation.trackGroups.length; ++k)
                {
                    if (animation.trackGroups[k].trackGroupRes == animation.animationRes.trackGroups[j])
                    {
                        found = true;
                        break;
                    }
                }
                if (found)
                {
                    continue;
                }
                var model = null;
                for (var k = 0; k < this.models.length; ++k)
                {
                    if (this.models[k].modelRes.name == animation.animationRes.trackGroups[j].name)
                    {
                        model = this.models[k];
                        break;
                    }
                }
                if (model != null)
                {
                    var group = new Tw2TrackGroup();
                    group.trackGroupRes = animation.animationRes.trackGroups[j];
                    for (var k = 0; k < group.trackGroupRes.transformTracks.length; ++k)
                    {
                        for (var m = 0; m < model.bones.length; ++m)
                        {
                            if (model.bones[m].boneRes.name == group.trackGroupRes.transformTracks[k].name)
                            {
                                var track = new Tw2Track();
                                track.trackRes = group.trackGroupRes.transformTracks[k];
                                track.bone = model.bones[m];
                                group.transformTracks.push(track);
                                break;
                            }
                        }
                    }
                    animation.trackGroups.push(group);
                }
            }
        }
    };

    /**
     * Adds a model resource
     * @param {Tw2GeometryModel} modelRes
     * @returns {null|Tw2Model} Returns a newly created Tw2Model if the model resource doesn't already exist, and null if it does
     * @private
     */
    Tw2AnimationController.prototype._AddModel = function(modelRes)
    {
        for (var i = 0; i < this.models.length; ++i)
        {
            if (this.models[i].modelRes.name == modelRes.name)
            {
                return null;
            }
        }
        var model = new Tw2Model();
        model.modelRes = modelRes;
        var skeleton = modelRes.skeleton;
        if (skeleton != null)
        {
            for (var j = 0; j < skeleton.bones.length; ++j)
            {
                var bone = new Tw2Bone();
                bone.boneRes = skeleton.bones[j];
                model.bones.push(bone);
                model.bonesByName[bone.boneRes.name] = bone;
            }
        }
        this.models.push(model);
        return model;
    };

    /**
     * Finds a mesh binding for a supplied resource
     * @param {Tw2GeometryRes} resource
     * @returns {Object|null} Returns the mesh binding of a resource if it exists, null if it doesn't
     * @private
     */
    Tw2AnimationController.prototype._FindMeshBindings = function(resource)
    {
        for (var i = 0; i < this.meshBindings.length; ++i)
        {
            if (this.meshBindings[i].resource == resource)
            {
                return this.meshBindings[i];
            }
        }
        return null;
    };

    /**
     * Rebuilds the cached data for a resource (unless it doesn't exist or is already good)
     * @param {Tw2GeometryRes} resource
     * @prototype
     */
    Tw2AnimationController.prototype.RebuildCachedData = function(resource)
    {
        var found = false;
        for (var i = 0; i < this.geometryResources.length; ++i)
        {
            if (this.geometryResources[i] == resource)
            {
                found = true;
                break;
            }
        }
        if (!found)
        {
            return;
        }
        for (var i = 0; i < this.geometryResources.length; ++i)
        {
            if (!this.geometryResources[i].IsGood())
            {
                return;
            }
        }
        for (var i = 0; i < this.geometryResources.length; ++i)
        {
            this._DoRebuildCachedData(this.geometryResources[i]);
        }
    };

    /**
     * _DoRebuildCachedData
     * TODO: Too many arguments supplied to this.AddAnimationsFromRes prototype
     * @param {Tw2GeometryRes} resource
     * @private
     */
    Tw2AnimationController.prototype._DoRebuildCachedData = function(resource)
    {
        var newModels = [];
        if (resource.meshes.length)
        {
            for (var i = 0; i < resource.models.length; ++i)
            {
                var model = this._AddModel(resource.models[i]);
                if (model)
                {
                    newModels.push(model);
                }
            }
        }
        for (var i = 0; i < this.geometryResources.length; ++i)
        {
            this.AddAnimationsFromRes(this.geometryResources[i], this.models);
        }

        if (resource.models.length == 0)
        {
            for (var i = 0; i < resource.meshes.length; ++i)
            {
                Tw2GeometryRes.BindMeshToModel(resource.meshes[i], this.geometryResources[0].models[0]);
            }
            resource.models.push(this.geometryResources[0].models[0]);
        }
        for (var i = 0; i < resource.models.length; ++i)
        {
            var model = null;
            for (var j = 0; j < this.models.length; ++j)
            {
                if (this.models[j].modelRes.name == resource.models[i].name)
                {
                    model = this.models[j];
                    break;
                }
            }
            if (model == null)
            {
                continue;
            }
            for (var j = 0; j < resource.models[i].meshBindings.length; ++j)
            {
                var meshIx = resource.meshes.indexOf(resource.models[i].meshBindings[j].mesh);
                var meshBindings = this._FindMeshBindings(resource);
                if (meshBindings == null)
                {
                    meshBindings = [];
                    meshBindings.resource = resource;
                    this.meshBindings.push(meshBindings);
                }
                meshBindings[meshIx] = new glMatrixArrayType(resource.models[i].meshBindings[j].bones.length * 12);
                for (var k = 0; k < resource.models[i].meshBindings[j].bones.length; ++k)
                {
                    for (var n = 0; n < model.bones.length; ++n)
                    {
                        if (model.bones[n].boneRes.name == resource.models[i].meshBindings[j].bones[k].name)
                        {
                            if (!model.bones[n].bindingArrays)
                            {
                                model.bones[n].bindingArrays = [];
                            }
                            var arrayInfo = {
                                'array': meshBindings[meshIx],
                                'offset': k * 12
                            };
                            model.bones[n].bindingArrays[model.bones[n].bindingArrays.length] = arrayInfo;
                            //meshBindings[meshIx][k] = model.bones[n].offsetTransform;
                            break;
                        }
                    }
                }
            }
        }
        if (resource.meshes.length && resource.models.length)
        {
            this.ResetBoneTransforms(resource.models);
        }
        this.loaded = true;
        if (this.animations.length)
        {
            if (this.pendingCommands.length)
            {
                for (var i = 0; i < this.pendingCommands.length; ++i)
                {
                    if (!this.pendingCommands[i].args)
                    {
                        this.pendingCommands[i].func.apply(this);
                    }
                    else
                    {
                        this.pendingCommands[i].func.apply(this, this.pendingCommands[i].args);
                    }
                }
            }
            this.pendingCommands = [];
        }
    };

    /**
     * Gets a loaded Tw2Animation by it's name
     * @param name
     * @returns {null|Tw2Animation} Returns the animation if found
     * @constructor
     */
    Tw2AnimationController.prototype.GetAnimation = function(name)
    {
        for (var i = 0; i < this.animations.length; i++)
        {
            if (this.animations[i].animationRes.name == name)
            {
                return this.animations[i];
            }
        }

        return null;
    };

    /**
     * Resets a Tw2Animation by it's name
     * @param {String} name
     * @return {boolean}
     * @constructor
     */
    Tw2AnimationController.prototype.ResetAnimation = function(name)
    {
        var animation = this.GetAnimation(name);
        if (animation)
        {
            animation.time = 0;
            animation.isPlaying = false;
            animation.callback = null;
            return true;
        }
    };

    /**
     * Plays a specific animation by it's name
     * @param {string} name - Animation's Name
     * @param {boolean} [cycle]
     * @param {Function} [callback] - Optional callback which is fired once the animation has completed
     * @return {boolean}
     * @prototype
     */
    Tw2AnimationController.prototype.PlayAnimation = function(name, cycle, callback)
    {
        if (this.animations.length == 0)
        {
            this.pendingCommands.push(
            {
                'func': this.PlayAnimation,
                'args': [name, cycle, callback]
            });
            return true;
        }

        var animation = this.GetAnimation(name);

        if (animation)
        {
            animation.time = 0;
            animation.isPlaying = true;
            if (typeof(cycle) != 'undefined')
            {
                animation.cycle = cycle;
            }
            if (typeof(callback) != 'undefined')
            {
                animation.callback = callback;
            }
            return true;
        }
    };

    /**
     * Plays a specific animation from a specific time
     * @param {string} name - Animation's Name
     * @param {number} from - Time to play from
     * @param {boolean} [cycle]
     * @param {Function} [callback] - Optional callback which is fired once the animation has completed
     * @returns {boolean}
     * @prototype
     */
    Tw2AnimationController.prototype.PlayAnimationFrom = function(name, from, cycle, callback)
    {
        if (this.animations.length == 0)
        {
            this.pendingCommands.push(
            {
                'func': this.PlayAnimationFrom,
                'args': [name, from, cycle, callback]
            });
            return true;
        }

        var animation = this.GetAnimation(name);

        if (animation)
        {
            from = (from <= animation.animationRes.duration) ? from : animation.animationRes.duration;
            animation.time = (from < 0) ? 0 : from;
            animation.isPlaying = true;
            if (typeof(cycle) != 'undefined')
            {
                animation.cycle = cycle;
            }
            if (typeof(callback) != 'undefined')
            {
                animation.callback = callback;
            }

            return true;
        }
    };

    /**
     * Gets an array of all the currently playing animations by name
     * @returns {Array}
     * @constructor
     */
    Tw2AnimationController.prototype.GetPlayingAnimations = function()
    {
        var result = [];

        for (var i = 0; i < this.animations.length; i++)
        {
            if (this.animations[i].isPlaying)
            {
                result.push(this.animations[i].animationRes.name)
            }
        }

        return result;
    };

    /**
     * Stops an animation or an array of animations from playing
     * @param {String| Array.<string>} names - Animation Name, or Array of Animation Names
     * @prototype
     */
    Tw2AnimationController.prototype.StopAnimation = function(names)
    {
        if (this.animations.length == 0)
        {
            this.pendingCommands.push(
            {
                'func': this.StopAnimation,
                'args': names
            });
            return;
        }

        if (typeof names == 'string' || names instanceof String)
        {
            names = [names];
        }

        var toStop = {};

        for (var n = 0; n < names.length; n++)
        {
            toStop[names[n]] = true;
        }

        for (var i = 0; i < this.animations.length; ++i)
        {
            if (this.animations[i].animationRes.name in toStop)
            {
                this.animations[i].isPlaying = false;
            }
        }
    };

    /**
     * Stops all animations from playing
     * @prototype
     */
    Tw2AnimationController.prototype.StopAllAnimations = function()
    {
        if (this.animations.length == 0)
        {
            this.pendingCommands.push(
            {
                'func': this.StopAllAnimations,
                'args': null
            });
            return;
        }

        for (var i = 0; i < this.animations.length; ++i)
        {
            this.animations[i].isPlaying = false;
        }
    };

    /**
     * Stops all but the supplied list of animations
     * @param {String| Array.<string>} names - Animation Names
     * @prototype
     */
    Tw2AnimationController.prototype.StopAllAnimationsExcept = function(names)
    {
        if (this.animations.length == 0)
        {
            this.pendingCommands.push(
            {
                'func': this.StopAllAnimationsExcept,
                'args': names
            });
            return;
        }

        if (typeof names == 'string' || names instanceof String)
        {
            names = [names];
        }

        var keepAnimating = {};

        for (var n = 0; n < names.length; n++)
        {
            keepAnimating[names[n]] = true;
        }

        for (var i = 0; i < this.animations.length; ++i)
        {
            if (!(this.animations[i].animationRes.name in keepAnimating))
            {
                this.animations[i].isPlaying = false;
            }
        }
    };

    /**
     * Resets the bone transforms for the supplied models
     * @param {Array.<Tw2Model>} models
     * @prototype
     */
    Tw2AnimationController.prototype.ResetBoneTransforms = function(models)
    {
        for (var i = 0; i < this.models.length; ++i)
        {
            for (var j = 0; j < this.models[i].bones.length; ++j)
            {
                var bone = this.models[i].bones[j];
                var boneRes = bone.boneRes;
                mat4.set(boneRes.localTransform, bone.localTransform);
                if (boneRes.parentIndex != -1)
                {
                    mat4.multiply(bone.localTransform, this.models[i].bones[bone.boneRes.parentIndex].worldTransform, bone.worldTransform);
                }
                else
                {
                    mat4.set(bone.localTransform, bone.worldTransform);
                }
                mat4.identity(bone.offsetTransform);
            }
        }
        var id = mat4.identity(mat4.create());
        for (var i = 0; i < this.meshBindings.length; ++i)
        {
            for (var j = 0; j < this.meshBindings[i].length; ++j)
            {
                for (var k = 0; k * 16 < this.meshBindings[i][j].length; ++k)
                {
                    for (var m = 0; m < 16; ++m)
                    {
                        this.meshBindings[i][j][k * 16 + m] = id[m];
                    }
                }
            }
        }
    };

    /**
     * EvaluateCurve
     * @param {Tw2GeometryCurve} curve
     * @param {number} time
     * @param value
     * @param {boolean} cycle
     * @param {number} duration
     */
    Tw2AnimationController.EvaluateCurve = function(curve, time, value, cycle, duration)
    {
        var count = curve.knots.length;
        var knot = count - 1;
        var t = 0;
        for (var i = 0; i < curve.knots.length; ++i)
        {
            if (curve.knots[i] > time)
            {
                knot = i;
                break;
            }
        }

        if (curve.degree == 0)
        {
            for (var i = 0; i < curve.dimension; ++i)
            {
                value[i] = curve.controls[knot * curve.dimension + i];
            }
        }
        else if (curve.degree == 1)
        {
            var knot0 = cycle ? (knot + count - 1) % count : knot == 0 ? 0 : knot - 1;
            var dt = curve.knots[knot] - curve.knots[knot0];
            if (dt < 0)
            {
                dt += duration;
            }
            if (dt > 0)
            {
                t = (time - curve.knots[i - 1]) / dt;
            }
            for (var i = 0; i < curve.dimension; ++i)
            {
                value[i] = curve.controls[knot0 * curve.dimension + i] * (1 - t) + curve.controls[knot * curve.dimension + i] * t;
            }
        }
        else
        {
            var k_2 = cycle ? (knot + count - 2) % count : knot == 0 ? 0 : knot - 2;
            var k_1 = cycle ? (knot + count - 1) % count : knot == 0 ? 0 : knot - 1;

            var p1 = (k_2) * curve.dimension;
            var p2 = (k_1) * curve.dimension;
            var p3 = knot * curve.dimension;

            var ti_2 = curve.knots[k_2];
            var ti_1 = curve.knots[k_1];
            var ti = curve.knots[knot];
            var ti1 = curve.knots[(knot + 1) % count];
            if (ti_2 > ti)
            {
                ti += duration;
                ti1 += duration;
                time += duration;
            }
            if (ti_1 > ti)
            {
                ti += duration;
                ti1 += duration;
                time += duration;
            }
            if (ti1 < ti)
            {
                ti1 += duration;
            }

            var tmti_1 = (time - ti_1);
            var tmti_2 = (time - ti_2);
            var dL0 = ti - ti_1;
            var dL1_1 = ti - ti_2;
            var dL1_2 = ti1 - ti_1;

            var L0 = tmti_1 / dL0;
            var L1_1 = tmti_2 / dL1_1;
            var L1_2 = tmti_1 / dL1_2;

            var ci_2 = (L1_1 + L0) - L0 * L1_1;
            var ci = L0 * L1_2;
            var ci_1 = ci_2 - ci;
            ci_2 = 1 - ci_2;

            for (var i = 0; i < curve.dimension; ++i)
            {
                value[i] = ci_2 * curve.controls[p1 + i] + ci_1 * curve.controls[p2 + i] + ci * curve.controls[p3 + i];
            }
        }
    };

    /**
     * Internal render/update function which is called every frame
     * TODO: Fix commented out code (line 718)
     * @param {number} dt - Delta Time
     * @prototype
     */
    Tw2AnimationController.prototype.Update = function(dt)
    {
        if (this.models == null || !this.update)
        {
            return;
        }

        for (var i = 0; i < this.geometryResources.length; ++i)
        {
            this.geometryResources[i].KeepAlive();
        }


        var tempMat = this._tempMat4;
        var updateBones = false;
        for (var i = 0; i < this.animations.length; ++i)
        {
            var animation = this.animations[i];
            if (animation.isPlaying)
            {
                var res = animation.animationRes;
                animation.time += dt * animation.timeScale;
                if (animation.time > res.duration)
                {
                    if (animation.callback != null)
                    {
                        animation.callback(this, animation);
                    }
                    if (animation.cycle)
                    {
                        animation.time = animation.time % res.duration;
                    }
                    else
                    {
                        animation.isPlaying = false;
                        animation.time = res.duration;
                    }
                }
                var orientation = this._tempQuat4;
                var scale = this._tempMat3;
                var position = this._tempVec3;
                for (var j = 0; j < animation.trackGroups.length; ++j)
                {
                    for (var k = 0; k < animation.trackGroups[j].transformTracks.length; ++k)
                    {
                        var track = animation.trackGroups[j].transformTracks[k];
                        if (track.trackRes.position)
                        {
                            Tw2AnimationController.EvaluateCurve(track.trackRes.position, animation.time, position, animation.cycle, res.duration);
                        }
                        else
                        {
                            position[0] = position[1] = position[2] = 0;
                        }
                        if (track.trackRes.orientation)
                        {
                            Tw2AnimationController.EvaluateCurve(track.trackRes.orientation, animation.time, orientation, animation.cycle, res.duration);
                            quat4.normalize(orientation);
                        }
                        else
                        {
                            orientation[0] = orientation[1] = orientation[2] = 0;
                            orientation[3] = 1;
                        }
                        if (track.trackRes.scaleShear)
                        {
                            Tw2AnimationController.EvaluateCurve(track.trackRes.scaleShear, animation.time, scale, animation.cycle, res.duration);
                        }
                        else
                        {
                            mat3.identity(scale);
                        }

                        mat3.toMat4(scale, track.bone.localTransform);
                        mat4.multiply(track.bone.localTransform, mat4.transpose(quat4.toMat4(orientation, tempMat)));
                        track.bone.localTransform[12] = position[0];
                        track.bone.localTransform[13] = position[1];
                        track.bone.localTransform[14] = position[2];
                        updateBones = true;
                    }
                }
            }
        }
        //if (updateBones)
        {
            for (var i = 0; i < this.models.length; ++i)
            {
                for (var j = 0; j < this.models[i].bones.length; ++j)
                {
                    var bone = this.models[i].bones[j];
                    if (bone.boneRes.parentIndex != -1)
                    {
                        mat4.multiply(this.models[i].bones[bone.boneRes.parentIndex].worldTransform, bone.localTransform, bone.worldTransform);
                    }
                    else
                    {
                        mat4.set(bone.localTransform, bone.worldTransform);
                    }
                    mat4.multiply(bone.worldTransform, bone.boneRes.worldTransformInv, bone.offsetTransform);
                    if (bone.bindingArrays)
                    {
                        for (var a = 0; a < bone.bindingArrays.length; ++a)
                        {
                            bone.bindingArrays[a].array[bone.bindingArrays[a].offset + 0] = bone.offsetTransform[0];
                            bone.bindingArrays[a].array[bone.bindingArrays[a].offset + 1] = bone.offsetTransform[4];
                            bone.bindingArrays[a].array[bone.bindingArrays[a].offset + 2] = bone.offsetTransform[8];
                            bone.bindingArrays[a].array[bone.bindingArrays[a].offset + 3] = bone.offsetTransform[12];

                            bone.bindingArrays[a].array[bone.bindingArrays[a].offset + 4] = bone.offsetTransform[1];
                            bone.bindingArrays[a].array[bone.bindingArrays[a].offset + 5] = bone.offsetTransform[5];
                            bone.bindingArrays[a].array[bone.bindingArrays[a].offset + 6] = bone.offsetTransform[9];
                            bone.bindingArrays[a].array[bone.bindingArrays[a].offset + 7] = bone.offsetTransform[13];

                            bone.bindingArrays[a].array[bone.bindingArrays[a].offset + 8] = bone.offsetTransform[2];
                            bone.bindingArrays[a].array[bone.bindingArrays[a].offset + 9] = bone.offsetTransform[6];
                            bone.bindingArrays[a].array[bone.bindingArrays[a].offset + 10] = bone.offsetTransform[10];
                            bone.bindingArrays[a].array[bone.bindingArrays[a].offset + 11] = bone.offsetTransform[14];
                        }
                    }
                }
            }
        }
    };

    /**
     * RenderDebugInfo
     * TODO: Fix commented out code (lines 767 - 770)
     * @param {function} debugHelper
     * @prototype
     */
    Tw2AnimationController.prototype.RenderDebugInfo = function(debugHelper)
    {
        /*for (var i = 0; i < this.geometryResources.length; ++i)
         {
         this.geometryResources[i].RenderDebugInfo(debugHelper);
         }*/
        for (var i = 0; i < this.models.length; ++i)
        {
            for (var j = 0; j < this.models[i].bones.length; ++j)
            {
                var b0 = this.models[i].bones[j];
                if (b0.boneRes.parentIndex >= 0)
                {
                    var b1 = this.models[i].bones[b0.boneRes.parentIndex];
                    debugHelper.AddLine([b0.worldTransform[12], b0.worldTransform[13], b0.worldTransform[14]], [b1.worldTransform[12], b1.worldTransform[13], b1.worldTransform[14]]);
                }
            }
        }
    };

    /**
     * GetBoneMatrices
     * @param {number} meshIndex
     * @param {Tw2GeometryRes} [geometryResource=this.geometryResources[0]]
     * @returns {Float32Array}
     * @prototype
     */
    Tw2AnimationController.prototype.GetBoneMatrices = function(meshIndex, geometryResource)
    {
        if (this.geometryResources.length == 0)
        {
            return new Float32Array();
        }

        if (typeof(geometryResource) == 'undefined')
        {
            geometryResource = this.geometryResources[0];
        }
        var meshBindings = this._FindMeshBindings(geometryResource);
        if (meshBindings && meshIndex < meshBindings.length)
        {
            return meshBindings[meshIndex];
        }
        return new Float32Array();
    };

    /**
     * FindModelForMesh
     * @param {number} meshIndex
     * @param {Tw2GeometryRes} [geometryResource=this.geometryResources[0]]
     * @returns {Tw2Model|null} Returns the Tw2Model for the mesh if found and is good, else returns null
     * @prototype
     */
    Tw2AnimationController.prototype.FindModelForMesh = function(meshIndex, geometryResource)
    {
        if (this.geometryResources.length == 0)
        {
            return null;
        }
        if (typeof(geometryResource) == 'undefined')
        {
            geometryResource = this.geometryResources[0];
        }
        if (!geometryResource.IsGood())
        {
            return null;
        }
        var mesh = geometryResource.meshes[meshIndex];
        for (var i = 0; i < this.models.length; ++i)
        {
            for (var j = 0; j < this.models[i].modelRes.meshBindings.length; ++i)
            {
                if (this.models[i].modelRes.meshBindings[j].mesh == mesh)
                {
                    return this.models[i];
                }
            }
        }
        return null;
    };

    /**
     * Tw2RenderTarget
     * @property {Tw2TextureRes} texture
     * @property {WebglFrameBuffer} _frameBuffer
     * @property {WebglRenderBuffer} _renderBuffer
     * @property {number} width - width of the resulting texture
     * @property {number} height - height of the resulting texture
     * @property {boolean} hasDepth - Controls whether depth is considered when creating the webgl buffers
     * @constructor
     */
    function Tw2RenderTarget()
    {
        this.texture = null;
        this._frameBuffer = null;
        this._renderBuffer = null;
        this.width = null;
        this.height = null;
        this.hasDepth = null;
    }

    /**
     * Destroys the render target's webgl buffers and textures
     * @prototype
     */
    Tw2RenderTarget.prototype.Destroy = function()
    {
        if (this.texture)
        {
            device.gl.deleteTexture(this.texture.texture);
            this.texture = null;
        }
        if (this._renderBuffer)
        {
            device.gl.deleteRenderbuffer(this._renderBuffer);
            this._renderBuffer = null;
        }
        if (this._frameBuffer)
        {
            device.gl.deleteFramebuffer(this._frameBuffer);
            this._frameBuffer = null;
        }
    };

    /**
     * Creates the render target
     * @param {number} width 
     * @param {number} height
     * @param {boolean} hasDepth
     * @prototype
     */
    Tw2RenderTarget.prototype.Create = function(width, height, hasDepth)
    {
        this.Destroy();
        this.texture = new Tw2TextureRes();
        this.texture.Attach(device.gl.createTexture());

        this._frameBuffer = device.gl.createFramebuffer();
        device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, this._frameBuffer);

        device.gl.bindTexture(device.gl.TEXTURE_2D, this.texture.texture);
        device.gl.texImage2D(device.gl.TEXTURE_2D, 0, device.gl.RGBA, width, height, 0, device.gl.RGBA, device.gl.UNSIGNED_BYTE, null);
        device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MAG_FILTER, device.gl.LINEAR);
        device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MIN_FILTER, device.gl.LINEAR);
        device.gl.bindTexture(device.gl.TEXTURE_2D, null);

        this._renderBuffer = null;
        if (hasDepth)
        {
            this._renderBuffer = device.gl.createRenderbuffer();
            device.gl.bindRenderbuffer(device.gl.RENDERBUFFER, this._renderBuffer);
            device.gl.renderbufferStorage(device.gl.RENDERBUFFER, device.gl.DEPTH_COMPONENT16, width, height);
        }

        device.gl.framebufferTexture2D(device.gl.FRAMEBUFFER, device.gl.COLOR_ATTACHMENT0, device.gl.TEXTURE_2D, this.texture.texture, 0);
        if (hasDepth)
        {
            device.gl.framebufferRenderbuffer(device.gl.FRAMEBUFFER, device.gl.DEPTH_ATTACHMENT, device.gl.RENDERBUFFER, this._renderBuffer);
        }
        device.gl.bindRenderbuffer(device.gl.RENDERBUFFER, null);
        device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, null);

        this.width = width;
        this.height = height;
        this.hasDepth = hasDepth;
    };

    /**
     * Sets the render target as the current frame buffer
     * @prototype
     */
    Tw2RenderTarget.prototype.Set = function()
    {
        device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, this._frameBuffer);
        device.gl.viewport(0, 0, this.width, this.height);
    };

    /**
     * Unsets the render target as the current frame buffer
     * @prototype
     */
    Tw2RenderTarget.prototype.Unset = function()
    {
        device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, null);
        device.gl.viewport(0, 0, device.viewportWidth, device.viewportHeight);
    };

    /**
     * Tw2CurveSet
     * @property {string} name
     * @property {Array.<Tw2Curve>} curves
     * @property {Array} bindings
     * @property {number} scale
     * @property {boolean} playOnLoad
     * @property {boolean} isPlaying
     * @property {number} scaledTime
     * @constructor
     */
    function Tw2CurveSet()
    {
        this.name = '';
        this.curves = [];
        this.bindings = [];
        this.scale = 1;
        this.playOnLoad = true;
        this.isPlaying = false;
        this.scaledTime = 0;
    }

    /**
     * Initializes the Tw2CurveSet
     * @prototype
     */
    Tw2CurveSet.prototype.Initialize = function()
    {
        if (this.playOnLoad)
        {
            this.Play();
        }
    };

    /**
     * Plays the Tw2CurveSet
     * @prototype
     */
    Tw2CurveSet.prototype.Play = function()
    {
        this.isPlaying = true;
        this.scaledTime = 0;
    };

    /**
     * Plays the Tw2CurveSet from a specific time
     * @param {number} time
     * @prototype
     */
    Tw2CurveSet.prototype.PlayFrom = function(time)
    {
        this.isPlaying = true;
        this.scaledTime = time;
    };

    /**
     * Stops the Tw2CurveSet from playing
     * @prototype
     */
    Tw2CurveSet.prototype.Stop = function()
    {
        this.isPlaying = false;
    };

    /**
     * Internal render/update function which is called every frame
     * @param {number} dt - Delta Time
     * @prototype
     */
    Tw2CurveSet.prototype.Update = function(dt)
    {
        if (this.isPlaying)
        {
            this.scaledTime += dt * this.scale;
            var scaledTime = this.scaledTime;
            var curves = this.curves;
            for (var i = 0; i < curves.length; ++i)
            {
                curves[i].UpdateValue(scaledTime);
            }
            var bindings = this.bindings;
            for (var b = 0; b < bindings.length; ++b)
            {
                bindings[b].CopyValue();
            }
        }
    };

    /**
     * Gets the maximum curve duration
     * @returns {number}
     * @prototype
     */
    Tw2CurveSet.prototype.GetMaxCurveDuration = function()
    {
        var length = 0;
        for (var i = 0; i < this.curves.length; ++i)
        {
            if ('GetLength' in this.curves[i])
            {
                length = Math.max(length, this.curves[i].GetLength());
            }
        }
        return length;
    };

    /**
     * Tw2ValueBinding
     * @property {string} name
     * @property {Object} sourceObject
     * @property {string} sourceAttribute
     * @property {number} _sourceElement
     * @property {boolean} sourceIsArray
     * @property {Object} destinationObject
     * @property {string} destinationAttribute
     * @property {number} _destinationElement
     * @property {boolean} destinationIsArray
     * @property {number} scale
     * @property {quat4} offset
     * @property {null|Function} _copyFunc - The function to use when updating destination attributes
     * @constructor
     */
    function Tw2ValueBinding()
    {
        this.name = '';
        this.sourceObject = null;
        this.sourceAttribute = '';
        this._sourceElement = null;
        this.sourceIsArray = null;

        this.destinationObject = null;
        this.destinationAttribute = '';
        this._destinationElement = null;
        this.destinationIsArray = null;

        this.scale = 1;
        this.offset = quat4.create();
        this._copyFunc = null;
    }

    /**
     * Initializes the Value Binding
     * @prototypes
     */
    Tw2ValueBinding.prototype.Initialize = function()
    {
        if (!this.sourceObject || this.sourceAttribute == '')
        {
            return;
        }
        if (!this.destinationObject || this.destinationAttribute == '')
        {
            return;
        }

        var srcSwizzled = false;
        var destSwizzled = false;
        var srcSwizzle = this.sourceAttribute.substr(-2);

        if (srcSwizzle == '.x' || srcSwizzle == '.r')
        {
            srcSwizzled = true;
            this._sourceElement = 0;
            this.sourceAttribute = this.sourceAttribute.substr(0, this.sourceAttribute.length - 2);
        }
        else if (srcSwizzle == '.y' || srcSwizzle == '.g')
        {
            srcSwizzled = true;
            this._sourceElement = 1;
            this.sourceAttribute = this.sourceAttribute.substr(0, this.sourceAttribute.length - 2);
        }
        else if (srcSwizzle == '.z' || srcSwizzle == '.b')
        {
            srcSwizzled = true;
            this._sourceElement = 2;
            this.sourceAttribute = this.sourceAttribute.substr(0, this.sourceAttribute.length - 2);
        }
        else if (srcSwizzle == '.w' || srcSwizzle == '.a')
        {
            srcSwizzled = true;
            this._sourceElement = 3;
            this.sourceAttribute = this.sourceAttribute.substr(0, this.sourceAttribute.length - 2);
        }
        else if (this.sourceObject.constructor == (new Tw2Vector4Parameter()).constructor)
        {
            if (this.sourceAttribute == 'v1')
            {
                srcSwizzled = true;
                this._sourceElement = 0;
                this.sourceAttribute = 'value';
            }
            else if (this.sourceAttribute == 'v2')
            {
                srcSwizzled = true;
                this._sourceElement = 1;
                this.sourceAttribute = 'value';
            }
            else if (this.sourceAttribute == 'v3')
            {
                srcSwizzled = true;
                this._sourceElement = 2;
                this.sourceAttribute = 'value';
            }
            else if (this.sourceAttribute == 'v4')
            {
                srcSwizzled = true;
                this._sourceElement = 3;
                this.sourceAttribute = 'value';
            }
        }

        var destSwizzle = this.destinationAttribute.substr(-2);
        if (destSwizzle == '.x' || destSwizzle == '.r')
        {
            destSwizzled = true;
            this._destinationElement = 0;
            this.destinationAttribute = this.destinationAttribute.substr(0, this.destinationAttribute.length - 2);
        }
        else if (destSwizzle == '.y' || destSwizzle == '.g')
        {
            destSwizzled = true;
            this._destinationElement = 1;
            this.destinationAttribute = this.destinationAttribute.substr(0, this.destinationAttribute.length - 2);
        }
        else if (destSwizzle == '.z' || destSwizzle == '.b')
        {
            destSwizzled = true;
            this._destinationElement = 2;
            this.destinationAttribute = this.destinationAttribute.substr(0, this.destinationAttribute.length - 2);
        }
        else if (destSwizzle == '.w' || destSwizzle == '.a')
        {
            destSwizzled = true;
            this._destinationElement = 3;
            this.destinationAttribute = this.destinationAttribute.substr(0, this.destinationAttribute.length - 2);
        }
        else if (this.destinationObject.constructor == (new Tw2Vector4Parameter()).constructor)
        {
            if (this.destinationAttribute == 'v1')
            {
                destSwizzled = true;
                this._destinationElement = 0;
                this.destinationAttribute = 'value';
            }
            else if (this.destinationAttribute == 'v2')
            {
                destSwizzled = true;
                this._destinationElement = 1;
                this.destinationAttribute = 'value';
            }
            else if (this.destinationAttribute == 'v3')
            {
                destSwizzled = true;
                this._destinationElement = 2;
                this.destinationAttribute = 'value';
            }
            else if (this.destinationAttribute == 'v4')
            {
                destSwizzled = true;
                this._destinationElement = 3;
                this.destinationAttribute = 'value';
            }
        }
        if (!(this.sourceAttribute in this.sourceObject) || !(this.destinationAttribute in this.destinationObject))
        {
            return;
        }

        this.sourceIsArray = (this.sourceObject[this.sourceAttribute].constructor == (new Float32Array()).constructor || this.sourceObject[this.sourceAttribute].constructor.name == "Array");
        this.destinationIsArray = (this.destinationObject[this.destinationAttribute].constructor == (new Float32Array()).constructor || this.destinationObject[this.destinationAttribute].constructor.name == "Array");

        if (this.sourceIsArray == this.destinationIsArray && typeof this.sourceObject[this.sourceAttribute] == typeof this.destinationObject[this.destinationAttribute])
        {
            if (this.sourceIsArray)
            {
                if (srcSwizzled)
                {
                    if (destSwizzled)
                    {
                        this._copyFunc = this._CopyElementToElement;
                    }
                    else
                    {
                        this._copyFunc = this._ReplicateElement;
                    }
                }
                else
                {
                    if (this.sourceObject[this.sourceAttribute].length <= this.destinationObject[this.destinationAttribute].length)
                    {
                        this._copyFunc = this._CopyArray;
                    }
                    else if (this.sourceObject[this.sourceAttribute].length == 16)
                    {
                        this._copyFunc = this._ExtractPos;
                    }
                    else
                    {
                        return;
                    }
                }
            }
            else
            {
                this._copyFunc = this._CopyValueToValue;
            }
        }
        else if (this.sourceIsArray && srcSwizzled && typeof this.destinationObject[this.destinationAttribute] == 'number')
        {
            this._copyFunc = this._CopyElementToValue;
        }
        else if (this.destinationIsArray && typeof this.sourceObject[this.sourceAttribute] == 'number')
        {
            if (destSwizzled)
            {
                this._copyFunc = this._CopyValueToElement;
            }
            else
            {
                this._copyFunc = this._ReplicateValue;
            }
        }
        else if (typeof this.sourceObject[this.sourceAttribute] == 'number' && typeof this.destinationObject[this.destinationAttribute] == 'boolean')
        {
            this._copyFunc = this._CopyFloatToBoolean;
        }
        else
        {
            return;
        }
    };

    /**
     * CopyValue
     * @prototype
     */
    Tw2ValueBinding.prototype.CopyValue = function()
    {
        if (this._copyFunc)
        {
            this._copyFunc.call(this);
            if ('OnValueChanged' in this.destinationObject)
            {
                this.destinationObject.OnValueChanged();
            }
        }
    };

    /**
     * _CopyValueToValue
     * @private
     */
    Tw2ValueBinding.prototype._CopyValueToValue = function()
    {
        this.destinationObject[this.destinationAttribute] = this.sourceObject[this.sourceAttribute] * this.scale + this.offset[0];
    };

    /**
     * _CopyArray
     * @private
     */
    Tw2ValueBinding.prototype._CopyArray = function()
    {
        var count = Math.min(this.destinationObject[this.destinationAttribute].length, this.sourceObject[this.sourceAttribute].length);
        for (var i = 0; i < count; ++i)
        {
            this.destinationObject[this.destinationAttribute][i] = this.sourceObject[this.sourceAttribute][i] * this.scale + this.offset[i];
        }
    };

    /**
     * _CopyElementToElement
     * @private
     */
    Tw2ValueBinding.prototype._CopyElementToElement = function()
    {
        this.destinationObject[this.destinationAttribute][this._destinationElement] = this.sourceObject[this.sourceAttribute][this._sourceElement] * this.scale + this.offset[0];
    };

    /**
     * _ReplicateValue
     * @private
     */
    Tw2ValueBinding.prototype._ReplicateValue = function()
    {
        for (var i = 0; i < this.destinationObject[this.destinationAttribute].length; ++i)
        {
            this.destinationObject[this.destinationAttribute][i] = this.sourceObject[this.sourceAttribute] * this.scale + this.offset[i];
        }
    };

    /**
     * _CopyArray
     * @private
     */
    Tw2ValueBinding.prototype._ReplicateElement = function()
    {
        for (var i = 0; i < this.destinationObject[this.destinationAttribute].length; ++i)
        {
            this.destinationObject[this.destinationAttribute][i] = this.sourceObject[this.sourceAttribute][this._sourceElement] * this.scale + this.offset[i];
        }
    };

    /**
     * _ExtractPos
     * @private
     */
    Tw2ValueBinding.prototype._ExtractPos = function()
    {
        for (var i = 0; i < this.destinationObject[this.destinationAttribute].length; ++i)
        {
            this.destinationObject[this.destinationAttribute][i] = this.sourceObject[this.sourceAttribute][i + 12] * this.scale + this.offset[i];
        }
    };

    /**
     * _CopyElementToValue
     * @private
     */
    Tw2ValueBinding.prototype._CopyElementToValue = function()
    {
        this.destinationObject[this.destinationAttribute] = this.sourceObject[this.sourceAttribute][this._sourceElement] * this.scale + this.offset[0];
    };

    /**
     * _CopyValueToElement
     * @private
     */
    Tw2ValueBinding.prototype._CopyValueToElement = function()
    {
        this.destinationObject[this.destinationAttribute][this._destinationElement] = this.sourceObject[this.sourceAttribute] * this.scale + this.offset[0];
    };

    /**
     * _CopyFloatToBoolean
     * @private
     */
    Tw2ValueBinding.prototype._CopyFloatToBoolean = function()
    {
        this.destinationObject[this.destinationAttribute] = this.sourceObject[this.sourceAttribute] != 0;
    };

    /**
     * Tw2Float
     * @property {number} value
     * @constructor
     */
    function Tw2Float()
    {
        this.value = 0;
    }

    /**
     * Tw2RuntimeInstanceData
     * @property {string} name
     * @property {number} count
     * @constructor
     */
    function Tw2RuntimeInstanceData()
    {
        this.name = '';
        this.count = 0;

        var declaration = null;
        var vb = null;
        var vertexStride = 0;
        var count = 0;
        var data = null;
        var dataDirty = true;

        /**
         * GetMaxInstanceCount
         * @returns {number}
         * @method
         */
        this.GetMaxInstanceCount = function()
        {
            return data ? data.length : 1;
        };

        /**
         * SetElementLayout
         * @param decl
         * @method
         */
        this.SetElementLayout = function(decl)
        {
            if (vb)
            {
                device.gl.deleteBuffer(vb);
                vb = null;
            }

            vertexStride = 0;
            declaration = new Tw2VertexDeclaration();

            for (var i = 0; i < decl.length; ++i)
            {
                var element = new Tw2ParticleElementDeclaration();
                element.elementType = decl[i][0];
                element.dimension = decl[i][2];
                element.usageIndex = decl[i][1];

                var d = element.GetDeclaration();
                d.offset = vertexStride * 4;
                declaration.elements.push(d);
                vertexStride += element.dimension;
            }

            declaration.RebuildHash();
        };

        /**
         * SetData
         * @param data_
         * @constructor
         */
        this.SetData = function(data_)
        {
            if (!declaration)
            {
                return;
            }
            data = data_;
            count = data.length;
            dataDirty = true;
            this.UpdateData();
        };

        /**
         * SetItemElement
         * @param index
         * @param elementIndex
         * @param value
         * @constructor
         */
        this.SetItemElement = function(index, elementIndex, value)
        {
            if (declaration.elements[elementIndex].elements > 1)
            {
                for (var i = 0; i < declaration.elements[elementIndex].elements; ++i)
                {
                    data[index][elementIndex][i] = value[i];
                }
            }
            else
            {
                data[index][elementIndex] = value;
            }

            dataDirty = true;
        };

        /**
         * SetItemElementRef
         * @param index
         * @param elementIndex
         * @param value
         * @constructor
         */
        this.SetItemElementRef = function(index, elementIndex, value)
        {
            data[index][elementIndex] = value;
            dataDirty = true;
        };

        /**
         * GetItemElement
         * @param index
         * @param elementIndex
         * @returns {*}
         * @method
         */
        this.GetItemElement = function(index, elementIndex)
        {
            return data[index][elementIndex];
        };

        /**
         * UpdateData
         * @method
         */
        this.UpdateData = function()
        {
            if (!dataDirty || !declaration)
            {
                return;
            }

            var vbData = new Float32Array(data.length * vertexStride);
            var offset = 0;
            var i, j, k;

            for (i = 0; i < data.length; ++i)
            {
                for (j = 0; j < declaration.elements.length; ++j)
                {
                    if (declaration.elements[j].elements == 1)
                    {
                        vbData[offset++] = data[i][j];
                    }
                    else
                    {
                        for (k = 0; k < declaration.elements[j].elements; ++k)
                        {
                            vbData[offset++] = data[i][j][k];
                        }
                    }
                }
            }

            if (!vb)
            {
                vb = device.gl.createBuffer();
            }

            device.gl.bindBuffer(device.gl.ARRAY_BUFFER, vb);
            device.gl.bufferData(device.gl.ARRAY_BUFFER, vbData, device.gl.STATIC_DRAW);
            device.gl.bindBuffer(device.gl.ARRAY_BUFFER, null);
            dataDirty = false;
        };

        /**
         * Unloads the webgl buffer
         * @method
         */
        this.Unload = function()
        {
            if (vb)
            {
                device.gl.deleteBuffer(vb);
                vb = null;
            }
        };

        /**
         * GetInstanceBuffer
         * @returns {WebglArrayBuffer}
         * @method
         */
        this.GetInstanceBuffer = function()
        {
            return vb;
        };

        /**
         * GetInstanceDeclaration
         * @returns {Tw2VertexDeclaration}
         * @method
         */
        this.GetInstanceDeclaration = function()
        {
            return declaration;
        };

        /**
         * GetInstanceStride
         * @returns {number}
         * @method
         */
        this.GetInstanceStride = function()
        {
            return vertexStride * 4;
        };

        /**
         * GetInstanceCount
         * @returns {number}
         * @method
         */
        this.GetInstanceCount = function()
        {
            return count;
        };
    }

    /**
     * Creates a bloom post effect
     * @property {number} width
     * @property {number} height
     * @property {Tw2TextureRes} texture
     * @property {Tw2RenderTarget} quadRT0
     * @property {Tw2RenderTarget} quadRT1
     * @property {Array.<Tw2Effect|Object>} steps
     * @constructor
     */
    function Tw2PostProcess()
    {
        this.width = 0;
        this.height = 0;

        this.texture = null;
        this.quadRT0 = new Tw2RenderTarget();
        this.quadRT1 = new Tw2RenderTarget();

        this.steps = [];
        this.steps[0] = new Tw2Effect();
        this.steps[0] = {
            'effect': new Tw2Effect(),
            'rt': this.quadRT1,
            'inputs':
            {
                'BlitCurrent': null
            }
        };
        this.steps[0].effect.effectFilePath = 'res:/Graphics/Effect/Managed/Space/PostProcess/ColorDownFilter4.fx';
        this.steps[0].effect.Initialize();
        this.steps[0].effect.parameters['BlitCurrent'] = new Tw2TextureParameter('BlitCurrent');
        this.steps[0].effect.parameters['g_texelSize'] = new Tw2Vector4Parameter('g_texelSize');

        this.steps[1] = new Tw2Effect();
        this.steps[1] = {
            'effect': new Tw2Effect(),
            'rt': this.quadRT0,
            'inputs':
            {
                'BlitCurrent': this.quadRT1
            }
        };
        this.steps[1].effect.effectFilePath = 'res:/Graphics/Effect/Managed/Space/PostProcess/ColorHighPassFilter.fx';
        this.steps[1].effect.Initialize();
        this.steps[1].effect.parameters['BlitCurrent'] = new Tw2TextureParameter('BlitCurrent');
        this.steps[1].effect.parameters['LuminanceThreshold'] = new Tw2FloatParameter('LuminanceThreshold', 0.85);
        this.steps[1].effect.parameters['LuminanceScale'] = new Tw2FloatParameter('LuminanceScale', 2);

        this.steps[2] = new Tw2Effect();
        this.steps[2] = {
            'effect': new Tw2Effect(),
            'rt': this.quadRT1,
            'inputs':
            {
                'BlitCurrent': this.quadRT0
            }
        };
        this.steps[2].effect.effectFilePath = 'res:/Graphics/Effect/Managed/Space/PostProcess/ColorExpBlurHorizontalBig.fx';
        this.steps[2].effect.Initialize();
        this.steps[2].effect.parameters['BlitCurrent'] = new Tw2TextureParameter('BlitCurrent');
        this.steps[2].effect.parameters['g_texelSize'] = new Tw2Vector4Parameter('g_texelSize');

        this.steps[3] = new Tw2Effect();
        this.steps[3] = {
            'effect': new Tw2Effect(),
            'rt': this.quadRT0,
            'inputs':
            {
                'BlitCurrent': this.quadRT1
            }
        };
        this.steps[3].effect.effectFilePath = 'res:/Graphics/Effect/Managed/Space/PostProcess/ColorExpBlurVerticalBig.fx';
        this.steps[3].effect.Initialize();
        this.steps[3].effect.parameters['BlitCurrent'] = new Tw2TextureParameter('BlitCurrent');
        this.steps[3].effect.parameters['g_texelSize'] = new Tw2Vector4Parameter('g_texelSize');

        this.steps[4] = new Tw2Effect();
        this.steps[4] = {
            'effect': new Tw2Effect(),
            'rt': null,
            'inputs':
            {
                'BlitCurrent': this.quadRT0,
                'BlitOriginal': null
            }
        };
        this.steps[4].effect.effectFilePath = 'res:/Graphics/Effect/Managed/Space/PostProcess/ColorUpFilter4_Add.fx';
        this.steps[4].effect.Initialize();
        this.steps[4].effect.parameters['BlitCurrent'] = new Tw2TextureParameter('BlitCurrent');
        this.steps[4].effect.parameters['BlitOriginal'] = new Tw2TextureParameter('BlitOriginal');
        this.steps[4].effect.parameters['g_texelSize'] = new Tw2Vector4Parameter('g_texelSize');
        this.steps[4].effect.parameters['ScalingFactor'] = new Tw2FloatParameter('ScalingFactor', 1);
    }

    /**
     * Internal render/update function. It is called every frame.
     * @prototype
     */
    Tw2PostProcess.prototype.Render = function()
    {
        var step, i;

        var width = device.viewportWidth;
        var height = device.viewportHeight;
        if (width <= 0 || height <= 0)
        {
            return;
        }
        if (this.texture == null)
        {
            this.texture = new Tw2TextureRes();
            this.texture.Attach(device.gl.createTexture());
        }
        if (width != this.width || height != this.height)
        {
            device.gl.bindTexture(device.gl.TEXTURE_2D, this.texture.texture);
            device.gl.texImage2D(device.gl.TEXTURE_2D, 0, device.gl.RGBA, width, height, 0, device.gl.RGBA, device.gl.UNSIGNED_BYTE, null);
            device.gl.bindTexture(device.gl.TEXTURE_2D, null);

            this.quadRT0.Create(width / 4, height / 4, false);
            this.quadRT1.Create(width / 4, height / 4, false);

            this.width = width;
            this.height = height;

            for (i = 0; i < this.steps.length; ++i)
            {
                step = this.steps[i];
                for (var name in step.inputs)
                {
                    if (step.inputs.hasOwnProperty(name))
                    {
                        if (step.inputs[name])
                        {
                            step.effect.parameters[name].textureRes = step.inputs[name].texture;
                        }
                        else
                        {
                            step.effect.parameters[name].textureRes = this.texture;
                        }
                    }
                }
                if ('g_texelSize' in step.effect.parameters && 'BlitCurrent' in step.inputs)
                {
                    var size = step.effect.parameters['g_texelSize'];
                    var rt = step.inputs['BlitCurrent'];
                    if (rt)
                    {
                        size.value[0] = 1.0 / rt.width;
                        size.value[1] = 1.0 / rt.width;
                    }
                    else
                    {
                        size.value[0] = 1.0 / width;
                        size.value[1] = 1.0 / width;
                    }
                    size.OnValueChanged();
                }
            }
        }
        device.gl.bindTexture(device.gl.TEXTURE_2D, this.texture.texture);
        device.gl.copyTexImage2D(device.gl.TEXTURE_2D, 0, device.alphaBlendBackBuffer ? device.gl.RGBA : device.gl.RGB, 0, 0, width, height, 0);
        device.gl.bindTexture(device.gl.TEXTURE_2D, null);

        device.SetStandardStates(device.RM_OPAQUE);

        for (i = 0; i < this.steps.length; ++i)
        {
            step = this.steps[i];
            if (step.rt != null)
            {
                step.rt.Set();
            }
            else
            {
                device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, null);
                device.gl.viewport(0, 0, width, height);
            }
            device.RenderFullScreenQuad(step.effect);
        }
    };

    /**
     * Tw2ColorKey
     * @property {number} time
     * @property {quat4} value
     * @property {quat4} left
     * @property {quat4} right
     * @property {number} interpolation
     * @constructor
     */
    function Tw2ColorKey()
    {
        this.time = 0;
        this.value = quat4.create();
        this.left = quat4.create();
        this.right = quat4.create();
        this.interpolation = 0;
    }


    /**
     * Tw2ColorCurve
     * @property {String} name
     * @property {number} start
     * @property {number} length
     * @property {quat4} value
     * @property {number} extrapolation
     * @property {Array.<Tw2ColorKey>} keys
     * @property {number} _currKey
     * @constructor
     */
    function Tw2ColorCurve()
    {
        this.name = '';
        this.start = 0;
        this.length = 0;
        this.value = quat4.create();
        this.extrapolation = 0;
        this.keys = [];
        this._currKey = 1;
    }

    /**
     * Returns curve length
     * @returns {number}
     * @prototype
     */
    Tw2ColorCurve.prototype.GetLength = function()
    {
        return this.length;
    };

    /**
     * Updates a value at a specific time
     * @param {number} time
     * @prototype
     */
    Tw2ColorCurve.prototype.UpdateValue = function(time)
    {
        this.GetValueAt(time, this.value);
    };

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @param {quat4} value
     * @returns {quat4}
     * @prototype
     */
    Tw2ColorCurve.prototype.GetValueAt = function(time, value)
    {
        if (this.length == 0)
        {
            value[0] = this.value[0];
            value[1] = this.value[1];
            value[2] = this.value[2];
            value[3] = this.value[3];
            return value;
        }

        var d;
        var firstKey = this.keys[0];
        var lastKey = this.keys[this.keys.length - 1];
        if (time >= lastKey.time)
        {
            if (this.extrapolation == 0)
            {
                value[0] = this.value[0];
                value[1] = this.value[1];
                value[2] = this.value[2];
                value[3] = this.value[3];
                return value;
            }
            else if (this.extrapolation == 1)
            {
                value[0] = lastKey.value[0];
                value[1] = lastKey.value[1];
                value[2] = lastKey.value[2];
                value[3] = lastKey.value[3];
                return value;
            }
            else if (this.extrapolation == 2)
            {
                d = time - lastKey.time;
                value[0] = lastKey.value[0] + d * lastKey.right[0];
                value[1] = lastKey.value[1] + d * lastKey.right[1];
                value[2] = lastKey.value[2] + d * lastKey.right[2];
                value[3] = lastKey.value[3] + d * lastKey.right[3];
                return value;
            }
            else
            {
                time = time % lastKey.time;
            }
        }
        else if (time < 0 || time < firstKey.time)
        {
            if (this.extrapolation == 0)
            {
                value[0] = this.value[0];
                value[1] = this.value[1];
                value[2] = this.value[2];
                value[3] = this.value[3];
                return value;
            }
            else if (this.extrapolation == 2)
            {
                d = time * this.length - lastKey.time;
                value[0] = firstKey.value[0] + d * firstKey.left[0];
                value[1] = firstKey.value[1] + d * firstKey.left[1];
                value[2] = firstKey.value[2] + d * firstKey.left[2];
                value[3] = firstKey.value[3] + d * firstKey.left[3];
                return value;
            }
            else
            {
                value[0] = firstKey.value[0];
                value[1] = firstKey.value[1];
                value[2] = firstKey.value[2];
                value[3] = firstKey.value[3];
                return value;
            }
        }
        var ck = this.keys[this._currKey];
        var ck_1 = this.keys[this._currKey - 1];
        while ((time >= ck.time) || (time < ck_1.time))
        {
            if (time < ck_1.time)
            {
                this._currKey = 0;
            }
            this._currKey++;
            ck = this.keys[this._currKey];
            ck_1 = this.keys[this._currKey - 1];
        }

        var nt = (time - ck_1.time) / (ck.time - ck_1.time);
        if (ck_1.interpolation == 1)
        {
            value[0] = ck_1.value[0];
            value[1] = ck_1.value[1];
            value[2] = ck_1.value[2];
            value[3] = ck_1.value[3];
        }
        else
        {
            value[0] = ck_1.value[0] * (1 - nt) + ck.value[0] * nt;
            value[1] = ck_1.value[1] * (1 - nt) + ck.value[1] * nt;
            value[2] = ck_1.value[2] * (1 - nt) + ck.value[2] * nt;
            value[3] = ck_1.value[3] * (1 - nt) + ck.value[3] * nt;
        }
        return value;
    };

    /**
     * Tw2ColorKey2
     * @property {number} time
     * @property {quat4} value
     * @property {quat4} leftTangent
     * @property {quat4} rightTangent
     * @property {number} interpolation
     * @constructor
     */
    function Tw2ColorKey2()
    {
        this.time = 0;
        this.value = quat4.create();
        this.leftTangent = quat4.create();
        this.rightTangent = quat4.create();
        this.interpolation = 1;
    }


    /**
     * Tw2ColorCurve2
     * @property {string} name
     * @property {number} length
     * @property {boolean} cycle
     * @property {boolean} reversed
     * @property {number} timeOffset
     * @property {number} timeScale
     * @property {quat4} startValue=[0,0,0,1]
     * @property {quat4} currentValue=[0,0,0,1]
     * @property {quat4} endValue=[0,0,0,1]
     * @property {quat4} startTangent
     * @property {quat4} endTangent
     * @property {number} interpolation
     * @property {Array.<Tw2ColorKey2>} keys
     * @constructor
     */
    function Tw2ColorCurve2()
    {
        this.name = '';
        this.length = 0;
        this.cycle = false;
        this.reversed = false;
        this.timeOffset = 0;
        this.timeScale = 1;
        this.startValue = quat4.create([0, 0, 0, 1]);
        this.currentValue = quat4.create([0, 0, 0, 1]);
        this.endValue = quat4.create([0, 0, 0, 1]);
        this.startTangent = quat4.create();
        this.endTangent = quat4.create();
        this.interpolation = 1;
        this.keys = [];
    }

    /**
     * Initializes the curve
     * @prototype
     */
    Tw2ColorCurve2.prototype.Initialize = function()
    {
        this.Sort();
    };

    /**
     * Gets curve length
     * @returns {number}
     * @prototype
     */
    Tw2ColorCurve2.prototype.GetLength = function()
    {
        return this.length;
    };

    /**
     * Compares two curve keys' time properties
     * @param {Tw2ColorKey2} a
     * @param {Tw2ColorKey2} b
     * @returns {number}
     * @method
     */
    Tw2ColorCurve2.Compare = function(a, b)
    {
        if (a.time < b.time)
        {
            return -1;
        }
        if (a.time > b.time)
        {
            return 1;
        }
        return 0;
    };

    /**
     * Sorts the curve's keys
     * @prototype
     */
    Tw2ColorCurve2.prototype.Sort = function()
    {
        if (this.keys.length)
        {
            this.keys.sort(Tw2ColorCurve2.Compare);
            var back = this.keys[this.keys.length - 1];
            if (back.time > this.length)
            {
                var preLength = this.length;
                var endValue = this.endValue;
                var endTangent = this.endTangent;
                this.length = back.time;
                this.endValue = back.value;
                this.endTangent = back.leftTangent;
                if (preLength > 0)
                {
                    back.time = preLength;
                    back.value = endValue;
                    back.leftTangent = endTangent;
                }
            }
        }
    };

    /**
     * Updates a value at a specific time
     * @param {number} time
     * @prototype
     */
    Tw2ColorCurve2.prototype.UpdateValue = function(time)
    {
        this.GetValueAt(time, this.currentValue);
    };

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @param {quat4} value
     * @returns {quat4}
     * @prototype
     */
    Tw2ColorCurve2.prototype.GetValueAt = function(time, value)
    {
        time = time / this.timeScale + this.timeOffset;
        if (this.length <= 0 || time <= 0)
        {
            value[0] = this.startValue[0];
            value[1] = this.startValue[1];
            value[2] = this.startValue[2];
            value[3] = this.startValue[3];
            return value;
        }
        if (time > this.length)
        {
            if (this.cycle)
            {
                time = time % this.length;
            }
            else if (this.reversed)
            {
                value[0] = this.startValue[0];
                value[1] = this.startValue[1];
                value[2] = this.startValue[2];
                value[3] = this.startValue[3];
                return value;
            }
            else
            {
                value[0] = this.endValue[0];
                value[1] = this.endValue[1];
                value[2] = this.endValue[2];
                value[3] = this.endValue[3];
                return value;
            }
        }
        if (this.reversed)
        {
            time = this.length - time;
        }
        if (this.keys.length == 0)
        {
            return this.Interpolate(time, null, null, value);
        }
        var startKey = this.keys[0];
        if (time <= startKey.time)
        {
            return this.Interpolate(time, null, startKey, value);
        }
        else if (time >= this.keys[this.keys.length - 1].time)
        {
            return this.Interpolate(time, this.keys[this.keys.length - 1], null, value);
        }
        var endKey = this.keys[i + 1];
        for (var i = 0; i + 1 < this.keys.length; ++i)
        {
            startKey = this.keys[i];
            endKey = this.keys[i + 1];
            if (startKey.time <= time && endKey.time > time)
            {
                break;
            }
        }
        return this.Interpolate(time, startKey, endKey, value);
    };

    /**
     * Interpolate
     * @param {number} time
     * @param {Tw2ColorKey2} lastKey
     * @param {Tw2ColorKey2} nextKey
     * @param {quat4} value
     * @returns {*}
     * @prototype
     */
    Tw2ColorCurve2.prototype.Interpolate = function(time, lastKey, nextKey, value)
    {
        value[0] = this.startValue[0];
        value[1] = this.startValue[1];
        value[2] = this.startValue[2];
        value[3] = this.startValue[3];

        var startValue = this.startValue;
        var endValue = this.endValue;
        var interp = this.interpolation;
        var deltaTime = this.length;
        if (lastKey != null)
        {
            interp = lastKey.interpolation;
            time -= lastKey.time;
        }
        switch (interp)
        {
            case 1:
                if (lastKey && nextKey)
                {
                    startValue = lastKey.value;
                    endValue = nextKey.value;
                    deltaTime = nextKey.time - lastKey.time;
                }
                else if (nextKey)
                {
                    endValue = nextKey.value;
                    deltaTime = nextKey.time;
                }
                else if (lastKey)
                {
                    startValue = lastKey.value;
                    deltaTime = this.length - lastKey.time;
                }
                value[0] = startValue[0] + (endValue[0] - startValue[0]) * (time / deltaTime);
                value[1] = startValue[1] + (endValue[1] - startValue[1]) * (time / deltaTime);
                value[2] = startValue[2] + (endValue[2] - startValue[2]) * (time / deltaTime);
                value[3] = startValue[3] + (endValue[3] - startValue[3]) * (time / deltaTime);
                return value;
        }
        return value;
    };

    /**
     * Tw2ColorSequencer
     * @property {string} name
     * @property {number} start
     * @property {quat4} value
     * @property {number} operator
     * @property {Array} functions
     * @property {quat4} _tempValue
     * @constructor
     */
    function Tw2ColorSequencer()
    {
        this.name = '';
        this.start = 0;
        this.value = quat4.create();
        this.operator = 0;
        this.functions = [];
        this._tempValue = quat4.create();
    }

    /**
     * Gets curve length
     * @returns {number}
     * @prototype
     */
    Tw2ColorSequencer.prototype.GetLength = function()
    {
        var length = 0;
        for (var i = 0; i < this.functions.length; ++i)
        {
            if ('GetLength' in this.functions[i])
            {
                length = Math.max(length, this.functions[i].GetLength());
            }
        }
        return length;
    };

    /**
     * Updates a value at a specific time
     * @param {number} time
     * @prototype
     */
    Tw2ColorSequencer.prototype.UpdateValue = function(time)
    {
        this.GetValueAt(time, this.value);
    };

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @param {quat4} value
     * @returns {quat4}
     * @prototype
     */
    Tw2ColorSequencer.prototype.GetValueAt = function(time, value)
    {
        var tempValue, functions, i;

        if (this.operator == 0)
        {
            value[0] = 1;
            value[1] = 1;
            value[2] = 1;
            value[3] = 1;
            tempValue = this._tempValue;
            functions = this.functions;
            for (i = 0; i < functions.length; ++i)
            {
                functions[i].GetValueAt(time, tempValue);
                value[0] *= tempValue[0];
                value[1] *= tempValue[1];
                value[2] *= tempValue[2];
                value[3] *= tempValue[3];
            }
        }
        else
        {
            value[0] = 0;
            value[1] = 0;
            value[2] = 0;
            value[3] = 0;
            tempValue = this._tempValue;
            functions = this.functions;
            for (i = 0; i < functions.length; ++i)
            {
                functions[i].GetValueAt(time, tempValue);
                value[0] += tempValue[0];
                value[1] += tempValue[1];
                value[2] += tempValue[2];
                value[3] += tempValue[3];
            }
        }
        return value;
    };

    /**
     * Tw2EulerRotation
     * @property {string} name
     * @property {null|Tw2Curve} [yawCurve]
     * @property {null|Tw2Curve} [pitchCurve]
     * @property {null|Tw2Curve} [rollCurve]
     * @property {quat4} currentValue=[0,0,0,1]
     * @constructor
     */
    function Tw2EulerRotation()
    {
        this.name = '';
        this.yawCurve = null;
        this.pitchCurve = null;
        this.rollCurve = null;
        this.currentValue = quat4.create([0, 0, 0, 1]);
    }

    /**
     * Updates a value at a specific time
     * @param {number} time
     * @prototype
     */
    Tw2EulerRotation.prototype.UpdateValue = function(time)
    {
        this.GetValueAt(time, this.currentValue);
    };

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @param {quat4} value
     * @returns {quat4}
     * @prototype
     */
    Tw2EulerRotation.prototype.GetValueAt = function(time, value)
    {
        var yaw = this.yawCurve ? this.yawCurve.GetValueAt(time) : 0.0;
        var pitch = this.pitchCurve ? this.pitchCurve.GetValueAt(time) : 0.0;
        var roll = this.rollCurve ? this.rollCurve.GetValueAt(time) : 0.0;

        var sinYaw = Math.sin(yaw / 2.0);
        var cosYaw = Math.cos(yaw / 2.0);
        var sinPitch = Math.sin(pitch / 2.0);
        var cosPitch = Math.cos(pitch / 2.0);
        var sinRoll = Math.sin(roll / 2.0);
        var cosRoll = Math.cos(roll / 2.0);

        value[0] = sinYaw * cosPitch * sinRoll + cosYaw * sinPitch * cosRoll;
        value[1] = sinYaw * cosPitch * cosRoll - cosYaw * sinPitch * sinRoll;
        value[2] = cosYaw * cosPitch * sinRoll - sinYaw * sinPitch * cosRoll;
        value[3] = cosYaw * cosPitch * cosRoll + sinYaw * sinPitch * sinRoll;

        return value;
    };

    /**
     * Gets curve length
     * @returns {number}
     * @prototype
     */
    Tw2EulerRotation.prototype.GetLength = function()
    {
        var length = 0;
        if (this.yawCurve && ('GetLength' in this.yawCurve))
        {
            length = this.yawCurve.GetLength();
        }
        if (this.pitchCurve && ('GetLength' in this.pitchCurve))
        {
            length = Math.max(length, this.pitchCurve.GetLength());
        }
        if (this.rollCurve && ('GetLength' in this.rollCurve))
        {
            length = Math.max(length, this.rollCurve.GetLength());
        }
        return length;
    };

    /**
     * Tw2EventKey
     * @property {number} time
     * @property value
     * @constructor
     */
    function Tw2EventKey()
    {
        this.time = 0;
        this.value = '';
    }


    /**
     * Tw2EventCurve
     * @property {string} name
     * @property {string} value
     * @property {Array.<Tw2EventKey>} keys
     * @property {number} extrapolation
     * @property {number} _length
     * @property {number} _time
     * @property {number} _currentKey
     * @constructor
     */
    function Tw2EventCurve()
    {
        this.name = '';
        this.value = '';
        this.keys = [];
        this.extrapolation = 0;
        this._length = 0;
        this._time = 0;
        this._currentKey = 0;
    }

    /**
     * Compares two curve keys' time properties
     * @param {Tw2EventKey} a
     * @param {Tw2EventKey} b
     * @returns {number}
     * @method
     */
    Tw2EventCurve.Compare = function(a, b)
    {
        if (a.time < b.time)
        {
            return -1;
        }
        if (a.time > b.time)
        {
            return 1;
        }
        return 0;
    };

    /**
     * Initializes the Curve
     * @prototype
     */
    Tw2EventCurve.prototype.Initialize = function()
    {
        this.keys.sort(Tw2EventCurve.Compare);
        this._length = 0;
        if (this.keys.length)
        {
            this._length = this.keys[this.keys.length - 1].time;
        }
    };

    /**
     * Gets curve length
     * @returns {number}
     * @prototype
     */
    Tw2EventCurve.prototype.GetLength = function()
    {
        return this._length;
    };

    /**
     * Updates a value at a specific time
     * @param {number} time
     * @prototype
     */
    Tw2EventCurve.prototype.UpdateValue = function(time)
    {
        if (this._length <= 0)
        {
            return;
        }
        var before = this._time;
        this._time = time;
        if (this._time < before)
        {
            this._currentKey = 0;
        }
        if (this.extrapolation == 3)
        {
            var now = this._time % this._length;
            if (now < before)
            {
                this._currentKey = 0;
            }
            this._time = now;
        }
        while (this._currentKey < this.keys.length && this._time >= this.keys[this._currentKey].time)
        {
            this.value = this.keys[this._currentKey].value;
            ++this._currentKey;
        }
    };

    var Perlin_start = true;
    var Perlin_B = 0x100;
    var Perlin_BM = 0xff;
    var Perlin_N = 0x1000;
    var Perlin_p = new Array(Perlin_B + Perlin_B + 2);
    var Perlin_g1 = new Array(Perlin_B + Perlin_B + 2);

    /**
     * Initializes Perlin Noise
     * @method
     */
    function Perlin_init()
    {
        var i = 0;
        var j = 0;
        var k = 0;
        for (i = 0; i < Perlin_B; i++)
        {
            Perlin_p[i] = i;
            Perlin_g1[i] = Math.random() * 2 - 1;
        }

        while (--i)
        {
            k = Perlin_p[i];
            Perlin_p[i] = Perlin_p[j = Math.floor(Math.random() * Perlin_B)];
            Perlin_p[j] = k;
        }

        for (i = 0; i < Perlin_B + 2; i++)
        {
            Perlin_p[Perlin_B + i] = Perlin_p[i];
            Perlin_g1[Perlin_B + i] = Perlin_g1[i];
        }
    }

    /**
     * Perlin_noise1
     * @param arg
     * @returns {*}
     * @method
     */
    function Perlin_noise1(arg)
    {
        if (Perlin_start)
        {
            Perlin_start = false;
            Perlin_init();
        }

        var t = arg + Perlin_N;
        var bx0 = Math.floor(t) & Perlin_BM;
        var bx1 = (bx0 + 1) & Perlin_BM;
        var rx0 = t - Math.floor(t);
        var rx1 = rx0 - 1;

        sx = rx0 * rx0 * (3. - 2. * rx0);
        u = rx0 * Perlin_g1[Perlin_p[bx0]];
        v = rx1 * Perlin_g1[Perlin_p[bx1]];

        return u + sx * (v - u);
    }

    /**
     * PerlinNoise1D
     * @param x
     * @param alpha
     * @param beta
     * @param n
     * @returns {number}
     * @method
     */
    function PerlinNoise1D(x, alpha, beta, n)
    {
        var sum = 0;
        var p = x;
        var scale = 1;
        for (var i = 0; i < n; ++i)
        {
            sum += Perlin_noise1(p) / scale;
            scale *= alpha;
            p *= beta;
        }
        return sum;
    }

    /**
     * Tw2PerlinCurve
     * @property {String} name
     * @property {number} start
     * @property {number} value
     * @property {number} speed
     * @property {number} alpha
     * @property {number} beta
     * @property {number} offset
     * @property {number} scale
     * @property {number} N
     * @property {number} _startOffset
     * @constructor
     */
    function Tw2PerlinCurve()
    {
        this.name = '';
        this.start = 0;
        this.value = 0;
        this.speed = 1;
        this.alpha = 1.1;
        this.beta = 2;
        this.offset = 0;
        this.scale = 1;
        this.N = 3;
        this._startOffset = Math.random() * 100;
    }

    /**
     * Updates a value at a specific time
     * @param {number} time
     * @prototype
     */
    Tw2PerlinCurve.prototype.UpdateValue = function(time)
    {
        this.value = this.GetValueAt(time);
    };

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @returns {number}
     * @prototype
     */
    Tw2PerlinCurve.prototype.GetValueAt = function(time)
    {
        time -= this._startOffset;
        return ((PerlinNoise1D(time * this.speed, this.alpha, this.beta, this.N) + 1) / 2) * this.scale + this.offset;
    };

    /**
     * Tw2QuaternionSequencer
     * @property {string} name
     * @property {number} start
     * @property {quat4} value
     * @property {Array} functions
     * @property {quat4} _tempValue
     * @constructor
     */
    function Tw2QuaternionSequencer()
    {
        this.name = '';
        this.start = 0;
        this.value = quat4.create();
        this.functions = [];
        this._tempValue = quat4.create();
    }

    /**
     * Gets curve length
     * @returns {number}
     * @prototype
     */
    Tw2QuaternionSequencer.prototype.GetLength = function()
    {
        var length = 0;
        for (var i = 0; i < this.functions.length; ++i)
        {
            if ('GetLength' in this.functions[i])
            {
                length = Math.max(length, this.functions[i].GetLength());
            }
        }
        return length;
    };

    /**
     * Updates a value at a specific time
     * @param {number} time
     * @prototype
     */
    Tw2QuaternionSequencer.prototype.UpdateValue = function(time)
    {
        this.GetValueAt(time, this.value);
    };

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @param {quat4} value
     * @returns {quat4}
     * @prototype
     */
    Tw2QuaternionSequencer.prototype.GetValueAt = function(time, value)
    {
        value[0] = 0;
        value[1] = 0;
        value[2] = 0;
        value[3] = 1;
        var tempValue = this._tempValue;
        var functions = this.functions;
        for (var i = 0; i < functions.length; ++i)
        {
            functions[i].GetValueAt(time, tempValue);
            quat4.multiply(value, tempValue);
        }
        return value;
    };

    /**
     * Tw2RandomConstantCurve
     * @property {string} name
     * @property {number} value
     * @property {number} min
     * @property {number} max
     * @property {boolean} hold
     * @constructor
     */
    function Tw2RandomConstantCurve()
    {
        this.name = '';
        this.value = 0;
        this.min = 0;
        this.max = 1;
        this.hold = true;
    }

    /**
     * Updates a value at a specific time
     * @param {number} time
     * @prototype
     */
    Tw2RandomConstantCurve.prototype.UpdateValue = function(time)
    {
        this.value = this.GetValueAt(time);
    };

    /**
     * Gets a value at a specific time
     * TODO: @param time is redundant
     * @param {number} time
     * @returns {number}
     * @prototype
     */
    Tw2RandomConstantCurve.prototype.GetValueAt = function(time)
    {
        if (!this.hold)
        {
            this.value = this.min + (this.max - this.min) * Math.random();
        }
        return this.value;
    };

    /**
     * Tw2RGBAScalarSequencer
     * @property {quat4} value
     * @property {null|Tw2Curve} RedCurve
     * @property {null|Tw2Curve} GreenCurve
     * @property {null|Tw2Curve} BlueCurve
     * @property {null|Tw2Curve} AlphaCurve
     * @constructor
     */
    function Tw2RGBAScalarSequencer()
    {
        this.value = quat4.create();
        this.RedCurve = null;
        this.GreenCurve = null;
        this.BlueCurve = null;
        this.AlphaCurve = null;
    }

    /**
     * Gets curve length
     * @returns {number}
     * @prototype
     */
    Tw2RGBAScalarSequencer.prototype.GetLength = function()
    {
        var length = 0;
        if (this.RedCurve && ('GetLength' in this.RedCurve))
        {
            length = this.RedCurve.GetLength();
        }
        if (this.GreenCurve && ('GetLength' in this.GreenCurve))
        {
            length = Math.max(length, this.GreenCurve.GetLength());
        }
        if (this.BlueCurve && ('GetLength' in this.BlueCurve))
        {
            length = Math.max(length, this.BlueCurve.GetLength());
        }
        if (this.AlphaCurve && ('GetLength' in this.AlphaCurve))
        {
            length = Math.max(length, this.AlphaCurve.GetLength());
        }
        return length;
    };

    /**
     * Updates a value at a specific time
     * @param {number} time
     * @prototype
     */
    Tw2RGBAScalarSequencer.prototype.UpdateValue = function(time)
    {
        this.GetValueAt(time, this.value);
    };

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @param {quat4} value
     * @returns {quat4}
     * @prototype
     */
    Tw2RGBAScalarSequencer.prototype.GetValueAt = function(time, value)
    {
        if (this.RedCurve)
        {
            value[0] = this.RedCurve.GetValueAt(time)
        }
        else
        {
            value[0] = 0;
        }
        if (this.GreenCurve)
        {
            value[1] = this.GreenCurve.GetValueAt(time)
        }
        else
        {
            value[1] = 0;
        }
        if (this.BlueCurve)
        {
            value[2] = this.BlueCurve.GetValueAt(time)
        }
        else
        {
            value[2] = 0;
        }
        if (this.AlphaCurve)
        {
            value[3] = this.AlphaCurve.GetValueAt(time)
        }
        else
        {
            value[3] = 0;
        }
        return value;
    };

    /**
     * Tw2Torque
     * @property {number} time
     * @property {quat4} rot0=[0,0,0,1]
     * @property {vec3} omega0
     * @property {vec3} torque
     * @constructor
     */
    function Tw2Torque()
    {
        this.time = 0;
        this.rot0 = quat4.create([0, 0, 0, 1]);
        this.omega0 = vec3.create();
        this.torque = vec3.create();
    }


    /**
     * Tw2RigidOrientation
     * @property {string} name
     * @property {number} I
     * @property {number} drag
     * @property {quat4} value=[0,0,0,1]
     * @property {number} start
     * @property {Array} states
     * @property {vec3} _tau
     * @property {quat4} _tauConverter
     * @constructor
     */
    function Tw2RigidOrientation()
    {
        this.name = '';
        this.I = 1;
        this.drag = 1;
        this.value = quat4.create([0, 0, 0, 1]);
        this.start = 0;
        this.states = [];
        this._tau = vec3.create();
        this._tauConverter = quat4.create();
    }

    /**
     * Updates a value at a specific time
     * @param {number} time
     * @prototype
     */
    Tw2RigidOrientation.prototype.UpdateValue = function(time)
    {
        this.GetValueAt(time, this.value);
    };

    /**
     * ExponentialDecay
     * @param v
     * @param a
     * @param m
     * @param k
     * @param t
     * @returns {number}
     * @prototype
     */
    Tw2RigidOrientation.prototype.ExponentialDecay = function(v, a, m, k, t)
    {
        return a * t / k + m * (v * k - a) / (k * k) * (1.0 - Math.pow(Math.E, -k * t / m));
    };

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @param {quat4} value
     * @returns {quat4}
     * @prototype
     */
    Tw2RigidOrientation.prototype.GetValueAt = function(time, value)
    {
        if (this.states.length == 0 || time < 0 || time < this.states[0].time)
        {
            quat4.set(this.value, value);
            return value;
        }
        var key = 0;
        if (time >= this.states[this.states.length - 1].time)
        {
            key = this.states.length - 1;
        }
        else
        {
            for (; key + 1 < this.states.length; ++key)
            {
                if (time >= this.states[key].time && time < this.states[key + 1].time)
                {
                    break;
                }
            }
        }
        time -= this.states[key].time;

        this._tau[0] = this.ExponentialDecay(this.states[key].omega0[0], this.states[key].torque[0], this.I, this.drag, time);
        this._tau[1] = this.ExponentialDecay(this.states[key].omega0[1], this.states[key].torque[1], this.I, this.drag, time);
        this._tau[2] = this.ExponentialDecay(this.states[key].omega0[2], this.states[key].torque[2], this.I, this.drag, time);

        vec3.set(this._tau, this._tauConverter);
        this._tauConverter[3] = 0;

        var norm = Math.sqrt(
            this._tauConverter[0] * this._tauConverter[0] +
            this._tauConverter[1] * this._tauConverter[1] +
            this._tauConverter[2] * this._tauConverter[2] +
            this._tauConverter[3] * this._tauConverter[3]);
        if (norm)
        {
            this._tauConverter[0] = Math.sin(norm) * this._tauConverter[0] / norm;
            this._tauConverter[1] = Math.sin(norm) * this._tauConverter[1] / norm;
            this._tauConverter[2] = Math.sin(norm) * this._tauConverter[2] / norm;
            this._tauConverter[3] = Math.cos(norm);
        }
        else
        {
            this._tauConverter[0] = 0.0;
            this._tauConverter[1] = 0.0;
            this._tauConverter[2] = 0.0;
            this._tauConverter[3] = 1.0;
        }
        quat4.multiply(this.states[key].rot0, this._tauConverter, value);
        return value;
    };

    /**
     * Tw2QuaternionKey
     * @property {number} time
     * @property {quat4} value
     * @property {quat4} left
     * @property {quat4} right
     * @property {number} interpolation
     * @constructor
     */
    function Tw2QuaternionKey()
    {
        this.time = 0;
        this.value = quat4.create();
        this.left = quat4.create();
        this.right = quat4.create();
        this.interpolation = 5;
    }


    /**
     * Tw2RotationCurve
     * @property {string} name
     * @property {number} start
     * @property {number} length
     * @property {quat4} value
     * @property {number} extrapolation
     * @property {Array.<Tw2QuaternionKey>} keys
     * @property {number} _currKey
     * @constructor
     */
    function Tw2RotationCurve()
    {
        this.name = '';
        this.start = 0;
        this.length = 0;
        this.value = quat4.create();
        this.extrapolation = 0;
        this.keys = [];
        this._currKey = 1;
    }

    /**
     * Gets curve length
     * @returns {number}
     * @prototype
     */
    Tw2RotationCurve.prototype.GetLength = function()
    {
        return this.length;
    };

    /**
     * Updates a value at a specific time
     * @param {number} time
     * @prototype
     */
    Tw2RotationCurve.prototype.UpdateValue = function(time)
    {
        this.GetValueAt(time, this.value);
    };

    /**
     * BICumulative
     * @param {number} order
     * @param t
     * @returns {number}
     * @method
     */
    Tw2RotationCurve.BICumulative = function(order, t)
    {
        if (order == 1)
        {
            var some = (1.0 - t);
            return 1.0 - some * some * some;
        }
        else if (order == 2)
        {
            return 3.0 * t * t - 2.0 * t * t * t;
        }
        else
        {
            return t * t * t;
        }
    };

    /**
     * QuaternionPow
     * @param {quat4} out
     * @param {quat4} inq
     * @param {number} exponent
     * @returns {quat4}
     * @method
     */
    Tw2RotationCurve.QuaternionPow = function(out, inq, exponent)
    {
        if (exponent == 1)
        {
            quat4.set(inq, out);
            return out;
        }
        Tw2RotationCurve.QuaternionLn(out, inq);
        out[0] *= exponent;
        out[1] *= exponent;
        out[2] *= exponent;
        out[3] *= exponent;
        Tw2RotationCurve.QuaternionExp(out, out);
        return out;
    };

    /**
     * QuaternionLn
     * @param {quat4} out
     * @param {quat4} q
     * @returns {quat4}
     * @method
     */
    Tw2RotationCurve.QuaternionLn = function(out, q)
    {
        var norm = quat4.length(q);
        if (norm > 1.0001 || norm < 0.99999)
        {
            out[0] = q[0];
            out[1] = q[1];
            out[2] = q[2];
            out[3] = 0.0;
        }
        else
        {
            var normvec = Math.sqrt(q[0] * q[0] + q[1] * q[1] + q[2] * q[2]);
            if (normvec == 0.0)
            {
                out[0] = 0.0;
                out[1] = 0.0;
                out[2] = 0.0;
                out[3] = 0.0;
            }
            else
            {
                var theta = Math.atan2(normvec, q[3]) / normvec;
                out[0] = theta * q[0];
                out[1] = theta * q[1];
                out[2] = theta * q[2];
                out[3] = 0.0;
            }
        }
        return out;
    };

    /**
     * QuaternionExp
     * @param {quat4} out
     * @param {quat4} q
     * @returns {quat4}
     * @method
     */
    Tw2RotationCurve.QuaternionExp = function(out, q)
    {
        var norm = Math.sqrt(q[0] * q[0] + q[1] * q[1] + q[2] * q[2]);
        if (norm)
        {
            out[0] = Math.sin(norm) * q[0] / norm;
            out[1] = Math.sin(norm) * q[1] / norm;
            out[2] = Math.sin(norm) * q[2] / norm;
            out[3] = Math.cos(norm);
        }
        else
        {
            out[0] = 0.0;
            out[1] = 0.0;
            out[2] = 0.0;
            out[3] = 1.0;
        }
        return out;
    };

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @param {quat4} value
     * @returns {quat4}
     * @prototype
     */
    Tw2RotationCurve.prototype.GetValueAt = function(time, value)
    {
        if (this.length == 0)
        {
            quat4.set(this.value, value);
            return value;
        }

        var firstKey = this.keys[0];
        var lastKey = this.keys[this.keys.length - 1];
        if (time >= lastKey.time)
        {
            if (this.extrapolation == 0)
            {
                quat4.set(this.value, value);
                return value;
            }
            else if (this.extrapolation == 1)
            {
                quat4.set(lastKey.value, value);
                return value;
            }
            else
            {
                time = time % lastKey.time;
            }
        }
        else if (time < 0 || time < firstKey.time)
        {
            if (this.extrapolation == 0)
            {
                quat4.set(this.value, value);
                return value;
            }
            else
            {
                quat4.set(firstKey.value, value);
                return value;
            }
        }
        var ck = this.keys[this._currKey];
        var ck_1 = this.keys[this._currKey - 1];
        while ((time >= ck.time) || (time < ck_1.time))
        {
            if (time < ck_1.time)
            {
                this._currKey = 0;
            }
            this._currKey++;
            ck = this.keys[this._currKey];
            ck_1 = this.keys[this._currKey - 1];
        }

        var nt = (time - ck_1.time) / (ck.time - ck_1.time);
        if (ck_1.interpolation == 1)
        {
            quat4.set(ck_1.value, value);
        }
        else if (ck_1.interpolation == 2)
        {
            value[0] = ck_1.value[0] * (1 - nt) + ck.value[0] * nt;
            value[1] = ck_1.value[1] * (1 - nt) + ck.value[1] * nt;
            value[2] = ck_1.value[2] * (1 - nt) + ck.value[2] * nt;
            value[3] = ck_1.value[3] * (1 - nt) + ck.value[3] * nt;
        }
        else if (ck_1.interpolation == 3)
        {
            var collect = quat4.create();
            collect[3] = 1;
            var arr = [ck_1.value, ck_1.right, ck.left, ck.value];
            for (var i = 3; i > 0; i--)
            {
                var power = Tw2RotationCurve.BICumulative(i, nt);
                if (power > 1)
                {
                    quat4.multiply(collect, arr[i], value);
                }
                value[0] = -arr[i - 1][0];
                value[1] = -arr[i - 1][1];
                value[2] = -arr[i - 1][2];
                value[3] = arr[i - 1][3];
                quat4.multiply(value, arr[i], value);
                Tw2RotationCurve.QuaternionPow(value, value, power);
                quat4.multiply(collect, value, collect);
            }
            return quat4.multiply(collect, ck_1.value, value);
        }
        else if (ck_1.interpolation == 5)
        {
            return quat4.slerp(ck_1.value, ck.value, nt, value);
        }
        else
        {
            return quat4.slerp(quat4.slerp(ck_1.value, ck.value, nt, quat4.create()), quat4.slerp(ck_1.right, ck.left, nt, quat4.create()), 2.0 * time * (1.0 - time), value);
        }
        return value;
    };

    /**
     * Tw2ScalarKey
     * @property {number} time
     * @property {number} value
     * @property {number} left
     * @property {number} right
     * @property {number} interpolation
     * @constructor
     */
    function Tw2ScalarKey()
    {
        this.time = 0;
        this.value = 0;
        this.left = 0;
        this.right = 0;
        this.interpolation = 0;
    }

    /**
     * Tw2ScalarCurve
     * @property {string} name
     * @property {number} start
     * @property {number} timeScale
     * @property {number} timeOffset
     * @property {number} length
     * @property {number} value
     * @property {number} extrapolation
     * @property {Array.<Tw2ScalarKey>} keys
     * @property {number} _currKey
     * @constructor
     */
    function Tw2ScalarCurve()
    {
        this.name = '';
        this.start = 0;
        this.timeScale = 1;
        this.timeOffset = 0;
        this.length = 0;
        this.value = 0;
        this.extrapolation = 0;
        this.keys = [];
        this._currKey = 1;
    }

    /**
     * Gets curve length
     * @returns {number}
     * @prototype
     */
    Tw2ScalarCurve.prototype.GetLength = function()
    {
        return this.length;
    };

    /**
     * Updates a value at a specific time
     * @param {number} time
     * @prototype
     */
    Tw2ScalarCurve.prototype.UpdateValue = function(time)
    {
        this.value = this.GetValueAt(time);
    };

    /**
     * Gets a value at a specific time
     * TODO: Final return is unreachable
     * @param {number} time
     * @returns {*}
     * @prototype
     */
    Tw2ScalarCurve.prototype.GetValueAt = function(time)
    {
        var d;

        time = time / this.timeScale - this.timeOffset;
        if (this.length == 0)
        {
            return this.value;
        }

        var firstKey = this.keys[0];
        var lastKey = this.keys[this.keys.length - 1];
        if (time >= lastKey.time)
        {
            if (this.extrapolation == 0)
            {
                return this.value;
            }
            else if (this.extrapolation == 1)
            {
                return lastKey.value;
            }
            else if (this.extrapolation == 2)
            {
                d = time - lastKey.time;
                return lastKey.value + d * lastKey.right;
            }
            else
            {
                time = time % lastKey.time;
            }
        }
        else if (time < 0 || time < firstKey.time)
        {
            if (this.extrapolation == 0)
            {
                return this.value;
            }
            else if (this.extrapolation == 2)
            {
                d = time * this.length - lastKey.time;
                return firstKey.value + d * firstKey.left;
            }
            else
            {
                return firstKey.value;
            }
        }
        var ck = this.keys[this._currKey];
        var ck_1 = this.keys[this._currKey - 1];
        while ((time >= ck.time) || (time < ck_1.time))
        {
            if (time < ck_1.time)
            {
                this._currKey = 0;
            }
            this._currKey++;
            ck = this.keys[this._currKey];
            ck_1 = this.keys[this._currKey - 1];
        }

        var nt = (time - ck_1.time) / (ck.time - ck_1.time);
        if (ck_1.interpolation == 1)
        {
            return ck_1.value;
        }
        else if (ck_1.interpolation == 2)
        {
            return ck_1.value * (1 - nt) + ck.value * nt;
        }
        else if (ck_1.interpolation == 3)
        {
            var k3 = 2 * nt * nt * nt - 3 * nt * nt + 1;
            var k2 = -2 * nt * nt * nt + 3 * nt * nt;
            var k1 = nt * nt * nt - 2 * nt * nt + nt;
            var k0 = nt * nt * nt - nt * nt;
            return k3 * ck_1.value + k2 * ck.value + k1 * ck_1.right + k0 * ck.left;
        }
        else
        {
            var sq = Math.sqrt(ck_1.value / ck.value);
            var exponent = Math.exp(-time / ck_1.right);
            var ret = (1.0 + (sq - 1.0) * exponent);
            return ret * ret * ck.value;
        }

        return this.value;
    };

    /**
     * Tw2ScalarKey2
     * @property {number} time
     * @property {number} value
     * @property {number} leftTangent
     * @property {number} rightTangent
     * @property {number} interpolation
     * @constructor
     */
    function Tw2ScalarKey2()
    {
        this.time = 0;
        this.value = 0;
        this.leftTangent = 0;
        this.rightTangent = 0;
        this.interpolation = 1;
    }

    /**
     * Tw2ScalarCurve2
     * @property {string} name
     * @property {number} length
     * @property {boolean} cycle
     * @property {boolean} reversed
     * @property {number} timeOffset
     * @property {number} timeScale
     * @property {number} startValue
     * @property {number} currentValue
     * @property {number} endValue
     * @property {number} startTangent
     * @property {number} endTangent
     * @property {number} interpolation
     * @property {Array.<Tw2ScalarKey2>} keys
     * @constructor
     */
    function Tw2ScalarCurve2()
    {
        this.name = '';
        this.length = 0;
        this.cycle = false;
        this.reversed = false;
        this.timeOffset = 0;
        this.timeScale = 1;
        this.startValue = 0;
        this.currentValue = 0;
        this.endValue = 0;
        this.startTangent = 0;
        this.endTangent = 0;
        this.interpolation = 1;
        this.keys = [];
    }

    /**
     * Gets curve length
     * @returns {number}
     * @prototype
     */
    Tw2ScalarCurve2.prototype.GetLength = function()
    {
        return this.length;
    };

    /**
     * Initializes Curve
     * @prototype
     */
    Tw2ScalarCurve2.prototype.Initialize = function()
    {
        this.Sort();
    };

    /**
     * Compares two curve keys' time properties
     * @param {Tw2ScalarKey2} a
     * @param {Tw2ScalarKey2} b
     * @returns {number}
     * @method
     */
    Tw2ScalarCurve2.Compare = function(a, b)
    {
        if (a.time < b.time)
        {
            return -1;
        }
        if (a.time > b.time)
        {
            return 1;
        }
        return 0;
    };

    /**
     * Sorts the curve's keys
     * @prototype
     */
    Tw2ScalarCurve2.prototype.Sort = function()
    {
        if (this.keys.length)
        {
            this.keys.sort(Tw2ScalarCurve2.Compare);
            var back = this.keys[this.keys.length - 1];
            if (back.time > this.length)
            {
                var preLength = this.length;
                var endValue = this.endValue;
                var endTangent = this.endTangent;
                this.length = back.time;
                this.endValue = back.value;
                this.endTangent = back.leftTangent;
                if (preLength > 0)
                {
                    back.time = preLength;
                    back.value = endValue;
                    back.leftTangent = endTangent;
                }
            }
        }
    };

    /**
     * Updates a value at a specific time
     * @param {number} time
     * @prototype
     */
    Tw2ScalarCurve2.prototype.UpdateValue = function(time)
    {
        this.currentValue = this.GetValueAt(time);
    };

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @returns {number}
     * @prototype
     */
    Tw2ScalarCurve2.prototype.GetValueAt = function(time)
    {
        time = time / this.timeScale + this.timeOffset;
        if (this.length <= 0 || time <= 0)
        {
            return this.startValue;
        }
        if (time > this.length)
        {
            if (this.cycle)
            {
                time = time % this.length;
            }
            else if (this.reversed)
            {
                return this.startValue;
            }
            else
            {
                return this.endValue;
            }
        }
        if (this.reversed)
        {
            time = this.length - time;
        }
        if (this.keys.length == 0)
        {
            return this.Interpolate(time, null, null);
        }
        var startKey = this.keys[0];
        if (time <= startKey.time)
        {
            return this.Interpolate(time, null, startKey);
        }
        else if (time >= this.keys[this.keys.length - 1].time)
        {
            return this.Interpolate(time, this.keys[this.keys.length - 1], null);
        }
        var endKey = this.keys[i + 1];
        for (var i = 0; i + 1 < this.keys.length; ++i)
        {
            startKey = this.keys[i];
            endKey = this.keys[i + 1];
            if (startKey.time <= time && endKey.time > time)
            {
                break;
            }
        }
        return this.Interpolate(time, startKey, endKey);
    };

    /**
     * Interpolate
     * @param {number} time
     * @param {Tw2ScalarKey2} lastKey
     * @param {Tw2ScalarKey2} nextKey
     * @returns {number}
     * @prototype
     */
    Tw2ScalarCurve2.prototype.Interpolate = function(time, lastKey, nextKey)
    {
        var startValue = this.startValue;
        var endValue = this.endValue;
        var interp = this.interpolation;
        var deltaTime = this.length;
        if (lastKey != null)
        {
            interp = lastKey.interpolation;
            time -= lastKey.time;
        }
        switch (interp)
        {
            case 1:
                if (lastKey && nextKey)
                {
                    startValue = lastKey.value;
                    endValue = nextKey.value;
                    deltaTime = nextKey.time - lastKey.time;
                }
                else if (nextKey)
                {
                    endValue = nextKey.value;
                    deltaTime = nextKey.time;
                }
                else if (lastKey)
                {
                    startValue = lastKey.value;
                    deltaTime = this.length - lastKey.time;
                }
                return startValue + (endValue - startValue) * (time / deltaTime);

            case 2:
                var inTangent = this.startTangent;
                var outTangent = this.endTangent;
                if (lastKey && nextKey)
                {
                    startValue = lastKey.value;
                    inTangent = lastKey.rightTangent;
                    endValue = nextKey.value;
                    outTangent = nextKey.leftTangent;
                    deltaTime = nextKey.time - lastKey.time;
                }
                else if (nextKey)
                {
                    endValue = nextKey.value;
                    outTangent = nextKey.leftTangent;
                    deltaTime = nextKey.time;
                }
                else if (lastKey)
                {
                    startValue = lastKey.value;
                    inTangent = lastKey.rightTangent;
                    deltaTime = this.length - lastKey.time;
                }
                var s = time / deltaTime;
                var s2 = s * s;
                var s3 = s2 * s;

                var c2 = -2.0 * s3 + 3.0 * s2;
                var c1 = 1.0 - c2;
                var c4 = s3 - s2;
                var c3 = s + c4 - s2;

                return startValue * c1 + endValue * c2 + inTangent * c3 + outTangent * c4;
        }
        return this.startValue;
    };

    /**
     * Tw2ScalarSequencer
     * @property {string} name
     * @property {number} value
     * @property {number} operator
     * @property {Array} functions
     * @property {number} inMinClamp
     * @property {number} inMaxClamp
     * @property {number} outMinClamp
     * @property {number} outMaxClamp
     * @property {boolean} clamping
     * @constructor
     */
    function Tw2ScalarSequencer()
    {
        this.name = '';
        this.value = 0;
        this.operator = 0;
        this.functions = [];
        this.inMinClamp = 0;
        this.inMaxClamp = 1;
        this.outMinClamp = 0;
        this.outMaxClamp = 1;
        this.clamping = false;
    }

    /**
     * Gets curve length
     * @returns {number}
     * @prototype
     */
    Tw2ScalarSequencer.prototype.GetLength = function()
    {
        var length = 0;
        for (var i = 0; i < this.functions.length; ++i)
        {
            if ('GetLength' in this.functions[i])
            {
                length = Math.max(length, this.functions[i].GetLength());
            }
        }
        return length;
    };

    /**
     * Updates a value at a specific time
     * @param {number} time
     * @prototype
     */
    Tw2ScalarSequencer.prototype.UpdateValue = function(time)
    {
        this.value = this.GetValueAt(time);
    };

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @returns {number}
     * @prototype
     */
    Tw2ScalarSequencer.prototype.GetValueAt = function(time)
    {
        var ret, i, v;

        if (this.operator == 0)
        {
            ret = 1;
            for (i = 0; i < this.functions.length; ++i)
            {
                v = this.functions[i].GetValueAt(time);
                if (this.clamping)
                {
                    v = Math.min(Math.max(v, this.inMinClamp), this.inMaxClamp);
                }
                ret *= v;
            }
        }
        else
        {
            ret = 0;
            for (i = 0; i < this.functions.length; ++i)
            {
                v = this.functions[i].GetValueAt(time);
                if (this.clamping)
                {
                    v = Math.min(Math.max(v, this.inMinClamp), this.inMaxClamp);
                }
                ret += v;
            }
        }
        if (this.clamping)
        {
            ret = Math.min(Math.max(ret, this.outMinClamp), this.outMaxClamp);
        }
        return ret;
    };

    /**
     * Tw2SineCurve
     * @property {string} name
     * @property {number} value
     * @property {number} offset
     * @property {number} scale
     * @property {number} speed
     * @constructor
     */
    function Tw2SineCurve()
    {
        this.name = '';
        this.value = 0;
        this.offset = 0;
        this.scale = 1;
        this.speed = 1;
    }

    /**
     * Updates a value at a specific time
     * @param {number} time
     * @prototype
     */
    Tw2SineCurve.prototype.UpdateValue = function(time)
    {
        this.value = this.GetValueAt(time);
    };

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @returns {number}
     * @prototype
     */
    Tw2SineCurve.prototype.GetValueAt = function(time)
    {
        return Math.sin(time * Math.pi * 2 * this.speed) * this.scale + this.offset;
    };

    /**
     * Tw2TransformTrack
     * @property {string} name
     * @property {string} resPath
     * @property {Object} res
     * @property {string} group
     * @property {boolean} cycle
     * @property {vec3} translation
     * @property {quat4} rotation
     * @property {vec3} scale
     * @property positionCurve
     * @property orientationCurve
     * @property scaleCurve
     * @property {mat4} _scaleShear
     * @constructor
     */
    function Tw2TransformTrack()
    {
        this.name = '';
        this.resPath = '';
        this.res = null;
        this.group = '';
        this.cycle = false;
        this.translation = vec3.create();
        this.rotation = quat4.create([0, 0, 0, 1]);
        this.scale = vec3.create([1, 1, 1]);
        this.positionCurve = null;
        this.orientationCurve = null;
        this.scaleCurve = null;
        this._scaleShear = mat4.create();
    }

    /**
     * Initializes the Curve
     * @prototype
     */
    Tw2TransformTrack.prototype.Initialize = function()
    {
        if (this.resPath != '')
        {
            this.res = resMan.GetResource(this.resPath);
        }
    };

    /**
     * Gets curve length
     * @returns {number}
     * @prototype
     */
    Tw2TransformTrack.prototype.GetLength = function()
    {
        return this.duration;
    };

    /**
     * EvaluateCurve
     * @param curve
     * @param {number} time
     * @param {Array|vec3|quat4|mat4} value
     * @param {boolean} cycle
     * @param {number} duration
     * @prototype
     */
    Tw2TransformTrack.prototype.EvaluateCurve = function(curve, time, value, cycle, duration)
    {
        var i;
        var count = curve.knots.length;
        var knot = count - 1;
        var t = 0;
        for (i = 0; i < curve.knots.length; ++i)
        {
            if (curve.knots[i] > time)
            {
                knot = i;
                break;
            }
        }

        if (curve.degree == 0)
        {
            for (i = 0; i < curve.dimension; ++i)
            {
                value[i] = curve.controls[knot * curve.dimension + i];
            }
        }
        else if (curve.degree == 1)
        {
            var knot0 = cycle ? (knot + count - 1) % count : knot == 0 ? 0 : knot - 1;
            var dt = curve.knots[knot] - curve.knots[knot0];
            if (dt < 0)
            {
                dt += duration;
            }
            if (dt > 0)
            {
                t = (time - curve.knots[i - 1]) / dt;
            }
            for (i = 0; i < curve.dimension; ++i)
            {
                value[i] = curve.controls[knot0 * curve.dimension + i] * (1 - t) + curve.controls[knot * curve.dimension + i] * t;
            }
        }
        else
        {
            var k_2 = cycle ? (knot + count - 2) % count : knot == 0 ? 0 : knot - 2;
            var k_1 = cycle ? (knot + count - 1) % count : knot == 0 ? 0 : knot - 1;

            var p1 = (k_2) * curve.dimension;
            var p2 = (k_1) * curve.dimension;
            var p3 = knot * curve.dimension;

            var ti_2 = curve.knots[k_2];
            var ti_1 = curve.knots[k_1];
            var ti = curve.knots[knot];
            var ti1 = curve.knots[(knot + 1) % count];
            if (ti_2 > ti)
            {
                ti += duration;
                ti1 += duration;
                time += duration;
            }
            if (ti_1 > ti)
            {
                ti += duration;
                ti1 += duration;
                time += duration;
            }
            if (ti1 < ti)
            {
                ti1 += duration;
            }

            var tmti_1 = (time - ti_1);
            var tmti_2 = (time - ti_2);
            var dL0 = ti - ti_1;
            var dL1_1 = ti - ti_2;
            var dL1_2 = ti1 - ti_1;

            var L0 = tmti_1 / dL0;
            var L1_1 = tmti_2 / dL1_1;
            var L1_2 = tmti_1 / dL1_2;

            var ci_2 = (L1_1 + L0) - L0 * L1_1;
            var ci = L0 * L1_2;
            var ci_1 = ci_2 - ci;
            ci_2 = 1 - ci_2;

            for (i = 0; i < curve.dimension; ++i)
            {
                value[i] = ci_2 * curve.controls[p1 + i] + ci_1 * curve.controls[p2 + i] + ci * curve.controls[p3 + i];
            }
        }
    };

    /**
     * Updates a value at a specific time
     * @param {number} time
     * @prototype
     */
    Tw2TransformTrack.prototype.UpdateValue = function(time)
    {
        if (!this.res || !this.res.IsGood())
        {
            return;
        }
        if (!this.positionCurve)
        {
            this.FindTracks();
        }
        if (!this.positionCurve)
        {
            return;
        }

        if (this.cycle)
        {
            time = time % this.duration;
        }
        if (time > this.duration || time < 0)
        {
            return;
        }

        this.EvaluateCurve(this.positionCurve, time, this.translation, this.cycle, this.duration);
        this.EvaluateCurve(this.orientationCurve, time, this.rotation, this.cycle, this.duration);
        quat4.normalize(this.rotation);
        this.EvaluateCurve(this.scaleCurve, time, this._scaleShear, this.cycle, this.duration);
        this.scale[0] = vec3.length(this.scaleCurve);
        this.scale[1] = vec3.length(this.scaleCurve.subarray(3, 6));
        this.scale[2] = vec3.length(this.scaleCurve.subarray(6, 9));
    };

    /**
     * FindTracks
     * @prototype
     */
    Tw2TransformTrack.prototype.FindTracks = function()
    {
        var i;

        var group = null;
        for (i = 0; i < this.res.animations.length; ++i)
        {
            for (var j = 0; j < this.res.animations[i].trackGroups.length; ++j)
            {
                if (this.res.animations[i].trackGroups[j].name == this.group)
                {
                    this.duration = this.res.animations[i].duration;
                    group = this.res.animations[i].trackGroups[j];
                    break;
                }
            }
        }
        if (!group)
        {
            return;
        }
        for (i = 0; i < group.transformTracks.length; ++i)
        {
            if (this.name == group.transformTracks[i].name)
            {
                this.positionCurve = group.transformTracks[i].position;
                this.orientationCurve = group.transformTracks[i].orientation;
                this.scaleCurve = group.transformTracks[i].scaleShear;
                break;
            }
        }
    };

    /**
     * Tw2Vector2Key
     * @property {number} time
     * @property {Float32Array} value - vec2 array
     * @property {Float32Array} leftTangent - vec2 array
     * @property {Float32Array} rightTangent - vec2 array
     * @property {number} interpolation
     * @constructor
     */
    function Tw2Vector2Key()
    {
        this.time = 0;
        this.value = new Float32Array(2);
        this.leftTangent = new Float32Array(2);
        this.rightTangent = new Float32Array(2);
        this.interpolation = 1;
    }

    /**
     * Tw2Vector2Curve
     * @property {string} name
     * @property {number} length
     * @property {boolean} cycle
     * @property {boolean} reversed
     * @property {number} timeOffset
     * @property {number} timeScale
     * @property {Float32Array} startValue - vec2 array
     * @property {Float32Array} currentValue - vec2 array
     * @property {Float32Array} endValue - vec2 array
     * @property {Float32Array} startTangent - vec2 array
     * @property {Float32Array} endTangent - vec2 array
     * @property {number} interpolation
     * @property {Array.<Tw2Vector2Key>} keys
     * @constructor
     */
    function Tw2Vector2Curve()
    {
        this.name = '';
        this.length = 0;
        this.cycle = false;
        this.reversed = false;
        this.timeOffset = 0;
        this.timeScale = 1;
        this.startValue = new Float32Array(2);
        this.currentValue = new Float32Array(2);
        this.endValue = new Float32Array(2);
        this.startTangent = new Float32Array(2);
        this.endTangent = new Float32Array(2);
        this.interpolation = 1;
        this.keys = [];
    }

    /**
     * Initializes the Curve
     * @prototype
     */
    Tw2Vector2Curve.prototype.Initialize = function()
    {
        this.Sort();
    };

    /**
     * Gets curve length
     * @returns {number}
     * @prototype
     */
    Tw2Vector2Curve.prototype.GetLength = function()
    {
        return this.length;
    };

    /**
     * Compares two curve keys' time properties
     * @param {Tw2Vector2Key} a
     * @param {Tw2Vector2Key} b
     * @returns {number}
     * @method
     */
    Tw2Vector2Curve.Compare = function(a, b)
    {
        if (a.time < b.time)
        {
            return -1;
        }
        if (a.time > b.time)
        {
            return 1;
        }
        return 0;
    };

    /**
     * Sorts the curve's keys
     * @prototype
     */
    Tw2Vector2Curve.prototype.Sort = function()
    {
        if (this.keys.length)
        {
            this.keys.sort(Tw2Vector2Curve.Compare);
            var back = this.keys[this.keys.length - 1];
            if (back.time > this.length)
            {
                var preLength = this.length;
                var endValue = this.endValue;
                var endTangent = this.endTangent;
                this.length = back.time;
                this.endValue = back.value;
                this.endTangent = back.leftTangent;
                if (preLength > 0)
                {
                    back.time = preLength;
                    back.value = endValue;
                    back.leftTangent = endTangent;
                }
            }
        }
    };

    /**
     * Updates a value at a specific time
     * @param {number} time
     * @prototype
     */
    Tw2Vector2Curve.prototype.UpdateValue = function(time)
    {
        this.GetValueAt(time, this.currentValue);
    };

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @param {Float32Array} value - vec2 array
     * @returns {Float32Array} vec2 array
     * @prototype
     */
    Tw2Vector2Curve.prototype.GetValueAt = function(time, value)
    {
        time = time / this.timeScale + this.timeOffset;
        if (this.length <= 0 || time <= 0)
        {
            value[0] = this.startValue[0];
            value[1] = this.startValue[1];
            return value;
        }
        if (time > this.length)
        {
            if (this.cycle)
            {
                time = time % this.length;
            }
            else if (this.reversed)
            {
                value[0] = this.startValue[0];
                value[1] = this.startValue[1];
                return value;
            }
            else
            {
                value[0] = this.endValue[0];
                value[1] = this.endValue[1];
                return value;
            }
        }
        if (this.reversed)
        {
            time = this.length - time;
        }
        if (this.keys.length == 0)
        {
            return this.Interpolate(time, null, null, value);
        }
        var startKey = this.keys[0];
        if (time <= startKey.time)
        {
            return this.Interpolate(time, null, startKey, value);
        }
        else if (time >= this.keys[this.keys.length - 1].time)
        {
            return this.Interpolate(time, this.keys[this.keys.length - 1], null, value);
        }
        var endKey;
        for (var i = 0; i + 1 < this.keys.length; ++i)
        {
            startKey = this.keys[i];
            endKey = this.keys[i + 1];
            if (startKey.time <= time && endKey.time > time)
            {
                break;
            }
        }
        return this.Interpolate(time, startKey, endKey, value);
    };

    /**
     * Interpolate
     * @param {number} time
     * @param {Tw2Vector2Key} lastKey
     * @param {Tw2Vector2Key} nextKey
     * @param {Float32Array} value - vec2 array
     * @returns {Float32Array} vec2 array
     * @prototype
     */
    Tw2Vector2Curve.prototype.Interpolate = function(time, lastKey, nextKey, value)
    {
        value[0] = this.startValue[0];
        value[1] = this.startValue[1];

        var startValue = this.startValue;
        var endValue = this.endValue;
        var interp = this.interpolation;
        var deltaTime = this.length;
        if (lastKey != null)
        {
            interp = lastKey.interpolation;
            time -= lastKey.time;
        }
        switch (interp)
        {
            case 1:
                if (lastKey && nextKey)
                {
                    startValue = lastKey.value;
                    endValue = nextKey.value;
                    deltaTime = nextKey.time - lastKey.time;
                }
                else if (nextKey)
                {
                    endValue = nextKey.value;
                    deltaTime = nextKey.time;
                }
                else if (lastKey)
                {
                    startValue = lastKey.value;
                    deltaTime = this.length - lastKey.time;
                }
                value[0] = startValue[0] + (endValue[0] - startValue[0]) * (time / deltaTime);
                value[1] = startValue[1] + (endValue[1] - startValue[1]) * (time / deltaTime);
                return value;
            case 2:
                var inTangent = this.startTangent;
                var outTangent = this.endTangent;
                if (lastKey && nextKey)
                {
                    startValue = lastKey.value;
                    inTangent = lastKey.rightTangent;
                    endValue = nextKey.value;
                    outTangent = nextKey.leftTangent;
                    deltaTime = nextKey.time - lastKey.time;
                }
                else if (nextKey)
                {
                    endValue = nextKey.value;
                    outTangent = nextKey.leftTangent;
                    deltaTime = nextKey.time;
                }
                else if (lastKey)
                {
                    startValue = lastKey.value;
                    inTangent = lastKey.rightTangent;
                    deltaTime = this.length - lastKey.time;
                }
                var s = time / deltaTime;
                var s2 = s * s;
                var s3 = s2 * s;

                var c2 = -2.0 * s3 + 3.0 * s2;
                var c1 = 1.0 - c2;
                var c4 = s3 - s2;
                var c3 = s + c4 - s2;

                value[0] = startValue[0] * c1 + endValue[0] * c2 + inTangent[0] * c3 + outTangent[0] * c4;
                value[1] = startValue[1] * c1 + endValue[1] * c2 + inTangent[1] * c3 + outTangent[1] * c4;
                return value;
        }
        return value;
    };

    /**
     * Tw2Vector3Key
     * @property {number} time
     * @property {vec3} value
     * @property {vec3} leftTangent
     * @property {vec3} rightTangent
     * @property {number} interpolation
     * @constructor
     */
    function Tw2Vector3Key()
    {
        this.time = 0;
        this.value = vec3.create();
        this.leftTangent = vec3.create();
        this.rightTangent = vec3.create();
        this.interpolation = 1;
    }

    /**
     * Tw2Vector3Curve
     * @property {string} name
     * @property {number} length
     * @property {boolean} cycle
     * @property {boolean} reversed
     * @property {number} timeOffset
     * @property {number} timeScale
     * @property {vec3} startValue
     * @property {vec3} currentValue
     * @property {vec3} endValue
     * @property {vec3} startTangent
     * @property {vec3} endTangent
     * @property {number} interpolation
     * @property {Array.<Tw2Vector3Key>} keys
     * @constructor
     */
    function Tw2Vector3Curve()
    {
        this.name = '';
        this.length = 0;
        this.cycle = false;
        this.reversed = false;
        this.timeOffset = 0;
        this.timeScale = 1;
        this.startValue = vec3.create();
        this.currentValue = vec3.create();
        this.endValue = vec3.create();
        this.startTangent = vec3.create();
        this.endTangent = vec3.create();
        this.interpolation = 1;
        this.keys = [];
    }

    /**
     * Initializes the Curve
     * @prototype
     */
    Tw2Vector3Curve.prototype.Initialize = function()
    {
        this.Sort();
    };

    /**
     * Gets curve length
     * @returns {number}
     * @prototype
     */
    Tw2Vector3Curve.prototype.GetLength = function()
    {
        return this.length;
    };

    /**
     * Compares two curve keys' time properties
     * @param {Tw2Vector3Key} a
     * @param {Tw2Vector3Key} b
     * @returns {number}
     * @method
     */
    Tw2Vector3Curve.Compare = function(a, b)
    {
        if (a.time < b.time)
        {
            return -1;
        }
        if (a.time > b.time)
        {
            return 1;
        }
        return 0;
    };

    /**
     * Sorts the curve's keys
     * @prototype
     */
    Tw2Vector3Curve.prototype.Sort = function()
    {
        if (this.keys.length)
        {
            this.keys.sort(Tw2Vector3Curve.Compare);
            var back = this.keys[this.keys.length - 1];
            if (back.time > this.length)
            {
                var preLength = this.length;
                var endValue = this.endValue;
                var endTangent = this.endTangent;
                this.length = back.time;
                this.endValue = back.value;
                this.endTangent = back.leftTangent;
                if (preLength > 0)
                {
                    back.time = preLength;
                    back.value = endValue;
                    back.leftTangent = endTangent;
                }
            }
        }
    };

    /**
     * Updates a value at a specific time
     * @param {number} time
     * @prototype
     */
    Tw2Vector3Curve.prototype.UpdateValue = function(time)
    {
        this.GetValueAt(time, this.currentValue);
    };

    /**
     * Gets a value at a specific time
     * TODO: the variable `i` is used before it has been initialized
     * @param {number} time
     * @param {vec3} value
     * @returns {vec3}
     * @prototype
     */
    Tw2Vector3Curve.prototype.GetValueAt = function(time, value)
    {
        time = time / this.timeScale + this.timeOffset;
        if (this.length <= 0 || time <= 0)
        {
            value[0] = this.startValue[0];
            value[1] = this.startValue[1];
            value[2] = this.startValue[2];
            return value;
        }
        if (time > this.length)
        {
            if (this.cycle)
            {
                time = time % this.length;
            }
            else if (this.reversed)
            {
                value[0] = this.startValue[0];
                value[1] = this.startValue[1];
                value[2] = this.startValue[2];
                return value;
            }
            else
            {
                value[0] = this.endValue[0];
                value[1] = this.endValue[1];
                value[2] = this.endValue[2];
                return value;
            }
        }
        if (this.reversed)
        {
            time = this.length - time;
        }
        if (this.keys.length == 0)
        {
            return this.Interpolate(time, null, null, value);
        }
        var startKey = this.keys[0];
        if (time <= startKey.time)
        {
            return this.Interpolate(time, null, startKey, value);
        }
        else if (time >= this.keys[this.keys.length - 1].time)
        {
            return this.Interpolate(time, this.keys[this.keys.length - 1], null, value);
        }
        var endKey;
        for (var i = 0; i + 1 < this.keys.length; ++i)
        {
            startKey = this.keys[i];
            endKey = this.keys[i + 1];
            if (startKey.time <= time && endKey.time > time)
            {
                break;
            }
        }
        return this.Interpolate(time, startKey, endKey, value);
    };

    /**
     * Interpolate
     * @param {number} time
     * @param {Tw2Vector3Key} lastKey
     * @param {Tw2Vector3Key} nextKey
     * @param {vec3} value
     * @returns {vec3}
     * @prototype
     */
    Tw2Vector3Curve.prototype.Interpolate = function(time, lastKey, nextKey, value)
    {
        value[0] = this.startValue[0];
        value[1] = this.startValue[1];
        value[2] = this.startValue[2];

        var startValue = this.startValue;
        var endValue = this.endValue;
        var interp = this.interpolation;
        var deltaTime = this.length;
        if (lastKey != null)
        {
            interp = lastKey.interpolation;
            time -= lastKey.time;
        }
        switch (interp)
        {
            case 1:
                if (lastKey && nextKey)
                {
                    startValue = lastKey.value;
                    endValue = nextKey.value;
                    deltaTime = nextKey.time - lastKey.time;
                }
                else if (nextKey)
                {
                    endValue = nextKey.value;
                    deltaTime = nextKey.time;
                }
                else if (lastKey)
                {
                    startValue = lastKey.value;
                    deltaTime = this.length - lastKey.time;
                }
                value[0] = startValue[0] + (endValue[0] - startValue[0]) * (time / deltaTime);
                value[1] = startValue[1] + (endValue[1] - startValue[1]) * (time / deltaTime);
                value[2] = startValue[2] + (endValue[2] - startValue[2]) * (time / deltaTime);
                return value;
            case 2:
                var inTangent = this.startTangent;
                var outTangent = this.endTangent;
                if (lastKey && nextKey)
                {
                    startValue = lastKey.value;
                    inTangent = lastKey.rightTangent;
                    endValue = nextKey.value;
                    outTangent = nextKey.leftTangent;
                    deltaTime = nextKey.time - lastKey.time;
                }
                else if (nextKey)
                {
                    endValue = nextKey.value;
                    outTangent = nextKey.leftTangent;
                    deltaTime = nextKey.time;
                }
                else if (lastKey)
                {
                    startValue = lastKey.value;
                    inTangent = lastKey.rightTangent;
                    deltaTime = this.length - lastKey.time;
                }
                var s = time / deltaTime;
                var s2 = s * s;
                var s3 = s2 * s;

                var c2 = -2.0 * s3 + 3.0 * s2;
                var c1 = 1.0 - c2;
                var c4 = s3 - s2;
                var c3 = s + c4 - s2;

                value[0] = startValue[0] * c1 + endValue[0] * c2 + inTangent[0] * c3 + outTangent[0] * c4;
                value[1] = startValue[1] * c1 + endValue[1] * c2 + inTangent[1] * c3 + outTangent[1] * c4;
                value[2] = startValue[2] * c1 + endValue[2] * c2 + inTangent[2] * c3 + outTangent[2] * c4;
                return value;
        }
        return value;
    };

    /**
     * Tw2VectorKey
     * @property {number} time
     * @property {vec3} value
     * @property {vec3} left
     * @property {vec3} right
     * @property {number} interpolation
     * @constructor
     */
    function Tw2VectorKey()
    {
        this.time = 0;
        this.value = vec3.create();
        this.left = vec3.create();
        this.right = vec3.create();
        this.interpolation = 0;
    }

    /**
     * Tw2Vector3Curve
     * @property {string} name
     * @property {number} start
     * @property {number} length
     * @property {vec3} value
     * @property {number} extrapolation
     * @property {Array.<Tw2VectorKey>} keys
     * @property {number} _currKey
     * @constructor
     */
    function Tw2VectorCurve()
    {
        this.name = '';
        this.start = 0;
        this.length = 0;
        this.value = vec3.create();
        this.extrapolation = 0;
        this.keys = [];
        this._currKey = 1;
    }

    /**
     * Updates a value at a specific time
     * @param {number} time
     * @prototype
     */
    Tw2VectorCurve.prototype.UpdateValue = function(time)
    {
        this.GetValueAt(time, this.value);
    };

    /**
     * Gets curve length
     * @returns {number}
     * @prototype
     */
    Tw2VectorCurve.prototype.GetLength = function()
    {
        return this.length;
    };

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @param {vec3} value
     * @returns {vec3}
     * @prototype
     */
    Tw2VectorCurve.prototype.GetValueAt = function(time, value)
    {
        var d;

        if (this.length == 0)
        {
            value[0] = this.value[0];
            value[1] = this.value[1];
            value[2] = this.value[2];
            return value;
        }

        var firstKey = this.keys[0];
        var lastKey = this.keys[this.keys.length - 1];
        if (time >= lastKey.time)
        {
            if (this.extrapolation == 0)
            {
                value[0] = this.value[0];
                value[1] = this.value[1];
                value[2] = this.value[2];
                return value;
            }
            else if (this.extrapolation == 1)
            {
                value[0] = lastKey.value[0];
                value[1] = lastKey.value[1];
                value[2] = lastKey.value[2];
                return value;
            }
            else if (this.extrapolation == 2)
            {
                d = time - lastKey.time;
                value[0] = lastKey.value[0] + d * lastKey.right[0];
                value[1] = lastKey.value[1] + d * lastKey.right[1];
                value[2] = lastKey.value[2] + d * lastKey.right[2];
                return value;
            }
            else
            {
                time = time % lastKey.time;
            }
        }
        else if (time < 0 || time < firstKey.time)
        {
            if (this.extrapolation == 0)
            {
                value[0] = this.value[0];
                value[1] = this.value[1];
                value[2] = this.value[2];
                return value;
            }
            else if (this.extrapolation == 2)
            {
                d = time * this.length - lastKey.time;
                value[0] = firstKey.value[0] + d * firstKey.left[0];
                value[1] = firstKey.value[1] + d * firstKey.left[1];
                value[2] = firstKey.value[2] + d * firstKey.left[2];
                return value;
            }
            else
            {
                value[0] = firstKey.value[0];
                value[1] = firstKey.value[1];
                value[2] = firstKey.value[2];
                return value;
            }
        }
        var ck = this.keys[this._currKey];
        var ck_1 = this.keys[this._currKey - 1];
        while ((time >= ck.time) || (time < ck_1.time))
        {
            if (time < ck_1.time)
            {
                this._currKey = 0;
            }
            this._currKey++;
            ck = this.keys[this._currKey];
            ck_1 = this.keys[this._currKey - 1];
        }

        var nt = (time - ck_1.time) / (ck.time - ck_1.time);
        if (ck_1.interpolation == 1)
        {
            value[0] = ck_1.value[0];
            value[1] = ck_1.value[1];
            value[2] = ck_1.value[2];
        }
        else if (ck_1.interpolation == 2)
        {
            value[0] = ck_1.value[0] * (1 - nt) + ck.value[0] * nt;
            value[1] = ck_1.value[1] * (1 - nt) + ck.value[1] * nt;
            value[2] = ck_1.value[2] * (1 - nt) + ck.value[2] * nt;
        }
        else if (ck_1.interpolation == 3)
        {
            var k3 = 2 * nt * nt * nt - 3 * nt * nt + 1;
            var k2 = -2 * nt * nt * nt + 3 * nt * nt;
            var k1 = nt * nt * nt - 2 * nt * nt + nt;
            var k0 = nt * nt * nt - nt * nt;

            value[0] = k3 * ck_1.value[0] + k2 * ck.value[0] + k1 * ck_1.right[0] + k0 * ck.left[0];
            value[1] = k3 * ck_1.value[1] + k2 * ck.value[1] + k1 * ck_1.right[1] + k0 * ck.left[1];
            value[2] = k3 * ck_1.value[2] + k2 * ck.value[2] + k1 * ck_1.right[2] + k0 * ck.left[2];
        }
        return value;
    };

    /**
     * Tw2VectorSequencer
     * @property {string} name
     * @property {number} start
     * @property {vec3} value
     * @property {number} operator
     * @property {Array} functions
     * @property {vec3} _tempValue
     * @constructor
     */
    function Tw2VectorSequencer()
    {
        this.name = '';
        this.start = 0;
        this.value = vec3.create();
        this.operator = 0;
        this.functions = [];
        this._tempValue = vec3.create();
    }

    /**
     * Gets curve length
     * @returns {number}
     * @prototype
     */
    Tw2VectorSequencer.prototype.GetLength = function()
    {
        var length = 0;
        for (var i = 0; i < this.functions.length; ++i)
        {
            if ('GetLength' in this.functions[i])
            {
                length = Math.max(length, this.functions[i].GetLength());
            }
        }
        return length;
    };

    /**
     * Updates a value at a specific time
     * @param {number} time
     * @prototype
     */
    Tw2VectorSequencer.prototype.UpdateValue = function(time)
    {
        this.GetValueAt(time, this.value);
    };

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @param {vec3} value
     * @returns {vec3}
     * @prototype
     */
    Tw2VectorSequencer.prototype.GetValueAt = function(time, value)
    {
        var tempValue, functions, i;

        if (this.operator == 0)
        {
            value[0] = 1;
            value[1] = 1;
            value[2] = 1;
            tempValue = this._tempValue;
            functions = this.functions;
            for (i = 0; i < functions.length; ++i)
            {
                functions[i].GetValueAt(time, tempValue);
                value[0] *= tempValue[0];
                value[1] *= tempValue[1];
                value[2] *= tempValue[2];
            }
        }
        else
        {
            value[0] = 0;
            value[1] = 0;
            value[2] = 0;
            tempValue = this._tempValue;
            functions = this.functions;
            for (i = 0; i < functions.length; ++i)
            {
                functions[i].GetValueAt(time, tempValue);
                value[0] += tempValue[0];
                value[1] += tempValue[1];
                value[2] += tempValue[2];
            }
        }
        return value;
    };

    /**
     * Tw2XYZScalarSequencer
     * @property {string} name
     * @property {vec3} value
     * @property XCurve
     * @property YCurve
     * @property ZCurve
     * @constructor
     */
    function Tw2XYZScalarSequencer()
    {
        this.name = '';
        this.value = vec3.create();
        this.XCurve = null;
        this.YCurve = null;
        this.ZCurve = null;
    }

    /**
     * Gets curve length
     * @returns {number}
     * @prototype
     */
    Tw2XYZScalarSequencer.prototype.GetLength = function()
    {
        var length = 0;
        if (this.XCurve && ('GetLength' in this.XCurve))
        {
            length = this.XCurve.GetLength();
        }
        if (this.YCurve && ('GetLength' in this.YCurve))
        {
            length = Math.max(length, this.YCurve.GetLength());
        }
        if (this.ZCurve && ('GetLength' in this.ZCurve))
        {
            length = Math.max(length, this.ZCurve.GetLength());
        }
        return length;
    };

    /**
     * Updates a value at a specific time
     * @param {number} time
     * @prototype
     */
    Tw2XYZScalarSequencer.prototype.UpdateValue = function(time)
    {
        this.GetValueAt(time, this.value);
    };

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @param {vec3} value
     * @returns {vec3}
     * @prototype
     */
    Tw2XYZScalarSequencer.prototype.GetValueAt = function(time, value)
    {
        if (this.XCurve)
        {
            value[0] = this.XCurve.GetValueAt(time);
        }
        else
        {
            value[0] = 0;
        }
        if (this.YCurve)
        {
            value[1] = this.YCurve.GetValueAt(time);
        }
        else
        {
            value[1] = 0;
        }
        if (this.ZCurve)
        {
            value[2] = this.ZCurve.GetValueAt(time);
        }
        else
        {
            value[2] = 0;
        }
        return value;
    };

    /**
     * Tw2YPRSequencer
     * @property {string} name
     * @property {quat4} value=[0,0,0,1]
     * @property {vec3} YawPitchRoll
     * @property YawCurve
     * @property PitchCurve
     * @property RollCurve
     * @constructor
     */
    function Tw2YPRSequencer()
    {
        this.name = '';
        this.value = quat4.create([0, 0, 0, 1]);
        this.YawPitchRoll = vec3.create();
        this.YawCurve = null;
        this.PitchCurve = null;
        this.RollCurve = null;
    }

    /**
     * Gets curve length
     * @returns {number}
     * @prototype
     */
    Tw2YPRSequencer.prototype.GetLength = function()
    {
        var length = 0;
        if (this.YawCurve && ('GetLength' in this.YawCurve))
        {
            length = this.YawCurve.GetLength();
        }
        if (this.PitchCurve && ('GetLength' in this.PitchCurve))
        {
            length = Math.max(length, this.PitchCurve.GetLength());
        }
        if (this.RollCurve && ('GetLength' in this.RollCurve))
        {
            length = Math.max(length, this.RollCurve.GetLength());
        }
        return length;
    };

    /**
     * Updates a value at a specific time
     * @param {number} time
     * @prototype
     */
    Tw2YPRSequencer.prototype.UpdateValue = function(time)
    {
        this.GetValueAt(time, this.value);
    };

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @param {quat4} value
     * @returns {quat4}
     * @prototype
     */
    Tw2YPRSequencer.prototype.GetValueAt = function(time, value)
    {
        if (this.YawCurve)
        {
            this.YawPitchRoll[0] = this.YawCurve.GetValueAt(time);
        }
        if (this.PitchCurve)
        {
            this.YawPitchRoll[1] = this.PitchCurve.GetValueAt(time);
        }
        if (this.RollCurve)
        {
            this.YawPitchRoll[2] = this.RollCurve.GetValueAt(time);
        }

        var sinYaw = Math.sin(this.YawPitchRoll[0] / 180 * Math.PI / 2.0);
        var cosYaw = Math.cos(this.YawPitchRoll[0] / 180 * Math.PI / 2.0);
        var sinPitch = Math.sin(this.YawPitchRoll[1] / 180 * Math.PI / 2.0);
        var cosPitch = Math.cos(this.YawPitchRoll[1] / 180 * Math.PI / 2.0);
        var sinRoll = Math.sin(this.YawPitchRoll[2] / 180 * Math.PI / 2.0);
        var cosRoll = Math.cos(this.YawPitchRoll[2] / 180 * Math.PI / 2.0);

        value[0] = sinYaw * cosPitch * sinRoll + cosYaw * sinPitch * cosRoll;
        value[1] = sinYaw * cosPitch * cosRoll - cosYaw * sinPitch * sinRoll;
        value[2] = cosYaw * cosPitch * sinRoll - sinYaw * sinPitch * cosRoll;
        value[3] = cosYaw * cosPitch * cosRoll + sinYaw * sinPitch * sinRoll;

        return value;
    };

    /**
     * Tw2MayaAnimationEngine
     * TODO: Constructor is missing the prototype `_EvaluteBezier`
     * @property {Array} curves
     * @property {Array} hermiteSegments
     * @property {Array} bezierSegments
     * @property {number} _currentCurveIndex
     * @property _evalCache
     * @constructor
     */
    function Tw2MayaAnimationEngine()
    {
        this.curves = [];
        this.hermiteSegments = [];
        this.bezierSegments = [];
        this._currentCurveIndex = 0;
        this._evalCache = null;
    }

    Tw2MayaAnimationEngine.AnimCurveFields = {
        NUM_SEGMENTS: 0,
        SEGMENT_OFFSET: 1,
        END_TIME: 2,
        END_VALUE: 3,
        IN_TANGENT: 4,
        OUT_TANGENT: 5,
        PRE_INFINITY: 6,
        POST_INFINITY: 7,
        IS_WEIGHTED: 8
    };

    Tw2MayaAnimationEngine.AnimSegment = {
        TIME: 0,
        VALUE: 1
    };

    Tw2MayaAnimationEngine.HermiteSegment = {
        TIME: 0,
        VALUE: 1,
        COEFF: 2,
        IS_STEP: 3,
        IS_STEP_NEXT: 4
    };

    Tw2MayaAnimationEngine.BezierSegment = {
        TIME: 0,
        VALUE: 1,
        COEFF: 2,
        POLYY: 3,
        IS_STEP: 4,
        IS_STEP_NEXT: 5,
        IS_LINEAR: 6
    };

    Tw2MayaAnimationEngine.INFINITY = 0;

    /**
     * Evaluate
     * @param curveIndex
     * @param time
     * @returns {*}
     * @prototype
     */
    Tw2MayaAnimationEngine.prototype.Evaluate = function(curveIndex, time)
    {
        if (this.curves.length <= curveIndex)
        {
            return 0;
        }
        this._currentCurveIndex = curveIndex;
        if (!this._evalCache)
        {
            this._evalCache = new Array(this.curves.length);
            for (var i = 0; i < this._evalCache.length; ++i)
            {
                this._evalCache[i] = -1;
            }
        }

        var animCurve = this.curves[curveIndex];
        var firstSegment = animCurve[Tw2MayaAnimationEngine.AnimCurveFields.SEGMENT_OFFSET];
        var segments = null;

        if (animCurve[Tw2MayaAnimationEngine.AnimCurveFields.IS_WEIGHTED])
        {
            segments = this.bezierSegments;
        }
        else
        {
            segments = this.hermiteSegments;
        }
        if (time < segments[firstSegment][Tw2MayaAnimationEngine.AnimSegment.TIME])
        {
            if (animCurve[Tw2MayaAnimationEngine.AnimCurveFields.PRE_INFINITY] == Tw2MayaAnimationEngine.INFINITY)
            {
                return segments[firstSegment][Tw2MayaAnimationEngine.AnimSegment.VALUE];
            }
            return this._EvaluateInfinities(animCurve, segments, firstSegment, time, true);
        }
        if (time > animCurve[Tw2MayaAnimationEngine.AnimCurveFields.END_TIME])
        {
            if (animCurve[Tw2MayaAnimationEngine.AnimCurveFields.POST_INFINITY] == Tw2MayaAnimationEngine.INFINITY)
            {
                return animCurve[Tw2MayaAnimationEngine.AnimCurveFields.END_VALUE];
            }
            return this._EvaluateInfinities(animCurve, segments, firstSegment, time, false);
        }
        return this._EvaluateImpl(animCurve, segments, firstSegment, time);
    };

    /**
     * _EvaluateImpl
     * @param animCurve
     * @param segments
     * @param firstSegment
     * @param time
     * @returns {*}
     * @private
     */
    Tw2MayaAnimationEngine.prototype._EvaluateImpl = function(animCurve, segments, firstSegment, time)
    {
        var withinInterval = false;
        var nextSegment = null;
        var lastSegment = null;
        var index;
        var value = 0;

        if (this._evalCache[this._currentCurveIndex] >= 0)
        {
            lastSegment = firstSegment + this._evalCache[this._currentCurveIndex];
            if (this._evalCache[this._currentCurveIndex] < animCurve[Tw2MayaAnimationEngine.AnimCurveFields.NUM_SEGMENTS - 1] && time > segments[lastSegment][Tw2MayaAnimationEngine.AnimSegment.TIME])
            {
                nextSegment = firstSegment + this._evalCache[this._currentCurveIndex] + 1;
                if (time == segments[nextSegment][Tw2MayaAnimationEngine.AnimSegment.TIME])
                {
                    this._evalCache[this._currentCurveIndex]++;
                    return segments[nextSegment][Tw2MayaAnimationEngine.AnimSegment.VALUE];
                }
                else if (time < segments[nextSegment][Tw2MayaAnimationEngine.AnimSegment.TIME])
                {
                    index = this._evalCache[this._currentCurveIndex] + 1;
                    withinInterval = true;
                }
                else
                {
                    nextSegment = null;
                }
            }
            else if (this._evalCache[this._currentCurveIndex] > 0 && time < segments[lastSegment][Tw2MayaAnimationEngine.AnimSegment.TIME])
            {
                var prevSegment = firstSegment + this._evalCache[this._currentCurveIndex] - 1;
                if (time > segments[prevSegment][Tw2MayaAnimationEngine.AnimSegment.TIME])
                {
                    index = this._evalCache[this._currentCurveIndex];
                    withinInterval = true;
                }
                else if (time == segments[prevSegment][Tw2MayaAnimationEngine.AnimSegment.TIME])
                {
                    this._evalCache[this._currentCurveIndex]--;
                    return segments[prevSegment][Tw2MayaAnimationEngine.AnimSegment.VALUE];
                }
            }
        }

        if (!withinInterval)
        {
            var result = this._Find(animCurve, time, segments, firstSegment);
            index = result[1];
            if (result[0] || index == 0)
            {
                if (index == animCurve[Tw2MayaAnimationEngine.AnimCurveFields.NUM_SEGMENTS])
                {
                    index--;
                    this._evalCache[this._currentCurveIndex] = index;
                    return animCurve[Tw2MayaAnimationEngine.AnimCurveFields.END_VALUE];
                }
                else
                {
                    this._evalCache[this._currentCurveIndex] = index;
                    return segments[firstSegment + index][Tw2MayaAnimationEngine.AnimSegment.VALUE];
                }
            }
            else if (index == animCurve[Tw2MayaAnimationEngine.AnimCurveFields.NUM_SEGMENTS] + 1)
            {
                this._evalCache[this._currentCurveIndex] = 0;
                return animCurve[Tw2MayaAnimationEngine.AnimCurveFields.END_VALUE];
            }
        }

        if (this._evalCache[this._currentCurveIndex] != index - 1)
        {
            this._evalCache[this._currentCurveIndex] = index - 1;
            lastSegment = firstSegment + this._evalCache[this._currentCurveIndex];
            if (nextSegment == null)
            {
                nextSegment = firstSegment + index;
            }
        }

        if (animCurve[Tw2MayaAnimationEngine.AnimCurveFields.IS_WEIGHTED])
        {
            var bSegment = segments[lastSegment];
            if (bSegment[Tw2MayaAnimationEngine.BezierSegment.IS_STEP])
            {
                return bSegment[Tw2MayaAnimationEngine.BezierSegment.VALUE];
            }
            else if (bSegment[Tw2MayaAnimationEngine.BezierSegment.IS_STEP_NEXT])
            {
                if (nextSegment === null)
                {
                    return animCurve[Tw2MayaAnimationEngine.AnimCurveFields.END_VALUE];
                }
                return segments[nextSegment][Tw2MayaAnimationEngine.BezierSegment.VALUE];
            }
            else
            {
                var nextKeyTime = animCurve[Tw2MayaAnimationEngine.AnimCurveFields.END_TIME];
                if (this._evalCache[this._currentCurveIndex] + 1 < animCurve[Tw2MayaAnimationEngine.AnimCurveFields.NUM_SEGMENTS])
                {
                    nextKeyTime = segments[nextSegment][Tw2MayaAnimationEngine.BezierSegment.TIME];
                }
                return this._EvaluateBezier(bSegment, time, nextKeyTime);
            }
        }
        else
        {
            var hSegment = segments[lastSegment];
            if (hSegment[Tw2MayaAnimationEngine.HermiteSegment.IS_STEP])
            {
                return hSegment[Tw2MayaAnimationEngine.HermiteSegment.VALUE];
            }
            else if (hSegment[Tw2MayaAnimationEngine.HermiteSegment.IS_STEP_NEXT])
            {
                if (nextSegment === null)
                {
                    return animCurve[Tw2MayaAnimationEngine.AnimCurveFields.END_VALUE];
                }
                return segments[nextSegment][Tw2MayaAnimationEngine.HermiteSegment.VALUE];
            }
            else
            {
                return this._EvaluateHermite(hSegment, time);
            }
        }
    };

    /**
     * _EvaluateHermite
     * @param segment
     * @param time
     * @returns {*}
     * @private
     */
    Tw2MayaAnimationEngine.prototype._EvaluateHermite = function(segment, time)
    {
        var t = time - segment[Tw2MayaAnimationEngine.HermiteSegment.TIME];
        var coeff = segment[Tw2MayaAnimationEngine.HermiteSegment.COEFF];
        return (t * (t * (t * coeff[0] + coeff[1]) + coeff[2]) + coeff[3]);
    };

    /**
     * _EvaluateBezier
     * TODO: This function possibly has multiple errors
     * @param segment
     * @param time
     * @param nextKeyTime
     * @returns {*}
     * @private
     */
    Tw2MayaAnimationEngine.prototype._EvaluateBezier = function(segment, time, nextKeyTime)
    {
        var t, s;

        s = (time - segment[Tw2MayaAnimationEngine.BezierSegment.TIME]) / (nextSegmentTime - segment[Tw2MayaAnimationEngine.BezierSegment.TIME]);

        if (segment[Tw2MayaAnimationEngine.BezierSegment.IS_LINEAR])
        {
            t = s;
        }
        else
        {
            var poly3 = segment[Tw2MayaAnimationEngine.BezierSegment.COEFF][3];
            var poly2 = segment[Tw2MayaAnimationEngine.BezierSegment.COEFF][2];
            var poly1 = segment[Tw2MayaAnimationEngine.BezierSegment.COEFF][1];
            var poly0 = segment[Tw2MayaAnimationEngine.BezierSegment.COEFF][0] - s;
            var roots = [];
            if (polyZeroes(poly, 3, 0.0, 1, 1.0, 1, roots) == 1)
            {
                t = roots[0];
            }
            else
            {
                t = 0.0;
            }
        }
        var poly = segment[Tw2MayaAnimationEngine.BezierSegment.POLYY];
        return (t * (t * (t * poly[3] + poly[2]) + poly[1]) + poly[0]);
    };

    /**
     * _Find
     * @param animCurve
     * @param time
     * @param segments
     * @param firstSegment
     * @returns {*}
     * @private
     */
    Tw2MayaAnimationEngine.prototype._Find = function(animCurve, time, segments, firstSegment)
    {
        var len, mid, low, high;

        /* use a binary search to find the key */
        var index = 0;
        len = animCurve[Tw2MayaAnimationEngine.AnimCurveFields.NUM_SEGMENTS] + 1;
        var segment = null;
        var stime = 0.0;

        if (len > 0)
        {
            low = 0;
            high = len - 1;
            do {
                mid = (low + high) >> 1;
                if (mid < (len - 1))
                {
                    segment = firstSegment + mid;
                    stime = segments[segment][Tw2MayaAnimationEngine.AnimSegment.TIME];
                }
                else
                {
                    stime = animCurve[Tw2MayaAnimationEngine.AnimCurveFields.END_TIME];
                }

                if (time < stime)
                {
                    high = mid - 1;
                }
                else if (time > stime)
                {
                    low = mid + 1;
                }
                else
                {
                    index = mid;
                    return [true, index];
                }
            } while (low <= high);
            index = low;
        }
        return [false, index];
    };

    /**
     * Returns the total number of curves
     * @returns {number}
     * @prototype
     */
    Tw2MayaAnimationEngine.prototype.GetNumberOfCurves = function()
    {
        return this.curves.length;
    };

    /**
     * Gets specific curve's length
     * @property {number} index
     * @returns {number}
     * @prototype
     */
    Tw2MayaAnimationEngine.prototype.GetLength = function(index)
    {
        if (index < 0 || index >= this.curves.length)
        {
            return 0;
        }
        var curve = this.curves[index];
        if (curve[Tw2MayaAnimationEngine.AnimCurveFields.IS_WEIGHTED])
        {
            var firstSegment = this.bezierSegments[curve[Tw2MayaAnimationEngine.AnimCurveFields.SEGMENT_OFFSET]];
        }
        else
        {
            var firstSegment = this.hermiteSegments[curve[Tw2MayaAnimationEngine.AnimCurveFields.SEGMENT_OFFSET]];
        }
        return curve[Tw2MayaAnimationEngine.AnimCurveFields.END_TIME] - firstSegment[Tw2MayaAnimationEngine.AnimSegment.TIME];
    };

    /**
     * ag_horner1
     * @param P
     * @param deg
     * @param s
     * @returns {*}
     */
    function ag_horner1(P, deg, s)
    {
        var h = P[deg];
        while (--deg >= 0) h = (s * h) + P[deg];
        return (h);
    }

    /**
     * ag_zeroin2
     * @param a
     * @param b
     * @param fa
     * @param fb
     * @param tol
     * @param pars
     * @returns {*}
     */
    function ag_zeroin2(a, b, fa, fb, tol, pars)
    {
        var test;
        var c, d, e, fc, del, m, machtol, p, q, r, s;

        /* initialization */
        machtol = 1.192092896e-07;
        var label1 = true;

        /* start iteration */
        while (true)
        {
            if (label1)
            {
                c = a;
                fc = fa;
                d = b - a;
                e = d;
            }
            if (Math.abs(fc) < Math.abs(fb))
            {
                a = b;
                b = c;
                c = a;
                fa = fb;
                fb = fc;
                fc = fa;
            }
            label1 = false;

            /* convergence test */
            del = 2.0 * machtol * Math.abs(b) + 0.5 * tol;
            m = 0.5 * (c - b);
            test = ((Math.abs(m) > del) && (fb != 0.0));
            if (test)
            {
                if ((Math.abs(e) < del) || (Math.abs(fa) <= Math.abs(fb)))
                {
                    /* bisection */
                    d = m;
                    e = d;
                }
                else
                {
                    s = fb / fa;
                    if (a == c)
                    {
                        /* linear interpolation */
                        p = 2.0 * m * s;
                        q = 1.0 - s;
                    }
                    else
                    {
                        /* inverse quadratic interpolation */
                        q = fa / fc;
                        r = fb / fc;
                        p = s * (2.0 * m * q * (q - r) - (b - a) * (r - 1.0));
                        q = (q - 1.0) * (r - 1.0) * (s - 1.0);
                    }
                    /* adjust the sign */
                    if (p > 0.0) q = -q;
                    else p = -p;
                    /* check if interpolation is acceptable */
                    s = e;
                    e = d;
                    if ((2.0 * p < 3.0 * m * q - Math.abs(del * q)) && (p < Math.abs(0.5 * s * q)))
                    {
                        d = p / q;
                    }
                    else
                    {
                        d = m;
                        e = d;
                    }
                }
                /* complete step */
                a = b;
                fa = fb;
                if (Math.abs(d) > del) b += d;
                else if (m > 0.0) b += del;
                else b -= del;
                fb = ag_horner1(pars.p, pars.deg, b);
                if (fb * (fc / Math.abs(fc)) > 0.0)
                {
                    label1 = true;
                }
            }
            else
            {
                break;
            }
        }
        return (b);
    }

    /**
     * ag_zeroin
     * @param a
     * @param b
     * @param tol
     * @param pars
     * @returns {*}
     */
    function ag_zeroin(a, b, tol, pars)
    {
        var fa, fb;

        fa = ag_horner1(pars.p, pars.deg, a);
        if (Math.abs(fa) < 1.192092896e-07) return (a);

        fb = ag_horner1(pars.p, pars.deg, b);
        if (Math.abs(fb) < 1.192092896e-07) return (b);

        return (ag_zeroin2(a, b, fa, fb, tol, pars));
    }

    /**
     * polyZeroes
     * @param Poly
     * @param deg
     * @param a
     * @param a_closed
     * @param b
     * @param b_closed
     * @param Roots
     * @returns {*}
     */
    function polyZeroes(Poly, deg, a, a_closed, b, b_closed, Roots)
    {
        var i, left_ok, right_ok, nr, ndr, skip;
        var e, f, s, pe, ps, tol, p, p_x = new Array(22),
            d, d_x = new Array(22),
            dr, dr_x = new Array(22);
        var ply = {
            p: [],
            deg: 0
        };

        e = pe = 0.0;
        f = 0.0;

        for (i = 0; i < deg + 1; ++i)
        {
            f += Math.abs(Poly[i]);
        }
        tol = (Math.abs(a) + Math.abs(b)) * (deg + 1) * 1.192092896e-07;

        /* Zero polynomial to tolerance? */
        if (f <= tol) return (-1);

        p = p_x;
        d = d_x;
        dr = dr_x;
        for (i = 0; i < deg + 1; ++i)
        {
            p[i] = 1.0 / f * Poly[i];
        }

        /* determine true degree */
        while (Math.abs(p[deg]) < tol) deg--;

        /* Identically zero poly already caught so constant fn != 0 */
        nr = 0;
        if (deg == 0) return (nr);

        /* check for linear case */
        if (deg == 1)
        {
            Roots[0] = -p[0] / p[1];
            left_ok = (a_closed) ? (a < Roots[0] + tol) : (a < Roots[0] - tol);
            right_ok = (b_closed) ? (b > Roots[0] - tol) : (b > Roots[0] + tol);
            nr = (left_ok && right_ok) ? 1 : 0;
            if (nr)
            {
                if (a_closed && Roots[0] < a) Roots[0] = a;
                else if (b_closed && Roots[0] > b) Roots[0] = b;
            }
            return nr;
        }
        /* handle non-linear case */
        else
        {
            ply.p = p;
            ply.deg = deg;

            /* compute derivative */
            for (i = 1; i <= deg; i++) d[i - 1] = i * p[i];

            /* find roots of derivative */
            ndr = polyZeroes(d, deg - 1, a, 0, b, 0, dr);
            if (ndr.length == 0) return (0);

            /* find roots between roots of the derivative */
            for (i = skip = 0; i <= ndr; i++)
            {
                if (nr > deg) return (nr);
                if (i == 0)
                {
                    s = a;
                    ps = ag_horner1(p, deg, s);
                    if (Math.abs(ps) <= tol && a_closed) Roots[nr++] = a;
                }
                else
                {
                    s = e;
                    ps = pe;
                }
                if (i == ndr)
                {
                    e = b;
                    skip = 0;
                }
                else e = dr[i];
                pe = ag_horner1(p, deg, e);
                if (skip) skip = 0;
                else
                {
                    if (Math.abs(pe) < tol)
                    {
                        if (i != ndr || b_closed)
                        {
                            Roots[nr++] = e;
                            skip = 1;
                        }
                    }
                    else if ((ps < 0 && pe > 0) || (ps > 0 && pe < 0))
                    {
                        Roots[nr++] = ag_zeroin(s, e, 0.0, ply);
                        if ((nr > 1) && Roots[nr - 2] >= Roots[nr - 1] - tol)
                        {
                            Roots[nr - 2] = (Roots[nr - 2] + Roots[nr - 1]) * 0.5;
                            nr--;
                        }
                    }
                }
            }
        }

        return (nr);
    }

    /**
     * Tw2MayaScalarCurve
     * @property {number} index
     * @property {null|Tw2MayaAnimationEngine} animationEngine
     * @property {string} name
     * @property {number} value
     * @property {number} length
     * @constructor
     */
    function Tw2MayaScalarCurve()
    {
        this.index = -1;
        this.animationEngine = null;
        this.name = '';
        this.value = 0;
        this.length = 0;
    }

    /**
     * Initializes the Curve
     * @returns {boolean}
     * @prototype
     */
    Tw2MayaScalarCurve.prototype.Initialize = function()
    {
        this.ComputeLength();
        return true;
    };

    /**
     * Gets curve length
     * @returns {number}
     * @prototype
     */
    Tw2MayaScalarCurve.prototype.GetLength = function()
    {
        return this.length;
    };

    /**
     * Updates a value at a specific time
     * @param {number} time
     * @prototype
     */
    Tw2MayaScalarCurve.prototype.UpdateValue = function(time)
    {
        if (this.animationEngine)
        {
            this.value = this.animationEngine.Evaluate(this.index, time);
        }
    };

    /**
     * Computes curve Length
     * @prototype
     */
    Tw2MayaScalarCurve.prototype.ComputeLength = function()
    {
        if (!this.animationEngine || this.animationEngine.GetNumberOfCurves() == 0)
        {
            return;
        }
        if (this.index >= 0)
        {
            this.length = this.animationEngine.GetLength(this.index);
        }
    };

    /**
     * Tw2MayaVector3Curve
     * @property {number} xIndex
     * @property {number} yIndex
     * @property {number} zIndex
     * @property {null|Tw2MayaAnimationEngine} animationEngine
     * @property {string} name
     * @property {vec3} value
     * @constructor
     */
    function Tw2MayaVector3Curve()
    {
        this.xIndex = -1;
        this.yIndex = -1;
        this.zIndex = -1;
        this.animationEngine = null;
        this.name = '';
        this.value = vec3.create();
    }

    /**
     * Initializes the Curve
     * @returns {boolean}
     * @prototype
     */
    Tw2MayaVector3Curve.prototype.Initialize = function()
    {
        this.ComputeLength();
        return true;
    };

    /**
     * Gets curve length
     * @returns {number}
     * @prototype
     */
    Tw2MayaVector3Curve.prototype.GetLength = function()
    {
        return this.length;
    };

    /**
     * Updates a value at a specific time
     * @param {number} time
     * @prototype
     */
    Tw2MayaVector3Curve.prototype.UpdateValue = function(time)
    {
        if (this.animationEngine)
        {
            if (this.xIndex)
            {
                this.value[0] = this.animationEngine.Evaluate(this.xIndex, time);
            }
            if (this.yIndex)
            {
                if (this.yIndex == this.xIndex)
                {
                    this.value[1] = this.value[0];
                }
                else
                {
                    this.value[1] = this.animationEngine.Evaluate(this.yIndex, time);
                }
            }
            if (this.zIndex)
            {
                if (this.zIndex == this.xIndex)
                {
                    this.value[2] = this.value[0];
                }
                else
                {
                    this.value[2] = this.animationEngine.Evaluate(this.zIndex, time);
                }
            }
        }
    };

    /**
     * Computes curve Length
     * @prototype
     */
    Tw2MayaVector3Curve.prototype.ComputeLength = function()
    {
        if (!this.animationEngine || this.animationEngine.GetNumberOfCurves() == 0)
        {
            return;
        }
        this.length = 0;
        if (this.xIndex >= 0)
        {
            this.length = this.animationEngine.GetLength(this.xIndex);
        }
        if (this.yIndex >= 0)
        {
            this.length = Math.max(this.length, this.animationEngine.GetLength(this.yIndex));
        }
        if (this.zIndex >= 0)
        {
            this.length = Math.max(this.length, this.animationEngine.GetLength(this.zIndex));
        }
    };

    /**
     * Tw2MayaEulerRotationCurve
     * @property {number} xIndex
     * @property {number} yIndex
     * @property {number} zIndex
     * @property {null|Tw2MayaAnimationEngine} animationEngine
     * @property {string} name
     * @property {vec3} eulerValue
     * @property {boolean} updateQuaternion
     * @property {quat4} quatValue
     * @constructor
     */
    function Tw2MayaEulerRotationCurve()
    {
        this.xIndex = -1;
        this.yIndex = -1;
        this.zIndex = -1;
        this.animationEngine = null;
        this.name = '';
        this.eulerValue = vec3.create();
        this.updateQuaternion = false;
        this.quatValue = quat4.create();
    }

    /**
     * Initializes the Curve
     * @returns {boolean}
     * @prototype
     */
    Tw2MayaEulerRotationCurve.prototype.Initialize = function()
    {
        this.ComputeLength();
        return true;
    };

    /**
     * Gets curve length
     * @returns {number}
     * @prototype
     */
    Tw2MayaEulerRotationCurve.prototype.GetLength = function()
    {
        return this.length;
    };

    /**
     * Updates a value at a specific time
     * @param {number} time
     * @prototype
     */
    Tw2MayaEulerRotationCurve.prototype.UpdateValue = function(time)
    {
        if (this.animationEngine)
        {
            if (this.xIndex)
            {
                this.eulerValue[0] = this.animationEngine.Evaluate(this.xIndex, time);
            }
            if (this.yIndex)
            {
                if (this.yIndex == this.xIndex)
                {
                    this.eulerValue[1] = this.eulerValue[0];
                }
                else
                {
                    this.eulerValue[1] = this.animationEngine.Evaluate(this.yIndex, time);
                }
            }
            if (this.zIndex)
            {
                if (this.zIndex == this.xIndex)
                {
                    this.eulerValue[2] = this.eulerValue[0];
                }
                else
                {
                    this.eulerValue[2] = this.animationEngine.Evaluate(this.zIndex, time);
                }
            }
            if (this.updateQuaternion)
            {
                var sinYaw = Math.sin(this.eulerValue[0] / 2);
                var cosYaw = Math.cos(this.eulerValue[0] / 2);
                var sinPitch = Math.sin(this.eulerValue[1] / 2);
                var cosPitch = Math.cos(this.eulerValue[1] / 2);
                var sinRoll = Math.sin(this.eulerValue[2] / 2);
                var cosRoll = Math.cos(this.eulerValue[2] / 2);
                this.quatValue[0] = sinYaw * cosPitch * sinRoll + cosYaw * sinPitch * cosRoll;
                this.quatValue[1] = sinYaw * cosPitch * cosRoll - cosYaw * sinPitch * sinRoll;
                this.quatValue[2] = cosYaw * cosPitch * sinRoll - sinYaw * sinPitch * cosRoll;
                this.quatValue[3] = cosYaw * cosPitch * cosRoll + sinYaw * sinPitch * sinRoll;
            }
        }
    };

    /**
     * Computes curve Length
     * @prototype
     */
    Tw2MayaEulerRotationCurve.prototype.ComputeLength = function()
    {
        if (!this.animationEngine || this.animationEngine.GetNumberOfCurves() == 0)
        {
            return;
        }
        this.length = 0;
        if (this.xIndex >= 0)
        {
            this.length = this.animationEngine.GetLength(this.xIndex);
        }
        if (this.yIndex >= 0)
        {
            this.length = Math.max(this.length, this.animationEngine.GetLength(this.yIndex));
        }
        if (this.zIndex >= 0)
        {
            this.length = Math.max(this.length, this.animationEngine.GetLength(this.zIndex));
        }
    };

    /**
     * Tw2QuaternionKey2
     * @property {number} time
     * @property {quat4} value
     * @property {quat4} leftTangent
     * @property {quat4} rightTangent
     * @property {number} interpolation
     * @constructor
     */
    function Tw2QuaternionKey2()
    {
        this.time = 0;
        this.value = quat4.create();
        this.leftTangent = quat4.create();
        this.rightTangent = quat4.create();
        this.interpolation = 1;
    }


    /**
     * Tw2QuaternionCurve
     * @property {string} name
     * @property {number} length
     * @property {boolean} cycle
     * @property {boolean} reversed
     * @property {number} timeOffset
     * @property {number} timeScale
     * @property {quat4} startValue
     * @property {quat4} currentValue
     * @property {quat4} endValue
     * @property {quat4} startTangent
     * @property {quat4} endTangent
     * @property {number} interpolation
     * @property {Array.<Tw2QuaternionKey>} keys
     * @constructor
     */
    function Tw2QuaternionCurve()
    {
        this.name = '';
        this.length = 0;
        this.cycle = false;
        this.reversed = false;
        this.timeOffset = 0;
        this.timeScale = 1;
        this.startValue = quat4.create();
        this.currentValue = quat4.create();
        this.endValue = quat4.create();
        this.startTangent = quat4.create();
        this.endTangent = quat4.create();
        this.interpolation = 1;
        this.keys = [];
    }

    /**
     * Initializes the Curve
     * @prototype
     */
    Tw2QuaternionCurve.prototype.Initialize = function()
    {
        this.Sort();
    };

    /**
     * Gets curve length
     * @returns {number}
     * @prototype
     */
    Tw2QuaternionCurve.prototype.GetLength = function()
    {
        return this.length;
    };

    /**
     * Compares two curve keys' time properties
     * @param {Tw2QuaternionKey} a
     * @param {Tw2QuaternionKey} b
     * @returns {number}
     * @method
     */
    Tw2QuaternionCurve.Compare = function(a, b)
    {
        if (a.time < b.time)
        {
            return -1;
        }
        if (a.time > b.time)
        {
            return 1;
        }
        return 0;
    };

    /**
     * Sorts the curve's keys
     * @prototype
     */
    Tw2QuaternionCurve.prototype.Sort = function()
    {
        if (this.keys.length)
        {
            this.keys.sort(Tw2QuaternionCurve.Compare);
            var back = this.keys[this.keys.length - 1];
            if (back.time > this.length)
            {
                var preLength = this.length;
                var endValue = this.endValue;
                var endTangent = this.endTangent;
                this.length = back.time;
                this.endValue = back.value;
                this.endTangent = back.leftTangent;
                if (preLength > 0)
                {
                    back.time = preLength;
                    back.value = endValue;
                    back.leftTangent = endTangent;
                }
            }
        }
    };

    /**
     * Updates a value at a specific time
     * @param {number} time
     * @prototype
     */
    Tw2QuaternionCurve.prototype.UpdateValue = function(time)
    {
        this.GetValueAt(time, this.currentValue);
    };

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @param {quat4} value
     * @returns {quat4}
     * @prototype
     */
    Tw2QuaternionCurve.prototype.GetValueAt = function(time, value)
    {
        time = time / this.timeScale + this.timeOffset;
        if (this.length <= 0 || time <= 0)
        {
            value[0] = this.startValue[0];
            value[1] = this.startValue[1];
            value[2] = this.startValue[2];
            return value;
        }
        if (time > this.length)
        {
            if (this.cycle)
            {
                time = time % this.length;
            }
            else if (this.reversed)
            {
                value[0] = this.startValue[0];
                value[1] = this.startValue[1];
                value[2] = this.startValue[2];
                return value;
            }
            else
            {
                value[0] = this.endValue[0];
                value[1] = this.endValue[1];
                value[2] = this.endValue[2];
                return value;
            }
        }
        if (this.reversed)
        {
            time = this.length - time;
        }
        if (this.keys.length == 0)
        {
            return this.Interpolate(time, null, null, value);
        }
        var startKey = this.keys[0];
        if (time <= startKey.time)
        {
            return this.Interpolate(time, null, startKey, value);
        }
        else if (time >= this.keys[this.keys.length - 1].time)
        {
            return this.Interpolate(time, this.keys[this.keys.length - 1], null, value);
        }
        var endKey = this.keys[0];
        for (var i = 0; i + 1 < this.keys.length; ++i)
        {
            startKey = this.keys[i];
            endKey = this.keys[i + 1];
            if (startKey.time <= time && endKey.time > time)
            {
                break;
            }
        }
        return this.Interpolate(time, startKey, endKey, value);
    };

    /**
     * Interpolate
     * @param {number} time
     * @param {null|Tw2QuaternionKey} lastKey
     * @param {null|Tw2QuaternionKey} nextKey
     * @param {quat4} value
     * @returns {*}
     * @prototype
     */
    Tw2QuaternionCurve.prototype.Interpolate = function(time, lastKey, nextKey, value)
    {
        value[0] = this.startValue[0];
        value[1] = this.startValue[1];
        value[2] = this.startValue[2];

        var startValue = this.startValue;
        var endValue = this.endValue;
        var interp = this.interpolation;
        var deltaTime = this.length;
        if (lastKey != null)
        {
            interp = lastKey.interpolation;
            time -= lastKey.time;
        }
        switch (interp)
        {
            case 4:
                if (lastKey && nextKey)
                {
                    startValue = lastKey.value;
                    endValue = nextKey.value;
                    deltaTime = nextKey.time - lastKey.time;
                }
                else if (nextKey)
                {
                    endValue = nextKey.value;
                    deltaTime = nextKey.time;
                }
                else if (lastKey)
                {
                    startValue = lastKey.value;
                    deltaTime = this.length - lastKey.time;
                }
                quat4.slerp(startValue, endValue, time / deltaTime, value);
                return value;
        }
        return value;
    };

    /**
     * Tw2WbgTrack
     * @property {string} name
     * @property {string} geometryResPath
     * @property {Object} geometryRes
     * @property {string} group
     * @property {number} duration
     * @property {boolean} cycle
     * @constructor
     */
    function Tw2WbgTrack()
    {
        this.name = '';
        this.geometryResPath = '';
        this.geometryRes = null;
        this.group = '';
        this.duration = 0;
        this.cycle = false;

        /**
         * SetCurves
         * @param self
         * @private
         */
        function SetCurves(self)
        {
            if (!self.name || !self.group || !self.geometryRes)
            {
                return;
            }
            for (var i = 0; i < self.geometryRes.animations.length; ++i)
            {
                var animation = self.geometryRes.animations[i];
                for (var j = 0; j < animation.trackGroups.length; ++j)
                {
                    if (animation.trackGroups[j].name == self.group)
                    {
                        self._ApplyTracks(animation.trackGroups[j], animation.duration);
                    }
                }
            }
        }

        /**
         * Initialize
         * @method
         */
        this.Initialize = function()
        {
            if (this.geometryResPath)
            {
                this.geometryRes = resMan.GetResource(this.geometryResPath);
                var self = this;
                var notification = {
                    ReleaseCachedData: function() {},
                    RebuildCachedData: function()
                    {
                        SetCurves(self);
                    }
                };
                this.geometryRes.RegisterNotification(notification);
            }
        };

        /**
         * Updates a value at a specific time
         * @param {number} time
         * @prototype
         */
        this.UpdateValue = function(time)
        {
            if (!this._TracksReady())
            {
                return;
            }
            if (this.cycle)
            {
                time = time % this.duration;
            }
            if (time <= this.duration && time >= 0)
            {
                this._UpdateValue(time);
            }
        }
    }

    /**
     * Tw2WbgTransformTrack
     * @property {vec3} translation
     * @property {quat4} rotation
     * @property {vec3} scale
     * @variable positionCurve
     * @variable rotationCurve
     * @variable scaleCurve
     * @variable {mat4} scaleShear
     * @constructor
     */
    function Tw2WbgTransformTrack()
    {
        this.translation = vec3.create();
        this.rotation = quat4.create();
        this.rotation[3] = 1;
        this.scale = vec3.create();
        var positionCurve = null;
        var rotationCurve = null;
        var scaleCurve = null;
        var scaleShear = mat4.identity(mat4.create());

        /**
         * _TracksReady
         * @returns {*}
         * @private
         */
        this._TracksReady = function()
        {
            return positionCurve || rotationCurve || scaleCurve;
        };

        /**
         * _ApplyTracks
         * @param trackGroup
         * @param duration
         * @private
         */
        this._ApplyTracks = function(trackGroup, duration)
        {
            for (var i = 0; i < trackGroup.transformTracks.length; ++i)
            {
                var track = trackGroup.transformTracks[i];
                if (track.name == this.name)
                {
                    this.duration = duration;
                    positionCurve = track.position;
                    rotationCurve = track.orientation;
                    scaleCurve = track.scaleShear;
                }
            }
            this.UpdateValue(0);
        };

        /**
         * Updates a value at a specific time
         * @param {number} time
         * @prototype
         */
        this._UpdateValue = function(time)
        {
            if (positionCurve)
            {
                Tw2AnimationController.EvaluateCurve(positionCurve, time, this.translation, this.cycle, this.duration);
            }
            if (rotationCurve)
            {
                Tw2AnimationController.EvaluateCurve(rotationCurve, time, this.rotation, this.cycle, this.duration);
                quat4.normalize(this.rotation);
            }
            if (scaleCurve)
            {
                Tw2AnimationController.EvaluateCurve(scaleCurve, time, scaleShear, this.cycle, this.duration);
            }
            this.scale[0] = scaleShear[0];
            this.scale[1] = scaleShear[5];
            this.scale[2] = scaleShear[10];
        }
    }

    /**
     * @type {Tw2WbgTrack}
     * @prototype
     */
    Tw2WbgTransformTrack.prototype = new Tw2WbgTrack();

    /**
     * Contains transform information for Boosters, Turrets and XLTurrets
     * @property {string} name
     * @property {mat4} transform
     * @constructor
     */
    function EveLocator()
    {
        this.name = '';
        this.transform = mat4.create();
    }

    /**
     * EveObjectSet
     * @typedef {EveBoosterSet|EvePlaneSet|EveSpotlightSet|EveTurretSet|EveSpaceObjectDecal} EveObjectSet
     */

    /**
     * EveBoosterSet
     * @property {boolean} display
     * @property {Tw2Effect} effect
     * @property {Tw2Effect} glows
     * @property {number} glowScale
     * @property {quat4} glowColor
     * @property {quat4} warpGlowColor
     * @property {number} symHaloScale
     * @property {number} haloScaleX
     * @property {number} haloScaleY
     * @property {number} maxVel
     * @property {quat4} haloColor
     * @property {boolean} alwaysOn
     * @property {mat4} _parentTransform
     * @property {mat4} _wavePhase
     * @property {Array.<{}>} _boosterTransforms
     * @property {WebGlBuffer} _positions
     * @property {Tw2VertexDeclaration} _decl
     * @property {Tw2PerObjectData} _perObjectData
     * @property {boolean} rebuildPending
     * @constructor
     */
    function EveBoosterSet()
    {
        this.display = true;
        this.effect = null;
        this.glows = null;
        this.glowScale = 1.0;
        this.glowColor = quat4.create();
        this.warpGlowColor = quat4.create();
        this.symHaloScale = 1.0;
        this.haloScaleX = 1.0;
        this.haloScaleY = 1.0;
        this.maxVel = 250;
        this.haloColor = quat4.create();
        this.alwaysOn = true;

        this._parentTransform = mat4.create();
        this._wavePhase = mat4.create();
        this._boosterTransforms = [];

        this._positions = device.gl.createBuffer();

        this._decl = new Tw2VertexDeclaration();
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_POSITION, 0, device.gl.FLOAT, 3, 0));
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 0, device.gl.FLOAT, 2, 12));
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 1, device.gl.FLOAT, 4, 20));
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 2, device.gl.FLOAT, 4, 36));
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 3, device.gl.FLOAT, 4, 52));
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 4, device.gl.FLOAT, 4, 68));
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 5, device.gl.FLOAT, 4, 84));
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 6, device.gl.FLOAT, 1, 100));
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 7, device.gl.FLOAT, 2, 104));
        this._decl.RebuildHash();

        this._perObjectData = new Tw2PerObjectData();
        this._perObjectData.perObjectVSData = new Tw2RawData();
        this._perObjectData.perObjectVSData.Declare('WorldMat', 16);
        this._perObjectData.perObjectVSData.Declare('Shipdata', 4);
        this._perObjectData.perObjectVSData.Create();

        this.rebuildPending = false;
    }

    /**
     * Initializes the booster set
     */
    EveBoosterSet.prototype.Initialize = function()
    {
        this.rebuildPending = true;
    };

    /**
     * Gets booster set res objects
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2EffectRes|Tw2TextureRes>} [out]
     */
    EveBoosterSet.prototype.GetResources = function(out)
    {
        if (out === undefined)
        {
            out = [];
        }

        if (this.effect !== null)
        {
            this.effect.GetResources(out);
        }

        if (this.glows !== null && this.glows.effect !== null)
        {
            this.glows.effect.GetResources(out);
        }

        return out;
    }

    /**
     * Clears the booster set
     */
    EveBoosterSet.prototype.Clear = function()
    {
        this._boosterTransforms = [];
        this._wavePhase = mat4.create();
        if (this.glows)
        {
            this.glows.Clear();
        }
    };

    /**
     * Adds a booster
     * @param {mat4} localMatrix
     * @param {number} atlas0
     * @param {number} atlas1
     * @constructor
     */
    EveBoosterSet.prototype.Add = function(localMatrix, atlas0, atlas1)
    {
        var transform = mat4.create();
        mat4.set(localMatrix, transform);
        this._boosterTransforms[this._boosterTransforms.length] = {
            transform: transform,
            atlas0: atlas0,
            atlas1: atlas1
        };
        this._wavePhase[this._wavePhase.length] = Math.random();
        if (this.glows)
        {
            var pos = vec3.create([localMatrix[12], localMatrix[13], localMatrix[14]]);
            var dir = vec3.create([localMatrix[8], localMatrix[9], localMatrix[10]]);
            var scale = Math.max(vec3.length([localMatrix[0], localMatrix[1], localMatrix[2]]), vec3.length([localMatrix[4], localMatrix[5], localMatrix[6]]));
            vec3.normalize(dir);
            if (scale < 3)
            {
                vec3.scale(dir, scale / 3);
            }
            var seed = Math.random() * 0.7;
            var spritePos = vec3.create();
            vec3.subtract(pos, vec3.scale(dir, 2.5, spritePos), spritePos);
            this.glows.Add(spritePos, seed, seed, scale * this.glowScale, scale * this.glowScale, 0, this.glowColor, this.warpGlowColor);
            vec3.subtract(pos, vec3.scale(dir, 3, spritePos), spritePos);
            this.glows.Add(spritePos, seed, 1 + seed, scale * this.symHaloScale, scale * this.symHaloScale, 0, this.haloColor, this.warpGlowColor);
            vec3.subtract(pos, vec3.scale(dir, 3.01, spritePos), spritePos);
            this.glows.Add(spritePos, seed, 1 + seed, scale * this.haloScaleX, scale * this.haloScaleY, 0, this.haloColor, this.warpGlowColor);
        }
    };

    /**
     * Internal helper
     * @type {Array}
     * @private
     */
    EveBoosterSet._box = [
        [
            [-1.0, -1.0, 0.0],
            [1.0, -1.0, 0.0],
            [1.0, 1.0, 0.0],
            [-1.0, 1.0, 0.0]
        ],

        [
            [-1.0, -1.0, -1.0],
            [-1.0, 1.0, -1.0],
            [1.0, 1.0, -1.0],
            [1.0, -1.0, -1.0]
        ],

        [
            [-1.0, -1.0, 0.0],
            [-1.0, 1.0, 0.0],
            [-1.0, 1.0, -1.0],
            [-1.0, -1.0, -1.0]
        ],

        [
            [1.0, -1.0, 0.0],
            [1.0, -1.0, -1.0],
            [1.0, 1.0, -1.0],
            [1.0, 1.0, 0.0]
        ],

        [
            [-1.0, -1.0, 0.0],
            [-1.0, -1.0, -1.0],
            [1.0, -1.0, -1.0],
            [1.0, -1.0, 0.0]
        ],

        [
            [-1.0, 1.0, 0.0],
            [1.0, 1.0, 0.0],
            [1.0, 1.0, -1.0],
            [-1.0, 1.0, -1.0]
        ]
    ];

    /**
     * Rebuilds the boosters
     */
    EveBoosterSet.prototype.Rebuild = function()
    {
        var data = new Float32Array(this._boosterTransforms.length * EveBoosterSet._box.length * 6 * 28);
        var order = [0, 3, 1, 3, 2, 1];
        var index = 0;
        for (var booster = 0; booster < this._boosterTransforms.length; ++booster)
        {
            for (var i = 0; i < EveBoosterSet._box.length; ++i)
            {
                for (var j = 0; j < order.length; ++j)
                {
                    data[index++] = EveBoosterSet._box[i][order[j]][0];
                    data[index++] = EveBoosterSet._box[i][order[j]][1];
                    data[index++] = EveBoosterSet._box[i][order[j]][2];
                    data[index++] = 0;
                    data[index++] = 0;
                    data.set(this._boosterTransforms[booster].transform, index);
                    index += 16;
                    data[index++] = 0;
                    data[index++] = 1;
                    data[index++] = 1;
                    data[index++] = 1;
                    data[index++] = this._wavePhase[booster];
                    data[index++] = this._boosterTransforms[booster].atlas0;
                    data[index++] = this._boosterTransforms[booster].atlas1;
                }
            }
        }
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._positions);
        device.gl.bufferData(device.gl.ARRAY_BUFFER, data, device.gl.STATIC_DRAW);

        this.rebuildPending = false;
        if (this.glows)
        {
            this.glows.RebuildBuffers();
        }
    };

    /**
     * Per frame update
     * @param {number} dt - DeltaTime
     * @param {mat4} parentMatrix
     * @constructor
     */
    EveBoosterSet.prototype.Update = function(dt, parentMatrix)
    {
        if (this.glows)
        {
            this.glows.Update(dt);
        }
        this._parentTransform = parentMatrix;
    };


    /**
     * Booster render batch
     * @constructor
     */
    function EveBoosterBatch()
    {
        this.renderMode = device.RM_ANY;
        this.perObjectData = null;
        this.boosters = null;
    }

    /**
     * Commits the batch
     * @param {Tw2Effect} [overrideEffect]
     */
    EveBoosterBatch.prototype.Commit = function(overrideEffect)
    {
        this.boosters.Render(overrideEffect);
    };

    /**
     * Gets render batches
     * @param {RenderMode} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     */
    EveBoosterSet.prototype.GetBatches = function(mode, accumulator, perObjectData)
    {
        if (!this.display || mode != device.RM_ADDITIVE)
        {
            return;
        }
        if (this.effect && this._boosterTransforms.length)
        {
            var batch = new EveBoosterBatch();

            mat4.transpose(this._parentTransform, this._perObjectData.perObjectVSData.Get('WorldMat'));
            this._perObjectData.perObjectVSData.Set('Shipdata', perObjectData.perObjectVSData.Get('Shipdata'));
            this._perObjectData.perObjectPSData = perObjectData.perObjectPSData;
            batch.perObjectData = this._perObjectData;
            batch.boosters = this;
            batch.renderMode = device.RM_ADDITIVE;
            accumulator.Commit(batch);
        }
        if (this.glows)
        {
            this.glows.GetBoosterGlowBatches(mode, accumulator, perObjectData, this._parentTransform, perObjectData.perObjectVSData.Get('Shipdata')[0], 0);
        }
    };

    /**
     * Renders the accumulated batches
     * @param {Tw2Effect} [overrideEffect]
     * @returns {boolean}
     */
    EveBoosterSet.prototype.Render = function(overrideEffect)
    {
        var effect = typeof(overrideEffect) == 'undefined' ? this.effect : overrideEffect;
        var effectRes = effect.GetEffectRes();
        if (!effectRes.IsGood())
        {
            return false;
        }

        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._positions);

        for (var pass = 0; pass < effect.GetPassCount(); ++pass)
        {
            effect.ApplyPass(pass);
            if (!this._decl.SetDeclaration(effect.GetPassInput(pass), 112))
            {
                return false;
            }
            device.ApplyShadowState();
            device.gl.drawArrays(device.gl.TRIANGLES, 0, this._boosterTransforms.length * 12 * 3);
        }
        return true;
    };

    /**
     * EveSpriteSet
     * @property {string} name
     * @property {Array.<EveSpriteSetItem>} sprites
     * @property {Tw2Effect} effect
     * @property {boolean} display
     * @property {number} _time
     * @property {boolean} useQuads Use quad rendering (CPU transform)
     * @property {boolean} isSkinned Use bone transforms (when useQuads is true)
     * @property {WebGlBuffer} _vertexBuffer
     * @property {WebGlBuffer} _indexBuffer
     * @property {Tw2VertexDeclaration} _decl
     * @param {boolean} useQuads Use quad rendering (CPU transform)
     * @param {boolean} isSkinned Use bone transforms (when useQuads is true)
     * @constructor
     */
    function EveSpriteSet(useQuads, isSkinned)
    {
        this.name = '';
        this.sprites = [];
        this.effect = null;
        this.display = true;
        this._time = 0;
        this.useQuads = useQuads;
        this.isSkinned = isSkinned;

        this._vertexBuffer = null;
        this._indexBuffer = null;
        this._instanceBuffer = null;
        this._decl = new Tw2VertexDeclaration();
        if (!useQuads)
        {
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 5, device.gl.FLOAT, 2, 0));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_POSITION, 0, device.gl.FLOAT, 3, 8));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_COLOR, 0, device.gl.FLOAT, 3, 20));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 0, device.gl.FLOAT, 1, 32));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 1, device.gl.FLOAT, 1, 36));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 2, device.gl.FLOAT, 1, 40));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 3, device.gl.FLOAT, 1, 44));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 4, device.gl.FLOAT, 1, 48));
        }
        else
        {
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_POSITION, 0, device.gl.FLOAT, 3, 0));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 0, device.gl.FLOAT, 4, 12));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 1, device.gl.FLOAT, 2, 28));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_COLOR, 0, device.gl.FLOAT, 4, 36));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_COLOR, 1, device.gl.FLOAT, 4, 52));
        }
        this._decl.RebuildHash();

        this._vdecl = new Tw2VertexDeclaration();
        this._vdecl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 5, device.gl.FLOAT, 1, 0));
        this._vdecl.RebuildHash();
    }

    /**
     * Initializes the sprite set
     */
    EveSpriteSet.prototype.Initialize = function()
    {
        this.RebuildBuffers();
    };

    /**
     * Use instanced rendering or "quad" rendering
     * @param {boolean} useQuads Use quad rendering (CPU transform)
     * @param {boolean} isSkinned Use bone transforms (when useQuads is true)
     */
    EveSpriteSet.prototype.UseQuads = function(useQuads, isSkinned)
    {
        if (this.useQuads == useQuads)
        {
            return;
        }
        this.useQuads = useQuads;
        this.isSkinned = isSkinned;

        this._decl.elements.splice(0, this._decl.elements.length);
        if (!useQuads)
        {
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 5, device.gl.FLOAT, 2, 0));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_POSITION, 0, device.gl.FLOAT, 3, 8));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_COLOR, 0, device.gl.FLOAT, 3, 20));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 0, device.gl.FLOAT, 1, 32));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 1, device.gl.FLOAT, 1, 36));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 2, device.gl.FLOAT, 1, 40));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 3, device.gl.FLOAT, 1, 44));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 4, device.gl.FLOAT, 1, 48));
        }
        else
        {
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_POSITION, 0, device.gl.FLOAT, 3, 0));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 0, device.gl.FLOAT, 4, 12));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 1, device.gl.FLOAT, 2, 28));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_COLOR, 0, device.gl.FLOAT, 4, 36));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_COLOR, 1, device.gl.FLOAT, 4, 52));
        }
        this._decl.RebuildHash();
        this.RebuildBuffers();
    };

    /**
     * Gets Sprite Set Resource Objects
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2EffectRes|Tw2TextureRes|Tw2GeometryRes>} [out]
     */
    EveSpriteSet.prototype.GetResources = function(out)
    {
        if (out === undefined)
        {
            out = [];
        }

        if (this.effect !== null)
        {
            this.effect.GetResources(out);
        }

        return out;
    };

    /**
     * Rebuilds the sprite set's buffers
     */
    EveSpriteSet.prototype.RebuildBuffers = function()
    {
        var visibleItems = [];
        for (var i = 0; i < this.sprites.length; i++)
        {
            if (this.sprites[i].display)
            {
                visibleItems.push(this.sprites[i]);
            }
        }
        if (this.useQuads)
        {
            this._vertexBuffer = device.gl.createBuffer();
            device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._vertexBuffer);
            device.gl.bufferData(device.gl.ARRAY_BUFFER, new Float32Array([0, 1, 2, 2, 3, 0]), device.gl.STATIC_DRAW);
            this._instanceBuffer = device.gl.createBuffer();
            return;
        }

        var offset, vtxOffset;
        var vertexSize = 13;
        var array = new Float32Array(visibleItems.length * 4 * vertexSize);
        for (i = 0; i < visibleItems.length; ++i)
        {
            offset = i * 4 * vertexSize;
            array[offset] = 0;
            array[offset + vertexSize] = 1;
            array[offset + 2 * vertexSize] = 2;
            array[offset + 3 * vertexSize] = 3;
            for (var j = 0; j < 4; ++j)
            {
                vtxOffset = offset + j * vertexSize;
                array[vtxOffset + 1] = visibleItems[i].boneIndex;
                array[vtxOffset + 2] = visibleItems[i].position[0];
                array[vtxOffset + 3] = visibleItems[i].position[1];
                array[vtxOffset + 4] = visibleItems[i].position[2];
                array[vtxOffset + 5] = visibleItems[i].color[0];
                array[vtxOffset + 6] = visibleItems[i].color[1];
                array[vtxOffset + 7] = visibleItems[i].color[2];
                array[vtxOffset + 8] = visibleItems[i].blinkPhase;
                array[vtxOffset + 9] = visibleItems[i].blinkRate;
                array[vtxOffset + 10] = visibleItems[i].minScale;
                array[vtxOffset + 11] = visibleItems[i].maxScale;
                array[vtxOffset + 12] = visibleItems[i].falloff;
            }
        }
        this._vertexBuffer = device.gl.createBuffer();
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._vertexBuffer);
        device.gl.bufferData(device.gl.ARRAY_BUFFER, array, device.gl.STATIC_DRAW);
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, null);

        var indexes = new Uint16Array(visibleItems.length * 6);
        for (i = 0; i < visibleItems.length; ++i)
        {
            offset = i * 6;
            vtxOffset = i * 4;
            indexes[offset] = vtxOffset;
            indexes[offset + 1] = vtxOffset + 2;
            indexes[offset + 2] = vtxOffset + 1;
            indexes[offset + 3] = vtxOffset + 0;
            indexes[offset + 4] = vtxOffset + 3;
            indexes[offset + 5] = vtxOffset + 2;
        }
        this._indexBuffer = device.gl.createBuffer();
        device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        device.gl.bufferData(device.gl.ELEMENT_ARRAY_BUFFER, indexes, device.gl.STATIC_DRAW);
        device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, null);
        this._indexBuffer.count = visibleItems.length * 6;
    };

    /**
     * Sprite set render batch
     * @inherits Tw2RenderBatch
     * @constructor
     */
    function EveSpriteSetBatch()
    {
        this._super.constructor.call(this);
        this.boosterGlow = false;
        this.spriteSet = null;
        this.world = null;
        this.boosterGain = 0;
        this.warpIntensity = 0;
    }

    /**
     * Commits the sprite set
     * @param {Tw2Effect} overrideEffect
     */
    EveSpriteSetBatch.prototype.Commit = function(overrideEffect)
    {
        if (this.boosterGlow)
        {
            this.spriteSet.RenderBoosterGlow(overrideEffect, this.world, this.boosterGain, this.warpIntensity);
        }
        else
        {
            this.spriteSet.Render(overrideEffect, this.world, this.perObjectData);
        }
    };

    Inherit(EveSpriteSetBatch, Tw2RenderBatch);

    /**
     * Gets render batches
     * @param {RenderMode} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @param {mat4} world
     */
    EveSpriteSet.prototype.GetBatches = function(mode, accumulator, perObjectData, world)
    {
        if (this.display && mode == device.RM_ADDITIVE)
        {
            var batch = new EveSpriteSetBatch();
            batch.world = world;
            batch.renderMode = device.RM_ADDITIVE;
            batch.spriteSet = this;
            batch.perObjectData = perObjectData;
            accumulator.Commit(batch);
        }
    };

    /**
     * Gets render batches for booster glows
     * @param {RenderMode} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @param {mat4} world
     * @param {Number} boosterGain
     * @param {Number} warpIntensity
     */
    EveSpriteSet.prototype.GetBoosterGlowBatches = function(mode, accumulator, perObjectData, world, boosterGain,
        warpIntensity)
    {
        if (this.display && mode == device.RM_ADDITIVE)
        {
            var batch = new EveSpriteSetBatch();
            batch.boosterGlow = true;
            batch.world = world;
            batch.boosterGain = boosterGain;
            batch.warpIntensity = warpIntensity;
            batch.renderMode = device.RM_ADDITIVE;
            batch.spriteSet = this;
            batch.perObjectData = perObjectData;
            accumulator.Commit(batch);
        }
    };

    /**
     * Renders the sprite set
     * @param {Tw2Effect} overrideEffect
     * @param {mat4} world
     * @param {Tw2PerObjectData} perObjectData
     */
    EveSpriteSet.prototype.Render = function(overrideEffect, world, perObjectData)
    {
        if (this.useQuads)
        {
            return this.RenderQuads(overrideEffect, world, perObjectData);
        }
        var effect = typeof(overrideEffect) == 'undefined' ? this.effect : overrideEffect;
        if (!effect || !this._vertexBuffer)
        {
            return;
        }
        var effectRes = effect.GetEffectRes();
        if (!effectRes.IsGood())
        {
            return;
        }
        device.SetStandardStates(device.RM_ADDITIVE);

        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._vertexBuffer);
        device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);

        for (var pass = 0; pass < effect.GetPassCount(); ++pass)
        {
            effect.ApplyPass(pass);
            if (!this._decl.SetDeclaration(effect.GetPassInput(pass), 52))
            {
                return;
            }
            device.ApplyShadowState();
            device.gl.drawElements(device.gl.TRIANGLES, this._indexBuffer.count, device.gl.UNSIGNED_SHORT, 0);
        }
    };

    /**
     * Renders the sprite set as booster glow
     * @param {Tw2Effect} overrideEffect
     * @param {mat4} world
     * @param {Number} boosterGain
     * @param {Number} warpIntensity
     */
    EveSpriteSet.prototype.RenderBoosterGlow = function(overrideEffect, world, boosterGain, warpIntensity)
    {
        var effect = typeof(overrideEffect) == 'undefined' ? this.effect : overrideEffect;
        if (!effect || !this._vertexBuffer)
        {
            return;
        }
        var effectRes = effect.GetEffectRes();
        if (!effectRes.IsGood())
        {
            return;
        }
        device.SetStandardStates(device.RM_ADDITIVE);

        var array = new Float32Array(17 * this.sprites.length);
        var index = 0;
        var pos = vec3.create();
        for (var i = 0; i < this.sprites.length; ++i)
        {
            mat4.multiplyVec3(world, this.sprites[i].position, pos);
            array[index++] = pos[0];
            array[index++] = pos[1];
            array[index++] = pos[2];
            array[index++] = world[8];
            array[index++] = this.sprites[i].blinkPhase;
            array[index++] = world[9];
            array[index++] = this.sprites[i].minScale;
            array[index++] = this.sprites[i].maxScale;
            array[index++] = world[10];
            array[index++] = this.sprites[i].color[0];
            array[index++] = this.sprites[i].color[1];
            array[index++] = this.sprites[i].color[2];
            array[index++] = boosterGain;
            array[index++] = this.sprites[i].warpColor[0];
            array[index++] = this.sprites[i].warpColor[1];
            array[index++] = this.sprites[i].warpColor[2];
            array[index++] = warpIntensity;
        }
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._instanceBuffer);
        device.gl.bufferData(device.gl.ARRAY_BUFFER, array, device.gl.DYNAMIC_DRAW);

        for (var pass = 0; pass < effect.GetPassCount(); ++pass)
        {
            effect.ApplyPass(pass);
            var passInput = effect.GetPassInput(pass);
            device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._vertexBuffer);
            this._vdecl.SetPartialDeclaration(passInput, 4);
            device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._instanceBuffer);
            var resetData = this._decl.SetPartialDeclaration(passInput, 17 * 4, 0, 1);
            device.ApplyShadowState();
            device.instancedArrays.drawArraysInstancedANGLE(device.gl.TRIANGLES, 0, 6, this.sprites.length);
            this._decl.ResetInstanceDivisors(resetData);
        }

    };

    /**
     * Renders the sprite set with pre-transformed quads
     * @param {Tw2Effect} overrideEffect
     * @param {mat4} world
     * @param {Tw2PerObjectData} perObjectData
     */
    EveSpriteSet.prototype.RenderQuads = function(overrideEffect, world, perObjectData)
    {
        var effect = typeof(overrideEffect) == 'undefined' ? this.effect : overrideEffect;
        if (!effect || !this._vertexBuffer)
        {
            return;
        }
        var effectRes = effect.GetEffectRes();
        if (!effectRes.IsGood())
        {
            return;
        }
        device.SetStandardStates(device.RM_ADDITIVE);

        var array = new Float32Array(17 * this.sprites.length);
        var index = 0;
        var pos = vec3.create();
        var bones = perObjectData.perObjectVSData.Get('JointMat');
        var sprite;
        for (var i = 0; i < this.sprites.length; ++i)
        {
            sprite = this.sprites[i];
            if (this.isSkinned)
            {
                var offset = sprite.boneIndex * 12;
                pos[0] = bones[offset] * sprite.position[0] + bones[offset + 1] * sprite.position[1] + bones[offset + 2] * sprite.position[2] + bones[offset + 3];
                pos[1] = bones[offset + 4] * sprite.position[0] + bones[offset + 5] * sprite.position[1] + bones[offset + 6] * sprite.position[2] + bones[offset + 7];
                pos[2] = bones[offset + 8] * sprite.position[0] + bones[offset + 9] * sprite.position[1] + bones[offset + 10] * sprite.position[2] + bones[offset + 11];
                mat4.multiplyVec3(world, pos);
            }
            else
            {
                mat4.multiplyVec3(world, sprite.position, pos);
            }
            array[index++] = pos[0];
            array[index++] = pos[1];
            array[index++] = pos[2];
            array[index++] = 1;
            array[index++] = sprite.blinkPhase;
            array[index++] = sprite.blinkRate;
            array[index++] = sprite.minScale;
            array[index++] = sprite.maxScale;
            array[index++] = sprite.falloff;
            array[index++] = sprite.color[0];
            array[index++] = sprite.color[1];
            array[index++] = sprite.color[2];
            array[index++] = 1;
            array[index++] = sprite.warpColor[0];
            array[index++] = sprite.warpColor[1];
            array[index++] = sprite.warpColor[2];
            array[index++] = 1;
        }
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._instanceBuffer);
        device.gl.bufferData(device.gl.ARRAY_BUFFER, array, device.gl.DYNAMIC_DRAW);

        for (var pass = 0; pass < effect.GetPassCount(); ++pass)
        {
            effect.ApplyPass(pass);
            var passInput = effect.GetPassInput(pass);
            device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._vertexBuffer);
            this._vdecl.SetPartialDeclaration(passInput, 4);
            device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._instanceBuffer);
            var resetData = this._decl.SetPartialDeclaration(passInput, 17 * 4, 0, 1);
            device.ApplyShadowState();
            device.instancedArrays.drawArraysInstancedANGLE(device.gl.TRIANGLES, 0, 6, this.sprites.length);
            this._decl.ResetInstanceDivisors(resetData);
        }

    };

    /**
     * Per frame update
     * @param {number} dt - Delta time
     */
    EveSpriteSet.prototype.Update = function(dt)
    {
        this._time += dt;
    };

    /**
     * Clears the sprite set's sprites
     */
    EveSpriteSet.prototype.Clear = function()
    {
        this.sprites = [];
    };

    /**
     * Adds a sprite set item to the sprite set
     * @param {vec3} pos
     * @param {number} blinkRate
     * @param {number} blinkPhase
     * @param {number} minScale
     * @param {number} maxScale
     * @param {number} falloff
     * @param {quat4} color
     * @constructor
     */
    EveSpriteSet.prototype.Add = function(pos, blinkRate, blinkPhase, minScale, maxScale, falloff, color)
    {
        var item = new EveSpriteSetItem();
        item.display = true;
        item.position = vec3.create(pos);
        item.blinkRate = blinkRate;
        item.blinkPhase = blinkPhase;
        item.minScale = minScale;
        item.maxScale = maxScale;
        item.falloff = falloff;
        item.color = quat4.create(color);
        this.sprites[this.sprites.length] = item;
    };

    /**
     * EveSpriteSetItem
     * @property {string} name
     * @property {vec3} position
     * @property {number} blinkRate
     * @property {number} minScale
     * @property {number} falloff
     * @property {quat4} color
     * @property {quat4} warpColor
     * @property {number} boneIndex
     * @property {number} groupIndex
     * @constructor
     */
    function EveSpriteSetItem()
    {
        this.display = true;
        this.name = '';
        this.position = vec3.create();
        this.blinkRate = 0;
        this.blinkPhase = 0;
        this.minScale = 1;
        this.maxScale = 1;
        this.falloff = 0;
        this.color = quat4.create();
        this.warpColor = quat4.create();
        this.boneIndex = 0;
        this.groupIndex = -1;
    }

    /**
     * Spotlight Item
     * @property {string} name
     * @property {mat4} transform
     * @property {quat4} coneColor
     * @property {quat4} spriteColor
     * @property {quat4} flareColor
     * @property {quat4} spriteScale
     * @property {boolean} boosterGainInfluence
     * @property {number} boneIndex
     * @property {number} groupIndex
     * @constructor
     */
    function EveSpotlightSetItem()
    {
        this.display = true;
        this.name = '';
        this.transform = mat4.create();
        this.coneColor = quat4.create();
        this.spriteColor = quat4.create();
        this.flareColor = quat4.create();
        this.spriteScale = vec3.create();
        this.boosterGainInfluence = false;
        this.boneIndex = 0;
        this.groupIndex = -1;
    }


    /**
     * EveSpotlightSet
     * @property {string} name
     * @property {boolean} display
     * @property {Tw2Effect} coneEffect
     * @property {Tw2Effect} glowEffect
     * @property {Array.<EveSpotlightSetItem) spotlightItems
     * @property {WebglBuffer} _conVertexBuffer
     * @property {WebglBuffer} _spriteVertexBuffer
     * @property {WebglBuffer} _indexBuffer
     * @property {Tw2VertexDeclaration} _decl
     * @constructor
     */
    function EveSpotlightSet()
    {
        this.name = '';
        this.display = true;
        this.coneEffect = null;
        this.glowEffect = null;
        this.spotlightItems = [];

        this._coneVertexBuffer = null;
        this._spriteVertexBuffer = null;
        this._indexBuffer = null;

        this._decl = new Tw2VertexDeclaration();
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_COLOR, 0, device.gl.FLOAT, 4, 0));
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 0, device.gl.FLOAT, 4, 16));
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 1, device.gl.FLOAT, 4, 32));
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 2, device.gl.FLOAT, 4, 48));
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 3, device.gl.FLOAT, 3, 64));
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 4, device.gl.FLOAT, 3, 76));
        this._decl.RebuildHash();
    }

    /**
     * Initializes the spotlight set
     */
    EveSpotlightSet.prototype.Initialize = function()
    {
        this.RebuildBuffers();
    };

    /**
     * Gets spotlight set res objects
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2EffectRes|Tw2TextureRes|Tw2GeometryRes>} [out]
     */
    EveSpotlightSet.prototype.GetResources = function(out)
    {
        if (out === undefined)
        {
            out = [];
        }

        if (this.coneEffect !== null)
        {
            this.coneEffect.GetResources(out);
        }

        if (this.glowEffect !== null)
        {
            this.glowEffect.GetResources(out);
        }
        return out;
    }

    /**
     * Rebuilds the spotlight set
     */
    EveSpotlightSet.prototype.RebuildBuffers = function()
    {
        var visibleItems = [];
        for (var i = 0; i < this.spotlightItems.length; i++)
        {
            if (this.spotlightItems[i].display)
            {
                visibleItems.push(this.spotlightItems[i]);
            }
        }

        var itemCount = visibleItems.length;
        if (itemCount == 0)
        {
            return;
        }
        var vertCount = 4;
        var coneQuadCount = 4;
        var coneVertexCount = itemCount * coneQuadCount * vertCount;

        var vertexSize = 22;
        var array = new Float32Array(coneVertexCount * vertexSize);

        var indexes = [1, 0, 2, 3];

        for (var i = 0; i < itemCount; ++i)
        {
            var item = visibleItems[i];
            for (var q = 0; q < coneQuadCount; ++q)
            {
                for (var v = 0; v < vertCount; ++v)
                {
                    var offset = (i * coneQuadCount * vertCount + vertCount * q + v) * vertexSize;
                    array[offset] = item.coneColor[0];
                    array[offset + 1] = item.coneColor[1];
                    array[offset + 2] = item.coneColor[2];
                    array[offset + 3] = item.coneColor[3];

                    array[offset + 4] = item.transform[0];
                    array[offset + 5] = item.transform[4];
                    array[offset + 6] = item.transform[8];
                    array[offset + 7] = item.transform[12];

                    array[offset + 8] = item.transform[1];
                    array[offset + 9] = item.transform[5];
                    array[offset + 10] = item.transform[9];
                    array[offset + 11] = item.transform[13];

                    array[offset + 12] = item.transform[2];
                    array[offset + 13] = item.transform[6];
                    array[offset + 14] = item.transform[10];
                    array[offset + 15] = item.transform[14];

                    array[offset + 16] = 1;
                    array[offset + 17] = 1;
                    array[offset + 18] = 1;

                    array[offset + 19] = q * vertCount + indexes[v];
                    array[offset + 20] = item.boneIndex;
                    array[offset + 21] = item.boosterGainInfluence ? 255 : 0;
                }
            }
        }

        this._coneVertexBuffer = device.gl.createBuffer();
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._coneVertexBuffer);
        device.gl.bufferData(device.gl.ARRAY_BUFFER, array, device.gl.STATIC_DRAW);
        this._coneVertexBuffer.count = itemCount * coneQuadCount * 6;

        var spriteQuadCount = 2;
        var spriteVertexCount = itemCount * spriteQuadCount * vertCount;
        array = new Float32Array(spriteVertexCount * vertexSize);

        var indexes = [1, 0, 2, 3];

        for (var i = 0; i < itemCount; ++i)
        {
            var item = visibleItems[i];
            for (var q = 0; q < spriteQuadCount; ++q)
            {
                for (var v = 0; v < vertCount; ++v)
                {
                    var offset = (i * spriteQuadCount * vertCount + vertCount * q + v) * vertexSize;
                    if (q % 2 == 0)
                    {
                        array[offset] = item.spriteColor[0];
                        array[offset + 1] = item.spriteColor[1];
                        array[offset + 2] = item.spriteColor[2];
                        array[offset + 3] = item.spriteColor[3];

                        array[offset + 16] = item.spriteScale[0];
                        array[offset + 17] = 1;
                        array[offset + 18] = 1;
                    }
                    else
                    {
                        array[offset] = item.flareColor[0];
                        array[offset + 1] = item.flareColor[1];
                        array[offset + 2] = item.flareColor[2];
                        array[offset + 3] = item.flareColor[3];

                        array[offset + 16] = 1;
                        array[offset + 17] = item.spriteScale[1];
                        array[offset + 18] = item.spriteScale[2];
                    }

                    array[offset + 4] = item.transform[0];
                    array[offset + 5] = item.transform[4];
                    array[offset + 6] = item.transform[8];
                    array[offset + 7] = item.transform[12];

                    array[offset + 8] = item.transform[1];
                    array[offset + 9] = item.transform[5];
                    array[offset + 10] = item.transform[9];
                    array[offset + 11] = item.transform[13];

                    array[offset + 12] = item.transform[2];
                    array[offset + 13] = item.transform[6];
                    array[offset + 14] = item.transform[10];
                    array[offset + 15] = item.transform[14];

                    array[offset + 19] = q * vertCount + indexes[v];
                    array[offset + 20] = item.boneIndex;
                    array[offset + 21] = item.boosterGainInfluence ? 255 : 0;
                }
            }
        }

        this._spriteVertexBuffer = device.gl.createBuffer();
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._spriteVertexBuffer);
        device.gl.bufferData(device.gl.ARRAY_BUFFER, array, device.gl.STATIC_DRAW);
        this._spriteVertexBuffer.count = itemCount * spriteQuadCount * 6;

        var indexes = new Uint16Array(itemCount * coneQuadCount * 6);
        for (var i = 0; i < itemCount * coneQuadCount; ++i)
        {
            var offset = i * 6;
            var vtxOffset = i * 4;
            indexes[offset] = vtxOffset;
            indexes[offset + 1] = vtxOffset + 1;
            indexes[offset + 2] = vtxOffset + 2;
            indexes[offset + 3] = vtxOffset + 2;
            indexes[offset + 4] = vtxOffset + 3;
            indexes[offset + 5] = vtxOffset + 0;
        }
        this._indexBuffer = device.gl.createBuffer();
        device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        device.gl.bufferData(device.gl.ELEMENT_ARRAY_BUFFER, indexes, device.gl.STATIC_DRAW);
        device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, null);
    };

    /**
     * Spotlight set render batch
     * @inherits Tw2RenderBatch
     * @constructor
     */
    function EveSpotlightSetBatch()
    {
        this._super.constructor.call(this);
        this.spotlightSet = null;
    }

    /**
     * Commits the spotlight set
     * @param {Tw2Effect} overrideEffect
     */
    EveSpotlightSetBatch.prototype.Commit = function(overrideEffect)
    {
        this.spotlightSet.RenderCones(overrideEffect);
        this.spotlightSet.RenderGlow(overrideEffect);
    };

    Inherit(EveSpotlightSetBatch, Tw2RenderBatch);

    /**
     * Gets render batches
     * @param {RenderMode} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     */
    EveSpotlightSet.prototype.GetBatches = function(mode, accumulator, perObjectData)
    {
        if (this.display && mode == device.RM_ADDITIVE)
        {
            var batch = new EveSpotlightSetBatch();
            batch.renderMode = device.RM_ADDITIVE;
            batch.spotlightSet = this;
            batch.perObjectData = perObjectData;
            accumulator.Commit(batch);
        }
    };

    /**
     * Renders Spotlight set Cones
     * @param {Tw2Effect} overrideEffect
     */
    EveSpotlightSet.prototype.RenderCones = function(overrideEffect)
    {
        var effect = (!overrideEffect) ? this.coneEffect : overrideEffect;
        this._Render(effect, this._coneVertexBuffer);
    };

    /**
     * Renders Spotlight set glows
     * @param {Tw2Effect} overrideEffect
     */
    EveSpotlightSet.prototype.RenderGlow = function(overrideEffect)
    {
        var effect = (!overrideEffect) ? this.glowEffect : overrideEffect;
        this._Render(effect, this._spriteVertexBuffer);
    };

    /**
     * Internal render function
     * @param {Tw2Effect} effect
     * @param {WebglBuffer} buffer
     * @private
     */
    EveSpotlightSet.prototype._Render = function(effect, buffer)
    {
        if (!effect || !buffer || !this._indexBuffer)
        {
            return;
        }
        var effectRes = effect.GetEffectRes();
        if (!effectRes.IsGood())
        {
            return;
        }

        device.SetStandardStates(device.RM_ADDITIVE);

        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, buffer);
        var stride = 22 * 4;
        device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);

        for (var pass = 0; pass < effect.GetPassCount(); ++pass)
        {
            effect.ApplyPass(pass);
            if (!this._decl.SetDeclaration(effect.GetPassInput(pass), stride))
            {
                return;
            }
            device.ApplyShadowState();
            device.gl.drawElements(device.gl.TRIANGLES, buffer.count, device.gl.UNSIGNED_SHORT, 0);
        }
    };

    /**
     * EvePlaneSet
     * @property {String} name
     * @property {Array.<EvePlaneSetItem>} planes
     * @property {Tw2Effect} effect
     * @property {boolean} display
     * @property {boolean} hideOnLowQuality
     * @property {number} _time
     * @property {WebglBuffer} _vertexBuffer
     * @property {WebglBuffer} _indexBuffer
     * @property {Tw2VertexDeclaration} _decl
     * @constructor
     */
    function EvePlaneSet()
    {
        this.name = '';
        this.planes = [];
        this.effect = null;
        this.display = true;
        this.hideOnLowQuality = false;
        this._time = 0;

        this._vertexBuffer = null;
        this._indexBuffer = null;
        this._decl = new Tw2VertexDeclaration();
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 0, device.gl.FLOAT, 4, 0));
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 1, device.gl.FLOAT, 4, 16));
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 2, device.gl.FLOAT, 4, 32));
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_COLOR, 0, device.gl.FLOAT, 4, 48));
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 3, device.gl.FLOAT, 4, 64));
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 4, device.gl.FLOAT, 4, 80));
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 5, device.gl.FLOAT, 4, 96));
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 6, device.gl.FLOAT, 4, 112));
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 7, device.gl.FLOAT, 3, 128));
        this._decl.RebuildHash();
    }

    /**
     * Initializes the plane set
     */
    EvePlaneSet.prototype.Initialize = function()
    {
        this.RebuildBuffers();
    };

    /**
     * Gets plane set res objects
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array} {Array.<Tw2EffectRes|Tw2TextureRes|Tw2GeometryRes>} [out]
     */
    EvePlaneSet.prototype.GetResources = function(out)
    {
        if (out === undefined)
        {
            out = [];
        }

        if (this.effect !== null)
        {
            this.effect.GetResources(out);
        }

        return out;
    }

    /**
     * Rebuilds the plane set's buffers
     */
    EvePlaneSet.prototype.RebuildBuffers = function()
    {
        var vertexSize = 35;
        var visibleItems = [];

        for (var n = 0; n < this.planes.length; n++)
        {
            if (this.planes[n].display)
            {
                visibleItems.push(this.planes[n]);
            }
        }

        var array = new Float32Array(visibleItems.length * 4 * vertexSize);
        var tempMat = mat4.create();
        for (var i = 0; i < visibleItems.length; ++i)
        {
            var offset = i * 4 * vertexSize;
            array[offset + vertexSize - 3] = 0;
            array[offset + vertexSize + vertexSize - 3] = 1;
            array[offset + 2 * vertexSize + vertexSize - 3] = 2;
            array[offset + 3 * vertexSize + vertexSize - 3] = 3;

            var itemTransform = mat4.transpose(mat4.multiply(mat4.scale(mat4.identity(mat4.create()), visibleItems[i].scaling), quat4.toMat4(visibleItems[i].rotation, tempMat)));
            itemTransform[12] = visibleItems[i].position[0];
            itemTransform[13] = visibleItems[i].position[1];
            itemTransform[14] = visibleItems[i].position[2];

            for (var j = 0; j < 4; ++j)
            {
                vtxOffset = offset + j * vertexSize;
                array[vtxOffset + 0] = itemTransform[0];
                array[vtxOffset + 1] = itemTransform[4];
                array[vtxOffset + 2] = itemTransform[8];
                array[vtxOffset + 3] = itemTransform[12];
                array[vtxOffset + 4] = itemTransform[1];
                array[vtxOffset + 5] = itemTransform[5];
                array[vtxOffset + 6] = itemTransform[9];
                array[vtxOffset + 7] = itemTransform[13];
                array[vtxOffset + 8] = itemTransform[2];
                array[vtxOffset + 9] = itemTransform[6];
                array[vtxOffset + 10] = itemTransform[10];
                array[vtxOffset + 11] = itemTransform[14];

                array[vtxOffset + 12] = visibleItems[i].color[0];
                array[vtxOffset + 13] = visibleItems[i].color[1];
                array[vtxOffset + 14] = visibleItems[i].color[2];
                array[vtxOffset + 15] = visibleItems[i].color[3];

                array[vtxOffset + 16] = visibleItems[i].layer1Transform[0];
                array[vtxOffset + 17] = visibleItems[i].layer1Transform[1];
                array[vtxOffset + 18] = visibleItems[i].layer1Transform[2];
                array[vtxOffset + 19] = visibleItems[i].layer1Transform[3];

                array[vtxOffset + 20] = visibleItems[i].layer2Transform[0];
                array[vtxOffset + 21] = visibleItems[i].layer2Transform[1];
                array[vtxOffset + 22] = visibleItems[i].layer2Transform[2];
                array[vtxOffset + 23] = visibleItems[i].layer2Transform[3];

                array[vtxOffset + 24] = visibleItems[i].layer1Scroll[0];
                array[vtxOffset + 25] = visibleItems[i].layer1Scroll[1];
                array[vtxOffset + 26] = visibleItems[i].layer1Scroll[2];
                array[vtxOffset + 27] = visibleItems[i].layer1Scroll[3];

                array[vtxOffset + 28] = visibleItems[i].layer2Scroll[0];
                array[vtxOffset + 29] = visibleItems[i].layer2Scroll[1];
                array[vtxOffset + 30] = visibleItems[i].layer2Scroll[2];
                array[vtxOffset + 31] = visibleItems[i].layer2Scroll[3];

                array[vtxOffset + 33] = visibleItems[i].boneIndex;
                array[vtxOffset + 34] = visibleItems[i].maskAtlasID;
            }
        }
        this._vertexBuffer = device.gl.createBuffer();
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._vertexBuffer);
        device.gl.bufferData(device.gl.ARRAY_BUFFER, array, device.gl.STATIC_DRAW);
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, null);

        var indexes = new Uint16Array(visibleItems.length * 6);
        for (i = 0; i < visibleItems.length; ++i)
        {
            var offset = i * 6;
            var vtxOffset = i * 4;
            indexes[offset] = vtxOffset;
            indexes[offset + 1] = vtxOffset + 2;
            indexes[offset + 2] = vtxOffset + 1;
            indexes[offset + 3] = vtxOffset + 0;
            indexes[offset + 4] = vtxOffset + 3;
            indexes[offset + 5] = vtxOffset + 2;
        }
        this._indexBuffer = device.gl.createBuffer();
        device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        device.gl.bufferData(device.gl.ELEMENT_ARRAY_BUFFER, indexes, device.gl.STATIC_DRAW);
        device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, null);
        this._indexBuffer.count = visibleItems.length * 6;
    };

    /**
     * Plane set render batch
     * @inherits Tw2RenderBatch
     * @constructor
     */
    function EvePlaneSetBatch()
    {
        this._super.constructor.call(this);
        this.planeSet = null;
    }

    /**
     * Commits the plan set
     * @param {Tw2Effect} [overrideEffect]
     * @constructor
     */
    EvePlaneSetBatch.prototype.Commit = function(overrideEffect)
    {
        this.planeSet.Render(overrideEffect);
    };

    Inherit(EvePlaneSetBatch, Tw2RenderBatch);


    /**
     * Gets the plane set's render batches
     * @param {RenderMode} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     */
    EvePlaneSet.prototype.GetBatches = function(mode, accumulator, perObjectData)
    {
        if (this.display && mode == device.RM_ADDITIVE)
        {
            var batch = new EvePlaneSetBatch();
            batch.renderMode = device.RM_ADDITIVE;
            batch.planeSet = this;
            batch.perObjectData = perObjectData;
            accumulator.Commit(batch);
        }
    };

    /**
     * Renders the plane set
     * @param {Tw2Effect} [overrideEffect]
     * @constructor
     */
    EvePlaneSet.prototype.Render = function(overrideEffect)
    {
        var effect = (!overrideEffect) ? this.effect : overrideEffect;
        if (!effect || !this._vertexBuffer)
        {
            return;
        }
        var effectRes = effect.GetEffectRes();
        if (!effectRes.IsGood())
        {
            return;
        }
        device.SetStandardStates(device.RM_ADDITIVE);

        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._vertexBuffer);
        device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);

        for (var pass = 0; pass < effect.GetPassCount(); ++pass)
        {
            effect.ApplyPass(pass);
            if (!this._decl.SetDeclaration(effect.GetPassInput(pass), 140))
            {
                return;
            }
            device.ApplyShadowState();
            device.gl.drawElements(device.gl.TRIANGLES, this._indexBuffer.count, device.gl.UNSIGNED_SHORT, 0);
        }
    };

    /**
     * Per frame update
     * @param {number} dt - Delta Time
     */
    EvePlaneSet.prototype.Update = function(dt)
    {
        this._time += dt;
    };

    /**
     * Clears the plane set's plane items
     */
    EvePlaneSet.prototype.Clear = function()
    {
        this.planes = [];
    };


    /**
     * EvePlaneSetItem
     * @property {string} name
     * @property {vec3} position
     * @property {vec3} scaling
     * @property {quat4} rotation
     * @property {quat4} color
     * @property {quat4} layer1Transform
     * @property {quat4} layer2Transform
     * @property {quat4} layer1Scroll
     * @property {quat4} layer2Scroll
     * @property {number} boneIndex
     * @property {number} groupIndex
     * @constructor
     */
    function EvePlaneSetItem()
    {
        this.display = true;
        this.name = '';
        this.position = vec3.create();
        this.scaling = vec3.create([1, 1, 1]);
        this.rotation = quat4.create([0, 0, 0, 1]);
        this.color = quat4.create([1, 1, 1, 1]);
        this.layer1Transform = quat4.create([1, 1, 0, 0]);
        this.layer2Transform = quat4.create([1, 1, 0, 0]);
        this.layer1Scroll = quat4.create();
        this.layer2Scroll = quat4.create();
        this.boneIndex = 0;
        this.groupIndex = -1;
        this.maskAtlasID = 0;
    }

    /**
     * EveBasicPerObjectData
     * @parameter perObjectVSData - Vertex shader data
     * @parameter perObjectPSData - Pixel shader data
     * @parameter perObjectFFEData - Fixed Function Emulation data
     * @constructor
     */
    function EveBasicPerObjectData()
    {}

    /**
     * SetPerObjectDataToDevice
     * @param constantBufferHandles
     * @constructor
     */
    EveBasicPerObjectData.prototype.SetPerObjectDataToDevice = function(constantBufferHandles)
    {
        if (this.perObjectVSData && constantBufferHandles[3])
        {
            device.gl.uniform4fv(constantBufferHandles[3], this.perObjectVSData.data);
        }
        if (this.perObjectPSData && constantBufferHandles[4])
        {
            device.gl.uniform4fv(constantBufferHandles[4], this.perObjectPSData.data);
        }
        if (this.perObjectFFEData && constantBufferHandles[5])
        {
            device.gl.uniform4fv(constantBufferHandles[5], this.perObjectFFEData.data);
        }
    };

    /**
     * EveTransform
     * @property {String} name
     * @property {Tw2Mesh} mesh
     * @property {Number} Modifier
     * @property {Number} NONE - modifier option
     * @property {Number} BILLBOARD - modifier option
     * @property {Number} TRANSLATE_WITH_CAMERA - modifier option
     * @property {Number} LOOK_AT_CAMERA - modifier option
     * @property {Number} SIMPLE_HALO - modifier option
     * @property {Number} EVE_CAMERA_ROTATION_ALIGNED - modifier option
     * @property {Number} EVE_BOOSTER - modifier option
     * @property {Number} EVE_SIMPLE_HALO - modifier option
     * @property {Number} EVE_CAMERA_ROTATION - modifier option
     * @property {Number} sortValueMultiplier
     * @property {Number} distanceBasedScaleArg1
     * @property {Number} distanceBasedScaleArg2
     * @property {Boolean} useDistanceBasedScale
     * @property {Array.<Tw2ParticleSystem>} particleSystems
     * @property {Array.<Tw2ParticleEmitter>} particleEmitters
     * @property {Array.<Tw2CurveSet>} curveSets
     * @property {Array} children
     * @property {Boolean} display
     * @property {Boolean} displayMesh
     * @property {Boolean} displayChildren
     * @property {vec3} scaling
     * @property {vec3} translation
     * @property {quat4} rotation
     * @property {mat4} localTransform
     * @property {mat4} rotationTransform
     * @property {mat4} worldTransform
     * @property {Array.<mat4>} _mat4Cache
     * @property {Array.<vec3>} _vec3Cache
     * @property {EveBasicPerObjectData} _perObjectData
     * @constructor
     */
    function EveTransform()
    {
        this.name = '';
        this.mesh = null;

        this.modifier = this.NONE;
        this.NONE = 0;
        this.BILLBOARD = 1;
        this.TRANSLATE_WITH_CAMERA = 2;
        this.LOOK_AT_CAMERA = 3;
        this.SIMPLE_HALO = 4;
        this.EVE_CAMERA_ROTATION_ALIGNED = 100;
        this.EVE_BOOSTER = 101;
        this.EVE_SIMPLE_HALO = 102;
        this.EVE_CAMERA_ROTATION = 103;

        this.sortValueMultiplier = 1.0;
        this.distanceBasedScaleArg1 = 0.2;
        this.distanceBasedScaleArg2 = 0.63;
        this.useDistanceBasedScale = false;

        this.particleSystems = [];
        this.particleEmitters = [];
        this.curveSets = [];
        this.children = [];

        this.display = true;
        this.displayMesh = true;
        this.displayChildren = true;

        this.scaling = vec3.create([1, 1, 1]);
        this.translation = vec3.create([0, 0, 0]);
        this.rotation = quat4.create([0, 0, 0, 1]);
        this.localTransform = mat4.create();
        this.rotationTransform = mat4.identity(mat4.create());
        this.worldTransform = mat4.identity(mat4.create());

        this._mat4Cache = [mat4.create(), mat4.create()];
        this._vec3Cache = [];
        for (var i = 0; i < 7; ++i)
        {
            this._vec3Cache[i] = vec3.create();
        }

        this._perObjectData = new EveBasicPerObjectData();
        this._perObjectData.perObjectFFEData = new Tw2RawData();
        this._perObjectData.perObjectFFEData.Declare('World', 16);
        this._perObjectData.perObjectFFEData.Declare('WorldInverseTranspose', 16);
        this._perObjectData.perObjectFFEData.Create();
    }

    /**
     * Initializes the EveTransform
     */
    EveTransform.prototype.Initialize = function()
    {
        mat4.identity(this.localTransform);
        mat4.translate(this.localTransform, this.translation);
        mat4.transpose(quat4.toMat4(this.rotation, this.rotationTransform));
        mat4.multiply(this.localTransform, this.rotationTransform, this.localTransform);
        mat4.scale(this.localTransform, this.scaling);
    };

    /**
     * Gets transform res objects
     * @param {Array} [out=[]] - Optional receiving array
     * @param {Boolean} excludeChildren - True to exclude children's res objects
     * @returns {Array.<Tw2EffectRes|Tw2TextureRes|Tw2GeometryRes>} [out]
     */
    EveTransform.prototype.GetResources = function(out, excludeChildren)
    {
        if (out === undefined)
        {
            out = [];
        };

        if (this.mesh !== null)
        {
            this.mesh.GetResources(out);
        }

        if (!excludeChildren)
        {
            for (var i = 0; i < this.children; i++)
            {
                this.children[i].GetResources(out);
            }
        }

        return out;
    }

    /**
     * Gets render batches for accumulation
     * @param {RenderMode} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     */
    EveTransform.prototype.GetBatches = function(mode, accumulator, perObjectData)
    {
        if (!this.display)
        {
            return;
        }

        if (this.displayMesh && this.mesh != null)
        {
            mat4.transpose(this.worldTransform, this._perObjectData.perObjectFFEData.Get('World'));
            mat4.inverse(this.worldTransform, this._perObjectData.perObjectFFEData.Get('WorldInverseTranspose'));
            if (perObjectData)
            {
                this._perObjectData.perObjectVSData = perObjectData.perObjectVSData;
                this._perObjectData.perObjectPSData = perObjectData.perObjectPSData;
            }
            this.mesh.GetBatches(mode, accumulator, this._perObjectData);
        }

        if (this.displayChildren)
        {
            for (var i = 0; i < this.children.length; ++i)
            {
                this.children[i].GetBatches(mode, accumulator, perObjectData);
            }
        }
    }

    /**
     * Per frame update
     * @param {Number} dt - delta time
     */
    EveTransform.prototype.Update = function(dt)
    {
        for (var i = 0; i < this.children.length; ++i)
        {
            this.children[i].Update(dt);
        }
        for (var i = 0; i < this.particleEmitters.length; ++i)
        {
            this.particleEmitters[i].Update(dt);
        }
        for (var i = 0; i < this.particleSystems.length; ++i)
        {
            this.particleSystems[i].Update(dt);
        }
        for (var i = 0; i < this.curveSets.length; ++i)
        {
            this.curveSets[i].Update(dt);
        }
    };

    /**
     * multiply3x3
     */
    mat4.multiply3x3 = function(a, b, c)
    {
        c || (c = b);
        var d = b[0],
            e = b[1];
        b = b[2];
        c[0] = a[0] * d + a[4] * e + a[8] * b;
        c[1] = a[1] * d + a[5] * e + a[9] * b;
        c[2] = a[2] * d + a[6] * e + a[10] * b;
        return c;
    };

    /**
     * Per frame update
     * @param {Mat4} parentTransform
     */
    EveTransform.prototype.UpdateViewDependentData = function(parentTransform)
    {
        mat4.identity(this.localTransform);
        mat4.translate(this.localTransform, this.translation);
        mat4.transpose(quat4.toMat4(quat4.normalize(this.rotation), this.rotationTransform));
        mat4.multiply(this.localTransform, this.rotationTransform, this.localTransform);
        mat4.scale(this.localTransform, this.scaling);
        switch (this.modifier)
        {
            case this.BILLBOARD:
            case this.SIMPLE_HALO:
                {
                    mat4.multiply(parentTransform, this.localTransform, this.worldTransform);

                    var finalScale = this._vec3Cache[0];
                    vec3.set(this.scaling, finalScale);
                    var parentScaleX = vec3.length(parentTransform);
                    var parentScaleY = vec3.length(parentTransform.subarray(4));
                    var parentScaleZ = vec3.length(parentTransform.subarray(8));
                    finalScale[0] *= parentScaleX;
                    finalScale[1] *= parentScaleY;
                    finalScale[2] *= parentScaleZ;
                    if (this.modifier == this.SIMPLE_HALO)
                    {
                        var camPos = device.GetEyePosition();
                        var d = this._vec3Cache[1];
                        vec3.subtract(camPos, this.worldTransform.subarray(12), d);
                        var scale = vec3.dot(vec3.normalize(d), vec3.normalize(this.worldTransform.subarray(8), this._vec3Cache[2]));
                        if (scale < 0)
                        {
                            scale = 0;
                        }
                        vec3.scale(finalScale, scale * scale);
                    }
                    var invView = device.viewInv;
                    this.worldTransform[0] = invView[0] * finalScale[0];
                    this.worldTransform[1] = invView[1] * finalScale[0];
                    this.worldTransform[2] = invView[2] * finalScale[0];
                    this.worldTransform[4] = invView[4] * finalScale[1];
                    this.worldTransform[5] = invView[5] * finalScale[1];
                    this.worldTransform[6] = invView[6] * finalScale[1];
                    this.worldTransform[8] = invView[8] * finalScale[2];
                    this.worldTransform[9] = invView[9] * finalScale[2];
                    this.worldTransform[10] = invView[10] * finalScale[2];
                }
                break;
            case this.EVE_CAMERA_ROTATION:
                {
                    var newTranslation = mat4.multiplyVec3(parentTransform, this.translation, vec3.create());

                    mat4.identity(this.localTransform);
                    mat4.translate(this.localTransform, newTranslation);
                    mat4.transpose(quat4.toMat4(this.rotation, this.rotationTransform));
                    mat4.multiply(this.localTransform, this.rotationTransform, this.localTransform);
                    mat4.scale(this.localTransform, this.scaling);

                    var x = this.localTransform[12];
                    var y = this.localTransform[13];
                    var z = this.localTransform[14];
                    mat4.multiply(device.viewInv, this.localTransform, this.worldTransform);
                    this.worldTransform[12] = x;
                    this.worldTransform[13] = y;
                    this.worldTransform[14] = z;
                }
                break;
            case this.EVE_CAMERA_ROTATION_ALIGNED:
            case this.EVE_SIMPLE_HALO:
                {
                    // 3 4 3 3 3 4 3 3
                    mat4.translate(parentTransform, this.translation, this.worldTransform);

                    var camPos = device.GetEyePosition();
                    var d = this._vec3Cache[0];
                    d[0] = camPos[0] - this.worldTransform[12];
                    d[1] = camPos[1] - this.worldTransform[13];
                    d[2] = camPos[2] - this.worldTransform[14];

                    var parentT = this._mat4Cache[0];
                    mat4.transpose(parentTransform, parentT);
                    var camFwd = this._vec3Cache[1];
                    vec3.set(d, camFwd);
                    mat4.multiply3x3(parentT, camFwd);

                    var parentScaleX = vec3.length(parentTransform);
                    camFwd[0] /= parentScaleX;
                    var parentScaleY = vec3.length(parentTransform.subarray(4));
                    camFwd[1] /= parentScaleY;
                    var parentScaleZ = vec3.length(parentTransform.subarray(8));
                    camFwd[2] /= parentScaleZ;

                    var distCenter = vec3.length(camFwd);
                    vec3.normalize(camFwd);

                    var right = this._vec3Cache[2];
                    right[0] = device.view[0];
                    right[1] = device.view[4];
                    right[2] = device.view[8];
                    mat4.multiply3x3(parentT, right);
                    vec3.normalize(right);

                    var up = this._vec3Cache[3];
                    vec3.cross(camFwd, right, up);
                    vec3.normalize(up);

                    var alignMat = this._mat4Cache[1];
                    vec3.cross(up, camFwd, right);
                    alignMat[0] = right[0];
                    alignMat[1] = right[1];
                    alignMat[2] = right[2];
                    alignMat[4] = up[0];
                    alignMat[5] = up[1];
                    alignMat[6] = up[2];
                    alignMat[8] = camFwd[0];
                    alignMat[9] = camFwd[1];
                    alignMat[10] = camFwd[2];
                    alignMat[15] = 1;
                    mat4.multiply(alignMat, this.rotationTransform, alignMat);

                    if (this.modifier == this.EVE_SIMPLE_HALO)
                    {
                        var forward = this._vec3Cache[4];
                        vec3.normalize(this.worldTransform.subarray(8), forward);
                        var dirToCamNorm = d;
                        vec3.normalize(dirToCamNorm);
                        var scale = -vec3.dot(dirToCamNorm, forward);
                        if (scale < 0)
                        {
                            scale = 0;
                        }
                        mat4.multiply(this.worldTransform, alignMat, this.worldTransform);
                        mat4.scale(this.worldTransform, [this.scaling[0] * scale, this.scaling[1] * scale, this.scaling[2] * scale]);
                    }
                    else
                    {
                        mat4.scale(this.worldTransform, this.scaling);
                        mat4.multiply(this.worldTransform, alignMat, this.worldTransform);
                    }
                }
                break;
            case this.LOOK_AT_CAMERA:
                {
                    mat4.multiply(parentTransform, this.localTransform, this.worldTransform);
                    var invView = this._mat4Cache[0];
                    mat4.lookAt(device.viewInv.subarray(12), this.worldTransform.subarray(12), [0, 1, 0], invView);
                    mat4.transpose(invView);

                    var finalScale = this._vec3Cache[0];
                    vec3.set(this.scaling, finalScale);
                    var parentScaleX = vec3.length(parentTransform);
                    var parentScaleY = vec3.length(parentTransform.subarray(4));
                    var parentScaleZ = vec3.length(parentTransform.subarray(8));
                    finalScale[0] *= parentScaleX;
                    finalScale[1] *= parentScaleY;
                    finalScale[2] *= parentScaleZ;

                    this.worldTransform[0] = invView[0] * finalScale[0];
                    this.worldTransform[1] = invView[1] * finalScale[0];
                    this.worldTransform[2] = invView[2] * finalScale[0];
                    this.worldTransform[4] = invView[4] * finalScale[1];
                    this.worldTransform[5] = invView[5] * finalScale[1];
                    this.worldTransform[6] = invView[6] * finalScale[1];
                    this.worldTransform[8] = invView[8] * finalScale[2];
                    this.worldTransform[9] = invView[9] * finalScale[2];
                    this.worldTransform[10] = invView[10] * finalScale[2];
                }
                break;
            default:
                mat4.multiply(parentTransform, this.localTransform, this.worldTransform);
        }
        for (var i = 0; i < this.children.length; ++i)
        {
            this.children[i].UpdateViewDependentData(this.worldTransform);
        }
    };

    /**
     * EveTurretData
     * @property {String} name
     * @property {boolean} visible
     * @property {mat4} localTransform
     * @property {quat4} rotation
     * @constructor
     */
    function EveTurretData()
    {
        this.name = '';
        this.visible = true;
        this.localTransform = mat4.create();
        this.rotation = quat4.create();
    }

    /**
     * EveTurretSet
     * @property {boolean} display
     * @property {string} name
     * @property {quat4} boundingSphere
     * @property {number} bottomClipHeight
     * @property {string} locatorName
     * @property {Tw2Effect} turretEffect
     * @property {vec3} targetPosition
     * @property {number} sysBoneHeight
     * @property {string} firingEffectResPath
     * @property {EveTurretFiringFx} firingEffect
     * @property {boolean} hasCyclingFiringPos
     * @property {string} geometryResPath
     * @property {Tw2GeometryRes} geometryResource
     * @property {Tw2AnimationController} activeAnimation
     * @property {Tw2AnimationController} inactiveAnimation
     * @property {mat4} parentMatrix
     * @property {Array.<EveTurretData>} turrets
     * @property {number} STATE_INACTIVE
     * @property {number} STATE_IDLE
     * @property {number} STATE_FIRING
     * @property {number} STATE_PACKING
     * @property {number} STATE_UNPACKING
     * @property {number} state

     * @property {Tw2PerObjectData} _perObjectDataActive
     * @property {Tw2PerObjectData} _perObjectDataInactive
     * @property {Array.<string>} worldNames
     * @property {number} _activeTurret
     * @property {number} _recheckTimeLeft
     * @property {number} _currentCyclingFiresPos
     * @constructor
     */
    function EveTurretSet()
    {
        this.display = true;
        this.name = '';
        this.boundingSphere = quat4.create();
        this.bottomClipHeight = 0;
        this.locatorName = '';
        this.sysBoneHeight = 0;

        this.turrets = [];
        this.turretEffect = null;
        this.targetPosition = vec3.create();
        this.firingEffectResPath = '';
        this.firingEffect = null;
        this.fireCallback = null;
        this.fireCallbackPending = false;

        this.hasCyclingFiringPos = false;
        this.geometryResPath = '';
        this.geometryResource = null;

        this.activeAnimation = new Tw2AnimationController();
        this.inactiveAnimation = new Tw2AnimationController();

        this.parentMatrix = mat4.identity(mat4.create());

        this.STATE_INACTIVE = 0;
        this.STATE_IDLE = 1;
        this.STATE_FIRING = 2;
        this.STATE_PACKING = 3;
        this.STATE_UNPACKING = 4;

        this.state = this.STATE_IDLE;

        this._perObjectDataActive = new Tw2PerObjectData();
        this._perObjectDataActive.perObjectVSData = new Tw2RawData();
        this._perObjectDataActive.perObjectVSData.Declare('baseCutoffData', 4);
        this._perObjectDataActive.perObjectVSData.Declare('turretSetData', 4);
        this._perObjectDataActive.perObjectVSData.Declare('shipMatrix', 16);
        this._perObjectDataActive.perObjectVSData.Declare('turretTranslation', 4 * 24);
        this._perObjectDataActive.perObjectVSData.Declare('turretRotation', 4 * 24);
        this._perObjectDataActive.perObjectVSData.Declare('turretPoseTransAndRot', 2 * 4 * 72);
        this._perObjectDataActive.perObjectVSData.Create();

        this._perObjectDataInactive = new Tw2PerObjectData();
        this._perObjectDataInactive.perObjectVSData = new Tw2RawData();
        this._perObjectDataInactive.perObjectVSData.Declare('baseCutoffData', 4);
        this._perObjectDataInactive.perObjectVSData.Declare('turretSetData', 4);
        this._perObjectDataInactive.perObjectVSData.Declare('shipMatrix', 16);
        this._perObjectDataInactive.perObjectVSData.Declare('turretTranslation', 4 * 24);
        this._perObjectDataInactive.perObjectVSData.Declare('turretRotation', 4 * 24);
        this._perObjectDataInactive.perObjectVSData.Declare('turretPoseTransAndRot', 2 * 4 * 72);
        this._perObjectDataInactive.perObjectVSData.Create();

        this.worldNames = ['turretWorld0', 'turretWorld1', 'turretWorld2'];

        this._activeTurret = -1;
        this._recheckTimeLeft = 0;
        this._currentCyclingFiresPos = 0;
    }

    /**
     * Bone Skeleton Names
     * @type {string[]}
     */
    EveTurretSet.positionBoneSkeletonNames = [
        "Pos_Fire01",
        "Pos_Fire02",
        "Pos_Fire03",
        "Pos_Fire04",
        "Pos_Fire05",
        "Pos_Fire06",
        "Pos_Fire07",
        "Pos_Fire08"
    ];

    /**
     * Initializes the Turret Set
     */
    EveTurretSet.prototype.Initialize = function()
    {
        if (this.turretEffect && this.geometryResPath != '')
        {
            this.geometryResource = resMan.GetResource(this.geometryResPath);
            this.activeAnimation.SetGeometryResource(this.geometryResource);
            this.inactiveAnimation.SetGeometryResource(this.geometryResource);
            if (this.geometryResource)
            {
                this.geometryResource.RegisterNotification(this);
            }
        }
        if (this.firingEffectResPath != '')
        {
            var self = this;
            resMan.GetObject(this.firingEffectResPath, function(object)
            {
                self.firingEffect = object;
            });
        }
    };

    /**
     * Gets turret set res objects
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2EffectRes|Tw2TextureRes|Tw2GeometryRes>} [out]
     */
    EveTurretSet.prototype.GetResources = function(out)
    {
        if (out === undefined)
        {
            out = [];
        }

        if (this.geometryResource !== null)
        {
            if (out.indexOf(this.geometryResource) === -1)
            {
                out.push(this.geometryResource);
            }
        }

        if (this.turretEffect !== null)
        {
            this.turretEffect.GetResources(out);
        }

        if (this.firingEffect !== null)
        {
            this.firingEffect.GetResources(out);
        }

        return out;
    }

    /**
     * Rebuilds the turret sets cached data
     */
    EveTurretSet.prototype.RebuildCachedData = function()
    {
        var instancedElement = new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 1, device.gl.FLOAT, 2);
        for (var i = 0; i < this.geometryResource.meshes.length; ++i)
        {
            this.geometryResource.meshes[i].declaration.elements.push(instancedElement);
            this.geometryResource.meshes[i].declaration.RebuildHash();
        }
        var self = this;
        switch (this.state)
        {
            case this.STATE_INACTIVE:
                this.activeAnimation.PlayAnimation("Inactive", true);
                this.inactiveAnimation.PlayAnimation("Inactive", true);
                break;
            case this.STATE_IDLE:
                this.activeAnimation.PlayAnimation("Active", true);
                this.inactiveAnimation.PlayAnimation("Active", true);
                break;
            case this.STATE_FIRING:
                this.activeAnimation.PlayAnimation("Fire", false, function()
                {
                    self.activeAnimation.PlayAnimation("Active", true);
                });
                this.inactiveAnimation.PlayAnimation("Active", true);
                break;
            case this.STATE_PACKING:
                this.EnterStateIdle();
                break;
            case this.STATE_UNPACKING:
                this.EnterStateDeactive();
                break;
        }
    };

    /**
     * Initializes turret set firing effect
     */
    EveTurretSet.prototype.InitializeFiringEffect = function()
    {
        if (!this.firingEffect)
        {
            return;
        }
        if (this.geometryResource && this.geometryResource.models.length)
        {
            var model = this.geometryResource.models[0];
            for (var i = 0; i < this.firingEffect.GetPerMuzzleEffectCount(); ++i)
            {
                this.firingEffect.SetMuzzleBoneID(i, model.FindBoneByName(EveTurretSet.positionBoneSkeletonNames[i]));
            }
        }
    };

    /**
     * Sets the local transform for a specific turret index
     * @param {number} index
     * @param {mat4} localTransform
     * @param {String} locatorName
     */
    EveTurretSet.prototype.SetLocalTransform = function(index, localTransform, locatorName)
    {
        var transform = mat4.create(localTransform);
        vec3.normalize(transform.subarray(0, 3));
        vec3.normalize(transform.subarray(4, 7));
        vec3.normalize(transform.subarray(8, 11));
        if (index >= this.turrets.length)
        {
            var data = new EveTurretData();
            data.name = locatorName;
            data.localTransform.set(transform);
            this.turrets[index] = data;
        }
        else
        {
            this.turrets[index].localTransform.set(transform);
        }
        mat4toquat(this.turrets[index].localTransform, this.turrets[index].rotation);
    };

    function mat3x4toquat(mm, index, out, outIndex)
    {
        index *= 12;
        outIndex *= 4;
        var m = mat3x4toquat._tempMat;
        m[0] = mm[index + 0];
        m[1] = mm[index + 4];
        m[2] = mm[index + 8];
        m[3] = 0;
        m[4] = mm[index + 1];
        m[5] = mm[index + 5];
        m[6] = mm[index + 9];
        m[7] = 0;
        m[8] = mm[index + 2];
        m[9] = mm[index + 6];
        m[10] = mm[index + 10];
        m[11] = 0;
        m[12] = mm[index + 3];
        m[13] = mm[index + 7];
        m[14] = mm[index + 11];
        m[15] = 1;
        var q = mat3x4toquat._tempQuat;
        mat4toquat(m, q);
        out[outIndex] = q[0];
        out[outIndex + 1] = q[1];
        out[outIndex + 2] = q[2];
        out[outIndex + 3] = q[3];
    }

    mat3x4toquat._tempMat = mat4.create();
    mat3x4toquat._tempQuat = quat4.create();


    function mat4toquat(m, out)
    {
        out = out || quat4.create();
        var trace = m[0] + m[5] + m[10] + 1.0;
        if (trace > 1.0)
        {
            out[0] = (m[6] - m[9]) / (2.0 * Math.sqrt(trace));
            out[1] = (m[8] - m[2]) / (2.0 * Math.sqrt(trace));
            out[2] = (m[1] - m[4]) / (2.0 * Math.sqrt(trace));
            out[3] = Math.sqrt(trace) / 2.0;
            return out;
        }
        var maxi = 0;
        var maxdiag = m[0];
        for (var i = 1; i < 3; i++)
        {
            if (m[i * 4 + i] > maxdiag)
            {
                maxi = i;
                maxdiag = m[i * 4 + i];
            }
        }
        var S;
        switch (maxi)
        {
            case 0:
                S = 2.0 * Math.sqrt(1.0 + m[0] - m[5] - m[10]);
                out[0] = 0.25 * S;
                out[1] = (m[1] + m[4]) / S;
                out[2] = (m[2] + m[8]) / S;
                out[3] = (m[6] - m[9]) / S;
                break;
            case 1:
                S = 2.0 * Math.sqrt(1.0 + m[5] - m[0] - m[10]);
                out[0] = (m[1] + m[4]) / S;
                out[1] = 0.25 * S;
                out[2] = (m[6] + m[9]) / S;
                out[3] = (m[8] - m[2]) / S;
                break;
            case 2:
                S = 2.0 * Math.sqrt(1.0 + m[10] - m[0] - m[5]);
                out[0] = (m[2] + m[8]) / S;
                out[1] = (m[6] + m[9]) / S;
                out[2] = 0.25 * S;
                out[3] = (m[1] - m[4]) / S;
                break;
        }
        return out;
    }

    /**
     * Updates per object data
     * @param {Tw2PerObjectData} perObjectData
     * @param transforms
     * @private
     */
    EveTurretSet.prototype._UpdatePerObjectData = function(perObjectData, transforms)
    {
        mat4.transpose(this.parentMatrix, perObjectData.Get('shipMatrix'));
        var transformCount = transforms.length / 12;
        perObjectData.Get('turretSetData')[0] = transformCount;
        perObjectData.Get('baseCutoffData')[0] = this.bottomClipHeight;
        var translation = perObjectData.Get('turretTranslation');
        var rotation = perObjectData.Get('turretRotation');
        var pose = perObjectData.Get('turretPoseTransAndRot');
        for (var i = 0; i < this.turrets.length; ++i)
        {
            for (var j = 0; j < transformCount; ++j)
            {
                pose[(i * transformCount + j) * 2 * 4] = transforms[j * 12 + 3];
                pose[(i * transformCount + j) * 2 * 4 + 1] = transforms[j * 12 + 7];
                pose[(i * transformCount + j) * 2 * 4 + 2] = transforms[j * 12 + 11];
                pose[(i * transformCount + j) * 2 * 4 + 3] = 1;
                mat3x4toquat(transforms, j, pose, (i * transformCount + j) * 2 + 1);
            }
            translation[i * 4] = this.turrets[i].localTransform[12];
            translation[i * 4 + 1] = this.turrets[i].localTransform[13];
            translation[i * 4 + 2] = this.turrets[i].localTransform[14];
            translation[i * 4 + 3] = 1;
            rotation[i * 4] = this.turrets[i].rotation[0];
            rotation[i * 4 + 1] = this.turrets[i].rotation[1];
            rotation[i * 4 + 2] = this.turrets[i].rotation[2];
            rotation[i * 4 + 3] = this.turrets[i].rotation[3];
        }
    };

    /**
     * Gets turret set render batches
     * @param {RenderMode} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @returns {boolean}
     */
    EveTurretSet.prototype.GetBatches = function(mode, accumulator, perObjectData)
    {
        if (!this.turretEffect || this.geometryResource == null || !this.display)
        {
            return false;
        }
        if (mode == device.RM_OPAQUE)
        {
            var transforms = this.inactiveAnimation.GetBoneMatrices(0);
            if (transforms.length == 0)
            {
                return true;
            }
            this._UpdatePerObjectData(this._perObjectDataInactive.perObjectVSData, transforms);
            this._perObjectDataInactive.perObjectPSData = perObjectData.perObjectPSData;

            var batch = new Tw2ForwardingRenderBatch();
            batch.renderMode = mode;
            batch.renderActive = false;
            batch.perObjectData = this._perObjectDataInactive;
            batch.geometryProvider = this;
            accumulator.Commit(batch);

            if (this.state == this.STATE_FIRING)
            {
                transforms = this.activeAnimation.GetBoneMatrices(0);
                if (transforms.length == 0)
                {
                    return true;
                }
                this._UpdatePerObjectData(this._perObjectDataActive.perObjectVSData, transforms);
                this._perObjectDataActive.perObjectPSData = perObjectData.perObjectPSData;

                batch = new Tw2ForwardingRenderBatch();
                batch.renderActive = true;
                batch.perObjectData = this._perObjectDataActive;
                batch.geometryProvider = this;
                accumulator.Commit(batch);
            }
        }
        if (this.firingEffect)
        {
            this.firingEffect.GetBatches(mode, accumulator, perObjectData);
        }
        return true;
    };

    /**
     * Per frame update
     * @param {number} dt - Delta Time
     * @param {mat4} parentMatrix
     */
    EveTurretSet.prototype.Update = function(dt, parentMatrix)
    {
        if (this.turretEffect)
        {
            this.activeAnimation.Update(dt);
            this.inactiveAnimation.Update(dt);
        }
        mat4.set(parentMatrix, this.parentMatrix);
        if (this.firingEffect)
        {
            if (this._activeTurret != -1)
            {
                if (this.firingEffect.isLoopFiring)
                {
                    if (this.state == this.STATE_FIRING)
                    {
                        this._recheckTimeLeft -= dt;
                        if (this._recheckTimeLeft <= 0)
                        {
                            this._DoStartFiring();
                        }
                    }
                }
                var i;
                if (this.activeAnimation.models.length)
                {
                    var bones = this.activeAnimation.models[0].bonesByName;
                    for (i = 0; i < this.firingEffect.GetPerMuzzleEffectCount(); ++i)
                    {
                        var transform = bones[EveTurretSet.positionBoneSkeletonNames[i]].worldTransform;
                        var out = this.firingEffect.GetMuzzleTransform(i);
                        mat4.multiply(parentMatrix, mat4.multiply(this.turrets[this._activeTurret].localTransform, transform, out), out);
                    }
                }
                else
                {
                    for (i = 0; i < this.firingEffect.GetPerMuzzleEffectCount(); ++i)
                    {
                        mat4.multiply(parentMatrix, this.turrets[this._activeTurret].localTransform, this.firingEffect.GetMuzzleTransform(i));
                    }
                }
                if (this.fireCallbackPending)
                {
                    if (this.fireCallback)
                    {
                        var cbTransforms = [];
                        for (i = 0; i < this.firingEffect.GetPerMuzzleEffectCount(); ++i)
                        {
                            cbTransforms.push(this.firingEffect.GetMuzzleTransform(i));
                        }
                        this.fireCallback(this, cbTransforms);
                    }
                    this.fireCallbackPending = false;
                }
            }

            vec3.set(this.targetPosition, this.firingEffect.endPosition);
            this.firingEffect.Update(dt);
        }
    };

    /**
     * Renders the turret set
     * @param batch
     * @param {Tw2Effect} overrideEffect
     */
    EveTurretSet.prototype.Render = function(batch, overrideEffect)
    {
        var effect = (!overrideEffect) ? this.turretEffect : overrideEffect;
        var index = 0;
        var customSetter = function(el)
        {
            device.gl.disableVertexAttribArray(el.location);
            device.gl.vertexAttrib2f(el.location, index, index);
        };
        for (var i = 0; i < this.geometryResource.meshes.length; ++i)
        {
            var decl = this.geometryResource.meshes[i].declaration;
            decl.FindUsage(Tw2VertexDeclaration.DECL_TEXCOORD, 1).customSetter = customSetter;
        }
        for (; index < this.turrets.length; ++index)
        {
            if (this.turrets[index].visible)
            {
                var isActive = this.state == this.STATE_FIRING && index == this._activeTurret;
                if (batch.renderActive == isActive)
                {
                    this.geometryResource.RenderAreas(0, 0, 1, effect);
                }
            }
        }
    };

    /**
     * Animation helper function for deactivating a turret set
     */
    EveTurretSet.prototype.EnterStateDeactive = function()
    {
        if (this.state == this.STATE_INACTIVE || this.state == this.STATE_PACKING)
        {
            return;
        }
        var self = this;
        if (this.turretEffect)
        {
            this.activeAnimation.StopAllAnimations();
            this.inactiveAnimation.StopAllAnimations();
            this.activeAnimation.PlayAnimation("Pack", false, function()
            {
                self.state = self.STATE_INACTIVE;
                self.activeAnimation.PlayAnimation("Inactive", true);
            });
            this.inactiveAnimation.PlayAnimation("Pack", false, function()
            {
                self.state = self.STATE_INACTIVE;
                self.inactiveAnimation.PlayAnimation("Inactive", true);
            });
            this.state = this.STATE_PACKING;
        }
        else
        {
            this.state = self.STATE_INACTIVE;
        }
        this._activeTurret = -1;
        if (this.firingEffect)
        {
            this.firingEffect.StopFiring();
        }
    };

    /**
     * Animation helper function for putting a turret set into idle state
     */
    EveTurretSet.prototype.EnterStateIdle = function()
    {
        var self = this;
        if (this.state == this.STATE_IDLE || this.state == this.STATE_UNPACKING)
        {
            return;
        }
        if (this.turretEffect)
        {
            this.activeAnimation.StopAllAnimations();
            this.inactiveAnimation.StopAllAnimations();
            if (this.state == this.STATE_FIRING)
            {
                this.activeAnimation.PlayAnimation("Active", true);
                this.inactiveAnimation.PlayAnimation("Active", true);
            }
            else
            {
                this.activeAnimation.PlayAnimation("Deploy", false, function()
                {
                    self.state = self.STATE_IDLE;
                    self.activeAnimation.PlayAnimation("Active", true);
                });
                this.inactiveAnimation.PlayAnimation("Deploy", false, function()
                {
                    self.state = self.STATE_IDLE;
                    self.inactiveAnimation.PlayAnimation("Active", true);
                });
            }
            this.state = this.STATE_UNPACKING;
        }
        else
        {
            this.state = self.STATE_IDLE;
        }
        this._activeTurret = -1;
        if (this.firingEffect)
        {
            this.firingEffect.StopFiring();
        }
    };

    /**
     * Animation helper function for putting a turret set into a firing state
     */
    EveTurretSet.prototype.EnterStateFiring = function()
    {
        var self = this;

        if (!this.turretEffect || this.state == this.STATE_FIRING)
        {
            this._DoStartFiring();
            if (this.turretEffect)
            {
                this.activeAnimation.PlayAnimation("Fire", false, function()
                {
                    self.activeAnimation.PlayAnimation("Active", true);
                });
            }
            return;
        }
        this.activeAnimation.StopAllAnimations();
        this.inactiveAnimation.StopAllAnimations();
        if (this.state == this.STATE_INACTIVE)
        {
            this.activeAnimation.PlayAnimation("Deploy", false, function()
            {
                self._DoStartFiring();
                self.activeAnimation.PlayAnimation("Fire", false, function()
                {
                    self.activeAnimation.PlayAnimation("Active", true);
                });
            });
            this.inactiveAnimation.PlayAnimation("Deploy", false, function()
            {
                self.inactiveAnimation.PlayAnimation("Active", true);
            });
            this.state = this.STATE_UNPACKING;
        }
        else
        {
            this._DoStartFiring();
            this.activeAnimation.PlayAnimation("Fire", false, function()
            {
                self.activeAnimation.PlayAnimation("Active", true);
            });
            this.inactiveAnimation.PlayAnimation("Active", true);
        }
    };

    /**
     * Updates view dependent data
     * @constructor
     */
    EveTurretSet.prototype.UpdateViewDependentData = function()
    {
        if (this.firingEffect)
        {
            this.firingEffect.UpdateViewDependentData();
        }
    }

    /**
     * Animation helper function for turret firing
     * @private
     */
    EveTurretSet.prototype._DoStartFiring = function()
    {
        if (this.hasCyclingFiringPos)
        {
            this._currentCyclingFiresPos = 1 - this._currentCyclingFiresPos;
        }
        var turret = this.GetClosestTurret();
        if (this.firingEffect)
        {
            this.firingEffect.PrepareFiring(0, this.hasCyclingFiringPos ? this._currentCyclingFiresPos : -1);
        }
        this._activeTurret = turret;
        this.state = this.STATE_FIRING;
        this._recheckTimeLeft = 2;

        if (this.fireCallback)
        {
            this.fireCallbackPending = true;
        }
    };

    EveTurretSet._tempVec3 = [vec3.create(), vec3.create()];
    EveTurretSet._tempQuat4 = [quat4.create(), quat4.create()];

    /**
     * Helper function for finding out what turret should be firing
     * @returns {number}
     */
    EveTurretSet.prototype.GetClosestTurret = function()
    {
        var closestTurret = -1;
        var closestAngle = -2;
        var nrmToTarget = EveTurretSet._tempVec3[0];
        var nrmUp = EveTurretSet._tempQuat4[0];
        var turretPosition = EveTurretSet._tempQuat4[1];
        for (var i = 0; i < this.turrets.length; ++i)
        {
            turretPosition[0] = this.turrets[i].localTransform[12];
            turretPosition[1] = this.turrets[i].localTransform[13];
            turretPosition[2] = this.turrets[i].localTransform[14];
            turretPosition[3] = 1;
            mat4.multiplyVec4(this.parentMatrix, turretPosition);
            vec3.normalize(vec3.subtract(this.targetPosition, turretPosition, nrmToTarget));
            nrmUp[0] = 0;
            nrmUp[1] = 1;
            nrmUp[2] = 0;
            nrmUp[3] = 0;
            mat4.multiplyVec4(this.turrets[i].localTransform, nrmUp);
            mat4.multiplyVec4(this.parentMatrix, nrmUp);
            var angle = vec3.dot(nrmUp, nrmToTarget);
            if (angle > closestAngle)
            {
                closestTurret = i;
                closestAngle = angle;
            }
        }
        return closestTurret;
    }

    /**
     * EveObject
     * @typedef {EveSpaceObject|EveStation|EveShip|EveTransform|EveEffectRoot|EvePlanet} EveObject
     */

    /**
     * EveSpaceObject
     * @parameter {String} name
     * @parameter {Number} lod
     * @parameter {Tw2Mesh} mesh
     * @parameter {Array.<EveLocator>} locators
     * @parameter {Array.<EveSpriteSet>} spriteSets
     * @parameter {Array.<EveTurretSet>} turretSets
     * @parameter {Array.<EveSpaceObjectDecal>} decals
     * @parameter {Array.<EveSpotlightSet>} spotlightSets
     * @parameter {Array.<EvePlaneSet>} planeSets
     * @parameter {Array.<Tw2CurveSet>} curveSets
     * @parameter {Array.<EveCurveLineSet>} lineSets
     * @parameter {Array.<EveMeshOverlayEffect>} overlayEffects
     * @parameter {Array.<{}>} children
     * @parameter {vec3} boundingSphereCenter
     * @parameter {Number} boundingSphereRadius
     * @parameter {vec3} shapeEllipsoidRadius
     * @parameter {vec3} shapeEllipsoidCenter
     * @parameter {mat4} transform
     * @parameter {Tw2AnimationController} animation
     * @parameter {boolean} display - Toggles rendering of the whole space object
     * @parameter {boolean} displayMesh - Toggles mesh rendering
     * @parameter {boolean} displayChildren - toggles rendering of children
     * @parameter {boolean} displaySprites - Toggles sprite set rendering
     * @parameter {boolean} displayDecals - Toggles decal rendering
     * @parameter {boolean} displaySpotlights - Toggles spotlight set rendering
     * @parameter {boolean} displayPlanes - toggles plane set rendering
     * @parameter {boolean} displayLines - toggles line set rendering
     * @parameter {boolean} displayOverlays - toggles overlay effect rendering
     * @parameter {Number} displayKillCounterValue - number of kills to show on kill counter decals
     * @parameter {vec3} _tempVec
     * @parameter {Tw2PerObjectData} _perObjectData
     * @constructor
     */
    function EveSpaceObject()
    {
        this.name = '';
        this.lod = 3;
        this.mesh = null;
        this.locators = [];

        this.spriteSets = [];
        this.turretSets = [];
        this.decals = [];
        this.spotlightSets = [];
        this.planeSets = [];
        this.curveSets = [];
        this.lineSets = [];
        this.overlayEffects = [];
        this.children = [];
        this.effectChildren = [];

        this.boundingSphereCenter = vec3.create();
        this.boundingSphereRadius = 0;
        this.shapeEllipsoidRadius = vec3.create();
        this.shapeEllipsoidCenter = vec3.create();

        this.transform = mat4.identity(mat4.create());
        this.animation = new Tw2AnimationController();

        this.display = true;
        this.displayMesh = true;
        this.displayChildren = true;
        this.displayPlanes = true;
        this.displaySpotlights = true;
        this.displayDecals = true;
        this.displaySprites = true;
        this.displayOverlays = true;
        this.displayLines = true;

        this.displayKillCounterValue = 0;

        this._tempVec = vec3.create();

        this._perObjectData = new Tw2PerObjectData();
        this._perObjectData.perObjectVSData = new Tw2RawData();
        this._perObjectData.perObjectVSData.Declare('WorldMat', 16);
        this._perObjectData.perObjectVSData.Declare('WorldMatLast', 16);
        this._perObjectData.perObjectVSData.Declare('Shipdata', 4);
        this._perObjectData.perObjectVSData.Declare('Clipdata1', 4);
        this._perObjectData.perObjectVSData.Declare('EllipsoidRadii', 4);
        this._perObjectData.perObjectVSData.Declare('EllipsoidCenter', 4);
        this._perObjectData.perObjectVSData.Declare('JointMat', 696);
        this._perObjectData.perObjectVSData.Create();

        this._perObjectData.perObjectPSData = new Tw2RawData();
        this._perObjectData.perObjectPSData.Declare('Shipdata', 4);
        this._perObjectData.perObjectPSData.Declare('Clipdata1', 4);
        this._perObjectData.perObjectPSData.Declare('Clipdata2', 4);
        this._perObjectData.perObjectPSData.Declare('ShLighting', 4 * 7);
        this._perObjectData.perObjectPSData.Declare('customMaskMatrix', 16);
        this._perObjectData.perObjectPSData.Create();

        this._perObjectData.perObjectVSData.Get('Shipdata')[1] = 1;
        this._perObjectData.perObjectPSData.Get('Shipdata')[1] = 1;
        this._perObjectData.perObjectVSData.Get('Shipdata')[3] = -10;
        this._perObjectData.perObjectPSData.Get('Shipdata')[3] = 1;
    }

    /**
     * Initializes the EveSpaceObject
     */
    EveSpaceObject.prototype.Initialize = function()
    {
        if (this.mesh)
        {
            this.animation.SetGeometryResource(this.mesh.geometryResource);
            for (var i = 0; i < this.decals.length; ++i)
            {
                this.decals[i].SetParentGeometry(this.mesh.geometryResource);
            }
        }
    };

    /**
     * Gets object's res objects
     * @param {Array} [out=[]] - Optional receiving array
     * @param {Boolean} excludeChildren - True to exclude children's res objects
     * @returns {Array.<Tw2EffectRes|Tw2TextureRes|Tw2GeometryRes>} [out]
     */
    EveSpaceObject.prototype.GetResources = function(out, excludeChildren)
    {
        if (out === undefined)
        {
            out = [];
        }

        var self = this;

        if (this.mesh !== null)
        {
            this.mesh.GetResources(out);
        }

        if (this.animation !== null)
        {
            this.animation.GetResources(out);
        }

        function getSetResources(setName, out)
        {
            for (var i = 0; i < self[setName].length; i++)
            {
                if ('GetResources' in self[setName][i])
                {
                    self[setName][i].GetResources(out);
                }
            }
        }

        getSetResources('spriteSets', out);
        getSetResources('turretSets', out);
        getSetResources('decals', out);
        getSetResources('spotlightSets', out);
        getSetResources('planeSets', out);
        getSetResources('lineSets', out);
        getSetResources('overlayEffects', out);
        getSetResources('effectChildren', out);

        if (!excludeChildren)
        {
            getSetResources('children', out);
        }

        return out;
    }


    /**
     * Resets the lod
     */
    EveSpaceObject.prototype.ResetLod = function()
    {
        this.lod = 3;
    }

    /**
     * Updates the lod
     * @param {Tw2Frustum} frustum
     */
    EveSpaceObject.prototype.UpdateLod = function(frustum)
    {
        var center = mat4.multiplyVec3(this.transform, this.boundingSphereCenter, this._tempVec);

        if (frustum.IsSphereVisible(center, this.boundingSphereRadius))
        {
            if (frustum.GetPixelSizeAcross(center, this.boundingSphereRadius) < 100)
            {
                this.lod = 1;
            }
            else
            {
                this.lod = 2;
            }
        }
        else
        {
            this.lod = 0;
        }
    }

    /**
     * A Per frame function that updates view dependent data
     */
    EveSpaceObject.prototype.UpdateViewDependentData = function()
    {
        for (var i = 0; i < this.children.length; ++i)
        {
            this.children[i].UpdateViewDependentData(this.transform);
        }

        mat4.transpose(this.transform, this._perObjectData.perObjectVSData.Get('WorldMat'));
        mat4.transpose(this.transform, this._perObjectData.perObjectVSData.Get('WorldMatLast'));
        var center = this._perObjectData.perObjectVSData.Get('EllipsoidCenter');
        var radii = this._perObjectData.perObjectVSData.Get('EllipsoidRadii');
        if (this.shapeEllipsoidRadius[0] > 0)
        {
            center[0] = this.shapeEllipsoidCenter[0];
            center[1] = this.shapeEllipsoidCenter[1];
            center[2] = this.shapeEllipsoidCenter[2];
            radii[0] = this.shapeEllipsoidRadius[0];
            radii[1] = this.shapeEllipsoidRadius[1];
            radii[2] = this.shapeEllipsoidRadius[2];
        }
        else if (this.mesh && this.mesh.geometryResource && this.mesh.geometryResource.IsGood())
        {
            vec3.subtract(this.mesh.geometryResource.maxBounds, this.mesh.geometryResource.minBounds, center);
            vec3.scale(center, 0.5 * 1.732050807);
            vec3.add(this.mesh.geometryResource.maxBounds, this.mesh.geometryResource.minBounds, radii);
            vec3.scale(radii, 0.5);
        }

        if (this.animation.animations.length)
        {
            this._perObjectData.perObjectVSData.Set('JointMat', this.animation.GetBoneMatrices(0));
        }

        for (var s = 0; s < this.lineSets.length; ++s)
        {
            this.lineSets[s].UpdateViewDependentData(this.transform);
        }
    }

    /**
     * Gets render batches
     * @param {RenderMode} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    EveSpaceObject.prototype.GetBatches = function(mode, accumulator)
    {
        if (this.display)
        {
            if (this.displayMesh && this.mesh != null && this.lod > 0)
            {
                this.mesh.GetBatches(mode, accumulator, this._perObjectData);
            }

            if (this.lod > 1)
            {
                var i;

                if (this.displaySprites)
                {
                    for (i = 0; i < this.spriteSets.length; ++i)
                    {
                        this.spriteSets[i].GetBatches(mode, accumulator, this._perObjectData, this.transform);
                    }
                }

                if (this.displaySpotlights)
                {
                    for (i = 0; i < this.spotlightSets.length; ++i)
                    {
                        this.spotlightSets[i].GetBatches(mode, accumulator, this._perObjectData);
                    }
                }

                if (this.displayPlanes)
                {
                    for (i = 0; i < this.planeSets.length; ++i)
                    {
                        this.planeSets[i].GetBatches(mode, accumulator, this._perObjectData);
                    }
                }

                if (this.displayDecals)
                {
                    for (i = 0; i < this.decals.length; ++i)
                    {
                        this.decals[i].GetBatches(mode, accumulator, this._perObjectData, this.displayKillCounterValue);
                    }
                }

                if (this.displayLines)
                {
                    for (var i = 0; i < this.lineSets.length; ++i)
                    {
                        this.lineSets[i].GetBatches(mode, accumulator);
                    }
                }
            }

            if (this.displayChildren)
            {
                for (i = 0; i < this.children.length; ++i)
                {
                    this.children[i].GetBatches(mode, accumulator, this._perObjectData);
                }
                for (i = 0; i < this.effectChildren.length; ++i)
                {
                    this.effectChildren[i].GetBatches(mode, accumulator, this._perObjectData);
                }
            }

            if (this.displayOverlays && this.mesh && this.mesh.geometryResource && this.mesh.geometryResource.IsGood())
            {
                for (i = 0; i < this.overlayEffects.length; ++i)
                {
                    var effects = this.overlayEffects[i].GetEffects(mode);
                    if (effects)
                    {
                        for (var j = 0; j < effects.length; ++j)
                        {
                            var batch = new Tw2GeometryBatch();
                            batch.renderMode = mode;
                            batch.perObjectData = this._perObjectData;
                            batch.geometryRes = this.mesh.geometryResource;
                            batch.meshIx = this.mesh.meshIndex;
                            batch.start = 0;
                            batch.count = this.mesh.geometryResource.meshes[this.mesh.meshIndex].areas.length;
                            batch.effect = effects[j];
                            accumulator.Commit(batch);
                        }
                    }
                }
            }
        }
    };

    /**
     * Per frame update
     * @param {Number} dt - delta time
     */
    EveSpaceObject.prototype.Update = function(dt)
    {
        if (this.lod > 0)
        {
            var i;
            for (i = 0; i < this.spriteSets.length; ++i)
            {
                this.spriteSets[i].Update(dt);
            }
            for (i = 0; i < this.children.length; ++i)
            {
                this.children[i].Update(dt);
            }
            for (i = 0; i < this.effectChildren.length; ++i)
            {
                this.effectChildren[i].Update(this.transform);
            }
            for (i = 0; i < this.curveSets.length; ++i)
            {
                this.curveSets[i].Update(dt);
            }
            for (i = 0; i < this.overlayEffects.length; ++i)
            {
                this.overlayEffects[i].Update(dt);
            }
            this.animation.Update(dt);
        }
    };

    /**
     * Gets locator count for a specific locator group
     * @param {String} prefix
     * @returns {number}
     */
    EveSpaceObject.prototype.GetLocatorCount = function(prefix)
    {
        var count = 0;
        for (var i = 0; i < this.locators.length; ++i)
        {
            if (this.locators[i].name.substr(0, prefix.length) == prefix)
            {
                ++count;
            }
        }
        return count;
    };

    /**
     * Finds a locator joint by it's name
     * @param {String} name
     * @returns {null|mat4}
     */
    EveSpaceObject.prototype.FindLocatorJointByName = function(name)
    {
        var model = this.animation.FindModelForMesh(0);
        if (model != null)
        {
            for (var i = 0; i < model.bones.length; ++i)
            {
                if (model.bones[i].boneRes.name == name)
                {
                    return model.bones[i].worldTransform;
                }
            }
        }
        return null;
    };

    /**
     * Finds a locator transform by it's name
     * @param {String} name
     * @returns {null|mat4}
     */
    EveSpaceObject.prototype.FindLocatorTransformByName = function(name)
    {
        for (var i = 0; i < this.locators.length; ++i)
        {
            if (this.locators[i].name == name)
            {
                return this.locators[i].transform;
            }
        }
        return null;
    };

    /**
     * RenderDebugInfo
     * @param debugHelper
     */
    EveSpaceObject.prototype.RenderDebugInfo = function(debugHelper)
    {
        this.animation.RenderDebugInfo(debugHelper);
    };

    /**
     * EveStation inherits from EveSpaceObject
     * @type {EveSpaceObject}
     */
    var EveStation = EveSpaceObject;

    /**
     * EveShip
     * @property {number} boosterGain
     * @property {Array.<EveBoosterSet>} boosters
     * @property {Array.<EveTurretSet>} turretSets
     * @property {Array} _turretSetsLocatorInfo
     * @property {boolean} displayTurrets - Toggles turret rendering
     * @property {boolean} displayBoosters - Toggles booster rendering
     * @inherits EveSpaceObject
     * @constructor
     */
    function EveShip()
    {
        this._super.constructor.call(this);
        this.boosterGain = 1;
        this.boosters = null;
        this.turretSets = [];
        this._turretSetsLocatorInfo = [];

        this.displayTurrets = true;
        this.displayBoosters = true;
    }

    /**
     * Eve Turret Set Locator Info
     * @property {boolean} isJoint
     * @property {Array.<mat4>} locatorTransforms
     */
    function EveTurretSetLocatorInfo()
    {
        this.isJoint = false;
        this.locatorTransforms = [];
    }

    /**
     * Initializes the Eve Ship
     */
    EveShip.prototype.Initialize = function()
    {
        this._super.Initialize.call(this);
        if (this.boosters)
        {
            this.RebuildBoosterSet();
        }
    };

    /**
     * Gets ship's res objects
     * @param {Array} [out=[]] - Optional receiving array
     * @param {Boolean} excludeChildren - True to exclude children's res objects
     * @returns {Array.<Tw2EffectRes|Tw2TextureRes|Tw2GeometryRes>} [out]
     */
    EveShip.prototype.GetResources = function(out, excludeChildren)
    {
        if (out === undefined)
        {
            out = [];
        };

        this._super.GetResources.call(this, out, excludeChildren);

        var self = this;

        function getSetResources(setName, out)
        {
            for (var i = 0; i < self[setName].length; i++)
            {
                self[setName][i].GetResources(out);
            }
        }

        getSetResources('turretSets', out);

        if (this.boosters !== null)
        {
            this.boosters.GetResources(out);
        }

        return out;
    }

    /**
     * Gets render batches
     * @param {RenderMode} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    EveShip.prototype.GetBatches = function(mode, accumulator)
    {
        if (this.display)
        {
            this._super.GetBatches.call(this, mode, accumulator);

            this._perObjectData.perObjectVSData.Get('Shipdata')[0] = this.boosterGain;
            this._perObjectData.perObjectPSData.Get('Shipdata')[0] = this.boosterGain;

            if (this.displayTurrets)
            {
                if (this.lod > 1)
                {
                    for (var i = 0; i < this.turretSets.length; ++i)
                    {
                        this.turretSets[i].GetBatches(mode, accumulator, this._perObjectData);
                    }
                }
                else
                {
                    for (var i = 0; i < this.turretSets.length; ++i)
                    {
                        if (this.turretSets[i].firingEffect)
                        {
                            this.turretSets[i].firingEffect.GetBatches(mode, accumulator, this._perObjectData);
                        }
                    }
                }
            }

            if (this.boosters && this.displayBoosters)
            {
                this.boosters.GetBatches(mode, accumulator, this._perObjectData);
            }
        }
    };

    /**
     * Per frame update
     * @param {number} dt - deltaTime
     */
    EveShip.prototype.Update = function(dt)
    {
        this._super.Update.call(this, dt);

        if (this.boosters)
        {
            if (this.boosters.rebuildPending)
            {
                this.RebuildBoosterSet();
            }
            this.boosters.Update(dt, this.transform);
        }

        for (var i = 0; i < this.turretSets.length; ++i)
        {
            if (i < this._turretSetsLocatorInfo.length)
            {
                if (this._turretSetsLocatorInfo[i].isJoint)
                {
                    for (var j = 0; j < this._turretSetsLocatorInfo[i].locatorTransforms.length; ++j)
                    {
                        this.turretSets[i].SetLocalTransform(j, this._turretSetsLocatorInfo[i].locatorTransforms[j]);
                    }
                }
            }
        }
        for (var i = 0; i < this.turretSets.length; ++i)
        {
            this.turretSets[i].Update(dt, this.transform);
        }
    };

    /**
     * Updates view dependant data
     */
    EveShip.prototype.UpdateViewDependentData = function()
    {
        EveSpaceObject.prototype.UpdateViewDependentData.call(this);
        for (var i = 0; i < this.turretSets.length; ++i)
        {
            this.turretSets[i].UpdateViewDependentData();
        }
    }

    /**
     * Rebuilds the ship's booster set
     */
    EveShip.prototype.RebuildBoosterSet = function()
    {
        if (!this.boosters)
        {
            return;
        }
        this.boosters.Clear();
        var prefix = 'locator_booster';
        for (var i = 0; i < this.locators.length; ++i)
        {
            if (this.locators[i].name.substr(0, prefix.length) == prefix)
            {
                this.boosters.Add(this.locators[i].transform, this.locators[i].atlasIndex0, this.locators[i].atlasIndex1);
            }
        }
        this.boosters.Rebuild();
    };

    /**
     * Rebuilds turret positions
     */
    EveShip.prototype.RebuildTurretPositions = function()
    {
        this._turretSetsLocatorInfo = [];
        for (var i = 0; i < this.turretSets.length; ++i)
        {
            var name = this.turretSets[i].locatorName;
            var locatorCount = this.GetLocatorCount(name);
            var locator = new EveTurretSetLocatorInfo();
            for (var j = 0; j < locatorCount; ++j)
            {
                var locatorName = name + String.fromCharCode('a'.charCodeAt(0) + j);
                var locatorTransform = this.FindLocatorJointByName(locatorName);
                if (locatorTransform != null)
                {
                    locator.isJoint = true;
                }
                else
                {
                    locatorTransform = this.FindLocatorTransformByName(locatorName);
                }
                if (locatorTransform != null)
                {
                    this.turretSets[i].SetLocalTransform(j, locatorTransform, locatorName);
                    locator.locatorTransforms[locator.locatorTransforms.length] = locatorTransform;
                }
            }
            this._turretSetsLocatorInfo[this._turretSetsLocatorInfo.length] = locator;
        }
    };

    Inherit(EveShip, EveSpaceObject);

    /**
     * EveSpaceObjectDecal
     * @property {boolean} display
     * @property {Tw2Effect} decalEffect
     * @property {Tw2Effect} pickEffect
     * @property {String} name=''
     * @property {number} groupIndex
     * @property {boolean} pickable
     * @property {vec3} position
     * @property {quat4} rotation
     * @property {vec3} scaling
     * @property {mat4} decalMatrix
     * @property {mat4} invDecalMatrix
     * @property {Tw2GeometryRes} parentGeometry
     * @property {Array} indexBuffer
     * @property {*} _indexBuffer
     * @property {number} parentBoneIndex
     * @property {Tw2PerObjectData} _perObjectData
     * @constructor
     */
    function EveSpaceObjectDecal()
    {
        this.display = true;
        this.decalEffect = null;
        this.pickEffect = null;
        this.name = '';
        this.groupIndex = -1;

        this.pickable = true;

        this.position = vec3.create();
        this.rotation = quat4.create();
        this.scaling = vec3.create();

        this.decalMatrix = mat4.create();
        this.invDecalMatrix = mat4.create();
        this.parentGeometry = null;
        this.indexBuffer = [];
        this._indexBuffer = null;
        this.parentBoneIndex = -1;

        this._perObjectData = new Tw2PerObjectData();
        this._perObjectData.perObjectVSData = new Tw2RawData();
        this._perObjectData.perObjectVSData.Declare('worldMatrix', 16);
        this._perObjectData.perObjectVSData.Declare('invWorldMatrix', 16);
        this._perObjectData.perObjectVSData.Declare('decalMatrix', 16);
        this._perObjectData.perObjectVSData.Declare('invDecalMatrix', 16);
        this._perObjectData.perObjectVSData.Declare('parentBoneMatrix', 16);
        this._perObjectData.perObjectVSData.Create();

        this._perObjectData.perObjectPSData = new Tw2RawData();
        this._perObjectData.perObjectPSData.Declare('displayData', 4);
        this._perObjectData.perObjectPSData.Declare('shipData', 4 * 3);
        this._perObjectData.perObjectPSData.Create();

        mat4.identity(this._perObjectData.perObjectVSData.Get('parentBoneMatrix'));

        variableStore.RegisterType('u_DecalMatrix', Tw2MatrixParameter);
        variableStore.RegisterType('u_InvDecalMatrix', Tw2MatrixParameter);
    }

    /**
     * Initializes the decal
     */
    EveSpaceObjectDecal.prototype.Initialize = function()
    {
        var indexes = new Uint16Array(this.indexBuffer);
        this._indexBuffer = device.gl.createBuffer();
        device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        device.gl.bufferData(device.gl.ELEMENT_ARRAY_BUFFER, indexes, device.gl.STATIC_DRAW);

        mat4.scale(mat4.transpose(quat4.toMat4(this.rotation, this.decalMatrix)), this.scaling);
        this.decalMatrix[12] = this.position[0];
        this.decalMatrix[13] = this.position[1];
        this.decalMatrix[14] = this.position[2];
        mat4.inverse(this.decalMatrix, this.invDecalMatrix);
    };

    /**
     * Gets decal res objects
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2EffectRes|Tw2TextureRes|Tw2GeometryRes>} [out]
     */
    EveSpaceObjectDecal.prototype.GetResources = function(out)
    {
        if (out === undefined)
        {
            out = [];
        }

        if (this.parentGeometry !== null)
        {
            if (out.indexOf(this.parentGeometry) === -1)
            {
                out.push(this.parentGeometry);
            }
        }

        if (this.decalEffect !== null)
        {
            this.decalEffect.GetResources(out);
        }

        return out;
    };

    /**
     * Sets the parent geometry
     * @param {Tw2GeometryRes} geometryRes
     */
    EveSpaceObjectDecal.prototype.SetParentGeometry = function(geometryRes)
    {
        this.parentGeometry = geometryRes;
    };

    /**
     * Gets batches for rendering
     * @param {RenderMode} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @param {number} [counter=0]
     */
    EveSpaceObjectDecal.prototype.GetBatches = function(mode, accumulator, perObjectData, counter)
    {
        switch (mode)
        {
            case device.RM_DECAL:
                if (!this.decalEffect) return;
                break;

            case device.RM_PICKABLE:
                if (!this.pickEffect || !this.pickable) return;
                break;

            default:
                return;
        }

        if (this.display && this.indexBuffer.length && this.parentGeometry && this.parentGeometry.IsGood())
        {
            var batch = new Tw2ForwardingRenderBatch();
            this._perObjectData.perObjectVSData.Set('worldMatrix', perObjectData.perObjectVSData.Get('WorldMat'));
            if (this.parentBoneIndex >= 0)
            {
                var bones = perObjectData.perObjectVSData.Get('JointMat');
                var offset = this.parentBoneIndex * 12;
                if (bones[offset + 0] || bones[offset + 4] || bones[offset + 8])
                {
                    var bone = this._perObjectData.perObjectVSData.Get('parentBoneMatrix');
                    bone[0] = bones[offset + 0];
                    bone[1] = bones[offset + 4];
                    bone[2] = bones[offset + 8];
                    bone[3] = 0;
                    bone[4] = bones[offset + 1];
                    bone[5] = bones[offset + 5];
                    bone[6] = bones[offset + 9];
                    bone[7] = 0;
                    bone[8] = bones[offset + 2];
                    bone[9] = bones[offset + 6];
                    bone[10] = bones[offset + 10];
                    bone[11] = 0;
                    bone[12] = bones[offset + 3];
                    bone[13] = bones[offset + 7];
                    bone[14] = bones[offset + 11];
                    bone[15] = 1;
                    mat4.transpose(bone);
                }
            }
            mat4.inverse(this._perObjectData.perObjectVSData.Get('worldMatrix'), this._perObjectData.perObjectVSData.Get('invWorldMatrix'));
            mat4.transpose(this.decalMatrix, this._perObjectData.perObjectVSData.Get('decalMatrix'));
            mat4.transpose(this.invDecalMatrix, this._perObjectData.perObjectVSData.Get('invDecalMatrix'));

            this._perObjectData.perObjectPSData.Get('displayData')[0] = counter || 0;
            this._perObjectData.perObjectPSData.Set('shipData', perObjectData.perObjectPSData.data);

            batch.perObjectData = this._perObjectData;
            batch.geometryProvider = this;
            batch.renderMode = mode;
            accumulator.Commit(batch);
        }
    };

    /**
     * Renders the decal
     * @param {Tw2ForwardingRenderBatch} batch
     * @param {Tw2Effect} overrideEffect
     */
    EveSpaceObjectDecal.prototype.Render = function(batch, overrideEffect)
    {
        var bkIB = this.parentGeometry.meshes[0].indexes;
        var bkStart = this.parentGeometry.meshes[0].areas[0].start;
        var bkCount = this.parentGeometry.meshes[0].areas[0].count;
        var bkIndexType = this.parentGeometry.meshes[0].indexType;
        mat4.set(this.decalMatrix, variableStore._variables['u_DecalMatrix'].value);
        mat4.set(this.invDecalMatrix, variableStore._variables['u_InvDecalMatrix'].value);
        this.parentGeometry.meshes[0].indexes = this._indexBuffer;
        this.parentGeometry.meshes[0].areas[0].start = 0;
        this.parentGeometry.meshes[0].areas[0].count = this.indexBuffer.length;
        this.parentGeometry.meshes[0].indexType = device.gl.UNSIGNED_SHORT;

        this.parentGeometry.RenderAreas(0, 0, 1, overrideEffect ? overrideEffect : (batch.renderMode === device.RM_DECAL) ? this.decalEffect : this.pickEffect);
        this.parentGeometry.meshes[0].indexes = bkIB;
        this.parentGeometry.meshes[0].areas[0].start = bkStart;
        this.parentGeometry.meshes[0].areas[0].count = bkCount;
        this.parentGeometry.meshes[0].indexType = bkIndexType;
    };

    /**
     * EveSpaceScene
     * @property {Array.<EveLensflare>} lensflares - Scene lensflares
     * @property {Array.<EveObject>} objects - Scene objects
     * @property {Array.<EvePlanet>} planets - Scene planets
     * @property {number} nebulaIntensity - controls nebula intensity on scene objects
     * @property {quat4} ambientColor - unused
     * @property {null|Tw2Effect} backgroundEffect
     * @property {boolean} backgroundRenderingEnabled - Toggles background effect visibility
     * @property {vec3} endMapScaling - controls the scale of the environment maps
     * @property {quat4} envMapRotation - controls the rotation of the environment maps
     * @property {boolean} logEnabled - toggles LOD
     * @property {number} fogStart - fog start distance
     * @property {number} fogEnd - fog end distance
     * @property {number} fogMax - fog maximum opacity
     * @property {number} fogType - fog blend type
     * @property {number} fogBlur - fog blur mode
     * @property {quat4} fogColor - fog color
     * @property {vec3} sunDirection - the direction of the scene sun
     * @property {quat4} sunDiffuseColor - the colour of the light from the sun
     * @property {String} envMapResPath - nebula reflection map path
     * @property {String} envMap1ResPath - nebula diffuse map path
     * @property {String} envMap2ResPath - nebular blur map path
     * @property {String} envMap3ResPath - unused
     * @property {null|Tw2TextureRes} envMapRes
     * @property {null|Tw2TextureRes} envMap1Res
     * @property {null|Tw2TextureRes} envMap2Res
     * @property {null} envMap3Res - unused
     * @property {null|Tw2TextureParameter} _envMapHandle
     * @property {null|Tw2TextureParameter} _envMap1Handle
     * @property {null|Tw2TextureParameter} _envMap2Handle
     * @property {null|Tw2TextureParameter} _envMap3Handle
     * @property {Tw2BatchAccumulator} _batches - Scene batch accumulator
     * @property {Tw2RawData} _perFrameVS
     * @property {Tw2RawData} _perFramePS
     * @property {boolean} renderDebugInfo
     * @property {*} _debugHelper
     * @constructor
     */
    function EveSpaceScene()
    {
        this.lensflares = [];
        this.objects = [];
        this.planets = [];

        this.nebulaIntensity = 1;
        this.ambientColor = quat4.create([0.25, 0.25, 0.25, 1]);
        this.backgroundEffect = null;
        this.backgroundRenderingEnabled = true;
        this.envMapScaling = vec3.create([1, 1, 1]);
        this.envMapRotation = quat4.create([0, 0, 0, 1]);

        this.lodEnabled = false;

        this.fogStart = 0;
        this.fogEnd = 0;
        this.fogMax = 0;
        this.fogType = 0;
        this.fogBlur = 0;
        this.fogColor = quat4.create([0.25, 0.25, 0.25, 1]);

        this.sunDirection = vec3.create([1, -1, 1]);
        this.sunDiffuseColor = quat4.create([1, 1, 1, 1]);

        this.envMapResPath = '';
        this.envMap1ResPath = '';
        this.envMap2ResPath = '';
        this.envMap3ResPath = '';
        this.envMapRes = null;
        this.envMap1Res = null;
        this.envMap2Res = null;
        this.envMap3Res = null;

        this._envMapHandle = variableStore.RegisterVariable('EveSpaceSceneEnvMap', '');
        this._envMap1Handle = variableStore.RegisterVariable('EnvMap1', '');
        this._envMap2Handle = variableStore.RegisterVariable('EnvMap2', '');
        this._envMap3Handle = variableStore.RegisterVariable('EnvMap3', '');

        this._batches = new Tw2BatchAccumulator();

        this._perFrameVS = new Tw2RawData();
        this._perFrameVS.Declare('ViewInverseTransposeMat', 16);
        this._perFrameVS.Declare('ViewProjectionMat', 16);
        this._perFrameVS.Declare('ViewMat', 16);
        this._perFrameVS.Declare('ProjectionMat', 16);
        this._perFrameVS.Declare('ShadowViewMat', 16);
        this._perFrameVS.Declare('ShadowViewProjectionMat', 16);
        this._perFrameVS.Declare('EnvMapRotationMat', 16);
        this._perFrameVS.Declare('SunData.DirWorld', 4);
        this._perFrameVS.Declare('SunData.DiffuseColor', 4);
        this._perFrameVS.Declare('FogFactors', 4);
        this._perFrameVS.Declare('TargetResolution', 4);
        this._perFrameVS.Declare('ViewportAdjustment', 4);
        this._perFrameVS.Declare('MiscSettings', 4);
        this._perFrameVS.Create();

        this._perFramePS = new Tw2RawData();
        this._perFramePS.Declare('ViewInverseTransposeMat', 16);
        this._perFramePS.Declare('ViewMat', 16);
        this._perFramePS.Declare('EnvMapRotationMat', 16);
        this._perFramePS.Declare('SunData.DirWorld', 4);
        this._perFramePS.Declare('SunData.DiffuseColor', 4);
        this._perFramePS.Declare('SceneData.AmbientColor', 3);
        this._perFramePS.Declare('SceneData.NebulaIntensity', 1);
        this._perFramePS.Declare('SceneData.FogColor', 4);
        this._perFramePS.Declare('ViewportOffset', 2);
        this._perFramePS.Declare('ViewportSize', 2);

        this._perFramePS.Declare('TargetResolution', 4);
        this._perFramePS.Declare('ShadowMapSettings', 4);
        this._perFramePS.Declare('ShadowCameraRange', 4);

        this._perFramePS.Declare('ProjectionToView', 2);
        this._perFramePS.Declare('FovXY', 2);

        this._perFramePS.Declare('MiscSettings', 4);
        this._perFramePS.Create();

        variableStore.RegisterVariable('ShadowLightness', 0);

        this.renderDebugInfo = false;
        this._debugHelper = null;
    }

    /**
     * Initializes the space scene
     */
    EveSpaceScene.prototype.Initialize = function()
    {
        if (this.envMapResPath != '')
        {
            this.envMapRes = resMan.GetResource(this.envMapResPath);
        }

        if (this.envMap1ResPath != '')
        {
            this.envMap1Res = resMan.GetResource(this.envMap1ResPath);
        }

        if (this.envMap2ResPath != '')
        {
            this.envMap2Res = resMan.GetResource(this.envMap2ResPath);
        }

        if (this.envMap3ResPath != '')
        {
            this.envMap3Res = resMan.GetResource(this.envMap3ResPath);
        }
    };

    /**
     * Sets the environment reflection map
     * @param {String} path
     */
    EveSpaceScene.prototype.SetEnvMapReflection = function(path)
    {
        this.envMapResPath = path;

        if (this.envMapResPath != '')
        {
            this.envMapRes = resMan.GetResource(path)
        }
    };

    /**
     * Sets an environment map
     * @param {number} index
     * @param {String} path
     */
    EveSpaceScene.prototype.SetEnvMapPath = function(index, path)
    {
        switch (index)
        {
            case 0:
                this.envMap1ResPath = path;
                if (this.envMap1ResPath != '')
                {
                    this.envMap1Res = resMan.GetResource(this.envMap1ResPath);
                }
                else
                {
                    this.envMap1Res = null;
                }
                break;

            case 1:
                this.envMap2ResPath = path;
                if (this.envMap2ResPath != '')
                {
                    this.envMap2Res = resMan.GetResource(this.envMap2ResPath);
                }
                else
                {
                    this.envMap2Res = null;
                }
                break;

            case 2:
                this.envMap3ResPath = path;
                if (this.envMap3ResPath != '')
                {
                    this.envMap3Res = resMan.GetResource(this.envMap3ResPath);
                }
                else
                {
                    this.envMap3Res = null;
                }
                break;
        }
    };

    /**
     * Gets batches for rendering
     * @param {RenderMode} mode
     * @param {Array.<EveObject>} objectArray
     * @param {Tw2BatchAccumulator} accumulator
     */
    EveSpaceScene.prototype.RenderBatches = function(mode, objectArray, accumulator)
    {
        accumulator = (accumulator) ? accumulator : this._batches;

        for (var i = 0; i < objectArray.length; ++i)
        {
            if (typeof(objectArray[i].GetBatches) != 'undefined')
            {
                objectArray[i].GetBatches(mode, accumulator);
            }
        }
    };

    /**
     * Enables LOD
     * @param {boolean} enable
     */
    EveSpaceScene.prototype.EnableLod = function(enable)
    {
        this.lodEnabled = enable;

        if (!enable)
        {
            for (var i = 0; i < this.objects.length; ++i)
            {
                if (this.objects[i].ResetLod)
                {
                    this.objects[i].ResetLod();
                }
            }
        }
    };

    /**
     * Applies per frame data, similar to an object's UpdateViewDependentData prototype
     */
    EveSpaceScene.prototype.ApplyPerFrameData = function()
    {
        var view = device.view;
        var projection = device.projection;

        var viewInverseTranspose = mat4.inverse(view, mat4.create());
        this._perFrameVS.Set('ViewInverseTransposeMat', viewInverseTranspose);
        mat4.transpose(mat4.multiply(projection, view, this._perFrameVS.Get('ViewProjectionMat')));
        mat4.transpose(view, this._perFrameVS.Get('ViewMat'));
        mat4.transpose(projection, this._perFrameVS.Get('ProjectionMat'));

        var envMapTransform = mat4.scale(quat4.toMat4(this.envMapRotation), this.envMapScaling, mat4.create());
        mat4.transpose(envMapTransform);
        this._perFrameVS.Set('EnvMapRotationMat', envMapTransform);
        vec3.normalize(vec3.negate(this.sunDirection, this._perFrameVS.Get('SunData.DirWorld')));
        this._perFrameVS.Set('SunData.DiffuseColor', this.sunDiffuseColor);
        var fogFactors = this._perFrameVS.Get('FogFactors');
        var distance = this.fogEnd - this.fogStart;
        if (Math.abs(distance) < 1e-5)
        {
            distance = 1e-5;
        }
        var factor = 1.0 / distance;
        fogFactors[0] = this.fogEnd * factor;
        fogFactors[1] = factor;
        fogFactors[2] = this.fogMax;

        var targetResolution = this._perFrameVS.Get('TargetResolution');
        // resolution of rendertarget
        targetResolution[0] = device.viewportWidth;
        targetResolution[1] = device.viewportHeight;
        // fov in both ways: width (x) and (height (y)
        var aspectRatio = (projection[0] ? projection[5] / projection[0] : 0.0);
        var aspectAdjustment = 1.0;
        if (aspectRatio > 1.6)
        {
            aspectAdjustment = aspectRatio / 1.6;
        }

        var fov = 2.0 * Math.atan(aspectAdjustment / projection[5]);

        this._perFramePS.Get('FovXY')[0] = targetResolution[3] = fov;
        this._perFramePS.Get('FovXY')[1] = targetResolution[2] = targetResolution[3] * aspectRatio;

        var viewportAdj = this._perFrameVS.Get('ViewportAdjustment');
        viewportAdj[0] = 1;
        viewportAdj[1] = 1;
        viewportAdj[2] = 1;
        viewportAdj[3] = 1;

        this._perFramePS.Set('ViewInverseTransposeMat', viewInverseTranspose);
        mat4.transpose(view, this._perFramePS.Get('ViewMat'));
        this._perFramePS.Set('EnvMapRotationMat', envMapTransform);
        vec3.normalize(vec3.negate(this.sunDirection, this._perFramePS.Get('SunData.DirWorld')));
        this._perFramePS.Set('SunData.DiffuseColor', this.sunDiffuseColor);
        this._perFramePS.Set('SceneData.AmbientColor', this.ambientColor);
        this._perFramePS.Get('SceneData.NebulaIntensity')[0] = this.nebulaIntensity;
        this._perFramePS.Set('SceneData.FogColor', this.fogColor);
        this._perFramePS.Get('ViewportSize')[0] = device.viewportWidth;
        this._perFramePS.Get('ViewportSize')[1] = device.viewportHeight;

        this._perFramePS.Get('ShadowCameraRange')[0] = 1;

        var targetResolution = this._perFramePS.Get('TargetResolution');
        targetResolution[0] = device.viewportWidth;
        targetResolution[1] = device.viewportHeight;
        targetResolution[3] = fov;
        targetResolution[2] = targetResolution[3] * aspectRatio;

        var shadowMapSettings = this._perFramePS.Get('ShadowMapSettings');
        shadowMapSettings[0] = 1;
        shadowMapSettings[1] = 1;
        shadowMapSettings[2] = 0;
        shadowMapSettings[3] = 0;

        this._perFramePS.Get('ProjectionToView')[0] = -device.projection[14];
        this._perFramePS.Get('ProjectionToView')[1] = -device.projection[10] - 1;

        var miscSettings = this._perFramePS.Get('MiscSettings');
        miscSettings[0] = variableStore._variables['Time'].value[0];
        miscSettings[1] = this.fogType;
        miscSettings[2] = this.fogBlur;
        miscSettings[3] = 1;

        miscSettings = this._perFrameVS.Get('MiscSettings');
        miscSettings[0] = variableStore._variables['Time'].value[0];
        miscSettings[1] = 0;
        miscSettings[2] = variableStore._variables['ViewportSize'].value[0];
        miscSettings[3] = variableStore._variables['ViewportSize'].value[1];

        this._envMapHandle.textureRes = this.envMapRes;
        this._envMap1Handle.textureRes = this.envMap1Res;
        this._envMap2Handle.textureRes = this.envMap2Res;
        this._envMap3Handle.textureRes = this.envMap3Res;

        device.perFrameVSData = this._perFrameVS;
        device.perFramePSData = this._perFramePS;
    };

    /**
     * Updates children's view dependent data and renders them
     */
    EveSpaceScene.prototype.Render = function()
    {
        this.ApplyPerFrameData();
        var i, id;

        if (this.backgroundRenderingEnabled)
        {
            if (this.backgroundEffect)
            {
                device.SetStandardStates(device.RM_FULLSCREEN);
                device.RenderCameraSpaceQuad(this.backgroundEffect);
            }

            if (this.planets.length)
            {
                var tempProj = mat4.set(device.projection, mat4.create());
                var newProj = mat4.set(device.projection, mat4.create());
                var zn = 10000;
                var zf = 1e11;
                newProj[10] = zf / (zn - zf);
                newProj[14] = (zf * zn) / (zn - zf);
                device.SetProjection(newProj);
                this.ApplyPerFrameData();
                id = mat4.identity(mat4.create());
                for (i = 0; i < this.planets.length; ++i)
                {
                    if (this.planets[i].UpdateViewDependentData)
                    {
                        this.planets[i].UpdateViewDependentData(id);
                    }
                }

                this._batches.Clear();

                device.gl.depthRange(0.9, 1);
                this.RenderBatches(device.RM_OPAQUE, this.planets);
                this.RenderBatches(device.RM_DECAL, this.planets);
                this.RenderBatches(device.RM_TRANSPARENT, this.planets);
                this.RenderBatches(device.RM_ADDITIVE, this.planets);
                this._batches.Render();
                device.SetProjection(tempProj);
                this.ApplyPerFrameData();
                device.gl.depthRange(0, 0.9);
            }
        }

        if (this.lodEnabled)
        {
            var frustum = new Tw2Frustum();
            frustum.Initialize(device.view, device.projection, device.viewportWidth);
            for (i = 0; i < this.objects.length; ++i)
            {
                if (this.objects[i].UpdateLod)
                {
                    this.objects[i].UpdateLod(frustum);
                }
            }
        }

        id = mat4.identity(mat4.create());

        for (i = 0; i < this.objects.length; ++i)
        {
            if (this.objects[i].UpdateViewDependentData)
            {
                this.objects[i].UpdateViewDependentData(id);
            }
        }

        for (i = 0; i < this.lensflares.length; ++i)
        {
            this.lensflares[i].PrepareRender();
        }

        this._batches.Clear();

        for (i = 0; i < this.planets.length; ++i)
        {
            this.planets[i].GetZOnlyBatches(device.RM_OPAQUE, this._batches);
        }

        this.RenderBatches(device.RM_OPAQUE, this.objects);
        this.RenderBatches(device.RM_DECAL, this.objects);
        this.RenderBatches(device.RM_TRANSPARENT, this.objects);
        this.RenderBatches(device.RM_ADDITIVE, this.objects);

        for (i = 0; i < this.lensflares.length; ++i)
        {
            this.lensflares[i].GetBatches(device.RM_ADDITIVE, this._batches);
        }

        this._batches.Render();

        for (i = 0; i < this.lensflares.length; ++i)
        {
            this.lensflares[i].UpdateOccluders();
        }

        if (this.renderDebugInfo)
        {
            if (this._debugHelper == null)
            {
                this._debugHelper = new Tw2DebugRenderer();
            }
            for (i = 0; i < this.objects.length; ++i)
            {
                if (typeof(this.objects[i].RenderDebugInfo) != 'undefined')
                {
                    this.objects[i].RenderDebugInfo(this._debugHelper);
                }
            }
            this._debugHelper.Render();
        }
    };

    /**
     * Per frame update that is called per frame
     * @param {number} dt - delta time
     */
    EveSpaceScene.prototype.Update = function(dt)
    {
        for (var i = 0; i < this.planets.length; ++i)
        {
            if (typeof(this.planets[i].Update) != 'undefined')
            {
                this.planets[i].Update(dt);
            }
        }
        for (var i = 0; i < this.objects.length; ++i)
        {
            if (typeof(this.objects[i].Update) != 'undefined')
            {
                this.objects[i].Update(dt);
            }
        }
    };

    /**
     * EveOccluder
     * @property {String} name=''
     * @property {boolean} display
     * @property {number} value
     * @property {Array.<EveSpriteSet>} sprites
     * @constructor
     */
    function EveOccluder()
    {
        this.name = '';
        this.display = true;
        this.value = 1;
        this.sprites = [];
        variableStore.RegisterType('OccluderValue', Tw2Vector4Parameter);

        if (!EveOccluder._collectEffect)
        {
            EveOccluder._collectEffect = new Tw2Effect();
            EveOccluder._collectEffect.effectFilePath = 'res:/graphics/effect/managed/space/specialfx/lensflares/collectsamples.fx';
            var param = new Tw2TextureParameter();
            param.name = 'BackBuffer';
            EveOccluder._collectEffect.parameters[param.name] = param;
            var param = new Tw2Vector4Parameter();
            param.name = 'OccluderPosition';
            EveOccluder._collectEffect.parameters[param.name] = param;
            var param = new Tw2Vector3Parameter();
            param.name = 'OccluderIndex';
            EveOccluder._collectEffect.parameters[param.name] = param;
            EveOccluder._collectEffect.Initialize();
            EveOccluder._vertexBuffer = null;
            EveOccluder._decl = new Tw2VertexDeclaration();
            EveOccluder._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_POSITION, 0, device.gl.FLOAT, 2, 0));
            EveOccluder._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 0, device.gl.FLOAT, 2, 8));
            EveOccluder._decl.RebuildHash();

            var vb = new Float32Array(255 * 6 * 4);
            var index = 0;
            for (var i = 0; i < 16; ++i)
            {
                for (var j = 0; j < 16; ++j)
                {
                    var x = (i + Math.random()) / 16 * 2 - 1;
                    var y = (j + Math.random()) / 16 * 2 - 1;
                    vb[index++] = 1;
                    vb[index++] = 1;
                    vb[index++] = x;
                    vb[index++] = y;
                    vb[index++] = -1;
                    vb[index++] = 1;
                    vb[index++] = x;
                    vb[index++] = y;
                    vb[index++] = 1;
                    vb[index++] = -1;
                    vb[index++] = x;
                    vb[index++] = y;

                    vb[index++] = -1;
                    vb[index++] = 1;
                    vb[index++] = x;
                    vb[index++] = y;
                    vb[index++] = 1;
                    vb[index++] = -1;
                    vb[index++] = x;
                    vb[index++] = y;
                    vb[index++] = -1;
                    vb[index++] = -1;
                    vb[index++] = x;
                    vb[index++] = y;
                }
            }
            EveOccluder._vertexBuffer = device.gl.createBuffer();
            device.gl.bindBuffer(device.gl.ARRAY_BUFFER, EveOccluder._vertexBuffer);
            device.gl.bufferData(device.gl.ARRAY_BUFFER, vb, device.gl.STATIC_DRAW);
            device.gl.bindBuffer(device.gl.ARRAY_BUFFER, null);
        }
    }

    /**
     * UpdateValues
     * @param {mat4} parentTransform
     * @param {number} index
     */
    EveOccluder.prototype.UpdateValue = function(parentTransform, index)
    {
        if (!this.display)
        {
            return;
        }
        if (!device.alphaBlendBackBuffer)
        {
            return;
        }

        var batches = new Tw2BatchAccumulator();
        for (var i = 0; i < this.sprites.length; ++i)
        {
            this.sprites[i].UpdateViewDependentData(parentTransform);
            this.sprites[i].GetBatches(device.RM_DECAL, batches);
        }

        variableStore._variables['OccluderValue'].value.set([(1 << (index * 2)) / 255., (2 << (index * 2)) / 255., 0, 0]);

        batches.Render();

        var worldViewProj = mat4.multiply(device.projection, device.view, mat4.create());
        worldViewProj = mat4.multiply(worldViewProj, this.sprites[0].worldTransform);

        var center = quat4.create([0, 0, 0, 1]);
        mat4.multiplyVec4(worldViewProj, center);
        var x0 = (center[0] / center[3] + 1) * 0.5;
        var y0 = (center[1] / center[3] + 1) * 0.5;

        center[0] = center[1] = 0.5;
        center[2] = 0;
        center[3] = 1;
        mat4.multiplyVec4(worldViewProj, center);
        var x1 = (center[0] / center[3] + 1) * 0.5;
        var y1 = (center[1] / center[3] + 1) * 0.5;
        center[0] = x0;
        center[1] = y0;
        center[2] = x1 - x0;
        center[3] = y1 - y0;

        EveOccluder._collectEffect.parameters['OccluderPosition'].SetValue(center);
    };

    /**
     * CollectSamples
     * @param tex
     * @param index
     * @param total
     * @param samples
     */
    EveOccluder.prototype.CollectSamples = function(tex, index, total, samples)
    {
        var effect = EveOccluder._collectEffect;
        var effectRes = effect.GetEffectRes();
        if (!effectRes.IsGood())
        {
            return;
        }
        effect.parameters['BackBuffer'].textureRes = tex;
        effect.parameters['OccluderIndex'].SetValue([index, total, samples]);
        device.SetStandardStates(device.RM_ADDITIVE);

        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, EveOccluder._vertexBuffer);
        for (var pass = 0; pass < effect.GetPassCount(); ++pass)
        {
            effect.ApplyPass(pass);
            if (!EveOccluder._decl.SetDeclaration(effect.GetPassInput(pass), 16))
            {
                return;
            }
            device.ApplyShadowState();
            device.gl.drawArrays(device.gl.TRIANGLES, 0, 255 * 6);
        }

    };

    /**
     * Gets Mesh Overlay resource objects
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Res>} [out]
     */
    EveOccluder.prototype.GetResources = function(out)
    {
        if (out === undefined)
        {
            out = [];
        }

        if (EveOccluder._collectEffect)
        {
            EveOccluder._collectEffect.GetResources(out);
        }

        return out;
    };

    /**
     * EveLensFlare
     * @property {String} [name='']
     * @property {boolean} display
     * @property {boolean} update
     * @property {boolean} doOcclusionQueries
     * @property {number} cameraFactor
     * @property {vec3} position
     * @property {Array} flares
     * @property {Array.<EveOccluder>} occluders
     * @property {Array.<EveOccluder>} backgroundOccluders
     * @property {number} occlusionIntensity
     * @property {number} backgroundOcclusionIntensity
     * @property {Array} distanceToEdgeCurves
     * @property {Array} distanceToCenterCurves
     * @property {Array} radialAngleCurves
     * @property {Array} xDistanceToCenter
     * @property {Array} yDistanceToCenter
     * @property {Array} bindings
     * @property {Array.<Tw2CurveSet> curveSets
     * @property {null|Tw2Mesh} mesh
     * @property {quat4} _directionVar
     * @property {quat4} _occlusionVar
     * @property {vec3} _direction
     * @property {mat4} _transform
     * @constructor
     */
    function EveLensflare()
    {
        this.name = '';
        this.display = true;
        this.update = true;
        this.doOcclusionQueries = true;
        this.cameraFactor = 20;
        this.position = vec3.create();
        this.flares = [];
        this.occluders = [];
        this.backgroundOccluders = [];
        this.occlusionIntensity = 1;
        this.backgroundOcclusionIntensity = 1;

        this.distanceToEdgeCurves = [];
        this.distanceToCenterCurves = [];
        this.radialAngleCurves = [];
        this.xDistanceToCenter = [];
        this.yDistanceToCenter = [];
        this.bindings = [];
        this.curveSets = [];

        this.mesh = null;

        this._directionVar = variableStore.RegisterVariable("LensflareFxDirectionScale", quat4.create());
        this._occlusionVar = variableStore.RegisterVariable("LensflareFxOccScale", quat4.create([1, 1, 0, 0]));
        this._direction = vec3.create();
        this._transform = mat4.create();

        if (!EveLensflare.backBuffer)
        {
            EveLensflare.backBuffer = new Tw2TextureRes();
            EveLensflare.backBuffer.width = 0;
            EveLensflare.backBuffer.height = 0;
            EveLensflare.backBuffer.hasMipMaps = false;
            EveLensflare.occluderLevels = [new Tw2RenderTarget(), new Tw2RenderTarget(), new Tw2RenderTarget(), new Tw2RenderTarget()];
            EveLensflare.occludedLevelIndex = 0;
        }
    }

    /**
     * Internal helper function
     * @param out
     * @param v
     */
    EveLensflare.prototype.MatrixArcFromForward = function(out, v)
    {
        var norm = vec3.normalize(v, norm);
        mat4.identity(out);
        if (norm[2] < -0.99999)
        {
            return;
        }
        if (norm[2] > 0.99999)
        {
            out[5] = -1.0;
            out[10] = -1.0;
            return;
        }
        var h = (1 + norm[2]) / (norm[0] * norm[0] + norm[1] * norm[1]);
        out[0] = h * norm[1] * norm[1] - norm[2];
        out[1] = -h * norm[0] * norm[1];
        out[2] = norm[0];

        out[4] = out[1];
        out[5] = h * norm[0] * norm[0] - norm[2];
        out[6] = norm[1];

        out[8] = -norm[0];
        out[9] = -norm[1];
        out[10] = -norm[2];
    };

    /**
     * Prepares the lensflare for rendering
     */
    EveLensflare.prototype.PrepareRender = function()
    {
        if (!this.display)
        {
            return;
        }

        var cameraPos = mat4.multiplyVec3(device.viewInv, vec3.create());
        if (vec3.length(this.position) == 0)
        {
            var curPos = vec3.negate(cameraPos, vec3.create());
            var distScale = vec3.length(curPos);
            if (distScale > 1.5)
            {
                distScale = 1 / Math.log(distScale);
            }
            else
            {
                distScale = 2.5;
            }
            vec3.normalize(curPos, this._direction);
        }
        else
        {
            var invPos = vec3.negate(this.position, vec3.create());
            vec3.normalize(invPos, this._direction);
        }
        var viewDir = mat4.multiplyVec4(device.viewInv, quat4.create([0, 0, 1, 0]));
        var cameraSpacePos = vec3.create();
        cameraSpacePos[0] = -this.cameraFactor * viewDir[0] + cameraPos[0];
        cameraSpacePos[1] = -this.cameraFactor * viewDir[1] + cameraPos[1];
        cameraSpacePos[2] = -this.cameraFactor * viewDir[2] + cameraPos[2];

        var negDirVec = vec3.negate(this._direction, vec3.create());
        this.MatrixArcFromForward(this._transform, negDirVec);
        this._transform[12] = cameraSpacePos[0];
        this._transform[13] = cameraSpacePos[1];
        this._transform[14] = cameraSpacePos[2];

        var scaleMat = mat4.scale(mat4.identity(mat4.create()), [this.occlusionIntensity, this.occlusionIntensity, 1]);
        //mat4.multiply(this._transform, scaleMat);
        this._directionVar.value[0] = this._direction[0];
        this._directionVar.value[1] = this._direction[1];
        this._directionVar.value[2] = this._direction[2];
        this._directionVar.value[3] = 1;

        var d = quat4.create([this._direction[0], this._direction[1], this._direction[2], 0]);
        mat4.multiplyVec4(device.view, d);
        mat4.multiplyVec4(device.projection, d);
        d[0] /= d[3];
        d[1] /= d[3];
        var distanceToEdge = 1 - Math.min(1 - Math.abs(d[0]), 1 - Math.abs(d[1]));
        var distanceToCenter = Math.sqrt(d[0] * d[0] + d[1] * d[1]);
        var radialAngle = Math.atan2(d[1], d[0]) + Math.PI;

        for (var i = 0; i < this.distanceToEdgeCurves.length; ++i)
        {
            this.distanceToEdgeCurves[i].UpdateValue(distanceToEdge);
        }
        for (i = 0; i < this.distanceToCenterCurves.length; ++i)
        {
            this.distanceToCenterCurves[i].UpdateValue(distanceToCenter);
        }
        for (i = 0; i < this.radialAngleCurves.length; ++i)
        {
            this.radialAngleCurves[i].UpdateValue(radialAngle);
        }
        for (i = 0; i < this.xDistanceToCenter.length; ++i)
        {
            this.xDistanceToCenter[i].UpdateValue(d[0] + 10);
        }
        for (i = 0; i < this.yDistanceToCenter.length; ++i)
        {
            this.yDistanceToCenter[i].UpdateValue(d[1] + 10);
        }
        for (i = 0; i < this.bindings.length; ++i)
        {
            this.bindings[i].CopyValue();
        }
        for (i = 0; i < this.flares.length; ++i)
        {
            this.flares[i].UpdateViewDependentData(this._transform);
        }

    };

    /**
     * Updates Occluders
     */
    EveLensflare.prototype.UpdateOccluders = function()
    {
        if (!this.doOcclusionQueries)
        {
            return;
        }
        this.occlusionIntensity = 1;
        this.backgroundOcclusionIntensity = 1;

        if (!EveLensflare.occluderLevels[0].texture || EveLensflare.occluderLevels[0].width < this.occluders.length * 2)
        {
            for (var i = 0; i < EveLensflare.occluderLevels.length; ++i)
            {
                EveLensflare.occluderLevels[i].Create(this.occluders.length * 2, 1, false);
            }
        }
        for (var j = 0; j < this.flares.length; ++j)
        {
            if ('_backBuffer' in this.flares[j])
            {
                this.flares[j]._backBuffer.textureRes = EveLensflare.occluderLevels.texture;
            }
        }

        EveLensflare.occluderLevels[EveLensflare.occludedLevelIndex].Set();
        device.SetStandardStates(device.RM_OPAQUE);
        device.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        device.gl.clear(device.gl.COLOR_BUFFER_BIT);
        EveLensflare.occluderLevels[EveLensflare.occludedLevelIndex].Unset();

        var samples = 1;
        if (device.antialiasing)
        {
            samples = device.msaaSamples;
            device.gl.sampleCoverage(1. / samples, false);
        }
        for (var i = 0; i < this.occluders.length; ++i)
        {
            device.SetRenderState(device.RS_COLORWRITEENABLE, 8);
            device.gl.colorMask(false, false, false, true);
            device.gl.clearColor(0.0, 0.0, 0.0, 0.0);
            device.gl.clear(device.gl.COLOR_BUFFER_BIT);

            if (device.antialiasing)
            {
                // Turn off antialiasing
                device.gl.enable(device.gl.SAMPLE_COVERAGE);
                device.gl.sampleCoverage(0.25, false);
            }
            this.occluders[i].UpdateValue(this._transform, i);
            if (device.antialiasing)
            {
                device.gl.disable(device.gl.SAMPLE_COVERAGE);
            }

            // Copy back buffer into a texture
            if (!EveLensflare.backBuffer.texture)
            {
                EveLensflare.backBuffer.Attach(device.gl.createTexture());
            }
            device.gl.bindTexture(device.gl.TEXTURE_2D, EveLensflare.backBuffer.texture);
            if (EveLensflare.backBuffer.width != device.viewportWidth || EveLensflare.backBuffer.height != device.viewportHeight)
            {
                device.gl.texImage2D(device.gl.TEXTURE_2D, 0, device.gl.RGBA, device.viewportWidth, device.viewportHeight, 0, device.gl.RGBA, device.gl.UNSIGNED_BYTE, null);
                device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MAG_FILTER, device.gl.LINEAR);
                device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MIN_FILTER, device.gl.LINEAR);
                EveLensflare.backBuffer.width = device.viewportWidth;
                EveLensflare.backBuffer.height = device.viewportHeight;
            }
            device.gl.copyTexImage2D(device.gl.TEXTURE_2D, 0, device.alphaBlendBackBuffer ? device.gl.RGBA : device.gl.RGB, 0, 0, EveLensflare.backBuffer.width, EveLensflare.backBuffer.height, 0);
            device.gl.bindTexture(device.gl.TEXTURE_2D, null);

            // Collect samples
            EveLensflare.occluderLevels[EveLensflare.occludedLevelIndex].Set();
            this.occluders[i].CollectSamples(EveLensflare.backBuffer, i, EveLensflare.occluderLevels[0].width / 2, samples);
            EveLensflare.occluderLevels[EveLensflare.occludedLevelIndex].Unset();
        }
        if (device.antialiasing)
        {
            device.gl.sampleCoverage(1, false);
        }

        EveLensflare.occluderLevels[(EveLensflare.occludedLevelIndex + 1) % EveLensflare.occluderLevels.length].Set();
        var pixels = new Uint8Array(EveLensflare.occluderLevels[0].width * 4);
        device.gl.readPixels(0, 0, 2, 1, device.gl.RGBA, device.gl.UNSIGNED_BYTE, pixels);
        EveLensflare.occluderLevels[(EveLensflare.occludedLevelIndex + 1) % EveLensflare.occluderLevels.length].Unset();

        this.occlusionIntensity = 1;
        for (i = 0; i < EveLensflare.occluderLevels[0].width * 2; i += 4)
        {
            this.occlusionIntensity *= pixels[i + 1] ? pixels[i] / pixels[i + 1] : 1;
        }

        this.backgroundOcclusionIntensity = this.occlusionIntensity;
        this._occlusionVar.value[0] = this.occlusionIntensity;
        this._occlusionVar.value[1] = this._occlusionVar.value[0];
        EveLensflare.occludedLevelIndex = (EveLensflare.occludedLevelIndex + 1) % EveLensflare.occluderLevels.length;
    };

    /**
     * Gets render batches
     * @param {RenderMode} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     */
    EveLensflare.prototype.GetBatches = function(mode, accumulator, perObjectData)
    {
        if (!this.display)
        {
            return;
        }
        var viewDir = mat4.multiplyVec4(device.viewInv, quat4.create([0, 0, 1, 0]));
        if (vec3.dot(viewDir, this._direction) < 0)
        {
            return;
        }

        for (var i = 0; i < this.flares.length; ++i)
        {
            this.flares[i].GetBatches(mode, accumulator, perObjectData);
        }
        if (this.mesh)
        {
            this.mesh.GetBatches(mode, accumulator, perObjectData);
        }
    };

    /**
     * EvePlanet
     * @property {boolean} display
     * @property {EveTransform} highDetail
     * @property {Tw2Effect} effectHeight
     * @property {number} itemID
     * @property {string} heightMapResPath1
     * @property {string} heightMapResPath2
     * @property {Tw2RenderTarget} heightMap
     * @property {boolean} heightDirty
     * @property {Array} lockedResources
     * @property {boolean} zOnlyModel
     * @property {Array.<Tw2Res>} watchedResources
     * @constructor
     */
    function EvePlanet()
    {
        this.display = true;
        this.highDetail = new EveTransform();
        this.effectHeight = new Tw2Effect();
        this.itemID = 0;
        this.heightMapResPath1 = '';
        this.heightMapResPath2 = '';
        this.heightMap = new Tw2RenderTarget();
        this.heightDirty = false;
        this.lockedResources = [];
        this.zOnlyModel = null;
        this.watchedResources = [];
    }

    /**
     * Gets planet res objects
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2EffectRes|Tw2TextureRes|Tw2GeometryRes>} [out]
     */
    EvePlanet.prototype.GetResources = function(out)
    {
        if (out === undefined)
        {
            out = [];
        }

        this.highDetail.GetResources(out);
        this.effectHeight.GetResources(out);

        return out;
    }

    /**
     * Creates the planet
     * @param {number} itemID - the item id is used for randomization
     * @param {string} planetPath - .red file for a planet, or planet template
     * @param {string} [atmospherePath] - optional .red file for a planet's atmosphere
     * @param {string} heightMap1
     * @param {string} heightMap2
     */
    EvePlanet.prototype.Create = function(itemID, planetPath, atmospherePath, heightMap1, heightMap2)
    {
        this.itemID = itemID;
        this.heightMapResPath1 = heightMap1;
        this.heightMapResPath2 = heightMap2;
        this.highDetail.children = [];
        var self = this;

        resMan.GetObject(planetPath, function(obj)
        {
            self.highDetail.children.unshift(obj);
            self._MeshLoaded();
        });

        if (atmospherePath)
        {
            resMan.GetObject(atmospherePath, function(obj)
            {
                self.highDetail.children.push(obj);
            });
        }
        this.heightDirty = true;
        resMan.GetObject('res:/dx9/model/worldobject/planet/planetzonly.red', function(obj)
        {
            self.zOnlyModel = obj;
        })
    };

    /**
     * GetPlanetResources
     * @param obj
     * @param visited
     * @param result
     * @constructor
     */
    EvePlanet.prototype.GetPlanetResources = function(obj, visited, result)
    {
        if (visited.indexOf(obj) != -1)
        {
            return;
        }
        visited.push(obj);
        if (obj && typeof(obj['doNotPurge']) != typeof(undefined))
        {
            result.push(obj);
            return;
        }
        for (var prop in obj)
        {
            if (obj.hasOwnProperty(prop))
            {
                if (typeof(obj[prop]) == "object")
                {
                    this.GetPlanetResources(obj[prop], visited, result);
                }
            }
        }
    };

    /**
     * Internal helper function that fires when the planet's mesh has loaded
     * @private
     */
    EvePlanet.prototype._MeshLoaded = function()
    {
        this.lockedResources = [];
        this.GetPlanetResources(this.highDetail, [], this.lockedResources);

        var mainMesh = this.highDetail.children[0].mesh;
        var originalEffect = null;
        var resPath;
        if (mainMesh.transparentAreas.length)
        {
            originalEffect = mainMesh.transparentAreas[0].effect;
            resPath = originalEffect.effectFilePath;
        }
        else if (mainMesh.opaqueAreas.length)
        {
            originalEffect = mainMesh.opaqueAreas[0].effect;
            resPath = originalEffect.effectFilePath;
        }
        else
        {
            resPath = "res:/Graphics/Effect/Managed/Space/Planet/EarthlikePlanet.fx";
        }
        resPath = resPath.replace('.fx', 'BlitHeight.fx');
        this.watchedResources = [];

        for (var param in originalEffect.parameters)
        {
            this.effectHeight.parameters[param] = originalEffect.parameters[param];
            if ('textureRes' in originalEffect.parameters[param])
            {
                this.watchedResources.push(originalEffect.parameters[param].textureRes);
            }
        }
        for (var i = 0; i < this.highDetail.children[0].children.length; ++i)
        {
            mainMesh = this.highDetail.children[0].children[i].mesh;
            if (!mainMesh)
            {
                continue;
            }
            originalEffect = null;
            if (mainMesh.transparentAreas.length)
            {
                originalEffect = mainMesh.transparentAreas[0].effect;
            }
            else if (mainMesh.opaqueAreas.length)
            {
                originalEffect = mainMesh.opaqueAreas[0].effect;
            }
            else
            {
                continue;
            }
            for (param in originalEffect.parameters)
            {
                if (originalEffect.parameters.hasOwnProperty(param))
                {
                    this.effectHeight.parameters[param] = originalEffect.parameters[param];
                    if ('textureRes' in originalEffect.parameters[param])
                    {
                        this.watchedResources.push(originalEffect.parameters[param].textureRes);
                    }
                }
            }
        }

        param = new Tw2TextureParameter();
        param.name = 'NormalHeight1';
        param.resourcePath = this.heightMapResPath1;
        param.Initialize();
        this.watchedResources.push(param.textureRes);
        this.lockedResources.push(param.textureRes);
        this.effectHeight.parameters[param.name] = param;
        param = new Tw2TextureParameter();
        param.name = 'NormalHeight2';
        param.resourcePath = this.heightMapResPath2;
        param.Initialize();
        this.lockedResources.push(param.textureRes);
        this.watchedResources.push(param.textureRes);
        this.effectHeight.parameters[param.name] = param;
        param = new Tw2FloatParameter();
        param.name = 'Random';
        param.value = this.itemID % 100;
        this.effectHeight.parameters[param.name] = param;
        param = new Tw2FloatParameter();
        param.name = 'TargetTextureHeight';
        param.value = 1024;
        this.effectHeight.parameters[param.name] = param;

        this.effectHeight.effectFilePath = resPath;
        this.effectHeight.Initialize();
        this.heightDirty = true;
        this.heightMap.Create(2048, 1024, false);
        this.watchedResources.push(this.effectHeight.effectRes);

        for (i = 0; i < this.lockedResources.length; ++i)
        {
            this.lockedResources[i].doNotPurge++;
            if (this.lockedResources[i].IsPurged())
            {
                this.lockedResources[i].Reload();
            }
        }
    };

    /**
     * Gets render batches
     * @param {RenderMode} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    EvePlanet.prototype.GetBatches = function(mode, accumulator)
    {
        if (this.display && this.heightDirty && this.watchedResources.length && this.heightMapResPath1 != '')
        {
            for (var i = 0; i < this.watchedResources.length; ++i)
            {
                if (this.watchedResources[i] && !this.watchedResources[i].IsGood())
                {
                    return;
                }
            }
            this.watchedResources = [];
            this.heightMap.Set();
            device.SetStandardStates(device.RM_FULLSCREEN);
            device.gl.clearColor(0.0, 0.0, 0.0, 0.0);
            device.gl.clear(device.gl.COLOR_BUFFER_BIT);
            device.RenderFullScreenQuad(this.effectHeight);
            this.heightMap.Unset();
            this.heightDirty = false;
            for (i = 0; i < this.lockedResources.length; ++i)
            {
                this.lockedResources[i].doNotPurge--;
            }
            var mainMesh = this.highDetail.children[0].mesh;
            var originalEffect = null;
            if (mainMesh.transparentAreas.length)
            {
                originalEffect = mainMesh.transparentAreas[0].effect;
            }
            else if (mainMesh.opaqueAreas.length)
            {
                originalEffect = mainMesh.opaqueAreas[0].effect;
            }
            if (originalEffect)
            {
                originalEffect.parameters['HeightMap'].textureRes = this.heightMap.texture;
            }
        }

        if (this.display)
        {
            this.highDetail.GetBatches(mode, accumulator);
        }
    };

    /**
     * Gets z buffer only batches
     * @param {RenderMode} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    EvePlanet.prototype.GetZOnlyBatches = function(mode, accumulator)
    {
        if (this.display && this.zOnlyModel)
        {
            this.zOnlyModel.GetBatches(mode, accumulator);
        }
    };

    /**
     * Per frame update
     * @param {number} dt - delta time
     */
    EvePlanet.prototype.Update = function(dt)
    {
        this.highDetail.Update(dt);
    };

    /**
     * Updates view dependent data
     * @param {mat4} parentTransform
     */
    EvePlanet.prototype.UpdateViewDependentData = function(parentTransform)
    {
        this.highDetail.UpdateViewDependentData(parentTransform);
        if (this.zOnlyModel)
        {
            this.zOnlyModel.translation = this.highDetail.translation;
            this.zOnlyModel.scaling = this.highDetail.scaling;
            this.zOnlyModel.UpdateViewDependentData(parentTransform);
        }
    };

    /**
     * EveEffectRoot
     * @property {string} name
     * @property {boolean} display
     * @property {EveTransform|EveStretch|EveTransform} highDetail
     * @property {boolean} isPlaying
     * @property {vec3} scaling
     * @property {quat4} rotation
     * @property {vec3} translation
     * @property {mat4} localTransform
     * @property {mat4} rotationTransform
     * @property {vec3} boundingSphereCenter
     * @property {number} boundingSphereRadius
     * @property {number} duration
     * @property {Tw2PerObjectData} _perObjectData
     * @constructor
     */
    function EveEffectRoot()
    {
        this.name = '';
        this.display = true;
        this.highDetail = null;
        this.isPlaying = false;
        this.duration = 0;
        this.boundingSphereCenter = vec3.create();
        this.boundingSphereRadius = 0;

        this.scaling = vec3.create([1, 1, 1]);
        this.rotation = quat4.create([0, 0, 0, 1]);
        this.translation = vec3.create();
        this.localTransform = mat4.identity(mat4.create());
        this.rotationTransform = mat4.create();

        this._perObjectData = new Tw2PerObjectData();
        this._perObjectData.perObjectVSData = new Tw2RawData();
        this._perObjectData.perObjectVSData.Declare('WorldMat', 16);
        this._perObjectData.perObjectVSData.Declare('Shipdata', 4);
        this._perObjectData.perObjectVSData.Declare('JointMat', 696);
        this._perObjectData.perObjectVSData.Create();

        this._perObjectData.perObjectPSData = new Tw2RawData();
        this._perObjectData.perObjectPSData.Declare('Shipdata', 4);
        this._perObjectData.perObjectPSData.Create();
    }

    /**
     * Gets effect root res objects
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2EffectRes|Tw2TextureRes>} [out]
     */
    EveEffectRoot.prototype.GetResources = function(out)
    {
        if (out === undefined)
        {
            out = [];
        };

        if (this.highDetail !== null)
        {
            this.highDetail.GetResources(out);
        }

        return out;
    }

    /**
     * Internal per frame update
     * @param {number} dt - Delta Time
     */
    EveEffectRoot.prototype.Update = function(dt)
    {
        if (this.highDetail)
        {
            this.highDetail.Update(dt);
        }

        mat4.identity(this.localTransform);
        mat4.translate(this.localTransform, this.translation);
        mat4.transpose(quat4.toMat4(quat4.normalize(this.rotation), this.rotationTransform));
        mat4.multiply(this.localTransform, this.rotationTransform, this.localTransform);
        mat4.scale(this.localTransform, this.scaling);
    }

    /**
     * Gets render batches
     * @param {RenderMode} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    EveEffectRoot.prototype.GetBatches = function(mode, accumulator)
    {
        if (!this.display || !this.isPlaying || !this.highDetail)
        {
            return;
        }

        this.highDetail.UpdateViewDependentData(this.localTransform);
        mat4.transpose(this.localTransform, this._perObjectData.perObjectVSData.Get('WorldMat'));
        this.highDetail.GetBatches(mode, accumulator, this._perObjectData);
    }

    /**
     * Starts playing the effectRoot's curveSets if they exist
     */
    EveEffectRoot.prototype.Start = function()
    {
        if (this.highDetail)
        {
            this.isPlaying = true;
            for (var i = 0; i < this.highDetail.curveSets.length; ++i)
            {
                this.highDetail.curveSets[i].Play();
            }
        }
    }

    /**
     * Stops the effectRoot's curveSets from playing
     */
    EveEffectRoot.prototype.Stop = function()
    {
        this.isPlaying = false;
    }

    /**
     * EveStretch
     * @property {String} name
     * @property {boolean} display
     * @property {boolean} update
     * @property source
     * @property dest
     * @property sourceObject
     * @property destObject
     * @property {Array.<CurveSets>} curveSets
     * @property {Tw2Float} length
     * @property {number} _time
     * @property {boolean} _useTransformsForStretch
     * @property {vec3} _sourcePosition
     * @property {vec3} _destinationPosition
     * @property {boolean} _displaySourceObject
     * @property {mat4} _sourceTransform
     * @property {boolean} _displayDestObject
     * @property {boolean} _useTransformsForStretch
     * @property {boolean} _isNegZForward
     * @constructor
     */
    function EveStretch()
    {
        this.name = '';
        this.display = true;
        this.update = true;
        this.source = null;
        this.dest = null;
        this.sourceObject = null;
        this.destObject = null;
        this.stretchObject = null;
        this.curveSets = [];
        this.length = new Tw2Float();
        this._time = 0;
        this._useTransformsForStretch = false;
        this._sourcePosition = vec3.create();
        this._destinationPosition = vec3.create();
        this._displaySourceObject = true;
        this._sourceTransform = null;
        this._displayDestObject = true;
        this._useTransformsForStretch = false;
        this._isNegZForward = false;
    }

    /**
     * Temporary vec3 storage
     * @type {Array.<vec3>}
     * @private
     */
    EveStretch._tempVec3 = [vec3.create(), vec3.create(), vec3.create()];

    /**
     * Temporary Mat4 storage
     * @type {Array.<mat4>}
     * @private
     */
    EveStretch._tempMat4 = [mat4.create(), mat4.create()];

    /**
     * Per frame update
     * @param {number} dt - delta time
     */
    EveStretch.prototype.Update = function(dt)
    {
        for (var i = 0; i < this.curveSets.length; ++i)
        {
            this.curveSets[i].Update(dt);
        }
        this._time += dt;
        if (this.source)
        {
            this.source.GetValueAt(this._time, this._sourcePosition);
        }
        else if (this._useTransformsForStretch)
        {
            this._sourcePosition[0] = this._sourceTransform[12];
            this._sourcePosition[1] = this._sourceTransform[13];
            this._sourcePosition[2] = this._sourceTransform[14];
        }
        if (this.dest)
        {
            this.source.GetValueAt(this._time, this._destinationPosition);
        }
        var directionVec = vec3.subtract(this._destinationPosition, this._sourcePosition, EveStretch._tempVec3[0]);
        var scalingLength = vec3.length(directionVec);
        this.length.value = scalingLength;
        vec3.normalize(directionVec);
        if (this.sourceObject && this._displaySourceObject)
        {
            this.sourceObject.Update(dt);
        }
        if (this.stretchObject)
        {
            this.stretchObject.Update(dt);
        }
        if (this.destObject && this._displayDestObject)
        {
            this.destObject.Update(dt);
        }
    };

    /**
     * Updates view dependent data
     */
    EveStretch.prototype.UpdateViewDependentData = function()
    {
        if (!this.display)
        {
            return;
        }
        var directionVec = vec3.subtract(this._destinationPosition, this._sourcePosition, EveStretch._tempVec3[0]);
        var scalingLength = vec3.length(directionVec);
        vec3.normalize(directionVec);

        var m = EveStretch._tempMat4[0];
        if (this._useTransformsForStretch)
        {
            mat4.identity(m);
            mat4.rotateX(m, -Math.PI / 2);
            mat4.multiply(this._sourceTransform, m, m);
        }
        else
        {
            mat4.identity(m);
            var up = EveStretch._tempVec3[2];
            if (Math.abs(directionVec[1]) > 0.9)
            {
                up[2] = 1;
            }
            else
            {
                up[1] = 1;
            }
            var x = vec3.normalize(vec3.cross(up, directionVec, EveStretch._tempVec3[1]));
            vec3.cross(directionVec, x, up);
            m[0] = x[0];
            m[1] = x[1];
            m[2] = x[2];
            m[4] = -directionVec[0];
            m[5] = -directionVec[1];
            m[6] = -directionVec[2];
            m[8] = up[0];
            m[9] = up[1];
            m[10] = up[2];
        }
        if (this.destObject && this._displayDestObject)
        {
            m[12] = this._destinationPosition[0];
            m[13] = this._destinationPosition[1];
            m[14] = this._destinationPosition[2];
            this.destObject.UpdateViewDependentData(m);
        }
        if (this.sourceObject && this._displaySourceObject)
        {
            if (this._useTransformsForStretch)
            {
                mat4.identity(m);
                mat4.rotateX(m, -Math.PI / 2);
                mat4.multiply(this._sourceTransform, m, m);
            }
            else
            {
                m[12] = this._sourcePosition[0];
                m[13] = this._sourcePosition[1];
                m[14] = this._sourcePosition[2];
            }
            this.sourceObject.UpdateViewDependentData(m);
        }
        if (this.stretchObject)
        {
            if (this._useTransformsForStretch)
            {
                mat4.identity(m);
                mat4.scale(m, [1, 1, scalingLength]);
                mat4.multiply(this._sourceTransform, m, m);
            }
            else
            {
                m[0] = x[0];
                m[1] = x[1];
                m[2] = x[2];
                m[4] = up[0];
                m[5] = up[1];
                m[6] = up[2];
                m[8] = -directionVec[0];
                m[9] = -directionVec[1];
                m[10] = -directionVec[2];
                if (this._isNegZForward)
                {
                    scalingLength = -scalingLength;
                }
                var s = mat4.scale(mat4.identity(EveStretch._tempMat4[1]), [1, 1, scalingLength]);
                mat4.multiply(m, s, m);
            }
            this.stretchObject.UpdateViewDependentData(m);
        }
    };

    /**
     * Gets render batches
     * @param {RenderMode} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     */
    EveStretch.prototype.GetBatches = function(mode, accumulator, perObjectData)
    {
        if (!this.display)
        {
            return;
        }
        if (this.sourceObject && this._displaySourceObject)
        {
            this.sourceObject.GetBatches(mode, accumulator, perObjectData);
        }
        if (this.destObject && this._displayDestObject)
        {
            this.destObject.GetBatches(mode, accumulator, perObjectData);
        }
        if (this.stretchObject)
        {
            this.stretchObject.GetBatches(mode, accumulator, perObjectData);
        }
    };

    /**
     * Gets source position
     * @param {vec3} position
     */
    EveStretch.prototype.SetSourcePosition = function(position)
    {
        this._useTransformsForStretch = false;
        this._sourcePosition = position;
    };

    /**
     * Sets the destination position
     * @param {vec3} position
     */
    EveStretch.prototype.SetDestinationPosition = function(position)
    {
        this._destinationPosition = position;
    };

    /**
     * Sets the source transform
     * @param {mat4} transform
     */
    EveStretch.prototype.SetSourceTransform = function(transform)
    {
        this._useTransformsForStretch = true;
        this._sourceTransform = transform;
    };

    /**
     * SetIsNegZForward
     * @param {boolean} isNegZForward
     */
    EveStretch.prototype.SetIsNegZForward = function(isNegZForward)
    {
        this._isNegZForward = isNegZForward;
    };

    function EvePerMuzzleData()
    {
        this.started = false;
        this.readyToStart = false;
        this.muzzlePositionBone = null;
        this.muzzleTransform = mat4.create();
        this.muzzlePosition = this.muzzleTransform.subarray(12, 15);
        this.currentStartDelay = 0;
        this.constantDelay = 0;
        this.elapsedTime = 0;
    }

    function EveTurretFiringFX()
    {
        this.name = '';
        this.display = true;
        this.useMuzzleTransform = false;
        this.isFiring = false;
        this.isLoopFiring = false;
        this.firingDelay1 = 0;
        this.firingDelay2 = 0;
        this.firingDelay3 = 0;
        this.firingDelay4 = 0;
        this.firingDelay5 = 0;
        this.firingDelay6 = 0;
        this.firingDelay7 = 0;
        this.firingDelay8 = 0;
        this.stretch = [];
        this.endPosition = vec3.create();

        this._firingDuration = 0;
        this._perMuzzleData = [];
    }

    EveTurretFiringFX.prototype.Initialize = function()
    {
        this._firingDuration = this.GetCurveDuration();
        for (var i = 0; i < this.stretch.length; ++i)
        {
            this._perMuzzleData[i] = new EvePerMuzzleData();
        }
        if (this._perMuzzleData.length > 0)
        {
            this._perMuzzleData[0].constantDelay = this.firingDelay1;
        }
        if (this._perMuzzleData.length > 1)
        {
            this._perMuzzleData[1].constantDelay = this.firingDelay2;
        }
        if (this._perMuzzleData.length > 2)
        {
            this._perMuzzleData[2].constantDelay = this.firingDelay3;
        }
        if (this._perMuzzleData.length > 3)
        {
            this._perMuzzleData[3].constantDelay = this.firingDelay4;
        }
        if (this._perMuzzleData.length > 4)
        {
            this._perMuzzleData[4].constantDelay = this.firingDelay5;
        }
        if (this._perMuzzleData.length > 5)
        {
            this._perMuzzleData[5].constantDelay = this.firingDelay6;
        }
        if (this._perMuzzleData.length > 6)
        {
            this._perMuzzleData[6].constantDelay = this.firingDelay7;
        }
        if (this._perMuzzleData.length > 7)
        {
            this._perMuzzleData[7].constantDelay = this.firingDelay8;
        }
    }

    EveTurretFiringFX.prototype.GetCurveDuration = function()
    {
        var maxDuration = 0;
        for (var i = 0; i < this.stretch.length; ++i)
        {
            var stretch = this.stretch[i];
            for (var j = 0; j < stretch.curveSets.length; ++j)
            {
                maxDuration = Math.max(maxDuration, stretch.curveSets[j].GetMaxCurveDuration());
            }
        }
        return maxDuration;
    }

    EveTurretFiringFX.prototype.GetPerMuzzleEffectCount = function()
    {
        return this.stretch.length;
    }

    EveTurretFiringFX.prototype.SetMuzzleBoneID = function(index, bone)
    {
        this._perMuzzleData[index].muzzlePositionBone = bone;
    }

    EveTurretFiringFX.prototype.GetBatches = function(mode, accumulator, perObjectData)
    {
        if (!this.display || !this.isFiring)
        {
            return;
        }
        for (var i = 0; i < this.stretch.length; ++i)
        {
            if (this._perMuzzleData[i].started && (this._firingDuration >= this._perMuzzleData[i].elapsedTime || this.isLoopFiring))
            {
                this.stretch[i].GetBatches(mode, accumulator, perObjectData);
            }
        }
    }

    EveTurretFiringFX.prototype.GetMuzzleTransform = function(index)
    {
        return this._perMuzzleData[index].muzzleTransform;
    }

    EveTurretFiringFX.prototype.Update = function(dt)
    {
        var retVal = false;
        for (var i = 0; i < this.stretch.length; ++i)
        {
            if (this._perMuzzleData[i].started)
            {
                this._perMuzzleData[i].elapsedTime += dt;
            }
            if (this._perMuzzleData[i].elapsedTime < this._firingDuration || this.isLoopFiring)
            {
                if (this.isFiring)
                {
                    if (!this._perMuzzleData[i].started)
                    {
                        if (this._perMuzzleData[i].readyToStart)
                        {
                            this.StartMuzzleEffect(i);
                            this._perMuzzleData[i].currentStartDelay = 0;
                            this._perMuzzleData[i].elapsedTime = 0;
                            retVal = true;
                        }
                        else
                        {
                            this._perMuzzleData[i].currentStartDelay -= dt;
                        }
                        if (this._perMuzzleData[i].currentStartDelay <= 0)
                        {
                            this._perMuzzleData[i].readyToStart = true;
                        }
                    }
                    else
                    {
                        if (this.useMuzzleTransform)
                        {
                            this.stretch[i].SetSourceTransform(this._perMuzzleData[i].muzzleTransform);
                        }
                        else
                        {
                            this.stretch[i].SetSourcePosition(this._perMuzzleData[i].muzzlePosition);
                        }
                        this.stretch[i].SetDestinationPosition(this.endPosition);
                        this.stretch[i].SetIsNegZForward(true);
                    }
                }
            }
            this.stretch[i].Update(dt);
        }
    }

    EveTurretFiringFX.prototype.PrepareFiring = function(delay, muzzleID)
    {
        if (typeof(muzzleID) == 'undefined')
        {
            muzzleID = -1;
        }
        for (var i = 0; i < this.stretch.length; ++i)
        {
            if (muzzleID < 0 || muzzleID == i)
            {
                this._perMuzzleData[i].currentStartDelay = delay + this._perMuzzleData[i].constantDelay;
                this._perMuzzleData[i].started = false;
                this._perMuzzleData[i].readyToStart = false;
                this._perMuzzleData[i].elapsedTime = 0;
            }
            else
            {
                this._perMuzzleData[i].currentStartDelay = Number.MAX_VALUE;
                this._perMuzzleData[i].started = false;
                this._perMuzzleData[i].readyToStart = false;
                this._perMuzzleData[i].elapsedTime = 0;
            }
        }
        this.isFiring = true;
    }

    EveTurretFiringFX.prototype.StartMuzzleEffect = function(muzzleID)
    {
        var stretch = this.stretch[muzzleID];
        for (var i = 0; i < stretch.curveSets.length; ++i)
        {
            var curveSet = stretch.curveSets[i];
            if (curveSet.name == 'play_start')
            {
                curveSet.PlayFrom(-this._perMuzzleData[muzzleID].currentStartDelay);
            }
            else if (curveSet.name == 'play_loop')
            {
                curveSet.PlayFrom(-this._perMuzzleData[muzzleID].currentStartDelay);
            }
            else if (curveSet.name == 'play_stop')
            {
                curveSet.Stop();
            }
        }
        this._perMuzzleData[muzzleID].started = true;
        this._perMuzzleData[muzzleID].readyToStart = false;
    }

    EveTurretFiringFX.prototype.StopFiring = function()
    {
        for (var j = 0; j < this.stretch.length; ++j)
        {
            var stretch = this.stretch[j];
            for (var i = 0; i < stretch.curveSets.length; ++i)
            {
                var curveSet = stretch.curveSets[i];
                if (curveSet.name == 'play_start')
                {
                    curveSet.Stop();
                }
                else if (curveSet.name == 'play_loop')
                {
                    curveSet.Stop();
                }
                else if (curveSet.name == 'play_stop')
                {
                    curveSet.Play();
                }
            }
            this._perMuzzleData[j].started = false;
            this._perMuzzleData[j].readyToStart = false;
            this._perMuzzleData[j].currentStartDelay = 0;
            this._perMuzzleData[j].elapsedTime = 0;
        }
        this.isFiring = false;
    }

    EveTurretFiringFX.prototype.UpdateViewDependentData = function()
    {
        for (var j = 0; j < this.stretch.length; ++j)
        {
            this.stretch[j].UpdateViewDependentData();
        }
    }

    function EveSOF()
    {
        var data = null;
        var spriteEffect = null;

        function _get(obj, property, defaultValue)
        {
            if (property in obj)
            {
                return obj[property];
            }
            return defaultValue;
        }

        function GetFactionMeshAreaParameters(areaName, paramName, faction)
        {
            var areas = _get(faction, 'areas',
            {});
            if (areaName in areas)
            {
                var area = _get(areas, areaName,
                {});
                if (paramName in _get(area, 'parameters',
                    {}))
                {
                    return _get(area.parameters[paramName], 'value', [0, 0, 0, 0]);
                }
            }
        }

        /**
         * @return {string}
         */
        function GetShaderPrefix(isAnimated)
        {
            return isAnimated ? _get(data['generic'], 'shaderPrefixAnimated', '') : _get(data['generic'], 'shaderPrefix', '');
        }

        function ModifyTextureResPath(path, name, area, faction, commands)
        {
            var pathInsert = null;
            if (_get(faction, 'resPathInsert', '').length)
            {
                pathInsert = faction.resPathInsert;
            }
            if ('respathinsert' in commands && commands.respathinsert.length == 1)
            {
                if (commands.respathinsert[0] == 'none')
                {
                    return path;
                }
                else
                {
                    pathInsert = commands.respathinsert[0];
                }
            }
            if (name == 'MaterialMap' || name == 'PaintMaskMap' || name == 'PmdgMap')
            {
                var index = path.lastIndexOf('/');
                var pathCopy = path;
                if (index >= 0)
                {
                    pathCopy = path.substr(0, index + 1) + pathInsert + '/' + path.substr(index + 1);
                }
                index = pathCopy.lastIndexOf('_');
                if (index >= 0)
                {
                    pathCopy = pathCopy.substr(0, index) + '_' + pathInsert + pathCopy.substr(index);
                    var textureOverrides = _get(area, 'textureOverrides',
                    {});
                    if ((name in textureOverrides) && (faction.name in textureOverrides[name]))
                    {
                        return pathCopy;
                    }
                }
            }
            return path;
        }

        /**
         * @return {string}
         */
        function ModifyShaderPath(shader, isSkinned)
        {
            var prefix = GetShaderPrefix(isSkinned);
            shader = '/' + shader;
            var index = shader.lastIndexOf('/');
            return shader.substr(0, index + 1) + prefix + shader.substr(index + 1);
        }

        function GetOverridenParameter(name, area, commands)
        {
            if ('mesh' in commands)
            {
                var prefixes = data.generic.materialPrefixes;
                var materialIndex = null;
                for (var m = 0; m < prefixes.length; ++m)
                {
                    if (name.substr(0, prefixes[m].length) == prefixes[m])
                    {
                        materialIndex = m;
                        break;
                    }
                }
                if (materialIndex !== null && materialIndex < commands.mesh.length && (_get(area, 'blockedMaterials', 0) & (1 << materialIndex)) == 0)
                {
                    var materialData = _get(data.material, commands.mesh[materialIndex], null);
                    if (materialData)
                    {
                        var shortName = name.substr(prefixes[m].length);
                        return _get(materialData.parameters, shortName, undefined);
                    }
                }
            }
        }

        function FillMeshAreas(areas, areasName, hull, faction, race, commands, shaderOverride)
        {
            var hullAreas = _get(hull, areasName, []);
            for (var i = 0; i < hullAreas.length; ++i)
            {
                var area = hullAreas[i];
                var effect = new Tw2Effect();
                effect.effectFilePath = data['generic']['areaShaderLocation'] + ModifyShaderPath(shaderOverride ? shaderOverride : area.shader, hull['isSkinned']);
                var names = _get(_get(data['generic']['areaShaders'], area.shader,
                {}), 'parameters', []);
                for (var j = 0; j < names.length; ++j)
                {
                    var name = names[j];
                    var param = GetOverridenParameter(name, area, commands);
                    param = param || _get(_get(_get(data.generic.hullAreas, area.name,
                    {}), 'parameters',
                    {}), name);
                    param = param || _get(_get(_get(race.hullAreas, area.name,
                    {}), 'parameters',
                    {}), name);
                    param = param || _get(_get(_get(faction.areas, area.name,
                    {}), 'parameters',
                    {}), name);
                    param = param || _get(_get(area, 'parameters',
                    {}), name);
                    if (param)
                    {
                        effect.parameters[name] = new Tw2Vector4Parameter(name, param);
                    }
                }

                var hullTextures = _get(area, 'textures', []);
                for (j in hullTextures)
                {
                    var path = hullTextures[j];
                    path = ModifyTextureResPath(path, j, area, faction, commands);
                    effect.parameters[j] = new Tw2TextureParameter(j, path);
                }

                effect.Initialize();

                var newArea = new Tw2MeshArea();
                newArea.name = area.name;
                newArea.effect = effect;
                newArea.index = _get(area, 'index', 0);
                newArea.count = _get(area, 'count', 1);
                areas.push(newArea);
            }

        }

        function SetupMesh(ship, hull, faction, race, commands)
        {
            var mesh = new Tw2Mesh();
            mesh.geometryResPath = hull['geometryResFilePath'];
            ship.boundingSphereCenter[0] = hull.boundingSphere[0];
            ship.boundingSphereCenter[1] = hull.boundingSphere[1];
            ship.boundingSphereCenter[2] = hull.boundingSphere[2];
            ship.boundingSphereRadius = hull.boundingSphere[3];
            FillMeshAreas(_get(mesh, 'opaqueAreas', []), 'opaqueAreas', hull, faction, race, commands);
            FillMeshAreas(_get(mesh, 'transparentAreas', []), 'transparentAreas', hull, faction, race, commands);
            FillMeshAreas(_get(mesh, 'additiveAreas', []), 'additiveAreas', hull, faction, race, commands);
            FillMeshAreas(_get(mesh, 'decalAreas', []), 'decalAreas', hull, faction, race, commands);
            FillMeshAreas(_get(mesh, 'depthAreas', []), 'depthAreas', hull, faction, race, commands);
            mesh.Initialize();
            ship.mesh = mesh;
            if ('shapeEllipsoidCenter' in hull)
            {
                ship.shapeEllipsoidCenter = hull.shapeEllipsoidCenter;
            }
            if ('shapeEllipsoidRadius' in hull)
            {
                ship.shapeEllipsoidRadius = hull.shapeEllipsoidRadius;
            }
        }

        function SetupDecals(ship, hull, faction)
        {
            var hullDecals = _get(hull, 'hullDecals', []);
            for (var i = 0; i < hullDecals.length; ++i)
            {
                var hullDecal = hullDecals[i];
                var factionDecal = null;
                var factionIndex = 'group' + _get(hullDecal, 'groupIndex', -1);
                if (faction.decals && (factionIndex in faction.decals))
                {
                    factionDecal = faction.decals[factionIndex];
                }
                if (factionDecal && !factionDecal['isVisible'])
                {
                    continue;
                }
                var effect = new Tw2Effect();
                if (factionDecal && factionDecal.shader && factionDecal.shader.length)
                {
                    effect.effectFilePath = data['generic']['decalShaderLocation'] + '/' + GetShaderPrefix(false) + factionDecal.shader;
                }
                else if (hullDecal.shader && hullDecal.shader.length)
                {
                    effect.effectFilePath = data['generic']['decalShaderLocation'] + '/' + GetShaderPrefix(false) + hullDecal.shader;
                }
                else
                {
                    continue;
                }
                var hullParameters = _get(hullDecal, 'parameters',
                {});
                for (var j in hullParameters)
                {
                    effect.parameters[j] = new Tw2Vector4Parameter(j, hullParameters[j]);
                }
                var hullTextures = _get(hullDecal, 'textures',
                {});
                for (j in hullTextures)
                {
                    effect.parameters[j] = new Tw2TextureParameter(j, hullTextures[j]);
                }
                if (factionDecal)
                {
                    var factionParameters = _get(factionDecal, 'parameters',
                    {});
                    for (j in factionParameters)
                    {
                        effect.parameters[j] = new Tw2Vector4Parameter(j, factionParameters[j]);
                    }
                    var factionTextures = _get(factionDecal, 'textures',
                    {});
                    for (j in factionTextures)
                    {
                        if (!(j in effect.parameters))
                        {
                            effect.parameters[j] = new Tw2TextureParameter(j, factionTextures[j]);
                        }
                    }
                }
                effect.Initialize();

                var decal = new EveSpaceObjectDecal();
                vec3.set(_get(hullDecal, 'position', [0, 0, 0]), decal.position);
                quat4.set(_get(hullDecal, 'rotation', [0, 0, 0, 1]), decal.rotation);
                vec3.set(_get(hullDecal, 'scaling', [1, 1, 1]), decal.scaling);
                decal.parentBoneIndex = _get(hullDecal, 'boneIndex', -1);
                decal.indexBuffer = new Uint16Array(hullDecal.indexBuffer);
                decal.decalEffect = effect;
                decal.name = _get(hullDecals[i], 'name', '');
                if ('groupIndex' in hullDecals[i])
                {
                    decal.groupIndex = hullDecals[i].groupIndex;
                }
                decal.Initialize();
                ship.decals.push(decal);
            }
        }

        function SetupInstancedMeshes(ship, hull, faction, race, commands)
        {
            var instancedMeshes = _get(hull, 'instancedMeshes', []);
            for (var i = 0; i < instancedMeshes.length; ++i)
            {
                var him = instancedMeshes[i];
                var mesh = new Tw2InstancedMesh();
                mesh.instanceGeometryResPath = him.instanceGeometryResPath;
                mesh.geometryResPath = him.geometryResPath;
                mesh.Initialize();

                FillMeshAreas(_get(mesh, 'opaqueAreas', []), 'opaqueAreas', hull, faction, race, commands, him.shader);

                var child = new EveChildMesh();
                child.mesh = mesh;
                ship.effectChildren.push(child);
            }
        }

        function SetupSpriteSets(ship, hull, faction)
        {
            var hullSets = _get(hull, 'spriteSets', []);
            var factionSets = _get(faction, 'spriteSets',
            {});
            for (var i = 0; i < hullSets.length; ++i)
            {
                var spriteSet = new EveSpriteSet(true, hull['isSkinned'] && hullSets[i]['skinned']);
                spriteSet.name = _get(hullSets[i], 'name', '');
                spriteSet.effect = spriteEffect;
                var hullData = _get(hullSets[i], 'items', []);
                for (var j = 0; j < hullData.length; ++j)
                {
                    if (!('group' + _get(hullData[j], 'groupIndex', -1) in factionSets))
                    {
                        continue;
                    }
                    var factionSet = factionSets['group' + _get(hullData[j], 'groupIndex', -1)];
                    var item = new EveSpriteSetItem();
                    if ('color' in factionSet)
                    {
                        item.color = factionSet.color;
                    }
                    item.blinkPhase = _get(hullData[j], 'blinkPhase', 0);
                    item.blinkRate = _get(hullData[j], 'blinkRate', 0.1);
                    item.boneIndex = _get(hullData[j], 'boneIndex', 0);
                    item.falloff = _get(hullData[j], 'falloff', 0);
                    item.maxScale = _get(hullData[j], 'maxScale', 10);
                    item.minScale = _get(hullData[j], 'minScale', 1);
                    item.name = _get(hullData[j], 'name', '');
                    if ('groupIndex' in hullData[j])
                    {
                        item.groupIndex = hullData[j].groupIndex;
                    }
                    item.groupName = factionSet.name;
                    if ('position' in hullData[j])
                    {
                        item.position = hullData[j].position;
                    }
                    spriteSet.sprites.push(item);
                }
                spriteSet.Initialize();
                ship.spriteSets.push(spriteSet);
            }
        }

        function _scale(a, b, c)
        {
            c[0] = a[0] * b;
            c[1] = a[1] * b;
            c[2] = a[2] * b;
            c[3] = a[3] * b;
        }

        function SetupSpotlightSets(ship, hull, faction)
        {
            var hullSets = _get(hull, 'spotlightSets', []);
            var factionSets = _get(faction, 'spotlightSets',
            {});
            for (var i = 0; i < hullSets.length; ++i)
            {
                var spotlightSet = new EveSpotlightSet();
                spotlightSet.name = _get(hullSets[i], 'name', '');
                spotlightSet.coneEffect = new Tw2Effect();
                spotlightSet.glowEffect = new Tw2Effect();
                if (hullSets[i]['skinned'])
                {
                    spotlightSet.coneEffect.effectFilePath = 'res:/graphics/effect/managed/space/spaceobject/fx/skinned_spotlightcone.fx';
                    spotlightSet.glowEffect.effectFilePath = 'res:/graphics/effect/managed/space/spaceobject/fx/skinned_spotlightglow.fx';
                }
                else
                {
                    spotlightSet.coneEffect.effectFilePath = 'res:/graphics/effect/managed/space/spaceobject/fx/spotlightcone.fx';
                    spotlightSet.glowEffect.effectFilePath = 'res:/graphics/effect/managed/space/spaceobject/fx/spotlightglow.fx';
                }
                spotlightSet.coneEffect.parameters['TextureMap'] = new Tw2TextureParameter('TextureMap', hullSets[i]['coneTextureResPath']);
                spotlightSet.glowEffect.parameters['TextureMap'] = new Tw2TextureParameter('TextureMap', hullSets[i]['glowTextureResPath']);
                spotlightSet.coneEffect.parameters['zOffset'] = new Tw2FloatParameter('zOffset', _get(hullSets[i], 'zOffset', 0));
                spotlightSet.coneEffect.Initialize();
                spotlightSet.glowEffect.Initialize();

                var hullData = _get(hullSets[i], 'items', []);
                for (var j = 0; j < hullData.length; ++j)
                {
                    var item = new EveSpotlightSetItem();
                    item.name = _get(hullData[j], 'name', '');
                    item.groupIndex = _get(hullData[j], 'groupIndex', -1);
                    item.boneIndex = _get(hullData[j], 'boneIndex', 0);
                    item.boosterGainInfluence = _get(hullData[j], 'boosterGainInfluence', 0);
                    var factionSet = factionSets['group' + item.groupIndex];
                    if (factionSet)
                    {
                        _scale(_get(factionSet, 'coneColor', [0, 0, 0, 0]), _get(hullData[j], 'coneIntensity', 0), item.coneColor);
                        _scale(_get(factionSet, 'spriteColor', [0, 0, 0, 0]), _get(hullData[j], 'spriteIntensity', 0), item.spriteColor);
                        _scale(_get(factionSet, 'flareColor', [0, 0, 0, 0]), _get(hullData[j], 'flareIntensity', 0), item.flareColor);
                    }
                    item.spriteScale = _get(hullData[j], 'spriteScale', [1, 1, 1]);
                    if ('transform' in hullData[j])
                    {
                        item.transform = hullData[j].transform;
                    }
                    else
                    {
                        mat4.identity(item.transform);
                    }
                    spotlightSet.spotlightItems.push(item);
                }
                spotlightSet.Initialize();
                ship.spotlightSets.push(spotlightSet);
            }
        }

        function _assignIfExists(dest, src, attr)
        {
            if (attr in src)
            {
                dest[attr] = src[attr];
            }
        }

        function SetupPlaneSets(ship, hull, faction)
        {
            var hullSets = _get(hull, 'planeSets', []);
            var factionSets = _get(faction, 'planeSets',
            {});
            for (var i = 0; i < hullSets.length; ++i)
            {
                var planeSet = new EvePlaneSet();
                planeSet.name = _get(hullSets[i], 'name', '');
                planeSet.effect = new Tw2Effect();
                if (hullSets[i]['skinned'])
                {
                    planeSet.effect.effectFilePath = 'res:/graphics/effect/managed/space/spaceobject/fx/skinned_planeglow.fx';
                }
                else
                {
                    planeSet.effect.effectFilePath = 'res:/graphics/effect/managed/space/spaceobject/fx/planeglow.fx';
                }
                planeSet.effect.parameters['Layer1Map'] = new Tw2TextureParameter('Layer1Map', hullSets[i]['layer1MapResPath']);
                planeSet.effect.parameters['Layer2Map'] = new Tw2TextureParameter('Layer2Map', hullSets[i]['layer2MapResPath']);
                planeSet.effect.parameters['MaskMap'] = new Tw2TextureParameter('MaskMap', hullSets[i]['maskMapResPath']);
                planeSet.effect.parameters['PlaneData'] = new Tw2Vector4Parameter('PlaneData', _get(hullSets[i], 'planeData', [1, 0, 0, 0]));
                planeSet.effect.Initialize();

                var hullData = _get(hullSets[i], 'items', []);
                for (var j = 0; j < hullData.length; ++j)
                {
                    var item = new EvePlaneSetItem();
                    _assignIfExists(item, hullData[j], 'groupIndex');
                    _assignIfExists(item, hullData[j], 'name');
                    _assignIfExists(item, hullData[j], 'position');
                    _assignIfExists(item, hullData[j], 'rotation');
                    _assignIfExists(item, hullData[j], 'scaling');
                    _assignIfExists(item, hullData[j], 'color');
                    quat4.set(_get(hullData[j], 'layer1Transform', [0, 0, 0, 0]), item.layer1Transform);
                    _assignIfExists(item, hullData[j], 'layer1Scroll');
                    quat4.set(_get(hullData[j], 'layer2Transform', [0, 0, 0, 0]), item.layer2Transform);
                    _assignIfExists(item, hullData[j], 'layer2Scroll');
                    item.boneIndex = _get(hullData[j], 'boneIndex', -1);
                    item.maskAtlasID = _get(hullData[j], 'maskMapAtlasIndex', 0);

                    var factionSet = factionSets['group' + _get(hullData[j], 'groupIndex', -1)];
                    if (factionSet)
                    {
                        quat4.set(_get(factionSet, 'color', [0, 0, 0, 0]), item.color);
                    }
                    planeSet.planes.push(item);
                }
                planeSet.Initialize();
                ship.planeSets.push(planeSet);
            }
        }

        function SetupBoosters(ship, hull, race)
        {
            if (!('booster' in hull))
            {
                return;
            }
            var booster = new EveBoosterSet();
            var hullBooster = hull['booster'];
            var raceBooster = _get(race, 'booster',
            {});
            _assignIfExists(booster, raceBooster, 'glowScale');
            _assignIfExists(booster, raceBooster, 'glowColor');
            _assignIfExists(booster, raceBooster, 'warpGlowColor');
            _assignIfExists(booster, raceBooster, 'symHaloScale');
            _assignIfExists(booster, raceBooster, 'haloScaleX');
            _assignIfExists(booster, raceBooster, 'haloScaleY');
            _assignIfExists(booster, raceBooster, 'haloColor');
            _assignIfExists(booster, raceBooster, 'warpHalpColor');

            booster.effect = new Tw2Effect();
            booster.effect.effectFilePath = 'res:/Graphics/Effect/Managed/Space/Booster/BoosterVolumetric.fx';
            booster.effect.parameters['NoiseFunction0'] = new Tw2FloatParameter('NoiseFunction0', _get(raceBooster.shape0, 'noiseFunction', 0));
            booster.effect.parameters['NoiseSpeed0'] = new Tw2FloatParameter('NoiseSpeed0', _get(raceBooster.shape0, 'noiseSpeed', 0));
            booster.effect.parameters['NoiseAmplitudeStart0'] = new Tw2Vector4Parameter('NoiseAmplitudeStart0', _get(raceBooster.shape0, 'noiseAmplitureStart', [0, 0, 0, 0]));
            booster.effect.parameters['NoiseAmplitudeEnd0'] = new Tw2Vector4Parameter('NoiseAmplitudeEnd0', _get(raceBooster.shape0, 'noiseAmplitureEnd', [0, 0, 0, 0]));
            booster.effect.parameters['NoiseFrequency0'] = new Tw2Vector4Parameter('NoiseFrequency0', _get(raceBooster.shape0, 'noiseFrequency', [0, 0, 0, 0]));
            booster.effect.parameters['Color0'] = new Tw2Vector4Parameter('Color0', _get(raceBooster.shape0, 'color', [0, 0, 0, 0]));

            booster.effect.parameters['NoiseFunction1'] = new Tw2FloatParameter('NoiseFunction1', _get(raceBooster.shape1, 'noiseFunction', 0));
            booster.effect.parameters['NoiseSpeed1'] = new Tw2FloatParameter('NoiseSpeed1', _get(raceBooster.shape1, 'noiseSpeed', 0));
            booster.effect.parameters['NoiseAmplitudeStart1'] = new Tw2Vector4Parameter('NoiseAmplitudeStart1', _get(raceBooster.shape1, 'noiseAmplitureStart', [0, 0, 0, 0]));
            booster.effect.parameters['NoiseAmplitudeEnd1'] = new Tw2Vector4Parameter('NoiseAmplitudeEnd1', _get(raceBooster.shape1, 'noiseAmplitureEnd', [0, 0, 0, 0]));
            booster.effect.parameters['NoiseFrequency1'] = new Tw2Vector4Parameter('NoiseFrequency1', _get(raceBooster.shape1, 'noiseFrequency', [0, 0, 0, 0]));
            booster.effect.parameters['Color1'] = new Tw2Vector4Parameter('Color1', _get(raceBooster.shape1, 'color', [0, 0, 0, 0]));

            booster.effect.parameters['WarpNoiseFunction0'] = new Tw2FloatParameter('WarpNoiseFunction0', _get(raceBooster.warpShape0, 'noiseFunction', 0));
            booster.effect.parameters['WarpNoiseSpeed0'] = new Tw2FloatParameter('WarpNoiseSpeed0', _get(raceBooster.warpShape0, 'noiseSpeed', 0));
            booster.effect.parameters['WarpNoiseAmplitudeStart0'] = new Tw2Vector4Parameter('WarpNoiseAmplitudeStart0', _get(raceBooster.warpShape0, 'noiseAmplitureStart', [0, 0, 0, 0]));
            booster.effect.parameters['WarpNoiseAmplitudeEnd0'] = new Tw2Vector4Parameter('WarpNoiseAmplitudeEnd0', _get(raceBooster.warpShape0, 'noiseAmplitureEnd', [0, 0, 0, 0]));
            booster.effect.parameters['WarpNoiseFrequency0'] = new Tw2Vector4Parameter('WarpNoiseFrequency0', _get(raceBooster.warpShape0, 'noiseFrequency', [0, 0, 0, 0]));
            booster.effect.parameters['WarpColor0'] = new Tw2Vector4Parameter('WarpColor0', _get(raceBooster.warpShape0, 'color', [0, 0, 0, 0]));

            booster.effect.parameters['WarpNoiseFunction1'] = new Tw2FloatParameter('WarpNoiseFunction1', _get(raceBooster.warpShape1, 'noiseFunction', 0));
            booster.effect.parameters['WarpNoiseSpeed1'] = new Tw2FloatParameter('WarpNoiseSpeed1', _get(raceBooster.warpShape1, 'noiseSpeed', 0));
            booster.effect.parameters['WarpNoiseAmplitudeStart1'] = new Tw2Vector4Parameter('WarpNoiseAmplitudeStart1', _get(raceBooster.warpShape1, 'noiseAmplitureStart', [0, 0, 0, 0]));
            booster.effect.parameters['WarpNoiseAmplitudeEnd1'] = new Tw2Vector4Parameter('WarpNoiseAmplitudeEnd1', _get(raceBooster.warpShape1, 'noiseAmplitureEnd', [0, 0, 0, 0]));
            booster.effect.parameters['WarpNoiseFrequency1'] = new Tw2Vector4Parameter('WarpNoiseFrequency1', _get(raceBooster.warpShape1, 'noiseFrequency', [0, 0, 0, 0]));
            booster.effect.parameters['WarpColor1'] = new Tw2Vector4Parameter('WarpColor1', _get(raceBooster.warpShape1, 'color', [0, 0, 0, 0]));

            booster.effect.parameters['ShapeAtlasSize'] = new Tw2Vector4Parameter('ShapeAtlasSize', [_get(raceBooster, 'shapeAtlasHeight', 0), _get(raceBooster, 'shapeAtlasCount', 0), 0, 0]);
            booster.effect.parameters['BoosterScale'] = new Tw2Vector4Parameter('BoosterScale', _get(raceBooster, 'scale', [1, 1, 1, 1]));

            booster.effect.parameters['ShapeMap'] = new Tw2TextureParameter('ShapeMap', raceBooster.shapeAtlasResPath);
            booster.effect.parameters['GradientMap0'] = new Tw2TextureParameter('GradientMap0', raceBooster.gradient0ResPath);
            booster.effect.parameters['GradientMap1'] = new Tw2TextureParameter('GradientMap1', raceBooster.gradient1ResPath);
            booster.effect.parameters['NoiseMap'] = new Tw2TextureParameter('ShapeMap', "res:/Texture/Global/noise32cube_volume.dds.0.png");

            booster.effect.Initialize();

            booster.glows = new EveSpriteSet(true);
            booster.glows.effect = new Tw2Effect();
            booster.glows.effect.effectFilePath = 'res:/Graphics/Effect/Managed/Space/Booster/BoosterGlowAnimated.fx';
            booster.glows.effect.parameters['DiffuseMap'] = new Tw2TextureParameter('DiffuseMap', 'res:/Texture/Particle/whitesharp.dds.0.png');
            booster.glows.effect.parameters['NoiseMap'] = new Tw2TextureParameter('NoiseMap', 'res:/Texture/global/noise.dds.0.png');
            booster.glows.effect.Initialize();

            var items = _get(hullBooster, 'items', []);
            for (var i = 0; i < items.length; ++i)
            {
                var locator = new EveLocator();
                locator.name = 'locator_booster_' + (i + 1);
                if ('transform' in items[i])
                {
                    locator.transform = items[i].transform;
                }
                else
                {
                    mat4.identity(locator.transform);
                }
                locator.atlasIndex0 = _get(items[i], 'atlasIndex0', 0);
                locator.atlasIndex1 = _get(items[i], 'atlasIndex1', 0);
                ship.locators.push(locator);
            }
            booster.Initialize();
            ship.boosters = booster;
        }

        function SetupLocators(ship, hull)
        {
            var hullLocators = _get(hull, 'locatorTurrets', []);
            for (var i = 0; i < hullLocators.length; ++i)
            {
                var locator = new EveLocator();
                locator.name = hullLocators[i].name;
                if ('transform' in hullLocators[i])
                {
                    locator.transform = hullLocators[i].transform;
                }
                else
                {
                    mat4.identity(locator.transform);
                }
                ship.locators.push(locator);
            }
        }

        function BindParticleEmitters(obj, curveSet, curve)
        {
            for (var i = 0; i < obj.particleEmitters.length; ++i)
            {
                if ('rate' in obj.particleEmitters[i])
                {
                    var binding = new Tw2ValueBinding();
                    binding.sourceObject = curve;
                    binding.sourceAttribute = 'currentValue';
                    binding.destinationObject = obj.particleEmitters[i];
                    binding.destinationAttribute = 'rate';
                    binding.Initialize();
                    curveSet.bindings.push(binding);
                }
            }
            for (i = 0; i < obj.children.length; ++i)
            {
                BindParticleEmitters(obj.children[i], curveSet, curve);
            }
        }

        function SetupChildren(ship, hull, curveSet, curves)
        {
            function onChildLoaded(child)
            {
                return function(obj)
                {
                    if (obj.isEffectChild)
                    {
                        ship.effectChildren.push(obj);
                    }
                    else
                    {
                        ship.children.push(obj);
                    }
                    _assignIfExists(obj, child, 'translation');
                    _assignIfExists(obj, child, 'rotation');
                    _assignIfExists(obj, child, 'scaling');
                    var id = _get(child, 'id', -1);
                    if (id != -1 && curves[id])
                    {
                        BindParticleEmitters(obj, curveSet, curves[id]);
                    }
                };
            }
            var children = _get(hull, 'children', []);
            for (var i = 0; i < children.length; ++i)
            {
                resMan.GetObject(children[i]['redFilePath'], onChildLoaded(children[i]));
            }
        }

        function SetupAnimations(ship, hull)
        {
            var id_curves = [];
            var curveSet = null;
            var animations = _get(hull, 'animations', []);
            for (var i = 0; i < animations.length; ++i)
            {
                if (_get(animations[i], 'id', -1) != -1 && (_get(animations[i], 'startRate', -1) != -1))
                {
                    if (!curveSet)
                    {
                        curveSet = new Tw2CurveSet();
                    }
                    var curve = new Tw2ScalarCurve2();
                    curve.keys.push(new Tw2ScalarKey2());
                    curve.keys.push(new Tw2ScalarKey2());
                    curve.keys[0].value = _get(animations[i], 'startRate', -1);
                    curve.keys[1].time = 1;
                    curve.keys[1].value = _get(animations[i], 'endRate', -1);
                    curve.Initialize();
                    curveSet.curves.push(curve);
                    ship.curveSets.push(curveSet);
                    id_curves[_get(animations[i], 'id', -1)] = curve;
                }
            }
            if (curveSet)
            {
                curveSet.Initialize();
            }
            return [curveSet, id_curves];
        }

        var dataLoading = false;
        var pendingLoads = [];

        function Build(dna)
        {
            var parts = dna.split(':');
            var commands = {};
            for (var i = 3; i < parts.length; ++i)
            {
                var subparts = parts[i].split('?');
                commands[subparts[0]] = subparts[1].split(';');
            }
            var hull = data['hull'][parts[0]];
            var faction = data['faction'][parts[1]];
            var race = data['race'][parts[2]];
            var ship = new(_get(hull, 'buildClass', 0) == 2 ? EveSpaceObject : EveShip)();
            SetupMesh(ship, hull, faction, race, commands);
            SetupDecals(ship, hull, faction);
            SetupSpriteSets(ship, hull, faction);
            SetupSpotlightSets(ship, hull, faction);
            SetupPlaneSets(ship, hull, faction);
            SetupBoosters(ship, hull, race);
            SetupLocators(ship, hull);
            var curves = SetupAnimations(ship, hull);
            SetupChildren(ship, hull, curves[0], curves[1]);
            SetupInstancedMeshes(ship, hull, faction, race, commands);

            ship.Initialize();
            return ship;
        }

        this.LoadData = function(callback)
        {
            if (data == null)
            {
                if (callback)
                {
                    pendingLoads.push(callback);
                }
                if (!dataLoading)
                {
                    spriteEffect = new Tw2Effect();
                    spriteEffect.effectFilePath = 'res:/graphics/effect/managed/space/spaceobject/fx/blinkinglightspool.fx';
                    spriteEffect.parameters['MainIntensity'] = new Tw2FloatParameter('MainIntensity', 1);
                    spriteEffect.parameters['GradientMap'] = new Tw2TextureParameter('GradientMap', 'res:/texture/particle/whitesharp_gradient.dds.0.png');
                    spriteEffect.Initialize();

                    resMan.GetObject('res:/dx9/model/spaceobjectfactory/data.red', function(obj)
                    {
                        data = obj;
                        for (var i = 0; i < pendingLoads.length; ++i)
                        {
                            pendingLoads[i]();
                        }
                        pendingLoads = [];
                    });
                    dataLoading = true;
                }
            }
            else
            {
                if (callback)
                {
                    callback();
                }
            }
        };

        this.BuildFromDNA = function(dna, callback)
        {
            if (data == null)
            {
                this.LoadData(function()
                {
                    var result = Build(dna);
                    if (callback)
                    {
                        callback(result);
                    }
                });
            }
            else
            {
                var result = Build(dna);
                if (callback)
                {
                    callback(result);
                }
            }
        };

        function GetTurretMaterialParameter(name, parentFaction, areaData)
        {
            var materialIdx = -1;
            for (var i = 0; i < data['generic']['materialPrefixes'].length; ++i)
            {
                if (name.substr(0, data['generic']['materialPrefixes'][i].length) == data['generic']['materialPrefixes'][i])
                {
                    materialIdx = i;
                    name = name.substr(data['generic']['materialPrefixes'][i].length);
                }
            }
            if (materialIdx != -1)
            {
                var turretMaterialIndex = _get(parentFaction, 'materialUsageMtl' + (materialIdx + 1), materialIdx);
                if (turretMaterialIndex >= 0 && turretMaterialIndex < data['generic']['materialPrefixes'].length)
                {
                    name = data['generic']['materialPrefixes'][turretMaterialIndex] + name;
                    if (name in areaData.parameters)
                    {
                        return areaData.parameters[name];
                    }
                }
            }
        }

        var zeroColor = [0, 0, 0, 0];

        function CombineTurretMaterial(name, parentValue, turretValue, overrideMethod)
        {
            switch (overrideMethod)
            {
                case 'overridable':
                    return parentValue ? parentValue : turretValue ? turretValue : zeroColor;
                case 'half_overridable':
                    if (name.indexOf('GlowColor') >= 0)
                    {
                        return turretValue ? turretValue : zeroColor;
                    }
                    return parentValue ? parentValue : turretValue ? turretValue : zeroColor;
                case 'not_overridable':
                case 'half_overridable_2':
                    return turretValue ? turretValue : zeroColor;
            }
            return zeroColor;
        }

        function SetupTurretMaterial(turretSet, parentFactionName, turretFactionName)
        {
            var parentFaction = data['faction'][parentFactionName];
            var turretFaction = data['faction'][turretFactionName];
            var parentArea = null;
            if (parentFaction && parentFaction.areas && ('hull' in parentFaction.areas))
            {
                parentArea = parentFaction.areas.hull;
            }
            var turretArea = null;
            if (turretFaction && turretFaction.areas && ('hull' in turretFaction.areas))
            {
                turretArea = turretFaction.areas.hull;
            }
            if (!parentArea && !turretArea)
            {
                return;
            }
            if (turretSet.turretEffect)
            {
                var params = turretSet.turretEffect.parameters;
                for (var i in params)
                {
                    if (params[i].constructor.prototype != Tw2Vector4Parameter.prototype)
                    {
                        continue;
                    }
                    var parentValue = null;
                    var turretValue = null;
                    if (parentArea)
                    {
                        parentValue = GetTurretMaterialParameter(i, parentFaction, parentArea);
                    }
                    if (turretArea)
                    {
                        turretValue = GetTurretMaterialParameter(i, parentFaction, parentArea);
                    }
                    quat4.set(CombineTurretMaterial(i, parentValue, turretValue, turretSet.turretEffect.name), params[i].value);
                }
                turretSet.turretEffect.BindParameters();
            }
        }

        this.SetupTurretMaterial = function(turretSet, parentFactionName, turretFactionName, callback)
        {
            if (data == null)
            {
                this.LoadData(function()
                {
                    SetupTurretMaterial(turretSet, parentFactionName, turretFactionName);
                    if (callback)
                    {
                        callback();
                    }
                });
            }
            else
            {
                SetupTurretMaterial(turretSet, parentFactionName, turretFactionName);
                if (callback)
                {
                    callback();
                }
            }
        };

        function getDataKeys(name)
        {
            if (name !== 'all')
            {
                var names = {};
                for (var i in data[name])
                {
                    names[i] = data[name][i].description || '';
                }
                return names;
            }
            else
            {
                return data
            }
        }

        this.GetHullNames = function(callback)
        {
            this.LoadData(function()
            {
                callback(getDataKeys('hull'));
            });
        };

        this.GetFactionNames = function(callback)
        {
            this.LoadData(function()
            {
                callback(getDataKeys('faction'));
            });
        };

        this.GetRaceNames = function(callback)
        {
            this.LoadData(function()
            {
                callback(getDataKeys('race'));
            });
        };

        this.GetSofData = function(callback)
        {
            this.LoadData(function()
            {
                callback(getDataKeys('all'));
            })
        };


    }

    /**
     * vec3 Hermite
     * @param out
     * @param v1
     * @param t1
     * @param v2
     * @param t2
     * @param s
     * @returns {*}
     */
    function vec3Hermite(out, v1, t1, v2, t2, s)
    {
        var k3 = 2 * s * s * s - 3 * s * s + 1;
        var k2 = -2 * s * s * s + 3 * s * s;
        var k1 = s * s * s - 2 * s * s + s;
        var k0 = s * s * s - s * s;

        out[0] = k3 * v1[0] + k2 * v2[0] + k1 * t1[0] + k0 * t2[0];
        out[1] = k3 * v1[1] + k2 * v2[1] + k1 * t1[1] + k0 * t2[1];
        out[2] = k3 * v1[2] + k2 * v2[2] + k1 * t1[2] + k0 * t2[2];
        return out;
    }

    /**
     * EveCurveLineSet
     * @property {String} name
     * @property {Boolean} display
     * @property {Boolean} disableDepth
     * @property {Number} lineWidthFactor
     * @property {Array} lines
     * @property {Array} emptyLineID
     * @property {vec3} translation
     * @property {quat4} rotation
     * @property {vec3} scaling
     * @property {mat4} transform
     * @property {Tw2Effect} lineEffect
     * @property {null|Tw2Effect} pickEffect
     * @property {Boolean} additive
     * @property {Tw2PerObjectData} perObjectData
     * @property {Number} _vertexSize
     * @property {WebGLBuffer} _vertexBuffer
     * @property {Number} _vertexBufferSize
     * @property {Tw2VertexDeclaration} declaration
     * @constructor
     */
    function EveCurveLineSet()
    {
        this.name = '';
        this.display = true;
        this.disableDepth = false;
        this.lineWidthFactor = 1;
        this.lines = [];
        this.emptyLineID = [];

        this.translation = vec3.create();
        this.rotation = quat4.create([0, 0, 0, 1]);
        this.scaling = vec3.create([1, 1, 1]);
        this.transform = mat4.identity(mat4.create());

        this.lineEffect = new Tw2Effect();
        this.lineEffect.effectFilePath = "res:/Graphics/Effect/Managed/Space/SpecialFX/Lines3D.fx";
        this.lineEffect.parameters['TexMap'] = new Tw2TextureParameter('TexMap', 'res:/texture/global/white.dds.0.png');
        this.lineEffect.parameters['OverlayTexMap'] = new Tw2TextureParameter('OverlayTexMap', 'res:/texture/global/white.dds.0.png');
        this.lineEffect.Initialize();
        this.pickEffect = null;

        this.additive = false;
        this.pickable = true;

        this.perObjectData = new Tw2PerObjectData();
        this.perObjectData.perObjectVSData = new Tw2RawData();
        this.perObjectData.perObjectVSData.Declare('WorldMat', 16);
        this.perObjectData.perObjectVSData.Create();
        this.perObjectData.perObjectPSData = new Tw2RawData();
        this.perObjectData.perObjectPSData.Declare('WorldMat', 16);
        this.perObjectData.perObjectPSData.Create();

        this._vertexSize = 26;
        this._vertexBuffer = null;
        this._vertexBufferSize = 0;
        this.declaration = new Tw2VertexDeclaration();
        this.declaration.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_POSITION, 0, device.gl.FLOAT, 3, 0));
        this.declaration.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 0, device.gl.FLOAT, 4, 12));
        this.declaration.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 1, device.gl.FLOAT, 4, 28));
        this.declaration.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 2, device.gl.FLOAT, 3, 44));
        this.declaration.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_COLOR, 0, device.gl.FLOAT, 4, 56));
        this.declaration.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_COLOR, 1, device.gl.FLOAT, 4, 72));
        this.declaration.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_COLOR, 2, device.gl.FLOAT, 4, 88));
        this.declaration.stride = 4 * this._vertexSize;
        this.declaration.RebuildHash();
    }

    /**
     * Initializes the Curve line set
     */
    EveCurveLineSet.prototype.Initialize = function()
    {
        mat4.identity(this.transform);
        mat4.translate(this.transform, this.translation);
        var rotationTransform = mat4.transpose(quat4.toMat4(this.rotation, mat4.create()));
        mat4.multiply(this.transform, rotationTransform, this.transform);
        mat4.scale(this.transform, this.scaling);
    };

    /**
     * Adds a line
     * @param line
     * @returns {Number} Line index
     * @private
     */
    EveCurveLineSet.prototype._addLine = function(line)
    {
        if (this.emptyLineID.length)
        {
            var index = this.emptyLineID.pop();
            this.lines[index] = line;
            return index;
        }
        this.lines.push(line);
        return this.lines.length - 1;
    };

    /**
     * Adds a straight line
     * @param {vec3} startPosition
     * @param {quat3} startColor
     * @param {vec3} endPosition
     * @param {quat4} endColor
     * @param {Number} lineWidth
     * @returns {Number} line index
     */
    EveCurveLineSet.prototype.AddStraightLine = function(startPosition, startColor, endPosition, endColor, lineWidth)
    {
        var line = {
            type: EveCurveLineSet.LINETYPE_STRAIGHT,
            position1: startPosition,
            color1: startColor,
            position2: endPosition,
            color2: endColor,
            intermediatePosition: [0, 0, 0],
            width: lineWidth,
            multiColor: [0, 0, 0, 0],
            multiColorBorder: -1,
            overlayColor: [0, 0, 0, 0],
            animationSpeed: 0,
            animationScale: 1,
            numOfSegments: 1
        };
        return this._addLine(line)
    };

    /**
     * Adds a curved line using cartesian co-ordinates
     * @param {vec3} startPosition
     * @param {quat4} startColor
     * @param {vec3} endPosition
     * @param {quat4} endColor
     * @param {vec3} middle
     * @param {Number} lineWidth
     * @returns {Number} line index
     */
    EveCurveLineSet.prototype.AddCurvedLineCrt = function(startPosition, startColor, endPosition, endColor, middle, lineWidth)
    {
        var line = {
            type: EveCurveLineSet.LINETYPE_CURVED,
            position1: startPosition,
            color1: startColor,
            position2: endPosition,
            color2: endColor,
            intermediatePosition: middle,
            width: lineWidth,
            multiColor: [0, 0, 0, 0],
            multiColorBorder: -1,
            overlayColor: [0, 0, 0, 0],
            animationSpeed: 0,
            animationScale: 1,
            numOfSegments: 20
        };
        return this._addLine(line)
    };

    /**
     * Adds a curved line using spherical co-ordinates
     * @param {vec3} startPosition
     * @param {quat4} startColor
     * @param {vec3} endPosition
     * @param {quat4} endColor
     * @param {vec3} center
     * @param {vec3} middle
     * @param {Number} lineWidth
     * @returns {Number} line index
     */
    EveCurveLineSet.prototype.AddCurvedLineSph = function(startPosition, startColor, endPosition, endColor, center, middle, lineWidth)
    {
        var phi1 = startPosition[0];
        var theta1 = startPosition[1];
        var radius1 = startPosition[2];
        var phi2 = endPosition[0];
        var theta2 = endPosition[1];
        var radius2 = endPosition[2];
        var phiM = middle[0];
        var thetaM = middle[1];
        var radiusM = middle[2];
        // is given in spherical coords, so convert them into cartesian
        var startPnt = [radius1 * Math.sin(phi1) * Math.sin(theta1), radius1 * Math.cos(theta1), radius1 * Math.cos(phi1) * Math.sin(theta1)];
        var endPnt = [radius2 * Math.sin(phi2) * Math.sin(theta2), radius2 * Math.cos(theta2), radius2 * Math.cos(phi2) * Math.sin(theta2)];
        var middlePnt = [radiusM * Math.sin(phiM) * Math.sin(thetaM), radiusM * Math.cos(thetaM), radiusM * Math.cos(phiM) * Math.sin(thetaM)];
        // dont forget center!
        vec3.add(startPnt, center);
        vec3.add(endPnt, center);
        vec3.add(middlePnt, center);
        // add it
        return this.AddCurvedLineCrt(startPnt, startColor, endPnt, endColor, middlePnt, lineWidth);
    };

    /**
     * Adds a sphered line using cartesian co-ordinates
     * @param {vec3} startPosition
     * @param {quat4} startColor
     * @param {vec3} endPosition
     * @param {quat4} endColor
     * @param {vec3} center
     * @param {Number} lineWidth
     * @returns {Number} line index
     */
    EveCurveLineSet.prototype.AddSpheredLineCrt = function(startPosition, startColor, endPosition, endColor, center, lineWidth)
    {
        var line = {
            type: EveCurveLineSet.LINETYPE_SPHERED,
            position1: startPosition,
            color1: startColor,
            position2: endPosition,
            color2: endColor,
            intermediatePosition: center,
            width: lineWidth,
            multiColor: [0, 0, 0, 0],
            multiColorBorder: -1,
            overlayColor: [0, 0, 0, 0],
            animationSpeed: 0,
            animationScale: 1,
            numOfSegments: 20
        };
        return this._addLine(line)
    };

    /**
     * Adds a sphered line using spherical co-ordinates
     * @param {vec3} startPosition
     * @param {quat4} startColor
     * @param {vec3} endPosition
     * @param {quat4} endColor
     * @param {vec3} center
     * @param {Number} lineWidth
     * @returns {Number} line index
     */
    EveCurveLineSet.prototype.AddSpheredLineSph = function(startPosition, startColor, endPosition, endColor, center, lineWidth)
    {
        var phi1 = startPosition[0];
        var theta1 = startPosition[1];
        var radius1 = startPosition[2];
        var phi2 = endPosition[0];
        var theta2 = endPosition[1];
        var radius2 = endPosition[2];
        // is given in spherical coords, so convert them into cartesian
        var startPnt = [radius1 * Math.sin(phi1) * Math.sin(theta1), radius1 * Math.cos(theta1), radius1 * Math.cos(phi1) * Math.sin(theta1)];
        var endPnt = [radius2 * Math.sin(phi2) * Math.sin(theta2), radius2 * Math.cos(theta2), radius2 * Math.cos(phi2) * Math.sin(theta2)];
        // dont forget center!
        vec3.add(startPnt, center);
        vec3.add(endPnt, center);
        // add it
        return this.AddSpheredLineCrt(startPnt, startColor, endPnt, endColor, center, lineWidth);
    };

    /**
     * Changes a line's colors
     * @param {Number} lineID
     * @param {quat4} startColor
     * @param {quat4} endColor
     */
    EveCurveLineSet.prototype.ChangeLineColor = function(lineID, startColor, endColor)
    {
        this.lines[lineID].color1 = startColor;
        this.lines[lineID].color2 = endColor;
    };

    /**
     * Changes a line's width
     * @param {Number} lineID
     * @param {Number} width
     */
    EveCurveLineSet.prototype.ChangeLineWidth = function(lineID, width)
    {
        this.lines[lineID].width = width;
    };

    /**
     * Changes a lines start and end positions using Cartesian co-ordinates
     * @param {Number} lineID
     * @param {vec3} startPosition
     * @param {vec3} endPosition
     */
    EveCurveLineSet.prototype.ChangeLinePositionCrt = function(lineID, startPosition, endPosition)
    {
        this.lines[lineID].position1 = startPosition;
        this.lines[lineID].position2 = endPosition;
    };

    /**
     * Changes a lines start, end and center positions using Spherical co-orindates
     * @param {Number} lineID
     * @param {vec3} startPosition
     * @param {vec3} endPosition
     * @param {vec3} center
     */
    EveCurveLineSet.prototype.ChangeLinePositionSph = function(lineID, startPosition, endPosition, center)
    {
        var phi1 = startPosition[0];
        var theta1 = startPosition[1];
        var radius1 = startPosition[2];
        var phi2 = endPosition[0];
        var theta2 = endPosition[1];
        var radius2 = endPosition[2];
        // is given in spherical coords, so convert them into cartesian
        var startPnt = [radius1 * Math.sin(phi1) * Math.sin(theta1), radius1 * Math.cos(theta1), radius1 * Math.cos(phi1) * Math.sin(theta1)];
        var endPnt = [radius2 * Math.sin(phi2) * Math.sin(theta2), radius2 * Math.cos(theta2), radius2 * Math.cos(phi2) * Math.sin(theta2)];
        // dont forget center!
        vec3.add(startPnt, center);
        vec3.add(endPnt, center);
        this.ChangeLinePositionCrt(lineID, startPnt, endPnt);
    };

    /**
     * Changes a line's intermediate position
     * @param {Number} lineID
     * @param {vec3} intermediatePosition
     */
    EveCurveLineSet.prototype.ChangeLineIntermediateCrt = function(lineID, intermediatePosition)
    {
        this.lines[lineID].intermediatePosition = intermediatePosition;
    };

    /**
     * Changes a line's intermediate and middle positions
     * @param {Number} lineID
     * @param {vec3} intermediatePosition
     * @param {vec3} middle
     */
    EveCurveLineSet.prototype.ChangeLineIntermediateSph = function(lineID, intermediatePosition, middle)
    {
        var phiM = middle[0];
        var thetaM = middle[1];
        var radiusM = middle[2];
        var middlePnt = [radiusM * Math.sin(phiM) * Math.sin(thetaM), radiusM * Math.cos(thetaM), radiusM * Math.cos(phiM) * Math.sin(thetaM)];
        vec3.add(middlePnt, middle);
        this.lines[lineID].intermediatePosition = intermediatePosition;
    };

    /**
     * Changes line multi color parameters
     * @param {Number} lineID
     * @param {quat4} color
     * @param {Number} border
     */
    EveCurveLineSet.prototype.ChangeLineMultiColor = function(lineID, color, border)
    {
        this.lines[lineID].multiColor = color;
        this.lines[lineID].multiColorBorder = border;
    };

    /**
     * Changes a line's animation parameters
     * @param {Number} lineID
     * @param {quat4} color
     * @param {Number} speed
     * @param {Number} scale
     */
    EveCurveLineSet.prototype.ChangeLineAnimation = function(lineID, color, speed, scale)
    {
        this.lines[lineID].overlayColor = color;
        this.lines[lineID].animationSpeed = speed;
        this.lines[lineID].animationScale = scale;
    };

    /**
     * Changes a line's segmentation
     * @param {Number} lineID
     * @param {Number} numOfSegments
     */
    EveCurveLineSet.prototype.ChangeLineSegmentation = function(lineID, numOfSegments)
    {
        if (this.lines[lineID].type != EveCurveLineSet.LINETYPE_STRAIGHT)
        {
            this.lines[lineID].numOfSegments = numOfSegments;
        }
    };

    /**
     * Removes a line
     * @param {Number} lineID
     */
    EveCurveLineSet.prototype.RemoveLine = function(lineID)
    {
        this.emptyLineID.push(lineID);
        this.lines[lineID].type = EveCurveLineSet.LINETYPE_INVALID;
    };

    /**
     * Clears all lines
     */
    EveCurveLineSet.prototype.ClearLines = function()
    {
        this.lines = [];
        this.emptyLineID = [];
    };

    /**
     * Gets line count
     * @returns {Number}
     * @private
     */
    EveCurveLineSet.prototype._lineCount = function()
    {
        var count = 0;
        for (var i = 0; i < this.lines.length; ++i)
        {
            if (this.lines[i].type != EveCurveLineSet.LINETYPE_INVALID)
            {
                count += this.lines[i].numOfSegments;
            }
        }
        return count;
    };

    /**
     * Fills color vertices
     * @param lineData
     * @param buffer
     * @param offset
     * @returns {*}
     * @private
     */
    EveCurveLineSet.prototype._fillColorVertices = function(lineData, buffer, offset)
    {
        buffer[offset++] = lineData.multiColor[0];
        buffer[offset++] = lineData.multiColor[1];
        buffer[offset++] = lineData.multiColor[2];
        buffer[offset++] = lineData.multiColor[3];
        buffer[offset++] = lineData.overlayColor[0];
        buffer[offset++] = lineData.overlayColor[1];
        buffer[offset++] = lineData.overlayColor[2];
        buffer[offset++] = lineData.overlayColor[3];
        return offset;
    };

    /**
     * Writes line vertices to the vertex buffer
     * @param {EveCurveLineSet} self
     * @param {vec3} position1
     * @param {quat4} color1
     * @param length1
     * @param {vec3} position2
     * @param {quat4} color2
     * @param length2
     * @param {Number} lineID
     * @param buffer
     * @param {Number} offset
     * @private
     */
    EveCurveLineSet.prototype._writeLineVerticesToBuffer = function(self, position1, color1, length1, position2, color2, length2, lineID, buffer, offset)
    {
        var lineData = this.lines[lineID];

        buffer[offset++] = position1[0];
        buffer[offset++] = position1[1];
        buffer[offset++] = position1[2];
        buffer[offset++] = position2[0] - position1[0];
        buffer[offset++] = position2[1] - position1[1];
        buffer[offset++] = position2[2] - position1[2];
        buffer[offset++] = -self.lineWidthFactor * lineData.width;
        buffer[offset++] = 0;
        buffer[offset++] = length1;
        buffer[offset++] = lineData.multiColorBorder;
        buffer[offset++] = length2 - length1;
        buffer[offset++] = lineData.animationSpeed;
        buffer[offset++] = lineData.animationScale;
        buffer[offset++] = lineID;
        buffer[offset++] = color1[0];
        buffer[offset++] = color1[1];
        buffer[offset++] = color1[2];
        buffer[offset++] = color1[3];
        offset = this._fillColorVertices(lineData, buffer, offset);

        buffer[offset++] = position1[0];
        buffer[offset++] = position1[1];
        buffer[offset++] = position1[2];
        buffer[offset++] = position2[0] - position1[0];
        buffer[offset++] = position2[1] - position1[1];
        buffer[offset++] = position2[2] - position1[2];
        buffer[offset++] = self.lineWidthFactor * lineData.width;
        buffer[offset++] = 0;
        buffer[offset++] = length1;
        buffer[offset++] = lineData.multiColorBorder;
        buffer[offset++] = length2 - length1;
        buffer[offset++] = lineData.animationSpeed;
        buffer[offset++] = lineData.animationScale;
        buffer[offset++] = lineID;
        buffer[offset++] = color1[0];
        buffer[offset++] = color1[1];
        buffer[offset++] = color1[2];
        buffer[offset++] = color1[3];
        offset = this._fillColorVertices(lineData, buffer, offset);

        buffer[offset++] = position2[0];
        buffer[offset++] = position2[1];
        buffer[offset++] = position2[2];
        buffer[offset++] = position1[0] - position2[0];
        buffer[offset++] = position1[1] - position2[1];
        buffer[offset++] = position1[2] - position2[2];
        buffer[offset++] = -self.lineWidthFactor * lineData.width;
        buffer[offset++] = 1;
        buffer[offset++] = length2;
        buffer[offset++] = lineData.multiColorBorder;
        buffer[offset++] = length2 - length1;
        buffer[offset++] = lineData.animationSpeed;
        buffer[offset++] = lineData.animationScale;
        buffer[offset++] = lineID;
        buffer[offset++] = color2[0];
        buffer[offset++] = color2[1];
        buffer[offset++] = color2[2];
        buffer[offset++] = color2[3];
        offset = this._fillColorVertices(lineData, buffer, offset);

        buffer[offset++] = position1[0];
        buffer[offset++] = position1[1];
        buffer[offset++] = position1[2];
        buffer[offset++] = position2[0] - position1[0];
        buffer[offset++] = position2[1] - position1[1];
        buffer[offset++] = position2[2] - position1[2];
        buffer[offset++] = self.lineWidthFactor * lineData.width;
        buffer[offset++] = 0;
        buffer[offset++] = length1;
        buffer[offset++] = lineData.multiColorBorder;
        buffer[offset++] = length2 - length1;
        buffer[offset++] = lineData.animationSpeed;
        buffer[offset++] = lineData.animationScale;
        buffer[offset++] = lineID;
        buffer[offset++] = color1[0];
        buffer[offset++] = color1[1];
        buffer[offset++] = color1[2];
        buffer[offset++] = color1[3];
        offset = this._fillColorVertices(lineData, buffer, offset);

        buffer[offset++] = position2[0];
        buffer[offset++] = position2[1];
        buffer[offset++] = position2[2];
        buffer[offset++] = position1[0] - position2[0];
        buffer[offset++] = position1[1] - position2[1];
        buffer[offset++] = position1[2] - position2[2];
        buffer[offset++] = self.lineWidthFactor * lineData.width;
        buffer[offset++] = 1;
        buffer[offset++] = length2;
        buffer[offset++] = lineData.multiColorBorder;
        buffer[offset++] = length2 - length1;
        buffer[offset++] = lineData.animationSpeed;
        buffer[offset++] = lineData.animationScale;
        buffer[offset++] = lineID;
        buffer[offset++] = color2[0];
        buffer[offset++] = color2[1];
        buffer[offset++] = color2[2];
        buffer[offset++] = color2[3];
        offset = this._fillColorVertices(lineData, buffer, offset);

        buffer[offset++] = position2[0];
        buffer[offset++] = position2[1];
        buffer[offset++] = position2[2];
        buffer[offset++] = position1[0] - position2[0];
        buffer[offset++] = position1[1] - position2[1];
        buffer[offset++] = position1[2] - position2[2];
        buffer[offset++] = -self.lineWidthFactor * lineData.width;
        buffer[offset++] = 1;
        buffer[offset++] = length2;
        buffer[offset++] = lineData.multiColorBorder;
        buffer[offset++] = length2 - length1;
        buffer[offset++] = lineData.animationSpeed;
        buffer[offset++] = lineData.animationScale;
        buffer[offset++] = lineID;
        buffer[offset++] = color2[0];
        buffer[offset++] = color2[1];
        buffer[offset++] = color2[2];
        buffer[offset++] = color2[3];
        offset = this._fillColorVertices(lineData, buffer, offset);
    };

    /**
     * Updates line changes
     */
    EveCurveLineSet.prototype.SubmitChanges = function()
    {
        this._vertexBuffer = null;
        if (!this.lines.length)
        {
            return;
        }

        this._vertexBufferSize = this._lineCount();
        var data = new Float32Array(this._vertexBufferSize * 6 * this._vertexSize);
        var offset = 0;

        var startDir = vec3.create();
        var endDir = vec3.create();
        var startDirNrm = vec3.create();
        var endDirNrm = vec3.create();
        var rotationAxis = vec3.create();
        var rotationMatrix = mat4.create();
        var dir1 = vec3.create();
        var dir2 = vec3.create();
        var col1 = quat4.create();
        var col2 = quat4.create();
        var pt1 = vec3.create();
        var pt2 = vec3.create();
        var j, tmp, segmentFactor;

        for (var i = 0; i < this.lines.length; ++i)
        {
            switch (this.lines[i].type)
            {
                case EveCurveLineSet.LINETYPE_INVALID:
                    break;

                case EveCurveLineSet.LINETYPE_STRAIGHT:
                    this._writeLineVerticesToBuffer(this, this.lines[i].position1, this.lines[i].color1, 0, this.lines[i].position2, this.lines[i].color2, 1, i, data, offset);
                    offset += 6 * this._vertexSize;
                    break;

                case EveCurveLineSet.LINETYPE_SPHERED:
                    vec3.subtract(this.lines[i].position1, this.lines[i].intermediatePosition, startDir);
                    vec3.subtract(this.lines[i].position2, this.lines[i].intermediatePosition, endDir);
                    vec3.normalize(startDir, startDirNrm);
                    vec3.normalize(endDir, endDirNrm);

                    vec3.cross(startDir, endDir, rotationAxis);
                    var fullAngle = Math.acos(vec3.dot(startDirNrm, endDirNrm));
                    var segmentAngle = fullAngle / this.lines[i].numOfSegments;
                    mat4.rotate(mat4.identity(rotationMatrix), segmentAngle, rotationAxis);

                    vec3.set(startDir, dir1);
                    quat4.set(this.lines[i].color1, col1);

                    for (j = 0; j < this.lines[i].numOfSegments; ++j)
                    {
                        segmentFactor = (j + 1) / this.lines[i].numOfSegments;
                        mat4.multiplyVec3(rotationMatrix, dir1, dir2);
                        col2[0] = this.lines[i].color1[0] * (1 - segmentFactor) + this.lines[i].color2[0] * segmentFactor;
                        col2[1] = this.lines[i].color1[1] * (1 - segmentFactor) + this.lines[i].color2[1] * segmentFactor;
                        col2[2] = this.lines[i].color1[2] * (1 - segmentFactor) + this.lines[i].color2[2] * segmentFactor;
                        col2[3] = this.lines[i].color1[3] * (1 - segmentFactor) + this.lines[i].color2[3] * segmentFactor;
                        vec3.add(dir1, this.lines[i].intermediatePosition, pt1);
                        vec3.add(dir2, this.lines[i].intermediatePosition, pt2);

                        this._writeLineVerticesToBuffer(this, pt1, col1, j / this.lines[i].numOfSegments, pt2, col2, segmentFactor, i, data, offset);
                        offset += 6 * this._vertexSize;

                        tmp = dir1;
                        dir1 = dir2;
                        dir2 = tmp;
                        tmp = col1;
                        col1 = col2;
                        col2 = tmp;
                    }
                    break;

                case EveCurveLineSet.LINETYPE_CURVED:
                    var tangent1 = vec3.create();
                    var tangent2 = vec3.create();
                    var pos1 = vec3.create();
                    var pos2 = vec3.create();

                    vec3.subtract(this.lines[i].intermediatePosition, this.lines[i].position1, tangent1);
                    vec3.subtract(this.lines[i].position2, this.lines[i].intermediatePosition, tangent2);

                    vec3.set(this.lines[i].position1, pos1);
                    vec3.set(this.lines[i].color1, col1);
                    for (j = 0; j < this.lines[i].numOfSegments; ++j)
                    {
                        segmentFactor = (j + 1) / this.lines[i].numOfSegments;
                        vec3Hermite(pos2, this.lines[i].position1, tangent1, this.lines[i].position2, tangent2, segmentFactor);
                        col2[0] = this.lines[i].color1[0] * (1 - segmentFactor) + this.lines[i].color2[0] * segmentFactor;
                        col2[1] = this.lines[i].color1[1] * (1 - segmentFactor) + this.lines[i].color2[1] * segmentFactor;
                        col2[2] = this.lines[i].color1[2] * (1 - segmentFactor) + this.lines[i].color2[2] * segmentFactor;
                        col2[3] = this.lines[i].color1[3] * (1 - segmentFactor) + this.lines[i].color2[3] * segmentFactor;
                        this._writeLineVerticesToBuffer(this, pos1, col1, j / this.lines[i].numOfSegments, pos2, col2, segmentFactor, i, data, offset);
                        offset += 6 * this._vertexSize;

                        tmp = pos1;
                        pos1 = pos2;
                        pos2 = tmp;
                        tmp = col1;
                        col1 = col2;
                        col2 = tmp;
                    }
            }
        }

        if (this._vertexBuffer)
        {
            device.gl.deleteBuffer(this._vertexBuffer);
        }

        this._vertexBuffer = device.gl.createBuffer();
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._vertexBuffer);
        device.gl.bufferData(device.gl.ARRAY_BUFFER, data, device.gl.STATIC_DRAW);
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, null);
    };

    EveCurveLineSet.LINETYPE_INVALID = 0;
    EveCurveLineSet.LINETYPE_STRAIGHT = 1;
    EveCurveLineSet.LINETYPE_SPHERED = 2;
    EveCurveLineSet.LINETYPE_CURVED = 3;

    /**
     * Accumulates render batches
     * @param {RenderMode} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    EveCurveLineSet.prototype.GetBatches = function(mode, accumulator)
    {
        if (!this.display || !this._vertexBuffer)
        {
            return;
        }

        switch (mode)
        {
            case device.RM_TRANSPARENT:
                if (!this.lineEffect || this.additive) return;
                break;

            case device.RM_ADDITIVE:
                if (!this.lineEffect || !this.additive) return;
                break;

            case device.RM_PICKABLE:
                if (!this.pickEffect || !this.pickable) return;
                break;

            default:
                return;
        }

        var batch = new Tw2ForwardingRenderBatch();
        mat4.transpose(this.transform, this.perObjectData.perObjectVSData.Get('WorldMat'));
        mat4.transpose(this.transform, this.perObjectData.perObjectPSData.Get('WorldMat'));
        batch.perObjectData = this.perObjectData;
        batch.geometryProvider = this;
        batch.renderMode = mode;
        accumulator.Commit(batch);

    };

    /**
     * Unloads the curve line set vertex buffer
     */
    EveCurveLineSet.prototype.Unload = function()
    {
        if (this._vertexBuffer)
        {
            device.gl.deleteBuffer(this._vertexBuffer);
            this._vertexBuffer = null;
        }
    };

    /**
     * Renders lines
     * @param {RenderBatch} batch
     * @param {Tw2Effect} [overrideEffect]
     * @returns {Boolean}
     */
    EveCurveLineSet.prototype.Render = function(batch, overrideEffect)
    {
        var effect = overrideEffect || (batch.renderMode === device.RM_PICKABLE) ? this.pickEffect : this.lineEffect;
        var effectRes = effect.GetEffectRes();
        if (!effectRes._isGood)
        {
            return false;
        }

        var d = device;
        d.gl.bindBuffer(d.gl.ARRAY_BUFFER, this._vertexBuffer);

        if (this.disableDepth) device.gl.disable(device.gl.DEPTH_TEST);

        var passCount = effect.GetPassCount();
        for (var pass = 0; pass < passCount; ++pass)
        {
            effect.ApplyPass(pass);
            var passInput = effect.GetPassInput(pass);
            if (!this.declaration.SetDeclaration(passInput, this.declaration.stride))
            {
                return false;
            }
            d.ApplyShadowState();
            d.gl.drawArrays(d.gl.TRIANGLES, 0, this._vertexBufferSize * 6);
        }

        if (this.disableDepth) device.gl.enable(device.gl.DEPTH_TEST);
        return true;
    };

    /**
     * Per frame update
     */
    EveCurveLineSet.prototype.Update = function() {};

    /**
     * Per frame view dependent data update
     * @param {mat4} parentTransform
     */
    EveCurveLineSet.prototype.UpdateViewDependentData = function(parentTransform)
    {
        mat4.identity(this.transform);
        mat4.translate(this.transform, this.translation);
        var rotationTransform = mat4.transpose(quat4.toMat4(this.rotation, mat4.create()));
        mat4.multiply(this.transform, rotationTransform, this.transform);
        mat4.scale(this.transform, this.scaling);
        mat4.multiply(this.transform, parentTransform);
    };

    /**
     * Gets curve line set res objects
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2EffectRes|Tw2TextureRes>} [out]
     */
    EveCurveLineSet.prototype.GetResources = function(out)
    {
        if (out === undefined)
        {
            out = [];
        }

        this.lineEffect.GetResources(out);

        if (this.pickEffect !== null)
        {
            this.pickEffect.GetResources(out);
        }

        return out;
    };

    /**
     * Constructor for Overlay Effects
     * @property {boolean} display
     * @property {boolean} update
     * @property {Tw2CurveSet} curveSet
     * @property {string} name
     * @property {Array.<Tw2Effect>} opaqueEffects
     * @property {Array.<Tw2Effect>} decalEffects
     * @property {Array.<Tw2Effect>} transparentEffects
     * @property {Array.<Tw2Effect>} additiveEffects
     * @property {Array.<Tw2Effect>} distortionEffects - Currently doesn't work in ccpwgl
     * @constructor
     */
    function EveMeshOverlayEffect()
    {
        this.display = true;
        this.update = true;
        this.curveSet = null;
        this.name = '';
        this.opaqueEffects = [];
        this.decalEffects = [];
        this.transparentEffects = [];
        this.additiveEffects = [];
        this.distortionEffects = [];
    }

    /**
     * Per frame update
     * @param {number} dt - delta Time
     */
    EveMeshOverlayEffect.prototype.Update = function(dt)
    {
        if (this.update && this.curveSet)
        {
            this.curveSet.Update(dt);
        }
    };

    /**
     * Gets effects
     * @param {RenderMode} mode
     * @returns {Array.<Tw2Effect>}
     */
    EveMeshOverlayEffect.prototype.GetEffects = function(mode)
    {
        if (this.display)
        {
            switch (mode)
            {
                case device.RM_OPAQUE:
                    return this.opaqueEffects;
                case device.RM_DECAL:
                    return this.decalEffects;
                case device.RM_TRANSPARENT:
                    return this.transparentEffects;
                case device.RM_ADDITIVE:
                    return this.additiveEffects;
                default:
                    return null;
            }
        }
    };

    /**
     * Gets Mesh Overlay resource objects
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2EffectRes|Tw2TextureRes|Tw2GeometryRes>} [out]
     */
    EveMeshOverlayEffect.prototype.GetResources = function(out)
    {
        if (out === undefined)
        {
            out = [];
        }

        var self = this;

        function getEffectResources(effectName, out)
        {
            for (var i = 0; i < self[effectName].length; i++)
            {
                self[effectName].GetResources(out);
            }
        }

        getEffectResources('opaqueEffects', out);
        getEffectResources('decalEffects', out);
        getEffectResources('transparentEffects', out);
        getEffectResources('additiveEffects', out);
        getEffectResources('distortionEffects', out);

        return out;
    }

    /**
     * Mesh attachment to space object
     * @property {string} name
     * @property {boolean} display
     * @property {boolean} useSpaceObjectData
     * @property {Number} lowestLodVisible
     * @property {quat4} rotation
     * @property {vec3} translation
     * @property {vec3} scaling
     * @property {boolean} useSRT
     * @property {boolean} staticTransform
     * @property {mat4} localTransform
     * @property {mat4} worldTransform
     * @property {mat4} worldTransformLast
     * @property {Tw2Mesh} mesh
     * @property {boolean} isEffectChild
     * @property {Tw2PerObjectData} _perObjectData
     * @constructor
     */
    function EveChildMesh()
    {
        this.name = '';
        this.display = true;
        this.useSpaceObjectData = true;
        this.lowestLodVisible = 2;
        this.rotation = quat4.create([0, 0, 0, 1]);
        this.translation = vec3.create();
        this.scaling = vec3.create([1, 1, 1]);
        this.useSRT = true;
        this.staticTransform = false;
        this.localTransform = mat4.create();
        this.worldTransform = mat4.create();
        this.worldTransformLast = mat4.create();
        this.mesh = null;

        this.isEffectChild = true;

        this._perObjectData = null;
    }

    /**
     * Updates mesh transform
     * @param {mat4} parentTransform
     */
    EveChildMesh.prototype.Update = function(parentTransform)
    {
        if (this.useSRT)
        {
            var temp = this.worldTransformLast;
            mat4.identity(this.localTransform);
            mat4.translate(this.localTransform, this.translation);
            mat4.transpose(quat4.toMat4(quat4.normalize(this.rotation), temp));
            mat4.multiply(this.localTransform, temp, this.localTransform);
            mat4.scale(this.localTransform, this.scaling);
        }
        mat4.set(this.worldTransform, this.worldTransformLast);
        mat4.multiply(this.localTransform, parentTransform, this.worldTransform)
    };


    /**
     * Gets render batches
     * @param {RenderMode} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     */
    EveChildMesh.prototype.GetBatches = function(mode, accumulator, perObjectData)
    {
        if (!this.display || !this.mesh)
        {
            return;
        }
        if (this.useSpaceObjectData)
        {
            if (!this._perObjectData)
            {
                this._perObjectData = new Tw2PerObjectData();
                this._perObjectData.perObjectVSData = new Tw2RawData();
                this._perObjectData.perObjectVSData.data = new Float32Array(perObjectData.perObjectVSData.data.length);

                this._perObjectData.perObjectVSData.data[33] = 1;
                this._perObjectData.perObjectVSData.data[35] = 1;

                this._perObjectData.perObjectPSData = new Tw2RawData();
                this._perObjectData.perObjectPSData.data = new Float32Array(perObjectData.perObjectPSData.data.length);

                this._perObjectData.perObjectPSData.data[1] = 1;
                this._perObjectData.perObjectPSData.data[3] = 1;
            }
            this._perObjectData.perObjectVSData.data.set(perObjectData.perObjectVSData.data);
            this._perObjectData.perObjectPSData.data.set(perObjectData.perObjectPSData.data);

            mat4.transpose(this.worldTransform, this._perObjectData.perObjectVSData.data);
            mat4.transpose(this.worldTransformLast, this._perObjectData.perObjectVSData.data.subarray(16));
        }
        else
        {
            if (!this._perObjectData)
            {
                this._perObjectData = new Tw2PerObjectData();
                this._perObjectData.perObjectVSData = new Tw2RawData();
                this._perObjectData.perObjectVSData.Declare('world', 16);
                this._perObjectData.perObjectVSData.Declare('worldInverseTranspose', 16);
            }
            mat4.transpose(this.worldTransform, this._perObjectData.perObjectVSData.Get('world'));
            mat4.inverse(this.worldTransform, this._perObjectData.perObjectVSData.Get('worldInverseTranspose'));
        }

        this.mesh.GetBatches(mode, accumulator, this._perObjectData);

    };



    /**
     * Gets child mesh res objects
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2EffectRes|Tw2TextureRes|Tw2GeometryRes>} [out]
     */
    EveChildMesh.prototype.GetResources = function(out)
    {
        if (out === undefined)
        {
            out = [];
        }

        if (this.mesh !== null)
        {
            this.mesh.GetResources(out);
        }

        return out;
    }

    /**
     * "Complex" explosion object. Not implemented.
     * @property {boolean} isEffectChild
     * @constructor
     */
    function EveChildExplosion()
    {
        // will be implemented soon(tm)
        this.isEffectChild = true;
    }

    /**
     * Updates explosion transform
     * @param {mat4} parentTransform
     */
    EveChildExplosion.prototype.Update = function(parentTransform) {};

    /**
     * Gets render batches
     * @param {RenderMode} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     */
    EveChildExplosion.prototype.GetBatches = function(mode, accumulator, perObjectData) {};

    /**
     * EveMissile
     * @property {String} name
     * @property {Boolean} display
     * @property {Array} warheads
     * @property {Array} curveSets
     * @property {vec3} boundingSphereCenter
     * @property {Number} boundingSphereRadius
     * @property {vec3} position
     * @property {vec3} target
     * @property {Number} speed
     * @property {!function(EveMissileWarhead): void} warheadExplosionCallback
     * @property {!function(EveMissile): void} missileFinishedCallback
     * @constructor
     */
    function EveMissile()
    {
        this.name = '';
        this.display = true;
        this.warheads = [];
        this.curveSets = [];
        this.boundingSphereCenter = vec3.create();
        this.boundingSphereRadius = 0;

        this.position = vec3.create();
        this.target = vec3.create();
        this.speed = 1;

        this.warheadExplosionCallback = null;
        this.missileFinishedCallback = null;
    }

    /**
     * Gets missile res objects
     * @param {Array} out - Receiving array
     */
    EveMissile.prototype.GetResources = function(out)
    {
        for (var i = 0; i < this.warheads.length; ++i)
        {
            this.warheads[i].GetResources(out);
        }
    };

    /**
     * Per frame view dependent data update
     */
    EveMissile.prototype.UpdateViewDependentData = function()
    {
        for (var i = 0; i < this.warheads.length; ++i)
        {
            this.warheads[i].UpdateViewDependentData(this.transform);
        }
    };

    /**
     * Accumulates render batches
     * @param {RenderMode} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    EveMissile.prototype.GetBatches = function(mode, accumulator)
    {
        if (this.display)
        {
            for (var i = 0; i < this.warheads.length; ++i)
            {
                this.warheads[i].GetBatches(mode, accumulator);
            }
        }
    };

    /**
     * Per frame update
     * @param {Number} dt - Time since previous frame
     */
    EveMissile.prototype.Update = function(dt)
    {
        var tmp = vec3.create();
        var distance = vec3.length(vec3.subtract(this.target, this.position, tmp));
        if (distance > 0.1)
        {
            vec3.normalize(tmp);
            vec3.scale(tmp, Math.min(dt * this.speed, distance));
            vec3.add(this.position, tmp);
        }
        for (var i = 0; i < this.curveSets.length; ++i)
        {
            this.curveSets[i].Update(dt);
        }
        var checkDead = false;
        for (i = 0; i < this.warheads.length; ++i)
        {
            var state = this.warheads[i].state;
            this.warheads[i].Update(dt, this.position, this.target);
            if (state != EveMissileWarhead.STATE_DEAD && this.warheads[i].state == EveMissileWarhead.STATE_DEAD)
            {
                if (this.warheadExplosionCallback)
                {
                    this.warheadExplosionCallback(this.warheads[i]);
                }
                checkDead = true;
            }
        }
        if (checkDead && this.missileFinishedCallback)
        {
            for (i = 0; i < this.warheads.length; ++i)
            {
                if (this.warheads[i].state != EveMissileWarhead.STATE_DEAD)
                {
                    return;
                }
            }
            this.missileFinishedCallback(this);
        }
    };

    /**
     * Prepares missile for rendering
     * @param {vec3} position - Missile starting position
     * @param {Array} turretTransforms - Turret muzzle local to world transforms
     * @param {vec3} target - Target position
     */
    EveMissile.prototype.Launch = function(position, turretTransforms, target)
    {
        vec3.set(position, this.position);
        vec3.set(target, this.target);
        if (this.warheads.length > turretTransforms.length)
        {
            this.warheads.splice(turretTransforms.length);
        }
        else
        {
            while (this.warheads.length < turretTransforms.length)
            {
                this.warheads.push(this.warheads[0].Copy());
            }
        }
        for (var i = 0; i < this.warheads.length; ++i)
        {
            this.warheads[0].Launch(turretTransforms[i]);
        }
    };

    /**
     * EveMissileWarhead
     * @property {String} name
     * @property {Boolean} display
     * @property {vec3} pathOffset
     * @property {Number} durationEjectPhase
     * @property {Number} startEjectVelocity
     * @property {Number} acceleration
     * @property {Number} maxExplosionDistance
     * @property {Number} impactSize
     * @property {Number} impactDuration
     * @property {EveSpriteSet} spriteSet
     * @property {Tw2Mesh} mesh
     * @property {Number} state
     * @property {mat4} transform
     * @property {vec3} velocity
     * @property {Number} time
     * @property {Tw2PerObjectData} _perObjectData
     * @constructor
     */
    function EveMissileWarhead()
    {
        this.name = '';
        this.display = true;
        this.pathOffset = vec3.create();
        this.durationEjectPhase = 0;
        this.startEjectVelocity = 0;
        this.acceleration = 1;
        this.maxExplosionDistance = 40;
        this.impactSize = 0;
        this.impactDuration = 0.6;
        this.spriteSet = null;
        this.mesh = null;
        this.state = EveMissileWarhead.STATE_READY;

        this.transform = mat4.identity(mat4.create());
        this.velocity = vec3.create();
        this.time = 0;

        this._perObjectData = new Tw2PerObjectData();
        this._perObjectData.perObjectVSData = new Tw2RawData();
        this._perObjectData.perObjectVSData.Declare('WorldMat', 16);
        this._perObjectData.perObjectVSData.Declare('WorldMatLast', 16);
        this._perObjectData.perObjectVSData.Declare('Shipdata', 4);
        this._perObjectData.perObjectVSData.Declare('Clipdata1', 4);
        this._perObjectData.perObjectVSData.Create();

        this._perObjectData.perObjectPSData = new Tw2RawData();
        this._perObjectData.perObjectPSData.Declare('Shipdata', 4);
        this._perObjectData.perObjectPSData.Declare('Clipdata1', 4);
        this._perObjectData.perObjectPSData.Declare('Clipdata2', 4);
        this._perObjectData.perObjectPSData.Create();

        this._perObjectData.perObjectVSData.Get('Shipdata')[1] = 1;
        this._perObjectData.perObjectPSData.Get('Shipdata')[1] = 1;
        this._perObjectData.perObjectVSData.Get('Shipdata')[3] = -10;
        this._perObjectData.perObjectPSData.Get('Shipdata')[3] = 1;
    }

    EveMissileWarhead.STATE_READY = 0;
    EveMissileWarhead.STATE_IN_FLIGHT = 1;
    EveMissileWarhead.STATE_DEAD = 2;

    /**
     * Initializes the warhead
     */
    EveMissileWarhead.prototype.Initialize = function()
    {
        if (this.spriteSet)
        {
            this.spriteSet.UseQuads(true);
        }
    };

    /**
     * Gets warhead res objects
     * @param {Array} out - Receiving array
     */
    EveMissileWarhead.prototype.GetResources = function(out)
    {
        if (this.mesh)
        {
            this.mesh.GetResources(out);
        }
        if (this.spriteSet)
        {
            this.spriteSet.GetResources(out);
        }
    };

    /**
     * Per frame view dependent data update
     */
    EveMissileWarhead.prototype.UpdateViewDependentData = function()
    {
        if (!this.display || this.state == EveMissileWarhead.STATE_DEAD)
        {
            return;
        }

        mat4.transpose(this.transform, this._perObjectData.perObjectVSData.Get('WorldMat'));
        mat4.transpose(this.transform, this._perObjectData.perObjectVSData.Get('WorldMatLast'));
    };

    /**
     * Accumulates render batches
     * @param {RenderMode} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    EveMissileWarhead.prototype.GetBatches = function(mode, accumulator)
    {
        if (this.display && this.mesh && this.state != EveMissileWarhead.STATE_DEAD)
        {
            if (this.mesh)
            {
                this.mesh.GetBatches(mode, accumulator, this._perObjectData);
            }
            if (this.spriteSet)
            {
                this.spriteSet.GetBatches(mode, accumulator, this._perObjectData, this.transform);
            }
        }
    };

    /**
     * Per frame update
     * @param {Number} dt - Time since previous frame
     * @param {vec3} missilePosition - Missile position
     * @param {vec3} missileTarget - Missile target position
     */
    EveMissileWarhead.prototype.Update = function(dt, missilePosition, missileTarget)
    {
        if (this.state == EveMissileWarhead.STATE_IN_FLIGHT)
        {
            var position = [this.transform[12], this.transform[13], this.transform[14]];

            var tmp = vec3.create();
            this.time += dt;
            if (this.time > this.durationEjectPhase)
            {
                vec3.subtract(missilePosition, position, this.velocity);
                vec3.lerp(position, missilePosition, 1 - Math.exp(-dt * 0.9999));
                this.transform[12] = position[0];
                this.transform[13] = position[1];
                this.transform[14] = position[2];

                if (vec3.length(vec3.subtract(missileTarget, position, tmp)) < this.maxExplosionDistance)
                {
                    console.log(position, tmp);
                    this.state = EveMissileWarhead.STATE_DEAD;
                }
            }
            else
            {
                vec3.scale(this.velocity, dt, tmp);
                this.transform[12] += tmp[0];
                this.transform[13] += tmp[1];
                this.transform[14] += tmp[2];
            }


            var x, y;
            var z = vec3.normalize(this.velocity, tmp);
            if (Math.abs(z[0]) < 0.99)
            {
                x = vec3.cross(z, [1, 0, 0], vec3.create());
            }
            else
            {
                x = vec3.cross(z, [0, 1, 0], vec3.create());
            }
            vec3.normalize(x);
            y = vec3.cross(x, z, vec3.create());
            this.transform[0] = x[0];
            this.transform[1] = x[1];
            this.transform[2] = x[2];
            this.transform[4] = y[0];
            this.transform[5] = y[1];
            this.transform[6] = y[2];
            this.transform[8] = z[0];
            this.transform[9] = z[1];
            this.transform[10] = z[2];
        }
        if (this.spriteSet)
        {
            this.spriteSet.Update(dt);
        }
    };

    /**
     * Creates a copy of the warhead
     * @returns {EveMissileWarhead} copy of this object
     */
    EveMissileWarhead.prototype.Copy = function()
    {
        var warhead = new EveMissileWarhead();
        warhead.mesh = this.mesh;
        warhead.spriteSet = this.spriteSet;
        return warhead;
    };

    /**
     * Sets up the warhead for rendering
     * @param {mat4} transform - Initial local to world transform
     */
    EveMissileWarhead.prototype.Launch = function(transform)
    {
        mat4.set(this.transform, transform);

        this.velocity[0] = transform[8] * this.startEjectVelocity;
        this.velocity[1] = transform[9] * this.startEjectVelocity;
        this.velocity[2] = transform[10] * this.startEjectVelocity;
        this.time = 0;
        this.state = EveMissileWarhead.STATE_IN_FLIGHT;
    };

    /**
     * Particle element type
     * @typedef {(Tw2ParticleElementDeclaration.LIFETIME|Tw2ParticleElementDeclaration.POSITION|Tw2ParticleElementDeclaration.VELOCITY|Tw2ParticleElementDeclaration.MASS|Tw2ParticleElementDeclaration.CUSTOM)} ParticleElementType
     */

    /**
     * Tw2ParticleElementDeclaration
     * @property {number} elementType=4
     * @property {string} customName
     * @property {number} dimension=1
     * @property {number} usageIndex
     * @property {boolean} usedByGPU
     * @constructor
     */
    function Tw2ParticleElementDeclaration()
    {
        this.elementType = 4;
        this.customName = '';
        this.dimension = 1;
        this.usageIndex = 0;
        this.usedByGPU = true;
    }

    /**
     * Tw2 Particle Element Lifetime
     * @type {number}
     */
    Tw2ParticleElementDeclaration.LIFETIME = 0;

    /**
     * Tw2 Particle Element Position
     * @type {number}
     */
    Tw2ParticleElementDeclaration.POSITION = 1;

    /**
     * Tw2 Particle Element Velocity
     * @type {number}
     */
    Tw2ParticleElementDeclaration.VELOCITY = 2;

    /**
     * Tw2 Particle Element Mass
     * @type {number}
     */
    Tw2ParticleElementDeclaration.MASS = 3;

    /**
     * Tw2 Particle Element Custom
     * @type {number}
     */
    Tw2ParticleElementDeclaration.CUSTOM = 4;

    /**
     * Gets the dimension of an element type
     * @returns {number}
     * @prototype
     */
    Tw2ParticleElementDeclaration.prototype.GetDimension = function()
    {
        switch (this.elementType)
        {
            case Tw2ParticleElementDeclaration.LIFETIME:
                return 2;
            case Tw2ParticleElementDeclaration.POSITION:
                return 3;
            case Tw2ParticleElementDeclaration.VELOCITY:
                return 3;
            case Tw2ParticleElementDeclaration.MASS:
                return 1;
        }
        return this.dimension;
    };

    /**
     * GetDeclaration
     * @returns {Tw2VertexElement}
     * @prototype
     */
    Tw2ParticleElementDeclaration.prototype.GetDeclaration = function()
    {
        var usage = Tw2VertexDeclaration.DECL_TEXCOORD;
        switch (this.elementType)
        {
            case Tw2ParticleElementDeclaration.LIFETIME:
                usage = Tw2VertexDeclaration.DECL_TANGENT;
                break;
            case Tw2ParticleElementDeclaration.POSITION:
                usage = Tw2VertexDeclaration.DECL_POSITION;
                break;
            case Tw2ParticleElementDeclaration.VELOCITY:
                usage = Tw2VertexDeclaration.DECL_NORMAL;
                break;
            case Tw2ParticleElementDeclaration.MASS:
                usage = Tw2VertexDeclaration.DECL_BINORMAL;
                break;
        }
        return new Tw2VertexElement(usage, this.usageIndex, device.gl.FLOAT, this.GetDimension());
    };


    /**
     * Tr2ParticleElement
     * @param {Tw2ParticleElementDeclaration} decl
     * @property {ParticleElementType} elementType
     * @property {string} customName
     * @property {number} dimension
     * @property {number} usageIndex
     * @property {boolean} usedByGPU
     * @property buffer
     * @property {number} startOffset
     * @property {number} offset
     * @property {number} instanceStride
     * @property {number} vertexStride
     * @property {boolean} dirty
     * @constructor
     */
    function Tr2ParticleElement(decl)
    {
        this.elementType = decl.elementType;
        this.customName = decl.customName;
        this.dimension = decl.GetDimension();
        this.usageIndex = decl.usageIndex;
        this.usedByGPU = decl.usedByGPU;
        this.buffer = null;
        this.startOffset = 0;
        this.offset = 0;
        this.instanceStride = 0;
        this.vertexStride = 0;
        this.dirty = false;
    }


    /**
     * Tw2ParticleSystem
     * @property {string} name
     * @property {number} aliveCount
     * @property {number} maxParticleCount
     * @property emitParticleOnDeathEmitter
     * @property emitParticleDuringLifeEmitter
     * @property {Array} elements
     * @property {boolean} isValid
     * @property {boolean} requiresSorting
     * @property {boolean} updateSimulation
     * @property {boolean} applyForce
     * @property {boolean} applyAging
     * @property {boolean} isGlobal
     * @property {Array} forces
     * @property {Array} constraints
     * @property {boolean} updateBoundingBox
     * @property {vec3} aabbMin
     * @property {vec3} aabbMax
     * @property {number} peakAliveCount
     * @property {boolean} bufferDirty
     * @property {WebGLBuffer} _vb
     * @property {Tw2VertexDeclaration} _declaration
     * @property {Array} _stdElements
     * @property {Array} _elements
     * @property {Array} instanceStride
     * @property {Array} vertexStride
     * @property {Array} buffers
     * @constructor
     */
    function Tw2ParticleSystem()
    {
        this.name = '';
        this.aliveCount = 0;
        this.maxParticleCount = 0;
        this.emitParticleOnDeathEmitter = null;
        this.emitParticleDuringLifeEmitter = null;
        this.elements = [];
        this.isValid = false;
        this.requiresSorting = false;
        this.updateSimulation = true;
        this.applyForce = true;
        this.applyAging = true;
        this.isGlobal = false;
        this.forces = [];
        this.constraints = [];
        this.updateBoundingBox = false;
        this.aabbMin = vec3.create();
        this.aabbMax = vec3.create();
        this.peakAliveCount = 0;

        this.bufferDirty = false;

        this._vb = null;
        this._declaration = null;

        this._stdElements = [null, null, null, null];
        this._elements = [];
        this.instanceStride = [null, null];
        this.vertexStride = [null, null];
        this.buffers = [null, null];
    }

    /**
     * Initializes the Particle System
     * @prototype
     */
    Tw2ParticleSystem.prototype.Initialize = function()
    {
        this.UpdateElementDeclaration();
    };

    /**
     * Updates Element Declarations
     * TODO: fix/remove commented out code
     * @prototype
     */
    Tw2ParticleSystem.prototype.UpdateElementDeclaration = function()
    {
        var bufferIndex, i;

        this.isValid = false;
        if (this._vb)
        {
            device.gl.deleteBuffer(this._vb);
            this._vb = null;
        }
        this._declaration = null;

        this.aliveCount = 0;

        if (this.elements.length == 0)
        {
            return;
        }

        this._stdElements = [null, null, null, null];
        this._elements = [];
        this.instanceStride = [0, 0];
        this.vertexStride = [0, 0];
        this._declaration = new Tw2VertexDeclaration();
        this.buffers = [null, null];

        for (i = 0; i < this.elements.length; ++i)
        {
            bufferIndex = this.elements[i].usedByGPU ? 0 : 1;
            var el = new Tr2ParticleElement(this.elements[i]);
            //el.buffer = this.buffers[bufferIndex];
            el.startOffset = this.vertexStride[bufferIndex];
            el.offset = el.startOffset;
            if (this.elements[i].elementType != Tw2ParticleElementDeclaration.CUSTOM)
            {
                this._stdElements[this.elements[i].elementType] = el;
            }
            this.vertexStride[bufferIndex] += el.dimension;
            this._elements.push(el);
            if (bufferIndex == 0)
            {
                var d = this.elements[i].GetDeclaration();
                d.offset = el.startOffset * 4;
                this._declaration.elements.push(d);
            }
        }

        this._declaration.RebuildHash();

        for (i = 0; i < this._elements.length; ++i)
        {
            bufferIndex = this._elements[i].usedByGPU ? 0 : 1;
            this._elements[i].vertexStride = this.vertexStride[bufferIndex];
        }
        this.instanceStride[0] = this.vertexStride[0] * 4;
        this.instanceStride[1] = this.vertexStride[1] * 4;
        for (i = 0; i < this._elements.length; ++i)
        {
            bufferIndex = this._elements[i].usedByGPU ? 0 : 1;
            this._elements[i].instanceStride = this.instanceStride[bufferIndex];
        }

        this.buffers = [null, null];
        if (this.instanceStride[0] && this.maxParticleCount)
        {
            this.buffers[0] = new Float32Array(this.instanceStride[0] * this.maxParticleCount);
            this._vb = device.gl.createBuffer();
            device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._vb);
            device.gl.bufferData(device.gl.ARRAY_BUFFER, this.buffers[0].length, device.gl.DYNAMIC_DRAW);
            device.gl.bindBuffer(device.gl.ARRAY_BUFFER, null);
        }
        if (this.instanceStride[1])
        {
            this.buffers[1] = new Float32Array(this.instanceStride[1] * this.maxParticleCount);
        }
        for (i = 0; i < this._elements.length; ++i)
        {
            bufferIndex = this._elements[i].usedByGPU ? 0 : 1;
            this._elements[i].buffer = this.buffers[bufferIndex];
        }
        if (this.requiresSorting)
        {
            this._sortedIndexes = new Array(this.maxParticleCount);
            this._sortedBuffer = new Float32Array(this.instanceStride[0] * this.maxParticleCount);
            this._distancesBuffer = new Float32Array(this.maxParticleCount);
        }
        this.isValid = true;
        this.bufferDirty = true;
    };

    /**
     * HasElement
     * @param {ParticleElementType} type
     * @returns {boolean}
     * @prototype
     */
    Tw2ParticleSystem.prototype.HasElement = function(type)
    {
        return this._stdElements[type] != null;
    };

    /**
     * GetElement
     * @param {ParticleElementType} type
     * @returns {*}
     * @prototype
     */
    Tw2ParticleSystem.prototype.GetElement = function(type)
    {
        if (this._stdElements[type])
        {
            this._stdElements[type].offset = this._stdElements[type].startOffset;
        }
        return this._stdElements[type];
    };

    /**
     * BeginSpawnParticle
     * @returns {null|number}
     * @prototype
     */
    Tw2ParticleSystem.prototype.BeginSpawnParticle = function()
    {
        if (!this.isValid || this.aliveCount >= this.maxParticleCount)
        {
            return null;
        }
        return this.aliveCount++;
    };

    /**
     * EndSpawnParticle
     * @prototype
     */
    Tw2ParticleSystem.prototype.EndSpawnParticle = function()
    {
        this.bufferDirty = true;
    };

    /**
     * Internal render/update function. It is called every frame.
     * @param {number} dt - delta time
     * @prototype
     */
    Tw2ParticleSystem.prototype.Update = function(dt)
    {
        var position, velocity, j, i;

        dt = Math.min(dt, 0.1);
        if (this.applyAging && this.HasElement(Tw2ParticleElementDeclaration.LIFETIME))
        {
            var lifetime = this.GetElement(Tw2ParticleElementDeclaration.LIFETIME);
            position = this.emitParticleOnDeathEmitter ? this.GetElement(Tw2ParticleElementDeclaration.POSITION) : null;
            velocity = this.emitParticleOnDeathEmitter ? this.GetElement(Tw2ParticleElementDeclaration.VELOCITY) : null;

            for (i = 0; i < this.aliveCount; ++i)
            {
                lifetime.buffer[lifetime.offset] += dt / lifetime.buffer[lifetime.offset + 1];
                if (lifetime.buffer[lifetime.offset] > 1)
                {
                    if (this.emitParticleOnDeathEmitter)
                    {
                        this.emitParticleOnDeathEmitter.SpawnParticles(position, velocity, 1);
                    }
                    this.aliveCount--;
                    if (i < this.aliveCount)
                    {
                        for (j = 0; j < 2; ++j)
                        {
                            if (this.buffers[j])
                            {
                                this.buffers[j].set(this.buffers[j].subarray(this.instanceStride[j] * this.aliveCount, this.instanceStride[j] * this.aliveCount + this.instanceStride[j]), i * this.instanceStride[j]);
                            }
                        }
                        --i;
                        this.bufferDirty = true;
                    }
                }
                else
                {
                    lifetime.offset += lifetime.instanceStride;
                    if (position)
                    {
                        position.offset += position.instanceStride;
                    }
                    if (velocity)
                    {
                        velocity.offset += velocity.instanceStride;
                    }
                }
            }
            lifetime.dirty = true;
        }
        var tmpVec3 = vec3.create();
        if (this.updateSimulation && this.HasElement(Tw2ParticleElementDeclaration.POSITION) && this.HasElement(Tw2ParticleElementDeclaration.VELOCITY))
        {
            var hasForces = this.applyForce && this.forces.length;
            for (i = 0; i < this.forces.length; ++i)
            {
                this.forces[i].Update(dt);
            }
            position = this.GetElement(Tw2ParticleElementDeclaration.POSITION);
            velocity = this.GetElement(Tw2ParticleElementDeclaration.VELOCITY);
            var mass = hasForces ? this.GetElement(Tw2ParticleElementDeclaration.MASS) : null;
            for (i = 0; i < this.aliveCount; ++i)
            {
                if (hasForces)
                {
                    var amass = 1;
                    if (mass)
                    {
                        amass = mass.buffer[mass.offset];
                    }
                    var force = tmpVec3;
                    force[0] = force[1] = force[2] = 0;
                    for (j = 0; j < this.forces.length; ++j)
                    {
                        this.forces[j].ApplyForce(position, velocity, force, dt, amass);
                    }
                    if (mass)
                    {
                        vec3.scale(force, 1. / mass.buffer[mass.offset]);
                    }
                    velocity.buffer[velocity.offset] += force[0] * dt;
                    velocity.buffer[velocity.offset + 1] += force[1] * dt;
                    velocity.buffer[velocity.offset + 2] += force[2] * dt;
                }
                position.buffer[position.offset] += velocity.buffer[velocity.offset] * dt;
                position.buffer[position.offset + 1] += velocity.buffer[velocity.offset + 1] * dt;
                position.buffer[position.offset + 2] += velocity.buffer[velocity.offset + 2] * dt;

                if (this.emitParticleDuringLifeEmitter)
                {
                    this.emitParticleDuringLifeEmitter.SpawnParticles(position, velocity, dt);
                }

                position.offset += position.instanceStride;
                velocity.offset += velocity.instanceStride;
                if (mass)
                {
                    mass.offset += mass.instanceStride;
                }
            }
            position.dirty = true;
            velocity.dirty = true;
        }
        if (this.updateSimulation && this.constraints.length)
        {
            for (i = 0; i < this.constraints.length; ++i)
            {
                this.constraints[i].ApplyConstraint(this.buffers, this.instanceStride, this.aliveCount, dt);
            }
        }

        if (this.updateBoundingBox)
        {
            this.GetBoundingBox(this.aabbMin, this.aabbMax);
        }

        if (this.emitParticleDuringLifeEmitter && !(this.HasElement(Tw2ParticleElementDeclaration.POSITION) && this.HasElement(Tw2ParticleElementDeclaration.VELOCITY)) && this.updateSimulation)
        {
            position = this.GetElement(Tw2ParticleElementDeclaration.POSITION);
            velocity = this.GetElement(Tw2ParticleElementDeclaration.VELOCITY);

            for (i = 0; i < this.aliveCount; ++i)
            {
                this.emitParticleDuringLifeEmitter.SpawnParticles(position, velocity, 1);

                if (position)
                {
                    position.offset += position.instanceStride;
                }
                if (velocity)
                {
                    velocity.offset += velocity.instanceStride;
                }
            }
        }

        for (i = 0; i < this._elements.length; ++i)
        {
            var el = this._elements[i];
            el.offset = el.startOffset;
            if (el.dirty)
            {
                this.bufferDirty = true;
                el.dirty = false;
            }
        }
    };

    /**
     * Gets bounding box
     * @param {vec3} aabbMin
     * @param {vec3} aabbMax
     * @returns {boolean}
     * @prototype
     */
    Tw2ParticleSystem.prototype.GetBoundingBox = function(aabbMin, aabbMax)
    {
        if (this.aliveCount && this.HasElement(Tw2ParticleElementDeclaration.POSITION))
        {
            var position = this.GetElement(Tw2ParticleElementDeclaration.POSITION);
            aabbMin[0] = position.buffer[position.offset];
            aabbMin[1] = position.buffer[position.offset + 1];
            aabbMin[2] = position.buffer[position.offset + 2];
            aabbMax[0] = position.buffer[position.offset];
            aabbMax[1] = position.buffer[position.offset + 1];
            aabbMax[2] = position.buffer[position.offset + 2];
            for (var i = 0; i < this.aliveCount; ++i)
            {
                aabbMin[0] = Math.min(aabbMin[0], position.buffer[position.offset]);
                aabbMin[1] = Math.min(aabbMin[1], position.buffer[position.offset + 1]);
                aabbMin[2] = Math.min(aabbMin[2], position.buffer[position.offset + 2]);
                aabbMax[0] = Math.max(aabbMax[0], position.buffer[position.offset]);
                aabbMax[1] = Math.max(aabbMax[1], position.buffer[position.offset + 1]);
                aabbMax[2] = Math.max(aabbMax[2], position.buffer[position.offset + 2]);
                position.offset += position.instanceStride;
            }
            return true;
        }
        return false;
    };

    /**
     * _Sort
     * @private
     */
    Tw2ParticleSystem.prototype._Sort = function()
    {
        var eye = device.viewInv;
        var position = this.GetElement(Tw2ParticleElementDeclaration.POSITION);
        var count = this.aliveCount;
        var distances = this._distancesBuffer;
        for (var i = 0; i < count; ++i)
        {
            var o0 = position.offset + position.instanceStride * i;
            var dd = position.buffer[o0] - eye[12];
            var l0 = dd * dd;
            dd = position.buffer[o0 + 1] - eye[13];
            l0 += dd * dd;
            dd = position.buffer[o0 + 2] - eye[14];
            l0 += dd * dd;
            distances[i] = l0;
        }

        /**
         * sortItems
         * @param a
         * @param b
         * @returns {number}
         * @private
         */
        var sortItems = function(a, b)
        {
            if (a >= count && b >= count)
            {
                if (a < b) return -1;
                if (a > b) return 1;
                return 0;
            }
            if (a >= count)
            {
                return 1;
            }
            if (b >= count)
            {
                return -1;
            }
            var l0 = distances[a];
            var l1 = distances[b];

            if (l0 < l1) return 1;
            if (l0 > l1) return -1;
            return 0;
        };
        for (i = 0; i < this.maxParticleCount; ++i)
        {
            this._sortedIndexes[i] = i;
        }
        this._sortedIndexes.sort(sortItems);
    };

    /**
     * GetInstanceBuffer
     * @returns {WebGLBuffer}
     * @constructor
     */
    Tw2ParticleSystem.prototype.GetInstanceBuffer = function()
    {
        if (this.aliveCount == 0)
        {
            return undefined;
        }

        var d = device;
        if (this.requiresSorting && this.HasElement(Tw2ParticleElementDeclaration.POSITION) && this.buffers)
        {
            this._Sort();
            var stride = this.instanceStride[0];
            var gpuBuffer = this.buffers[0];
            var toOffset, fromOffset, j;
            for (var i = 0; i < this.aliveCount; ++i)
            {
                toOffset = i * stride;
                fromOffset = this._sortedIndexes[i] * stride;
                for (j = 0; j < stride; ++j)
                {
                    this._sortedBuffer[toOffset + j] = gpuBuffer[j + fromOffset];
                }
            }
            d.gl.bindBuffer(d.gl.ARRAY_BUFFER, this._vb);
            d.gl.bufferSubData(d.gl.ARRAY_BUFFER, 0, this._sortedBuffer.subarray(0, this.vertexStride[0] * this.aliveCount));
            this.bufferDirty = false;
        }
        else if (this.bufferDirty)
        {
            d.gl.bindBuffer(d.gl.ARRAY_BUFFER, this._vb);
            d.gl.bufferSubData(d.gl.ARRAY_BUFFER, 0, this.buffers[0].subarray(0, this.vertexStride[0] * this.aliveCount));
            this.bufferDirty = false;
        }
        return this._vb;
    };

    /**
     * GetInstanceDeclaration
     * @returns {Tw2VertexDeclaration}
     * @prototype
     */
    Tw2ParticleSystem.prototype.GetInstanceDeclaration = function()
    {
        return this._declaration;
    };

    /**
     * GetInstanceStride
     * @returns {number}
     * @prototype
     */
    Tw2ParticleSystem.prototype.GetInstanceStride = function()
    {
        return this.instanceStride[0];
    };

    /**
     * GetInstanceCount
     * @returns {number}
     * @prototype
     */
    Tw2ParticleSystem.prototype.GetInstanceCount = function()
    {
        return this.aliveCount;
    };

    /**
     * Tw2InstancedMesh
     * @property instanceGeometryResource
     * @property {string} instanceGeometryResPath
     * @property {number} instanceMeshIndex
     * @property {vec3} minBounds
     * @property {vec3} maxBounds
     * @inherit Tw2Mesh
     * @constructor
     */
    function Tw2InstancedMesh()
    {
        this._super.constructor.call(this);
        this.instanceGeometryResource = null;
        this.instanceGeometryResPath = '';
        this.instanceMeshIndex = 0;
        this.minBounds = vec3.create();
        this.maxBounds = vec3.create();
    }

    Inherit(Tw2InstancedMesh, Tw2Mesh);

    /**
     * Initializes the Tw2InstancedMesh
     * @prototype
     */
    Tw2InstancedMesh.prototype.Initialize = function()
    {
        this._super.Initialize.call(this);
        if (this.instanceGeometryResPath != '')
        {
            this.instanceGeometryResource = resMan.GetResource(this.instanceGeometryResPath);
        }
    };

    /**
     * _GetAreaBatches
     * @param {Array.<Tw2MeshArea>} areas
     * @param {RenderMode} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @private
     */
    Tw2InstancedMesh.prototype._GetAreaBatches = function(areas, mode, accumulator, perObjectData)
    {
        if (!device.instancedArrays)
        {
            return;
        }
        for (var i = 0; i < areas.length; ++i)
        {
            var area = areas[i];
            if (area.effect == null || area.debugIsHidden)
            {
                continue;
            }
            var batch = new Tw2InstancedMeshBatch();
            batch.renderMode = mode;
            batch.perObjectData = perObjectData;
            batch.instanceMesh = this;
            batch.meshIx = area.meshIndex;
            batch.start = area.index;
            batch.count = area.count;
            batch.effect = area.effect;
            accumulator.Commit(batch);
        }
    };

    /**
     * RenderAreas
     * @param {number} meshIx
     * @param {number} start
     * @param {number} count
     * @param {Tw2Effect} effect
     * @prototype
     */
    Tw2InstancedMesh.prototype.RenderAreas = function(meshIx, start, count, effect)
    {
        if (this.geometryResource)
        {
            this.geometryResource.KeepAlive();
        }
        if (this.instanceGeometryResource && this.instanceGeometryResource.KeepAlive)
        {
            this.instanceGeometryResource.KeepAlive();
        }
        if (this.geometryResource && this.instanceGeometryResource)
        {
            if (!this.geometryResource.IsGood())
            {
                return;
            }
            var buffer = this.instanceGeometryResource.GetInstanceBuffer(this.instanceMeshIndex);
            if (buffer)
            {
                this.geometryResource.RenderAreasInstanced(meshIx, start, count, effect,
                    buffer,
                    this.instanceGeometryResource.GetInstanceDeclaration(this.instanceMeshIndex),
                    this.instanceGeometryResource.GetInstanceStride(this.instanceMeshIndex),
                    this.instanceGeometryResource.GetInstanceCount(this.instanceMeshIndex));
            }
        }
    };


    /**
     * Tw2InstancedMeshBatch
     * @property {Tw2InstancedMesh} instanceMesh
     * @property {Tw2GeometryRes} geometryRes
     * @property {number} meshIx
     * @property {number} start
     * @property {number} count
     * @property {Tw2Effect|null} effect
     * @inherit Tw2RenderBatch
     * @constructor
     */
    function Tw2InstancedMeshBatch()
    {
        this._super.constructor.call(this);
        this.instanceMesh = null;
        this.geometryRes = null;
        this.meshIx = 0;
        this.start = 0;
        this.count = 1;
        this.effect = null;
    }

    Inherit(Tw2InstancedMeshBatch, Tw2RenderBatch);

    /**
     * Commits the Tw2InstancedMeshBatch for rendering
     * @param {Tw2Effect} [overrideEffect]
     * @prototype
     */
    Tw2InstancedMeshBatch.prototype.Commit = function(overrideEffect)
    {
        var effect = typeof(overrideEffect) == 'undefined' ? this.effect : overrideEffect;
        if (this.instanceMesh && effect)
        {
            this.instanceMesh.RenderAreas(this.meshIx, this.start, this.count, effect);
        }
    };

    /**
     * Tw2StaticEmitter
     * @property {string} name
     * @property {null|Tw2ParticleSystem} particleSystem
     * @property {string} geometryResourcePath
     * @property geometryResource
     * @property {Number} geometryIndex
     * @property {Boolean} _spawned
     * @constructor
     */
    function Tw2StaticEmitter()
    {
        this.name = '';
        this.particleSystem = null;
        this.geometryResourcePath = '';
        this.geometryResource = null;
        this.geometryIndex = 0;
        this._spawned = false;
    }

    /**
     * Initializes the emitter
     */
    Tw2StaticEmitter.prototype.Initialize = function()
    {
        if (this.geometryResourcePath != '')
        {
            this.geometryResource = resMan.GetResource(this.geometryResourcePath);
            this.geometryResource.systemMirror = true;
            this.geometryResource.RegisterNotification(this);
        }
        this._spawned = false;
    };

    /**
     * Rebuilds cached data
     */
    Tw2StaticEmitter.prototype.RebuildCachedData = function()
    {
        if (this.geometryResource && this.geometryResource.meshes.length)
        {
            if (!this.geometryResource.meshes[0].bufferData)
            {
                this.geometryResource.systemMirror = true;
                this.geometryResource.Reload();
            }
        }
    };

    /**
     * Internal render/update function. It is called every frame.
     * @param {Number} dt - delta time
     */
    Tw2StaticEmitter.prototype.Update = function(dt)
    {
        var i;

        if (!this._spawned &&
            this.particleSystem &&
            this.geometryResource &&
            this.geometryResource.IsGood() &&
            this.geometryResource.meshes.length > this.geometryIndex &&
            this.geometryResource.meshes[this.geometryIndex].bufferData)
        {
            this._spawned = true;

            var mesh = this.geometryResource.meshes[this.geometryIndex];
            var elts = this.particleSystem.elements;
            var inputs = new Array(elts.length);
            for (i = 0; i < elts.length; ++i)
            {
                var d = elts[i].GetDeclaration();
                var input = mesh.declaration.FindUsage(d.usage, d.usageIndex - 8);

                if (input == null)
                {
                    emitter.log('ResMan',
                    {
                        log: 'error',
                        src: ['Tw2StaticEmitter', 'Update'],
                        msg: 'Input geometry mesh lacks element required by particle system',
                        path: this.geometryResource.path,
                        type: 'geometry.elements',
                        data:
                        {
                            elementUsage: d.usage,
                            elementUsageIndex: d.usageIndex
                        }
                    });
                    return;
                }

                if (input.elements < d.elements)
                {
                    emitter.log('ResMan',
                    {
                        log: 'error',
                        src: ['Tw2StaticEmitter', 'Update'],
                        msg: 'Input geometry mesh elements do not have the required number of components',
                        path: this.geometryResource.path,
                        type: 'geometry.elementcomponents',
                        data:
                        {
                            inputCount: input.elements,
                            elementCount: d.elements,
                            elementUsage: d.usage,
                            elementUsageIndex: d.usageIndex
                        }
                    });
                    return;
                }
                inputs[i] = input.offset / 4;
            }
            var vertexCount = mesh.bufferData.length / mesh.declaration.stride * 4;
            for (i = 0; i < vertexCount; ++i)
            {
                var index = this.particleSystem.BeginSpawnParticle();
                if (index == null)
                {
                    break;
                }
                for (var j = 0; j < this.particleSystem._elements.length; ++j)
                {
                    var e = this.particleSystem._elements[j];
                    for (var k = 0; k < e.dimension; ++k)
                    {
                        e.buffer[e.instanceStride * index + e.startOffset + k] = mesh.bufferData[inputs[j] + k + i * mesh.declaration.stride / 4];
                    }
                }
                this.particleSystem.EndSpawnParticle();
            }
        }
    };

    /**
     * Tw2DynamicEmitter
     * @property {string} name
     * @property {number} rate
     * @property {boolean} isValid
     * @property {null|Tw2ParticleSystem} particleSystem
     * @property {number} _accumulatedRate
     * @property {Array} generators
     * @constructor
     */
    function Tw2DynamicEmitter()
    {
        this.name = '';
        this.rate = 0;
        this.isValid = false;
        this.particleSystem = null;
        this._accumulatedRate = 0;
        this.generators = [];
    }

    /**
     * Initialises the Emitter
     * @prototype
     */
    Tw2DynamicEmitter.prototype.Initialize = function()
    {
        this.Rebind();
    };

    /**
     * Internal render/update function. It is called every frame.
     * @param {number} dt - Frame time.
     * @prototype
     */
    Tw2DynamicEmitter.prototype.Update = function(dt)
    {
        this.SpawnParticles(null, null, Math.min(dt, 0.1));
    };

    /**
     * Rebind
     * @prototype
     */
    Tw2DynamicEmitter.prototype.Rebind = function()
    {
        this.isValid = false;
        if (!this.particleSystem)
        {
            return;
        }
        for (var i = 0; i < this.generators.length; ++i)
        {
            if (!this.generators[i].Bind(this.particleSystem))
            {
                return;
            }
        }
        this.isValid = true;
    };

    /**
     * SpawnParticles
     * @param position
     * @param velocity
     * @param rateModifier
     * @prototype
     */
    Tw2DynamicEmitter.prototype.SpawnParticles = function(position, velocity, rateModifier)
    {
        if (!this.isValid)
        {
            return;
        }
        this._accumulatedRate += this.rate * rateModifier;
        var count = Math.floor(this._accumulatedRate);
        this._accumulatedRate -= count;
        for (var i = 0; i < count; ++i)
        {
            var index = this.particleSystem.BeginSpawnParticle();
            if (index == null)
            {
                break;
            }
            for (var j = 0; j < this.generators.length; ++j)
            {
                this.generators[j].Generate(position, velocity, index);
            }
            this.particleSystem.EndSpawnParticle();
        }
    };

    /**
     * Tw2RandomUniformAttributeGenerator
     * @property {number} elementType
     * @property {string} customName
     * @property {quat4} minRange
     * @property {quat4} maxRange
     * @property _element
     * @constructor
     */
    function Tw2RandomUniformAttributeGenerator()
    {
        this.elementType = Tw2ParticleElementDeclaration.CUSTOM;
        this.customName = '';
        this.minRange = quat4.create();
        this.maxRange = quat4.create();
        this._element = null;
    }

    /**
     * Bind
     * @param ps
     * @returns {boolean}
     * @prototype
     */
    Tw2RandomUniformAttributeGenerator.prototype.Bind = function(ps)
    {
        for (var i = 0; i < ps._elements.length; ++i)
        {
            if (ps._elements[i].elementType == this.elementType &&
                (this.elementType != Tw2ParticleElementDeclaration.CUSTOM || ps._elements[i].customName == this.customName))
            {
                this._element = ps._elements[i];
                return true;
            }
        }
        return false;
    };

    /**
     * Generate
     * @param position
     * @param velocity
     * @param index
     * @prototype
     */
    Tw2RandomUniformAttributeGenerator.prototype.Generate = function(position, velocity, index)
    {
        for (var i = 0; i < this._element.dimension; ++i)
        {
            this._element.buffer[this._element.instanceStride * index + this._element.startOffset + i] = this.minRange[i] + Math.random() * (this.maxRange[i] - this.minRange[i]);
        }
    };

    /**
     * Tw2SphereShapeAttributeGenerator
     * @property {number} minRadius
     * @property {number} maxRadius
     * @property {number} minPhi
     * @property {number} maxPhi
     * @property {number} minTheta
     * @property {number} maxTheta
     * @property {boolean} controlPosition
     * @property {boolean} controlVelocity
     * @property {number} minSpeed
     * @property {number} maxSpeed
     * @property {number} parentVelocityFactor
     * @property {vec3} position
     * @property {quat4} rotation
     * @property _position
     * @property _velocity
     * @constructor
     */
    function Tw2SphereShapeAttributeGenerator()
    {
        this.minRadius = 0;
        this.maxRadius = 0;
        this.minPhi = 0;
        this.maxPhi = 360;
        this.minTheta = 0;
        this.maxTheta = 360;
        this.controlPosition = true;
        this.controlVelocity = true;
        this.minSpeed = 0;
        this.maxSpeed = 0;
        this.parentVelocityFactor = 1;
        this.position = vec3.create();
        this.rotation = quat4.create([0, 0, 0, 1]);
        this._position = null;
        this._velocity = null;
    }

    /**
     * Bind
     * @param ps
     * @returns {boolean}
     * @prototype
     */
    Tw2SphereShapeAttributeGenerator.prototype.Bind = function(ps)
    {
        this._position = null;
        this._velocity = null;
        for (var i = 0; i < ps._elements.length; ++i)
        {
            if (ps._elements[i].elementType == Tw2ParticleElementDeclaration.POSITION && this.controlPosition)
            {
                this._position = ps._elements[i];
            }
            else if (ps._elements[i].elementType == Tw2ParticleElementDeclaration.VELOCITY && this.controlVelocity)
            {
                this._velocity = ps._elements[i];
            }
        }
        return (!this.controlPosition || this._position != null) && (!this.controlVelocity || this._velocity != null);
    };

    /**
     * Generate
     * @param position
     * @param velocity
     * @param index
     * @prototype
     */
    Tw2SphereShapeAttributeGenerator.prototype.Generate = function(position, velocity, index)
    {
        var offset;

        var phi = (this.minPhi + Math.random() * (this.maxPhi - this.minPhi)) / 180 * Math.PI;
        var theta = (this.minTheta + Math.random() * (this.maxTheta - this.minTheta)) / 180 * Math.PI;

        var rv = vec3.create();
        rv[0] = Math.sin(phi) * Math.cos(theta);
        rv[1] = -Math.cos(phi);
        rv[2] = Math.sin(phi) * Math.sin(theta);

        quat4.multiplyVec3(this.rotation, rv);
        if (this._velocity)
        {
            var speed = this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed);
            offset = this._velocity.instanceStride * index + this._velocity.startOffset;
            this._velocity.buffer[offset] = rv[0] * speed;
            this._velocity.buffer[offset + 1] = rv[1] * speed;
            this._velocity.buffer[offset + 2] = rv[2] * speed;
            if (velocity)
            {
                this._velocity.buffer[offset] += velocity.buffer[velocity.offset] * this.parentVelocityFactor;
                this._velocity.buffer[offset + 1] += velocity.buffer[velocity.offset + 1] * this.parentVelocityFactor;
                this._velocity.buffer[offset + 2] += velocity.buffer[velocity.offset + 2] * this.parentVelocityFactor;
            }
        }

        if (this._position)
        {
            vec3.scale(rv, this.minRadius + Math.random() * (this.maxRadius - this.minRadius));
            vec3.add(rv, this.position);
            if (position)
            {
                rv[0] += position.buffer[position.offset];
                rv[1] += position.buffer[position.offset + 1];
                rv[2] += position.buffer[position.offset + 2];
            }
            offset = this._position.instanceStride * index + this._position.startOffset;
            this._position.buffer[offset] = rv[0];
            this._position.buffer[offset + 1] = rv[1];
            this._position.buffer[offset + 2] = rv[2];
        }
    };

    /**
     * Tw2ParticleSpring
     * @property {number} springConstant
     * @property {vec3} position
     * @constructor
     */
    function Tw2ParticleSpring()
    {
        this.springConstant = 0;
        this.position = vec3.create();
    }

    /**
     * ApplyForce
     * @param position
     * @param velocity
     * @param force
     * @prototype
     */
    Tw2ParticleSpring.prototype.ApplyForce = function(position, velocity, force)
    {
        force[0] += (this.position[0] - position.buffer[position.offset]) * this.springConstant;
        force[1] += (this.position[1] - position.buffer[position.offset + 1]) * this.springConstant;
        force[2] += (this.position[2] - position.buffer[position.offset + 2]) * this.springConstant;
    };

    /**
     * Internal render/update function. It is called every frame.
     * @prototype
     */
    Tw2ParticleSpring.prototype.Update = function() {};

    /**
     * Tw2ParticleDragForce
     * @property {number} drag
     * @constructor
     */
    function Tw2ParticleDragForce()
    {
        this.drag = 0.1;
    }

    /**
     * ApplyForce
     * @param position
     * @param velocity
     * @param force
     * @prototype
     */
    Tw2ParticleDragForce.prototype.ApplyForce = function(position, velocity, force)
    {
        force[0] += velocity.buffer[velocity.offset] * -this.drag;
        force[1] += velocity.buffer[velocity.offset + 1] * -this.drag;
        force[2] += velocity.buffer[velocity.offset + 2] * -this.drag;
    };

    /**
     * Internal render/update function. It is called every frame.
     * @prototype
     */
    Tw2ParticleDragForce.prototype.Update = function() {};

    /**
     * Tw2ParticleTurbulenceForce
     * @property {number} noiseLevel
     * @property {number} noiseRatio
     * @property {vec3} amplitude
     * @property {quat4} frequency
     * @property {number} _time
     * @constructor
     */
    function Tw2ParticleTurbulenceForce()
    {
        this.noiseLevel = 3;
        this.noiseRatio = 0.5;
        this.amplitude = vec3.create([1, 1, 1]);
        this.frequency = quat4.create([1, 1, 1, 1]);
        this._time = 0;
    }

    var s_noiseLookup = [];
    var s_permutations = [];
    var s_globalNoiseTemps = [];

    function InitializeNoise()
    {
        for (var i = 0; i < 256; i++)
        {
            s_noiseLookup[i] = quat4.create([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5]);
            s_permutations[i] = i;
        }

        i = 256;
        while (--i)
        {
            var tmp = s_permutations[i];
            var index = Math.floor(Math.random() * 256);
            s_permutations[i] = s_permutations[index];
            s_permutations[index] = tmp;
        }

        for (i = 0; i < 256; i++)
        {
            s_permutations[256 + i] = s_permutations[i];
            s_noiseLookup[256 + i] = s_noiseLookup[i];
            s_noiseLookup[256 * 2 + i] = s_noiseLookup[i];
        }
        for (i = 0; i < 15; ++i)
        {
            s_globalNoiseTemps[i] = vec3.create();
        }
    }
    InitializeNoise();

    function AddNoise(pos_0, pos_1, pos_2, pos_3, power, result)
    {
        pos_0 += 4096;
        pos_1 += 4096;
        pos_2 += 4096;
        pos_3 += 4096;

        var a_0 = Math.floor(pos_0);
        var a_1 = Math.floor(pos_1);
        var a_2 = Math.floor(pos_2);
        var a_3 = Math.floor(pos_3);
        var t_0 = pos_0 - a_0;
        var t_1 = pos_1 - a_1;
        var t_2 = pos_2 - a_2;
        var t_3 = pos_3 - a_3;
        a_0 &= 255;
        a_1 &= 255;
        a_2 &= 255;
        a_3 &= 255;
        var b_0 = a_0 + 1;
        var b_1 = a_1 + 1;
        var b_2 = a_2 + 1;
        var b_3 = a_3 + 1;

        var i = s_permutations[a_0];
        var j = s_permutations[b_0];

        var b00 = s_permutations[i + a_1];
        var b10 = s_permutations[j + a_1];
        var b01 = s_permutations[i + b_1];
        var b11 = s_permutations[j + b_1];

        var c00 = vec3.lerp(s_noiseLookup[b00 + a_2 + a_3], s_noiseLookup[b10 + a_2 + a_3], t_0, s_globalNoiseTemps[0]);
        var c10 = vec3.lerp(s_noiseLookup[b01 + a_2 + a_3], s_noiseLookup[b11 + a_2 + a_3], t_0, s_globalNoiseTemps[1]);
        var c01 = vec3.lerp(s_noiseLookup[b00 + b_2 + a_3], s_noiseLookup[b10 + b_2 + a_3], t_0, s_globalNoiseTemps[2]);
        var c11 = vec3.lerp(s_noiseLookup[b00 + b_2 + a_3], s_noiseLookup[b10 + b_2 + a_3], t_0, s_globalNoiseTemps[3]);
        var c0 = vec3.lerp(c00, c10, t_1, s_globalNoiseTemps[4]);
        var c1 = vec3.lerp(c01, c11, t_1, s_globalNoiseTemps[5]);
        var c = vec3.lerp(c0, c1, t_2, s_globalNoiseTemps[6]);

        c00 = vec3.lerp(s_noiseLookup[b00 + a_2 + b_3], s_noiseLookup[b10 + a_2 + b_3], t_0, s_globalNoiseTemps[7]);
        c10 = vec3.lerp(s_noiseLookup[b01 + a_2 + b_3], s_noiseLookup[b11 + a_2 + b_3], t_0, s_globalNoiseTemps[8]);
        c01 = vec3.lerp(s_noiseLookup[b00 + b_2 + b_3], s_noiseLookup[b10 + b_2 + b_3], t_0, s_globalNoiseTemps[9]);
        c11 = vec3.lerp(s_noiseLookup[b00 + b_2 + b_3], s_noiseLookup[b10 + b_2 + b_3], t_0, s_globalNoiseTemps[10]);
        c0 = vec3.lerp(c00, c10, t_1, s_globalNoiseTemps[11]);
        c1 = vec3.lerp(c01, c11, t_1, s_globalNoiseTemps[12]);
        var d = vec3.lerp(c0, c1, t_2, s_globalNoiseTemps[13]);

        var r = vec3.lerp(c, d, t_3, s_globalNoiseTemps[14]);
        result[0] += r[0] * power;
        result[1] += r[1] * power;
        result[2] += r[2] * power;
    }

    /**
     * tempNoise
     * @type {quat4}
     * @prototype
     */
    Tw2ParticleTurbulenceForce.tempNoise = quat4.create();

    /**
     * ApplyForce
     * @param position
     * @param velocity
     * @param force
     * @prototype
     */
    Tw2ParticleTurbulenceForce.prototype.ApplyForce = function(position, velocity, force)
    {
        if (this.noiseLevel == 0)
        {
            return;
        }
        var pos_0 = position.buffer[position.offset] * this.frequency[0];
        var pos_1 = position.buffer[position.offset + 1] * this.frequency[1];
        var pos_2 = position.buffer[position.offset + 2] * this.frequency[2];
        var pos_3 = this._time * this.frequency[3];
        var noise = Tw2ParticleTurbulenceForce.tempNoise;
        noise[0] = noise[1] = noise[2] = noise[3] = 0;
        var power = 0.5;
        var sum = 0;
        var frequency = 1 / this.noiseRatio;
        for (var i = 0; i < this.noiseLevel; ++i)
        {
            AddNoise(pos_0, pos_1, pos_2, pos_3, power, noise);
            sum += power;
            pos_0 *= frequency;
            pos_1 *= frequency;
            pos_2 *= frequency;
            pos_3 *= frequency;
            power *= this.noiseRatio;
        }
        force[0] += noise[0] * this.amplitude[0] * sum;
        force[1] += noise[1] * this.amplitude[1] * sum;
        force[2] += noise[2] * this.amplitude[2] * sum;
    };

    /**
     * Internal render/update function. It is called every frame.
     * @param {number} dt - delta Time
     * @prototype
     */
    Tw2ParticleTurbulenceForce.prototype.Update = function(dt)
    {
        this._time += dt;
    };

    /**
     * Tw2ParticleDirectForce
     * @property {vec3} force
     * @constructor
     */
    function Tw2ParticleDirectForce()
    {
        this.force = vec3.create();
    }

    /**
     * ApplyForce
     * @param position
     * @param velocity
     * @param force
     * @prototype
     */
    Tw2ParticleDirectForce.prototype.ApplyForce = function(position, velocity, force)
    {
        force[0] += this.force[0];
        force[1] += this.force[1];
        force[2] += this.force[2];
    };

    /**
     * Internal render/update function. It is called every frame.
     * @prototype
     */
    Tw2ParticleDirectForce.prototype.Update = function() {};

    /**
     * Tw2ParticleAttractorForce
     * @property {number} magnitude
     * @property {vec3} position
     * @property {vec3} _tempVec
     * @constructor
     */
    function Tw2ParticleAttractorForce()
    {
        this.magnitude = 0;
        this.position = vec3.create();
        this._tempVec = vec3.create();
    }

    /**
     * ApplyForce
     * @param position
     * @param velocity
     * @param force
     * @prototype
     */
    Tw2ParticleAttractorForce.prototype.ApplyForce = function(position, velocity, force)
    {
        this._tempVec[0] = this.position[0] - position.buffer[position.offset];
        this._tempVec[1] = this.position[1] - position.buffer[position.offset + 1];
        this._tempVec[2] = this.position[2] - position.buffer[position.offset + 2];
        vec3.scale(vec3.normalize(this._tempVec), this.magnitude);

        force[0] += this._tempVec[0];
        force[1] += this._tempVec[1];
        force[2] += this._tempVec[2];
    };

    /**
     * Internal render/update function. It is called every frame.
     * @prototype
     */
    Tw2ParticleAttractorForce.prototype.Update = function() {};

    /**
     * Tw2ParticleFluidDragForce
     * @property {number} drag
     * @property {vec3} _tempVec
     * @property {vec3} _tempVec2
     * @constructor
     */
    function Tw2ParticleFluidDragForce()
    {
        this.drag = 0.1;
        this._tempVec = vec3.create();
        this._tempVec2 = vec3.create();
    }

    /**
     * ApplyForce
     * @param position
     * @param velocity
     * @param force
     * @param {number} dt - delta time
     * @param mass
     * @prototype
     */
    Tw2ParticleFluidDragForce.prototype.ApplyForce = function(position, velocity, force, dt, mass)
    {
        var speed = Math.sqrt(
            velocity.buffer[velocity.offset] * velocity.buffer[velocity.offset] +
            velocity.buffer[velocity.offset + 1] * velocity.buffer[velocity.offset + 1] +
            velocity.buffer[velocity.offset + 2] * velocity.buffer[velocity.offset + 2]);
        this._tempVec[0] = velocity.buffer[velocity.offset] * -speed * this.drag;
        this._tempVec[1] = velocity.buffer[velocity.offset + 1] * -speed * this.drag;
        this._tempVec[2] = velocity.buffer[velocity.offset + 2] * -speed * this.drag;

        vec3.scale(this._tempVec, dt * mass, this._tempVec2);
        this._tempVec2[0] += velocity.buffer[velocity.offset];
        this._tempVec2[1] += velocity.buffer[velocity.offset + 1];
        this._tempVec2[2] += velocity.buffer[velocity.offset + 2];
        var dot = velocity.buffer[velocity.offset] * this._tempVec2[0] +
            velocity.buffer[velocity.offset + 1] * this._tempVec2[1] +
            velocity.buffer[velocity.offset + 2] * this._tempVec2[2];
        if (dot < 0)
        {
            force[0] = -velocity.buffer[velocity.offset] / dt / mass;
            force[1] = -velocity.buffer[velocity.offset + 1] / dt / mass;
            force[2] = -velocity.buffer[velocity.offset + 2] / dt / mass;
        }
        else
        {
            vec3.set(this._tempVec, force);
        }
    };

    /**
     * Internal render/update function. It is called every frame.
     * @prototype
     */
    Tw2ParticleFluidDragForce.prototype.Update = function() {};

    /**
     * Tw2RandomIntegerAttributeGenerator
     * @property {number} elementType
     * @property {string} customName
     * @property {quat4} minRange
     * @property {quat4} maxRange
     * @property _element
     * @constructor
     */
    function Tw2RandomIntegerAttributeGenerator()
    {
        this.elementType = Tw2ParticleElementDeclaration.CUSTOM;
        this.customName = '';
        this.minRange = quat4.create();
        this.maxRange = quat4.create();
        this._element = null;
    }

    /**
     * Bind
     * @param ps
     * @returns {boolean}
     * @prototype
     */
    Tw2RandomIntegerAttributeGenerator.prototype.Bind = function(ps)
    {
        for (var i = 0; i < ps._elements.length; ++i)
        {
            if (ps._elements[i].elementType == this.elementType &&
                (this.elementType != Tw2ParticleElementDeclaration.CUSTOM || ps._elements[i].customName == this.customName))
            {
                this._element = ps._elements[i];
                return true;
            }
        }
        return false;
    };

    /**
     * Generate
     * @param position
     * @param velocity
     * @param index
     * @prototype
     */
    Tw2RandomIntegerAttributeGenerator.prototype.Generate = function(position, velocity, index)
    {
        for (var i = 0; i < this._element.dimension; ++i)
        {
            this._element.buffer[this._element.instanceStride * index + this._element.startOffset + i] = Math.floor(this.minRange[i] + Math.random() * (this.maxRange[i] - this.minRange[i]) + 0.5);
        }
    };

    var exports = {};
    exports.Tw2EventEmitter = Tw2EventEmitter;
    exports.emitter = emitter;
    exports.Tw2Frustum = Tw2Frustum;
    exports.Tw2RawData = Tw2RawData;
    exports.Tw2BinaryReader = Tw2BinaryReader;
    exports.Tw2VertexElement = Tw2VertexElement;
    exports.Tw2VertexDeclaration = Tw2VertexDeclaration;
    exports.Tw2ObjectReader = Tw2ObjectReader;
    exports.Tw2Resource = Tw2Resource;
    //exports.Inherit = Inherit;
    exports.Tw2VariableStore = Tw2VariableStore;
    exports.variableStore = variableStore;
    exports.Tw2MotherLode = Tw2MotherLode;
    exports.Tw2LoadingObject = Tw2LoadingObject;
    exports.Tw2ResMan = Tw2ResMan;
    exports.resMan = resMan;
    exports.Tw2PerObjectData = Tw2PerObjectData;
    exports.Tw2SamplerState = Tw2SamplerState;
    exports.Tw2FloatParameter = Tw2FloatParameter;
    exports.Tw2Vector2Parameter = Tw2Vector2Parameter;
    exports.Tw2Vector3Parameter = Tw2Vector3Parameter;
    exports.Tw2Vector4Parameter = Tw2Vector4Parameter;
    exports.Tw2MatrixParameter = Tw2MatrixParameter;
    exports.Tw2VariableParameter = Tw2VariableParameter;
    exports.Tw2TextureParameter = Tw2TextureParameter;
    exports.Tw2TransformParameter = Tw2TransformParameter;
    exports.Tw2Device = Tw2Device;
    exports.device = device;
    exports.Tw2BatchAccumulator = Tw2BatchAccumulator;
    exports.Tw2RenderBatch = Tw2RenderBatch;
    exports.Tw2ForwardingRenderBatch = Tw2ForwardingRenderBatch;
    exports.Tw2GeometryBatch = Tw2GeometryBatch;
    exports.Tw2GeometryLineBatch = Tw2GeometryLineBatch;
    exports.Tw2GeometryMeshArea = Tw2GeometryMeshArea;
    exports.Tw2GeometryMeshBinding = Tw2GeometryMeshBinding;
    exports.Tw2GeometryModel = Tw2GeometryModel;
    exports.Tw2GeometrySkeleton = Tw2GeometrySkeleton;
    exports.Tw2GeometryBone = Tw2GeometryBone;
    exports.Tw2GeometryAnimation = Tw2GeometryAnimation;
    exports.Tw2GeometryTrackGroup = Tw2GeometryTrackGroup;
    exports.Tw2GeometryTransformTrack = Tw2GeometryTransformTrack;
    exports.Tw2GeometryCurve = Tw2GeometryCurve;
    exports.Tw2BlendShapeData = Tw2BlendShapeData;
    exports.Tw2GeometryMesh = Tw2GeometryMesh;
    exports.Tw2GeometryRes = Tw2GeometryRes;
    exports.Tw2TextureRes = Tw2TextureRes;
    exports.Tw2EffectRes = Tw2EffectRes;
    exports.Tw2SamplerOverride = Tw2SamplerOverride;
    exports.Tw2Effect = Tw2Effect;
    exports.Tw2MeshArea = Tw2MeshArea;
    exports.Tw2MeshLineArea = Tw2MeshLineArea;
    exports.Tw2Mesh = Tw2Mesh;
    exports.Tw2Track = Tw2Track;
    exports.Tw2TrackGroup = Tw2TrackGroup;
    exports.Tw2Animation = Tw2Animation;
    exports.Tw2Bone = Tw2Bone;
    exports.Tw2Model = Tw2Model;
    exports.Tw2AnimationController = Tw2AnimationController;
    exports.Tw2RenderTarget = Tw2RenderTarget;
    exports.Tw2CurveSet = Tw2CurveSet;
    exports.Tw2ValueBinding = Tw2ValueBinding;
    exports.Tw2Float = Tw2Float;
    exports.Tw2RuntimeInstanceData = Tw2RuntimeInstanceData;
    exports.Tw2PostProcess = Tw2PostProcess;
    exports.Tw2ColorKey = Tw2ColorKey;
    exports.Tw2ColorCurve = Tw2ColorCurve;
    exports.Tw2ColorKey2 = Tw2ColorKey2;
    exports.Tw2ColorCurve2 = Tw2ColorCurve2;
    exports.Tw2ColorSequencer = Tw2ColorSequencer;
    exports.Tw2EulerRotation = Tw2EulerRotation;
    exports.Tw2EventKey = Tw2EventKey;
    exports.Tw2EventCurve = Tw2EventCurve;
    //exports.Perlin_start = Perlin_start;
    //exports.Perlin_B = Perlin_B;
    //exports.Perlin_BM = Perlin_BM;
    //exports.Perlin_N = Perlin_N;
    //exports.Perlin_p = Perlin_p;
    //exports.Perlin_g1 = Perlin_g1;
    //exports.Perlin_init = Perlin_init;
    //exports.Perlin_noise1 = Perlin_noise1;
    //exports.PerlinNoise1D = PerlinNoise1D;
    exports.Tw2PerlinCurve = Tw2PerlinCurve;
    exports.Tw2QuaternionSequencer = Tw2QuaternionSequencer;
    exports.Tw2RandomConstantCurve = Tw2RandomConstantCurve;
    exports.Tw2RGBAScalarSequencer = Tw2RGBAScalarSequencer;
    exports.Tw2Torque = Tw2Torque;
    exports.Tw2RigidOrientation = Tw2RigidOrientation;
    exports.Tw2QuaternionKey = Tw2QuaternionKey;
    exports.Tw2RotationCurve = Tw2RotationCurve;
    exports.Tw2ScalarKey = Tw2ScalarKey;
    exports.Tw2ScalarCurve = Tw2ScalarCurve;
    exports.Tw2ScalarKey2 = Tw2ScalarKey2;
    exports.Tw2ScalarCurve2 = Tw2ScalarCurve2;
    exports.Tw2ScalarSequencer = Tw2ScalarSequencer;
    exports.Tw2SineCurve = Tw2SineCurve;
    exports.Tw2TransformTrack = Tw2TransformTrack;
    exports.Tw2Vector2Key = Tw2Vector2Key;
    exports.Tw2Vector2Curve = Tw2Vector2Curve;
    exports.Tw2Vector3Key = Tw2Vector3Key;
    exports.Tw2Vector3Curve = Tw2Vector3Curve;
    exports.Tw2VectorKey = Tw2VectorKey;
    exports.Tw2VectorCurve = Tw2VectorCurve;
    exports.Tw2VectorSequencer = Tw2VectorSequencer;
    exports.Tw2XYZScalarSequencer = Tw2XYZScalarSequencer;
    exports.Tw2YPRSequencer = Tw2YPRSequencer;
    exports.Tw2MayaAnimationEngine = Tw2MayaAnimationEngine;
    //exports.ag_horner1 = ag_horner1;
    //exports.ag_zeroin2 = ag_zeroin2;
    //exports.ag_zeroin = ag_zeroin;
    //exports.polyZeroes = polyZeroes;
    exports.Tw2MayaScalarCurve = Tw2MayaScalarCurve;
    exports.Tw2MayaVector3Curve = Tw2MayaVector3Curve;
    exports.Tw2MayaEulerRotationCurve = Tw2MayaEulerRotationCurve;
    exports.Tw2QuaternionKey2 = Tw2QuaternionKey2;
    exports.Tw2QuaternionCurve = Tw2QuaternionCurve;
    exports.Tw2WbgTrack = Tw2WbgTrack;
    exports.Tw2WbgTransformTrack = Tw2WbgTransformTrack;
    exports.EveLocator = EveLocator;
    exports.EveBoosterSet = EveBoosterSet;
    exports.EveBoosterBatch = EveBoosterBatch;
    exports.EveSpriteSet = EveSpriteSet;
    exports.EveSpriteSetBatch = EveSpriteSetBatch;
    exports.EveSpriteSetItem = EveSpriteSetItem;
    exports.EveSpotlightSetItem = EveSpotlightSetItem;
    exports.EveSpotlightSet = EveSpotlightSet;
    exports.EveSpotlightSetBatch = EveSpotlightSetBatch;
    exports.EvePlaneSet = EvePlaneSet;
    exports.EvePlaneSetBatch = EvePlaneSetBatch;
    exports.EvePlaneSetItem = EvePlaneSetItem;
    exports.EveBasicPerObjectData = EveBasicPerObjectData;
    exports.EveTransform = EveTransform;
    exports.EveTurretData = EveTurretData;
    exports.EveTurretSet = EveTurretSet;
    //exports.mat3x4toquat = mat3x4toquat;
    //exports.mat4toquat = mat4toquat;
    exports.EveSpaceObject = EveSpaceObject;
    exports.EveShip = EveShip;
    exports.EveTurretSetLocatorInfo = EveTurretSetLocatorInfo;
    exports.EveSpaceObjectDecal = EveSpaceObjectDecal;
    exports.EveSpaceScene = EveSpaceScene;
    exports.EveOccluder = EveOccluder;
    exports.EveLensflare = EveLensflare;
    exports.EvePlanet = EvePlanet;
    exports.EveEffectRoot = EveEffectRoot;
    exports.EveStretch = EveStretch;
    exports.EvePerMuzzleData = EvePerMuzzleData;
    exports.EveTurretFiringFX = EveTurretFiringFX;
    exports.EveSOF = EveSOF;
    //exports.vec3Hermite = vec3Hermite;
    exports.EveCurveLineSet = EveCurveLineSet;
    exports.EveMeshOverlayEffect = EveMeshOverlayEffect;
    exports.EveChildMesh = EveChildMesh;
    exports.EveChildExplosion = EveChildExplosion;
    exports.EveMissile = EveMissile;
    exports.EveMissileWarhead = EveMissileWarhead;
    exports.Tw2ParticleElementDeclaration = Tw2ParticleElementDeclaration;
    exports.Tr2ParticleElement = Tr2ParticleElement;
    exports.Tw2ParticleSystem = Tw2ParticleSystem;
    exports.Tw2InstancedMesh = Tw2InstancedMesh;
    exports.Tw2InstancedMeshBatch = Tw2InstancedMeshBatch;
    exports.Tw2StaticEmitter = Tw2StaticEmitter;
    exports.Tw2DynamicEmitter = Tw2DynamicEmitter;
    exports.Tw2RandomUniformAttributeGenerator = Tw2RandomUniformAttributeGenerator;
    exports.Tw2SphereShapeAttributeGenerator = Tw2SphereShapeAttributeGenerator;
    exports.Tw2ParticleSpring = Tw2ParticleSpring;
    exports.Tw2ParticleDragForce = Tw2ParticleDragForce;
    exports.Tw2ParticleTurbulenceForce = Tw2ParticleTurbulenceForce;
    //exports.s_noiseLookup = s_noiseLookup;
    //exports.s_permutations = s_permutations;
    //exports.s_globalNoiseTemps = s_globalNoiseTemps;
    //exports.InitializeNoise = InitializeNoise;
    //exports.AddNoise = AddNoise;
    exports.Tw2ParticleDirectForce = Tw2ParticleDirectForce;
    exports.Tw2ParticleAttractorForce = Tw2ParticleAttractorForce;
    exports.Tw2ParticleFluidDragForce = Tw2ParticleFluidDragForce;
    exports.Tw2RandomIntegerAttributeGenerator = Tw2RandomIntegerAttributeGenerator
    return exports;

})();
