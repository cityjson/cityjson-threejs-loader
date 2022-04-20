import { ShaderChunk, UniformsLib, UniformsUtils } from "three";
import { CityObjectsBaseMaterial } from "./CityObjectsBaseMaterial";

export class CityObjectsMaterial extends CityObjectsBaseMaterial {

	constructor( shader, parameters ) {

		const newShader = { ...shader };
		newShader.uniforms = {
			...UniformsUtils.clone( UniformsLib.cityobject ),
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

				uniform sampler2D cityTexture;

				flat in int vTexIndex;
				varying vec2 vTexUV;

			#endif

			#ifdef MATERIAL_THEME

				varying vec3 emissive_;
			
			#endif
		` +
		newShader.fragmentShader.replace(
			/vec4 diffuseColor = vec4\( diffuse, opacity \);/,
			`
			vec4 diffuseColor = vec4( diffuse_, opacity );

			#ifdef TEXTURE_THEME

				if ( vTexIndex > - 1 ) {

					vec4 tempDiffuseColor = vec4(1.0, 1.0, 1.0, 0.0);

					tempDiffuseColor = texture2D( cityTexture, vTexUV );

					diffuseColor *= tempDiffuseColor;

				}

			#endif

			#ifdef SHOW_LOD

				if ( discard_ > 0.0 ) {
					discard;
				}
			
			#endif
			`
		).replace(
			/vec3 totalEmissiveRadiance = emissive;/,
			`
			#ifdef MATERIAL_THEME

				vec3 totalEmissiveRadiance = emissive_;

			#else

				vec3 totalEmissiveRadiance = emissive;

			#endif
			`
		);

		super( newShader );

		this.setValues( parameters );

	}

}
