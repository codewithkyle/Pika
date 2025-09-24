export class Renderer {
    constructor() {
        this.w = window.innerWidth;
        this.h = window.innerHeight;
        this.canvas = undefined;
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
}
