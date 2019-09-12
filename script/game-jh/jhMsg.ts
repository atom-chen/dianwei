import GameMsg from "../game-share/gameMsg";
import JHGame, { State, BetType, CardTypes } from "./jhGame";
import { PlayerStates } from "../game-share/player";
import JHPlayer, { JHAction } from "./jhPlayer";
import { User } from "../common/user";
import { Rune } from "../game-share/pokerCard";
import { add } from "../common/util";
interface GamerInfo {
    isFaceUp: number;
    job: number;
    latestBetType?: number;
    rPos: number;
    remainBetPoints: string;
    totalBetPoints: string;
    isWinner?: number;
    cardType?: number;
    cardRunes?: Rune[];
}

interface RoundData {
    round: number;
    state?: State;
    roundCanAllIn?: number;
}


interface ResultGamerInfo {
    rPos: number;
    tax: string;
    postTaxEarn: string;
    money: string;
    score: string;
    isWinner: number;
}

interface ResultGamerRunes {
    rPos: number;
    isWinner: number;
    cardType: number;
    cardRunes?: Rune[];
}

interface ResultData {
    isSingleNotify: number;
    gamerInfos?: ResultGamerInfo[];
    visibleRunes?: ResultGamerRunes[];
    isResultingBySys: number;
}

interface CurrentGamerInfo {
    rPos: number;
    job: number;
    totalBetPoints: string;
    remainBetPoints: string;
    isFaceUp: number;
    latestBetType?: number;
    isWinner?: number;
    cardType?: number;
    cardRunes?: Rune[];
    money?: string; // 结算阶段用这个
    score?: string; // 结算阶段用这个
}

interface CurrentGameInfo {
    state: number;
    timer: number;
    round: number;
    currentBets: string;
    totalBets: string;
    magicSymbol: number;
    turnState: number;
    turnStateTimer: number;
    currRPos: number;
    currForceChallenge?: number;
    roundCanAllIn: number;
    hasGamerAllIn: number;
    gamerInfo?: CurrentGamerInfo[];
}

export default class JHMsg extends GameMsg {
    loadGameHandler = "game.JHHandler.loadGameInfo";
    notifyCurrentGame = "jhNotifyCurrentGameInfo";
    protected game: JHGame;
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
        this.listen("jhGamePhaseChange", this.handlePhaseChange);
        this.listen("jhNotifyBets", this.handleBetsInfo);
        this.listen("jhBankerAndMagicBroadcast", this.handleBankerAndMagic);
        this.listen("jhNotifyRound", this.handleNotifyRound);
        this.listen("jhTurnStartBroadcast", this.handleTurnStart);
        this.listen("jhDoBetBroadcast", this.handleDoBet);
        this.listen("jhNotifyCards", this.handleNotifyCards);
        this.listen("jhFaceUpBroadcast", this.handleLook);
        this.listen("jhChallengeBroadcast", this.handlePK);
        this.listen("jhChallengeFail", this.handlePKFail);
        this.listen("jhDiscardBroadcast", this.handleDiscard);
        this.listen("jhNotifyResult", this.handleGameResult);
        this.listen("jhShowCardsBroadcast", this.handleShowCards);
        this.listen("jhPaybackBroadcast", this.handlePayback);
        this.listen("jhNotifyGamerInfos", this.handleGamerInfos);
    }

    protected removeExtraListeners(): void {
        this.events.forEach(e => {
            window.pomelo.off(e);
        });
    }

    private getPlayer(rPos: number) {
        return this.game.playerMgr.getPlayerByServerPos(rPos);
    }

    private handleLook(data: { rPos: number }) {
        let game = this.game;
        let p = this.getPlayer(data.rPos);
        if (!p) {
            cc.warn("no one look cards");
            return;
        }
        game.audioMgr.noticeLookCard(p.isMale);
        p.isLooked = true;
        if (p.isMe) {
            game.operation.updateLookCardsBtn();
        } else {
            p.showFanCards();
            p.updateLooked();
        }
    }

    handleNotifyCards(data: {
        cardType: number,
        cardRunes?: Rune[];
    }) {
        if (!data.cardRunes) {
            cc.warn("notify your cards without data");
            return;
        }
        let me = this.game.playerMgr.me;
        if (!me) {
            cc.warn("no me, no cards");
            return;
        }
        if (me.isLooked) {
            return;
        }
        this.showCards(me, data.cardType, data.cardRunes);
        this.game.operation.updateLookCardsBtn();
    }

    private async showCards(p: JHPlayer, cardType: number, cardRunes?: Rune[]) {
        if (!cardRunes) {
            cc.warn("show card without cards");
            return;
        }
        if (p.isMe && p.isLooked) {
            return;
        }
        let promises = [];
        p.isLooked = true;
        p.showCardType(cardType);
        if (!p.isLooker || !p.isMe) {
            p.clearCards();
        }
        for (let i = 0; i < cardRunes.length; i++) {
            let r = cardRunes[i];
            promises.push(p.addCards(i, r.rune, r.pretendRune, false));
        }
        let cards = await Promise.all(promises);
        return Promise.all(cards.map(c => p.turnCard(c)));
    }

    private async handleShowCards(data: {
        rPos: number,
        cardType: number,
        cardRunes?: Rune[];
    }) {
        if (!data.cardRunes) {
            cc.warn("show card without cards");
            return false;
        }
        let p = this.getPlayer(data.rPos);
        if (!p || !p.uid) {
            cc.warn("p is not in game");
            return false;
        }
        try {
            await this.showCards(p, data.cardType, data.cardRunes);
        } catch (error) {
            cc.warn("show cards: %o", error);
            return false;
        }
        return true;
    }

    private handlePKFail(data: { rPos: number }) {
        let p = this.getPlayer(data.rPos);
        if (p && p.isMe) {
            this.game.operation.updatePk();
        }
    }

    private handlePK(data: {
        crPos: number;
        drPos: number;
        win: number;
    }) {
        this.game.pk.showPk(data.crPos, data.drPos, !!data.win);
    }

    private handleDoBet(data: {
        rPos: number;
        betType: number;
        betPoints: string;
        totalBetPoints: string;
        remainBetPoints: string;
    }) {
        let p = this.getPlayer(data.rPos);
        if (p) {
            this.game.lastBetType = data.betType;
            p.doBet(data.betType, data.betPoints, data.totalBetPoints, data.remainBetPoints);
        }
    }

    private handleBankerAndMagic(data: { rPos: number; symbol?: number }) {
        let p = this.getPlayer(data.rPos);
        if (!p) {
            cc.warn("no dealer choose");
            return;
        }
        p.becomeDealer();
        if (data.symbol === undefined || data.symbol <= 0) {
            return;
        }
        this.game.playAnimJoker(data.symbol);
    }

    private handleDiscard(data: { rPos: number }) {
        let p = this.getPlayer(data.rPos);
        if (!p) {
            cc.warn("no player discard");
            return;
        }
        p.discard();
        this.game.operation.updatePkSelector();
    }

    private handlePhaseChange(data: { state: number, timer: number/*ms*/ }) {
        let game = this.game;
        game.gameState = data.state;
        switch (data.state + 1) {
            case State.Start:
                break;
            case State.ChooseBankerAndMagic:
                break;
            case State.Dealing:
                game.playerMgr.drawFakeCards();
                break;
            case State.Turning:
                break;
            case State.Balancing:
                game.operation.hideTurn();
                break;
            case State.WaitResult:
                break;
            case State.Result:
                break;
            case State.End:
                break;
        }
    }

    private async handleGameResult(data: ResultData) {
        let game = this.game;
        let operation = game.operation;
        let playerMgr = game.playerMgr;
        operation.hideTurn();
        game.info.updateBlindIcon();
        if (!data.isSingleNotify) playerMgr.hideLooked();
        playerMgr.endTurn();
        game.audioMgr.playAllIn(false);
        this.game.showOrHideAllInParticle(false);

        await this.finalShowCards(!!data.isSingleNotify, !!data.isResultingBySys, data.visibleRunes);
        if (data.gamerInfos && data.gamerInfos.length > 0) {
            await this.finalShowWinAnim(data.gamerInfos);
            if (!this || !this.game || !this.game.isValid) {
                return;
            }
            // this.game.totalBets = undefined;
            this.game.info.updateBetsPool();
            await this.collectChips(data.gamerInfos);
            if (!this || !this.game || !this.game.isValid) {
                return;
            }
            if (!data.isSingleNotify) {
                await this.showEarn(data.gamerInfos);
                if (!this || !this.game || !this.game.isValid) {
                    return;
                }
            }
        }
    }

    private async showEarn(gamer: ResultGamerInfo[]) {
        let promises = [];
        for (let g of gamer) {
            if (!g.isWinner) {
                continue;
            }
            let p = this.getPlayer(g.rPos);
            if (typeof p.balance === "number") {
                p.balance = add(p.balance, g.postTaxEarn).toNumber();
            }
            let tax = g.tax;
            if (isNaN(+tax) || +tax <= 0) {
                tax = "";
            } else {
                tax = "税-" + tax;
            }
            promises.push(p.showGetAndLost({ get: "+" + g.postTaxEarn, lost: tax }));
        }
        await Promise.all(promises);
    }

    private async collectChips(gamer: ResultGamerInfo[]) {
        let totalWinner = 0;
        for (let g of gamer) {
            if (g.isWinner) {
                totalWinner++;
            }
        }
        let promises = [];
        for (let g of gamer) {
            if (totalWinner <= 0) {
                break;
            }
            if (!g.isWinner) {
                continue;
            }
            let p = this.getPlayer(g.rPos);
            if (!p) {
                continue;
            }
            promises.push(p.gainChips(totalWinner));
            totalWinner--;
        }
        if (promises.length > 0) {
            await Promise.all(promises);
        }
    }

    private async finalShowWinAnim(gamer: ResultGamerInfo[]) {
        for (let g of gamer) {
            let p = this.getPlayer(g.rPos);
            if (!p || !p.isMe || !g.isWinner) {
                continue;
            }
            await this.game.playAnimWin();
        }
    }

    private async finalShowCards(isSingle: boolean, isSysResult: boolean, runes?: ResultGamerRunes[]) {
        if (isSingle) {
            //普通亮手牌
            // await new Promise(resolve => {
            //     setTimeout(resolve, 2000);
            // });
            let promises = [];
            for (let rune of runes) {
                promises.push(this.handleShowCards(rune));
            }
            await Promise.all(promises);
            return;
        }
        if (!runes) {
            return;
        }
        if (isSysResult) {
            await this.game.pk.showFinalPk();
        }
        let promises = [];
        for (let r of runes) {
            let p = this.getPlayer(r.rPos);
            if (p.isMe && p.isDiscarded) {
                continue;
            }
            if (isSysResult) {
                await this.handleShowCards(r);
            } else {
                promises.push(this.handleShowCards(r));
            }
        }
        if (promises.length > 0) {
            await Promise.all(promises);
        }
        return;
    }

    private handleTurnStart(data: { rPos: number, timer: number/*second*/, forceChallenge: number }) {
        let p = this.getPlayer(data.rPos);
        if (p) {
            if (p.isMe) {
                this.game.operation.forceChanllenge = data.forceChallenge == 1 ? true : false;
                // this.game.operation.hideNormal();
            }
            p.startTurn(data.timer);
        } else {
            cc.error("handleTurnStart err ", data);
        }
    }

    private handleBetsInfo(data: { currentBets: string, totalBets: string }) {
        this.game.curSingleBet = +data.currentBets;
        this.game.totalBets = +data.totalBets;
        this.game.refreshRoomInfo();
    }

    private handleNotifyRound(data: RoundData) {
        let game = this.game;
        game.round = data.round;
        game.info.updateRound();
        game.operation.updateLookCardsBtn(!data.state || data.state < State.Result);
        game.info.updateBlindIcon();
        game.operation.showTurn();
        game.operation.roundCanAllIn = !!data.roundCanAllIn;
    }

    protected handleCurrentGameInfo(data: CurrentGameInfo): any {
        super.handleCurrentGameInfo(data);

        let game = this.game;
        game.playerMgr.gamer.forEach(g => {
            g.isDiscarded = true;
            g.updateLookerView();
        });
        if (data.gamerInfo && data.gamerInfo.length > 0) {
            for (let gmr of data.gamerInfo) {
                let p = this.getPlayer(gmr.rPos);
                if (!p) {
                    continue;
                }
                p.isDiscarded = false;
                p.changeState(PlayerStates.STARTED);
                p.updateLookerView();
                p.becomeDealer(gmr.job === 1, true);
                let remain = gmr.money !== undefined ? gmr.money : gmr.remainBetPoints;
                p.setBets(gmr.totalBetPoints);
                p.balance = !isNaN(+remain) && +remain;
                p.updateBalance();
                p.updateBets();
                if (data.state + 1 < State.Balancing && gmr.rPos !== data.currRPos) {
                    let action;
                    switch (gmr.latestBetType) {
                        case BetType.AllIn:
                            action = JHAction.AllIn;
                            break;
                        case BetType.Call:
                            action = JHAction.Call;
                            break;
                        case BetType.Raise:
                            action = JHAction.Raise;
                            break;
                    }
                    p.showAction(action, false);
                }
                p.isLooked = !!gmr.isFaceUp;
                if (gmr.cardRunes && gmr.cardRunes.length === 3) {
                    if (p.isMe) {
                        p.isLooked = true;
                    }
                    for (let i = 0; i < gmr.cardRunes.length; i++) {
                        let r = gmr.cardRunes[i];
                        p.addCards(i, r.rune, r.pretendRune, false).then(card => {
                            p.turnCard(card, true, false);
                        });
                    }
                    p.cardType = gmr.cardType;
                    p.updateCardType(true);
                    if (p.isMe) {
                        game.operation.updateLookCardsBtn();
                    }
                } else {
                    if (data.state + 1 >= State.Dealing) {
                        for (let i = 0; i < 3; i++) {
                            p.addCards(i, 0, 0, false);
                        }
                    }
                }
                if (p.isMe || !p.isLooked) {
                    continue;
                }
                p.updateLooked();
                p.showFanCards();
            }
        }
        game.lastBetType = data.hasGamerAllIn ? BetType.AllIn : BetType.Call;
        game.curSingleBet = +data.currentBets;
        game.totalBets = +data.totalBets;
        game.addChips(+data.totalBets);
        game.info.updateBetsPool();
        game.magicSymbol = data.magicSymbol;
        if (game.magicSymbol > 0) {
            //let c = game.genCardByVal(game.magicSymbol);

        }
        this.handleNotifyRound(data);
        game.changeState(data.state + 1);
        if (game.gameState > State.Dealing) {
            this.handlePhaseChange(data);
        }

        if (data.turnState && data.turnState === 1) {
            let args = { rPos: data.currRPos, timer: data.turnStateTimer, forceChallenge: data.currForceChallenge | 0 };
            this.handleTurnStart(args);
        }

        //显示等待提示
        let me = this.game.playerMgr.me;
        if (User.instance.where == undefined && data.state > State.Start && me.state < PlayerStates.READY) {
            this.game.showWaitTips();
        }
        User.instance.where = undefined;
    }


    handleGamerInfos(data: any) {
        function isInData(rpos: number): boolean {
            if (data && data.gamerRPos) {
                for (let i = 0; i < data.gamerRPos.length; i++) {
                    if (rpos == data.gamerRPos[i]) {
                        return true;
                    }
                }
            }
            return false;
        }
        this.game.playerMgr.gamer.forEach(g => {
            if (!isInData(g.serverPos)) {
                g.state = PlayerStates.UNREADY;
            }
        });
    }

    handlePayback(data: {
        rPos: number;
        paybackBetPoints: string;
        totalBetPoints: string;
        remainBetPoints: string
    }): any {
        let game = this.game;
        let p = game.playerMgr.getPlayerByServerPos(data.rPos);
        if (p) {
            p.setBets(data.totalBetPoints);
            p.updateBets();
            p.balance = +data.remainBetPoints;
            p.updateBalance();
        }
    }

    sendShowCard() {
        window.pomelo.notify("game.JHHandler.showCards", {});
    }
}