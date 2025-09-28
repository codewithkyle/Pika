import { Renderer } from "./renderer.js";

// NOTE: constants(ish)
const DPR = Math.max(1, window.devicePixelRatio || 1);
let WIDTH = Math.floor(window.innerWidth * DPR);
let HEIGHT = Math.floor(window.innerHeight * DPR);
const MAX_DT = 0.033;

/** @type {number} */
let previous = undefined;

/** @type {WebAssembly.WebAssemblyInstantiatedSource} */
let wasm = undefined;

/** @type {ArrayBuffer} */
let memBuf = undefined;

/** @type {Renderer} */
let renderer = undefined;

/** @type {number} */
let dt = undefined;
let doUpdate = true;
let skipNextUpdate = false;

document.addEventListener("visibilitychange", ()=>{
    doUpdate = !document.hidden;
    if (!doUpdate) skipNextUpdate = true;
});

WebAssembly.instantiateStreaming(fetch("main.wasm"), {
    env: make_env({
        InitWindow: (width, height, text_ptr) => {
            const buffer = wasm.instance.exports.memory.buffer;
            const text = cstr_by_ptr(buffer, text_ptr);
            document.title = text;
        },
    }),
}).then((wasmModule) => {
    console.log("WASM instantiated", wasmModule);
    //var params = new URLSearchParams(window.location.search);

    wasm = wasmModule;

    /** @type {HTMLCanvasElement} */
    const canvas = document.getElementById("canvas");

    renderer = new Renderer().init(canvas).resize(WIDTH, HEIGHT);
    wasm.instance.exports.engine_init();
    wasm.instance.exports.set_display_size(WIDTH, HEIGHT);
    memBuf = wasm.instance.exports.memory.buffer;
    renderer.updateView(wasm, wasm.instance.exports.get_frame_addr());
    window.requestAnimationFrame(first);
}).catch((e) => {
    console.error("Failed to instantiate WASM", e);
});

function first(timestamp) {
    previous = timestamp;
    window.requestAnimationFrame(next);
}

function next(timestamp) {
    dt = Math.min((timestamp - previous)*0.001, MAX_DT);
    previous = timestamp;
    if (doUpdate){
        if (!skipNextUpdate) {
            wasm.instance.exports.update(dt);
            wasm.instance.exports.render();
            const currBuf = wasm.instance.exports.memory.buffer;
            if (memBuf != currBuf) {
                renderer.updateView(wasm, wasm.instance.exports.get_frame_addr());
                memBuf = currBuf;
            }
            renderer.render(currBuf);
        } else {
            skipNextUpdate = false;
        }
    }
    window.requestAnimationFrame(next);
}

function make_env(...envs) {
    return new Proxy(envs, {
        get(target, prop, receiver) {
            for (let env of envs) {
                if (env.hasOwnProperty(prop)) {
                    return env[prop];
                }
            }
            return (...args) => {
                console.error("NOT IMPLEMENTED: " + prop, args);
            }
        }
    });
}

function cstr_by_ptr(mem_buffer, ptr) {
    const mem = new Uint8Array(mem_buffer);
    const len = cstrlen(mem, ptr);
    const bytes = new Uint8Array(mem_buffer, ptr, len);
    return new TextDecoder().decode(bytes);
}

function cstrlen(mem, ptr) {
    let len = 0;
    while (mem[ptr] != 0) {
        len++;
        ptr++;
    }
    return len;
}

function color_hex_unpacked(r, g, b, a) {
    r = r.toString(16).padStart(2, "0");
    g = g.toString(16).padStart(2, "0");
    b = b.toString(16).padStart(2, "0");
    a = a.toString(16).padStart(2, "0");
    return `#${r}${g}${b}${a}`;
}

function color_hex(color) {
    const r = ((color>>(0*8))&0xFF).toString(16).padStart(2, "0");
    const g = ((color>>(1*8))&0xFF).toString(16).padStart(2, "0");
    const b = ((color>>(2*8))&0xFF).toString(16).padStart(2, "0");
    const a = ((color>>(3*8))&0xFF).toString(16).padStart(2, "0");
    return `#${r}${g}${b}${a}`;
}
