// Geometry types
export const POINTS = 0;
export const LINES = 1;
export const TRIANGLES = 2;

export class GeometryData {

	constructor( geometryType ) {

		this.geometryType = geometryType;

		this.vertexIds = [];
		this.objectIds = [];
		this.objectTypes = [];
		this.semanticSurfaces = [];
		this.geometryIds = [];
		this.boundaryIds = [];
		this.lodIds = [];

	}

	addVertex( vertexId, objectId, objectType, surfaceType, geometryIdx, boundaryIdx, lodIdx ) {

		this.vertexIds.push( vertexId );
		this.objectIds.push( objectId );
		this.objectTypes.push( objectType );
		this.semanticSurfaces.push( surfaceType );
		this.geometryIds.push( geometryIdx );
		this.boundaryIds.push( boundaryIdx );
		this.lodIds.push( lodIdx );

	}

	count() {

		return this.vertexIds.length;

	}

	getVertices( vertexList ) {

		let vertices = [];

		for ( const vertexIndex of this.vertexIds ) {

			const vertex = vertexList[ vertexIndex ];

			vertices.push( ...vertex );

		}

		return vertices;

	}

	toObject() {

		return {
			geometryType: this.geometryType,
			objectIds: this.objectIds,
			objectType: this.objectTypes,
			semanticSurfaces: this.semanticSurfaces,
			geometryIds: this.geometryIds,
			boundaryIds: this.boundaryIds,
			lodIds: this.lodIds
		};

	}

	setObjectId( objectId ) {

		for ( let i = 0; i < this.objectIds.length; i ++ ) {

			this.objectIds[ i ] = objectId;

		}

	}


	setObjectType( objectType ) {

		for ( let i = 0; i < this.objectTypes.length; i ++ ) {

			this.objectTypes[ i ] = objectType;

		}

	}

	setGeometryIdx( geometryIdx ) {

		for ( let i = 0; i < this.geometryIds.length; i ++ ) {

			this.geometryIds[ i ] = geometryIdx;

		}

	}

	merge( otherGeomData ) {

		if ( otherGeomData.geometryType != this.geometryType ) {

			console.warn( "Merging different types of geometry data!" );

		}

		this.vertexIds.concat( this.otherGeomData.vertexId );
		this.objectIds.concat( this.otherGeomData.objectId );
		this.objectTypes.concat( this.otherGeomData.objectType );
		this.semanticSurfaces.concat( this.otherGeomData.surfaceType );
		this.geometryIds.concat( this.otherGeomData.geometryIdx );
		this.boundaryIds.concat( this.otherGeomData.boundaryIdx );
		this.lodIds.concat( this.otherGeomData.lodIdx );

	}

}
