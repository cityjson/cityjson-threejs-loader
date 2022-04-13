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

export class CityJSONWorkerParser {

	constructor() {

		this.matrix = null;
		this.onChunkLoad = null;
		this.onComplete = null;
		this.chunkSize = 2000;
		this.loading = false;

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

		this.loading = true;

		// Sets the web worker that will parse all normal (ie non-instanced)
		// geometries
		const worker = new Worker( "./helpers/ParserWorker.js" );
		const m = this.matrix;
		const onChunkLoad = this.onChunkLoad;
		const onComplete = this.onComplete;
		const context = this;
		const citymodel = data;

		worker.onmessage = function ( e ) {

			if ( e.data.type === "chunkLoaded" ) {

				const vertices = e.data.v_buffer;
				const geometryData = e.data.geometryData;

				context.setMaterialsColors( e.data.objectColors, e.data.surfaceColors );

				context.lods = e.data.lods;
				context.objectColors = e.data.objectColors;
				context.surfaceColors = e.data.surfaceColors;

				if ( e.data.geometryData.geometryType == TRIANGLES ) {

					const mesh = new CityObjectsMesh( citymodel, vertices, geometryData, m, context.meshMaterial );
					scene.add( mesh );

				}

				if ( e.data.geometryData.geometryType == LINES ) {

					const lines = new CityObjectsLines( citymodel, vertices, geometryData, m, context.lineMaterial );
					scene.add( lines );

				}

				if ( e.data.geometryData.geometryType == POINTS ) {


					const points = new CityObjectsPoints( citymodel, vertices, geometryData, m, context.pointsMaterial );
					scene.add( points );

				}

				if ( onChunkLoad ) {

					onChunkLoad();

				}

			} else if ( e.data.type === "done" ) {

				context.loading = false;

				if ( data.appearance && data.appearance.materials ) {

					context.meshMaterial.materials = data.appearance.materials;

				}

				if ( onComplete ) {

					onComplete();

				}

			}

		};

		worker.postMessage( [ data, { chunkSize: this.chunkSize, objectColors: this.objectColors, lods: this.lods } ] );

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

					const mesh = new CityObjectsInstancedMesh( citymodel, templatesGeomData[ i ].getVertices( vertices ), templatesGeomData[ i ], instances[ i ], m, this.meshMaterial );
					scene.add( mesh );


				} else if ( templatesGeomData[ i ].geometryType == LINES ) {

					for ( let j = 0; j < instances[ i ].matrices.length; j ++ ) {

						templatesGeomData[ i ].setObjectId( instances[ i ].objectIds[ j ] );
						templatesGeomData[ i ].setObjectType( instances[ i ].objectType[ j ] );
						templatesGeomData[ i ].setGeometryIdx( instances[ i ].geometryIds[ j ] );

						const line = new CityObjectsLines( templatesGeomData[ i ].getVertices( vertices ), templatesGeomData[ i ], m, this.lineMaterial );
						line.applyMatrix4( instances[ i ].matrices[ j ] );
						scene.add( line );

					}

				} else if ( templatesGeomData[ i ].geometryType == POINTS ) {

					for ( let j = 0; j < instances[ i ].matrices.length; j ++ ) {

						templatesGeomData[ i ].setObjectId( instances[ i ].objectIds[ j ] );
						templatesGeomData[ i ].setObjectType( instances[ i ].objectType[ j ] );
						templatesGeomData[ i ].setGeometryIdx( instances[ i ].geometryIds[ j ] );

						const line = new CityObjectsPoints( templatesGeomData[ i ].getVertices( vertices ), templatesGeomData[ i ], m, this.pointsMaterial );
						line.applyMatrix4( instances[ i ].matrices[ j ] );
						scene.add( line );

					}

				}

			}

		}

	}

}
