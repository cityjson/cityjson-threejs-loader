import { Color,
		 ShaderLib,
		 ShaderMaterial,
		 UniformsUtils } from "three";
import 'three/examples/jsm/lines/LineMaterial';
import { CityObjectsBaseMaterial } from "./CityObjectsBaseMaterial";

export class CityObjectsLineMaterial extends CityObjectsBaseMaterial {

	constructor( parameters ) {

		const shader = ShaderLib[ 'line' ];

		const newShader = { ...shader };
		newShader.uniforms = {
			objectColors: { value: [] },
			surfaceColors: { value: [] },
			showLod: { value: - 1 },
			highlightedObjId: { value: - 1 },
			highlightedGeomId: { value: - 1 },
			highlightedBoundId: { value: - 1 },
			highlightColor: { value: new Color( 0xFFC107 ).convertSRGBToLinear() },
			...UniformsUtils.clone( shader.uniforms ),
		};
		newShader.extensions = {
			derivatives: true,
		};
		newShader.lights = false;
		newShader.vertexShader =
		`
		uniform vec3 objectColors[ 110 ];
		uniform vec3 highlightColor;
		uniform float highlightedObjId;
		uniform float highlightedGeomId;
		uniform float highlightedBoundId;
		uniform float showLod;

		#ifdef SHOW_SEMANTICS

			uniform vec3 surfaceColors[ 110 ];

		#endif

		attribute float objectid;
		attribute float geometryid;
		attribute float boundaryid;
		attribute float lodid;
		attribute int type;
		attribute int surfacetype;

		varying vec3 diffuse_;
		varying float discard_;
		` +
		newShader.vertexShader.replace(
			/#include <fog_vertex>/,
			`
			#include <fog_vertex>

			vec3 color_;
			
			#ifdef SHOW_SEMANTICS

				color_ = surfacetype > -1 ? surfaceColors[surfacetype] : objectColors[type];
			
			#else

				color_ = objectColors[type];
			
			#endif

			#ifdef SELECT_SURFACE

				diffuse_ = abs( objectid - highlightedObjId ) < 0.5 && abs( geometryid - highlightedGeomId ) < 0.5 && abs( boundaryid - highlightedBoundId ) < 0.5 ? highlightColor : color_;

			#else

				diffuse_ = abs( objectid - highlightedObjId ) < 0.5 ? highlightColor : color_;
			
			#endif

			#ifdef SHOW_LOD

			if ( abs ( lodid - showLod ) > 0.5 ) {
				discard_ = 1.0;
			}

			#endif
			`
		);
		newShader.fragmentShader =
		`
			varying vec3 diffuse_;
			varying float discard_;
		` +
		newShader.fragmentShader.replace(
			/vec4 diffuseColor = vec4\( diffuse, alpha \);/,
			`
			vec4 diffuseColor = vec4( diffuse_, alpha );

			if ( discard_ > 0.0 ) {
				discard;
			}
			`
		);

		super( newShader );

		Object.defineProperties( this, {

			color: {

				enumerable: true,

				get: function () {

					return this.uniforms.diffuse.value;

				},

				set: function ( value ) {

					this.uniforms.diffuse.value = value;

				}

			},

			worldUnits: {

				enumerable: true,

				get: function () {

					return 'WORLD_UNITS' in this.defines;

				},

				set: function ( value ) {

					if ( value === true ) {

						this.defines.WORLD_UNITS = '';

					} else {

						delete this.defines.WORLD_UNITS;

					}

				}

			},

			linewidth: {

				enumerable: true,

				get: function () {

					return this.uniforms.linewidth.value;

				},

				set: function ( value ) {

					this.uniforms.linewidth.value = value;

				}

			},

			dashed: {

				enumerable: true,

				get: function () {

					return Boolean( 'USE_DASH' in this.defines );

				},

				set( value ) {

					if ( Boolean( value ) !== Boolean( 'USE_DASH' in this.defines ) ) {

						this.needsUpdate = true;

					}

					if ( value === true ) {

						this.defines.USE_DASH = '';

					} else {

						delete this.defines.USE_DASH;

					}

				}

			},

			dashScale: {

				enumerable: true,

				get: function () {

					return this.uniforms.dashScale.value;

				},

				set: function ( value ) {

					this.uniforms.dashScale.value = value;

				}

			},

			dashSize: {

				enumerable: true,

				get: function () {

					return this.uniforms.dashSize.value;

				},

				set: function ( value ) {

					this.uniforms.dashSize.value = value;

				}

			},

			dashOffset: {

				enumerable: true,

				get: function () {

					return this.uniforms.dashOffset.value;

				},

				set: function ( value ) {

					this.uniforms.dashOffset.value = value;

				}

			},

			gapSize: {

				enumerable: true,

				get: function () {

					return this.uniforms.gapSize.value;

				},

				set: function ( value ) {

					this.uniforms.gapSize.value = value;

				}

			},

			opacity: {

				enumerable: true,

				get: function () {

					return this.uniforms.opacity.value;

				},

				set: function ( value ) {

					this.uniforms.opacity.value = value;

				}

			},

			resolution: {

				enumerable: true,

				get: function () {

					return this.uniforms.resolution.value;

				},

				set: function ( value ) {

					this.uniforms.resolution.value.copy( value );

				}

			},

			alphaToCoverage: {

				enumerable: true,

				get: function () {

					return Boolean( 'USE_ALPHA_TO_COVERAGE' in this.defines );

				},

				set: function ( value ) {

					if ( Boolean( value ) !== Boolean( 'USE_ALPHA_TO_COVERAGE' in this.defines ) ) {

						this.needsUpdate = true;

					}

					if ( value === true ) {

						this.defines.USE_ALPHA_TO_COVERAGE = '';
						this.extensions.derivatives = true;

					} else {

						delete this.defines.USE_ALPHA_TO_COVERAGE;
						this.extensions.derivatives = false;

					}

				}

			}

		} );

		this.setValues( parameters );

	}

}
