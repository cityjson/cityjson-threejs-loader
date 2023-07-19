import { defaultSemanticsColors } from '../../defaults/colors.js';

export class BaseParser {

	constructor( json, objectIds, objectColors ) {

		this.json = json;

		this.objectIds = objectIds;
		this.objectColors = objectColors;
		this.surfaceColors = defaultSemanticsColors;
		this.lods = [];

	}

	clean() { }

	parseGeometry( geometry, objectId, geomIdx ) {}

	getObjectIdx( objectId ) {

		return this.objectIds.indexOf( objectId );

	}

	getObjectTypeIdx( cityObjectTypeName ) {

		let objType = Object.keys( this.objectColors ).indexOf( cityObjectTypeName );

		if ( objType < 0 ) {

			objType = Object.keys( this.objectColors ).length;
			this.objectColors[ cityObjectTypeName ] = Math.floor( Math.random() * 0xffffff );

		}

		return objType;

	}

	getSurfaceTypeIdx( idx, semantics, surfaces ) {

		let surfaceType = - 1;
		if ( semantics.length > 0 ) {

			const surface = surfaces[ semantics[ idx ] ];

			if ( surface ) {

				surfaceType = Object.keys( this.surfaceColors ).indexOf( surface.type );

				if ( surfaceType < 0 ) {

					surfaceType = Object.keys( this.surfaceColors ).length;
					this.surfaceColors[ surface.type ] = Math.floor( Math.random() * 0xffffff );

				}

			}

		}

		return surfaceType;

	}

	getSurfaceMaterials( idx, material ) {

		const pairs = Object.entries( material ).map( mat => {

			const [ theme, obj ] = mat;

			if ( obj.values ) {

				return [ theme, obj.values[ idx ] ];

			} else if ( obj.value !== undefined ) {

				return [ theme, obj.value ];

			} else {

				return [ theme, - 1 ];

			}

		} );

		return Object.fromEntries( pairs );

	}

	getTextureData( surfaceIndex, vertexIndex, holes, texture ) {

		if ( this.json.appearance && this.json.appearance[ 'vertices-texture' ] ) {

			const textureVertices = this.json.appearance[ 'vertices-texture' ];

			const pairs = Object.entries( texture ).map( tex => {

				const [ theme, obj ] = tex;

				if ( obj.values ) {

					const activeHoles = holes.filter( v => v <= vertexIndex );

					const ringId = activeHoles.length;
					const vId = ringId ? vertexIndex - activeHoles[ activeHoles.length - 1 ] : vertexIndex;

					// TODO: This is very delicate
					const data = obj.values[ surfaceIndex ];

					if ( data[ 0 ][ 0 ] !== null ) {

						const uvs = textureVertices[ data[ ringId ][ vId + 1 ] ];

						return [ theme, { index: data[ 0 ][ 0 ], uvs } ];

					}


					return [ theme, { index: - 1, uvs: [ 0, 0 ] } ];

				} else {

					return [ theme, { index: - 1, uvs: [ 0, 0 ] } ];

				}

			} );

			return Object.fromEntries( pairs );

		}

		return undefined;

	}

	getLodIndex( lod ) {

		if ( lod === undefined ) {

			return - 1;

		}

		const lodIdx = this.lods.indexOf( lod );

		if ( lodIdx < 0 ) {

			const newIdx = this.lods.length;
			this.lods.push( lod );
			return newIdx;

		}

		return lodIdx;

	}

}
