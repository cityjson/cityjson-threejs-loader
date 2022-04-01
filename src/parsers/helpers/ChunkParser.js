import { LineParser } from '../geometry/LineParser.js';
import { TriangleParser } from '../geometry/TriangleParser.js';

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

		const geometryParsers = [
			new TriangleParser( data, Object.keys( data.CityObjects ), this.objectColors ),
			new LineParser( data, Object.keys( data.CityObjects ), this.objectColors )
		];

		for ( const objectId in data.CityObjects ) {

			const cityObject = data.CityObjects[ objectId ];

			if ( cityObject.geometry && cityObject.geometry.length > 0 ) {

				for ( let geom_i = 0; geom_i < cityObject.geometry.length; geom_i ++ ) {

					for ( const geometryParser of geometryParsers ) {

						geometryParser.lods = this.lods;
						geometryParser.parseGeometry( cityObject.geometry[ geom_i ], objectId, geom_i );
						this.lods = geometryParser.lods;

					}

				}

			}

			if ( i ++ > this.chunkSize ) {

				for ( const geometryParser of geometryParsers ) {

					this.returnObjects( geometryParser, data, false );

					geometryParser.clean();

				}

				i = 0;

			}

		}

		for ( const geometryParser of geometryParsers ) {

			// TODO: fix the "finished" flag here - probably better be a
			// different callback
			this.returnObjects( geometryParser, data, true );

			geometryParser.clean();

		}

		// TODO: this needs some fix - probably a common configuration class
		// shared between the parsers
		this.objectColors = geometryParsers[ 0 ].objectColors;
		this.surfaceColors = geometryParsers[ 0 ].surfaceColors;

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
