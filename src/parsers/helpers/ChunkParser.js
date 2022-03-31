import { GeometryParser } from './GeometryParser.js';

export class ChunkParser {

	constructor() {

		this.matrix = null;
		this.chunkSize = 2000;

		this.lods = [];
		this.objectColors = {};
		this.surfaceColors = {};

		this.onchunkload = null;

	}

	parse( data ) {

		let i = 0;

		const geomParser = new GeometryParser( data, Object.keys( data.CityObjects ), this.objectColors );
		geomParser.lods = this.lods;

		for ( const objectId in data.CityObjects ) {

			const cityObject = data.CityObjects[ objectId ];

			if ( cityObject.geometry && cityObject.geometry.length > 0 ) {

				for ( let geom_i = 0; geom_i < cityObject.geometry.length; geom_i ++ ) {

					geomParser.parseGeometry( cityObject.geometry[ geom_i ], objectId, geom_i );

				}

			}

			if ( i ++ > this.chunkSize ) {

				this.returnObjects( geomParser, data, false );

				geomParser.clean();

				i = 0;

			}

		}

		this.returnObjects( geomParser, data, true );

		this.objectColors = geomParser.objectColors;
		this.surfaceColors = geomParser.surfaceColors;

	}

	returnObjects( parser, data, finished ) {

		if ( parser.geomData.count() > 0 ) {

			this.onchunkload( parser.geomData.getVertices( data.vertices ),
							  parser.geomData.toObject(),
							  parser.lods,
							  parser.objectColors,
							  parser.surfaceColors,
							  finished );

		}

	}

}
