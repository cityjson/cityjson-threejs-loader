import { POINTS, GeometryData } from './GeometryData.js';
import { BaseParser } from './BaseParser.js';

export class PointParser extends BaseParser {

	constructor( json, objectIds, objectColors ) {

		super( json, objectIds, objectColors );

		this.geomData = new GeometryData( POINTS );

	}

	clean() {

		this.geomData = new GeometryData( POINTS );

	}

	handles( geometry ) {

		return geometry.type == "MultiPoint";

	}

	parseGeometry( geometry, objectId, geomIdx ) {

		const semanticSurfaces = geometry.semantics ? geometry.semantics.surfaces : [];

		if ( geometry.type == "MultiPoint" ) {

			const cityObj = this.json.CityObjects[ objectId ];

			const idIdx = this.getObjectIdx( objectId );

			const objType = this.getObjectTypeIdx( cityObj.type );

			const lodIdx = this.getLodIndex( cityObj.geometry[ geomIdx ].lod );

			const points = geometry.boundaries;

			for ( let i = 0; i < points.length; i ++ ) {

				const semantics = geometry.semantics ? geometry.semantics.values[ i ] : [];
				const surfaceType = this.getSurfaceTypeIdx( i, semantics, semanticSurfaces );

				this.geomData.addVertex( points[ i ],
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
