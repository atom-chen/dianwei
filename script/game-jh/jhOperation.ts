import JHGame, { State, BetType } from "./jhGame";
import { div } from "../common/util";

const { ccclass, property } = cc._decorator;

enum OperationState {
    None,
    ShowNormal,
    NormalShowed,
    HideNormal,
    ShowRaise,
    RaiseShowed,
    HideRaise,
    ShowOver,
    OverShowed,
    HideOver
}

@ccclass
export default class JHOperation extends cc.Component {

    @property(cc.Node)
    private nodeNormal: cc.Node = undefined;

    @property(cc.Node)
    private nodeRaise: cc.Node = undefined;

    @property(cc.Node)
    private nodeSelectors: cc.Node = undefined;

    @property(cc.Node)
    private nodeOver: cc.Node = undefined;

    @property(cc.Button)
    private lookCards: cc.Button = undefined;

    @property(cc.Button)
    private discard: cc.Button = undefined;

    @property(cc.Button)
    private allIn: cc.Button = undefined;

    @property(cc.Button)
    private pk: cc.Button = undefined;

    @property(cc.Button)
    private raise: cc.Button = undefined;

    @property(cc.Button)
    private call: cc.Button = undefined;

    @property(cc.Toggle)
    private callToDie: cc.Toggle = undefined;

    @property(cc.Button)
    private overShow: cc.Button = undefined;

    @property(cc.Button)
    private btnHideRaise: cc.Button = undefined;

    @property([cc.Button])
    private raises: cc.Button[] = [];

    @property([cc.Sprite])
    private spPkSelector: cc.Sprite[] = [];

    game: JHGame;
    private state: OperationState;
    betType: BetType;
    roundCanAllIn: boolean;
    private showingPage: cc.Node;
    public forceChanllenge = false;
    private get rates() {
        return this.game && this.game.raiseRates || [];
    };

    init() {
        this.nodeNormal.active = false;
        this.nodeRaise.active = false;
        this.nodeOver.active = false;
        this.nodeSelectors.active = false;
        this.lookCards.node.active = false;
        this.callToDie.isChecked = false;

        let halfHeight = cc.winSize.height / 2;
        this.nodeNormal.setPosition(0, -halfHeight);
        this.nodeRaise.setPosition(0, -halfHeight);
        this.nodeOver.setPosition(0, -halfHeight);

        this.state = OperationState.None;
    }

    protected onLoad() {
        this.init();
    }

    updateLookCardsBtn(vis?: boolean) {
        if (!this.lookCards || !this.lookCards.isValid) {
            return;
        }
        let node = this.lookCards.node;
        if (vis === false) {
            node.active = false;
        } else {
            let me = this.game.playerMgr.me;
            if (me.isLooked || me.isLoser || this.game.gameState >= State.Result) {
                node.active = false;
            } else if (!me.isLooker && this.game.canLookCard) {
                node.active = true;
            }
        }
    }

    async showTurn() {
        let game = this.game;
        if (!game.amIInGame) {
            return;
        }
        this.updateTurns();
        Promise.all([this.hideRaise(), this.hideOver()]).then(() => {
            this.showNormal();
        })
    }

    hideTurn() {
        this.updateTurns();
        this.hideNormal();
        this.hideRaise();
    }

    private hidePage() {
        return new Promise(resolve => {
            if (!this.showingPage) {
                resolve();
                return;
            }
            let node = this.showingPage;
            node.stopAllActions();
            node.runAction(cc.sequence(
                cc.moveTo(0.03, cc.v2(0, -cc.winSize.height / 2)).easing(cc.easeCubicActionIn()),
                cc.callFunc(() => {
                    node.active = false;
                    resolve();
                })
            ));
        });
    }

    private showPage(node: cc.Node, overState: OperationState) {
        return new Promise(resolve => {
            node.active = true;
            node.stopAllActions();
            node.setPosition(0, -cc.winSize.height / 2);
            node.runAction(cc.sequence(
                cc.moveTo(0.03, cc.v2(0, 0)).easing(cc.easeCubicActionOut()),
                cc.callFunc(() => {
                    this.state = overState;
                    this.showingPage = node;
                    resolve();
                })
            ));
        });
    }

    updateTurns() {
        let game = this.game;
        let me = game.playerMgr.me;
        let inTurn = me.isTuring;
        if (inTurn) {
            this.allIn.node.active = true;
            this.setEnable(this.allIn, this.roundCanAllIn);
            this.setEnable(this.raise, game.canRaise);

            if (this.forceChanllenge) {
                if (me.balance == 0) {
                    this.hideNormal();
                    this.onClickPK();
                } else {
                    this.setEnable(this.allIn, true);
                    this.setEnable(this.pk, true);
                    this.setEnable(this.call, false);
                    this.setEnable(this.callToDie, false);
                }
            } else {
                if (game.lastBetType === BetType.AllIn || me.balance <= 0) {
                    this.setEnable(this.call, false);
                    this.setEnable(this.callToDie, false);
                    this.setEnable(this.pk, false);
                } else if (this.callToDie.isChecked == true){
                    this.setEnable(this.allIn, false);
                    this.setEnable(this.pk, false);
                    this.setEnable(this.call, false);
                    this.setEnable(this.raise, false);
                }else{
                    this.setEnable(this.call, true);
                    this.setEnable(this.callToDie, true);
                    this.setEnable(this.pk, game.canLookCard);
                }
            }


            this.setEnable(this.discard, !me.isAllIn);

            this.raises.forEach((btn, index) => {
                let amount = game.baseScore * this.rates[index + 1];
                btn.getComponentInChildren(cc.Label).string = amount.toString();
                if (amount <= game.curSingleBet || me.balance < amount) {
                    this.setEnable(btn, false);
                } else {
                    this.setEnable(btn, true);
                }
            });

            if (this.callToDie.isChecked) {
                if (game.lastBetType === BetType.AllIn) {
                    this.onClickAllIn();
                } else {
                    this.onClickCall();
                }
            }
        } else {
            this.allIn.node.active = true;
            this.setEnable(this.allIn, false);
            this.setEnable(this.pk, false);
            this.setEnable(this.call, false);
            this.setEnable(this.raise, false);
            if (game.lastBetType === BetType.AllIn) {
                this.setEnable(this.callToDie, false);
                this.setEnable(this.discard, false);
            }
        }
    }

    resetAllInAndDiscardBtnState() {
        this.setEnable(this.callToDie, true);
        this.setEnable(this.discard, true);
    }

    async showNormal() {
        let game = this.game;

        // let me = game.playerMgr.me;
        // if (!game.amIInGame || !me.isTuring) {
        //     cc.log("not in game");
        //     return;
        // }
        if (this.state === OperationState.ShowNormal || this.state === OperationState.NormalShowed) {
            return;
        }
        this.state = OperationState.ShowNormal;
        return this.showPage(this.nodeNormal, OperationState.NormalShowed);
    }

    async hideNormal() {
        let node = this.nodeNormal;
        if (!node.active) {
            return;
        }
        if (this.state === OperationState.HideNormal) {
            return;
        }
        this.state = OperationState.HideNormal;
        return this.hidePage();
    }

    async showRaise() {
        let game = this.game;
        if (this.state === OperationState.ShowRaise || this.state === OperationState.RaiseShowed) {
            return;
        }
        this.state = OperationState.ShowRaise;
        return this.showPage(this.nodeRaise, OperationState.RaiseShowed);
    }

    async hideRaise() {
        let node = this.nodeRaise;
        if (!node.active) {
            return;
        }
        if (this.state === OperationState.HideRaise) {
            return;
        }
        this.state = OperationState.HideRaise;
        return this.hidePage();
    }

    async showOver() {
        let game = this.game;
        let me = game.playerMgr.me;
        if (!me.isDiscarded) {
            return;
        }
        if (this.state === OperationState.ShowOver || this.state === OperationState.OverShowed) {
            return;
        }
        this.state = OperationState.ShowOver;
        return this.showPage(this.nodeOver, OperationState.OverShowed);
    }

    async hideOver() {
        let node = this.nodeOver;
        if (!node.active) {
            return;
        }
        if (this.state === OperationState.HideOver) {
            return;
        }
        this.state = OperationState.HideOver;
        return this.hidePage();
    }

    private setEnable(btn: cc.Component, enable: boolean) {
        if (btn instanceof cc.Toggle) {
            btn.enableAutoGrayEffect = false;
            if (!enable) {
                btn.uncheck();
            }
            btn.interactable = enable;
        } else if (btn instanceof cc.Button) {
            btn.interactable = enable;
            btn.enableAutoGrayEffect = false;
        }
        if (enable) {
            btn.node.active = true
            // btn.node.runAction(cc.fadeTo(0.2, 255));
        } else {
            btn.node.active = false
            // btn.node.runAction(cc.fadeTo(0.2, 77));
        }
    }

    private onClickDiscard() {
        window.pomelo.notify("game.JHHandler.discard", { round: this.game.round });
    }

    private onClickAllIn() {
        window.pomelo.notify("game.JHHandler.allIn", { round: this.game.round });
    }

    public onClickPK() {
        let gamer = this.game.playerMgr.gamer;
        if (gamer.length === 2) {
            for (let g of gamer) {
                if (!g.isMe) {
                    this.onChoosePKTarget(undefined, g.seat);
                    return;
                }
            }
        }
        this.setEnable(this.pk, false);
        this.nodeSelectors.active = true;
        this.updatePkSelector();
    }

    updatePkSelector() {
        this.spPkSelector.forEach((s, index) => {
            let p = this.game.playerMgr.getPlayerBySeat(index + 1);
            let node = s.node;
            let toActive = !!(p && p.uid && !p.isDiscarded && !p.isLoser && !p.isLooker);
            if (node.active !== toActive) {
                node.stopAllActions();
            }
            node.active = toActive;
            node.scale = 1;
            node.runAction(cc.sequence(
                cc.scaleTo(0.3, 1.5),
                cc.scaleTo(0.3, 1)
            ).repeatForever());
        });
    }

    updatePk() {
        this.setEnable(this.pk, true);
    }

    hidePKView() {
        this.nodeSelectors.active = false;
    }

    private onChoosePKTarget(btn: cc.Button, seat: number) {
        this.hidePKView();
        window.pomelo.notify("game.JHHandler.challenge", { round: this.game.round, rPos: this.game.playerMgr.getPlayerBySeat(seat).serverPos });
    }

    private doBet(index: number) {
        window.pomelo.notify("game.JHHandler.doBet", { round: this.game.round, betIndex: index });
    }

    private onClickRaise() {
        this.hideNormal().then(() => {
            this.showRaise();
        });
    }

    private onClickCall() {
        let mul = div(this.game.curSingleBet, this.game.baseScore).toNumber();
        let index = this.rates.indexOf(mul) || 0;

        let balanceEnough = true;
        let me = this.game.playerMgr.me;
        if (me.isLooked) {
            if (me.balance < mul * 2) {
                balanceEnough = false;
            }
        } else {
            if (me.balance < mul) {
                balanceEnough = false;
            }
        }

        if (balanceEnough) {
            this.doBet(index);
        } else {
            this.onClickAllIn();
        }
    }

    private onCheckCallToDie(tog: cc.Toggle) {
        let me = this.game.playerMgr.me;
        if (!me || me.isLooker) {
            cc.warn("should not check");
            return;
        }
        if (me.isTuring && tog.isChecked) {
            this.onClickCall();
        }
    }

    private onClickLookCard() {
        window.pomelo.notify("game.JHHandler.faceUp", { round: this.game.round });
    }

    private onClickHideRaise() {
        this.hideRaise().then(() => {
            this.showNormal();
        });
    }

    private onClickRaiseAmount(btn: cc.Button, index: number) {
        this.doBet(index);
    }

    private onClickOverShow() {
        let me = this.game.playerMgr.me;
        this.game.msg.sendShowCard();
        this.hideOver();
    }
}
