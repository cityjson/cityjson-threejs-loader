import { Vector3 } from 'three';
import {
	BufferAttribute,
	BufferGeometry,
	Group,
	Matrix4
} from 'three';
import { CityJSONWorkerParser } from '../parsers/CityJSONWorkerParser';
import init, { cjseqToCj } from '@cityjson/cjseq';
export class FlatCityBufLoader {

	constructor(parser) {

		this.texturesPath = '';
		this.scene = new Group();
		this.matrix = null;
		this.boundingBox = null;
		this.parser = parser || new CityJSONWorkerParser();
		this.httpReader = null;
		this.fcbUrl = null;
		this.maxFeatures = 1000;
		this.metadata = null;
		this.header = null;
		this.isInitialized = false;

		this._httpReader = null;
		this._wasmModule = null;
		this._wasmInitialized = false;
		this._cjseqInitialized = false;
		this._cjseq = null;

	}

	setTexturesPath(path) {

		this.texturesPath = path;

	}

	setMaxFeatures(max) {

		this.maxFeatures = max;

	}

	async initWasm() {

		if (this._wasmInitialized && this._wasmModule) return this._wasmModule;

		try {

			console.log('Initializing FlatCityBuf WASM module...');

			// Import the real fcb_wasm module
			const fcb_wasm = await import('fcb_wasm');

			// Initialize WASM
			await fcb_wasm.default();

			this._wasmModule = fcb_wasm;
			this._wasmInitialized = true;

			console.log('FlatCityBuf WASM module initialized successfully');
			return this._wasmModule;

		} catch (error) {

			console.error('Failed to initialize FlatCityBuf WASM:', error);

		}

	}

	async setUrl(url) {

		this.fcbUrl = url;
		await this.initWasm();

	}



	async load(bbox = null) {

		let dataExtent = bbox;
		try {

			// Initialize HTTP reader for the FlatCityBuf file
			this.httpReader = await new this._wasmModule.HttpFcbReader(this.fcbUrl);


			// Get header and metadata directly from reader
			this.header = FlatCityBufLoader.mapToJson(await this.httpReader.cityjson());
			this.metadata = await this.httpReader.meta();
			if (!this.isInitialized) {

				this.isInitialized = true;

				// NOTE: Because there is not way to guess the first location of the data, we use the center of the geographical extent as the first location and a buffer of 500 meters
				const ge = this.header.metadata.geographicalExtent;
				const center = [ge[0] + (ge[3] - ge[0]) / 2, ge[1] + (ge[4] - ge[1]) / 2];
				const bbox = {
					minX: center[0] - 500,
					minY: center[1] - 500,
					maxX: center[0] + 500,
					maxY: center[1] + 500
				};

				dataExtent = { minX: bbox.minX, minY: bbox.minY, maxX: bbox.maxX, maxY: bbox.maxY };

			}



		} catch (error) {

			console.error('Failed to initialize FlatCityBuf reader:', error);
			throw error;

		}


		try {

			// Get CityJSON directly from FlatCityBuf
			const cityJsonData = await this._fetchCityJSON(dataExtent.minX, dataExtent.minY, dataExtent.maxX, dataExtent.maxY);

			// Clear previous scene
			this.scene.clear();

			const transform = new Matrix4().identity();

			if (cityJsonData["transform"] != undefined) {

				const t = cityJsonData.transform.translate;
				const s = cityJsonData.transform.scale;

				transform.set(
					s[0], 0, 0, t[0],
					0, s[1], 0, t[1],
					0, 0, s[2], t[2],
					0, 0, 0, 1
				);

			}

			if (this.matrix == null) {

				this.computeMatrix(cityJsonData);

				this.matrix = transform;
				this.matrix.setPosition(0, 0, 0);

			}

			this.parser.matrix = this.matrix;
			this.parser.parse(cityJsonData, this.scene);


			return this.scene;

		} catch (error) {

			console.error('Error loading FlatCityBuf data:', error);
			throw error;

		}

	}

	async _fetchCityJSON(minX, minY, maxX, maxY) {

		if (!this.httpReader) {

			throw new Error('HTTP reader not initialized');

		}

		try {


			// Get features from iterator and convert to CityJSON
			const features = await this._fetchFeatures(minX, minY, maxX, maxY);

			if (!this._cjseqInitialized) {

				this._cjseq = init();
				this._cjseqInitialized = true;

			}


			const cityjson = FlatCityBufLoader.mapToJson(await cjseqToCj(this.header, features));


			return cityjson;

		} catch (error) {

			console.error('Error fetching CityJSON from FlatCityBuf:', error);
			throw error;

		}

	}

	async _fetchFeatures(minX, minY, maxX, maxY) {

		if (!this.httpReader) {

			throw new Error('HTTP reader not initialized');

		}

		try {

			// Create spatial query for bounding box
			const spatialQuery = new this._wasmModule.WasmSpatialQuery({
				type: "bbox",
				minX: minX,
				minY: minY,
				maxX: maxX,
				maxY: maxY
			});

			// Use selectBbox method with offset and limit
			const iterator = await this.httpReader.select_spatial(spatialQuery);

			const features = [];
			while (true) {

				try {

					const feature = await iterator.next();
					if (!feature) {

						console.log('No more features');
						break;

					}

					const cjFeature = FlatCityBufLoader.mapToJson(feature);
					features.push(cjFeature);

				} catch (error) {

					console.error('Error fetching feature:', error);
					break;

				}

				if (features.length >= this.maxFeatures) {

					break;

				}

			}


			return features;

		} catch (error) {

			console.error('Error fetching features:', error);
			throw error;

		}

	}

	computeMatrix(data, scale = false) {

		const normGeom = new BufferGeometry();
		console.log('Data:', data);

		const vertices = new Float32Array(data.vertices.flatMap(v => [v[0], v[1], v[2]]));
		normGeom.setAttribute('position', new BufferAttribute(vertices, 3));

		normGeom.computeBoundingBox();
		this.boundingBox = normGeom.boundingBox;
		console.log('Bounding box:', this.boundingBox);
		const centre = new Vector3();

		normGeom.boundingBox.getCenter(centre);
		centre.setZ(0);

		const s = 1;

		const matrix = new Matrix4();
		matrix.set(
			s, 0, 0, - s * centre.x,
			0, s, 0, - s * centre.y,
			0, 0, s, - s * centre.z,
			0, 0, 0, 1
		);

		this.matrix = matrix;

	}

	static mapToJson(item) {

		// Handle Map objects
		if (item instanceof Map) {

			const obj = {};
			item.forEach((value, key) => {

				obj[key] = FlatCityBufLoader.mapToJson(value);

			});
			return obj;

		}

		// Handle arrays - recursively convert each item
		if (Array.isArray(item)) {

			return item.map(FlatCityBufLoader.mapToJson);

		}

		// Handle plain objects - recursively convert each property
		if (item && typeof item === "object" && item.constructor === Object) {

			const result = {};
			for (const key in item) {

				if (Object.prototype.hasOwnProperty.call(item, key)) {

					result[key] = FlatCityBufLoader.mapToJson((item)[key]);

				}

			}

			return result;

		}

		// Return primitives and other types unchanged
		return item;

	}


}
