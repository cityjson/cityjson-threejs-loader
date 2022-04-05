import { Color, UniformsUtils } from "three";
import { CityObjectsBaseMaterial } from "./CityObjectsBaseMaterial";

export class CityObjectsMaterial extends CityObjectsBaseMaterial {

	constructor( shader, parameters ) {

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
		newShader.lights = true;
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
			/#include <uv_vertex>/,
			`
			#include <uv_vertex>
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
			`
		).replace(
			/#include <fog_vertex>/,
			`
			#include <fog_vertex>
			
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

		super( newShader );

		this.setValues( parameters );

	}

}
