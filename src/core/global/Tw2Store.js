import {util} from '../../math';
import {emitter} from './Tw2Logger';

/**
 * Stores engine data
 *
 * @property {Object.< string, string>} _paths
 * @property {Object.< string, Array<string>>} _dynamicPaths
 * @property {Object.< string, Tw2Parameter>} _variables
 * @property {Object.< string, Function>} _types
 * @property {Object.< string, Function>} _extensions
 * @property {Object.< string, Function>} _constructors
 * @property {Object.< string, Array<string>>} _missing
 * @class
 */
class Tw2Store
{
    constructor()
    {
        this._types = {};
        this._paths = {};
        this._variables = {};
        this._extensions = {};
        this._constructors = {};
        this._dynamicPaths = {};
        this._missing = {};
    }

    /**
     * Checks if a resource path exists
     * @param {string} prefix
     * @returns {boolean}
     */
    HasPath(prefix)
    {
        return (prefix && prefix in this._paths);
    }


    /**
     * Gets a path by it's prefix
     * @param {string} prefix
     * @returns {?string}
     */
    GetPath(prefix)
    {
        return Tw2Store.GetStoreItem(this, 'paths', prefix);
    }

    /**
     * Registers a resource path
     * @param {string} prefix
     * @param {string} path
     * @returns {boolean}
     */
    RegisterPath(prefix, path)
    {
        return !!Tw2Store.SetStoreItem(this, 'paths', prefix, path);
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
        return (prefix && prefix in this._dynamicPaths);
    }

    /**
     * Gets a dynamic path by it's prefix
     * @param {string} prefix
     * @returns {?Array<string>}
     */
    GetDynamicPath(prefix)
    {
        return Tw2Store.GetStoreItem(this, 'dynamicPaths', prefix);
    }

    /**
     * Registers a dynamic path
     * @param {string} prefix
     * @param {string[]} paths
     * @returns {boolean}
     */
    RegisterDynamicPath(prefix, paths)
    {
        return !!Tw2Store.SetStoreItem(this, 'dynamicPaths', prefix, paths);
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
        return (ext && ext in this._extensions);
    }

    /**
     * Gets a resource extension by name
     * @param {string} ext
     * @returns {?Function}
     */
    GetExtension(ext)
    {
        return Tw2Store.GetStoreItem(this, 'extensions', ext);
    }

    /**
     * Registers a resource extension
     * @param {name} ext
     * @param {Function} Constructor
     * @returns {boolean}
     */
    RegisterExtension(ext, Constructor)
    {
        if (typeof Constructor === 'function')
        {
            return !!Tw2Store.SetStoreItem(this, 'extensions', ext, Constructor);
        }
        return false;
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
        return (name && name in this._constructors);
    }

    /**
     * Gets a library constructor by name
     * @param {string} name
     * @returns {?Function}
     */
    GetConstructor(name)
    {
        return Tw2Store.GetStoreItem(this, 'constructors', name);
    }

    /**
     * Registers library constructors
     * @param {string} name
     * @param {Function} Constructor
     * @returns {boolean}
     */
    RegisterConstructor(name, Constructor)
    {
        if (typeof Constructor === 'function')
        {
            return !!Tw2Store.SetStoreItem(this, 'constructors', name, Constructor);
        }
        return false;
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
        return (name && name in this._variables);
    }

    /**
     * Gets a variable by name
     * @param {string} name
     * @returns {?*}
     */
    GetVariable(name)
    {
        return Tw2Store.GetStoreItem(this, 'variables', name);
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
     * @param {*|{value:*, type: string|Function}} [value]
     * @param {string|Function} [Type]
     * @returns {?*}
     */
    RegisterVariable(name, value, Type)
    {
        const variable = this.CreateType(name, value, Type);
        return Tw2Store.SetStoreItem(this, 'variables', name, variable);
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
        return Tw2Store.GetStoreItem(this, 'types', name);
    }

    /**
     * Checks if a type exists
     * @param {string} name
     * @returns {boolean}
     */
    HasType(name)
    {
        return (name && name in this._types);
    }

    /**
     * Gets a type by value
     * @param {*} value
     * @returns {?Function}
     */
    GetTypeByValue(value)
    {
        for (let type in this._types)
        {
            if (this._types.hasOwnProperty(type) && 'is' in this._types[type])
            {
                if (this._types[type]['is'](value)) return this._types[type];
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
        if (value && value.constructor.name === 'Object')
        {
            Type = value['Type'] || value['type'];
            value = value['value'];
        }

        if (!Type)
        {
            Type = this.GetTypeByValue(value);
        }
        else if (typeof Type === 'string')
        {
            Type = this.GetType(Type);
        }

        if (typeof Type === 'function')
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
        if (typeof Constructor === 'function')
        {
            return !!Tw2Store.SetStoreItem(this, 'types', name, Constructor);
        }
        return false;
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
     * Registers store values
     * @param {{}} [opt={}]
     * @param {boolean} [opt.uuid]
     * @param {*} opt.paths
     * @param {*} opt.dynamicPaths
     * @param {*} opt.types
     * @param {*} opt.constructors
     * @param {*} opt.extensions
     * @param {*} opt.variables
     */
    Register(opt = {})
    {
        if ('uuid' in opt) util.enableUUID(opt.uuid);
        this.RegisterPaths(opt.paths);
        this.RegisterDynamicPaths(opt.dynamicPaths);
        this.RegisterTypes(opt.types);
        this.RegisterConstructors(opt.constructors);
        this.RegisterExtensions(opt.extensions);
        this.RegisterVariables(opt.variables);
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
        if (typeof key === 'string')
        {
            const
                storeSet = store[`_${type}`],
                singular = type.substring(0, type.length - 1);

            if (storeSet)
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

                    emitter.log('store.warning', {
                        log: 'warning',
                        msg: `Missing ${singular}: '${key}'`
                    });
                }
            }
        }

        return null;
    }

    /**
     * Sets a store value
     * @param {Tw2Store} store
     * @param {string} type
     * @param {string} key
     * @param {*} value
     */
    static SetStoreItem(store, type, key = '', value)
    {
        if (typeof key === 'string' && value !== undefined)
        {
            const storeSet = store[`_${type}`];
            if (storeSet)
            {
                const
                    existing = storeSet[key],
                    singular = type.substring(0, type.length - 1);

                storeSet[key] = value;

                if (!existing)
                {
                    emitter.log('store.registered', {
                        log: 'debug',
                        msg: `Registered ${singular}: '${key}'`,
                        hide: true
                    });
                }
                else
                {
                    emitter.log('store.registered', {
                        log: 'debug',
                        msg: `Re-registered ${singular}: '${key}'`,
                        data: {
                            old_value: existing,
                            new_value: value
                        }
                    });
                }

                return value;
            }
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
            obj = Array.isArray(obj) ? obj : [obj];
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