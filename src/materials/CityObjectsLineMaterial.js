import { ShaderChunk, ShaderLib,
		 UniformsLib,
		 UniformsUtils } from "three";
import 'three/examples/jsm/lines/LineMaterial';
import { CityObjectsBaseMaterial } from "./CityObjectsBaseMaterial";

export class CityObjectsLineMaterial extends CityObjectsBaseMaterial {

	constructor( parameters ) {

		const shader = ShaderLib[ 'line' ];

		const newShader = { ...shader };
		newShader.uniforms = {
			...UniformsLib.cityobject,
			...UniformsUtils.clone( shader.uniforms ),
		};
		newShader.extensions = {
			derivatives: true,
		};
		newShader.lights = false;
		newShader.vertexShader =
		ShaderChunk.cityobjectinclude_vertex +
		newShader.vertexShader.replace(
			/#include <fog_vertex>/,
			`
			#include <fog_vertex>
			`
			+ ShaderChunk.cityobjectdiffuse_vertex
			+ ShaderChunk.cityobjectshowlod_vertex
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

			#ifdef SHOW_LOD

				if ( discard_ > 0.0 ) {
					discard;
				}
			
			#endif
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
