module.exports =
`
#ifdef GL_ES
precision mediump float;
#endif

#define PD 6.28318530718
#define P 3.14159265359
#define PH 1.570796326795

uniform sampler2D texture1;
uniform float iGlobalTime;

varying vec2 v_texCoord;
varying vec4 v_fragmentColor;

void main()
{
    float va=iGlobalTime;

    vec2 uv01= v_texCoord;

    vec2 offset=vec2(0.,0.);
    offset.x=sin(va);

    vec4 outColor=texture2D( CC_Texture0, v_texCoord );
    vec4 outColor1=texture2D( texture1, uv01+offset);

    outColor.a *= outColor1.a;
    
    gl_FragColor=outColor;

}
`

