/**
 * Tw2GeometryModel
 *
 * @property {string} name
 * @property {Array.<Tw2GeometryMeshBinding>} meshBindings
 * @property {Tw2GeometrySkeleton} skeleton
 */
export class Tw2GeometryModel
{

    name = '';
    meshBindings = [];
    skeleton = null;


    /**
     * Finds a bone by it's name
     * @param {string} name
     * @returns {Tw2GeometryBone|null}
     */
    FindBoneByName(name)
    {
        if (!this.skeleton)
        {
            return null;
        }

        for (let i = 0; i < this.skeleton.bones.length; ++i)
        {
            if (this.skeleton.bones[i].name === name)
            {
                return this.skeleton.bones[i];
            }
        }

        return null;
    }

}
