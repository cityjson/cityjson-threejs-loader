import { ShaderMaterial } from "three";
import { Color, UniformsUtils } from "three";

export class CityObjectsMaterial extends ShaderMaterial {

	constructor( shader, parameters ) {

		const newShader = { ...shader };
		newShader.uniforms = {
			objectColors: { value: [] },
			surfaceColors: { value: [] },
			showSemantics: { value: true },
			selectSurface: { value: true },
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
			attribute float objectid;
			attribute float geometryid;
			attribute float boundaryid;
			attribute float lodid;
			attribute int type;
			attribute int surfacetype;
			varying vec3 diffuse_;
			uniform vec3 objectColors[ 110 ];
			uniform vec3 surfaceColors[ 110 ];
			uniform vec3 highlightColor;
			uniform float highlightedObjId;
			uniform float highlightedGeomId;
			uniform float highlightedBoundId;
			uniform bool showSemantics;
			uniform bool selectSurface;
			uniform float showLod;
		` +
		newShader.vertexShader.replace(
			/#include <uv_vertex>/,
			`
			#include <uv_vertex>
			vec3 color_;
			
			if ( showSemantics ) {
				color_ = surfacetype > -1 ? surfaceColors[surfacetype] : objectColors[type];
			}
			else {
				color_ = objectColors[type];
			}

			if ( selectSurface ) {
				diffuse_ = abs( objectid - highlightedObjId ) < 0.5 && abs( geometryid - highlightedGeomId ) < 0.5 && abs( boundaryid - highlightedBoundId ) < 0.5 ? highlightColor : color_;
			}
			else {
				diffuse_ = abs( objectid - highlightedObjId ) < 0.5 ? highlightColor : color_;
			}
			`
		).replace(
			/#include <fog_vertex>/,
			`
			#include <fog_vertex>
			if ( abs ( lodid - showLod ) > 0.5 && showLod >= 0.0 ) {
				gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
			}
			`
		);
		newShader.fragmentShader =
		`
			varying vec3 diffuse_;
		` +
		newShader.fragmentShader.replace(
			/vec4 diffuseColor = vec4\( diffuse, opacity \);/,
			`
			vec4 diffuseColor = vec4( diffuse_, opacity );
			`
		);

		super( newShader );

		this.objectColors = {};
		this.surfaceColors = {};

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

	set showSemantics( value ) {

		this.uniforms.showSemantics.value = value;

	}

	set selectSurface( value ) {

		this.uniforms.selectSurface.value = value;

	}

	set showLod( lod ) {

		this.uniforms.showLod.value = lod;

	}

	set highlightColor( color ) {

		this.uniforms.highlightColor.value.setHex( color.replace( '#', '0x' ) );

	}

}
