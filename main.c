#ifndef NULL
#define NULL ((void*)0)
#endif

#define MAX(a,b) ((a) > (b) ? (a) : (b))

#ifndef ASSERT_H
#define ASSERT_H

#ifdef NDEBUG
# define assert(x) ((void)0)
#else
# define assert(x) ((x) ? (void)0 : __builtin_trap())
#endif

#endif

#include <stdint.h>
#include <stddef.h>
#include <limits.h>

typedef uint64_t u64;
typedef int64_t i64;
typedef uint32_t u32;
typedef int32_t i32;
typedef uint32_t flags32;
typedef float f32;
typedef uint8_t u8;
typedef int8_t i8;
typedef uint32_t b32;


#ifdef PLATFORM_WEB
  #define WASM_EXPORT(name) __attribute__((export_name(#name))) __attribute__((used))
#else
  #define WASM_EXPORT(name)
#endif

enum { BYTES_PER_PIXEL = 4 }; // RGBA
enum { PAGE_SIZE = 65536 };

extern i32 memory_grow(i32 pages);
extern i32 wasm_memory_size_pages();
extern void out_of_memory();
extern unsigned char __heap_base;

struct heap {
    u8 *ptr;
    u8 *limit;
};
static struct heap heap = {0};

struct framebuffer {
    u8 *buffer;
    size_t stride;
    u32 width_px;
    u32 height_px;
    size_t align;
};
static struct framebuffer display = {0};

static inline uintptr_t align_up_uintptr(uintptr_t x, size_t align)
{
    assert((align & (align - 1)) == 0);
    assert(align > 0);
    return (x + (align - 1)) & ~(uintptr_t)(align - 1);
}

static inline u8* align_up_ptr(u8* p, size_t align)
{
    uintptr_t addr = (uintptr_t)p;
    addr = align_up_uintptr(addr, align);
    return (u8*)addr;
}

static inline u64 align_up(u64 x, u64 align)
{
    assert(align && (align & (align - 1)) == 0);
    return (x + (align - 1)) & ~(align - 1);
}

static inline void heap_init(void)
{
    uintptr_t base = (uintptr_t)&__heap_base;
    base = align_up_uintptr(base, 64);
    heap.ptr = (u8*)base;
    heap.limit = (u8*)((uintptr_t)wasm_memory_size_pages() * PAGE_SIZE);
    assert(heap.ptr <= heap.limit);
}

// NOTE: u8 = uint8_t = 1 byte = 8 bits
// We use this for our bump allocator so we can think is raw bytes
// not sizeof(T) chunks. This allow us to use pointers into our
// heap buffer with guaranteed alignment.
static inline u8* heap_alloc(size_t bytes, size_t align)
{
    assert(align && ((align & (align - 1)) == 0));
    u8* p = align_up_ptr(heap.ptr, align);
    uintptr_t paddr = (uintptr_t)p;
    if ((uintptr_t)bytes > UINTPTR_MAX - paddr) return NULL;
    uintptr_t endaddr = paddr + (uintptr_t)bytes;
    if (endaddr > (uintptr_t)heap.limit)
    {
        size_t deficit_bytes = (size_t)(endaddr - (uintptr_t)heap.limit);
        size_t pages = (deficit_bytes + PAGE_SIZE - 1) / PAGE_SIZE;
        pages += MAX(1, pages >> 2);
        if (pages > (size_t)INT32_MAX) pages = (size_t)INT32_MAX;
        i32 old_pages = memory_grow((i32)pages);
        if (old_pages < 0) return NULL;
        heap.limit = (u8*)((uintptr_t)wasm_memory_size_pages() * PAGE_SIZE);
        assert((uintptr_t)heap.ptr <= (uintptr_t)heap.limit);
    }
    heap.ptr = (u8*)endaddr;
    return p;
}

static inline u64 compute_stride_bytes(u32 width_pixels, size_t align_bytes)
{
    u64 raw = (u64)width_pixels * (u64)BYTES_PER_PIXEL;
    return align_up(raw, (u64)align_bytes);
}

static inline u8* alloc_display_buffer(u32 width_px, u32 height_px, size_t align_bytes, size_t* out_stride_bytes)
{
    assert(align_bytes && ((align_bytes & (align_bytes - 1)) == 0));
    u64 stride64 = compute_stride_bytes(width_px, align_bytes);
    if (stride64 > (u64)SIZE_MAX) return NULL;

    u64 total64 = stride64 * (u64)height_px;
    if (height_px != 0 && stride64 > ((u64)SIZE_MAX / (u64)height_px)) return NULL;

    size_t stride = (size_t)stride64;
    size_t total = (size_t)total64;

    u8* base = heap_alloc(total, MAX(align_bytes,64));
    if (!base) return NULL;

    if (out_stride_bytes) *out_stride_bytes = stride;
    return base;
}

static inline u8* pixel_ptr(const struct framebuffer* d, size_t x, size_t y)
{
    return d->buffer + y * d->stride + x * BYTES_PER_PIXEL;
}

WASM_EXPORT("engine_init")
void engine_init(b32 is_debug)
{
    heap_init();
}

WASM_EXPORT("set_display_size")
void set_display_size(u32 width, u32 height)
{
    assert(width > 0 && height > 0);
    display.align = 64;
    u8* base = alloc_display_buffer(width, height, display.align, &display.stride);
    if (!base)
    {
        return out_of_memory();
    }
    display.buffer = base;
    display.width_px = width;
    display.height_px = height;
    assert(display.stride % BYTES_PER_PIXEL == 0);
}

WASM_EXPORT("render_background")
void render_background()
{
}

WASM_EXPORT("game_update")
void game_update(f32 dt)
{
    render_background();
}

#ifdef PLATFORM_NATIVE
int main(void)
{
    game_init(0);
    return 0;
}
#endif
