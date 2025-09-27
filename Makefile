all: wasm

wasm: main.c
	clang -Wall -Wextra -Wswitch-enum -O3 -fno-builtin --target=wasm32 --no-standard-libraries \
		-Wl,--no-entry -Wl,--allow-undefined \
		-o main.wasm main.c -DPLATFORM_WEB

native: main.c
	clang -o main main.c -lm -DPLATFORM_NATIVE
