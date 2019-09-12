import Game from "./game";
import Player from "./player";
import Poker from "./dpPoker";
import { CARD_TYPE } from "./dpPokerAlgorithm";

const { ccclass, property } = cc._decorator;

@ccclass
export default abstract class DiscardPlayer extends Player {
    @property(cc.Node)
    private nodeDiscard: cc.Node = undefined;

    @property(cc.Node)
    private nodeNoPlay: cc.Node = undefined;

    @property(cc.Label)
    private labTicker: cc.Label = undefined;

    private discardPos: cc.Vec2 = undefined;
    private tickerPos: cc.Vec2 = undefined;

    private _leftTime: number;

    game: Game;

    get isRightPlayer() {
        return this.seat === 1;
    }

    onLoad() {
        super.onLoad();
        this.discardPos = this.nodeDiscard.getPosition();
        this.tickerPos = this.labTicker.node.parent.getPosition();

    }

    /**
     * 出牌动画
     * @param cards 
     */
    discardAction(cards: number[], shape?: number) {
        this.nodeDiscard.active = true;
        this.nodeDiscard.removeAllChildren();

        if (shape) {
            cards = this.discardSort(cards);
        } else {
            cards.sort(this.pointSort);
        }

        this.nodeDiscard.setPosition(this.discardPos);
        let layout = this.nodeDiscard.getComponent(cc.Layout);
        this.nodeDiscard.removeAllChildren();
        let childNum = cards.length;
        if (this.isMe) {
            layout.spacingX = -90;
        } else {
            layout.spacingX = -95 - childNum / 1.5; // 牌越多间隔越小
        }

        for (let idx = 0; idx < childNum; idx++) {
            let cardData = cards[idx];
            let card = this.addDiscardCard(cardData);
            this.nodeDiscard.addChild(card);
        }

        this.discardCardAnimation();
    }

    /**
     * 弃牌
     * @param cardData 
     */
    private addDiscardCard(cardData: number) {
        let pokerRes = (<any>this.game).pokerRes;
        if (!pokerRes) return;

        let card = <cc.Node>pokerRes.getDdzCard(cardData);
        card.y = 0;
        if (this.isMe) {
            card.scale = 0.8;
        } else {
            card.scale = 0.5;
        }
        return card;
    }

    private discardCardAnimation() {
        this.nodeDiscard.children.forEach((card, i) => {
            card.y += 30;
            card.opacity = 0;

            card.runAction(cc.sequence(
                cc.delayTime(i * .05),
                cc.spawn(
                    cc.moveBy(.1, 0, - 30),
                    cc.fadeIn(.1)
                ),
            ));
        });

    }

    // 打出的牌排序
    private discardSort(cards: number[]) {
        let dataArr: number[][] = [];
        for (let idx = 0; idx < cards.length; idx++) {
            let point = cards[idx] & 0xff;
            if (!dataArr[point]) {
                dataArr[point] = [];
            }
            dataArr[point].push(cards[idx]);
        }
        // 按重复数降序、再按点数升序
        dataArr.sort((a, b) => {
            if (b.length === a.length) {
                let aPoint = a[0] & 0xff;
                let bPoint = b[0] & 0xff;
                return bPoint - aPoint;
            } else {
                return b.length - a.length;
            }
        })
        // 取出整理后的数据
        let newData: number[] = [];
        for (let i = 0; i < dataArr.length; i++) {
            let data = dataArr[i];
            if (data) {
                for (let j = 0; j < data.length; j++) {
                    let d = data[j];
                    newData.push(d);
                }
            }
        }
        return newData;
    }

    // 最后剩余的牌排序
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

    /**
     * 设置展示牌布局
     * @param normal 
     */
    setCardsLayout(normal: boolean) {
        if (!this.nodeDiscard || !this.discardPos) {
            return;
        }
        let layout = this.nodeDiscard.getComponent(cc.Layout);
        if (normal) {
            layout.type = cc.Layout.Type.HORIZONTAL;
            this.nodeDiscard.height = 80;
            this.nodeDiscard.x = this.discardPos.x;
        } else {
            layout.type = cc.Layout.Type.GRID;
            layout.paddingTop = -80;
            layout.spacingY = -100;
            this.nodeDiscard.width = 260;
            if (this.isRightPlayer) {
                this.nodeDiscard.x = this.discardPos.x + 60;
            }
        }
    }

    /** 
     * 清除展示牌
    */
    cleanCards() {
        if (this.nodeDiscard) {
            this.nodeDiscard.removeAllChildren();
            this.nodeDiscard.active = false;
        }
    }

    /**
     * 不出
     */
    showNoPlay() {
        this.setNoPlay(true);

        this.endWaitTime();
        this.cleanCards();
    }

    setNoPlay(visible: boolean) {
        this.nodeNoPlay.active = visible;
    }

    //---------------------倒计时
    setWaitTime(leftTime: number) {
        if (!leftTime) return;
        this._leftTime = leftTime;
        this.labTicker.node.parent.active = true;
        this.labTicker.string = this._leftTime.toString();
        this.unschedule(this.timeSchedule);
        this.schedule(this.timeSchedule, 1);

        this.labTicker.node.parent.y = this.tickerPos.y + 45;
        this.game.tickerShowAction(this.labTicker.node.parent, 1);
    }

    endWaitTime() {
        this.unschedule(this.timeSchedule);

        this.game.tickerHideAction(this.labTicker.node.parent);
    }

    private timeSchedule() {
        this._leftTime -= 1;
        if (this._leftTime < 0) {
            this._leftTime = 0;
            this.endWaitTime();
        }
        this.labTicker.string = this._leftTime.toString();

        if (this._leftTime <= 3) {
            let animClock = this.labTicker.node.parent.getChildByName('ticker');

            this.game.audioMgr.playClock();
            animClock.stopAllActions();
            animClock.scale = 1;
            animClock.opacity = 255;
            let actionTime = 0.5;
            animClock.runAction(cc.spawn(cc.scaleTo(actionTime, 2), cc.fadeTo(actionTime, 0)));
        }
    }

}
