import FrameView from "./frame-view.js";

export class Renderer {
    constructor() {
        this.w = window.innerWidth;
        this.h = window.innerHeight;
        this.canvas = undefined;
        this.lastFrame = 0;
        this.view = new FrameView();
    }

    /**
    * @param {HTMLCanvasElement} canvas 
    * @returns {Renderer}
    */
    init(canvas) {
        if (!(canvas instanceof HTMLCanvasElement)) throw Error("Renderer.init() only accepts a HTMLCanvasElement");
        this.canvas = canvas;
        this.canvas.width = this.w;
        this.canvas.height = this.h;
        return this;
    }

    /**
    * @param {number} width 
    * @param {number} height 
    * @returns {Renderer}
    */
    resize(width, height) {
        this.w = width;
        this.h = height;
        if (this.canvas != undefined) {
            this.canvas.width = this.w;
            this.canvas.height = this.h;
        }
        return this;
    }

    /**
    * @param {WebAssembly.WebAssemblyInstantiatedSource} wasm
    * @param {number} addr
    */
    updateView(wasm, addr) {
        this.view.make(wasm, addr);
    }

    /**
    * @param {ArrayBuffer} buffer
    */
    render(buffer) {
        const frame = this.view.read();

        if (frame.version != this.lastFrame) {
            const len = frame.stride * frame.height;
            const pixels = new Uint8Array(buffer, frame.ptr, len);
            // TODO: updated to WebGL
        }
        this.lastFrame = frame.version;
    }
}
