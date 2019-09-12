
import BYBullet from "./byBullet";
import BYGame from "./byGame";
import BYFishRoute from "./byFishRoute";
import { getQuadrantDegree, getFishKindType } from "./byUtil"
import BYFishMgr from "./byFishMgr";
const { ccclass, property } = cc._decorator;

@ccclass
export default class BYFish extends cc.Component {
    @property([sp.Skeleton])
    mySpine: sp.Skeleton[] = [];

    public lastPos: cc.Vec2 = undefined;
    public rootIdx = -1;
    public typeId: number = undefined;
    public id: number = undefined;

    public game: BYGame = undefined;
    // public byMsg: BYMsg;

    public fishId: number = undefined;
    public fishFormationId: number = -1;
    public fishNetPos: cc.Vec2 = undefined;
    public coin: string = undefined;
    public dieByLoactionGun: number = undefined;

    public isDieing: boolean = false;
    public bulletId: number = 0;     // 打中 这条鱼的 子弹ID
    public bulletPos: cc.Vec2 = undefined; // 子弹打中鱼时的 子弹的位置

    private collider: cc.Collider = undefined;

    private shader: any = undefined;

    public ice: cc.Node = undefined;

    onLoad() {
        let game = cc.find("game");;
        this.game = game.getComponent(BYGame);
        this.initColliderAndShader();
    }

    update() {
        if (this.rootIdx != -1) {
            this.updateRotation();
        }
    }

    initColliderAndShader() {
        this.collider = this.node.getComponent(cc.CircleCollider);
        if (!this.collider) {
            this.collider = this.node.getComponent(cc.BoxCollider);
        }
        this.shader = this.node.getComponent("shader-obj");
        this.ice = this.node.getChildByName("ice");
    }

    chgColliderState(state: boolean) {
        this.collider.enabled = state;
    }
    chgIceState(state: boolean) {
        this.ice.opacity = 220;
        this.ice.active = state;
    }

    chgSpineState(state: boolean) {
        this.mySpine.forEach(el => {
            el.paused = !state;
        });
    }
    public move(offset: cc.Vec2, startPosNum: number, firstTime: number) {
        //记录第一个坐标

        this.lastPos = cc.p(BYFishRoute.anchor[this.rootIdx].points[0][0] + offset.x, BYFishRoute.anchor[this.rootIdx].points[0][1] + offset.y);

        let lineCount = BYFishRoute.anchor[this.rootIdx].points.length / 2;
        let actionArr: cc.FiniteTimeAction[] = [];

        for (let i = startPosNum; i < lineCount; i++) {
            let c1 = cc.p(BYFishRoute.control[this.rootIdx].points[i * 2][0] + offset.x, BYFishRoute.control[this.rootIdx].points[i * 2][1] + offset.y);
            let c2 = cc.p(BYFishRoute.control[this.rootIdx].points[i * 2 + 1][0] + offset.x, BYFishRoute.control[this.rootIdx].points[i * 2 + 1][1] + offset.y);
            let a2 = cc.p(BYFishRoute.anchor[this.rootIdx].points[(i + 1) * 2 - 1][0] + offset.x, BYFishRoute.anchor[this.rootIdx].points[(i + 1) * 2 - 1][1] + offset.y);
            let bezier = [c1, c2, a2];
            let bezierTo = cc.bezierTo(BYFishRoute.anchor[this.rootIdx].curveTime, bezier);
            if (firstTime != undefined && i == startPosNum) {
                bezierTo = cc.bezierTo(firstTime, bezier);
            }
            actionArr.push(bezierTo);
        }

        if (actionArr != []) {
            if (actionArr.length == 1) {
                this.node.runAction(actionArr[0]);
            } else if (actionArr.length > 1) {
                this.node.runAction(cc.sequence(actionArr));
            }
        }

    }

    private updateRotation() {

        if ((this.typeId == BYFishMgr.jellyfishType) || this.typeId == BYFishMgr.seahorseType || this.typeId == BYFishMgr.bombType) {
            this.node.rotation = 0;
            return;
        }
        let curPoint: cc.Vec2 = this.node.position;//获取鱼当前坐标
        if (this.lastPos == undefined) {
            return;
        }
        if (curPoint.x == this.lastPos.x || curPoint.y == this.lastPos.y) {
            return;
        }

        let deg: number = getQuadrantDegree(this.lastPos, curPoint);

        this.node.rotation = deg;

        this.lastPos = curPoint;  //保存当前的坐标给下一轮刷新使用
    }

    runBgAnimation() {
        let fishType = this.fishId;
        if (getFishKindType(fishType) > 7 && getFishKindType(fishType) < 8) {
            this.groupFishBgRotation();
        } else if (fishType === BYFishMgr.mermaidType) {
            this.node.getComponent(cc.Animation).play();
        } else if (fishType === BYFishMgr.toadType) {
            this.node.getChildByName("bg").runAction(cc.rotateBy(2, 360).repeatForever());
        }

    }

    groupFishBgRotation() {
        let fish = this.node;
        let action1 = cc.rotateBy(2, 360).repeatForever();
        let action2 = cc.rotateBy(4, 360).repeatForever();
        let bg = fish.getChildByName("bg");
        let bgs = fish.getChildByName("bg1");
        bg.runAction(action1);
        for (let i = 0; i < bgs.children.length; i++) {
            let bg1 = bgs.children[i];
            let action3 = action2.clone();
            bg1.runAction(action3);
        }
    }

    shaderSetDefault() {
        this.shader.setDefault();
    }

    // 被击中后变红
    hitRedden() {
        this.shader.setRed();
        this.game.scheduleOnce(() => {
            this.shader.setDefault();
        }, 0.1);
    }
    onCollisionStay(other: cc.Collider, self: cc.Collider) {

        if (other.tag == 0) {
            let gunId = other.node.getComponent(BYBullet).gunId;
            let p = this.game.playerMgr.getPlayerBySeat(gunId);
            if (p.isLock === 1 && p.lockFish && this != p.lockFish && p.lockFish.liveInCurScene()) {
                return;
            }
            this.hitRedden();
        }
    }



    onCollisionEnter(other: cc.Collider, self: cc.Collider) {

        if (other.tag === 0) {
            let gunId = other.node.getComponent(BYBullet).gunId;
            let p = this.game.playerMgr.getPlayerBySeat(gunId);
            if (p.isLock === 1 && this != p.lockFish) {
                if (!p.lockFish || !p.lockFish.liveInCurScene()) {
                    this.hitRedden();
                }
                return;
            }
            //变红
            this.hitRedden();
        }
    }

    leaveCurrtSceen(time: number) {
        let rotation = this.node.rotation;

        rotation = - rotation;

        let cy = Math.sin(rotation * 2 * Math.PI / 360);
        let cx = Math.cos(rotation * 2 * Math.PI / 360);

        let myX = this.node.x + this.node.parent.x;
        let myY = this.node.y + this.node.parent.y;


        let endPoint = cc.p(0, 0);


        let endX = 0;
        let endY = 0;
        let off = 100;
        if (cx <= 0 && cy <= 0) {
            // 朝向 第四象限
            endX = -(this.game.halfSW + off);
            endY = -(this.game.halfSH + off);
        } else if (cx <= 0 && cy >= 0) {
            // 第二象限
            endX = -(this.game.halfSW + off);
            endY = (this.game.halfSH + off);
        } else if (cx >= 0 && cy >= 0) {
            // 第一象限
            endX = (this.game.halfSW + off);
            endY = (this.game.halfSH + off);
        } else if (cx >= 0 && cy <= 0) {
            // 第三象限
            endX = (this.game.halfSW + off);
            endY = -(this.game.halfSH + off);
        }

        endPoint.x = endX;
        endPoint.y = endY;

        let jx = endX - myX;
        let jy = endY - myY;

        let juli = Math.sqrt(jx * jx + jy * jy);

        let randomJudu = Math.random() * Math.PI;


        let Mdian1 = cc.p(cx * 100 + myX, cy * 100 + myY);

        let Mdian2 = cc.p(juli / 2 * Math.cos(randomJudu) + endX, juli / 2 * Math.sin(randomJudu) + endY);

        let callback = cc.callFunc(this.fishHide, this);


        cc.director.getActionManager().removeAllActionsFromTarget(this.node);
        cc.director.getScheduler().unscheduleAllForTarget(this.node.getComponent(BYFish));

        let beizier = [Mdian1, Mdian2, endPoint];
        this.node.runAction(cc.sequence(cc.bezierTo(2, beizier), callback));

    }

    fishHide() {

        this.node.active = false;

        this.game.fishMgr.fishBackToPool(this);

    }

    liveInCurScene() {
        if (!this.node.isValid || !this.node.active) {
            return false;
        }
        let isdie = this.isDieing;
        let w = this.game.halfSW + 10;
        let h = this.game.halfSH + 10;
        let fish = this.node;
        let tmpPos;
        if (fish.parent != undefined) {
            tmpPos = this.game.toWroldPos(fish.position, fish.parent.position);
        } else {
            tmpPos = fish.position;
        }
        if (!isdie && fish.active && tmpPos.x > -w && tmpPos.x < w &&
            tmpPos.y < h && tmpPos.y > -h) {
            return true;
        } else {
            return false;
        }
    }

    dealDie() {
        this.isDieing = true;
        this.chgColliderState(false);
        this.chgSpineState(false);
        this.shaderSetDefault();
        cc.director.getActionManager().removeAllActionsFromTarget(this.node);
        cc.director.getScheduler().unscheduleAllForTarget(this);
    }

    onDestroy() {
        cc.director.getScheduler().unscheduleAllForTarget(this);
        cc.director.getActionManager().removeAllActionsFromTarget(this.node);
    }

}
