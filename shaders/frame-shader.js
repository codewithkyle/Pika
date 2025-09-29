export const frame_vert_shader =
`#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;

uniform vec2 u_resolution;

void main() {
    // convert pixel coord to normalized device coord
    vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
    gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0); // flip y-axis
    v_texCoord = a_texCoord; // pass tex coords
}
`;
export const frame_frag_shader =
`#version 300 es
precision highp float;
precision highp sampler2D;

in highp vec2 v_texCoord;
uniform sampler2D u_texture;
out vec4 outColor;

void main() {
    outColor = texture(u_texture, v_texCoord);
}
`;
