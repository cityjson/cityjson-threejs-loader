import { BufferAttribute,
		 BufferGeometry,
		 Int32BufferAttribute,
		 Mesh } from 'three';

export class CityObjectsMesh extends Mesh {

	constructor( citymodel, vertices, geometryData, matrix, material ) {

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

		for ( const material in geometryData.materials ) {

			const materialArray = new Uint8Array( geometryData.materials[ material ] );
			geom.setAttribute( `mat${material}`, new Int32BufferAttribute( materialArray, 1 ) );

		}

		geom.attributes.position.needsUpdate = true;

		if ( matrix ) {

			geom.applyMatrix4( matrix );

		}

		geom.computeVertexNormals();

		super( geom, material );

		this.citymodel = citymodel;

		this.isCityObject = true;
		this.isCityObjectMesh = true;

	}

	addAttributeByProperty( attributeEvaluator ) {

		const allValues = attributeEvaluator.getAllValues();
		const uniqueValues = attributeEvaluator.getUniqueValues();

		if ( uniqueValues.length < 110 ) {

			const objectLookup = [];
			for ( const value of allValues ) {

				objectLookup.push( uniqueValues.indexOf( value ) );

			}

			const objectIds = this.geometry.attributes.objectid.array;

			const finalArray = objectIds.map( i => {

				return objectLookup[ i ];

			} );

			if ( finalArray.length !== objectIds.length ) {

				console.warn( "Wrong size of attributes array." );
				return;

			}

			this.geometry.setAttribute( 'attributevalue', new Int32BufferAttribute( new Int32Array( finalArray ), 1 ) );

		}

	}

	getIntersectionVertex( intersection ) {

		return intersection.face.a;

	}

	resolveIntersectionInfo( intersection ) {

		const intersectionInfo = {};

		const vertexIdx = this.getIntersectionVertex( intersection );

		const idx = this.geometry.getAttribute( 'objectid' ).getX( vertexIdx );

		intersectionInfo.vertexIndex = vertexIdx;
		intersectionInfo.objectIndex = idx;
		intersectionInfo.objectId = Object.keys( this.citymodel.CityObjects )[ idx ];
		intersectionInfo.geometryIndex = this.geometry.getAttribute( 'geometryid' ).getX( vertexIdx );
		intersectionInfo.boundaryIndex = this.geometry.getAttribute( 'boundaryid' ).getX( vertexIdx );

		intersectionInfo.objectTypeIndex = this.geometry.getAttribute( 'type' ).getX( vertexIdx );
		intersectionInfo.surfaceTypeIndex = this.geometry.getAttribute( 'surfacetype' ).getX( vertexIdx );
		intersectionInfo.lodIndex = this.geometry.getAttribute( 'lodid' ).getX( vertexIdx );

		return intersectionInfo;

	}

}
