import { Vector3 } from 'three';
import {
	BufferAttribute,
	BufferGeometry,
	Group,
	Matrix4 } from 'three';
import { CityJSONWorkerParser } from '../parsers/CityJSONWorkerParser';

export class CityJSONLoader {

	constructor( parser ) {

		this.texturesPath = '';
		this.scene = new Group();
		this.matrix = null;
		this.boundingBox = null;
		this.parser = parser || new CityJSONWorkerParser();

	}

	setTexturesPath( path ) {

		this.texturesPath = path;

	}

	load( data ) {

		if ( typeof data === "object" ) {

			// We shallow clone the object to avoid modifying the original
			// objects vertices
			const new_data = Object.assign( {}, data );
			// new_data.vertices = this.applyTransform( data );
			const transform = new Matrix4().identity();

			if ( data[ "transform" ] != undefined ) {

				const t = data.transform.translate;
				const s = data.transform.scale;

				transform.set(
					s[ 0 ], 0, 0, t[ 0 ],
					0, s[ 1 ], 0, t[ 1 ],
					0, 0, s[ 2 ], t[ 2 ],
					0, 0, 0, 1
				);

			}

			if ( this.matrix == null ) {

				this.computeMatrix( new_data );

				this.matrix = transform;
				this.matrix.setPosition( 0, 0, 0 );

			}

			this.parser.matrix = this.matrix;
			this.parser.parse( new_data, this.scene );

		}

	}

	applyTransform( data ) {

		if ( data[ "transform" ] != undefined ) {

			const t = data.transform.translate;
			const s = data.transform.scale;

			const vertices = data.vertices.map( v =>
				[
					v[ 0 ] * s[ 0 ] + t[ 0 ],
					v[ 1 ] * s[ 1 ] + t[ 1 ],
					v[ 2 ] * s[ 2 ] + t[ 2 ]
				]
			);

			return vertices;

		}

		return data.vertices;

	}

	/**
	 * Computes a matrix that transforms the dataset close to the origin.
	 *
	 * @param {Object} data The CityJSON data
	 */
	computeMatrix( data, scale = false ) {

		const normGeom = new BufferGeometry();

		const vertices = new Float32Array( data.vertices.map( v => [ v[ 0 ], v[ 1 ], v[ 2 ] ] ).flat() );
		normGeom.setAttribute( 'position', new BufferAttribute( vertices, 3 ) );

		normGeom.computeBoundingBox();
		this.boundingBox = normGeom.boundingBox;
		const centre = new Vector3();

		normGeom.boundingBox.getCenter( centre );
		centre.setZ( 0 );
		// const radius = normGeom.boundingSphere.radius;

		// const s = scale ? radius === 0 ? 1 : 1.0 / radius : 1;
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

}
