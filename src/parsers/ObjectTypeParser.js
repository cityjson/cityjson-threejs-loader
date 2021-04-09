import {
	BufferAttribute,
	BufferGeometry,
	Mesh,
	MeshPhongMaterial } from 'three';

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

	}

	parse( data, scene ) {

		console.log( "Starting..." );

		const worker = new Worker( "./TypeParserWorker.js" );
		const m = this.matrix;
		const objectColors = this.objectColors;
		const on_load = this.on_load;
		worker.onmessage = function ( e ) {

			console.log( "Received data! " );

			const vertices = e.data.v_buffer;

			const geom = new BufferGeometry();

			const vertexArray = new Float32Array( vertices );
			geom.setAttribute( 'position', new BufferAttribute( vertexArray, 3 ) );

			geom.attributes.position.needsUpdate = true;

			if ( m !== null ) {

				geom.applyMatrix4( m );

			}

			geom.computeVertexNormals();

			const material = new MeshPhongMaterial();
			material.flatShading = true;
			material.color.setHex( 0xcccccc );

			const mesh = new Mesh( geom, material );

			scene.add( mesh );

			if ( on_load ) {

				on_load();

			}

		};

		worker.postMessage( [ data, { chunkSize: this.chunkSize } ] );

	}

}
