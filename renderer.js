import FrameView from "./frame-view.js";
import { ShaderProgram } from "./shader-program.js";
import { frame_frag_shader, frame_vert_shader } from "./shaders/frame-shader.js";

export class Renderer {
    constructor() {
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        this.w = Math.floor(window.innerWidth * dpr);
        this.h = Math.floor(window.innerHeight * dpr);
        this.canvas = undefined;
        this.lastFrame = 0;
        this.view = new FrameView();
        this.gl = undefined;
        this.shaderProgram = undefined;
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
        this.gl = this.canvas.getContext("webgl2");
        if (!this.gl) throw Error("WebGL2 is not supported by this browser");
        this.makeProgram();
        return this;
    }

    makeProgram() {
        this.shaderProgram = new ShaderProgram(this.gl)
        .add_vertex_shader(frame_vert_shader)
        .add_fragment_shader(frame_frag_shader)
        .build()
        .build_uniforms(["u_resolution", "u_texture"])
        .build_attributes(["a_position", "a_texCoord"])
        .set_verticies(new Float32Array([
            0, 0, 0.0, 0.0, // top-left
            this.w, 0, 1.0, 0.0, // top-right
            0, this.h, 0.0, 1.0, // bottom-left
            this.w, this.h, 1.0, 1.0 // bottom-right
        ]))
        .set_indices(new Uint16Array([
            0, 1, 2,  // First triangle
            2, 1, 3   // Second triangle
        ]))
        .create_buffer("vertices")
        .create_buffer("indices")
        .create_texture()
        .create_vao();

        this.gl.useProgram(this.shaderProgram.get_program());
        this.gl.bindVertexArray(this.shaderProgram.get_vao());

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.shaderProgram.get_buffer("vertices"));
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.shaderProgram.get_verticies(), this.gl.STATIC_DRAW);

        const stride = 4 * Float32Array.BYTES_PER_ELEMENT;
        this.gl.vertexAttribPointer(this.shaderProgram.get_attribute("a_position"), 2, this.gl.FLOAT, false, stride, 0);
        this.gl.enableVertexAttribArray(this.shaderProgram.get_attribute("a_position"));
        this.gl.vertexAttribPointer(this.shaderProgram.get_attribute("a_texCoord"), 2, this.gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);
        this.gl.enableVertexAttribArray(this.shaderProgram.get_attribute("a_texCoord"));

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.shaderProgram.get_buffer("indices"));
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.shaderProgram.get_indices(), this.gl.STATIC_DRAW);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.shaderProgram.get_texture());
        this.gl.texStorage2D(this.gl.TEXTURE_2D, 1, this.gl.RGBA8, this.w, this.h);

        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.uniform1i(this.shaderProgram.get_uniform("u_texture"), 0);

        this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 4);
        this.gl.pixelStorei(this.gl.UNPACK_ROW_LENGTH, 0);

        this.gl.bindVertexArray(null);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    }

    /**
    * @param {number} width 
    * @param {number} height 
    * @returns {Renderer}
    */
    resize(width, height) {
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        this.w = Math.floor(width * dpr);
        this.h = Math.floor(height * dpr);

        if (this.canvas != undefined) {
            this.canvas.width = this.w;
            this.canvas.height = this.h;
        }

        if (!this.gl || !this.shaderProgram) return this;

        const verts = new Float32Array([
            0,     0,     0, 0,
            this.w,0,     1, 0,
            0,     this.h,0, 1,
            this.w,this.h,1, 1
        ]);
        this.gl.bindVertexArray(this.shaderProgram.get_vao());
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.shaderProgram.get_buffer("vertices"));
        this.gl.bufferData(this.gl.ARRAY_BUFFER, verts, this.gl.STATIC_DRAW);
        this.gl.bindVertexArray(null);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.shaderProgram.get_texture());
        this.gl.texStorage2D(this.gl.TEXTURE_2D, 1, this.gl.RGBA8, this.w, this.h);

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
        if (this.gl == undefined) throw Error("Cannot call render() before init()");
        if (!this.shaderProgram) this.makeProgram();

        const frame = this.view.read();

        this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
        this.gl.clearColor(0,0,0,0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.gl.useProgram(this.shaderProgram.get_program());
        this.gl.bindVertexArray(this.shaderProgram.get_vao());

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.shaderProgram.get_texture());

        this.gl.uniform2f(
            this.shaderProgram.get_uniform("u_resolution"),
            this.gl.drawingBufferWidth,
            this.gl.drawingBufferHeight
        );

        if (frame.version != this.lastFrame && frame.width == this.w && frame.height == this.h) {
            const len = frame.stride * frame.height;
            const pixels = new Uint8Array(buffer, frame.ptr, len);

            this.gl.texSubImage2D(
                this.gl.TEXTURE_2D, 0,
                0, 0,
                this.w, this.h,
                this.gl.RGBA, this.gl.UNSIGNED_BYTE,
                pixels
            );
        }
        this.gl.drawElements(this.gl.TRIANGLES, this.shaderProgram.get_indices().length, this.gl.UNSIGNED_SHORT, 0);

        this.gl.bindVertexArray(null);

        this.lastFrame = frame.version;
    }
}
