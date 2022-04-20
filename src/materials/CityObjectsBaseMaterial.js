import { Color, ShaderChunk, ShaderMaterial, UniformsLib } from "three";

UniformsLib.cityobject = {

	objectColors: { value: [] },
	surfaceColors: { value: [] },
	attributeColors: { value: [] },
	cityMaterials: { value: [] },
	cityTexture: { type: 't' },
	showLod: { value: - 1 },
	highlightedObjId: { value: - 1 },
	highlightedGeomId: { value: - 1 },
	highlightedBoundId: { value: - 1 },
	highlightColor: { value: new Color( 0xFFC107 ).convertSRGBToLinear() }

};

ShaderChunk.cityobjectinclude_vertex = `
        uniform vec3 objectColors[ OBJCOLOR_COUNT ];
        uniform vec3 highlightColor;
        uniform float highlightedObjId;
        
        attribute float objectid;
        attribute int type;
        
        varying vec3 diffuse_;

        #ifdef SHOW_SEMANTICS

            uniform vec3 surfaceColors[ SEMANTIC_COUNT ];

            attribute int surfacetype;

        #endif

		#ifdef COLOR_ATTRIBUTE

            uniform vec3 attributeColors[ ATTRIBUTE_COUNT ];

            attribute int attributevalue;

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

		#ifdef MATERIAL_THEME

			struct CityMaterial
			{
				vec3 diffuseColor;
				vec3 emissiveColor;
				vec3 specularColor;
			};

			uniform CityMaterial cityMaterials[ MATERIAL_COUNT ];

			attribute int MATERIAL_THEME;

		#endif

		#ifdef TEXTURE_THEME

			attribute int TEXTURE_THEME;
			attribute vec2 TEXTURE_THEME_UV;

			flat out int vTexIndex;
			varying vec2 vTexUV;

		#endif
    `;

ShaderChunk.cityobjectdiffuse_vertex = `
        #ifdef SHOW_SEMANTICS

            diffuse_ = surfacetype > -1 ? surfaceColors[surfacetype] : objectColors[type];

        #else

            diffuse_ = objectColors[type];

        #endif

		#ifdef COLOR_ATTRIBUTE

            diffuse_ = attributevalue > -1 ? attributeColors[attributevalue] : vec3( 0.0, 0.0, 0.0 );

        #endif

		#ifdef MATERIAL_THEME

			if ( MATERIAL_THEME > - 1 ) {

				diffuse_ = cityMaterials[ MATERIAL_THEME ].diffuseColor;

			}

		#endif

		#ifdef TEXTURE_THEME

			vTexIndex = TEXTURE_THEME;
			vTexUV = TEXTURE_THEME_UV;

			if ( vTexIndex > - 1 ) {

				diffuse_ = vec3( 1.0, 1.0, 1.0 );

			}

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
		this.attributeColors = {};
		this.materials = [];
		this.showSemantics = true;

		this.textures = [];

		this.instancing = false;

		this.isCityObjectsMaterial = true;

		this.defines.OBJCOLOR_COUNT = 0;
		this.defines.SEMANTIC_COUNT = 0;
		this.defines.ATTRIBUTE_COUNT = 0;
		this.defines.MATERIAL_COUNT = 0;

	}

	createColorsArray( colors ) {

		const data = [];
		for ( const type in colors ) {

			const color = new Color( colors[ type ] );

			data.push( color.convertSRGBToLinear() );

		}

		return data;

	}

	set attributeColors( colors ) {

		this.attributeColorsLookup = colors;

		this.uniforms.attributeColors.value = this.createColorsArray( colors );
		this.defines.ATTRIBUTE_COUNT = Object.keys( colors ).length;

	}

	get attributeColors() {

		return this.attributeColorsLookup;

	}

	get conditionalFormatting() {

		return Boolean( 'COLOR_ATTRIBUTE' in this.defines );

	}

	set conditionalFormatting( value ) {

		if ( Boolean( value ) !== Boolean( 'COLOR_ATTRIBUTE' in this.defines ) ) {

			this.needsUpdate = true;

		}

		if ( value === true ) {

			this.defines.COLOR_ATTRIBUTE = '';

		} else {

			delete this.defines.COLOR_ATTRIBUTE;

		}

	}

	set objectColors( colors ) {

		this.objectColorsLookup = colors;

		// Maybe here we check if the key order has changed
		this.uniforms.objectColors.value = this.createColorsArray( colors );
		this.defines.OBJCOLOR_COUNT = Object.keys( colors ).length;

	}

	get objectColors() {

		return this.objectColorsLookup;

	}

	set surfaceColors( colors ) {

		this.surfaceColorsLookup = colors;

		// Maybe here we check if the key order has changed
		this.uniforms.surfaceColors.value = this.createColorsArray( colors );
		this.defines.SEMANTIC_COUNT = Object.keys( colors ).length;

		this.needsUpdate = true;

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

	set materialTheme( value ) {

		const themeName = value.replace( /[^a-z0-9]/gi, '' );

		if ( themeName !== this.defines.MATERIAL_THEME ) {

			this.needsUpdate = true;

		}

		if ( value === "undefined" || value === undefined || value == null ) {

			delete this.defines.MATERIAL_THEME;

		} else {

			this.defines.MATERIAL_THEME = `mat${themeName}`;

		}

	}

	set textureTheme( value ) {

		const themeName = value.replace( /[^a-z0-9]/gi, '' );

		if ( themeName !== this.defines.TEXTURE_THEME ) {

			this.needsUpdate = true;

		}

		if ( value === "undefined" || value === undefined || value == null ) {

			delete this.defines.TEXTURE_THEME;
			delete this.defines.TEXTURE_THEME_UV;

		} else {

			this.defines.TEXTURE_THEME = `tex${themeName}`;
			this.defines.TEXTURE_THEME_UV = `tex${themeName}uv`;

		}

	}

	set materials( materials ) {

		const data = [];
		for ( let i = 0; i < materials.length; i ++ ) {

			const mat = Object.assign( {
				diffuseColor: new Color( 0xffffff ).convertLinearToSRGB(),
				emissiveColor: new Color( 0xffffff ).convertLinearToSRGB(),
				specularColor: new Color( 0xffffff ).convertLinearToSRGB(),
			}, materials[ i ] );

			data.push( mat );

		}

		this.defines.MATERIAL_COUNT = data.length;

		this.uniforms.cityMaterials.value = data;

	}

	get highlightColor() {

		return this.uniforms.highlightColor;

	}

	set highlightColor( color ) {

		if ( typeof color === 'string' || color instanceof String ) {

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
