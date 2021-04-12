import {
	BufferAttribute,
	BufferGeometry,
	Color,
	Int32BufferAttribute,
	Mesh,
	ShaderLib,
	ShaderMaterial,
	UniformsUtils,
	Vector3 } from 'three';

// Adjusts the three.js standard shader to include batchid highlight
function batchIdHighlightShaderMixin( shader ) {

	const newShader = { ...shader };
	newShader.uniforms = {
		objectColors: { type: "v3v", value: [] },
		highlightedObjId: { value: - 1 },
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
			attribute int type;
			varying vec3 diffuse_;
			uniform vec3 objectColors[256];
			uniform vec3 highlightColor;
			uniform float highlightedObjId;
		` +
		newShader.vertexShader.replace(
			/#include <uv_vertex>/,
			`
			#include <uv_vertex>
			diffuse_ = abs( objectid - highlightedObjId ) < 0.5 ? highlightColor : objectColors[type];
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

export class ObjectTypeParser {

	constructor() {

		this.matrix = null;
		this.on_load = null;
		this.chunkSize = 100;

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

		this.material = new ShaderMaterial( batchIdHighlightShaderMixin( ShaderLib.lambert ) );

		const cm_data = [];
		for ( const objType in this.objectColors ) {

			const color = new Color( this.objectColors[ objType ] );

			cm_data.push( new Vector3( color.r, color.g, color.b ) );

		}

		for ( let i = cm_data.length; i < 256; i ++ ) {

			cm_data.push( new Vector3( 1.0, 1.0, 1.0 ) );

		}

		this.material.uniforms.objectColors.value = cm_data;

	}

	parse( data, scene ) {

		console.log( "Starting..." );

		const worker = new Worker( "./TypeParserWorker.js" );
		const m = this.matrix;
		const on_load = this.on_load;
		const material = this.material;
		worker.onmessage = function ( e ) {

			const vertices = e.data.v_buffer;

			const geom = new BufferGeometry();

			const vertexArray = new Float32Array( vertices );
			geom.setAttribute( 'position', new BufferAttribute( vertexArray, 3 ) );
			const idsArray = new Uint16Array( e.data.objectIds );
			geom.setAttribute( 'objectid', new BufferAttribute( idsArray, 1 ) );
			const typeArray = new Uint8Array( e.data.objectType );
			geom.setAttribute( 'type', new Int32BufferAttribute( typeArray, 1 ) );

			geom.attributes.position.needsUpdate = true;

			if ( m !== null ) {

				geom.applyMatrix4( m );

			}

			geom.computeVertexNormals();

			const mesh = new Mesh( geom, material );

			scene.add( mesh );

			if ( on_load ) {

				on_load();

			}

		};

		worker.postMessage( [ data, { chunkSize: this.chunkSize } ] );

	}

}
