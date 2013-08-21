/* global node:false */

module.exports = function(grunt)
{
    'use strict';

    var sourceFiles = [
        'core/Tw2RawData.js',
        'core/Tw2BinaryReader.js',
        'core/Tw2VertexDeclaration.js',
        'core/Tw2ObjectReader.js',
        'core/Tw2Resource.js',
        'core/Tw2VariableStore.js',
        'core/Tw2ResMan.js',
        'core/Tw2PerObjectData.js',
        'core/Tw2SamplerState.js',
        'core/Tw2FloatParameter.js',

        'core/Tw2Vector2Parameter.js',
        'core/Tw2Vector3Parameter.js',
        'core/Tw2Vector4Parameter.js',
        'core/Tw2MatrixParameter.js',
        'core/Tw2VariableParameter.js',
        'core/Tw2TextureParameter.js',
        'core/Tw2TransformParameter.js',
        'core/Tw2Device.js',
        'core/Tw2BatchAccumulator.js',
        'core/Tw2GeometryRes.js',
        'core/Tw2TextureRes.js',
        'core/Tw2EffectRes.js',
        'core/Tw2Effect.js',
        'core/Tw2Mesh.js',
        'core/Tw2AnimationController.js',
        'core/Tw2RenderTarget.js',
        'core/Tw2PostProcess.js',

        'eve/EveLocator.js',
        'eve/EveBoosterSet.js',
        'eve/EveSpriteSet.js',
        'eve/EveSpotlightSet.js',
        'eve/EvePlaneSet.js',
        'eve/EveTransform.js',
        'eve/EveTurretSet.js',
        'eve/EveSpaceObject.js',
        'eve/EveShip.js',
        'eve/EveSpaceObjectDecal.js',
        'eve/EveSpaceScene.js',
        'eve/EveOccluder.js',
        'eve/EveLensflare.js',
        'eve/EvePlanet.js',

        'core/Tw2PostProcess.js',

        'particle/Tw2ParticleSystem.js',
        'core/Tw2InstancedMesh.js',
        'particle/Tw2StaticEmitter.js',
        'particle/Tw2DynamicEmitter.js',
        'particle/Tw2RandomUniformAttributeGenerator.js',
        'particle/Tw2SphereShapeAttributeGenerator.js',
        'particle/Tw2ParticleSpring.js',
        'particle/Tw2ParticleDragForce.js',
        'particle/Tw2ParticleTurbulenceForce.js',
        'particle/Tw2ParticleDirectForce.js'
    ];

    var sourcePatterns = ['src/core/**/*.js', 'src/eve/**/*.js', 'src/particle/**/*.js'];

    grunt.initConfig(
    {
        pkg: grunt.file.readJSON('package.json'),

        jsbeautifier:
        {
            standard:
            {
                src: ['Gruntfile.js', 'src/ccpwgl.js'].concat(sourcePatterns),
                options:
                {
                    js: grunt.file.readJSON('.jsbeautifyrc')
                }
            }
        },

        jshint:
        {
            options:
            {
                jshintrc: './.jshintrc'
            },
            all: ['Gruntfile.js', 'src/ccpwgl.js'].concat(sourcePatterns)
        },

        uglify:
        {
            lib:
            {
                files:
                {
                    'src/ccpwgl_int.js': sourceFiles.map(function(entry)
                    {
                        return 'src/' + entry;
                    })
                },
                options:
                {
                    wrap: 'ccpwgl_int',
                    exportAll: true,
                    mangle: false,
                    compress:
                    {
                        sequences: true,
                        unsafe: true
                    }
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-jsbeautifier');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('format', ['jsbeautifier']);
    grunt.registerTask('lint', ['jshint']);
    grunt.registerTask('compile', ['uglify']);
    grunt.registerTask('default', ['format', 'compile']);
};
