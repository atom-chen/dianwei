import Player from "../game-share/player";
import NNCard from "./nnCard";
import NNGame, { BullType } from "./nnGame";
import Parabola from "../game-share/parabola";
import { Rune } from "../game-share/pokerCard";
const { ccclass, property } = cc._decorator;

export enum PlayerStates {
    /**未准备 */
    UNREADY,
    /**已准备 */
    READY,
    //开始了
    STARTED,
    //开始抢庄
    GRABBING,
    //抢庄了
    GRABBED,
    //开始下注
    BETTING,
    //下注了
    BETTED,
    //计算
    CALCULATING,
    //计算了
    CALCULATED,
    //结算了
    RESULT,
    //end了
    END,
    //断线了
    OFFLINE
}

@ccclass
export default class NNPlayer extends Player {

    @property(cc.Node)
    private nodeCards: cc.Node = undefined;

    @property(cc.Node)
    private nodeCardDesc: cc.Node = undefined;

    @property(cc.Sprite)
    private spriteCardDesc: cc.Sprite = undefined;

    @property(cc.Node)
    private nodeThinking: cc.Node = undefined;

    @property(cc.Sprite)
    private spDealerFrame: cc.Sprite = undefined;

    @property(cc.Sprite)
    private spBankerIcon: cc.Sprite = undefined;

    @property(cc.Sprite)
    private spPanel: cc.Sprite = undefined;

    @property([cc.SpriteFrame])
    private sfDealerFrame: cc.SpriteFrame[] = [];

    @property(cc.Node)
    private dealerEff: cc.Node = undefined;

    @property(cc.Node)
    private winEff: cc.Node = undefined;

    @property
    private spaceCard = -70;

    @property
    private spaceBull = -50;

    game: NNGame;
    private cards: NNCard[];
    grabVal: number;
    betVal: number;

    changeState(state: PlayerStates): void {
        this.state = state;

        this.updateThinkingMask(false);
        switch (state) {
            case PlayerStates.UNREADY:
                this.becomeDealer(false);
                this.clearCards();
                this.grabVal = undefined;
                this.betVal = undefined;
                this.lblGrabs.node.active = false;
                this.lblBets.node.active = false;
                this.nodeNoGrab.active = false;
                this.nodeCardDesc.active = false;
                this.dealerEff.active = false;
                this.winEff.active = false;
                break;
            case PlayerStates.GRABBING:
                this.updateThinkingMask(true);
                break;
            case PlayerStates.GRABBED:
                this.updateGrab(true);
                if (this.isMe) {
                    this.game.operation.hideGrab();
                }
                break;
            case PlayerStates.BETTING:
                if (!this.isDealer) {
                    this.updateGrab(false);
                    this.updateThinkingMask(true);
                }
                break;
            case PlayerStates.BETTED:
                if (!this.isDealer) {
                    this.updateBet(true);
                    if (this.isMe) {
                        this.game.operation.hideBet();
                    }
                }
                break;
        }
        this.updateLookerView();
    }

    protected onEnable() {
        this.initUI();
    }

    private initUI() {
        this.spriteAvatar.node.active = true;
        this.lblLocation.node.active = true;
        this.lblLocation.string = "";
        this.spriteBalanceIcon.node.active = false;
        this.lblBalance.node.active = true;
        this.lblBalance.string = "";
        this.nodeNoGrab.active = false;
        this.lblGrabs.node.active = false;
        this.lblBets.node.active = false;
        this.nodeCards.active = true;
        this.nodeCardDesc.active = false;
        this.nodeThinking.active = false;
        this.spDealerFrame.node.active = false;
        this.spBankerIcon.node.active = false;
        // this.spPanel.spriteFrame = this.sfDealerFrame[0];
        this.dealerEff.active = false;
        this.winEff.active = false;

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
        this.nodeCards.removeAllChildren(true);
        this.nodeCards.width = 0;
    }

    addCard(card: NNCard, doAnim = true, toLeft = false) {
        if (!this.cards || this.cards.length >= 5) {
            card.node.destroy();
            return;
        }
        this.cards.push(card);
        let nodeCard = card.node;
        let parent = nodeCard.parent;
        let nodeCards = this.nodeCards;

        let layout = nodeCards.getComponent(cc.Layout);
        layout.enabled = this.isMe;

        if (doAnim) {
            let posW = parent.convertToWorldSpaceAR(nodeCard.position);
            parent.removeChild(nodeCard);
            nodeCards.addChild(nodeCard);
            let pos = nodeCards.convertToNodeSpaceAR(posW);
            nodeCard.setPosition(pos);
            let duration = 0.5;
            nodeCard.runAction(
                cc.sequence(
                    cc.spawn(
                        cc.scaleTo(duration, 1),
                        Parabola.move(duration, nodeCard.position, this.getNewCardPos(nodeCard, toLeft ? 0 : undefined))
                    ),
                    cc.moveTo(0.2, this.getNewCardPos(nodeCard))
                )
            );
        } else {
            if (nodeCard.parent) {
                nodeCard.parent.removeChild(nodeCard);
            }
            nodeCards.addChild(nodeCard);
            nodeCard.scale = 1;
            nodeCard.setPosition(this.getNewCardPos(nodeCard));
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
                this.spBankerIcon.node.active = yeah
                // this.spPanel.spriteFrame = this.sfDealerFrame[this.isDealer ? 1 : 0];
            }
        } else {
            this.spBankerIcon.node.active = yeah
            // this.spPanel.spriteFrame = this.sfDealerFrame[this.isDealer ? 1 : 0];
        }
    }

    showDealerFrame(show: boolean) {
        if (show) {
            this.game.audioMgr.playDealerChoosing();
        }
        this.spDealerFrame.node.active = show;
    }

    showWinEff() {
        this.scheduleOnce(() => {
            if (!this.winEff.active) {
                this.game.playWinAnim(this.winEff);
            }
        }, 0.2);
    }

    updateThinkingMask(thinking: boolean) {
        if (this.isLooker) {
            return;
        }
        this.nodeThinking.active = thinking;
    }

    updateGrab(flag: boolean) {
        if (flag) {
            // this.lblBets.node.active = true;
            this.lblBets.node.active = false;
            this.lblGrabs.node.active = true;
            if (this.grabVal > 0) {
                this.lblGrabs.string = "";

                // let betNode = this.lblGrabs.node;
                // betNode.color = cc.hexToColor("#fff66b");
                // let outLine = betNode.getComponent(cc.LabelOutline);
                // outLine.color = cc.hexToColor("#9e470e");

                let descArray = ["不抢", "抢x1", "抢x2", "抢x3", "抢x4"];
                this.lblGrabs.string = descArray[this.grabVal];
            } else {
                this.lblGrabs.node.active = false;
                this.nodeNoGrab.active = true;
            }
        } else {
            // this.lblBets.node.active = false;
            this.lblGrabs.node.active = false;
        }
    }

    updateBet(flag: boolean) {
        if (flag) {
            this.lblBets.node.active = true;
            this.lblGrabs.node.active = false;
            this.nodeNoGrab.active = false;
            if (this.grabVal >= 0) {
                this.lblBets.string = "";

                // let betNode = this.lblBets.node;
                // betNode.color = cc.hexToColor("#AFFFFF");
                // let outLine = betNode.getComponent(cc.LabelOutline);
                // outLine.color = cc.hexToColor("#1F474E");

                this.lblBets.string = "x" + this.betVal;
            }
        } else {
            this.lblBets.node.active = false;
        }
    }

    isComplete() {
        return this.nodeCardDesc.active;
    }

    updateComplete(flag: boolean) {
        if (!flag) {
            this.nodeCardDesc.active = false;
            return;
        } else {
            this.nodeCardDesc.active = true;
            let layout = this.nodeCards.getComponent(cc.Layout);
            layout.enabled = true;
        }
    }

    showCard(cards: NNCard[], bullType: BullType, doAnim = true) {
        return new Promise(resolve => {
            this.clearCards();
            for (let c of cards) {
                this.addCard(c, false);
            }
            if (bullType === BullType.BullBoom) {
                let node = new cc.Node();
                node.width = 100;
                this.nodeCards.addChild(node);
                node.setSiblingIndex(4);
            } else if (bullType >= BullType.Bull1 && bullType <= BullType.DoubleBull) {
                let node = new cc.Node();
                node.width = 100;
                this.nodeCards.addChild(node);
                node.setSiblingIndex(3);
            }
            let layout = this.nodeCards.getComponent(cc.Layout);
            layout.enabled = true;

            this.nodeCardDesc.active = true;
            this.nodeCardDesc.y = this.nodeCards.y - 16;
            let nnBullTypeBg = this.nodeCardDesc.getComponent(cc.Sprite)
            if (bullType > 0) {
                nnBullTypeBg.spriteFrame = this.game.sfBullTypeBg[0]
            } else {
                nnBullTypeBg.spriteFrame = this.game.sfBullTypeBg[1]
            }
            this.spriteCardDesc.spriteFrame = this.game.sfBullType[bullType];

            let node = this.spriteCardDesc.node;
            if (doAnim) {
                node.scale = 5;
                node.runAction(cc.sequence(
                    cc.scaleTo(0.2, 1),
                    cc.delayTime(0.3),
                    cc.callFunc(resolve)
                ));
            } else {
                node.scale = 1;
                resolve();
            }
            if (bullType !== BullType.BullBoom && bullType !== BullType.BullMarble && bullType !== BullType.BullSmall) {
                this.game.audioMgr.playBull(bullType, this.isMale);
            }
        });
    }

    flyCoins(tar: NNPlayer) {
        let node = this.game.nodeCoinBox;
        let from = this.spriteAvatar.node;
        let to = tar.spriteAvatar.node;
        let fromPos = from.convertToWorldSpaceAR(cc.v2(0, 0));
        fromPos = node.convertToNodeSpaceAR(fromPos);
        let toPos = to.convertToWorldSpaceAR(cc.v2(0, 0));
        toPos = node.convertToNodeSpaceAR(toPos);
        let promises = [];
        this.game.audioMgr.playChips();
        for (let i = 0; i < 23; i++) {
            let p = new Promise(resolve => {
                setTimeout(() => {
                    if (!this.game || !this.game.isValid) {
                        resolve();
                        return;
                    }
                    let r = cc.randomMinus1To1() * 20;
                    let r1 = cc.randomMinus1To1() * 20;
                    let coin = this.game.getCoin();
                    node.addChild(coin);
                    coin.setPosition(fromPos.x + r1, fromPos.y + r);
                    coin.runAction(
                        cc.sequence(
                            Parabola.move((500 + r) / 1000, coin.position, cc.v2(toPos.x + r, toPos.y + r1)),
                            cc.callFunc(() => {
                                if (this.game && this.game.isValid) {
                                    this.game.retrieveCoin(coin);
                                } else {
                                    coin.destroy();
                                }
                                resolve();
                            })
                        )
                    );
                }, i * 30);
            });
            promises.push(p);
        }
        return Promise.all(promises);
    }

    updateLookerView() {
        if (this.isLooker) {
            this.node.opacity = 125;
        } else {
            this.node.opacity = 255;
        }
        this.spriteAvatar.node.opacity = 255;
    }
}
