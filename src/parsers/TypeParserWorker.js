import {
	Vector3
} from 'three';
import earcut from 'earcut';

onmessage = function ( e ) {

	const parser = new ObjectTypeParser();

	const props = e.data[ 1 ];

	if ( props ) {

		if ( props.chunkSize ) {

			parser.chunkSize = props.chunkSize;

		}

	}

	parser.parse( e.data[ 0 ], ( v, objectIds, objectType ) => {

		const vertexArray = new Float32Array( v );
		const vertexBuffer = vertexArray.buffer;

		const msg = {
			v_buffer: vertexBuffer,
			objectIds,
			objectType
		};
		postMessage( msg, [ vertexBuffer ] );

	} );

};

class ObjectTypeParser {

	constructor() {

		this.matrix = null;
		this.chunkSize = 100;

		this.meshVertices = [];
		this.meshObjIds = [];
		this.meshObjType = [];

		this.objectColors = {
			"Building": 0x7497df,
			"BuildingPart": 0x7497df,
			"BuildingInstallation": 0x7497df,
			"Bridge": 0x999999,
			"BridgePart": 0x999999,
			"BridgeInstallation": 0x999999,
			"BridgeConstructionElement": 0x999999,
			"CityObjectGroup": 0xffffb3,
			"CityFurniture": 0xcc0000,
			"GenericCityObject": 0xcc0000,
			"LandUse": 0xffffb3,
			"PlantCover": 0x39ac39,
			"Railway": 0x000000,
			"Road": 0x999999,
			"SolitaryVegetationObject": 0x39ac39,
			"TINRelief": 0xffdb99,
			"TransportSquare": 0x999999,
			"Tunnel": 0x999999,
			"TunnelPart": 0x999999,
			"TunnelInstallation": 0x999999,
			"WaterBody": 0x4da6ff
		};

		this.objectIds = [];

	}

	parse( data, action ) {

		this.meshVertices = [];
		this.meshObjIds = [];
		this.meshObjType = [];

		let i = 0;

		for ( const objectId in data.CityObjects ) {

			this.objectIds.push( objectId );

			this.parseObject( objectId, data );
			if ( i ++ > this.chunkSize ) {

				this.returnObjects( data, action );

				this.meshVertices = [];
				this.meshObjIds = [];
				this.meshObjType = [];

				i = 0;

			}

		}

		this.returnObjects( data, action );

	}

	returnObjects( data, action ) {

		if ( this.meshVertices.length == 0 ) {

			return;

		}

		let vertices = [];

		for ( const vertexIndex of this.meshVertices ) {

			const vertex = data.vertices[ vertexIndex ];

			vertices.push( ...vertex );

		}

		action( vertices, this.meshObjIds, this.meshObjType );

	}

	parseObject( objectId, json ) {

		const cityObject = json.CityObjects[ objectId ];

		if ( ! ( cityObject.geometry &&
                cityObject.geometry.length > 0 ) ) {

			return;

		}

		for ( let geom_i = 0; geom_i < cityObject.geometry.length; geom_i ++ ) {

			const geomType = cityObject.geometry[ geom_i ].type;

			if ( geomType == "Solid" ) {

				const shells = cityObject.geometry[ geom_i ].boundaries;

				for ( let i = 0; i < shells.length; i ++ ) {

					this.parseShell( shells[ i ], objectId, json );

				}

			} else if ( geomType == "MultiSurface" || geomType == "CompositeSurface" ) {

				const surfaces = cityObject.geometry[ geom_i ].boundaries;

				this.parseShell( surfaces, objectId, json );

			} else if ( geomType == "MultiSolid" || geomType == "CompositeSolid" ) {

				const solids = cityObject.geometry[ geom_i ].boundaries;

				for ( let i = 0; i < solids.length; i ++ ) {

					for ( let j = 0; j < solids[ i ].length; j ++ ) {

						this.parseShell( solids[ i ][ j ], objectId, json );

					}

				}

			}

		}

	}

	parseShell( boundaries, id, json ) {

		let vertices = this.meshVertices;
		let objIds = this.meshObjIds;
		let objTypes = this.meshObjType;

		const idIdx = this.objectIds.indexOf( id );

		const objType = Object.keys( this.objectColors ).indexOf( json.CityObjects[ id ].type );

		// Contains the boundary but with the right verticeId
		for ( let i = 0; i < boundaries.length; i ++ ) {

			let boundary = [];
			let holes = [];

			for ( let j = 0; j < boundaries[ i ].length; j ++ ) {

				if ( boundary.length > 0 ) {

					holes.push( boundary.length );

				}

				// const new_boundary = this.extractLocalIndices( geom, boundaries[ i ][ j ], vertices, json );
				// boundary.push( ...new_boundary );
				boundary.push( ...boundaries[ i ][ j ] );

			}

			if ( boundary.length == 3 ) {

				for ( let n = 0; n < 3; n ++ ) {

					vertices.push( boundary[ n ] );
					objIds.push( idIdx );
					objTypes.push( objType );

				}


			} else if ( boundary.length > 3 ) {

				//create list of points
				let pList = [];
				for ( let k = 0; k < boundary.length; k ++ ) {

					pList.push( {
						x: json.vertices[ boundary[ k ] ][ 0 ],
						y: json.vertices[ boundary[ k ] ][ 1 ],
						z: json.vertices[ boundary[ k ] ][ 2 ]
					} );

				}

				//get normal of these points
				const normal = this.get_normal_newell( pList );

				//convert to 2d (for triangulation)
				let pv = [];
				for ( let k = 0; k < pList.length; k ++ ) {

					const re = this.to_2d( pList[ k ], normal );
					pv.push( re.x );
					pv.push( re.y );

				}

				//triangulate
				const tr = earcut( pv, holes, 2 );

				// create faces based on triangulation
				for ( let k = 0; k < tr.length; k += 3 ) {

					for ( let n = 0; n < 3; n ++ ) {

						const vertex = boundary[ tr[ k + n ] ];
						vertices.push( vertex );
						objIds.push( idIdx );
						objTypes.push( objType );

					}

				}

			}

		}

	}

	extractLocalIndices( geom, boundary, indices, json ) {

		let new_boundary = [];

		let j;
		for ( j = 0; j < boundary.length; j ++ ) {

			//the original index from the json file
			let index = boundary[ j ];

			//if this index is already there
			if ( indices.includes( index ) ) {

				let vertPos = indices.indexOf( index );
				new_boundary.push( vertPos );

			} else {

				// Add vertex to geometry
				let point = new Vector3(
					json.vertices[ index ][ 0 ],
					json.vertices[ index ][ 1 ],
					json.vertices[ index ][ 2 ]
				);
				geom.vertices.push( point );

				new_boundary.push( indices.length );
				indices.push( index );

			}

		}

		return new_boundary;

	}

	getBbox( data ) {

		let bbox;

		if ( data[ "metadata" ] != undefined && data[ "metadata" ][ "geographicalExtent" ] != undefined ) {


			bbox = data[ "metadata" ][ "geographicalExtent" ];

			if ( data[ "transform" ] != undefined ) {

				const transform = data[ "transform" ];

				for ( let i = 0; i < 3; i ++ ) {

					bbox[ i ] = bbox[ i ] - transform[ "translate" ][ i ];
					bbox[ i + 3 ] = ( bbox[ i + 3 ] - transform[ "translate" ][ i ] ) / transform[ "scale" ][ i ];

				}

			}


		} else {

			const vertices = data.vertices;

			bbox = [ Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE ];

			for ( const v of vertices ) {

				const x = v[ 0 ];
				const y = v[ 1 ];
				const z = v[ 2 ];

				if ( x < bbox[ 0 ] ) {

					bbox[ 0 ] = x;

				} else if ( x > bbox[ 3 ] ) {

					bbox[ 3 ] = x;

				}

				if ( y < bbox[ 1 ] ) {

					bbox[ 1 ] = y;

				} else if ( y > bbox[ 4 ] ) {

					bbox[ 4 ] = y;

				}

				if ( z < bbox[ 2 ] ) {

					bbox[ 2 ] = z;

				} else if ( z > bbox[ 5 ] ) {

					bbox[ 5 ] = z;

				}

			}

		}

		return bbox;

	}

	get_normal_newell( indices ) {

		// find normal with Newell's method
		let n = [ 0.0, 0.0, 0.0 ];

		for ( let i = 0; i < indices.length; i ++ ) {

			let nex = i + 1;

			if ( nex == indices.length ) {

				nex = 0;

			}

			n[ 0 ] = n[ 0 ] + ( ( indices[ i ].y - indices[ nex ].y ) * ( indices[ i ].z + indices[ nex ].z ) );
			n[ 1 ] = n[ 1 ] + ( ( indices[ i ].z - indices[ nex ].z ) * ( indices[ i ].x + indices[ nex ].x ) );
			n[ 2 ] = n[ 2 ] + ( ( indices[ i ].x - indices[ nex ].x ) * ( indices[ i ].y + indices[ nex ].y ) );

		}

		let b = new Vector3( n[ 0 ], n[ 1 ], n[ 2 ] );
		return ( b.normalize() );

	}

	to_2d( p, n ) {

		p = new Vector3( p.x, p.y, p.z );
		let x3 = new Vector3( 1.1, 1.1, 1.1 );
		if ( x3.distanceTo( n ) < 0.01 ) {

			x3.add( new Vector3( 1.0, 2.0, 3.0 ) );

		}

		let tmp = x3.dot( n );
		let tmp2 = n.clone();
		tmp2.multiplyScalar( tmp );
		x3.sub( tmp2 );
		x3.normalize();
		let y3 = n.clone();
		y3.cross( x3 );
		let x = p.dot( x3 );
		let y = p.dot( y3 );
		let re = { x: x, y: y };
		return re;

	}

}
