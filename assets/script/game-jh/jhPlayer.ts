const { ccclass, property } = cc._decorator;
import { PlayerStates } from "../game-share/player";
import JHGame, { CardTypes, BetType } from "./jhGame";
import JHCard from "./jhCard";
import { add, sub } from "../common/util";
import Parabola from "../game-share/parabola";
import TurningPlayer from "../game-share/turningPlayer";
import * as util from "../common/util";

export enum JHAction {
    Call,
    Raise,
    AllIn,
    Discard
}

@ccclass
export default class JHPlayer extends TurningPlayer {
    @property(cc.Node)
    private nodeBg: cc.Node = undefined;

    @property(cc.Sprite)
    private spDealerFrame: cc.Sprite = undefined;

    @property(cc.Sprite)
    private spLoseMask: cc.Sprite = undefined;

    @property(cc.Sprite)
    private spLoseType: cc.Sprite = undefined;

    @property(cc.SpriteFrame)
    private sfTypeLose: cc.SpriteFrame = undefined;

    @property(cc.SpriteFrame)
    private sfTypeDiscard: cc.SpriteFrame = undefined;

    @property(cc.Node)
    private nodeAction: cc.Node = undefined;

    @property(cc.Node)
    private nodeCards: cc.Node = undefined;

    @property(cc.Sprite)
    private spLookedCards: cc.Sprite = undefined;

    @property(cc.Sprite)
    private spCardType: cc.Sprite = undefined;

    @property(cc.SpriteFrame)
    private sfDiscard: cc.SpriteFrame = undefined;

    @property(cc.SpriteFrame)
    private sfRaise: cc.SpriteFrame = undefined;

    @property(cc.SpriteFrame)
    private sfCall: cc.SpriteFrame = undefined;

    @property(cc.SpriteFrame)
    private sfAllIn: cc.SpriteFrame = undefined;

    @property(cc.Sprite)
    private cardsMask: cc.Sprite = undefined;

    // @property(cc.Sprite)
    // private spPanel: cc.Sprite = undefined;

    // @property([cc.SpriteFrame])
    // private sfDealerFrame: cc.SpriteFrame[] = [];

    @property(cc.Node)
    private dealerEff: cc.Node = undefined;

    game: JHGame;

    get isMe() {
        return false;
    }

    private cards: JHCard[];
    /**
     * 是否已经看牌
     *
     * @type {boolean}
     * @memberof JHPlayer
     */
    isLooked: boolean;
    /**
     * 是否已比牌输掉
     *
     * @type {boolean}
     * @memberof JHPlayer
     */
    isLoser: boolean;
    /**
     * 牌型
     *
     * @type {CardTypes}
     * @memberof JHPlayer
     */
    cardType: CardTypes;
    /**
     * 是否已弃牌
     *
     * @type {boolean}
     * @memberof JHPlayer
     */
    isDiscarded: boolean;

    private _bets: number;
    private _isTuring: boolean;
    get isTuring() {
        return this._isTuring;
    }
    private _actionAnim: cc.Action;
    private _shouldHideAction: boolean;
    /**
     * 是否为旁观者
     *
     * @readonly
     * @memberof Player
     */
    get isLooker() {
        if (this.state && this.state !== PlayerStates.UNREADY && !this.isDiscarded && !this.isLoser) {
            return false;
        }
        return true;
    }

    changeState(state: PlayerStates): void {
        this.state = state;

        switch (state) {
            case PlayerStates.UNREADY:
                this.cardType = CardTypes.High;
                this.isDealer = false;
                this.isLooked = false;
                this.isDiscarded = false;
                this.updateLoseMask(false);
                this.becomeDealer(false);
                this.updateTimer(false);
                this.updateCardType(false);
                this.updateLooked(false);
                this.clearCards();
                this.spLoseType.node.active = false;
                this.spLoseMask.node.active = false;
                this.dealerEff.active = false;
                this.resetBets();
                break;
        }
        this.updateLookerView();
    }

    protected onEnable() {
        this.initUI();
    }

    private initUI() {
        this.spriteAvatar.node.active = true;
        this.spriteTimer.node.active = false;
        this.lblLocation.node.active = true;
        this.lblLocation.string = "";
        this.spriteBalanceIcon.node.active = true;
        this.lblBalance.node.active = true;
        this.lblBalance.string = "";
        this.lblBets.node.parent.active = false;
        this.lblBets.string = "0";
        this.nodeAction.active = false;
        this.nodeCards.active = true;
        this.spCardType.node.parent.active = false;
        this.spDealerFrame.node.active = false;
        this.spLookedCards.node.active = false;
        this.spLoseMask.node.active = false;
        // this.spPanel.spriteFrame = this.sfDealerFrame[0];
        this.resetBets();

        this.changeState(PlayerStates.UNREADY);
        this.clearCards();
    }

    clearCards() {
        if (this.cards) {
            this.cards.forEach(c => {
                this.game.recycleCard(c);
            });
        }
        this.cards = [];
        this.nodeCards.destroyAllChildren();
    }

    updateLooked(vis?: boolean) {
        if (!this.spLookedCards) {
            cc.warn("no sprite to look");
            return;
        }
        if (vis !== undefined) {
            this.spLookedCards.node.active = vis;
            return
        }
        this.spLookedCards.node.active = this.isLooked && !this.isDiscarded;
    }

    updateLoseMask(vis: boolean) {
        this.isLoser = vis;
        this.spLoseMask.node.active = vis;
        //显示战败
        this.spLoseType.spriteFrame = this.sfTypeLose;
        this.spLoseType.node.active = vis;
    }

    updateTimer(vis: boolean, time?: number) {
        this.spriteTimer.node.active = vis;
        if (vis) {
            // this.cdShow.showCD(time, this.spriteTimer, this.timerMask)
        } else {
            // this.cdShow.hideCD(this.timerMask);
        }
    }

    updateCardType(vis: boolean) {
        let node = this.spCardType.node.parent;
        if (vis && this.cardType >= CardTypes.Pair) {
            node.active = true;
            this.spCardType.spriteFrame = this.game.getCardTypeSf(this.cardType);
        } else {
            node.active = false;
        }
    }

    updateBets() {
        if (!this.lblBets || !this.lblBets.isValid) {
            return;
        }
        this.lblBets.node.parent.active = !!this._bets;
        this.lblBets.string = this._bets.toString();
    }

    resetBets() {
        this._bets = 0;
        this.updateBets();
    }

    /**
     * 开始回合
     *
     * @param {number} time second
     * @param {number} [totalTime] second
     * @memberof Player
     */
    startTurn(time: number, totalTime?: number) {
        this._isTuring = true;
        this.updateLookerView();
        totalTime = totalTime || time;
        this.showWaitingTimer(time, totalTime);
        this.hideAction();
    }

    endTurn(discard = false) {
        this._isTuring = false;
        this.clearWaitingTimer();
    }

    showAction(action: JHAction, doAnim = true) {
        this._shouldHideAction = false;
        let actionImg = this.nodeAction.getChildByName("bg")
            .getChildByName("action")
            .getComponent(cc.Sprite);
        switch (action) {
            case JHAction.Discard:
                actionImg.spriteFrame = this.sfDiscard;
                break;
            case JHAction.Raise:
                actionImg.spriteFrame = this.sfRaise;
                break;
            case JHAction.Call:
                actionImg.spriteFrame = this.sfCall;
                break;
            case JHAction.AllIn:
                actionImg.spriteFrame = this.sfAllIn;
                this.game.audioMgr.playAllIn(true);
                this.game.showOrHideAllInParticle(true);
                break;
        }
        this.game.audioMgr.noticeAction(this.isMale, action);
        let bg = this.nodeAction;
        bg.stopAllActions();
        bg.opacity = 255;
        bg.active = true;
        if (doAnim) {
            bg.scale = 0;
            this._actionAnim = bg.runAction(cc.sequence(cc.scaleTo(0.3, 1, 1).easing(cc.easeBackOut()), cc.callFunc(() => {
                this._actionAnim = undefined;
                if (this._shouldHideAction) {
                    this.hideAction();
                } else {
                    this.autoHideAction();
                }
            })));
        } else {
            bg.scaleX = 1;
            bg.scaleY = 1;
            this.autoHideAction();
        }
    }

    private autoHideAction() {
        this.scheduleOnce(() => {
            if (this && this.nodeAction && this.nodeAction.isValid && this.nodeAction.activeInHierarchy) {
                this.hideAction();
            }
        }, 2);
    }

    hideAction() {
        if (this._actionAnim) {
            this._shouldHideAction = true;
            return;
        }
        let bg = this.nodeAction;
        this._actionAnim = bg.runAction(cc.sequence(
            cc.scaleTo(0.1, 1, 1),
            cc.scaleTo(0.3, 0).easing(cc.easeBackIn()),
            cc.callFunc(() => {
                this._actionAnim = undefined;
                bg.active = false;
            })
        ));
    }

    addCards(index: number, cardVal: number, pretend?: number, doAnim = true) {
        return new Promise((resolve: (card?: JHCard) => void) => {
            let card = this.game.genCardByVal(cardVal, pretend);
            if (!card) {
                cc.warn("获取卡牌" + cardVal + "失败");
                resolve();
                return;
            }
            let cardObj = card.node;
            this.turnCard(card, false, false);
            card.value = cardVal;
            let width = cardObj.width;
            let handX = this.getEndX(width, index);
            this.nodeCards.addChild(cardObj, index);
            this.cards[index] = card;
            if (doAnim) {
                this.game.audioMgr.playDealCard();
                let centerPos = this.nodeCards.convertToNodeSpaceAR(cc.v2(cc.winSize.width / 2, cc.winSize.height / 2));
                cardObj.setPosition(centerPos);
                cardObj.rotation = 0;
                cardObj.scale = 0.5;
                let duration = 0.25;
                cardObj.runAction(
                    cc.sequence(
                        cc.spawn(
                            cc.scaleTo(duration, 1),
                            Parabola.move(duration, cardObj.position, cc.v2(this.getEndX(width, 0), 0))
                        ),
                        cc.moveTo(0.2, handX, 0),
                        cc.callFunc(resolve, undefined, card)
                    )
                );
            } else {
                cardObj.setPosition(handX, 0);
                resolve(card);
            }
        });
    }

    turnCard(card: JHCard, toFront = true, doAnim = true) {
        if (doAnim) {
            this.game.audioMgr.playDealCard();
        }
        return card.turn(toFront, doAnim)
    }

    private getEndX(width: number, idx: number) {
        let spaceX = (width * 3 - this.nodeCards.width) / 2;
        let halfWidth = this.nodeCards.width / 2;
        return idx * (width - spaceX) - halfWidth + width / 2;
    }

    discard() {
        this.showAction(JHAction.Discard);
        this.endTurn(true);
        // this.nodeCards.destroyAllChildren();
        let size = cc.winSize;
        this.spCardType.node.parent.active = false;
        let centerPos = this.nodeCards.convertToNodeSpaceAR(cc.v2(size.width / 2, size.height / 2));
        this.nodeCards.children.forEach(c => {
            c.runAction(
                cc.sequence(
                    cc.spawn(
                        cc.scaleTo(0.3, 0),
                        cc.rotateBy(0.3, 3600),
                        cc.moveTo(0.3, centerPos)
                    ),
                    cc.callFunc(() => {
                        let card = c.getComponent(JHCard);
                        if (card) {
                            this.game.recycleCard(card);
                        } else {
                            c.destroy();
                        }
                    })
                )
            )
        });
        this.isDiscarded = true;
        this.spLoseType.spriteFrame = this.sfTypeDiscard;
        this.spLoseType.node.active = true;
        this.updateLooked();
        this.updateLookerView();
    }

    updateLookerView() {
        if (this.isLooker) {
            this.nodeBg.opacity = 125;
        } else {
            this.nodeBg.opacity = 255;
        }
        this.spriteAvatar.node.opacity = 255;
    }

    becomeDealer(yeah = true, doAnim = true) {
        this.isDealer = yeah;
        this.spDealerFrame.node.active = yeah;
        if (yeah) {
            if (doAnim) {
                this.spDealerFrame.node.runAction(cc.sequence(
                    cc.blink(1, 5),
                    cc.callFunc(() => {
                        this.spDealerFrame.node.active = this.isDealer;
                        // this.spPanel.spriteFrame = this.sfDealerFrame[this.isDealer ? 1 : 0];
                        this.game.playDealerAnim(this.dealerEff);
                    })
                ));
            } else {
                this.spDealerFrame.node.active = this.isDealer;
                // this.spPanel.spriteFrame = this.sfDealerFrame[this.isDealer ? 1 : 0];
            }
        } else {
            // this.spPanel.spriteFrame = this.sfDealerFrame[this.isDealer ? 1 : 0];
        }
    }

    setBets(amount: string) {
        this._bets = +amount;
    }

    doBet(betType: BetType, amount: string, total?: string, remain?: string, doAnim = true) {
        switch (betType) {
            case BetType.Call:
                this.showAction(JHAction.Call);
                break;
            case BetType.Raise:
                this.showAction(JHAction.Raise);
                break;
            case BetType.AllIn:
                this.showAction(JHAction.AllIn);
                break;
        }
        this.doBetAnim(+amount, doAnim);
        if (betType !== BetType.None && betType !== BetType.Base) {
            this.endTurn();
        }
        if (total && !isNaN(+total)) {
            this._bets = +total;
        } else if (this._bets !== undefined) {
            this._bets = add(this._bets, amount).toNumber();
        }
        this.updateBets();
        if (this.balance && !isNaN(this.balance)) {
            if (remain && !isNaN(+remain)) {
                this.balance = +remain;
            } else if (this.balance !== undefined) {
                this.balance = sub(this.balance, amount).toNumber();
            }
            this.updateBalance();
        }
    }

    lose() {
        this.isLoser = true;
        this.spLoseMask.node.active = true;
        this.spLoseType.spriteFrame = this.sfTypeLose;
        this.spLoseType.node.active = true;
    }

    showCardType(type: CardTypes) {
        if (!this.spCardType || !this.spCardType.isValid) {
            cc.warn("no sprite to show card type");
            return;
        }
        this.updateLooked(false);
        let node = this.spCardType.node.parent;
        switch (type) {
            case CardTypes.High:
                node.active = false;
                break;
            default:
                this.spCardType.spriteFrame = this.game.getCardTypeSf(type);
                node.active = true;
        }
    }

    showFanCards() {
        this.cards.forEach((c, i) => {
            c.node.rotation = (i - 1) * 15;
            c.node.x -= (i - 1) * c.node.width * 0.2;
        });
    }

    // 丢筹码动画
    private doBetAnim(amount: number, doAnim = true) {
        if (!amount) {
            return;
        }
        let fromBox = this.spriteAvatar.node.parent;
        let chips = this.game.addChips(amount);
        let chipsBox = this.game.chipsPool;
        if (doAnim) {
            chips.forEach(chip => {
                chip.active = true;
                this.game.audioMgr.playChip();
                let startPoint = fromBox.convertToWorldSpaceAR(cc.v2(0, 0));
                startPoint = chipsBox.convertToNodeSpaceAR(startPoint);
                let toPoint = chip.position;
                chip.setPosition(startPoint);
                let distance = Math.sqrt(Math.pow(startPoint.x - toPoint.x, 2) + Math.pow(startPoint.y - toPoint.y, 2))
                let time = distance / 500;
                chip.runAction(cc.spawn(
                    cc.moveTo(time, toPoint).easing(cc.easeExponentialOut()),
                    cc.sequence(
                        cc.delayTime(time * 0.7),
                        cc.callFunc(() => {
                            this.game.audioMgr.playChip();
                        })
                    )
                ));
            });
        }
    }

    getPkNode() {
        return this.nodeBg;
    }

    gainChips(totalWinner: number) {
        let chipsBox = this.game.chipsPool;
        let toBox = this.spriteAvatar.node.parent;
        let promises: Promise<{}>[] = [];
        let children = chipsBox.children;
        let amount = Math.ceil(children.length / totalWinner);
        for (let i = amount - 1; i >= 0; i--) {
            let childIndex = Math.floor(Math.random() * i);
            let child = chipsBox.children[childIndex];
            if (!child) {
                continue;
            }
            let pos = chipsBox.convertToWorldSpaceAR(child.position);
            pos = toBox.convertToNodeSpaceAR(pos);
            chipsBox.removeChild(child);
            toBox.addChild(child);
            child.setPosition(pos);
            let distance = Math.sqrt(pos.x * pos.x + pos.y + pos.y);
            this.game.audioMgr.playChip();
            let p = new Promise((resolve) => {
                child.runAction(cc.sequence(
                    cc.moveTo(Math.min(distance / 500, 1), cc.v2(0, 0)).easing(cc.easeExponentialOut()),
                    cc.fadeOut(0.2),
                    cc.callFunc(() => {
                        this.game.audioMgr.playChip();
                        // child.destroy();
                        this.game.recycleChips(child);
                        resolve();
                    })
                ));
            });
            promises.push(p);
        }
        return Promise.all(promises);
    }

    getCenterPos() {
        return this.nodeBg.convertToWorldSpaceAR(cc.v2(0, 0));
    }

    showLoseMask() {
        let mask = util.instantiate(this.cardsMask.node);
        this.nodeCards.addChild(mask);
        mask.width = this.nodeCards.width;
        mask.height = this.nodeCards.height;
        mask.setPosition(0, 0);
        mask.setLocalZOrder(100);
        mask.active = true;
    }

    noticeTurnOver(): void {
        this.game.audioMgr.playSoundAlarm();
    }

}
