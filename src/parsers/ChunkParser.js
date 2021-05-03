import { GeometryParser } from './GeometryParser.js';

export class ChunkParser {

	constructor() {

		this.matrix = null;
		this.chunkSize = 2000;

		this.meshVertices = [];
		this.meshObjIds = [];
		this.meshObjType = [];

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

		this.onchunkload = null;

	}

	parse( data ) {

		let i = 0;

		const geomParser = new GeometryParser( data, Object.keys( data.CityObjects ), this.objectColors );

		for ( const objectId in data.CityObjects ) {

			const cityObject = data.CityObjects[ objectId ];

			if ( cityObject.geometry && cityObject.geometry.length > 0 ) {

				for ( let geom_i = 0; geom_i < cityObject.geometry.length; geom_i ++ ) {

					geomParser.parseGeometry( cityObject.geometry[ geom_i ], objectId );

				}

			}

			if ( i ++ > this.chunkSize ) {

				this.returnObjects( geomParser, data );

				geomParser.clean();

				i = 0;

			}

		}

		this.returnObjects( geomParser, data );

	}

	returnObjects( parser, data ) {

		if ( parser.meshVertices.length == 0 ) {

			return;

		}

		let vertices = [];

		for ( const vertexIndex of parser.meshVertices ) {

			const vertex = data.vertices[ vertexIndex ];

			vertices.push( ...vertex );

		}

		this.onchunkload( vertices, parser.meshObjIds, parser.meshObjType, parser.meshSemanticSurfaces, parser.surfaceColors );

	}

}
