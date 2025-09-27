#ifndef NULL
#define NULL ((void*)0)
#endif
#define MAX(a,b) ((a) > (b) ? (a) : (b))

#include <stdint.h>
#include <stddef.h>
typedef uint64_t u64;
typedef int64_t i64;
typedef uint32_t u32;
typedef int32_t i32;
typedef uint32_t flags32;
typedef float f32;
typedef uint8_t u8;
typedef int8_t i8;
typedef uint32_t b32;

#include <assert.h>

#ifdef PLATFORM_WEB
  #define WASM_EXPORT(name) __attribute__((export_name(#name))) __attribute__((used))
#else
  #define WASM_EXPORT(name)
#endif

enum { BYTES_PER_PIXEL = 4 }; // RGBA

extern i32 memory_grow(i32 pages);
extern i32 wasm_memory_size_pages();
extern void out_of_memory();
extern unsigned char __heap_base;
static u8 *heap_ptr;
static u8 *heap_limit;
const size_t PAGE = 65536;
static u8* DISPLAY_BUFFER;
static size_t STRIDE;

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
    heap_ptr = (u8*)base;
    heap_limit = (u8*)((uintptr_t)wasm_memory_size_pages() * PAGE);
    assert(heap_ptr <= heap_limit);
}

// NOTE: u8 = uint8_t = 1 byte = 8 bits
// We use this for our bump allocator so we can think is raw bytes
// not sizeof(T) chunks. This allow us to use pointers into our
// heap buffer with guaranteed alignment.
static inline u8* heap_alloc(size_t bytes, size_t align)
{
    u8* p = align_up_ptr(heap_ptr, align);
    if (bytes > (SIZE_MAX - (size_t)(p - (u8*)0)))
    {
        return NULL;
    }
    u8* end = p + bytes;
    if (end > heap_limit)
    {
        size_t deficit_bytes = (size_t)(end - heap_limit);
        size_t pages = (deficit_bytes + PAGE - 1) / PAGE;
        pages += MAX(1, pages >> 2);
        i32 old_pages = memory_grow((i32)pages);
        if (old_pages < 0)
        {
            return NULL;
        }
        heap_limit = (u8*)((uintptr_t)wasm_memory_size_pages() * PAGE);
    }
    heap_ptr = end;
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

static inline u8* pixel_ptr(u8* base, size_t stride_bytes, size_t x, size_t y)
{
    return base + y * stride_bytes + x * BYTES_PER_PIXEL;
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
    DISPLAY_BUFFER = alloc_display_buffer(width, height, 64, &STRIDE);
    if (!DISPLAY_BUFFER)
    {
        return out_of_memory();
    }
    assert(STRIDE % BYTES_PER_PIXEL == 0);
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
    game_init(false);
    while (!WindowShouldClose())
    {
        game_update(GetFrameTime());
    }

    CloseWindow();

    return 0;
}
#endif
