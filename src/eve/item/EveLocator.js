import {mat4} from '../../global';

/**
 * Contains transform information for T3 Attachments, Boosters, Turrets and XLTurrets
 *
 * @property {string} name                  - The locator's name
 * @property {mat4} transform               - The locator's transform
 * @property {?number} atlasIndex0          - A booster locator's atlasIndex0
 * @property {?number} atlasIndex1          - A booster locator's atlasIndex1
 * @property {?Tw2Bone} bone                - A turret locator's bone
 */
export class EveLocator
{

    name = '';
    transform = mat4.create();
    atlasIndex0 = null;
    atlasIndex1 = null;
    bone = null;


    /**
     * Gets the locator's bone from an animation controller
     * @param {Tw2AnimationController} animationController
     * @returns {?Tw2Bone}
     */
    FindBone(animationController)
    {
        this.bone = null;
        const model = animationController.FindModelForMesh(0);
        if (model)
        {
            for (let i = 0; i < model.bones.length; ++i)
            {
                if (model.bones[i].boneRes.name === this.name)
                {
                    this.bone = model.bones[i];
                    break;
                }
            }
        }
        return this.bone;
    }

    /**
     * Locator name prefixes
     * @type {{AUDIO: string, ATTACH: string, BOOSTER: string, TURRET: string, XL_TURRET: string}}
     */
    static Prefix = {
        AUDIO: 'locator_audio',
        ATTACH: 'locator_attach',
        BOOSTER: 'locator_booster',
        TURRET: 'locator_turret',
        XL_TURRET: 'locator_xl'
    };

}