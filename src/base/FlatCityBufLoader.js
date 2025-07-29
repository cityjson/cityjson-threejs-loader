import { Vector3 } from 'three';
import {
	BufferAttribute,
	BufferGeometry,
	Group,
	Matrix4,
	BoxGeometry,
	MeshBasicMaterial,
	Mesh
} from 'three';
import { CityJSONWorkerParser } from '../parsers/CityJSONWorkerParser';
import init, { cjseqToCj } from '@cityjson/cjseq';
export class FlatCityBufLoader {

	constructor(parser) {

		this.texturesPath = '';
		this.scene = new Group();
		this.matrix = null;
		this.originalTransform = null; // Store original CityJSON transform for coordinate conversion
		this.boundingBox = null;
		this.geographicalExtent = null;
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

		// Visualization helpers
		this.extentHelper = null;
		this.geographicalExtentHelper = null;

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


			// Import the real FlatCityBuf module
			const fcb = await import('@cityjson/flatcitybuf');

			// Initialize WASM
			await fcb.default();

			this._wasmModule = fcb;
			this._wasmInitialized = true;

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
				this.geographicalExtent = this.header.metadata.geographicalExtent;
				const ge = this.geographicalExtent;
				const center = [ge[0] + (ge[3] - ge[0]) / 2, ge[1] + (ge[4] - ge[1]) / 2];
				const bbox = {
					minX: center[0] - 1000,
					minY: center[1] - 1000,
					maxX: center[0] + 1000,
					maxY: center[1] + 1000
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

			// Clear previous scene except for the geographical extent helper
			const objectsToRemove = [];
			this.scene.traverse(child => {

				if (child.isMesh && child !== this.geographicalExtentHelper) {

					objectsToRemove.push(child);

				}

			});
			objectsToRemove.forEach(obj => this.scene.remove(obj));
			// this.scene.clear();

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

				// Store original transform for coordinate conversion
				console.log("transform:", transform);
				console.log("originalTransform:", this.originalTransform);

				this.originalTransform = transform.clone();

			}

			if (this.matrix == null) {

				this.computeMatrix(cityJsonData);

				this.matrix = transform;
				this.matrix.setPosition(0, 0, 0);

			}




			this.parser.matrix = this.matrix;
			this.parser.parse(cityJsonData, this.scene);

			console.log("this scene:", this.scene);

			// Create geographical extent visualization on first load
			if (!this.geographicalExtentHelper) {

				this.createGeographicalExtentHelper();

			}

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

				this._cjseq = await init();
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

		const vertices = new Float32Array(data.vertices.flatMap(v => [v[0], v[1], v[2]]));
		normGeom.setAttribute('position', new BufferAttribute(vertices, 3));

		normGeom.computeBoundingBox();
		this.boundingBox = normGeom.boundingBox;
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

	createGeographicalExtentHelper() {

		if (!this.geographicalExtent) {

			return null;

		}

		// Remove existing helper if it exists
		if (this.geographicalExtentHelper) {

			this.scene.remove(this.geographicalExtentHelper);

		}

		// Create geographical extent visualization
		const [minX, minY, minZ, maxX, maxY, maxZ] = this.geographicalExtent;

		// Transform the extent corners to get proper dimensions in display coordinates
		const minCorner = new Vector3(minX, minY, minZ);
		const maxCorner = new Vector3(maxX, maxY, maxZ);

		// Apply coordinate transformations to both corners
		if (this.originalTransform) {

			const inverseOriginal = this.originalTransform.clone().invert();
			minCorner.applyMatrix4(inverseOriginal);
			maxCorner.applyMatrix4(inverseOriginal);

		}

		if (this.matrix) {

			minCorner.applyMatrix4(this.matrix);
			maxCorner.applyMatrix4(this.matrix);

		}

		// Calculate dimensions in transformed coordinate space
		const width = Math.abs(maxCorner.x - minCorner.x);
		const depth = Math.abs(maxCorner.z - minCorner.z);
		const height = Math.max(Math.abs(maxCorner.y - minCorner.y), 50); // Minimum height for visibility

		const geoExtentGeometry = new BoxGeometry(width, height, depth);
		const geoExtentMaterial = new MeshBasicMaterial({
			color: 0x00ff00,
			wireframe: true,
			transparent: true,
			opacity: 0.9
		});

		this.geographicalExtentHelper = new Mesh(geoExtentGeometry, geoExtentMaterial);

		// Position at center of transformed extent
		const centerPoint = new Vector3(
			(minCorner.x + maxCorner.x) / 2,
			(minCorner.y + maxCorner.y) / 2,
			(minCorner.z + maxCorner.z) / 2
		);

		this.geographicalExtentHelper.position.copy(centerPoint);
		this.scene.add(this.geographicalExtentHelper);

		return this.geographicalExtentHelper;

	}

	createDynamicExtentHelper(intersectionPoint) {

		// Remove existing helper if it exists
		if (this.extentHelper) {

			this.scene.remove(this.extentHelper);

		}

		// The intersection point is in Three.js display coordinates
		// We need to transform it back to Dutch coordinates to create the bounding box
		const dutchPoint = intersectionPoint.clone();

		// Reverse the display transformation
		if (this.matrix) {

			const inverseMatrix = this.matrix.clone().invert();
			dutchPoint.applyMatrix4(inverseMatrix);

		}

		// Apply original transform to get Dutch coordinates
		if (this.originalTransform) {

			dutchPoint.applyMatrix4(this.originalTransform);

		}

		// Create 1000m × 1000m bounding box corners in Dutch coordinates
		const minCorner = new Vector3(dutchPoint.x - 500, 0, dutchPoint.y - 500);
		const maxCorner = new Vector3(dutchPoint.x + 500, 10, dutchPoint.y + 500); // Small height for visibility

		// Transform corners back to display coordinates
		if (this.originalTransform) {

			const inverseOriginal = this.originalTransform.clone().invert();
			minCorner.applyMatrix4(inverseOriginal);
			maxCorner.applyMatrix4(inverseOriginal);

		}

		if (this.matrix) {

			minCorner.applyMatrix4(this.matrix);
			maxCorner.applyMatrix4(this.matrix);

		}

		// Calculate dimensions in transformed coordinate space
		const width = Math.abs(maxCorner.x - minCorner.x);
		const depth = Math.abs(maxCorner.z - minCorner.z);
		const height = Math.max(Math.abs(maxCorner.y - minCorner.y), 50); // Fixed small height for visibility

		// Create extent visualization helper
		const extentGeometry = new BoxGeometry(width, height, depth);
		const extentMaterial = new MeshBasicMaterial({
			color: 0xff0000,
			wireframe: true
		});

		this.extentHelper = new Mesh(extentGeometry, extentMaterial);

		// Position at center of transformed extent
		const centerPoint = new Vector3(
			(minCorner.x + maxCorner.x) / 2,

			(minCorner.z + maxCorner.z) / 2
		);

		this.extentHelper.position.copy(centerPoint);

		this.scene.add(this.extentHelper);

		return this.extentHelper;

	}

	updateDynamicExtentHelper(intersectionPoint) {

		// Always recreate to ensure proper transformation with current intersection point
		this.createDynamicExtentHelper(intersectionPoint);

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
