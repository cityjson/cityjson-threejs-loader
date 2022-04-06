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
		` +
		newShader.fragmentShader.replace(
			/vec4 diffuseColor = vec4\( diffuse, opacity \);/,
			`
			vec4 diffuseColor = vec4( diffuse_, opacity );

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
