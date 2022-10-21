import { Color, ShaderChunk, ShaderMaterial, UniformsLib } from "three";

UniformsLib.cityobject = {

	objectColors: { value: [] },
	surfaceColors: { value: [] },
	showLod: { value: - 1 },
	highlightedObjId: { value: - 1 },
	highlightedGeomId: { value: - 1 },
	highlightedBoundId: { value: - 1 },
	highlightColor: { value: new Color( 0xFFC107 ).convertSRGBToLinear() }

};

ShaderChunk.cityobjectinclude_vertex = `
        uniform vec3 objectColors[ 10 ];
        uniform vec3 highlightColor;
        uniform float highlightedObjId;
        
        attribute float objectid;
        attribute float type;
        
        varying vec3 diffuse_;

        #ifdef SHOW_SEMANTICS

            uniform vec3 surfaceColors[ 10 ];

            attribute float surfacetype;

        #endif

        #ifdef SELECT_SURFACE

            uniform float highlightedGeomId;
            uniform float highlightedBoundId;

            attribute float geometryid;
            attribute float boundaryid;

        #endif

        #ifdef SHOW_LOD

            uniform float showLod;

            attribute float lodid;

            varying float discard_;
    
        #endif
    `;

ShaderChunk.cityobjectdiffuse_vertex = `
        #ifdef SHOW_SEMANTICS

            diffuse_ = surfacetype > -1.0 ? surfaceColors[int(surfacetype)] : objectColors[int(type)];

        #else

            diffuse_ = objectColors[type];

        #endif

        #ifdef SELECT_SURFACE

            diffuse_ = abs( objectid - highlightedObjId ) < 0.5 && abs( geometryid - highlightedGeomId ) < 0.5 && abs( boundaryid - highlightedBoundId ) < 0.5 ? highlightColor : diffuse_;

        #else

            diffuse_ = abs( objectid - highlightedObjId ) < 0.5 ? highlightColor : diffuse_;

        #endif
    `;

ShaderChunk.cityobjectshowlod_vertex = `
        #ifdef SHOW_LOD

            if ( abs ( lodid - showLod ) > 0.5 ) {
                discard_ = 1.0;
            }

        #endif
    `;

export class CityObjectsBaseMaterial extends ShaderMaterial {

	constructor( shader ) {

		super( shader );

		this.objectColors = {};
		this.surfaceColors = {};
		this.showSemantics = true;

		this.instancing = false;

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

	get highlightColor() {

		return this.uniforms.highlightColor;

	}

	set highlightColor( color ) {

		if ( color instanceof String ) {

			this.uniforms.highlightColor.value.setHex( color.replace( '#', '0x' ) );

		} else if ( color instanceof Number ) {

			this.uniforms.highlightColor.setHex( color );

		} else if ( color instanceof Color ) {

			this.uniforms.highlightColor = color;

		}

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

			this.uniforms.highlightedObjId.value = objectInfo.objectIndex === undefined ? - 1 : objectInfo.objectIndex;
			this.uniforms.highlightedGeomId.value = objectInfo.geometryIndex === undefined ? - 1 : objectInfo.geometryIndex;
			this.uniforms.highlightedBoundId.value = objectInfo.boundaryIndex === undefined ? - 1 : objectInfo.boundaryIndex;

		} else {

			this.uniforms.highlightedObjId.value = - 1;
			this.uniforms.highlightedGeomId.value = - 1;
			this.uniforms.highlightedBoundId.value = - 1;

		}

	}

}
