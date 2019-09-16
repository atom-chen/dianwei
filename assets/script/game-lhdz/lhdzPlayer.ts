import Player, { PlayerStates } from "../game-share/player";
import * as util from "../common/util";
import LhdzGame from "./lhdzGame";
import { areaBetInfo } from "./lhdzMsg";

const { ccclass, property, menu } = cc._decorator;

@ccclass
export default class LhdzPlayer extends Player {
    @property(cc.Label)
    labPos: cc.Label = undefined;

    private selfPos: cc.Vec2;
    private _areaBetInfos: areaBetInfo[] = [];

    specialPlayer: boolean;

    private animNodeArr: cc.Node[] = [];

    game: LhdzGame;
    changeState(state: PlayerStates): void {
    }

    get isMe() {
        return this.serverPos === this.game.playerMgr.getMePos();
    };

    get isLooker() {
        return false;
    }

    get areaBetInfos() {
        return this._areaBetInfos;
    }

    initBets() {
        this._areaBetInfos = [];
    }

    onLoad() {
        this.selfPos = this.node.getPosition();
        this.animNodeArr.push(this.spriteAvatar.node);
        this.animNodeArr.push(this.lblLocation.node);
        this.animNodeArr.push(this.spriteBalanceIcon.node);
        this.animNodeArr.push(this.lblBalance.node);
        super.onLoad();

        // 测试
        this.labPos.node.active = false;
    }

    enterAni(doAnim = true) {
        this.show();
        if (doAnim) {
            let scale = cc.scaleTo(0.1, 1, 1).easing(cc.easeQuadraticActionOut());
            for (const node of this.animNodeArr) {
                node.stopAllActions();
                node.setScale(0, 0);
                node.opacity = 255;
                node.runAction(cc.sequence(
                    scale.clone(),
                    cc.callFunc(() => {
                        node.setScale(1, 1);
                    })
                ));
            }
        }
    }

    leaveAni() {
        let seq = cc.sequence(cc.scaleTo(0.1, 0, 0), cc.callFunc(this.hide, this));
        for (const node of this.animNodeArr) {
            node.stopAllActions();
            node.setScale(1, 1);
            node.runAction(seq.clone());
        }
    }

    show() {
        for (const node of this.animNodeArr) {
            node.active = true;
        }
        if (this.avatar !== undefined) {
            this.spriteAvatar.spriteFrame = util.getAvatar(this.isMale, this.avatar);
        }
    }

    hide() {
        for (const node of this.animNodeArr) {
            node.active = false;
        }
        this.spriteAvatar.node.active = true;
        this.spriteAvatar.node.setScale(1, 1);
        this.spriteAvatar.spriteFrame = util.getAvatar(this.isMale, -1);
    }

    doBet(betArea: number, betPoint: string, isAnim = true) {
        this.syncBets(-betPoint);
        this._areaBetInfos.push({ area: betArea, betPoint: betPoint });
        if (this.isMe) return;
        if (!isAnim) return;

        this.node.stopAllActions();
        this.node.setPosition(this.selfPos);

        let worldPos = this.node.convertToWorldSpaceAR(cc.v2(0, 0));
        let moveOff = 20;
        if (worldPos.x > cc.winSize.width * 0.5) {
            moveOff = -moveOff;
        }
        let moveTime = 0.2;
        this.node.runAction(cc.sequence(
            cc.moveBy(moveTime, cc.v2(moveOff, 0)).easing(cc.easeBackOut()),
            cc.moveBy(moveTime * 0.5, cc.v2(-moveOff, 0)),
        ));
    }

    /**
     * 更新下注额，通过specialPlayer来判断是否重复更新
     * @param bets 
     * @param specialPlayer 
     */
    updateBets(bets: number, balance: number, specialPlayer: boolean = false) {
        if (this.balance !== undefined && !specialPlayer) {
            this.balance = util.add(balance, bets).toNumber();
            this.updateBalance();
            this.game.playerMgr.updateBalance(this.serverPos, this.balance);
        } else {
            this.balance = balance;
            this.updateBalance();
            this.game.playerMgr.updateBalance(this.serverPos, this.balance);
        }
    }

    /**
     * 自己、富豪、赌神的信息要同步
     * @param bets 
     */
    syncBets(bets: number) {
        this.updateBets(bets, this.balance);
        // 更新富豪、赌神
        let fhPlayer = this.game.fhPlayer;
        if (fhPlayer && fhPlayer.serverPos === this.serverPos) {
            fhPlayer.updateBets(bets, this.balance, true);
        }
        let dsPlayer = this.game.dsPlayer;
        if (dsPlayer && dsPlayer.serverPos === this.serverPos) {
            dsPlayer.updateBets(bets, this.balance, true);
        }
    }

    /**
     * 更新结算
     * @param points 
     */
    statisticsBalance(points: number) {
        this.syncBets(points);
    }

    convertToNodePos(node: cc.Node): cc.Vec2 {
        let worldPos = this.node.convertToWorldSpaceAR(cc.v2(0, 0));
        return node.convertToNodeSpaceAR(worldPos);
    }

}
