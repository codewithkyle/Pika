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
extern unsigned char __heap_base;
static u8 *heap_ptr;
static u8 *heap_limit;
const size_t PAGE = 65536;

static inline uintptr_t align_up_ptr(uintptr_t x, size_t align)
{
    assert((align & (align - 1)) == 0);
    assert(align > 0);
    return (x + (align - 1)) & ~(uintptr_t)(align - 1);
}

static inline u8* align_up(u8* p, size_t align)
{
    uintptr_t addr = (uintptr_t)p;
    addr = align_up_ptr(addr, align);
    return (u8*)addr;
}

static inline void heap_init(void)
{
    uintptr_t base = (uintptr_t)&__heap_base;
    base = align_up_ptr(base, 64);
    heap_ptr = (u8*)base;
    heap_limit = heap_ptr;
}

// NOTE: u8 = uint8_t = 1 byte = 8 bits
// We use this for our bump allocator so we can think is raw bytes
// not sizeof(T) chunks. This allow us to use pointers into our
// heap buffer with guaranteed alignment.
static inline u8* heap_alloc(size_t bytes, size_t align)
{
    u8* p = align_up(heap_ptr, align);
    if (bytes > (SIZE_MAX - (size_t)(p - (u8*)0)))
    {
        return NULL;
    }
    u8* end = p + bytes;
    if (end > heap_limit)
    {
        size_t deficit_bytes = (size_t)(end - heap_limit);
        size_t pages = (deficit_bytes + PAGE - 1) / PAGE;
        pages += MAX(1, pages * 0.25);
        i32 old_pages = memory_grow((i32)pages);
        if (old_pages < 0)
        {
            return NULL;
        }
        heap_limit = (u8*)(wasm_memory_size_pages() * PAGE);
    }
    heap_ptr = end;
    return p;
}

/*static inline size_t compute_stride_bytes(size_t width_pixels, size_t align_bytes)*/
/*{*/
    /*size_t raw = width_pixels * BYTES_PER_PIXEL;*/
    /*return align_up(raw, align_bytes);*/
/*}*/

/*static inline u8* alloc_display_buffer(size_t width_px, size_t heigh_px, size_t align_bytes, size_t* out_stride_bytes)*/
/*{*/
    /*size_t stride = compute_stride_bytes(width_px, align_bytes);*/
    /*size_t total = stride * heigh_px;*/
    /*//u8* base = (u8*)malloc(total);*/
    /*if (out_stride_bytes) *out_stride_bytes = stride;*/
    /*//return base;*/
/*}*/

WASM_EXPORT("game_init")
void game_init(b32 is_debug)
{
    heap_init();
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
