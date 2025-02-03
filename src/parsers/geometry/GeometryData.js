// Geometry types
export const POINTS = 0
export const LINES = 1
export const TRIANGLES = 2

export class GeometryData {
    constructor(geometryType) {
        this.geometryType = geometryType

        this.vertexIds = []
        this.objectIds = []
        this.objectTypes = []
        this.semanticSurfaces = []
        this.geometryIds = []
        this.boundaryIds = []
        this.lodIds = []
        this.materials = {}
        this.textures = {}
    }

    appendMaterial(theme, v) {
        if (!(theme in this.materials)) {
            this.materials[theme] = []
        }

        const themeArray = this.materials[theme]

        for (let i = themeArray.length; i < this.count() - 1; i++) {
            themeArray.push(-1)
        }

        this.materials[theme].push(v)
    }

    appendTexture(theme, values) {
        if (!(theme in this.textures)) {
            this.textures[theme] = {
                index: [],
                uvs: [],
            }
        }

        const themeObject = this.textures[theme]

        for (let i = themeObject.index.length; i < this.count() - 1; i++) {
            themeObject.index.push(-1)
            themeObject.uvs.push([0, 0])
        }

        themeObject.index.push(values.index)
        themeObject.uvs.push(values.uvs)
    }

    addVertex(vertexId, objectId, objectType, surfaceType, geometryIdx, boundaryIdx, lodIdx, material, texture) {
        this.vertexIds.push(vertexId)
        this.objectIds.push(objectId)
        this.objectTypes.push(objectType)
        this.semanticSurfaces.push(surfaceType)
        this.geometryIds.push(geometryIdx)
        this.boundaryIds.push(boundaryIdx)
        this.lodIds.push(lodIdx)

        if (material) {
            const context = this

            Object.entries(material).forEach((entry) => {
                const [theme, value] = entry

                context.appendMaterial(theme, value)
            })
        }

        if (texture) {
            const context = this

            Object.entries(texture).forEach((entry) => {
                const [theme, value] = entry

                context.appendTexture(theme, value)
            })
        }
    }

    completeMaterials() {
        for (const theme in this.materials) {
            const themeArray = this.materials[theme]

            for (let i = themeArray.length; i < this.count(); i++) {
                themeArray.push(-1)
            }
        }
    }

    completeTextures() {
        for (const theme in this.textures) {
            const themeObject = this.textures[theme]

            for (let i = themeObject.index.length; i < this.count(); i++) {
                themeObject.index.push(-1)
                themeObject.uvs.push([0, 0])
            }
        }
    }

    count() {
        return this.vertexIds.length
    }

    getVertices(vertexList) {
        let vertices = []

        for (const vertexIndex of this.vertexIds) {
            const vertex = vertexList[vertexIndex]

            vertices.push(...vertex)
        }

        return vertices
    }

    toObject() {
        this.completeMaterials()
        this.completeTextures()

        return {
            geometryType: this.geometryType,
            objectIds: this.objectIds,
            objectType: this.objectTypes,
            semanticSurfaces: this.semanticSurfaces,
            geometryIds: this.geometryIds,
            boundaryIds: this.boundaryIds,
            lodIds: this.lodIds,
            materials: this.materials,
            textures: this.textures,
        }
    }

    setObjectId(objectId) {
        for (let i = 0; i < this.objectIds.length; i++) {
            this.objectIds[i] = objectId
        }
    }

    setObjectType(objectType) {
        for (let i = 0; i < this.objectTypes.length; i++) {
            this.objectTypes[i] = objectType
        }
    }

    setGeometryIdx(geometryIdx) {
        for (let i = 0; i < this.geometryIds.length; i++) {
            this.geometryIds[i] = geometryIdx
        }
    }

    merge(otherGeomData) {
        if (otherGeomData.geometryType != this.geometryType) {
            console.warn('Merging different types of geometry data!')
        }

        this.vertexIds.concat(this.otherGeomData.vertexId)
        this.objectIds.concat(this.otherGeomData.objectId)
        this.objectTypes.concat(this.otherGeomData.objectType)
        this.semanticSurfaces.concat(this.otherGeomData.surfaceType)
        this.geometryIds.concat(this.otherGeomData.geometryIdx)
        this.boundaryIds.concat(this.otherGeomData.boundaryIdx)
        this.lodIds.concat(this.otherGeomData.lodIdx)
    }
}
