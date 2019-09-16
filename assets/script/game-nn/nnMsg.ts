import GameMsg from "../game-share/gameMsg";
import NNGame, { GameState, BullType } from "./nnGame";
import { PlayerStates } from "./nnPlayer";
import { Rune } from "../game-share/pokerCard";
import NNCard from "./nnCard";
import { User } from "../common/user";
interface ResultData {
    result?: {
        rPos: number;
        job: number;
        bankPoint: number;
        betPoint: number;
        bullType: number;
        earned: string;
        tax: string;
        cardRunes?: Rune[];
        score: string;
        money: string;
    }[];
    bankerPoint: number;
}

export default class NNMsg extends GameMsg {
    loadGameHandler = "game.NNHandler.loadGameInfo";
    notifyCurrentGame = "nnNotifyCurrentGameInfo";

    protected game: NNGame;
    private _events: string[];
    get events() {
        if (!this._events) {
            this._events = [];
        }
        return this._events;
    }

    private listen(event: string, func: Function) {
        let p = window.pomelo;
        p.on(event, func.bind(this));
        this.events.push(event);
    }

    protected addExtraListeners(): void {
        this.listen("nnGamePhaseChange", this.handlePhaseChange);
        this.listen("nnDealCards", this.handleDeal);
        this.listen("nnDoBankBroadcast", this.handleGrabDealer);
        this.listen("nnAppointBanker", this.handleShowDealer);
        this.listen("nnDoBetBroadcast", this.handleBet);
        this.listen("nnBroadcastAllBetInfos", this.handleAllBet);
        this.listen("nnNotifyBullResult", this.handleBullResult);
        this.listen("nnDoHandoutBroadcast", this.handleCalculateFinish);
        this.listen("nnDoResultBroadcast", this.handleResult);
    }
    protected removeExtraListeners(): void {
        this.events.forEach(e => {
            window.pomelo.off(e);
        });
    }

    private getPlayer(rPos: number) {
        return this.game.playerMgr.getPlayerByServerPos(rPos);
    }

    private _showForLooker = true;
    private _showForLookerLast = true;

    //抢庄牛牛，1开始，2发牌，3抢庄，4抢庄结果，5下注结果，6发牌，7开牌，8写数据库，9结算，10结算完end
    private handlePhaseChange(data: { state: number; timer: number }, isReconnect = false) {
        cc.warn("state============" + data.state);
        let game = this.game;
        let playerMgr = game.playerMgr;
        let me = playerMgr.me;

        let state = data.state + 1 as GameState;
        game.changeState(state);
        //发牌和结算前阶段都需给旁观者补其他玩家的手牌，//自己是旁观者，不会收到发牌消息，模拟一个
        //补4张
        if (state >= GameState.InitCardDeal && state < GameState.Balance) {
            if (me.isLooker && this._showForLooker) {
                this._showForLooker = false;
                let args = { cardRunes: [0, 0, 0, 0] };
                if (state === GameState.InitCardDeal) {
                    this.handleDeal(args);
                } else {
                    this.handleDeal(args, false);
                }
            }
        }
        //补1张
        if (state >= GameState.DealLast && state < GameState.Balance) {
            if (me.isLooker && this._showForLookerLast) {
                this._showForLookerLast = false;
                let args = { cardRunes: [0] };
                if (state === GameState.DealLast && !isReconnect) {
                    this.handleDeal(args);
                } else {
                    this.handleDeal(args, false);
                }
            }
        }
        switch (state) {
            case GameState.Start:
                this._showForLooker = true;
                this._showForLookerLast = true;
                //roomdata消息中没有开始游戏，所以不会请求currentgameinfo，然后马上收到startgame，但自己是旁观，所以在这里再判断一次
                if (User.instance.where == undefined && me.state < PlayerStates.READY) {
                    this.game.showWaitTips();
                }
                break;
            case GameState.GrabDealer:
                if (!me.isLooker) {
                    //显示时钟
                    game.showTicker(data.timer);
                }
                playerMgr.changeGamerState(PlayerStates.GRABBING);
                break;

            case GameState.ShowDealer:
                //隐藏时钟
                game.hideTicker();
                break;

            case GameState.DoBet:
                if (!me.isLooker) {
                    //显示时钟
                    game.showTicker(data.timer);
                }
                playerMgr.changeGamerState(PlayerStates.BETTING);
                break;

            case GameState.DealLast:
                //隐藏时钟
                game.hideTicker();
                break;

            case GameState.BullCalculate:
                //强制show，防止动画未完成，calculate 类要用到这些图片改变 Y 值
                if (!me.isLooker) {
                    //显示时钟
                    game.showTicker(data.timer);
                    game.dock.showCalculate();
                    // me.showBigCards(Card.F);
                }
                break;

            case GameState.Result:
                //隐藏时钟
                game.hideTicker();
                game.dock.hideCalculate();
                break;

            case GameState.End:
                this._showForLooker = true;
                break;
        }
    }

    protected handleCurrentGameInfo(data: {
        state: number;
        timer: number;
        bankerPoint: number;
        gamerInfo?: {
            rPos: number;
            job: number;
            bankPoint: number;
            betPoint: number;
            isHandouted: number;
            bullType?: number;
            cardRunes?: Rune[];
        }[];
    }) {
        if (!data || !data.state) {
            cc.warn("no game info");
            return;
        }
        super.handleCurrentGameInfo(data);

        this.game.dealerMultiple = data.bankerPoint;
        if (data.gamerInfo) {
            for (let gmr of data.gamerInfo) {
                let p = this.getPlayer(gmr.rPos);
                if (!p) {
                    continue;
                }
                p.changeState(PlayerStates.READY);
                if (gmr.job === 1) {
                    p.becomeDealer(true, false);
                }
            }
        }

        if (data.state < GameState.Balance && data.gamerInfo) {
            for (let gmr of data.gamerInfo) {
                if (gmr.cardRunes && gmr.cardRunes.length > 0) {
                    let cards = [];
                    for (let r of gmr.cardRunes) {
                        cards.push(r.rune);
                    }
                    this.handleDeal({ cardRunes: cards }, false);
                }
                if (gmr.bullType !== undefined) {
                    this.handleBullResult({ bullType: gmr.bullType, cardRunes: gmr.cardRunes });
                }
            }
        }

        this.handlePhaseChange(data, true);

        if (data.gamerInfo) {
            //抢庄值
            if (data.state >= GameState.GrabDealer) {
                for (let gmr of data.gamerInfo) {
                    if (gmr.bankPoint !== -1) {
                        this.handleGrabDealer(gmr);
                    }
                }
            }
            //押注值
            if (data.state >= GameState.DoBet) {
                for (let gmr of data.gamerInfo) {
                    if (gmr.betPoint !== 0) {
                        this.handleBet(gmr);
                    }
                }
            }

            //计算完成
            if (data.state < GameState.Balance) {
                for (let gmr of data.gamerInfo) {
                }
            }

            //结算亮牌
            if (data.state >= GameState.Balance) {
                //展示玩家手牌
                this.showHandCards(data.gamerInfo, false);
            }
        }
        //显示等待提示
        let me = this.game.playerMgr.me;
        if (User.instance.where == undefined && data.state >= GameState.Waiting && me.state < PlayerStates.READY) {
            this.game.showWaitTips();
        }
    }

    private async handleDeal(data: { cardRunes: number[] }, doAni = true) {
        let game = this.game;
        let playerMgr = game.playerMgr;
        //发4张牌
        if (data.cardRunes.length !== 1) {
            for (let p of game.playerMgr.gamer) {
                if (p.isMe) {
                    game.dealCards(p, data.cardRunes, doAni);
                } else {
                    let cards = [];
                    for (let i = 0; i < data.cardRunes.length; i++) {
                        cards.push(0);
                    }
                    game.dealCards(p, cards, doAni);
                }
                if (doAni) {
                    await new Promise(resolve => setTimeout(resolve, 150));
                }
            }
        }
        //发最后一张牌
        else {
            for (let p of game.playerMgr.gamer) {
                if (p.isMe) {
                    let card = this.game.genCardByVal(data.cardRunes[0]);
                    game.dealCard(p, card, doAni);
                } else {
                    let card = this.game.genCardByVal(0);
                    game.dealCard(p, card, doAni);
                }
                if (doAni) {
                    await new Promise(resolve => setTimeout(resolve, 150));
                }
            }
        }
    }

    private handleGrabDealer(data: {
        rPos: number;
        bankPoint: number;
    }) {
        let p = this.getPlayer(data.rPos);
        if (!p) {
            cc.warn("no body grab dealer");
            return;
        }
        p.grabVal = data.bankPoint;
        p.changeState(PlayerStates.GRABBED);
    }

    private handleShowDealer(data: {
        gamers?: {
            rPos: number;
            bankPoint: number;
            job: number
        }[];
        bankerPoint: number;
    }) {
        this.game.dealerMultiple = data.bankerPoint;
        if (!data.gamers) {
            return;
        }
        let dealer, dealerPos, dealerPoint;
        for (let gmr of data.gamers) {
            let p = this.getPlayer(gmr.rPos);
            if (!p) continue;
            p.grabVal = gmr.bankPoint;
            p.changeState(PlayerStates.GRABBED);
            if (gmr.job) {
                dealer = p;
                dealerPos = gmr.rPos;
                dealerPoint = gmr.bankPoint;
            }
        }
        if (!dealer) {
            return;
        }
        dealer.isDealer = true;
        // 选庄动画
        let dealerGrabs = [];
        for (let d of data.gamers) {
            if (d.bankPoint !== dealerPoint) continue;
            let p = this.getPlayer(d.rPos);
            if (!p || p.isLooker) continue;
            dealerGrabs.push(p);
        }
        if (dealerGrabs.length > 1) {
            this.game.chooseDealer(dealer, dealerGrabs);
        } else {
            dealer.becomeDealer(true);
        }
    }

    private handleBet(data: {
        rPos: number;
        betPoint: number;
    }) {
        let p = this.getPlayer(data.rPos);
        if (!p) {
            cc.warn("no body grab dealer");
            return;
        }
        p.betVal = data.betPoint;
        p.changeState(PlayerStates.BETTED);
        this.game.audioMgr.playBet();
    }

    private handleAllBet(data: {
        betInfos?: {
            rPos: number;
            betPoint: number;
        }[]
    }) {
        if (!data.betInfos) {
            return;
        }
        for (let info of data.betInfos) {
            let p = this.getPlayer(info.rPos);
            if (!p) continue;
            p.betVal = info.betPoint;
            p.changeState(PlayerStates.BETTED);
        }
    }

    private handleBullResult(data: { bullType: number; cardRunes: Rune[] }) {
        this.game.dock.bullType = data.bullType;
        let dock = this.game.dock;
        data.cardRunes.forEach((v, i) => {
            if (v.pretendRune) {
                dock.replaceCard(i, this.game.genCardByVal(v.rune, v.pretendRune));
            }
        });
    }

    private handleCalculateFinish(data: { rPos: number, bullType: number, cardRunes: Rune[] }) {
        // if (this.game.gameState > GameState.BullCalculate) {
        //     return;
        // }
        this.finishCalculate(data.rPos, data.bullType, data.cardRunes);
    }

    private async finishCalculate(rPos: number, bullType: number, cardRunes: Rune[]) {
        let p = this.getPlayer(rPos);
        if (!p) return;
        if (p.isMe) {
            this.game.dock.hideCalculate();
        }

        let cards = [];
        for (let r of cardRunes) {
            let card = this.game.genCardByVal(r.rune, r.pretendRune);
            cards.push(card);
        }
        await p.showCard(cards, bullType, true);
        p.updateComplete(true);
    }

    private async handleResult(data: ResultData) {
        let me = this.game.playerMgr.me;
        if (me && !me.isLooker) {
            for (let ret of data.result) {
                let p = this.game.playerMgr.getPlayerByServerPos(ret.rPos);
                if (p && p.isMe && !p.isComplete()) {
                    this.finishCalculate(ret.rPos, ret.bullType, ret.cardRunes);
                }
            }
        }

        await this.showHandCards(data.result, false);
        await new Promise(resolve => {
            this.game.scheduleOnce(() => {
                resolve();
            }, 1.5);
        });

        let winners = [];
        let losers = [];
        //分别统计输赢人数
        let meWin = true;
        let dealer;
        for (let ret of data.result) {
            let p = this.getPlayer(ret.rPos);
            if (!p) continue;
            if (ret.job) {
                dealer = p;
            }
            //牌型
            if (p.isMe) {
                if (+ret.earned >= 0) {
                    meWin = true;
                } else {
                    meWin = false;
                }
            }
            if (p && !p.isDealer) {
                if (+ret.earned > 0) {
                    winners.push(ret);
                } else {
                    losers.push(ret);
                }
            }
        }
        if (me && !me.isLooker) {
            if (meWin) {
                if (me.isDealer && winners.length === 0 && losers.length >= 3) {
                    await this.game.playAnimWinAll();
                } else {
                    await this.game.playAnimWin();
                }
            } else {
                await this.game.playAnimLose();
            }
        }
        if (dealer) {
            let loseCoins = [];
            for (let ret of losers) {
                let p = this.getPlayer(ret.rPos);
                if (!isNaN(+ret.earned) && +ret.earned < 0) {
                    loseCoins.push(p.flyCoins(dealer));
                    dealer.showWinEff();
                }
            }
            await Promise.all(loseCoins);
            let winCoins = [];
            for (let ret of winners) {
                let p = this.getPlayer(ret.rPos);
                p.showWinEff();
                if (!isNaN(+ret.earned) && +ret.earned > 0) {
                    winCoins.push(dealer.flyCoins(p));
                }
            }
            await Promise.all(winCoins);
            let scores = [];
            for (let ret of data.result) {
                let p = this.getPlayer(ret.rPos);
                if (!p) continue;
                if (!isNaN(+ret.earned)) {
                    let win = +ret.earned >= 0;
                    let data: { get?: string, lost?: string };
                    if (win) {
                        data = {
                            get: "+" + ret.earned,
                            lost: +ret.tax > 0 ? "税-" + ret.tax : ""
                        }
                    } else {
                        data = {
                            lost: ret.earned
                        }
                    }
                    scores.push(p.showGetAndLost(data));
                    p.updateMoney(ret.money);
                    p.updateBalance();
                }
            }
            await Promise.all(scores);
            for (let ret of data.result) {
                let p = this.getPlayer(ret.rPos);
                let type = ret.bullType;

                if (type >= BullType.BullBoom) {
                    this.game.audioMgr.playBull(type, p.isMale);
                }
                if (type === BullType.BullBoom) {
                    await this.game.playAnimBullBoom(ret.cardRunes);
                } else if (type === BullType.BullMarble) {
                    await this.game.playAnimBullMarble(ret.cardRunes);
                } else if (type === BullType.BullSmall) {
                    await this.game.playAnimBullSmall(ret.cardRunes);
                }
            }
        }
    }

    private async showHandCards(data: {
        job: number;
        bullType?: number;
        rPos: number;
        cardRunes?: Rune[];
    }[], doAni = false) {
        if (!data) {
            cc.warn("no handCard data");
            return;
        }
        let result = data.slice();
        result.sort((a, b) => {
            let ret = a.job - b.job;
            if (ret !== 0) {
                return ret;
            }
            return (a.bullType || -1) - (b.bullType || -1);
        });
        for (let ret of result) {
            let p = this.getPlayer(ret.rPos);
            if (p.isComplete()) {
                continue;
            }
            let cards = [];
            for (let r of ret.cardRunes) {
                let card = this.game.genCardByVal(r.rune, r.pretendRune);
                cards.push(card);
            }
            await p.showCard(cards, ret.bullType, doAni);
        }
    }

    sendBet(val: number) {
        window.pomelo.notify("game.NNHandler.doBet", { betPoint: val });
    }

    sendGrab(val: number) {
        window.pomelo.notify("game.NNHandler.doBank", { bankPoint: val });
    }

    //计算完成
    sendFinish() {
        window.pomelo.notify("game.NNHandler.doResult", {});
    }
}