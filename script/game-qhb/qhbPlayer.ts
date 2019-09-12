import Player, { PlayerStates } from "../game-share/player";
import QHBGame from "./qhbGame";
import { add } from "../common/util";

const {ccclass, property} = cc._decorator;

@ccclass
export default class QHBPlayer extends Player {
    @property(cc.Label)
    lblPos: cc.Label = undefined;

    @property(cc.Sprite)
    spInfoBg: cc.Sprite = undefined;

    @property([cc.SpriteFrame])
    sfBg: cc.SpriteFrame[] = [];

    @property(cc.Node)
    ndMyIcon: cc.Node = undefined;

    @property(cc.Sprite)
    spBoom: cc.Sprite = undefined;

    @property(cc.Sprite)
    spMaxRB: cc.Sprite = undefined;

    @property(cc.Sprite)
    spHeadFrame: cc.Sprite = undefined;

    private selfPos: cc.Vec2;

    posFlag: boolean = undefined;   // 标记玩家出现的方式（左滑（true）右滑（false））
    idx: number = 0;                // 标记玩家坐标
    pos: number = 0;                // 玩家序号
    game: QHBGame;

    onLoad() {
        super.onLoad();
        this.selfPos = this.node.getPosition();
        if (this.spBoom) this.spBoom.node.active = false;
        if (this.spMaxRB) this.spMaxRB.node.active = false;
        // cc.log("player坐标： ", this.selfPos);
    }

    get isMe() {
        return this.serverPos === this.game.playerMgr.getMePos();
    };

    get isLooker() {
        return false;
    }

    setPlyInfo(head: cc.SpriteFrame, loc: string, money?: string) {
        this.spriteAvatar.spriteFrame = head;
        this.lblLocation.string = loc;
        if (money) {
            this.lblBalance.string = money;
        } else {
            this.lblBalance.string = "暂未公开";
        }
    }

    grabAni() {
        let action1 = cc.moveBy(0.3, 200, 0);
        let action2 = cc.moveBy(0.3, -200, 0);
        if (this.posFlag) {
            this.node.setPositionX(this.selfPos.x - 180);
            this.node.runAction(action1);
        } else {
            this.node.setPositionX(this.selfPos.x + 180);
            this.node.runAction(action2);
        }
    }

    exitAni() {
        if (this.posFlag) {
            this.node.runAction(
                cc.sequence(
                    cc.moveBy(0.2, -300, 0),
                    cc.callFunc(() => {
                        this.node.destroy();
                    })
                )
            );
        } else {
            this.node.runAction(
                cc.sequence(
                    cc.moveBy(0.2, 300, 0),
                    cc.callFunc(() => {
                        this.node.destroy();
                    })
                )
            );
        }
    }

    changeInfoBg() {
        this.spInfoBg.spriteFrame = this.sfBg[0];
    }

    showMeIcon() {
        this.ndMyIcon.active = true;
    }

    showMaxRB() {
        if (this.spMaxRB) this.spMaxRB.node.active = true;
        if (this.spHeadFrame) this.spHeadFrame.node.active = false;
    }

    playAni() {
        if (this.spBoom) this.spBoom.node.active = true;
        let pool = this.game.boomPool;
        let boomPre = this.game.preOtherBoomAni;
        let boomParent = this.game.ndBoomLayer;
        let boom = this.game.getOnePoolItem(pool, boomPre, boomParent);
        let parentPos = this.node.parent.getPosition();
        let x = parentPos.x;
        let y = parentPos.y;
        if (this.posFlag) {
            x = x - 36;
        } else {
            x = x - 64;
        }
        let firstPos = y - this.node.height / 2;
        y = firstPos - (this.node.height + 14) * this.idx;
        boom.setPosition(x, y);
        if (boom) {
            this.game.playAni(boom);
        }
    }

    refreshMoney(chgMoney: number) {
        this.balance = add(this.balance, chgMoney).toNumber();
        this.updateBalance();
    }

    /**
     * 更新下注额，通过specialPlayer来判断是否重复更新
     * @param bets
     * @param specialPlayer
     */
    updateBets(bets: number, balance: number, specialPlayer: boolean = false) {
        if (this.balance !== undefined && !specialPlayer) {
            this.balance = add(balance, bets).toNumber();
            this.updateBalance();
            this.game.playerMgr.updateBalance(this.serverPos, this.balance);
        } else {
            this.balance = balance;
            this.updateBalance();
            this.game.playerMgr.updateBalance(this.serverPos, this.balance);
        }
    }

    convertToNodePos(node: cc.Node): cc.Vec2 {
        let worldPos = this.node.convertToWorldSpaceAR(cc.v2(0, 0));
        return node.convertToNodeSpaceAR(worldPos);
    }

    changeState(state: PlayerStates): void {  }
}
