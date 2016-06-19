/* global node:false */

module.exports = function(grunt)
{
    'use strict';

    var sourceFiles = [
        'core/Tw2EventEmitter.js',
        'core/Tw2Frustum.js',
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
        'core/Tw2CurveSet.js',
        'core/Tw2ValueBinding.js',
        'core/Tw2Float.js',
        'core/Tw2RuntimeInstanceData.js',

        'core/Tw2PostProcess.js',

        'curves/Tw2ColorCurve.js',
        'curves/Tw2ColorCurve2.js',
        'curves/Tw2ColorSequencer.js',
        'curves/Tw2EulerRotation.js',
        'curves/Tw2EventCurve.js',
        'curves/Tw2PerlinCurve.js',
        'curves/Tw2QuaternionSequencer.js',
        'curves/Tw2RandomConstantCurve.js',
        'curves/Tw2RGBAScalarSequencer.js',
        'curves/Tw2RigidOrientation.js',
        'curves/Tw2RotationCurve.js',
        'curves/Tw2ScalarCurve.js',
        'curves/Tw2ScalarCurve2.js',
        'curves/Tw2ScalarSequencer.js',
        'curves/Tw2SineCurve.js',
        'curves/Tw2TransformTrack.js',
        'curves/Tw2Vector2Curve.js',
        'curves/Tw2Vector3Curve.js',
        'curves/Tw2VectorCurve.js',
        'curves/Tw2VectorSequencer.js',
        'curves/Tw2XYZScalarSequencer.js',
        'curves/Tw2YPRSequencer.js',
        'curves/Tw2MayaAnimationEngine.js',
        'curves/Tw2MayaScalarCurve.js',
        'curves/Tw2MayaVector3Curve.js',
        'curves/Tw2MayaEulerRotationCurve.js',
        'curves/Tw2QuaternionCurve.js',
        'curves/Tw2WbgTrack.js',

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
        'eve/EveEffectRoot.js',
        'eve/EveStretch.js',
        'eve/EveTurretFiringFX.js',
        'eve/EveSOF.js',
        'eve/EveCurveLineSet.js',
        'eve/EveMeshOverlayEffect.js',
        'eve/EveChildMesh.js',
        'eve/EveChildExplosion.js',
        'eve/EveMissile.js',
        'eve/EveMissileWarhead.js',

        'particle/Tw2ParticleSystem.js',
        'core/Tw2InstancedMesh.js',
        'particle/Tw2StaticEmitter.js',
        'particle/Tw2DynamicEmitter.js',
        'particle/Tw2RandomUniformAttributeGenerator.js',
        'particle/Tw2SphereShapeAttributeGenerator.js',
        'particle/Tw2ParticleSpring.js',
        'particle/Tw2ParticleDragForce.js',
        'particle/Tw2ParticleTurbulenceForce.js',
        'particle/Tw2ParticleDirectForce.js',
        'particle/Tw2ParticleAttractorForce.js',
        'particle/Tw2ParticleFluidDragForce.js',
        'particle/Tw2RandomIntegerAttributeGenerator.js'
    ];

    // Extra files to include in beautification
    var beautifierInclude = [
        'GruntFile.js',
        'src/ccpwgl.js',
        'src/ccpwgl_int.js',
    ]

    // Files to exclude from beautification
    var beautifierExclude = [
        'src/core/Tw2Device.js',
        'src/eve/EveSOF.js'
    ];

    // Creates a list of files to beautify
    var beautifierList = sourceFiles
        .map(
            function(entry)
            {
                return 'src/' + entry;
            })
        .filter(
            function(src)
            {
                return (beautifierExclude.indexOf(src) === -1)
            })
        .concat(beautifierInclude)

    var sourcePatterns = ['src/core/**/*.js', 'src/eve/**/*.js', 'src/particle/**/*.js', 'src/curves/**/*.js'];

    grunt.initConfig(
    {
        pkg: grunt.file.readJSON('package.json'),

        jsbeautifier:
        {

            standard:
            {
                src: beautifierList,
                options:
                {
                    js: grunt.file.readJSON('.jsbeautifyrc')
                }
            },

            cc:
            {
                src: 'src/ccpwgl_int.js',
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
                    'src/ccpwgl_int.min.js': sourceFiles.map(
                        function(entry)
                        {
                            return 'src/' + entry;
                        })
                },
                options:
                {
                    wrap: 'ccpwgl_int',
                    exportAll: true,
                    mangle: false,
                    banner: '/* <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */ \n\n',
                    compress:
                    {
                        sequences: true,
                        unsafe: true
                    }
                }
            }
        },

        concat:
        {
            lib:
            {
                src: sourceFiles.map(
                    function(entry)
                    {
                        return 'src/' + entry;
                    }).concat('.exports'),
                dest: 'src/ccpwgl_int.js',
                options:
                {
                    banner: '/* <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */ \n\nvar ccpwgl_int = (function()\n{\n',
                    footer: '\n})();'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-jsbeautifier');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.registerTask('format', ['jsbeautifier']);
    grunt.registerTask('lint', ['jshint']);
    grunt.registerTask('min', ['uglify']);
    grunt.registerTask('cc', ['concat', 'jsbeautifier:cc']);
    grunt.registerTask('dist', ['cc', 'min']);
    grunt.registerTask('default', ['dist']);

};
