import PdkGame from "./pdkGame";
import { UserResult, ResultShowInfo } from "./pdkMsg";
import g from "../g";

const { ccclass, property } = cc._decorator;

@ccclass
export default class DdzResult extends cc.Component {
    @property(cc.Node)
    private infoPanel: cc.Node = undefined;

    @property(cc.Node)
    private sucPanel: cc.Node = undefined;

    @property(cc.Node)
    private failPanel: cc.Node = undefined;

    @property(cc.Node)
    private nodeBtns: cc.Node = undefined;

    @property(cc.Label)
    private prepareTime: cc.Label = undefined;

    @property(cc.Node)
    private nodeLeftCards: cc.Node = undefined;

    @property(cc.Node)
    private nodeRightCards: cc.Node = undefined;

    @property([cc.Label])
    private labLoc: cc.Label[] = [];

    @property([cc.Label])
    private labScore: cc.Label[] = [];

    @property([cc.Label])
    private labRemain: cc.Label[] = [];

    @property([cc.Label])
    private labMoney: cc.Label[] = [];

    @property([cc.Node])
    private nodePay: cc.Node[] = [];// 包赔

    private readonly PLAYER_NUM = 3;

    private game: PdkGame;
    private _prepareEndTime: number;

    setGame(game: PdkGame) {
        this.game = game;
    }

    show(resultInfos: ResultShowInfo[]) {
        for (let i = 0; i < resultInfos.length; i++) {
            const info = resultInfos[i];
            let ur = info.ur;
            this.labLoc[i].string = info.loc;
            this.labScore[i].string = info.minScore;
            let remainNum = ur.remainCards ? ur.remainCards.length : 0;
            this.labRemain[i].string = remainNum.toString();
            this.labMoney[i].string = ur.money.toString();

            let col = info.isMe ? cc.hexToColor("#F5A302") : cc.hexToColor("#D6D6D6");
            this.labLoc[i].node.color = col;
            this.labScore[i].node.color = col;
            this.labRemain[i].node.color = col;
            this.labMoney[i].node.color = col;
            this.nodePay[i].active = !!info.guan;
            if (!!info.guan) {
                this.nodePay[i].children.forEach(node => {
                    node.active = false;
                });
                let node = this.nodePay[i].getChildByName(info.guan);
                if (node) node.active = true;
            }

            if (info.isMe) {
                if (+ur.money > 0) {
                    this.game.audioMgr.playSuc();
                    this.showSucFail(this.sucPanel);
                } else {
                    this.game.audioMgr.playFail();
                    this.showSucFail(this.failPanel);
                }
            } else {
                let remainCards = info.remainCards;
                if (!remainCards) continue;
                remainCards.sort(this.pointSort);

                let nodeCards: cc.Node;
                if (info.isRight) {
                    nodeCards = this.nodeRightCards;
                } else {
                    nodeCards = this.nodeLeftCards;
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

        this.nodeBtns.opacity = 0;
        this.nodeBtns.runAction(cc.fadeTo(1, 255));

        this.prepareTime.node.active = false;
    }

    private showSucFail(panel: cc.Node) {
        this.sucPanel.active = false;
        this.failPanel.active = false;
        panel.active = true;
        panel.getChildByName('light').runAction(cc.repeatForever(cc.rotateBy(3, 360)));
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
            this.prepareTime.node.active = false;
            this.unschedule(this.countdownPre);
            return;
        }
        let t = Math.round((this._prepareEndTime - now) / 1000);
        this.prepareTime.node.active = true;
        this.prepareTime.string = t.toString();
    }

    hide() {
        this.node.active = false;
    }

    private onClickBack() {
        this.hide();
        this.game.menu.onBackClick();
    }

    private onClickNext() {
        this.hide();
        this.game.onClickNext();
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
