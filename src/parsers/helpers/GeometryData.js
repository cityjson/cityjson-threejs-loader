// Geometry types
export const POINTS = 0;
export const LINES = 1;
export const TRIANGLES = 2;

export class GeometryData {

	constructor( geometryType ) {

		this.geometryType = geometryType;

		this.vertexIds = [];
		this.objectIds = [];
		this.objectType = [];
		this.semanticSurfaces = [];
		this.geometryIds = [];
		this.boundaryIds = [];
		this.lodIds = [];

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
			objectType: this.objectType,
			semanticSurfaces: this.semanticSurfaces,
			geometryIds: this.geometryIds,
			boundaryIds: this.boundaryIds,
			lodIds: this.lodIds
		};

	}

}
