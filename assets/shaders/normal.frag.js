// gray.frag.js
module.exports =
`
#ifdef GL_ES
precision lowp float;
#endif

varying vec4 v_fragmentColor;
varying vec2 v_texCoord;
void main()
{
    vec4 c = v_fragmentColor * texture2D(CC_Texture0, v_texCoord);

    c *= vec4(1, 1, 1, 1);
    //c.b += c.a * 0.2;
    gl_FragColor = c;
}
`