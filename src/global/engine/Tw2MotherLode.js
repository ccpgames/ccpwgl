/**
 * Manages loaded resources
 * 
 * @property {Object} _loadedObjects            - loaded resources
 * @property {{string:Array<eventLog>}} _errors - Not implemented yet
 * @class
 */
export class Tw2MotherLode
{
    constructor()
    {
        this._loadedObjects = {};
        this._errors = {};
    }

    /**
     * Adds an error log for a given path
     * @param {string} path
     * @param {eventLog} log
     */
    AddError(path, log)
    {
        this._errors[path] = this._errors[path] || [];
        if (!this._errors[path].includes(log))
        {
            this._errors[path].push(log);
        }
    }

    /**
     * Gets a path's error logs
     * @param {string} path
     * @returns {?Array<eventLog>}
     */
    GetErrors(path)
    {
        return path && path in this._errors ? Object.assign([], this._errors[path]) : null;
    }

    /**
     * Finds a loaded object by it's file path
     * @param {string} path
     * @returns {Tw2LoadingObject}
     */
    Find(path)
    {
        if (path in this._loadedObjects)
        {
            return this._loadedObjects[path];
        }
        return null;
    }

    /**
     * Adds a loaded object
     * @param {string} path
     * @param {Tw2LoadingObject} obj
     */
    Add(path, obj)
    {
        this._loadedObjects[path] = obj;
    }

    /**
     * Removes a loaded object by it's file path
     * @param {string} path
     */
    Remove(path)
    {
        delete this._loadedObjects[path];
    }

    /**
     * Clears the loaded object object
     */
    Clear()
    {
        this._loadedObjects = {};
    }

    /**
     * Unloads all loaded objects and then clears the loadedObject object
     */
    UnloadAndClear()
    {
        for (const path in this._loadedObjects)
        {
            if (this._loadedObjects.hasOwnProperty(path))
            {
                this._loadedObjects[path].Unload();
            }
        }
        this._loadedObjects = {};
    }

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
     * @param {Tw2Logger} logger
     */
    PurgeInactive(curFrame, frameLimit, frameDistance, logger)
    {
        for (const path in this._loadedObjects)
        {
            if (this._loadedObjects.hasOwnProperty(path))
            {
                const res = this._loadedObjects[path];
                if (!res.doNotPurge)
                {
                    if (res._isPurged)
                    {
                        logger.log('res.event', {
                            msg: 'Unloaded  ',
                            path: res.path,
                            type: 'purged'
                        });

                        delete this._loadedObjects[path];
                    }
                    if (res._isGood && (curFrame - res.activeFrame) % frameLimit >= frameDistance)
                    {
                        if (res.Unload())
                        {
                            logger.log('res.event', {
                                msg: 'Unloaded  ',
                                path: res.path,
                                type: 'unused'
                            });
                            delete this._loadedObjects[path];
                        }
                    }
                }
            }
        }
    }
}