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

		this.material = new CityObjectsMaterial( ShaderLib.lambert, {
			objectColors: this.objectColors,
			surfaceColors: this.surfaceColors
		} );

	}

	parse( data, scene ) {

		this.loading = true;

		// Sets the web worker that will parse all normal (ie non-instanced)
		// geometries
		const worker = new Worker( "./helpers/ParserWorker.js" );
		const m = this.matrix;
		const onChunkLoad = this.onChunkLoad;
		const onComplete = this.onComplete;
		const material = this.material;
		const context = this;

		worker.onmessage = function ( e ) {

			if ( e.data.type === "chunkLoaded" ) {

				const vertices = e.data.v_buffer;
				const geometryData = e.data.geometryData;

				material.objectColors = e.data.objectColors;
				material.surfaceColors = e.data.surfaceColors;

				context.lods = e.data.lods;
				context.objectColors = e.data.objectColors;
				context.surfaceColors = e.data.surfaceColors;

				if ( e.data.geometryData.geometryType == TRIANGLES ) {

					const mesh = new CityObjectsMesh( vertices, geometryData, m, material );
					scene.add( mesh );

				}

				if ( e.data.geometryData.geometryType == LINES ) {

					const material = new CityObjectsLineMaterial( {

						color: 0xffffff,
						linewidth: 0.001,
						vertexColors: false,
						dashed: false,
						objectColors: context.objectColors,
						surfaceColors: context.surfaceColors

					} );
					const lines = new CityObjectsLines( vertices, geometryData, m, material );
					scene.add( lines );

				}

				if ( e.data.geometryData.geometryType == POINTS ) {

					const material = new CityObjectsPointsMaterial( {
						size: 10,
						objectColors: context.objectColors,
						surfaceColors: context.surfaceColors
					} );
					const points = new CityObjectsPoints( vertices, geometryData, m, material );
					scene.add( points );

				}

				if ( onChunkLoad ) {

					onChunkLoad();

				}

			} else if ( e.data.type === "done" ) {

				context.loading = false;

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

					const instancedMaterial = new CityObjectsMaterial( ShaderLib.lambert );
					instancedMaterial.objectColors = this.objectColors;
					instancedMaterial.surfaceColors = this.surfaceColors;

					const mesh = new CityObjectsInstancedMesh( templatesGeomData[ i ].getVertices( vertices ), templatesGeomData[ i ], instances[ i ], m, material );
					scene.add( mesh );


				}

			}

		}

	}

}
