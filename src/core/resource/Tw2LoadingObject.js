import {resMan, logger} from '../../global';
import {Tw2Resource} from './Tw2Resource';
import {Tw2ObjectReader} from '../reader/Tw2ObjectReader';

/**
 * Tw2LoadingObject
 *
 * @property {string} _redContents          - object's .red file xml contents
 * @property {Number} _inPrepare            - the amount of child objects to prepare
 * @property {Array.<Object>} _objects      - the child objects to prepare
 * @property {Tw2ObjectReader} _constructor - A function for constructing child objects
 * @class
 */
export class Tw2LoadingObject extends Tw2Resource
{
    constructor()
    {
        super();
        this._redContents = null;
        this._inPrepare = null;
        this._objects = [];
        this._constructor = null;
    }

    /**
     * Adds a child object
     * @param {Object} object
     * @param {Function} callback
     * @returns {Object}
     */
    AddObject(object, callback)
    {
        object._loadCallback = callback;
        this._objects.push(object);
        return object;
    }

    /**
     * Prepare
     * @param text
     */
    Prepare(text)
    {
        if (!Tw2ObjectReader.IsValidXML(text))
        {
            logger.log('res.error', {
                log: 'error',
                src: ['Tw2LoadingObject', 'Prepare'],
                msg: 'Invalid XML',
                path: this.path,
                type: 'xml.invalid',
            });
            this.PrepareFinished(false);
            return;
        }

        if (this._inPrepare === null)
        {
            this._redContents = text;
            this._constructor = new Tw2ObjectReader(this._redContents);
            this._inPrepare = 0;
        }

        while (this._inPrepare < this._objects.length)
        {
            try
            {
                this._objects[this._inPrepare]._loadCallback(this._constructor.Construct());
            }
            catch (e)
            {
                logger.log('res.error', {
                    log: 'error',
                    src: ['Tw2LoadingObject', 'Prepare'],
                    msg: 'Error preparing resource',
                    path: this.path,
                    type: 'prepare',
                    err: e
                });
            }

            this._inPrepare++;
        }

        resMan.motherLode.Remove(this.path);
        this.PrepareFinished(true);
    }
}

/**
 * HTTP request response type
 * @type {string}
 */
Tw2LoadingObject.prototype.requestResponseType = 'arraybuffer';