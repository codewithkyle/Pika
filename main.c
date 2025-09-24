#include <raylib.h>
float floorf(float);
float fabsf(float);
double fabs(double);
float fmaxf(float, float);
float fminf(float, float);
float sqrtf(float);
float atan2f(float, float);
float cosf(float);
float sinf(float);
double tan(double);
float acosf(float);
float asinf(float);
#include <raymath.h>

#ifndef NULL
#define NULL ((void*)0)
#endif

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

#ifdef PLATFORM_WEB
  #define WASM_EXPORT(name) __attribute__((export_name(#name))) __attribute__((used))
#else
  #define WASM_EXPORT(name)
#endif

WASM_EXPORT("game_init")
void game_init(b32 is_debug)
{
    //InitWindow(WIDTH, HEIGHT, "Pika");
    SetTargetFPS(60);
}

WASM_EXPORT("render_background")
void render_background()
{
}

WASM_EXPORT("game_update")
void game_update(f32 dt)
{
    BeginDrawing();
    ClearBackground((Color){18,18,18,255});
    render_background();
    EndDrawing();
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
