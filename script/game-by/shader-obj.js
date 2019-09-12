var ShaderUtils = require("shader-util");

cc.Class({
    extends: cc.Component,



    setRed: function () {
        let nameNum = parseInt(this.node.name);

        if ((nameNum / 10 > 7 && nameNum / 10 < 8) || nameNum == 95 || nameNum == 66) {
            ShaderUtils.setShader(this.node.getChildByName("spine").getComponent(sp.Skeleton), "red");

            if (nameNum == 95 || nameNum == 66) {

            } else {
                for (let i = 0; i < this.node.getChildByName("fishs").children.length; i++) {

                    let spin = this.node.getChildByName("fishs").children[i].getComponent(sp.Skeleton);
                    ShaderUtils.setShader(spin, "red");
                }
            }

        } else if (nameNum == 94) {
            ShaderUtils.setShader(this.node.getChildByName("bingyu").getChildByName("spine").getComponent(sp.Skeleton), "red");
        }
        else {
            ShaderUtils.setShader(this.node.getComponent(sp.Skeleton), "red");
        }

    },

    setDefault: function () {
        let nameNum = parseInt(this.node.name);
        if ((nameNum / 10 > 7 && nameNum / 10 < 8) || nameNum == 95 || nameNum == 66) {
            ShaderUtils.setShader(this.node.getChildByName("spine").getComponent(sp.Skeleton), "normal");

            if (nameNum == 95 || nameNum == 66) {

            } else {
                for (let i = 0; i < this.node.getChildByName("fishs").children.length; i++) {

                    let spin = this.node.getChildByName("fishs").children[i].getComponent(sp.Skeleton);
                    ShaderUtils.setShader(spin, "normal");
                }
            }
        }
        else if (nameNum == 94) {
            ShaderUtils.setShader(this.node.getChildByName("bingyu").getChildByName("spine").getComponent(sp.Skeleton), "normal");
        } else {
            ShaderUtils.setShader(this.node.getComponent(sp.Skeleton), "normal");
        }

    },

    setGray: function () {
        let sprit1 = this.node.children[0].getComponent(cc.Sprite);
        ShaderUtils.setShader(sprit1, "gray");


        let sprit2 = this.node.getComponent(cc.Sprite);
        ShaderUtils.setShader(sprit2, "gray");
    },


    setButtonDefault: function () {
        let sprit1 = this.node.children[0].getComponent(cc.Sprite);
        ShaderUtils.setShader(sprit1, "normal");


        let sprit2 = this.node.getComponent(cc.Sprite);
        ShaderUtils.setShader(sprit2, "normal");
    },



});