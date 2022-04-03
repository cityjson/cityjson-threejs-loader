import { ShaderMaterial } from "three";
import { Color, UniformsUtils } from "three";

export class CityObjectsMaterial extends ShaderMaterial {

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

		this.objectColors = {};
		this.surfaceColors = {};
		this.showSemantics = true;

		this.setValues( parameters );

		this.isCityObjectsMaterial = true;

	}

	createColorsArray( colors ) {

		const data = [];
		for ( const type in colors ) {

			const color = new Color( colors[ type ] );

			data.push( color.convertSRGBToLinear() );

		}

		for ( let i = data.length; i < 110; i ++ ) {

			data.push( new Color( 0xffffff ).convertSRGBToLinear() );

		}

		return data;

	}

	set objectColors( colors ) {

		this.objectColorsLookup = colors;

		// Maybe here we check if the key order has changed
		this.uniforms.objectColors.value = this.createColorsArray( colors );

	}

	get objectColors() {

		return this.objectColorsLookup;

	}

	set surfaceColors( colors ) {

		this.surfaceColorsLookup = colors;

		// Maybe here we check if the key order has changed
		this.uniforms.surfaceColors.value = this.createColorsArray( colors );

	}

	get surfaceColors() {

		return this.surfaceColorsLookup;

	}

	get showSemantics() {

		return Boolean( 'SHOW_SEMANTICS' in this.defines );

	}

	set showSemantics( value ) {

		if ( Boolean( value ) !== Boolean( 'SHOW_SEMANTICS' in this.defines ) ) {

			this.needsUpdate = true;

		}

		if ( value === true ) {

			this.defines.SHOW_SEMANTICS = '';

		} else {

			delete this.defines.SHOW_SEMANTICS;

		}

	}

	get selectSurface() {

		return Boolean( 'SELECT_SURFACE' in this.defines );

	}

	set selectSurface( value ) {

		if ( Boolean( value ) !== Boolean( 'SELECT_SURFACE' in this.defines ) ) {

			this.needsUpdate = true;

		}

		if ( value === true ) {

			this.defines.SELECT_SURFACE = '';

		} else {

			delete this.defines.SELECT_SURFACE;

		}

	}

	get showLod() {

		return this.uniforms.showLod.value;

	}

	set showLod( value ) {

		if ( Boolean( value > - 1 ) !== Boolean( 'SHOW_LOD' in this.defines ) ) {

			this.needsUpdate = true;

		}

		if ( value > - 1 ) {

			this.defines.SHOW_LOD = '';

		} else {

			delete this.defines.SHOW_LOD;

		}

		this.uniforms.showLod.value = value;

	}

	set highlightColor( color ) {

		this.uniforms.highlightColor.value.setHex( color.replace( '#', '0x' ) );

	}

	get highlightedObject() {

		return {

			objectIndex: this.uniforms.highlightedObjId.value,
			geometryIndex: this.uniforms.highlightedGeomId.value,
			boundaryIndex: this.uniforms.highlightedBoundId.value

		};

	}

	/**
	 * Expects an object with three properties: `objectIndex`, `geometryIndex`,
	 * and `boundaryIndex`.
	 */
	set highlightedObject( objectInfo ) {

		if ( objectInfo ) {

			this.uniforms.highlightedObjId.value = objectInfo.objectIndex;
			this.uniforms.highlightedGeomId.value = objectInfo.geometryIndex;
			this.uniforms.highlightedBoundId.value = objectInfo.boundaryIndex;

		} else {

			this.uniforms.highlightedObjId.value = - 1;
			this.uniforms.highlightedGeomId.value = - 1;
			this.uniforms.highlightedBoundId.value = - 1;

		}

	}

}
