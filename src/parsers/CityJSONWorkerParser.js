import {
	BufferAttribute,
	BufferGeometry,
	Int32BufferAttribute,
	Mesh,
	Points,
	ShaderLib } from 'three';
import { defaultObjectColors, defaultSemanticsColors } from '../defaults/colors.js';
import { POINTS, LINES, TRIANGLES } from './geometry/GeometryData';
import 'three/examples/jsm/lines/LineMaterial';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { CityObjectsMaterial } from '../materials/CityObjectsMaterial.js';
import { CityObjectsMesh } from '../objects/CityObjectsMesh.js';
import { CityObjectsLines } from '../objects/CityObjectsLines.js';
import { CityObjectsPoints } from '../objects/CityObjectsPoints.js';
import { CityObjectsLineMaterial } from '../materials/CityObjectsLineMaterial.js';
import { CityObjectsPointsMaterial } from '../materials/CityObjectsPointsMaterial.js';

export class CityJSONWorkerParser {

	constructor() {

		this.matrix = null;
		this.onChunkLoad = null;
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

		const worker = new Worker( "./helpers/ParserWorker.js" );
		const m = this.matrix;
		const onChunkLoad = this.onChunkLoad;
		const material = this.material;
		const context = this;

		worker.onmessage = function ( e ) {

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

				const material = new CityObjectsPointsMaterial();
				const points = new CityObjectsPoints( vertices, geometryData, m, material );
				scene.add( points );

			}

			context.loading = ! e.data.finished;

			if ( onChunkLoad ) {

				onChunkLoad();

			}

		};

		worker.postMessage( [ data, { chunkSize: this.chunkSize, objectColors: this.objectColors, lods: this.lods } ] );

	}

}
