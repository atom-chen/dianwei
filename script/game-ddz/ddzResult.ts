import DDZGame from "./ddzGame";
import { UserResult, ResultShowInfo } from "./ddzMsg";
import g from "../g";

const { ccclass, property } = cc._decorator;

@ccclass
export default class DdzResult extends cc.Component {
    @property(cc.Animation)
    private animSuc: cc.Animation = undefined;

    @property(cc.Animation)
    private animFail: cc.Animation = undefined;

    @property(cc.Node)
    private infoPanel: cc.Node = undefined;

    @property(cc.Node)
    private nodeBtns: cc.Node = undefined;

    @property(cc.Node)
    private nodePlayers: cc.Node = undefined;

    @property(cc.Label)
    private labBaseScore: cc.Label = undefined;

    @property(cc.Label)
    private labBomb: cc.Label = undefined;

    @property(cc.Label)
    private labSpring: cc.Label = undefined;

    @property(cc.Label)
    private prepareTime: cc.Label = undefined;

    @property(cc.Node)
    private leftCards: cc.Node = undefined;

    @property(cc.Node)
    private rightCards: cc.Node = undefined;

    private PLAYER_NUM = 3;

    private game: DDZGame;

    private _prepareEndTime: number;

    setGame(game: DDZGame) {
        this.game = game;
    }

    show(resultInfos: ResultShowInfo[], bombNum: number, spring: number) {
        this.labBaseScore.string = this.game.baseScore.toString();
        this.labBomb.string = (bombNum === 1 ? "- -" : bombNum).toString();
        this.labSpring.string = (spring === 1 ? "- -" : spring).toString();

        for (let resultInfo of resultInfos) {
            let uResult = resultInfo.ur;
            let nodePlayer = this.nodePlayers.getChildByName(`player${uResult.rPos}`);
            let nodeDealer = nodePlayer.getChildByName("banker");
            let labLoc = nodePlayer.getChildByName("location").getComponent(cc.Label);
            let labBase = nodePlayer.getChildByName("base").getComponent(cc.Label);
            let labMul = nodePlayer.getChildByName("multiple").getComponent(cc.Label);
            let labScore = nodePlayer.getChildByName("balance").getComponent(cc.Label);
            let nodeAddMul = nodePlayer.getChildByName("addMul");

            nodeDealer.active = resultInfo.isDealer;
            nodeAddMul.active = resultInfo.isAddMul;
            labLoc.string = resultInfo.loc;
            labBase.string = this.game.baseScore.toString();
            labMul.string = uResult.totalMulti.toString();
            labScore.string = uResult.chgScore.toString();

            let col = resultInfo.isMe ? cc.hexToColor("#F5A302") : cc.hexToColor("#D6D6D6");
            labLoc.node.color = col;
            labBase.node.color = col;
            labMul.node.color = col;
            labScore.node.color = col;

            if (resultInfo.isMe) {
                if (uResult.chgScore > 0) {
                    this.showSuc();
                    let _animSuc = this.animSuc.node.getChildByName("dz_02");
                    this.showDealer(_animSuc, resultInfo.isDealer);
                } else {
                    this.showFail();
                    let _animFail = this.animFail.node.getChildByName("dz_01");
                    this.showDealer(_animFail, resultInfo.isDealer);
                }
            } else {
                let remainCards = resultInfo.remainCards;
                if (!remainCards) continue;
                remainCards.sort(this.pointSort);

                let nodeCards: cc.Node;
                if (resultInfo.isRight) {
                    nodeCards = this.rightCards;
                } else {
                    nodeCards = this.leftCards;
                }
                if (!nodeCards) continue;

                nodeCards.removeAllChildren();
                for (let index = 0; index < remainCards.length; index++) {
                    const cardData = remainCards[index];
                    let pokerRes = (<any>this.game).pokerRes;
                    if (!pokerRes) break;

                    let card = <cc.Node>pokerRes.getDdzCard(cardData);
                    card.y = 0;
                    card.scale = 0.5;
                    nodeCards.addChild(card);
                }
            }
        }
        this.node.active = true;

        this.infoPanel.scale = 1;
        // this.infoPanel.runAction(cc.sequence(
        //     cc.delayTime(0.5),
        //     cc.scaleTo(0.3, 1, 1).easing(cc.easeBounceOut()),
        // ));

        this.nodeBtns.opacity = 0;
        this.nodeBtns.runAction(cc.fadeTo(1, 255));

        this.prepareTime.node.active = false;
    }
    showSuc() {
        this.animSuc.node.active = true;
        this.animFail.node.active = false;
        this.animSuc.stop();
        let clips = this.animSuc.getClips();
        this.animSuc.play(clips[0].name, 0);
        this.game.audioMgr.playSuc();
        this.game.audioMgr.stopMusic();
    }

    showFail() {
        this.animSuc.node.active = false;
        this.animFail.node.active = true;
        this.animFail.stop();
        let clips = this.animFail.getClips();
        this.animFail.play(clips[0].name, 0);
        this.game.audioMgr.playFail();
        this.game.audioMgr.stopMusic();
    }

    showDealer(node: cc.Node, isDealer: boolean) {
        node.getChildByName('nm').active = !isDealer;
        node.getChildByName('dz').active = isDealer;
    }

    showTicker(timer?: number) {
        if (timer === undefined) {
            return;
        }
        this.prepareTime.node.active = true;
        this._prepareEndTime = Date.now() + timer;
        let t = Math.round(timer / 1000);
        this.prepareTime.string = t.toString();
        this.unschedule(this.countdownPre);
        this.schedule(this.countdownPre, 1, t, 1);
    }

    private countdownPre() {
        let now = Date.now();
        if (!this.prepareTime || !this.prepareTime.isValid || now >= this._prepareEndTime) {
            this.unschedule(this.countdownPre);
            return;
        }
        let t = Math.round((this._prepareEndTime - now) / 1000);
        this.prepareTime.string = t.toString();

    }

    hide() {
        this.node.active = false;
    }

    onClickBack() {
        this.hide();
        this.game.menu.onBackClick();
    }

    onClickNext() {
        this.game.audioMgr.playMusic();
        this.hide();
        this.game.onClickNext();
    }

    leaveNoMoney() {
        let msg = this.game.msg;
        this.game.returnLobby().then(() => {
            msg.handleLeaveReason(3);
        });
    }

    private pointSort(aData: number, bData: number) {
        let aPoint = aData & 0xff;
        let bPoint = bData & 0xff;
        let aSuit = aData >> 8;
        let bSuit = bData >> 8;
        if (aPoint === bPoint) {
            return bSuit - aSuit;
        } else {
            return bPoint - aPoint;
        }
    }
}
