import { BufferAttribute,
	Int32BufferAttribute } from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry';

export class CityObjectsLines extends LineSegments2 {

	constructor( vertices, geometryData, matrix, material ) {

		const geom = new LineSegmentsGeometry();

		geom.setPositions( new Float32Array( vertices ) );

		const idsArray = new Uint16Array( geometryData.objectIds );
		geom.setAttribute( 'objectid', new BufferAttribute( idsArray, 1 ) );
		const typeArray = new Uint8Array( geometryData.objectType );
		geom.setAttribute( 'type', new Int32BufferAttribute( typeArray, 1 ) );
		const surfaceTypeArray = new Int8Array( geometryData.semanticSurfaces );
		geom.setAttribute( 'surfacetype', new Int32BufferAttribute( surfaceTypeArray, 1 ) );
		const geomIdsArray = new Float32Array( geometryData.geometryIds );
		geom.setAttribute( 'geometryid', new BufferAttribute( geomIdsArray, 1 ) );
		const lodIdsArray = new Int8Array( geometryData.lodIds );
		geom.setAttribute( 'lodid', new BufferAttribute( lodIdsArray, 1 ) );
		const boundaryIdsArray = new Float32Array( geometryData.boundaryIds );
		geom.setAttribute( 'boundaryid', new BufferAttribute( boundaryIdsArray, 1 ) );

		// geom.attributes.position.needsUpdate = true;

		if ( matrix ) {

			geom.applyMatrix4( matrix );

		}

		super( geom, material );

	}

	getIntersectionVertex( intersection ) {

		return intersection.faceIndex * 2;

	}

}
