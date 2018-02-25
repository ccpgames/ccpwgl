import {util} from '../math';
import {resMan} from './Tw2ResMan';
import {emitter} from './Tw2EventEmitter';

/**
 * Tw2VariableStore
 * 
 * @property {Object.< string, Parameter>} _variables
 * @property {Object.< string, Function>} _types
 * @class
 */
class Tw2VariableStore
{
    constructor()
    {
        this._variables = {};
        this._types = {};
    }

    /**
     * Gets a variable by it's name
     * @param {string} name
     * @returns {?Parameter}
     */
    GetVariable(name)
    {
        return name && name in this._variables ? this._variables[name] : null;
    }

    /**
     * Checks if a variable of a given name exists
     * @param {string} name
     * @returns {boolean}
     */
    HasVariable(name)
    {
        return name && name in this._variables;
    }

    /**
     * Gets a type by it's name
     * @param {string} name
     * @returns {?Function}
     */
    GetType(name)
    {
        name = name.toLowerCase();
        return name && name in this._types ? this._types[name] : null;
    }

    /**
     * Gets a type by value
     * @param {*} value
     * @returns {?Function}}
     */
    GetTypeFromValue(value)
    {
        for (let type in this._types)
        {
            if (this._types.hasOwnProperty(type))
            {
                const Type = this._types[type];
                if (Type.is && Type.is(value)) return Type;
            }
        }
        return null;
    }

    /**
     * Creates A Tw2 parameter from a supplied value and/or Type
     * @param {string} name
     * @param {*} [value]
     * @param {string|Function} [Type]
     * @returns {?Parameter}
     */
    CreateType(name, value, Type)
    {
        if (Type)
        {
            if (typeof Type === 'string')
            {
                Type = this.GetType(Type);
            }
        }
        else
        {
            Type = this.GetTypeFromValue(value);
        }

        return Type ? new Type(name, value) : null;
    }

    /**
     * Registers a variable if it hasn't already been registered
     * @param {string} name
     * @param {*} value
     * @param {Function} [Type]
     * @returns {?Parameter} The parameter registered with the given name
     */
    RegisterVariable(name, value, Type)
    {
        if (!this.HasVariable(name))
        {
            const variable = this.CreateType(name, value, Type);
            if (variable)
            {
                this._variables[name] = variable;
                emitter.log('store.registered', {
                    log: 'debug',
                    msg: 'Registered Variable: ' + name
                });
            }
        }

        return name in this._variables ? this._variables[name] : null;
    }

    /**
     * Registers a variable type if it hasn't already been registered
     * @param {string} name
     * @param {Function} Constructor
     * @returns {?Function} The type registered with the given name
     */
    RegisterType(name, Constructor)
    {
        name = name.toLowerCase();
        if (name && typeof Constructor === 'function' && !this._types[name])
        {
            this._types[name] = Constructor;
            emitter.log('store.registered', {
                log: 'debug',
                msg: 'Registered Type: ' + name
            });
        }
        return name in this._types ? this._types[name] : null;
    }

    /**
     * Registers variables from an object or array of objects
     * @param {{string:*}} obj
     */
    RegisterVariables(obj)
    {
        Tw2VariableStore.toKeyValue(this, 'RegisterVariable', obj);
    }

    /**
     * Registers variable Types
     * @param {{string: Function}} obj
     */
    RegisterTypes(obj)
    {
        Tw2VariableStore.toKeyValue(this, 'RegisterType', obj);
    }

    /**
     * Register
     * @param {*} [opt={}]
     */
    Register(opt)
    {
        if (opt)
        {
            if (opt['uuid'])
            {
                util.generateID = util.generateUUID;
            }

            this.RegisterTypes(opt.types);
            this.RegisterVariables(opt.variables);

            resMan.Register(opt);
        }
    }

    /**
     * Passes key:values from an object or array of objects to an internal function
     * @param {*} target
     * @param {string} funcName
     * @param {Array|{}} obj
     * @returns {boolean}
     */
    static toKeyValue(target, funcName, obj)
    {
        if (obj && funcName && funcName in target)
        {
            obj = Array.isArray(obj) ? obj : [obj];
            for (let i = 0; i < obj.length; i++)
            {
                for (let key in obj[i])
                {
                    if (obj[i].hasOwnProperty(key))
                    {
                        target[funcName](key, obj[i][key]);
                    }
                }
            }
        }
    }
}

export const store = new Tw2VariableStore();

