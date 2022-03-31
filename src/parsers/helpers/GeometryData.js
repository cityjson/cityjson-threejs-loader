// Geometry types
export const POINTS = 0;
export const LINES = 1;
export const TRIANGLES = 2;

export class GeometryData {

	constructor( geometryType ) {

		this.geometryType = geometryType;

		this.vertices = [];
		this.objectIds = [];
		this.objectType = [];
		this.semanticSurfaces = [];
		this.geometryIds = [];
		this.boundaryIds = [];
		this.lodIds = [];

	}

	toObject() {

		return {
			geometryType: this.geometryType,
			vertices: this.vertices,
			objectIds: this.objectIds,
			objectType: this.objectType,
			semanticSurfaces: this.semanticSurfaces,
			geometryIds: this.geometryIds,
			boundaryIds: this.boundaryIds,
			lodIds: this.lodIds
		};

	}

}
