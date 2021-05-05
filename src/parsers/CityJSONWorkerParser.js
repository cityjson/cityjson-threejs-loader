import {
	BufferAttribute,
	BufferGeometry,
	Color,
	Int32BufferAttribute,
	Mesh,
	ShaderLib,
	ShaderMaterial,
	UniformsUtils } from 'three';
import { defaultSemanticsColors } from '../defaults/colors.js';

function createColorsArray( colors ) {

	const surface_data = [];
	for ( const surfType in colors ) {

		const color = new Color( colors[ surfType ] );

		surface_data.push( color.convertSRGBToLinear() );

	}

	for ( let i = surface_data.length; i < 256; i ++ ) {

		surface_data.push( new Color( 0xffffff ).convertSRGBToLinear() );

	}

	return surface_data;

}

// Adjusts the three.js standard shader to include batchid highlight
function createObjectColorShader( shader, objectColors ) {

	const cm_data = [];
	for ( const objType in objectColors ) {

		const color = new Color( objectColors[ objType ] );

		cm_data.push( color.convertSRGBToLinear() );

	}

	for ( let i = cm_data.length; i < 256; i ++ ) {

		cm_data.push( new Color( 0xffffff ).convertSRGBToLinear() );

	}

	const surface_data = createColorsArray( defaultSemanticsColors );

	const newShader = { ...shader };
	newShader.uniforms = {
		objectColors: { type: "v3v", value: cm_data },
		surfaceColors: { type: "v3v", value: surface_data },
		showSemantics: { value: true },
		selectSurface: { value: true },
		showGeometry: { value: - 1 },
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
			attribute int type;
			attribute int surfacetype;
			varying vec3 diffuse_;
			uniform vec3 objectColors[256];
			uniform vec3 surfaceColors[256];
			uniform vec3 highlightColor;
			uniform float highlightedObjId;
			uniform float highlightedGeomId;
			uniform float highlightedBoundId;
			uniform bool showSemantics;
			uniform bool selectSurface;
			uniform float showGeometry;
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
		).replace(/#include <fog_vertex>/,
			`
			if ( abs ( geometryid - showGeometry ) > 0.5 && showGeometry >= 0.0 ) {
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

	return newShader;

}

export class CityJSONWorkerParser {

	constructor() {

		this.matrix = null;
		this.onChunkLoad = null;
		this.chunkSize = 2000;

		this.objectColors = {
			"Building": 0x7497df,
			"BuildingPart": 0x7497df,
			"BuildingInstallation": 0x7497df,
			"Bridge": 0x999999,
			"BridgePart": 0x999999,
			"BridgeInstallation": 0x999999,
			"BridgeConstructionElement": 0x999999,
			"CityObjectGroup": 0xffffb3,
			"CityFurniture": 0xcc0000,
			"GenericCityObject": 0xcc0000,
			"LandUse": 0xffffb3,
			"PlantCover": 0x39ac39,
			"Railway": 0x000000,
			"Road": 0x999999,
			"SolitaryVegetationObject": 0x39ac39,
			"TINRelief": 0xffdb99,
			"TransportSquare": 0x999999,
			"Tunnel": 0x999999,
			"TunnelPart": 0x999999,
			"TunnelInstallation": 0x999999,
			"WaterBody": 0x4da6ff
		};

		this.surfaceColors = {};

		this.resetMaterial();

	}

	resetMaterial() {

		this.material = new ShaderMaterial( createObjectColorShader( ShaderLib.lambert, this.objectColors ) );

	}

	parse( data, scene ) {

		const worker = new Worker( "./ParserWorker.js" );
		const m = this.matrix;
		const onChunkLoad = this.onChunkLoad;
		const material = this.material;
		const context = this;

		worker.onmessage = function ( e ) {

			const vertices = e.data.v_buffer;

			const geom = new BufferGeometry();

			const vertexArray = new Float32Array( vertices );
			geom.setAttribute( 'position', new BufferAttribute( vertexArray, 3 ) );
			const idsArray = new Uint16Array( e.data.objectIds );
			geom.setAttribute( 'objectid', new BufferAttribute( idsArray, 1 ) );
			const typeArray = new Uint8Array( e.data.objectType );
			geom.setAttribute( 'type', new Int32BufferAttribute( typeArray, 1 ) );
			const surfaceTypeArray = new Int8Array( e.data.surfaceType );
			geom.setAttribute( 'surfacetype', new Int32BufferAttribute( surfaceTypeArray, 1 ) );
			const geomIdsArray = new Float32Array( e.data.geomIds );
			geom.setAttribute( 'geometryid', new BufferAttribute( geomIdsArray, 1 ) );
			const boundaryIdsArray = new Float32Array( e.data.boundaryIds );
			geom.setAttribute( 'boundaryid', new BufferAttribute( boundaryIdsArray, 1 ) );

			geom.attributes.position.needsUpdate = true;

			if ( m !== null ) {

				geom.applyMatrix4( m );

			}

			geom.computeVertexNormals();

			material.uniforms.surfaceColors.value = createColorsArray( e.data.surfaceColors );
			context.surfaceColors = e.data.surfaceColors;

			const mesh = new Mesh( geom, material );

			scene.add( mesh );

			if ( onChunkLoad ) {

				onChunkLoad();

			}

		};

		worker.postMessage( [ data, { chunkSize: this.chunkSize, objectColors: this.objectColors } ] );

	}

}
