import BYGame from "./byGame";
import BYBullet from "./byBullet";
import * as util from "../common/util";
import { getQuadrantDegree, hideDotLine, deg2Rad } from "./byUtil"
import BYIdleCheck from "./byIdleCheck";

const { ccclass, property } = cc._decorator;
@ccclass
export default class BYBulletMgr extends cc.Component {
    private bulletPool: cc.Node[][] = [[], [], [], [], [], [], [], [], [], []];
    public game: BYGame = undefined;

    private byIdleCheck: BYIdleCheck = undefined;
    private bulletId: number = 0;

    onLoad() {
        let game = cc.find("game");
        this.game = game.getComponent(BYGame);
        this.byIdleCheck = game.getComponent(BYIdleCheck);
    }
    onDestroy() {

    }

    getOneBullet(seat: number) {
        let p = this.game.playerMgr.getPlayerBySeat(seat);
        let oneBulletPool = this.bulletPool[p.gunSpType];
        let bullet = undefined;
        for (let i = 0; i < oneBulletPool.length; i++) {
            bullet = oneBulletPool[i];
            if (!bullet.active) {
                return bullet;
            }
        }
        if (!p.bulletNode) {
            return undefined;
        }
        bullet = util.instantiate(p.bulletNode);
        oneBulletPool.push(bullet);
        this.node.addChild(bullet);
        return bullet;
    }
    /**
     * 让该位置发射的炮弹 转向打正在锁定的鱼
     * @param seat
     */
    public changeBulletMove(seat: number) {
        let p = this.game.playerMgr.getPlayerBySeat(seat);
        for (let i = 0; i < this.node.children.length; i++) {
            let bulletNode = this.node.children[i];
            if (bulletNode.active && bulletNode.getComponent(BYBullet).gunId === seat && p.lockFish) {
                let bulletScript = bulletNode.getComponent(BYBullet);
                let fish = p.lockFish.node;
                let aimPostion = this.game.toWroldPos(fish.position, fish.parent.position);
                bulletScript.startMove(bulletNode.position, aimPostion);
            }
        }
    }

    public shoot(seat: number, aimV: cc.Vec2, angle?: number) {
        if (this.game.baseScore == undefined || !this.game.canStart) {
            return;
        }
        let p = this.game.playerMgr.getPlayerBySeat(seat);
        if (!p) {
            cc.log("------不存在p----");
            return;
        }

        if (angle && aimV.x === 0 && aimV.y === 0) {
            let gunpos = p.gunPos;
            let tmplength = 300; // 瞄准点到炮台的距离
            if ((seat < 2 && this.game.playerMgr.mySeat > 1) ||
                (seat > 1 && this.game.playerMgr.mySeat < 2)) {
                // 如果 该消息的发送者  和 自己 没有在同一边
                angle = -180 - angle;
                aimV.x = tmplength * Math.cos(deg2Rad(angle)) + gunpos.x;
                aimV.y = tmplength * Math.sin(deg2Rad(angle)) + gunpos.y;
            } else {
                // 如果 该消息的发送者  和 自己 在同一边
                aimV.x = tmplength * Math.cos(deg2Rad(angle)) + gunpos.x;
                aimV.y = -tmplength * Math.sin(deg2Rad(angle)) + gunpos.y;
            }
        }

        p.changeGunRotation(aimV);


        let canShoot = this.checkBulletCount(seat);
        let canShoot1 = this.checkMoneyAndDistance(seat, aimV);
        if (!canShoot || !canShoot1 || !p.bulletNode) {
            return;
        }

        let tgunpos = p.gunPos;
        let bullettype = p.gunSpType;
        if (this.bulletPool[bullettype]) {

            let deg = getQuadrantDegree(tgunpos, aimV);
            this.bulletId++;
            if (this.bulletId >= 6535) {
                this.bulletId = 1;
            }
            this.playShootSound(bullettype);

            // 如果是 从服务器发来的别人的消息 不做处理       如果是自己的发射行为 则向服务器发送消息
            if (p.isMe && this.game.msg) {
                this.byIdleCheck.duration = 0
                this.game.msg.gameBYHandlerFire(deg, p.myGunLevel, this.bulletId);
            }
            p.decCoin(p.myGunLevel.toString());

            let tmp = -deg2Rad(deg);
            let x = 90 * Math.cos(tmp);
            let y = 90 * Math.sin(tmp);

            p.gunShake(cc.p(x, y));
            p.showFlame();

            let bulletPosition = cc.p(tgunpos.x + x, tgunpos.y + y);
            let bu = this.getOneBullet(seat);
            bu.active = true;
            bu.position = bulletPosition;
            let bulletScript = bu.getComponent(BYBullet);
            bulletScript.bulletId = this.bulletId;
            bulletScript.startMove(bulletPosition, aimV);
            bulletScript.gunId = seat;

            p.bulletCount++;

        }
    }

    playShootSound(type: number) {
        this.game.byAudio.playShootBulletSound(Math.floor(type / 2));
    }

    checkBulletCount(seat: number) {
        let p = this.game.playerMgr.getPlayerBySeat(seat);
        if (p && p.bulletCount > 29) {
            if (p.isMe) {
                this.game.showButtleCountMoreTip();
            }
            return false;
        }
        return true;
    }

    checkMoneyAndDistance(seat: number, aimV: cc.Vec2) {
        let p = this.game.playerMgr.getPlayerBySeat(seat);
        let tgunpos = p.gunPos;
        let x1 = tgunpos.x - aimV.x;
        let y1 = tgunpos.y - aimV.y;
        let distance = Math.sqrt(x1 * x1 + y1 * y1);
        if (distance < 90 && p.isLock != 1) {
            cc.log("距离太近");
            return false;
        }

        let tempB = p.myGunLevel * this.game.baseScore
        if (p.balance < tempB) {
            cc.log("金币不足不能发子弹");
            p.isLock = 0;
            p.lockFishFormationId = -1;
            p.lockFishId = -1;
            p.lockFish = undefined;
            p.hideLockDotLine();
            if (p.isMe) {
                this.game.closeLockFish();
                this.game.closeAutoShootBullet();
                this.game.moenyNotEnough();
            }
            return false;
        }
        return true;
    }
}
