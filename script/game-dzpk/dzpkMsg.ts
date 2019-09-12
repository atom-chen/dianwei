import GameMsg from "../game-share/gameMsg";
import DZPKGame, { DZPKGameStatus, State } from "./dzpkGame";
import { BetType } from "./dzpkPlayer";
import { User } from "../common/user";
import { PlayerStates } from "../game-share/player";
import { PlayerInfo } from "../game-share/game";
import * as util from "../common/util";
type cardsRuneIndexInfo = {
    index: number;
    rune: number;
}

type playerCardsRune = {
    rPos: number;
    cardRunes: cardsRuneIndexInfo[];
}
interface curGameInfo {
    status: DZPKGameStatus; // 游戏状态
    leftTime?: number; // 当前回合时间，只有 turnState 为 Turning 时有效
    curOptUser?: number; // 当前回合人
    curRoundMaxBets: string;  // 当前回合已经下了的 最大下注
    commonCards?: number[]; // 公共牌
    totalBets?: string; // 房间总下注
    pools: number[];

    userInfo: {
        rPos: number; // 玩家号
        money?: string; // 玩家剩余筹码（钱）
        gender: number;
        location: string;
        handPai: number[];  // 手牌
        isFold: 0 | 1; // 是否已弃牌
        isBanker: 0 | 1;
        isSmallBlind: 0 | 1;
        isBigBlind: 0 | 1;
        isAllIn: 0 | 1;
        totalBets: string;  // 玩家总下注
        curRoundBets: string;  // 玩家当前轮下注
        isCurRoundSpeak: 0 | 1; // 是否是当前的说话人
        curRoundAddBetCnt: number;  //当前轮加注多少次
    }[]
}

interface dzpkGameResult {
    pools: number[],
    userInfo: Array<
        {
            rPos: number,
            tax: string,
            chgMoney: string,
            userMoney: string,
            takeMoney: string,
            isWinner: number,
            cardType: number,
            maxCards: number[],
            handCards: number[],
            backMoney: string;
        }>
}
interface rposcard {
    rPos: number,
    handPai: number[];
}
let pomelo = window.pomelo;
export default class DZPKMsg extends GameMsg {
    loadGameHandler = "game.DZPKHandler.loadGameInfo";
    notifyCurrentGame = "DZPKLoadGameInfo";

    protected game: DZPKGame;
    public timeOutId = 0;

    protected addExtraListeners(): void {

        pomelo.on("DZPKAppointBanker", this.handleAppointBanker.bind(this));
        pomelo.on("DZPKDealHandCard", this.handleDealHandCard.bind(this));
        pomelo.on("DZPKDealCards", this.handleDealCards.bind(this));
        pomelo.on("DZPKOpt", this.handleTurnStart.bind(this));
        pomelo.on("DZPKFold", this.handleDiscard.bind(this));
        pomelo.on("DZPKCheck", this.handleUserCheck.bind(this));
        pomelo.on("DZPKFollow", this.handleUserFollow.bind(this));
        pomelo.on("DZPKRaise", this.handleUserRaise.bind(this));
        pomelo.on("DZPKAllIn", this.handleUserAllIn.bind(this));
        pomelo.on("DZPKDoPot", this.handleUserDoPot.bind(this));
        pomelo.on("DZPKDoBalance", this.handleResult.bind(this));
        // pomelo.on("DZPKTakeMoney", this.handleTakeMoney.bind(this));
        pomelo.on("DZPKStartGame", this.handleDZPKStartGame.bind(this));
        pomelo.on("userMoney", this.handleUserMoney.bind(this));
        pomelo.on("DZPKStatusChange", this.handleStatusChange.bind(this));
        // pomelo.on("DZPKDealAllHandCard", this.handleDealOtherCard.bind(this));

    }
    protected removeExtraListeners(): void {

        pomelo.off("DZPKAppointBanker");
        pomelo.off("DZPKDealHandCard");
        pomelo.off("DZPKDealCards");
        pomelo.off("DZPKOpt");
        pomelo.off("DZPKFold");
        pomelo.off("DZPKCheck");
        pomelo.off("DZPKFollow");
        pomelo.off("DZPKRaise");
        pomelo.off("DZPKAllIn");
        pomelo.off("DZPKDoPot");
        pomelo.off("DZPKDoBalance");
        pomelo.off("DZPKStartGame");

        pomelo.off("userMoney");

        // pomelo.off("DZPKDealAllHandCard");
    }

    private handleDZPKStartGame(data: { users?: PlayerInfo[], willChangeRoom: number, gameNo: string }) {
        let game = this.game;
        game.isGaming = true;
        let me = this.game.playerMgr.me;
        if (me) {
            game.userTouched = false;
            if (me.isLooker) {
                game.userTouched = true;
            }
        }
        game.setStarted();
        game.hidePrepare();
        // game.playAnimStartGame().then(() => {
        //     if (data.willChangeRoom) {
        //         util.showTip("本局结束后将自动换桌");
        //     }
        // });
        game.playerMgr.updatePlayersForTakeMoney(data.users);
        game.hideTicker();
        if (this.game.audioMgr) {
            this.game.audioMgr.playStart();
        }
        // if (game.labGameId)
        //     game.labGameId.string = data.gameNo;
    }

    handleStatusChange(data: { status: number, leftTime: number }) {
        if (data.status === DZPKGameStatus.PREFLOP) {
            this.game.dealHandCard();
        }
    }

    // private handleTakeMoney(data: { rPos: number, takeMoney: string }) {
    //     cc.log("-----this---", this);
    //     cc.log("-----this.game---", this.game);
    //     cc.log("-----thisplayermgar---", this.game.playerMgr);
    //     let p = this.game.playerMgr.getPlayerByServerPos(data.rPos);
    //     if (p) {
    //         p.takeMoney = +data.takeMoney;
    //         // p.showUserInfo();
    //     } else {
    //         cc.log("---handleTakeMoney----不存在p---", data.rPos);
    //     }
    // }
    private handleUserMoney(data: { money: string }) {
        let me = this.game.playerMgr.me;
        if (me) {
            me.balance = +data.money;
        }
    }

    /**
     * 处理下注信息
     * @param currRoundBets 当前单注
     * @param totalBets 总注
     */
    private handleBets(currRoundBets: string, totalBets: string) {
        let game = this.game;
        game.setBetsInfo(+currRoundBets, +totalBets);
        game.updateRoomInfo();
    }

    private handleTurnStart(data: { rPos: number, time: number, curRoundAddCnt: number }) {
        let game = this.game;
        let player = game.playerMgr.getPlayerByServerPos(data.rPos);
        if (player && player.uid) {
            game.changeState(State.Turing);
            player.setCurRoundAddBetCnt(data.curRoundAddCnt);
            player.startTurn(data.time);
        } else {
            cc.warn("找不到player!" + data.rPos);
        }
    }

    private handleDiscard(data: { rPos: number }) {
        let game = this.game;
        let player = game.playerMgr.getPlayerByServerPos(data.rPos);
        if (player && player.uid) {
            player.discard();
        } else {
            cc.warn("找不到player!" + data.rPos);
        }
    }
    private handleUserCheck(data: { rPos: number }) {
        let game = this.game;
        let player = game.playerMgr.getPlayerByServerPos(data.rPos);
        if (player && player.uid) {
            player.check();
        } else {
            cc.warn("找不到player!" + data.rPos);
        }
    }

    private handleUserFollow(data: { rPos: number, bets: string, totalBets: string, userMoney: string }) {
        this.handleDoBet(data.rPos, BetType.Follow, data.bets, data.userMoney, data.totalBets);
    }

    private handleUserRaise(data: { rPos: number, bets: string, totalBets: string, userMoney: string }) {
        this.handleDoBet(data.rPos, BetType.Raise, data.bets, data.userMoney, data.totalBets);
    }

    private handleUserAllIn(data: { rPos: number, bets: string, totalBets: string, userMoney: string }) {
        this.handleDoBet(data.rPos, BetType.AllIn, data.bets, data.userMoney, data.totalBets);
    }

    private handleDoBet(rPos: number, betType: number, betPoints: string, remainBetPoints: string, totalBets: string) {
        let game = this.game;
        let player = game.playerMgr.getPlayerByServerPos(rPos);
        if (player && player.uid) {
            player.takeMoney = +remainBetPoints;
            player.updateBalance();
            player.bets(betPoints, betType);
        } else {
            cc.warn("找不到player!" + rPos);
        }

        this.handleBets(player.roundBets.toString(), totalBets);

        if (!this.game.isTwoWheel) {
            this.game.dealSmallBetsPool([+totalBets]);
        }
    }
    /**
     * 处理下大小盲注
     * @param data
     */
    private handleUserDoPot(data: { rPos: number, pot: string, totalBets: string, userMoney: string }) {
        // this.handleBets( "0" ,data.totalBets);
        this.handleDoBet(data.rPos, BetType.None, data.pot, data.userMoney, data.totalBets);
    }

    protected handleCurrentGameInfo(data: curGameInfo) {
        super.handleCurrentGameInfo(data);

        let game = this.game;
        this.game.roundBets = +data.curRoundMaxBets;
        data.userInfo.forEach(info => {
            let player = game.playerMgr.getPlayerByServerPos(info.rPos);
            if (player && player.uid) {
                if (info.money) {
                    player.takeMoney = +info.money;
                }
                for (const i in info.handPai) {
                    player.addCards(+i, info.handPai[i]);
                }
                if (info.isBanker) {
                    player.becomeDealer();
                }
                player.setCurRoundAddBetCnt(info.curRoundAddBetCnt);
                player.setRoundBets(+info.curRoundBets);
                player.changeState(PlayerStates.STARTED);
            }
        });

        if (data.commonCards && data.commonCards.length > 0) {
            for (const c of data.commonCards) {
                this.game.dealCommonCard(c);
            }
            this.game.changeOperationsDefultRaiseLabel();
            this.game.dealMyCardType();
        }

        if (data.pools && data.pools.length > 0) {
            this.game.dealSmallBetsPool(data.pools);
        }

        if (data.status > DZPKGameStatus.PREFLOP && data.status < DZPKGameStatus.GAMEEND) {
            let player = game.playerMgr.getPlayerByServerPos(data.curOptUser);
            if (player && player.uid && data.leftTime > 0) {
                game.changeState(State.Turing);
                player.startTurn(data.leftTime);
            } else {
                cc.warn("leftTime小于等于0 或 找不到player!" + data.curOptUser);
            }
        }
        game.changeState(data.status);
        data.userInfo.forEach(info => {
            let player = game.playerMgr.getPlayerByServerPos(info.rPos);
            if (player && player.uid) {
                player.updateLookerView();
                player.takeMoney = +info.money;
                player.updateBalance();
                player.updateLocation(info.location);
                if (info.isFold) {
                    player.discard(false);
                }
            }
        });

        //显示等待提示
        let me = this.game.playerMgr.me;
        cc.log("--data.status---", data.status);
        cc.log("--me.status---", me.state);
        if (User.instance.where == undefined && data.status > DZPKGameStatus.FREE && me.state < PlayerStates.READY) {
            this.game.showWaitTips();
        }
        User.instance.where = undefined;
    }

    private handleResult(data: dzpkGameResult) {

        let game = this.game;
        game.changeState(State.Result);
        game.playerMgr.hideActions();
        game.resetOperations();
        this.game.playerMgr.resetRoundBets();
        this.game.dealSmallBetsPool(data.pools);

        game.hideCardType();
        game.winnerNum = 0;
        for (let info of data.userInfo) {
            game.winnerNum += info.isWinner;

            setTimeout(function () {
                game.showResult(info);
            }, 500);

            if (info.handCards && info.handCards.length > 0) {
                let player = game.playerMgr.getPlayerByServerPos(info.rPos);
                if (player && player.uid) {
                    if (!player.isLooker) {
                        if (player.isMe && player.cards.length > 0) {
                            player.showFinalCardType(info.cardType, info.maxCards);
                        } else if (info.handCards[0] != 0) {
                            player.addCards(1, info.handCards[1], false).then(() => {
                                player.turnCard(1, true, true);
                            });
                            player.addCards(0, info.handCards[0], false).then(() => {
                                player.turnCard(0, true, true).then(() => {
                                    player.showFinalCardType(info.cardType);
                                });
                            });
                        }
                    }
                    if (!info.isWinner) {
                        // player.updateMoney(info.userMoney);
                        player.updateShowMoney(info.userMoney);
                        player.updateBalance();
                    }
                }
            }
        }
    }

    private handleDealOtherCard(data: rposcard[]) {
        let game = this.game;
        data.forEach(el => {
            let player = game.playerMgr.getPlayerByServerPos(el.rPos);
            if (player && player.uid) {
                player.addCards(1, el.handPai[1], false).then(() => {
                    player.turnCard(1, true, true);
                });
                player.addCards(0, el.handPai[0], false).then(() => {
                    player.turnCard(0, true, true);
                });
            }
        });
    }

    private async handleDealHandCard(data: { handlePai: number[] }) {
        this.game.changeState(State.Deal);
        // 从小盲注 开始发牌
        // this.game.dealHandCard(data.handlePai);
        this.game.playerMgr.me.handlePai = data.handlePai;

    }

    private async handleDealCards(data: { cards: number[], round: number, leftTime: number, pools: number[] }) {
        for (const c of data.cards) {
            this.game.dealCommonCard(c);
        }
        this.game.resetRoundBets();
        this.game.dealSmallBetsPool(data.pools);

        // 展示公共牌后  即进入第二轮以后  改变默认加注按钮的面值
        this.game.changeOperationsDefultRaiseLabel();
        this.game.dealMyCardType();
    }


    private async handleAppointBanker(data: { bankerPos: number, smallPos: number, smallBets: number, bigPos: number, }) {
        cc.log("---设置庄家--", data.bankerPos);
        let game = this.game;
        let player = game.playerMgr.getPlayerByServerPos(data.bankerPos);
        if (player) {
            player.becomeDealer();
        } else {
            cc.log("---没有Banker--");
        }

        let smallPosPlayer = game.playerMgr.getPlayerByServerPos(data.smallPos);
        this.game.smallPos = data.smallPos;
        let bigPosPlayer = game.playerMgr.getPlayerByServerPos(data.bigPos);
    }


}