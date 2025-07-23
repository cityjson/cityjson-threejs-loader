import { Group, Matrix4, Box3, Vector3 } from 'three';
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

		try {

			// Initialize HTTP reader for the FlatCityBuf file
			this.httpReader = await new this._wasmModule.HttpFcbReader(url);

			// Get header and metadata directly from reader
			this.header = await this.httpReader.cityjson();
			this.metadata = await this.httpReader.meta();
			this.isInitialized = true;

			console.log('FlatCityBuf URL set and metadata loaded:', url);



		} catch (error) {

			console.error('Failed to initialize FlatCityBuf reader:', error);
			throw error;

		}

	}



	async loadBbox(minX, minY, maxX, maxY) {

		if (!this.isInitialized) {

			throw new Error('FlatCityBuf loader not initialized. Call setUrl() first.');

		}

		try {

			console.log('Loading FlatCityBuf data for bbox:', { minX, minY, maxX, maxY });

			// Get CityJSON directly from FlatCityBuf
			const cityJsonData = await this._fetchCityJSON(minX, minY, maxX, maxY);

			console.log('Fetched CityJSON data from FlatCityBuf:', cityJsonData);

			// Clear previous scene
			this.clear();

			// Use the existing parser to create Three.js objects
			if (this.matrix == null) {

				this.computeMatrix(cityJsonData);

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

			// Create spatial query for bbox
			const queryObj = {
				type: "bbox",
				minX: minX,
				minY: minY,
				maxX: maxX,
				maxY: maxY
			};

			// Get features from iterator and convert to CityJSON
			const features = await this._fetchFeatures(minX, minY, maxX, maxY);

			if (!this._cjseqInitialized) {

				this._cjseq = init();
				this._cjseqInitialized = true;

			}

			const cityjson = cjseqToCj(this.header, features);


			// Convert Maps to JSON if needed
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
			for (let i = 0; i < this.maxFeatures; i++) {

				try {

					const feature = await iterator.next();
					features.push(feature);

				} catch (error) {

					console.error('Error fetching feature:', error);
					break;

				}

			}

			return features;

		} catch (error) {

			console.error('Error fetching features:', error);
			throw error;

		}

	}

}
