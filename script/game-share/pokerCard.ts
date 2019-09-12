import { setGray } from "../common/util";

const { ccclass, property } = cc._decorator;

enum TurningState {
    None,
    ToFront,
    ToBack
}

export enum Suit {
    SPADE = 1,
    HEART,
    CLUB,
    DIAMOND,
    JOKER_S,
    JOKER_L
}

export enum Jokers {
    None,
    SMALL,
    LARGE
}

export interface Rune {
    rune: number;
    pretendRune?: number;
}

@ccclass
export default class PokerCard extends cc.Component {
    private nodeNumber?: cc.Node;
    private nodeSuit?: cc.Node;
    private center: cc.Node;
    private jokerMark?: cc.Node;
    private back: cc.Node;
    protected _front: cc.Node;
    get front() {
        if (!this._front) {
            this._front = this.node.getChildByName("front");
        }
        return this._front;
    }
    private _loaded: boolean;

    private _value: number;
    private _isFaceUp: boolean;
    private _turningState: TurningState;
    private _turningDuration = 0.4;
    get value() {
        return this._value;
    }
    set value(val: number) {
        this._value = val;
    }
    get isFaceUp() {
        return !this.isTurning && this._isFaceUp;
    }
    get isFaceDown() {
        return !this.isTurning && !this._isFaceUp;
    }
    get isTurning() {
        return this._turningState !== TurningState.None;
    }
    get turningDuration() {
        return this._turningDuration;
    }
    private _shouldShowFront: boolean;
    get shouldShowFront() {
        return this._shouldShowFront;
    }
    set shouldShowFront(val) {
        this._shouldShowFront = this._shouldShowFront || val;
    }

    /**
     * 卡牌点数
     * 
     * @readonly
     * @memberof PokerCard
     */
    get number() {
        return this.value % 100;
    }

    /**
     * 卡牌花色
     * 
     * @readonly
     * @memberof PokerCard
     */
    get suit() {
        return Math.floor(this.value / 100) % 10;
    }

    onLoad() {
        // init logic
        this._front = this.node.getChildByName("front");
        this.back = this.node.getChildByName("back");
        this.jokerMark = this.node.getChildByName("magic");

        this.center = this._front.getChildByName("center");
        this.nodeNumber = this._front.getChildByName("number");
        this.nodeSuit = this._front.getChildByName("suit");
        this._loaded = true;
        this.node.emit("loaded");
    }

    /**
     * 翻牌
     * 
     * @param {boolean} [toFront=true] 翻到正面【默认为真】
     * @param {boolean} [doAnim=true] 展示动画【默认为真】
     * @param {Function} [overHandler] 翻完回掉
     * @memberof SuohaCard
     */
    turn(toFront = true, doAnim = true, changeScale = 1) {
        if (!toFront && this.shouldShowFront) {
            return Promise.resolve({});
        }
        if (!this._loaded) {
            this.node.once("loaded", () => {
                this.turn(toFront, doAnim);
            });
            return Promise.resolve({});
        }
        return new Promise((resolve) => {
            this._turningState = toFront ? TurningState.ToFront : TurningState.ToBack;
            if (doAnim) {
                // Sound.dealCard();
                let tweenDuration = this._turningDuration / 2;
                this.node.scaleX = changeScale;
                this.node.runAction(cc.sequence(
                    cc.scaleTo(tweenDuration, 0, changeScale),
                    cc.callFunc(() => {
                        this._front.active = toFront;
                        this.back.active = !toFront;
                    }),
                    cc.scaleTo(tweenDuration, changeScale, changeScale),
                    cc.callFunc(() => {
                        this._turningState = TurningState.None;
                        this._isFaceUp = toFront;
                        resolve();
                    })
                ));
            } else {
                this.node.scaleX = changeScale;
                this.node.scaleY = changeScale;
                this.back.active = !toFront;
                this._front.active = toFront;
                this._turningState = TurningState.None;
                this._isFaceUp = toFront;
                resolve();
            }
        });
    }

    stopTurn() {
        this.node.stopAllActions();
    }

    discard(doAnim = true) {
        this._shouldShowFront = false;
        this.turn(false, doAnim).then(() => {
            setGray(this.node);
        });
    }
}