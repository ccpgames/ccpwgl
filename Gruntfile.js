/* global node:false */
var exp = require('./src/exports');

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

    var gl3 = [
        'math/gl3.js',
        'math/vec3.js',
        'math/vec4.js',
        'math/mat3.js',
        'math/quat.js',
        'math/mat4.js',
        'math/vec2.js',
        'math/ext.js',
        'math/box.js',
        'math/sph.js',
        'math/tri.js',
        'math/ray.js'
    ];

    var sourcePatterns = ['src/core/**/*.js', 'src/eve/**/*.js', 'src/particle/**/*.js', 'src/curves/**/*.js', 'src/math/**/*.js'];

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
        .concat(beautifierInclude);


    grunt.initConfig(
    {
        pkg: grunt.file.readJSON('package.json'),

        jsbeautifier:
        {
            // Beautifies core library files (except for those on the exclusion list)
            standard:
            {
                src: beautifierList,
                options:
                {
                    js: grunt.file.readJSON('.jsbeautifyrc')
                }
            },

            // Beautifies just the ccpwgl_int.js file
            cc:
            {
                src: 'dist/ccpwgl_int.js',
                options:
                {
                    js: grunt.file.readJSON('.jsbeautifyrc')
                }
            },

            // Beautifies just the gl matrix files
            gl3:
            {
                src: gl3.map(
                    function(entry)
                    {
                        return 'src/' + entry;
                    }),
                options:
                {
                    js: grunt.file.readJSON('.jsbeautifyrc')
                }
            },
        },

        jshint:
        {
            options:
            {
                jshintrc: './.jshintrc'
            },
            all: ['Gruntfile.js', 'src/ccpwgl.js']
                .concat(sourcePatterns)
                .concat(gl3)
        },

        uglify:
        {
            // Creates the minified core library 'dist/ccpwgl_int.min.js' file
            lib:
            {
                files:
                {
                    'dist/ccpwgl_int.min.js': sourceFiles.map(
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
            },

            // Creates the minified gl matrix 'dist/ccpwgl_gl3.min.js' file
            gl3:
            {
                files:
                {
                    'dist/ccpwgl_gl3.min.js': gl3.map(
                        function(entry)
                        {
                            return 'src/' + entry;
                        })
                },
                options:
                {
                    exportAll: true,
                    mangle: true,
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
            // Creates the core library 'dist/ccpwgl_int.js' file
            lib:
            {
                src: sourceFiles.map(
                    function(entry)
                    {
                        return 'src/' + entry;
                    }).concat(exp.es5),
                dest: 'dist/ccpwgl_int.js',
                options:
                {
                    banner: '/* <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */ \n\nvar ccpwgl_int = (function()\n{\n',
                    footer: '\n})();'
                }
            },

            // Creates the gl matrix 'dist/ccpwgl_gl3.js' file
            gl3:
            {
                src: gl3.map(
                    function(entry)
                    {
                        return 'src/' + entry;
                    }),
                dest: 'dist/ccpwgl_gl3.js',
                options:
                {
                    banner: '/* <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */ \n\n'
                }
            },

            // Creates the core library 'dist/ccpwgl_int.es6' file with es6 imports and exports
            lib_es6:
            {
                src: sourceFiles.map(
                    function(entry)
                    {
                        return 'src/' + entry;
                    }).concat(exp.es6),
                dest: 'dist/ccpwgl_int.es6',
                options:
                {
                    banner: "/* <%= pkg.name %> <%= grunt.template.today('yyyy-mm-dd') %> */ \n\nimport { gl3, vec2, vec3, vec4, quat, mat3, mat4 } from './ccpwgl_gl3.es6'\n\n",
                    footer: exp.es6
                }
            },

            // Creates the gl matrix 'dist/ccpwgl_gl3.es6' file with es6 exports
            gl3_es6:
            {
                src: gl3.map(
                    function(entry)
                    {
                        return 'src/' + entry;
                    }),
                dest: 'dist/ccpwgl_gl3.es6',
                options:
                {
                    banner: '/* <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */ \n\n',
                    footer: '\n\nexport { gl3, vec2, vec3, vec4, quat, mat3, mat4 };'
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
    grunt.registerTask('es6', ['concat:lib_es6', 'concat:gl3_es6']);
    grunt.registerTask('cc', ['concat:lib', 'jsbeautifier:cc']);
    grunt.registerTask('gl3', ['jsbeautifier:gl3', 'concat:gl3']);
    grunt.registerTask('dist', ['cc', 'gl3', 'min', 'es6']);
    grunt.registerTask('default', ['dist']);

};
