import { LINES, GeometryData } from './GeometryData.js';
import { BaseParser } from './BaseParser.js';

export class LineParser extends BaseParser {

	constructor( json, objectIds, objectColors ) {

		super( json, objectIds, objectColors );

		this.geomData = new GeometryData( LINES );

	}

	clean() {

		this.geomData = new GeometryData( LINES );

	}

	handles( geometry ) {

		return geometry.type == "MultiLineString";

	}

	parseGeometry( geometry, objectId, geomIdx ) {

		const semanticSurfaces = geometry.semantics ? geometry.semantics.surfaces : [];

		if ( geometry.type == "MultiLineString" ) {

			const cityObj = this.json.CityObjects[ objectId ];

			const idIdx = this.getObjectIdx( objectId );

			const objType = this.getObjectTypeIdx( cityObj.type );

			const lodIdx = this.getLodIndex( cityObj.geometry[ geomIdx ].lod );

			const linestrings = geometry.boundaries;

			for ( let i = 0; i < linestrings.length; i ++ ) {

				if ( linestrings[ i ].length > 1 ) {

					const semantics = geometry.semantics ? geometry.semantics.values : [];
					const surfaceType = this.getSurfaceTypeIdx( i, semantics, semanticSurfaces );

					const linestring = linestrings[ i ];

					// Contains the boundary but with the right verticeId
					for ( let j = 0; j < linestrings[ i ].length - 1; j ++ ) {

						this.geomData.addVertex( linestring[ j ],
							idIdx,
							objType,
							surfaceType,
							geomIdx,
							i,
							lodIdx );

						this.geomData.addVertex( linestring[ j + 1 ],
							idIdx,
							objType,
							surfaceType,
							geomIdx,
							i,
							lodIdx );

					}

				}

			}

		}

	}

}
