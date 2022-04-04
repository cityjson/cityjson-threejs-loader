import { ShaderLib } from 'three';
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

			const geometryParsers = [
				new TriangleParser( data, Object.keys( data.CityObjects ), this.objectColors ),
				new LineParser( data, Object.keys( data.CityObjects ), this.objectColors ),
				new PointParser( data, Object.keys( data.CityObjects ), this.objectColors )
			];

			for ( const template of data[ 'geometry-templates' ].templates ) {

				for ( const geometryParser of geometryParsers ) {

					geometryParser.lods = this.lods;
					geometryParser.parseGeometry( template, - 1, - 1 );
					this.lods = geometryParser.lods;

				}

			}

		}

	}

}
