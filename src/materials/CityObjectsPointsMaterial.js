import { Color,
		 ShaderLib,
		 UniformsUtils } from "three";
import 'three/examples/jsm/lines/LineMaterial';
import { CityObjectsBaseMaterial } from "./CityObjectsBaseMaterial";

export class CityObjectsPointsMaterial extends CityObjectsBaseMaterial {

	constructor( parameters ) {

		const shader = ShaderLib.points;

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
			/vec4 diffuseColor = vec4\( diffuse, opacity \);/,
			`
			vec4 diffuseColor = vec4( diffuse_, opacity );

			if ( discard_ > 0.0 ) {
				discard;
			}
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
