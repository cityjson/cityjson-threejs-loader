import { Matrix4, ShaderLib } from 'three';
import { defaultObjectColors, defaultSemanticsColors } from '../defaults/colors.js';
import { POINTS, LINES, TRIANGLES } from './geometry/GeometryData';
import 'three/examples/jsm/lines/LineMaterial';
import { CityObjectsMaterial } from '../materials/CityObjectsMaterial.js';
import { CityObjectsMesh } from '../objects/CityObjectsMesh.js';
import { CityObjectsLines } from '../objects/CityObjectsLines.js';
import { CityObjectsPoints } from '../objects/CityObjectsPoints.js';
import { CityObjectsLineMaterial } from '../materials/CityObjectsLineMaterial.js';
import { CityObjectsPointsMaterial } from '../materials/CityObjectsPointsMaterial.js';
import { TriangleParser } from './geometry/TriangleParser';
import { LineParser } from './geometry/LineParser';
import { PointParser } from './geometry/PointParser';
import { CityObjectsInstancedMesh } from '../objects/CityObjectsInstancedMesh.js';
import { ChunkParser } from './helpers/ChunkParser.js';

export class CityJSONParser {

	constructor() {

		this.matrix = null;
		this.chunkSize = 2000;

		this.objectColors = defaultObjectColors;
		this.surfaceColors = defaultSemanticsColors;

		this.lods = [];

		this.resetMaterial();

	}

	resetMaterial() {

		this.meshMaterial = new CityObjectsMaterial( ShaderLib.lambert, {
			objectColors: this.objectColors,
			surfaceColors: this.surfaceColors
		} );

		this.lineMaterial = new CityObjectsLineMaterial( {

			color: 0xffffff,
			linewidth: 0.001,
			vertexColors: false,
			dashed: false,
			objectColors: this.objectColors,
			surfaceColors: this.surfaceColors

		} );

		this.pointsMaterial = new CityObjectsPointsMaterial( {
			size: 10,
			objectColors: this.objectColors,
			surfaceColors: this.surfaceColors
		} );

	}

	setMaterialsColors( objectColors, surfaceColors ) {

		this.meshMaterial.objectColors = objectColors;
		this.meshMaterial.surfaceColors = surfaceColors;

		this.lineMaterial.objectColors = objectColors;
		this.lineMaterial.surfaceColors = surfaceColors;

		this.pointsMaterial.objectColors = objectColors;
		this.pointsMaterial.surfaceColors = surfaceColors;

	}

	parse( data, scene ) {

		const chunkParser = new ChunkParser();

		if ( this.chunkSize ) {

			chunkParser.chunkSize = this.chunkSize;

		}

		if ( this.objectColors ) {

			chunkParser.objectColors = this.objectColors;

		}

		if ( this.lods ) {

			chunkParser.lods = this.lods;

		}


		chunkParser.onchunkload = ( v, geometryData, lods, objectColors, surfaceColors ) => {

			const vertexArray = new Float32Array( v );
			const vertexBuffer = vertexArray.buffer;

			const vertices = vertexBuffer;
			this.setMaterialsColors( objectColors, surfaceColors );
			this.lods = lods;
			this.objectColors = objectColors;
			this.surfaceColors = surfaceColors;

			if ( geometryData.geometryType == TRIANGLES ) {

				const mesh = new CityObjectsMesh( data, vertices, geometryData, this.matrix, this.meshMaterial );
				scene.add( mesh );

			}

			if ( geometryData.geometryType == LINES ) {

				const lines = new CityObjectsLines( data, vertices, geometryData, this.matrix, this.lineMaterial );
				scene.add( lines );

			}

			if ( geometryData.geometryType == POINTS ) {

				const points = new CityObjectsPoints( data, vertices, geometryData, this.matrix, this.pointsMaterial );
				scene.add( points );

			}

		};

		chunkParser.parse( data );

		if ( data.appearance && data.appearance.materials ) {

			this.meshMaterial.materials = data.appearance.materials;

		}


		// Parse geometry templates
		if ( data[ 'geometry-templates' ] ) {

			const templatesGeomData = [];

			const vertices = data[ 'geometry-templates' ][ 'vertices-templates' ];

			const geometryParsers = [
				new TriangleParser( data, Object.keys( data.CityObjects ), this.objectColors, vertices ),
				new LineParser( data, Object.keys( data.CityObjects ), this.objectColors, vertices ),
				new PointParser( data, Object.keys( data.CityObjects ), this.objectColors, vertices )
			];

			for ( const template of data[ 'geometry-templates' ].templates ) {

				for ( const geometryParser of geometryParsers ) {

					geometryParser.lods = this.lods;
					geometryParser.parseGeometry( template, - 1, - 1 );
					this.lods = geometryParser.lods;

					if ( geometryParser.geomData.count() > 0 ) {

						templatesGeomData.push( geometryParser.geomData );

					}

					geometryParser.clean();

				}

			}

			const instances = [];

			for ( let i = 0; i < templatesGeomData.length; i ++ ) {

				instances.push( {
					matrices: [],
					objectIds: [],
					objectType: [],
					geometryIds: []
				} );

			}

			for ( const objectId in data.CityObjects ) {

				const cityObject = data.CityObjects[ objectId ];

				if ( cityObject.geometry && cityObject.geometry.length > 0 ) {

					for ( let i = 0; i < cityObject.geometry.length; i ++ ) {

						const geometry = cityObject.geometry[ i ];

						if ( geometry.type == "GeometryInstance" ) {

							const matrix = new Matrix4();
							matrix.set( ... geometry.transformationMatrix );
							matrix.setPosition( ... data.vertices[ geometry.boundaries[ 0 ] ] );

							instances[ geometry.template ].matrices.push( matrix );
							instances[ geometry.template ].objectIds.push( Object.keys( data.CityObjects ).indexOf( objectId ) );
							instances[ geometry.template ].objectType.push( Object.keys( this.objectColors ).indexOf( cityObject.type ) );
							instances[ geometry.template ].geometryIds.push( i );

						}

					}

				}

			}

			for ( let i = 0; i < templatesGeomData.length; i ++ ) {

				if ( templatesGeomData[ i ].geometryType == TRIANGLES ) {

					const mesh = new CityObjectsInstancedMesh( data, templatesGeomData[ i ].getVertices( vertices ), templatesGeomData[ i ], instances[ i ], this.matrix, this.meshMaterial );
					scene.add( mesh );


				} else if ( templatesGeomData[ i ].geometryType == LINES ) {

					for ( let j = 0; j < instances[ i ].matrices.length; j ++ ) {

						templatesGeomData[ i ].setObjectId( instances[ i ].objectIds[ j ] );
						templatesGeomData[ i ].setObjectType( instances[ i ].objectType[ j ] );
						templatesGeomData[ i ].setGeometryIdx( instances[ i ].geometryIds[ j ] );

						const line = new CityObjectsLines( templatesGeomData[ i ].getVertices( vertices ), templatesGeomData[ i ], this.matrix, this.lineMaterial );
						line.applyMatrix4( instances[ i ].matrices[ j ] );
						scene.add( line );

					}

				} else if ( templatesGeomData[ i ].geometryType == POINTS ) {

					for ( let j = 0; j < instances[ i ].matrices.length; j ++ ) {

						templatesGeomData[ i ].setObjectId( instances[ i ].objectIds[ j ] );
						templatesGeomData[ i ].setObjectType( instances[ i ].objectType[ j ] );
						templatesGeomData[ i ].setGeometryIdx( instances[ i ].geometryIds[ j ] );

						const line = new CityObjectsPoints( templatesGeomData[ i ].getVertices( vertices ), templatesGeomData[ i ], this.matrix, this.pointsMaterial );
						line.applyMatrix4( instances[ i ].matrices[ j ] );
						scene.add( line );

					}

				}

			}

		}

	}


}
