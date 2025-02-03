import { ShaderChunk,
		 ShaderLib,
		 UniformsLib,
		 UniformsUtils } from "three";
import 'three/examples/jsm/lines/LineMaterial.js';
import { CityObjectsBaseMaterial } from "./CityObjectsBaseMaterial.js";

export class CityObjectsPointsMaterial extends CityObjectsBaseMaterial {

	constructor( parameters ) {

		const shader = ShaderLib.points;

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

		super( newShader, parameters );

		this.setValues( parameters );

	}

	get size() {

		return this.uniforms.size.value;

	}

	set size( value ) {

		this.uniforms.size.value = value;

	}

	get sizeAttenuation() {

		return Boolean( 'USE_SIZEATTENUATION' in this.defines );

	}

	set sizeAttenuation( value ) {

		if ( Boolean( value ) !== Boolean( 'USE_SIZEATTENUATION' in this.defines ) ) {

			this.needsUpdate = true;

		}

		if ( value === true ) {

			this.defines.USE_SIZEATTENUATION = '';

		} else {

			delete this.defines.USE_SIZEATTENUATION;

		}

	}

}
