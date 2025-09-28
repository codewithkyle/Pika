export class ShaderProgram {
    constructor(gl){
        this.vs = undefined;
        this.fs = undefined;
        this.gl = gl;
        this.uniforms = {};
        this.attributes = {};
        this.program = undefined;
        this.verticies = undefined;
        this.indices = undefined;
        this.buffers = {};
        this.texture = undefined;
        this.vao = undefined;
        this.fbo = undefined;
    }

    create_fbo() {
        this.fbo = this.gl.createFramebuffer();
        return this;
    }

    get_fbo() {
        return this.fbo;
    }

    create_vao() {
        this.vao = this.gl.createVertexArray();
        return this;
    }

    get_vao() {
        return this.vao;
    }

    create_texture() {
        this.texture = this.gl.createTexture();
        return this;
    }

    get_texture() {
        if (this.texture === undefined) {
            throw new Error("Failed to get texture. Call create_texture() first.");
        }
        return this.texture;
    }

    get_indices() {
        return this.indices;
    }

    set_indices(indices) {
        this.indices = indices;
        return this;
    }

    set_verticies(verts) {
        this.verticies = verts;
        return this;
    }

    get_verticies() {
        return this.verticies;
    }

    create_buffer(key) {
        this.buffers[key] = this.gl.createBuffer();
        return this;
    }

    get_buffer(key) {
        if (!(key in this.buffers)) {
            throw new Error("Failed to get buffer. Call create_buffer(key) first.");
        }
        return this.buffers[key];
    }

    add_vertex_shader(source) {
        this.vs = this.compile_shader(source, this.gl.VERTEX_SHADER);
        return this;
    }

    add_fragment_shader(source) {
        this.fs = this.compile_shader(source, this.gl.FRAGMENT_SHADER);
        return this;
    }

    build() {
        this.program = this.link_program();
        return this;
    }

    get_uniform(uniform) {
        if (!(uniform in this.uniforms)) {
            throw new Error(`Failed to get uniform: ${uniform}.`);
        }
        return this.uniforms[uniform];
    }

    get_attribute(attr) {
        if (!(attr in this.attributes)) {
            throw new Error(`Failed to get attribute: ${attr}.`);
        }
        return this.attributes[attr];
    }

    get_program() {
        return this.program;
    }

    build_uniforms(uniforms) {
        if (this.program === undefined) {
            throw new Error("Failed to get uniforms: missing program. Call build() before getting uniforms.");
        }
        uniforms.forEach(name => {
            this.uniforms[name] = this.gl.getUniformLocation(this.program, name);
        });
        return this;
    }

    build_attributes(attrs) {
        if (this.program === undefined) {
            throw new Error("Failed to get attributes: missing program. Call build() before getting attributes.");
        }
        attrs.forEach(name => {
            this.attributes[name] = this.gl.getAttribLocation(this.program, name);
        });
        return this;
    }

    compile_shader(source, type) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error(this.gl.getShaderInfoLog(shader));
            const shaderType = this.shader_type_to_string(shader);
            this.gl.deleteShader(shader);
            throw new Error(`Failed to compile ${shaderType} shader.`);
        }
        return shader;
    }

    link_program() {
        if (this.vs === undefined) {
            throw new Error("Failed to link program: missing vertex shader. Call add_vertex_shader() before build.");
        } else if (this.fs === undefined) {
            throw new Error("Failed to link program: missing fragment shader. Call add_fragment_shader() before build.");
        }
        const program = this.gl.createProgram();
        this.gl.attachShader(program, this.vs);
        this.gl.attachShader(program, this.fs);
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error("Failed to link program:", this.gl.getProgramInfoLog(program));
            throw new Error("Linking program has failed");
        }
        return program;
    }

    shader_type_to_string(type) {
        switch(type) {
            case this.gl.FRAGMENT_SHADER:
                return "FRAGMENT_SHADER";
            case this.gl.VERTEX_SHADER:
                return "VERTEX_SHADER";
            default:
                return "UNKNOWN";
        }
    }
}
