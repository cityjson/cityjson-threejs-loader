import { InstancedBufferGeometry } from 'three';
import { InstancedBufferAttribute } from 'three';
import { BufferAttribute,
		 InstancedMesh,
		 Int32BufferAttribute } from 'three';

export class CityObjectsInstancedMesh extends InstancedMesh {

	constructor( vertices, geometryData, instanceData, matrix, material ) {

		const geom = new InstancedBufferGeometry();

		const vertexArray = new Float32Array( vertices );
		geom.setAttribute( 'position', new BufferAttribute( vertexArray, 3 ) );
		const idsArray = new Uint16Array( instanceData.objectIds );
		geom.setAttribute( 'objectid', new InstancedBufferAttribute( idsArray, 1 ) );
		const typeArray = new Int32Array( instanceData.objectType );
		geom.setAttribute( 'type', new InstancedBufferAttribute( typeArray, 1 ) );
		const surfaceTypeArray = new Int8Array( geometryData.semanticSurfaces );
		geom.setAttribute( 'surfacetype', new Int32BufferAttribute( surfaceTypeArray, 1 ) );
		const geomIdsArray = new Float32Array( instanceData.geometryIds );
		geom.setAttribute( 'geometryid', new InstancedBufferAttribute( geomIdsArray, 1 ) );
		const lodIdsArray = new Int8Array( geometryData.lodIds );
		geom.setAttribute( 'lodid', new BufferAttribute( lodIdsArray, 1 ) );
		const boundaryIdsArray = new Float32Array( geometryData.boundaryIds );
		geom.setAttribute( 'boundaryid', new BufferAttribute( boundaryIdsArray, 1 ) );

		geom.attributes.position.needsUpdate = true;

		if ( matrix ) {

			geom.applyMatrix4( matrix );

		}

		geom.computeVertexNormals();

		super( geom, material, instanceData.matrices.length );

		for ( let j = 0; j < instanceData.matrices.length; j ++ ) {

			this.setMatrixAt( j, instanceData.matrices[ j ] );

		}

		this.isCityObject = true;
		this.isCityObjectMesh = true;

	}

	getIntersectionVertex( intersection ) {

		return intersection.face.a;

	}

	resolveIntersectionInfo( intersection, citymodel ) {

		const intersectionInfo = {};

		const vertexIdx = this.getIntersectionVertex( intersection );
		const instanceId = intersection.instanceId;

		const idx = this.geometry.getAttribute( 'objectid' ).getX( instanceId );

		intersectionInfo.vertexIndex = vertexIdx;
		intersectionInfo.objectIndex = idx;
		intersectionInfo.objectId = Object.keys( citymodel.CityObjects )[ idx ];
		intersectionInfo.geometryIndex = this.geometry.getAttribute( 'geometryid' ).getX( instanceId );
		intersectionInfo.boundaryIndex = this.geometry.getAttribute( 'boundaryid' ).getX( vertexIdx );

		intersectionInfo.objectTypeIndex = this.geometry.getAttribute( 'type' ).getX( instanceId );
		intersectionInfo.surfaceTypeIndex = this.geometry.getAttribute( 'surfacetype' ).getX( vertexIdx );
		intersectionInfo.lodIndex = this.geometry.getAttribute( 'lodid' ).getX( vertexIdx );

		return intersectionInfo;

	}

}
