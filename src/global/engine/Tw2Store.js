import {isString, isPlain, isArray, isFunction, toArray, isUndefined, enableUUID} from '../util';
import {Tw2Error} from '../../core/Tw2Error';
import {Tw2EventEmitter} from '../../core/Tw2EventEmitter';

/**
 * Stores engine data
 *
 * @property {Object.< string, string>} _path
 * @property {Object.< string, Array<string>>} _dynamicPath
 * @property {Object.< string, Tw2Parameter>} _variable
 * @property {Object.< string, Function>} _type
 * @property {Object.< string, Function>} _extension
 * @property {Object.< string, Function>} _constructor
 * @property {Object.< string, Tw2Schema>} _schema
 * @property {Object.< string, Array<string>>} _missing
 * @class
 */
class Tw2Store extends Tw2EventEmitter
{
    constructor()
    {
        super();
        this.name = 'Variable store';
        this._type = {};
        this._path = {};
        this._variable = {};
        this._extension = {};
        this._constructor = {};
        this._dynamicPath = {};
        this._schema = {};
        this._missing = {};
    }

    /**
     * Checks if a resource path exists
     * @param {string} prefix
     * @returns {boolean}
     */
    HasPath(prefix)
    {
        return (prefix && prefix in this._path);
    }


    /**
     * Gets a path by it's prefix
     * @param {string} prefix
     * @returns {?string}
     */
    GetPath(prefix)
    {
        return Tw2Store.GetStoreItem(this, 'path', prefix);
    }

    /**
     * Registers a resource path
     * @param {string} prefix
     * @param {string} path
     * @returns {boolean}
     */
    RegisterPath(prefix, path)
    {
        return Tw2Store.SetStoreItem(this, 'path', prefix, path, isString);
    }

    /**
     * Registers resource paths from an object or an array of objects
     * @param {{string:string}|Array<{string:string}>} obj
     * @returns {boolean}
     */
    RegisterPaths(obj)
    {
        return Tw2Store.RegisterFromObject(this, 'RegisterPath', obj);
    }

    /**
     * Checks if a dynamic path exists
     * @param {string} prefix
     * @returns {boolean}
     */
    HasDynamicPath(prefix)
    {
        return (prefix && prefix in this._dynamicPath);
    }

    /**
     * Gets a dynamic path by it's prefix
     * @param {string} prefix
     * @returns {?Array<string>}
     */
    GetDynamicPath(prefix)
    {
        return Tw2Store.GetStoreItem(this, 'dynamicPath', prefix);
    }

    /**
     * Registers a dynamic path
     * @param {string} prefix
     * @param {string[]} paths
     * @returns {boolean}
     */
    RegisterDynamicPath(prefix, paths)
    {
        return Tw2Store.SetStoreItem(this, 'dynamicPath', prefix, paths, isArray);
    }

    /**
     * Registers dynamic paths from an object or array of objects
     * @param {{string:string[]}|Array<{string:string[]}>} obj
     * @returns {boolean}
     */
    RegisterDynamicPaths(obj)
    {
        return Tw2Store.RegisterFromObject(this, 'RegisterDynamicPath', obj);
    }

    /**
     * Checks if an extension exists
     * @param {string} ext
     * @returns {boolean}
     */
    HasExtension(ext)
    {
        return (ext && ext in this._extension);
    }

    /**
     * Gets a resource extension by name
     * @param {string} ext
     * @returns {?Function}
     */
    GetExtension(ext)
    {
        return Tw2Store.GetStoreItem(this, 'extension', ext);
    }

    /**
     * Registers a resource extension
     * @param {string} ext
     * @param {Function} Constructor
     * @returns {boolean}
     */
    RegisterExtension(ext, Constructor)
    {
        return Tw2Store.SetStoreItem(this, 'extension', ext, Constructor, isFunction);
    }

    /**
     * Registers resource extensions from an object or array of objects
     * @param {{string:Function}|Array<{string:Function}>} obj
     * @returns {boolean}
     */
    RegisterExtensions(obj)
    {
        return Tw2Store.RegisterFromObject(this, 'RegisterExtension', obj);
    }

    /**
     * Checks if a constructor exists
     * @param {string} name
     * @returns {boolean}
     */
    HasConstructor(name)
    {
        return (name && name in this._constructor);
    }

    /**
     * Gets a library constructor by name
     * @param {string} name
     * @returns {?Function}
     */
    GetConstructor(name)
    {
        return Tw2Store.GetStoreItem(this, 'constructor', name);
    }

    /**
     * Registers library constructors
     * @param {string} name
     * @param {Function} Constructor
     * @returns {boolean}
     */
    RegisterConstructor(name, Constructor)
    {
        // Don't store errors as library constructors
        if (Constructor && (Constructor instanceof Tw2Error || Constructor.isError))
        {
            return false;
        }

        return Tw2Store.SetStoreItem(this, 'constructor', name, Constructor, isFunction);
    }

    /**
     * Registers library constructors from an object or array of objects
     * @param {{string:Function}|Array<{string:Function}>} obj
     * @returns {boolean}
     */
    RegisterConstructors(obj)
    {
        return Tw2Store.RegisterFromObject(this, 'RegisterConstructor', obj);
    }

    /**
     * Checks if a variable exists
     * @param {string} name
     * @returns {boolean}
     */
    HasVariable(name)
    {
        return (name && name in this._variable);
    }

    /**
     * Gets a variable by name
     * @param {string} name
     * @returns {?*}
     */
    GetVariable(name)
    {
        return Tw2Store.GetStoreItem(this, 'variable', name);
    }

    /**
     * Gets a variable's value
     * @param {string} name
     * @param {boolean} [serialize]
     * @returns {?*} null if the variable doesn't exist or it does but it has no GetValue method
     */
    GetVariableValue(name, serialize)
    {
        const variable = this.GetVariable(name);
        return variable && variable.GetValue ? variable.GetValue(serialize) : null;
    }

    /**
     * Sets a variable's value
     * @param {string} name
     * @param {*} value
     * @returns {?boolean} null if the variable doesn't exist or it does but has no SetValue method
     */
    SetVariableValue(name, value)
    {
        const variable = this.GetVariable(name);
        if (variable && variable.SetValue)
        {
            variable.SetValue(value);
            return true;
        }
        return null;
    }

    /**
     * Registers a variable
     * @param {string} name
     * @param {*|{value:*, Type: string|Function}} [value]
     * @param {string|Function} [Type]
     * @returns {?*}
     */
    RegisterVariable(name, value, Type)
    {
        const variable = this.CreateType(name, value, Type);
        Tw2Store.SetStoreItem(this, 'variable', name, variable);
        return variable;
    }

    /**
     * Registers variables from an object or array of objects
     * @param {{string:*|{value:*,type:string|Function}|Array<{string:*|{value:*,type:string|Function}>}} obj
     */
    RegisterVariables(obj)
    {
        return Tw2Store.RegisterFromObject(this, 'RegisterVariable', obj);
    }

    /**
     * Gets a parameter constructor by it's short name
     * @param {string} name
     * @returns {?Function}
     */
    GetType(name)
    {
        return Tw2Store.GetStoreItem(this, 'type', name);
    }

    /**
     * Checks if a type exists
     * @param {string} name
     * @returns {boolean}
     */
    HasType(name)
    {
        return (name && name in this._type);
    }

    /**
     * Gets a type by value
     * @param {*} value
     * @returns {?Function}
     */
    GetTypeByValue(value)
    {
        for (let type in this._type)
        {
            if (this._type.hasOwnProperty(type) && 'isValue' in this._type[type])
            {
                if (this._type[type]['isValue'](value))
                {
                    return this._type[type];
                }
            }
        }
        return null;
    }

    /**
     * Creates a type by value and/or type name or function
     * @param {string} name
     * @param {?*} [value]
     * @param {?|string|Function} [Type]
     * @returns {?*} new parameter
     */
    CreateType(name, value, Type)
    {
        if (isPlain(value))
        {
            Type = value['Type'] || value['type'];
            value = value['value'];
        }

        if (!Type)
        {
            Type = this.GetTypeByValue(value);
        }

        if (isString(Type))
        {
            Type = this.GetType(Type);
        }

        if (isFunction(Type))
        {
            return new Type(name, value);
        }

        return null;
    }

    /**
     * Registers a parameter type
     * @param {string} name
     * @param {Function} Constructor
     * @returns {boolean}
     */
    RegisterType(name, Constructor)
    {
        return Tw2Store.SetStoreItem(this, 'type', name, Constructor, isFunction);
    }

    /**
     * Registers parameter types from an object or array of objects
     * @param {{string: Function}|[{string:Function}]} obj
     * @returns {boolean}
     */
    RegisterTypes(obj)
    {
        return Tw2Store.RegisterFromObject(this, 'RegisterType', obj);
    }

    /**
     * Checks if a schema exists
     * @param {string} name
     * @returns {boolean}
     */
    HasSchema(name)
    {
        return (name && name in this._schema);
    }


    /**
     * Gets a schema by it's name
     * @param {string} name
     * @returns {?string}
     */
    GetSchema(name)
    {
        return Tw2Store.GetStoreItem(this, 'schema', name);
    }

    /**
     * Registers a schema
     * @param {string} name
     * @param {string} schema
     * @returns {boolean}
     */
    RegisterSchema(name, schema)
    {
        return Tw2Store.SetStoreItem(this, 'schema', name, schema, a =>
        {
            return a && a.constructor.name === 'Tw2Schema';
        });
    }

    /**
     * Registers schemas from an object or an array of objects
     * @param {{string:string}|Array<{string:string}>} obj
     * @returns {boolean}
     */
    RegisterSchemas(obj)
    {
        return Tw2Store.RegisterFromObject(this, 'RegisterSchema', obj);
    }

    /**
     * Registers store values
     * @param {{}} [opt={}]
     * @param {boolean} [opt.uuid]
     * @param {*} opt.paths
     * @param {*} opt.dynamicPaths
     * @param {*} opt.types
     * @param {*} opt.constructors
     * @param {*} opt.extensions
     * @param {*} opt.variables
     * @param {*} opt.schemas
     */
    Register(opt = {})
    {
        if ('uuid' in opt) enableUUID(opt.uuid);
        this.RegisterPaths(opt.paths);
        this.RegisterDynamicPaths(opt.dynamicPaths);
        this.RegisterTypes(opt.types);
        this.RegisterConstructors(opt.constructors);
        this.RegisterExtensions(opt.extensions);
        this.RegisterVariables(opt.variables);
        this.RegisterSchemas(opt.schemas);
    }

    /**
     * Gets a value from a store
     * - Records missing keys for debugging
     * @param {Tw2Store} store
     * @param {string} type
     * @param {string} key
     * @returns {?*}
     */
    static GetStoreItem(store, type, key)
    {
        const storeSet = store['_' + type];
        if (storeSet && isString(key))
        {
            if (key in storeSet)
            {
                return storeSet[key];
            }

            if (!store._missing[type])
            {
                store._missing[type] = [];
            }

            if (!store._missing[type].includes(key))
            {
                store._missing[type].push(key);
            }

            store.emit('missing', {
                type, key,
                log: {
                    type: 'debug',
                    title: store.name,
                    message: `Missing ${type}: "${key}"`
                }
            });
        }

        return null;
    }

    /**
     * Sets a store value
     * @param {Tw2Store} store
     * @param {string} type
     * @param {string} key
     * @param {*} value
     * @param {Function} [validator]
     * @returns {boolean} true if successful
     */
    static SetStoreItem(store, type, key = '', value, validator)
    {
        if (validator && !validator(value))
        {
            store.emit('error', {
                type, key, value,
                log: {
                    type: 'error',
                    title: store.name,
                    message: `Invalid ${type}: "${key}"`,
                }
            });
            return false;
        }

        const storeSet = store['_' + type];
        if (storeSet && isString(key) && !isUndefined(value))
        {
            const oldValue = storeSet[key];
            storeSet[key] = value;
            store.emit('registered', {
                type, key, value, oldValue,
                log: {
                    type: 'debug',
                    title: store.name,
                    message: `${oldValue ? 'Re-registered' : 'Registered'} ${type} "${key}"`
                }
            });
            return true;
        }
        return false;
    }

    /**
     * Converts an object or array of objects into single function calls
     * @param {Tw2Store} store
     * @param {string} funcName
     * @param {Array|Object} obj
     * @returns {boolean}
     */
    static RegisterFromObject(store, funcName, obj)
    {
        if (obj && funcName in store)
        {
            obj = toArray(obj);
            for (let i = 0; i < obj.length; i++)
            {
                for (let key in obj[i])
                {
                    if (obj[i].hasOwnProperty(key))
                    {
                        store[funcName](key, obj[i][key]);
                    }
                }
            }
            return true;
        }
        return false;
    }
}

export const store = new Tw2Store();