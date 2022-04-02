import { PointsMaterial } from 'three';
import { BufferAttribute,
		 BufferGeometry,
		 Int32BufferAttribute,
		 Points } from 'three';

export class CityObjectsPoints extends Points {

	constructor( vertices, geometryData, matrix ) {

		const geom = new BufferGeometry();

		const vertexArray = new Float32Array( vertices );
		geom.setAttribute( 'position', new BufferAttribute( vertexArray, 3 ) );
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

		geom.attributes.position.needsUpdate = true;

		if ( matrix ) {

			geom.applyMatrix4( matrix );

		}

		geom.computeVertexNormals();

		const material = new PointsMaterial( { size: 0.01 } );

		super( geom, material );

	}

	getIntersectionVertex( intersection ) {

		return intersection.index;

	}

}
