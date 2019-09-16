import DZPKGame, { DZPKCardType } from "./dzpkGame";
import * as util from "../common/util";
import DZPKCard from "./dzpkCard";
import TurningPlayer from "../game-share/turningPlayer";
const { ccclass, property } = cc._decorator;

export enum PlayerStates {
    /**未准备 */
    UNREADY,
    /**已准备 */
    READY,
    //开始了
    STARTED,
    //开始下注
    BETTING,
    //下注了
    BETTED,
    //计算
    DISCARDED,
    //结算了
    RESULT,
    //end了
    END,
    //断线了
    OFFLINE
}

export enum DZPKAction {
    Check,
    Call,
    Raise,
    AllIn,
    Discard
}

export enum BetType {
    None,
    Base,
    Check,
    Raise,
    Follow,
    AllIn
}



@ccclass
export default class DZPKPlayer extends TurningPlayer {
    //ui
    @property([cc.SpriteFrame])
    actionSfArr: cc.SpriteFrame[] = [];

    @property(cc.Sprite)
    cardType: cc.Sprite = undefined;

    @property(cc.Sprite)
    spriteAction: cc.Sprite = undefined;

    @property(cc.Layout)
    layoutCards: cc.Layout = undefined;

    @property(cc.Node)
    myBetPoolIcon: cc.Node = undefined;
    @property(cc.Node)
    private dealerEff: cc.Node = undefined;

    cards: DZPKCard[];
    cardsValue: number[];
    private _curRoundAddBetCnt: number;  // 当前轮已经加注了多少次了   一共3次
    get curRoundAddBetCnt() {
        return this._curRoundAddBetCnt;
    }
    // data
    private _roundBets: number;
    get roundBets() {
        return this._roundBets;
    }

    private _isDealer: boolean;
    get isDealer() {
        return this._isDealer;
    }
    private _shouldHideAction: boolean;
    private _actionAnim?: cc.Action;
    private _initActionScaleX: number;
    get isBetting() {
        return this.state === PlayerStates.BETTING;
    }

    public handlePai: number[] = [];
    public takeMoney: number = 0;

    /**
     * 是否为旁观者
     *
     * @readonly
     * @memberof Player
     */
    get isLooker() {
        return this.state === PlayerStates.UNREADY || this.state === PlayerStates.DISCARDED;
    }

    get isDisCarded() {
        return this.state === PlayerStates.DISCARDED;
    }
    game: DZPKGame;

    get hasHiddenCard() {
        let has = false;
        if (this.cards && this.cards.length > 0) {
            let card = this.cards[0];
            has = card.isFaceDown || (card.isFaceUp && card.isTurning);
        }
        return has;
    }

    onLoad() {
        // init logic
        super.onLoad();
    }

    onEnable() {
        this.initUI();
    }

    private initUI() {
        this.spriteAvatar.node.active = true;
        this.spriteTimer.node.active = false;
        this.spriteDealer.node.active = false;
        this.lblLocation.node.active = true;
        this.lblLocation.string = "";
        this.spriteBalanceIcon.node.active = true;
        this.lblBalance.node.active = true;
        this.lblBalance.string = "";
        this.lblBets.node.parent.active = false;
        this.lblBets.string = "0";
        this.spriteAction.node.parent.active = false;
        this.layoutCards.node.active = true;
        if (!this._initActionScaleX) {
            this._initActionScaleX = this.spriteAction.node.parent.scaleX;
        }
        this.resetRoundBets();
        // this.updateReady();
        this.changeState(PlayerStates.UNREADY);
        this.clearHandCards();
        this.hideFinalCardType();
        this.clearContainer();
    }

    /**
     * 清除 向上飘字的动画
     */
    clearContainer() {
        let toBox = this.spriteAvatar.node.parent;
        let container = toBox.getChildByName("container");
        cc.log("----clearContainer------");
        if (container) {
            cc.log("----clearCo1ntainer------");
            cc.director.getActionManager().removeAllActionsFromTarget(container);
            container.active = false;
            container.destroy();
        }
    }

    setCurRoundAddBetCnt(curRoundAddBetCnt: number) {
        this._curRoundAddBetCnt = curRoundAddBetCnt;
    }

    updateMoney(money?: number | string) {
        if (money === undefined) {
            this.money = undefined;
        } else if (!isNaN(+money)) {
            this.money = +money;
            // this.showUserInfo();
        }
        this.updateBalance();
    }

    updateShowMoney(money?: number | string) {
        if (money === undefined) {
            this.takeMoney = undefined;
        } else if (!isNaN(+money)) {
            this.takeMoney = +money;
        }
        this.updateBalance();
    }

    updateBalance() {
        if (this.lblBalance && this.lblBalance.isValid) {
            if (this.takeMoney !== undefined) {
                this.lblBalance.string = util.toCNMoney(this.takeMoney.toString());
            } else {
                this.lblBalance.string = "--";
            }
        }
        if (this.spriteBalanceIcon) {
            this.spriteBalanceIcon.node.active = true;
        }
    }

    // hideUserInfo() {
    //     this.lblBalance.string = "--";
    //     this.lblLocation.string = "--";
    //     if (!this.spriteAvatar) {
    //         return;
    //     }
    //     let node = this.spriteAvatar.node;
    //     node.stopAllActions();
    //     node.runAction(cc.sequence(
    //         cc.fadeOut(0.2),
    //         cc.callFunc(() => {
    //             this.spriteAvatar.spriteFrame = util.getAvatar(this.isMale, -1);
    //             let opacity = this.isLooker ? 127 : 255;
    //             node.runAction(cc.fadeTo(0.2, opacity));
    //         })
    //     ))
    // }


    // showUserInfo() {

    //     if (this.isLooker && !this.isMe) {
    //         return;
    //     }

    //     if (this.lblLocation) {
    //         if (this.location) {
    //             this.lblLocation.string = this.location;
    //         } else {
    //             this.lblLocation.string = "--";
    //         }
    //     }
    //     this.updateBalance();
    //     if (!this.spriteAvatar) {
    //         return;
    //     }
    //     let node = this.spriteAvatar.node;
    //     node.stopAllActions();
    //     node.runAction(cc.sequence(
    //         cc.fadeOut(0.2),
    //         cc.callFunc(() => {
    //             this.spriteAvatar.spriteFrame = util.getAvatar(this.isMale, this.avatar);
    //             let opacity = this.isLooker ? 127 : 255;
    //             node.runAction(cc.fadeTo(0.2, opacity));
    //         })
    //     ))
    // }
    changeState(state: PlayerStates): void {
        this.state = state;
        switch (state) {
            case PlayerStates.UNREADY:
                this.resetRoundBets();
                this.hideFinalCardType();
                this._isDealer = false;
                this.spriteDealer.node.active = false;
                break;
            case PlayerStates.READY:
                break;
            case PlayerStates.STARTED:
                this.lblBets.node.parent.active = true;
                if (this.isMe) {
                    cc.log("-------showOther-----");
                    this.game.operation.showOther();
                }
                this.updateRoundBets();
                break;
            case PlayerStates.DISCARDED:
                if (this.isMe) {
                    this.game.resetOperations();
                }
                // this.lblBets.node.parent.active = false;
                break;
            case PlayerStates.RESULT:
                break;
            case PlayerStates.END:
                break;
            case PlayerStates.OFFLINE:
                break;
        }
        // this.updateReady();
        this.updateLookerView();
    }

    protected updateRoundBets() {
        this.lblBets.node.parent.active = !!this._roundBets;
        this.lblBets.string = this._roundBets.toString();
    }

    /**
     * 开始回合
     *
     * @param {number} time
     * @param {number} [totalTime]
     * @memberof Player
     */
    startTurn(time: number, totalTime?: number) {
        this.updateLookerView();
        totalTime = totalTime || time;
        this.changeState(PlayerStates.BETTING);
        this.showWaitingTimer(time, totalTime);
        this.hideAction();

        if (this.isMe) {
            this.game.showOperations();
        }
    }

    endTurn() {
        this.changeState(PlayerStates.BETTED);
        this.clearWaitingTimer();
        if (this.isMe) {
            this.game.hideOperations();
        }
    }

    discard(doAnim = true) {
        this.endTurn();
        this.changeState(PlayerStates.DISCARDED);
        if (doAnim) {
            this.showAction(DZPKAction.Discard);
        }
        if (this.isMe) {
            // this.game.hideCardType();
            this.game.showDiscardMask();
            // this.cards.forEach(card => {
            //     card.meDiscard();
            // });
            // this.game.playerMgr.hidePlayers();
        } else {
            this.cards.forEach(card => {
                card.discard(doAnim);
            });
        }

    }

    /**
     * 让牌
     * @param doAnim
     */
    check(doAnim = true) {
        this.endTurn();
        this.changeState(PlayerStates.BETTED);
        if (doAnim) {
            this.showAction(DZPKAction.Check);
        }
    }

    showAction(action: DZPKAction, doAnim = true) {
        this._shouldHideAction = false;
        let actionImg = this.spriteAction;

        actionImg.spriteFrame = this.actionSfArr[action];

        this.game.audioMgr.noticeAction(this.isMale, action);
        let bg = this.spriteAction.node.parent;
        bg.stopAllActions();
        bg.opacity = 255;
        bg.active = true;
        if (doAnim) {
            bg.scale = 0;
            this._actionAnim = bg.runAction(cc.sequence(cc.scaleTo(0.3, this._initActionScaleX, 1).easing(cc.easeBackOut()), cc.callFunc(() => {
                this._actionAnim = undefined;
                if (this._shouldHideAction) {
                    this.hideAction();
                } else {
                    this.autoHideAction();
                }
            })));
        } else {
            bg.scaleX = this._initActionScaleX;
            bg.scaleY = 1;
            this.autoHideAction();
        }
    }

    private autoHideAction() {
        this.scheduleOnce(() => {
            if (this && this.spriteAction && this.spriteAction.isValid && this.spriteAction.node.activeInHierarchy) {
                this.hideAction();
            }
        }, 2);
    }

    hideAction() {
        if (this._actionAnim) {
            this._shouldHideAction = true;
            return;
        }
        let bg = this.spriteAction.node.parent;
        this._actionAnim = bg.runAction(cc.sequence(cc.scaleTo(0.1, this._initActionScaleX, 1), cc.scaleTo(0.3, 0).easing(cc.easeBackIn()), cc.callFunc(() => {
            this._actionAnim = undefined;
            bg.active = false;
        })));
    }

    clearHandCards() {
        if (this.cards) {
            this.cards.forEach(c => {
                this.game.recycleCard(c);
            });
        }
        this.cardsValue = [];
        this.cards = new Array();
        this.layoutCards.node.destroyAllChildren();
    }

    resetRoundBets() {
        let bet = this._roundBets;
        this._roundBets = 0;
        this.myRoundBetsFlyToAllPool(bet);
        this.updateRoundBets();

    }

    /**
     * 从自己筹码池飞出筹码到总的池里
     * @param roundBets
     */
    myRoundBetsFlyToAllPool(roundBets: number) {
        if (roundBets > 0) {
            let chip = this.game.getOneChip(roundBets);
            let startPoint = this.myBetPoolIcon.convertToWorldSpaceAR(cc.v2(0, 0));
            startPoint = this.game.chipsPool.convertToNodeSpaceAR(startPoint);
            chip.position = startPoint;

            let toPoint = this.game.nodeSmallBetPool[0].parent.convertToWorldSpaceAR(cc.v2(0, 0));
            toPoint = this.game.chipsPool.convertToNodeSpaceAR(toPoint);

            let time = 0.5;
            chip.runAction(cc.sequence(cc.moveTo(time, toPoint).easing(cc.easeSineIn()), cc.fadeOut(0.2),
                cc.callFunc(() => {
                    roundBets = 0;
                    this.updateRoundBets();
                    this.game.recycleChips(chip);
                })));
        }
    }

    setRoundBets(bets: number) {
        this._roundBets = bets;
        this.updateRoundBets();
    }
    becomeDealer(doAnim = true) {
        this._isDealer = true;
        if (this.spriteDealer && this.spriteDealer.isValid) {
            this.spriteDealer.node.stopAllActions();
            this.spriteDealer.node.active = true;
            if (doAnim) {
                this.spriteDealer.node.scale = 0;
                this.spriteDealer.node.runAction(cc.scaleTo(0.5, 1).easing(cc.easeBackOut()));
                // this.playBecomeDearlAnimation(this.dealerEff);
            } else {
                this.spriteDealer.node.scale = 1;
            }
        }
    }

    // 丢筹码动画
    private doBetAnim(amount: string, doAnim = true) {
        if (!amount) {
            return;
        }
        let fromBox = this.spriteAvatar.node.parent;
        let chips = this.game.addChips(+amount);
        let chipsBox = this.game.chipsPool;
        if (doAnim) {
            chips.forEach(chip => {
                chip.active = true;
                this.game.audioMgr.noticeMoveChips();
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
                            this.game.audioMgr.noticeMoveChips();
                        })
                    )
                ));
            });
        }
    }

    /**
     * 下注时 把筹码从自己头像处飘到下注显示icon
     * @param amount 下注额
     */
    private doDZPKBetAnim(amount: string) {
        this.game.audioMgr.noticeMoveChips();
        this._roundBets = util.add(this.roundBets, amount).toNumber();

        if (this._roundBets === 0) {
            return;
        }
        let oneChip = this.game.getOneChip(this._roundBets);
        let start = this.node.convertToWorldSpaceAR(cc.v2(0, 0));
        start = this.game.chipsPool.convertToNodeSpaceAR(start);

        oneChip.position = start;
        let toPint = this.myBetPoolIcon.convertToWorldSpaceAR(cc.v2(0, 0));;
        toPint = this.game.chipsPool.convertToNodeSpaceAR(toPint);
        let time = 0.3;
        this.myBetPoolIcon.getComponent(cc.Sprite).spriteFrame = oneChip.getComponent(cc.Sprite).spriteFrame;

        oneChip.runAction(cc.sequence(cc.moveTo(time, toPint).easing(cc.easeSineIn()), cc.spawn(cc.fadeOut(0.2), cc.callFunc(() => {
            this.updateRoundBets();
            this.game.recycleChips(oneChip);
        }))));
    }

    bets(amount: string, betType: BetType, doAnim = true) {
        this.endTurn();
        this.doDZPKBetAnim(amount);

        let action: DZPKAction | undefined;
        switch (betType) {
            case BetType.None:
                break;
            case BetType.Follow:
                action = DZPKAction.Call;
                break;
            case BetType.Raise:
                action = DZPKAction.Raise;
                break;
            case BetType.Check:
                action = DZPKAction.Check;
                break;
            case BetType.AllIn:
                action = DZPKAction.AllIn;
                if (this.isMe) {
                    this.game.resetOperations();
                }
                break;
            case BetType.Base:
                this.scheduleOnce(() => {
                    this.game.updateRoomInfo();
                }, 0.1);
                return;
            default:
                cc.warn("未知下注类型！");
                return;
        }
        if (action !== undefined) {
            this.showAction(action, doAnim);
        }

    }

    private exchangeCards(index1: number, index2: number, doAnim = false) {
        let card1 = this.cards[index1];
        let card2 = this.cards[index2];
        this.cards[index2] = card1;
        this.cards[index1] = card2;
        let uiCard1 = card1.node;
        let uiCard2 = card2.node;
        let x1 = uiCard1.x;
        let y1 = uiCard1.y;
        if (doAnim) {
            uiCard1.runAction(cc.moveTo(1, uiCard2.position).easing(cc.easeExponentialOut()));
            uiCard2.runAction(cc.moveTo(1, uiCard1.position).easing(cc.easeExponentialOut()));
        } else {
            let temp = uiCard1.position;
            uiCard1.setPosition(uiCard2.position);
            uiCard2.setPosition(temp);
        }
        let tempIndex = uiCard1.zIndex;
        uiCard1.zIndex = uiCard2.zIndex;
        uiCard2.zIndex = tempIndex;
    }

    private removeHandCard(index: number) {
        let card = this.cards[index];
        if (!card) {
            cc.warn("试图移除一张不存在的牌");
            return;
        }
        this.game.recycleCard(card);
        delete this.cards[index];
    }

    protected getEndX(w: number, idx: number, isBig: boolean = false) {
        let node = this.layoutCards.node;
        let minX = - node.width / 2;
        let deltaX = this.layoutCards.spacingX;
        return minX + w / 2 + (w + deltaX) * idx;
    }

    /**
     * 将一张牌置灰
     * @param card 将要置灰的牌
     */
    public cardSetGray(card: DZPKCard) {
        let cardNode = card.node;
        if (cardNode) {
            cardNode.runAction(cc.fadeTo(0.2, 77));
        }
    }

    private addUiCardToHand(index: number, cardVal: number, faceUp = true, doAnim = false) {
        return new Promise((resolve: (card?: DZPKCard) => void) => {
            let card: DZPKCard = this.game.getDZCardByVal(cardVal);
            let cardObj = card.node;
            if (!cardObj) {
                cc.warn("获取卡牌" + cardVal + "失败");
                resolve();
                return;
            }
            // if (!faceUp) {
            card.turn(false, false);
            // }

            let width = cardObj.width;
            let handX = this.getEndX(width, index);
            if (doAnim) {
                this.layoutCards.node.addChild(cardObj, index);
                this.game.audioMgr.noticeDealCard();
                let centerPos = this.layoutCards.node.convertToNodeSpaceAR(cc.v2(568, 500));
                cardObj.setPosition(centerPos);
                cardObj.scale = 0.5;
                cardObj.runAction(cc.sequence(
                    cc.spawn(
                        cc.moveTo(0.3, handX, 0).easing(cc.easeCircleActionOut()),
                        cc.scaleTo(0.3, 1)
                    ),
                    cc.callFunc(() => {
                        resolve(card);
                    }),
                    cc.delayTime(.2),
                    cc.callFunc(() => {
                        if (faceUp) {
                            card.turn(true, true);
                        }
                    })
                ))
            } else {
                this.layoutCards.node.addChild(cardObj, index);
                cardObj.setPosition(handX, 0);
                resolve(card);
            }
            this.cards[index] = card;
            this.cardsValue[index] = cardVal;
        });
    }

    async turnCard(index: number, faceUp: boolean, shouldShowFront = false) {
        let card = this.cards[index];
        card.shouldShowFront = shouldShowFront;
        if (card.isTurning && shouldShowFront) {
            card.stopTurn();
        } else {
            if (faceUp && card.isFaceUp) {
                cc.warn("试图翻一张已经是正面的牌");
                return;
            } else if (!faceUp && card.isFaceDown) {
                cc.warn("试图翻一张已经是背面的牌");
                return;
            }
        }
        await card.turn(faceUp, true);
    }

    async addCards(index: number, cardVal: number, doAnim = true) {
        let c = this.cards[index];
        if (c) {
            this.removeHandCard(index);
        }
        return this.addUiCardToHand(index, cardVal, !!cardVal, doAnim);
    }

    updateLookerView() {
        if (this.isLooker) {
            this.spriteAvatar.node.opacity = 125;
            this.lblBalance.node.parent.opacity = 125;
            this.lblLocation.node.parent.opacity = 125;
        } else {
            this.spriteAvatar.node.opacity = 255;
            this.lblBalance.node.parent.opacity = 255;
            this.lblLocation.node.parent.opacity = 255;
        }
    }

    playBecomeDearlAnimation(animNode: cc.Node) {
        this.game.playAnimEff(animNode);
    }
    async showHiddenCards(duration: number) {
        await this.turnCard(0, true);
        await new Promise((resolve) => {
            this.scheduleOnce(resolve, duration);
        });
        await this.turnCard(0, false);
    }

    /**
     * 隐藏最终牌型 不需要用到的牌
     * @param maxCards 组成最终牌型的牌
     */
    hideUselessCards(maxCards: number[]) {
        if (this.cards.length === 0) {
            return;
        }
        cc.log("--hideUselessCards--");
        this.cards[1].node.runAction(cc.moveTo(0.2, cc.p(this.cards[1].node.x + 70, this.cards[1].node.y)));
        this.cards.forEach(el => {
            el.node.opacity = 77;
        });
        this.game.commonCards.forEach(el => {
            el.node.opacity = 77;
        });

        maxCards.forEach(el => {
            let spIndex = this.cardsValue.indexOf(el);
            if (spIndex != -1) {
                this.cards[spIndex].node.opacity = 255;
            }
            let comIndex = this.game.commonCardsValue.indexOf(el);
            if (comIndex != -1) {
                this.game.commonCards[comIndex].node.opacity = 255;
            }
        });
    }

    showFinalCardType(type: DZPKCardType, maxCards?: number[]) {
        let sp: cc.SpriteFrame | undefined;
        if (type >= DZPKCardType.gaoPai) {
            sp = this.game.cardTypes[type];
        }

        if (sp) {
            this.cardType.spriteFrame = sp;
            this.cardType.node.parent.active = true;
        }
        if (maxCards && this.isMe) {
            this.hideUselessCards(maxCards);
        }
    }

    showMyCardsToCommonCardNode() {

        let index = 0;
        this.cards.forEach(el => {
            let cardNode = el.node;
            let newCardNode = cc.instantiate(cardNode);
            if (!newCardNode) {
                cc.log("myCards instantiate fail");
            } else {
                newCardNode.scale = 1.4;
                newCardNode.position = cc.p(-newCardNode.width / 2 - 40 + (newCardNode.width + 80) * index, -320);
                this.game.nodeCommonCards.addChild(newCardNode);
            }
            index++;
        });
    }


    hideFinalCardType() {
        this.cardType.node.parent.active = false;
    }

    async gainChips(postTaxEarn?: number, tax?: number, cb?: Function) {

        let chips = this.game.addChips(postTaxEarn);

        let chipsBox = this.game.chipsPool;
        let toBox = this.spriteAvatar.node.parent;
        const sectionEnd = Math.floor(chipsBox.childrenCount / this.game.winnerNum--)
        let children = chipsBox.children.slice(0, sectionEnd);
        let promises: Promise<{}>[] = [];
        let time = 0;
        this.game.hideSmallBetsPool();

        if (postTaxEarn > 0) {
            children.forEach((child, index) => {
                let pos = this.game.nodeSmallBetPool[0].parent.convertToWorldSpaceAR(cc.p(0, 0));
                pos = toBox.convertToNodeSpaceAR(pos);
                chipsBox.removeChild(child);
                child.opacity = 255;
                child.active = true;
                toBox.addChild(child);
                child.setPosition(pos);
                let distance = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
                this.game.audioMgr.noticeMoveChips();

                let ranx = -50 + Math.random() * 100;
                let rany = -50 + Math.random() * 100;
                let toPointx = ranx + child.x;
                let toPointy = rany + child.y;

                let p = new Promise((resolve) => {
                    child.runAction(cc.sequence(
                        cc.moveTo(0.3, cc.p(toPointx, toPointy)).easing(cc.easeBackOut()),
                        cc.delayTime(1),
                        cc.moveTo(distance / 900, cc.v2(0, 0)).easing(cc.easeBackIn()),
                        cc.fadeOut(0.2),
                        cc.callFunc(() => {
                            this.game.audioMgr.noticeMoveChips();
                            // child.destroy();
                            this.game.recycleChips(child);
                            resolve();
                        })
                    ));
                });
                // time += 0.05;
                promises.push(p);
            });
        } else {
            let p = new Promise((resolve) => {
                resolve();
            });
            promises.push(p);
        }

        Promise.all(promises).then(() => {
            if (postTaxEarn >= 0) {
                return this.showGetAndLost({ get: "+" + postTaxEarn });
            } else {
                return this.showGetAndLost({ lost: postTaxEarn.toString() });
            }
        }).then(() => {
            if (cb) {
                cb();
            }
        }).catch(err => {
            cc.warn(err);
            children.forEach(child => {
                if (child && child.isValid) {
                    child.destroy();
                }
            });
        });
    }

    noticeTurnOver(): void {
        this.game.audioMgr.noticeTurnOver();
    }



    leaveAni() {
        super.leaveAni();
        this.clearHandCards();
    }
}
