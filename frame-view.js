export default class FrameView {
    constructor() {
        this.L = true;
        this.dv = undefined;
        this.mem = undefined;
        this.base = 0;
    }

    // NOTE: Call once (and again after memory.grow because the buffer changes)
    make(wasm, addr) {
        this.mem = wasm.instance.exports.memory;
        this.base = addr >>> 0; // NOTE: ensure u32
        this.buf = this.mem.buffer;
        this.dv = new DataView(this.buf, this.base, 24);
    }

    read() {
        if (!this.dv) return {
            ptr: -1,
            stride: 0,
            width: 0,
            height: 0,
            bpp: 0,
            version: -1,
        }
        return {
            ptr: this.dv.getUint32(0, this.L),
            stride: this.dv.getUint32(4, this.L),
            width: this.dv.getUint32(8, this.L),
            height: this.dv.getUint32(12, this.L),
            bpp: this.dv.getUint32(16, this.L),
            version: this.dv.getUint32(20, this.L),
        }
    }
}
