import { InstancedBufferAttribute } from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry';

function removeDuplicates( array ) {

	let newArray = [ array.length / 2 ];

	for ( let i = 0; i < array.length; i += 2 ) {

		newArray[ i / 2 ] = array[ i ];

	}

	return newArray;

}

export class CityObjectsLines extends LineSegments2 {

	constructor( vertices, geometryData, matrix, material ) {

		const geom = new LineSegmentsGeometry();

		geom.setPositions( new Float32Array( vertices ) );

		const idsArray = new Float32Array( removeDuplicates( geometryData.objectIds ) );
		geom.setAttribute( 'objectid', new InstancedBufferAttribute( idsArray, 1 ) );

		const typeArray = new Int32Array( removeDuplicates( geometryData.objectType ) );
		geom.setAttribute( 'type', new InstancedBufferAttribute( typeArray, 1 ) );
		const surfaceTypeArray = new Int32Array( removeDuplicates( geometryData.semanticSurfaces ) );
		geom.setAttribute( 'surfacetype', new InstancedBufferAttribute( surfaceTypeArray, 1 ) );
		const geomIdsArray = new Float32Array( removeDuplicates( geometryData.geometryIds ) );
		geom.setAttribute( 'geometryid', new InstancedBufferAttribute( geomIdsArray, 1 ) );
		const lodIdsArray = new Uint8Array( removeDuplicates( geometryData.lodIds ) );
		geom.setAttribute( 'lodid', new InstancedBufferAttribute( lodIdsArray, 1 ) );
		const boundaryIdsArray = new Float32Array( removeDuplicates( geometryData.boundaryIds ) );
		geom.setAttribute( 'boundaryid', new InstancedBufferAttribute( boundaryIdsArray, 1 ) );

		// geom.attributes.position.needsUpdate = true;

		if ( matrix ) {

			geom.applyMatrix4( matrix );

		}

		super( geom, material );

		this.isCityObject = true;
		this.isCityObjectLine = true;

	}

	getIntersectionVertex( intersection ) {

		return intersection.faceIndex;

	}

	resolveIntersectionInfo( intersection, citymodel ) {

		const intersectionInfo = {};

		const vertexIdx = this.getIntersectionVertex( intersection );

		const idx = this.geometry.getAttribute( 'objectid' ).getX( vertexIdx );

		intersectionInfo.vertexIndex = vertexIdx;
		intersectionInfo.objectIndex = idx;

		intersectionInfo.objectId = Object.keys( citymodel.CityObjects )[ idx ];
		intersectionInfo.geometryIndex = this.geometry.getAttribute( 'geometryid' ).getX( vertexIdx );
		intersectionInfo.boundaryIndex = this.geometry.getAttribute( 'boundaryid' ).getX( vertexIdx );

		intersectionInfo.objectTypeIndex = this.geometry.getAttribute( 'type' ).getX( vertexIdx );
		intersectionInfo.surfaceTypeIndex = this.geometry.getAttribute( 'surfacetype' ).getX( vertexIdx );
		intersectionInfo.lodIndex = this.geometry.getAttribute( 'lodid' ).getX( vertexIdx );

		return intersectionInfo;

	}

}
