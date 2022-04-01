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
