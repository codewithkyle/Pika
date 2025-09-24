all: wasm native

wasm: main.c
	clang -Wall -Wextra -Wswitch-enum -O3 -fno-builtin --target=wasm32 -I./raylib/include --no-standard-libraries \
		-Wl,--no-entry -Wl,--allow-undefined \
		-o main.wasm main.c -DPLATFORM_WEB

native: main.c
	clang -I./raylib/include -o main main.c -L./raylib/lib/ -l:libraylib.a -lm -DPLATFORM_NATIVE
