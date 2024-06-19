import { Viewer, GLTFLoaderPlugin, Mesh, PhongMaterial, VBOGeometry } from "@xeokit/xeokit-sdk"
import Stats from 'stats.js'
import {buildLineGeometry} from '@xeokit/xeokit-sdk/src/viewer/scene/geometry/builders/buildLineGeometry.js'

class Renderer {
    viewer: Viewer
    stats: Stats
    loader: GLTFLoaderPlugin
    model
    constructor(canvasElement: HTMLCanvasElement) {
        this.viewer = new Viewer({
            canvasElement: canvasElement,
            transparent: true,
            dtxEnabled: true
        })

        this.stats = new Stats()
        this.stats.showPanel(0)
        this.viewer.scene.on("tick", e => {
            this.stats.begin()
            this.stats.end()
        })
        this.loader = new GLTFLoaderPlugin(this.viewer)
        this.renderGrid()
    }
    renderModel(model) {
        this.model = this.loader.load({
            gltf: model
        })

        this.model.on("loaded", () => {
            this.viewer.cameraFlight.jumpTo(this.model)
        })

        this.model.on("error", e => {
            console.log(e)
        })
    }
    private renderGrid(){
        for(let x = -100; x < 100; x++){
            const darkness = x % 10 == 0 ? 0.4 : 0.9
            new Mesh(this.viewer.scene, {
                geometry: new VBOGeometry(this.viewer.scene, buildLineGeometry({
                    startPoint: [x, 0,-100],
                    endPoint: [x, 0,100],
                })),
                material: new PhongMaterial(this.viewer.scene, {
                    color: [0, 0, 0],
                    emissive: [darkness, darkness, darkness]
                }),
                position: [0, 0, 0]
            });
        }
        for(let z = -100; z < 100; z++){
            const darkness = z % 10 == 0 ? 0.4 : 0.9
            new Mesh(this.viewer.scene, {
                geometry: new VBOGeometry(this.viewer.scene, buildLineGeometry({
                    startPoint: [-100, 0, z],
                    endPoint: [100, 0, z],
                })),
                material: new PhongMaterial(this.viewer.scene, {
                    color: [0, 0, 0],
                    emissive: [darkness, darkness, darkness]
                }),
                position: [0, 0, 0]
            });
        }
    }
}
// обёртка над API бекенда, согласно описанию в задаче IS-12
type Id = string
type UploadStatus = "inProgress" | "finished" // TODO указать значения, которые возвращает настоящий API
type GlbFile = ArrayBuffer
class API {
    private baseUrl: string
    constructor(baseUrl: string){
        this.baseUrl = baseUrl
    }    
    async upload(model: GlbFile): Promise<Id>{
        return "0"
    }
    async getStatus(id: Id): Promise<UploadStatus>{
        return "inProgress"
    }
    async getGlbFile(id: Id): Promise<GlbFile>{
        const response = await fetch(`${this.baseUrl}/glbFile/${id}`)
        if(!response.ok){
            throw new Error(`Не удалось получить glb файл. Ошибка ${response.status} - ${response.statusText}`)
        }
        return await response.arrayBuffer()
    }
}

(async() => {
    const API_URL = "http://localhost:3000/api-mock"
    const MODEL_ID = "1"
    
    const api = new API(API_URL)
    const canvasElement = document.querySelector("canvas")!
    const renderer = new Renderer(canvasElement)
    renderer.renderModel(await api.getGlbFile(MODEL_ID))
    document.body.appendChild(renderer.stats.dom)
})()