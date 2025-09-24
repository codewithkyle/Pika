import { Renderer } from "./renderer.js";
import { ThreeJSRenderer } from "./ThreeJSRenderer.js"

// NOTE: constants(ish)
let WIDTH = window.innerWidth;
let HEIGHT = window.innerHeight;
const MAX_DT = 0.033;

/** @type {number} */
let previous = undefined;

/** @type {WebAssembly.WebAssemblyInstantiatedSource} */
let wasm = undefined;

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
        BeginDrawing: ()=>{},
        EndDrawing: ()=>{},
        InitWindow: (width, height, text_ptr) => {
            const buffer = wasm.instance.exports.memory.buffer;
            const text = cstr_by_ptr(buffer, text_ptr);
            document.title = text;
        },
    }),
}).then((wasmModule) => {
    console.log("WASM instantiated", wasmModule);
    var params = new URLSearchParams(window.location.search);

    wasm = wasmModule;

    /** @type {HTMLCanvasElement} */
    const canvas = document.getElementById("canvas");

    renderer = new ThreeJSRenderer().init(canvas).resize(WIDTH, HEIGHT);

    wasm.instance.exports.game_init(params.get("debug")?.length ? 1 : 0);
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
            wasm.instance.exports.game_update(dt);
            renderer.render();
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
