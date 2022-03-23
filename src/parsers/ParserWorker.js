import { ChunkParser } from './ChunkParser.js';

onmessage = function ( e ) {

	const parser = new ChunkParser();

	const props = e.data[ 1 ];

	if ( props ) {

		if ( props.chunkSize ) {

			parser.chunkSize = props.chunkSize;

		}

		if ( props.objectColors ) {

			parser.objectColors = props.objectColors;

		}

		if ( props.lods ) {

			parser.lods = props.lods;

		}

	}

	parser.onchunkload = ( v, objectIds, objectType, surfaceType, geomIds, lodIds, boundaryIds, lods, objectColors, surfaceColors ) => {

		const vertexArray = new Float32Array( v );
		const vertexBuffer = vertexArray.buffer;

		const msg = {
			v_buffer: vertexBuffer,
			objectIds,
			objectType,
			surfaceType,
			geomIds,
			lodIds,
			boundaryIds,
			lods,
			objectColors,
			surfaceColors
		};
		postMessage( msg, [ vertexBuffer ] );

	};

	parser.parse( e.data[ 0 ] );

};

