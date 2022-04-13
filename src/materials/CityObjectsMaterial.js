import { ShaderChunk, UniformsLib, UniformsUtils } from "three";
import { CityObjectsBaseMaterial } from "./CityObjectsBaseMaterial";

export class CityObjectsMaterial extends CityObjectsBaseMaterial {

	constructor( shader, parameters ) {

		const newShader = { ...shader };
		newShader.uniforms = {
			...UniformsLib.cityobject,
			...UniformsUtils.clone( shader.uniforms ),
		};
		newShader.extensions = {
			derivatives: true,
		};
		newShader.lights = true;
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

			#ifdef TEXTURE_THEME

				uniform sampler2D cityTextures[ 32 ];

				flat in int vTexIndex;
				varying vec2 vTexUV;

			#endif
		` +
		newShader.fragmentShader.replace(
			/vec4 diffuseColor = vec4\( diffuse, opacity \);/,
			`
			vec4 diffuseColor = vec4( diffuse_, opacity );

			#ifdef TEXTURE_THEME

				vec4 tempDiffuseColor = vec4(1.0, 1.0, 1.0, 0.0);

				if ( vTexIndex == 0 ) {
					tempDiffuseColor = texture2D( cityTextures[ 0 ], vTexUV );
				} else if ( vTexIndex == 1 ) {
					tempDiffuseColor = texture2D( cityTextures[ 1 ], vTexUV );
				} else if ( vTexIndex == 2 ) {
					tempDiffuseColor = texture2D( cityTextures[ 2 ], vTexUV );
				} else if ( vTexIndex == 3 ) {
					tempDiffuseColor = texture2D( cityTextures[ 3 ], vTexUV );
				} else if ( vTexIndex == 4 ) {
					tempDiffuseColor = texture2D( cityTextures[ 4 ], vTexUV );
				} else if ( vTexIndex == 5 ) {
					tempDiffuseColor = texture2D( cityTextures[ 5 ], vTexUV );
				} else if ( vTexIndex == 6 ) {
					tempDiffuseColor = texture2D( cityTextures[ 6 ], vTexUV );
				} else if ( vTexIndex == 7 ) {
					tempDiffuseColor = texture2D( cityTextures[ 7 ], vTexUV );
				} else if ( vTexIndex == 8 ) {
					tempDiffuseColor = texture2D( cityTextures[ 8 ], vTexUV );
				} else if ( vTexIndex == 9 ) {
					tempDiffuseColor = texture2D( cityTextures[ 9 ], vTexUV );
				} else if ( vTexIndex == 10 ) {
					tempDiffuseColor = texture2D( cityTextures[ 10 ], vTexUV );
				} else if ( vTexIndex == 11 ) {
					tempDiffuseColor = texture2D( cityTextures[ 11 ], vTexUV );
				} else if ( vTexIndex == 12 ) {
					tempDiffuseColor = texture2D( cityTextures[ 12 ], vTexUV );
				} else if ( vTexIndex == 13 ) {
					tempDiffuseColor = texture2D( cityTextures[ 13 ], vTexUV );
				} else if ( vTexIndex == 14 ) {
					tempDiffuseColor = texture2D( cityTextures[ 14 ], vTexUV );
				} else if ( vTexIndex == 15 ) {
					tempDiffuseColor = texture2D( cityTextures[ 15 ], vTexUV );
				} else if ( vTexIndex == 16 ) {
					tempDiffuseColor = texture2D( cityTextures[ 16 ], vTexUV );
				} else if ( vTexIndex == 17 ) {
					tempDiffuseColor = texture2D( cityTextures[ 17 ], vTexUV );
				} else if ( vTexIndex == 18 ) {
					tempDiffuseColor = texture2D( cityTextures[ 18 ], vTexUV );
				} else if ( vTexIndex == 19 ) {
					tempDiffuseColor = texture2D( cityTextures[ 19 ], vTexUV );
				} else if ( vTexIndex == 20 ) {
					tempDiffuseColor = texture2D( cityTextures[ 20 ], vTexUV );
				} else if ( vTexIndex == 21 ) {
					tempDiffuseColor = texture2D( cityTextures[ 21 ], vTexUV );
				} else if ( vTexIndex == 22 ) {
					tempDiffuseColor = texture2D( cityTextures[ 22 ], vTexUV );
				} else if ( vTexIndex == 23 ) {
					tempDiffuseColor = texture2D( cityTextures[ 23 ], vTexUV );
				} else if ( vTexIndex == 24 ) {
					tempDiffuseColor = texture2D( cityTextures[ 24 ], vTexUV );
				} else if ( vTexIndex == 25 ) {
					tempDiffuseColor = texture2D( cityTextures[ 25 ], vTexUV );
				} else if ( vTexIndex == 26 ) {
					tempDiffuseColor = texture2D( cityTextures[ 26 ], vTexUV );
				} else if ( vTexIndex == 27 ) {
					tempDiffuseColor = texture2D( cityTextures[ 27 ], vTexUV );
				} else if ( vTexIndex == 28 ) {
					tempDiffuseColor = texture2D( cityTextures[ 28 ], vTexUV );
				} else if ( vTexIndex == 29 ) {
					tempDiffuseColor = texture2D( cityTextures[ 29 ], vTexUV );
				} else if ( vTexIndex == 30 ) {
					tempDiffuseColor = texture2D( cityTextures[ 30 ], vTexUV );
				} else if ( vTexIndex == 31 ) {
					tempDiffuseColor = texture2D( cityTextures[ 31 ], vTexUV );
				}

				if ( vTexIndex > - 1 && vTexIndex < 32 ) {

					diffuseColor *= tempDiffuseColor;

				}

			#endif

			#ifdef SHOW_LOD

				if ( discard_ > 0.0 ) {
					discard;
				}
			
			#endif
			`
		);

		super( newShader );

		this.setValues( parameters );

	}

}
