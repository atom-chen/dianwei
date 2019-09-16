import NNGame, { BullType } from "./jdnnGame";
import NNCard from "./jdnnCard";
import { addSingleEvent, showTip } from "../common/util";
import Parabola from "../game-share/parabola";

const { ccclass, property } = cc._decorator;

@ccclass
export default class JDNNDock extends cc.Component {

    @property(cc.Node)
    private calc: cc.Node = undefined;

    @property(cc.Node)
    private nodeCards: cc.Node = undefined;

    @property(cc.Button)
    private hasBull: cc.Button = undefined;

    @property(cc.Label)
    private r1: cc.Label = undefined;

    @property(cc.Label)
    private r2: cc.Label = undefined;

    @property(cc.Label)
    private r3: cc.Label = undefined;

    @property(cc.Label)
    private sum: cc.Label = undefined;

    @property(cc.Animation)
    private bullHead: cc.Animation = undefined;

    private game: NNGame;
    private items: number[];
    bullType: BullType;
    private cards: NNCard[];
    /**
     * 已经选了参与计算的牌
     *
     * @private
     * @type {NNCard[]}
     * @memberof NNDock
     */
    private upCards: NNCard[];
    /**
     * 需要做完成计算的动作
     *
     * @private
     * @memberof NNDock
     */
    private needsFinish = false;

    init(game: NNGame) {
        this.game = game;
    }

    initRound() {
        this.calc.active = false;
        this.nodeCards.destroyAllChildren();
        this.hasBull.node.active = false;
        this.nodeCards.active = true;
        this.items = undefined;
        this.bullType = undefined;
        this.cards = [];
        this.needsFinish = false;
    }

    showCalculate() {
        this.hasBull.node.active = true;
        if (this.bullType >= BullType.BullBoom) {
            this.calc.active = false;
        } else {
            this.items = [];
            this.upCards = [];
            this.calc.active = true;
            this.updateCalculate();
        }
        // 播放牛牛动画
        let anim = this.bullHead;
        let clip = anim.defaultClip || anim.getClips()[0];
        if (!clip) {
            return;
        }
        anim.play(clip.name);
    }

    private updateCalculate() {
        this.r1.string = (this.items && this.items[0] || "").toString();
        this.r2.string = (this.items && this.items[1] || "").toString();
        this.r3.string = (this.items && this.items[2] || "").toString();
        if (this.items.length === 0) {
            this.sum.string = "";
        } else {
            this.sum.string = this.items.reduce((p, c) => {
                return p + c;
            }, 0).toString();
        }
    }

    hideCalculate() {
        if (this.cards.length === 5) {
            let me = this.game.playerMgr.me;
            for (let c of this.cards) {
                c.node.opacity = 255;
                c.turn(false, false);
                me.addCard(c, false);
            }
            this.cards = [];
            this.initRound();
        } else {
            this.needsFinish = true;
        }
    }

    replaceCard(index: number, card: NNCard) {
        let oldCard = this.cards[index];
        oldCard.value = card.value;
        let front = card.front;
        front.removeFromParent(true);
        oldCard.front.addChild(front, 1);
        card.node.destroy();
    }

    addCard(card: NNCard, doAnim = true, toLeft = false) {
        if (!this.cards) {
            card.node.destroy();
            return;
        }
        this.cards.push(card);
        let nodeCard = card.node;

        let parent = nodeCard.parent;
        let nodeCards = this.nodeCards;

        let layout = nodeCards.getComponent(cc.Layout);
        layout.enabled = false;

        let posW = parent.convertToWorldSpaceAR(nodeCard.position);
        parent.removeChild(nodeCard);
        nodeCards.addChild(nodeCard);
        let pos = nodeCards.convertToNodeSpaceAR(posW);
        nodeCard.setPosition(pos);

        if (doAnim) {
            let duration = 0.5;
            nodeCard.runAction(cc.spawn(
                cc.scaleTo(duration, 1, 1),
                cc.sequence(
                    Parabola.move(duration, nodeCard.position, this.getNewCardPos(nodeCard, toLeft ? 0 : undefined)),
                    cc.moveTo(0.2, this.getNewCardPos(nodeCard)),
                    cc.callFunc(() => {
                        card.turn(true, true);
                    })
                )
            ))
        } else {
            nodeCard.setPosition(this.getNewCardPos(nodeCard));
            nodeCard.opacity = 0;
            nodeCard.runAction(cc.sequence(cc.delayTime(0.2), cc.fadeIn(0.2)));
        }

        let btn = card.addComponent(cc.Button);
        let handler = new cc.Component.EventHandler();
        handler.target = this.node;
        handler.component = cc.js.getClassName(this);
        handler.handler = "onClickCard";
        addSingleEvent(btn, handler);

        // 添加的时候检测是否需要隐藏计算（比如重连）
        if (this.needsFinish && this.cards.length === 5) {
            this.hideCalculate();
        }
    }

    private getNewCardPos(card: cc.Node, index?: number) {
        if (index === undefined) {
            index = card.getSiblingIndex();
        }
        let node = this.nodeCards;
        let layout = node.getComponent(cc.Layout);
        let spaceX = (index > 0 ? layout.spacingX : 0);
        let baseWidth = index * card.width;
        let x = baseWidth + card.width / 2 + spaceX * index;
        return cc.v2(x, 0);
    }

    private onClickCard(ev: cc.Event.EventTouch) {
        if (!this.items) {
            return;
        }
        let node = ev.getCurrentTarget();
        let card = node.getComponent(NNCard);
        if (!card) {
            return;
        }
        let number = card.number;
        if (number > 10) {
            number = 10;
        }
        let y = node.y;
        let upIndex = this.upCards.indexOf(card);
        if (upIndex >= 0) {
            this.upCards.splice(upIndex, 1);
            y = 0;
            let index = this.items.lastIndexOf(number);
            if (index >= 0) {
                this.items.splice(index, 1);
            }
        } else {
            if (this.items.length >= 3) {
                showTip("亲，只能选择三张牌哦~");
                return;
            }
            this.upCards.push(card);
            this.items.push(number);
            y = 20;
        }
        node.y = y;
        this.updateCalculate();
    }

    private onClickHas() {
        this.game.msg.sendFinish();
    }


}
