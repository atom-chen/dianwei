import BYGame from "./byGame";
import BYBullet from "./byBullet";
import Fish from "./byFish";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BYCollideManage extends cc.Component {

    public game: BYGame = undefined;
    private collideData: {
        [key: number]: Fish;
    } = {};

    onLoad() {
        let game = cc.find("game");
        this.game = game.getComponent(BYGame);
        this.initCollideEvent();
    }

    initCollideEvent() {
        //监听子弹和鱼碰撞
        this.node.on("collideFish", (event) => {
            event.stopPropagation();
            let bulletScript = event.detail.bullet.getComponent(BYBullet);
            let fishScript = event.detail.fishScript;
            //TODO if自己的gunid和bulletScript.gunId一样才向服务器发送消息
            let key = bulletScript.gunId * 1000 + bulletScript.id;

            fishScript.fishNetPos = cc.p(event.detail.bullet.x, event.detail.bullet.y);

            if (this.collideData[key] == undefined) {

                fishScript.bulletId = bulletScript.bulletId;
                fishScript.bulletPos = bulletScript.node.position;
                this.collideData[key] = fishScript;

            } else {
                let fs = this.collideData[key];
                //优先级高的加入
                if (fs.typeId < fishScript.typeId) {
                    fishScript.bulletId = bulletScript.bulletId;
                    fishScript.bulletPos = bulletScript.node.position;
                    this.collideData[key] = fishScript;
                }
            }
            this.doCollideData();
        });
    }
    doCollideData() {
        for (let key in this.collideData) {
            let data = this.collideData[key];
            if (data == undefined) {
                continue;
            }
            if (!this.game.msg) {
                return;
            }
            if (data.fishFormationId != -1) {
                this.game.msg.gameBYHandlerHit(data.fishId, data.bulletId, data.fishFormationId);
            } else {
                this.game.msg.gameBYHandlerHit(data.fishId, data.bulletId);
            }
            let me = this.game.playerMgr.me;

            let bulletPos = data.bulletPos;
            let fishPos = this.game.toWroldPos(data.node.position, data.node.parent.position);
            let pos = cc.p(bulletPos.x + (fishPos.x - bulletPos.x) * 1 / 4, bulletPos.y + (fishPos.y - bulletPos.y) * 1 / 4);
            this.game.fishnetMgr.createFishNet(me.seat, pos);

        }
        this.collideData = {};
    }


}
