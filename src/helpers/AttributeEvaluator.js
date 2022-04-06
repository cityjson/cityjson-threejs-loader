export class AttributeEvaluator {

	constructor( citymodel, attributeName, includeNulls = false, checkParents = true, checkChildren = true ) {

		this.citymodel = citymodel;
		this.attributeName = attributeName;

		this.includeNulls = includeNulls;
		this.checkParents = checkParents;
		this.checkChildren = checkChildren;

		this.allValues = [];
		this.uniqueValues = [];

	}

	getAttributeValue( objectId, checkParent = true, checkChildren = true ) {

		const cityobject = this.citymodel.CityObjects[ objectId ];

		if ( cityobject.attributes && cityobject.attributes[ this.attributeName ] !== undefined ) {

			return cityobject.attributes[ this.attributeName ];

		}

		if ( checkParent && cityobject.parents ) {

			for ( const parentId of cityobject.parents ) {

				return this.getAttributeValue( parentId, true, false );

			}

		}

		if ( checkChildren && cityobject.children || cityobject.members ) {

			const children = cityobject.children ? cityobject.children : cityobject.members;

			for ( const childId of children ) {

				return this.getAttributeValue( childId, false, true );

			}

		}

		return null;

	}

	getAllValues() {

		if ( this.allValues.length == 0 ) {

			const allValues = [];

			for ( const objId in this.citymodel.CityObjects ) {

				allValues.push( String( this.getAttributeValue( objId, this.checkParents, this.checkChildren ) ) );

			}

			this.allValues = allValues;

		}

		return this.allValues;

	}

	getUniqueValues() {

		if ( this.uniqueValues.length == 0 ) {

			const uniqueValues = new Set( this.getAllValues() );

			if ( ! this.includeNulls ) {

				uniqueValues.delete( null );

			}

			// This is a weird hack, but it's because sorting of keys is different
			// than sorting the values in any logical way. So we create a fake
			// object and just take its keys with the order that JS decides to
			// sort them.

			const colors = {};

			for ( const value of [ ...uniqueValues ].sort() ) {

				colors[ value ] = '';

			}

			this.uniqueValues = Object.keys( colors );

		}

		return this.uniqueValues;

	}

	createColors() {

		const uniqueValues = this.getUniqueValues();
		const colors = {};

		for ( const value of uniqueValues ) {

			colors[ value ] = Math.floor( Math.random() * 0xffffff );

		}

		return colors;

	}

}
