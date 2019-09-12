import BrnnGame from "./brnnGame";

import GameMsg from "../game-share/gameMsg";
import { PlayerInfo } from "../game-share/game";
import { User } from "../common/user";
import * as util from "../common/util";

let pomelo = window.pomelo;

export enum GameStatus {
    Waiting = 1,
    Betting, //下注
    CardDisplaying, //发牌以及展示阶段
    Balancing, //结算阶段(写入db)
    ClientBalancing, //前端结算
    Finished, //结束
};

enum BANK {
    BANK_THAN_CONTINUOUS_MAX_COUNT, //超过连续做庄次数
    BANK_BEFORE_BANKER_QUIT, //之前的玩家下庄
    BANK_MONEY_NOT_ENOUGH, //钱不够

}

export enum Area {
    EAST = 1,
    SOUTH,
    WEST,
    NORTH,
    BANKER,
    MAX

}

export interface BrnnBullHandle {
    areaPos: number,
    type?: number,
    cardRunes: Rune[],
    betPoint?: string,
    isWin?: number,
    boost?: number,
}

export interface UserPersonInfo {
    userPos: number,
    totalGold: string,
    chgGold: string,
    winAreaPos: number[];
    tax?: string;
    winCount?: number,
    totalBets?: number,
}

interface Rune {
    rune: number,
    pretendRune?: number,
}

interface BrnnBullBetPoint {
    areaPos: number,
    betPoint: string,
}

interface brnnGamerInfo {
    userPos: number,
    betInfo: BrnnBullBetPoint[],
    winCount?: number,
    totalBets?: number,
}

interface GameInfo {
    state: number,
    timer: number,
    gameInfo: BrnnBullHandle[],
    gamerInfo: brnnGamerInfo[],
    bankPos: number,
    bankCount: number,

}

export default class BrnnMsg extends GameMsg {
    loadGameHandler = "game.BRNNHandler.loadGameInfo";
    notifyCurrentGame = "brnnNotifyCurrentGameInfo";

    protected game: BrnnGame;

    protected addExtraListeners(): void {
        pomelo.on("brnnGamePhaseChange", this.handleGamePhaseChange.bind(this));
        pomelo.on("brnnSendCard", this.handleSendCard.bind(this));
        pomelo.on("brnnShowUserInfo", this.handleShowUserInfo.bind(this));
        pomelo.on("brnnChangeBankBroadcast", this.handleChangeBankBroadcast.bind(this));
        pomelo.on("brnnDoBetBroadcast", this.handleBetBroadcast.bind(this));
        pomelo.on("brnnGameHistory", this.handleGameHistory.bind(this));
        pomelo.on("brnnGamerHistory", this.handleGamerHistory.bind(this));
        pomelo.on("brnnBankList", this.handleBankList.bind(this));
        pomelo.on("brnnCleanGamerInfo", this.handleCleanGamerInfo.bind(this));
        pomelo.on("startFreeTick", this.handleStartFreeTick.bind(this));
    }
    protected removeExtraListeners(): void {
        pomelo.off("brnnGamePhaseChange");
        pomelo.off("brnnNotifyCurrentGameInfo");
        pomelo.off("brnnSendCard");
        pomelo.off("brnnShowUserInfo");
        pomelo.off("brnnChangeBankBroadcast");
        pomelo.off("brnnDoBetBroadcast");
        pomelo.off("brnnGameHistory");
        pomelo.off("brnnGamerHistory");
        pomelo.off("brnnBankList");
        pomelo.off("brnnCleanGamerInfo");
        pomelo.off("startFreeTick");
    }

    ///////////////////////////////response/////////////////////////////////
    /**
     * 游戏状态
     */
    handleGamePhaseChange(data: { state: number, timer: number }, isRecome = false) {
        // 根据不同状态做不同的事
        this.game.changeState(data.state);
        switch (data.state) {
            case GameStatus.Betting:
                this.game.setTimer(data.timer);
                break;
            case GameStatus.ClientBalancing:
                this.game.setTimer(data.timer);
                if (!isRecome) {
                    let playerPosArr: number[] = [];
                    this.game.playerMgr.playerArr.forEach((player) => {
                        if (player.uid !== 0) {
                            playerPosArr.push(player.serverPos);
                        }
                    });
                    playerPosArr.push(this.game.currBankerPos);
                }
                break;
            default:
                break;
        }
    }

    /**
     * 断线重连
     * @param data
     */
    protected handleCurrentGameInfo(data: GameInfo) {
        super.handleCurrentGameInfo(data);

        this.game.recoverAllCoins();
        this.handleGamePhaseChange(data, true);
        this.game.setBankerUI(data.bankPos, data.bankCount);

        if (data.gamerInfo) {
            let selfPlayer = this.game.playerMgr.me;
            data.gamerInfo.forEach((gamerInfo) => {
                if (gamerInfo.betInfo && gamerInfo.betInfo.length > 0) {
                    let betPoint = "0";
                    gamerInfo.betInfo.forEach(info => {
                        if (info.areaPos < Area.BANKER && selfPlayer.serverPos === gamerInfo.userPos) {
                            betPoint = util.add(betPoint, info.betPoint).toString();
                            this.game.setSelfAreaMoney(info.areaPos, info.betPoint);
                        }
                    });
                    if (data.state === GameStatus.Betting && selfPlayer.serverPos === gamerInfo.userPos) {
                        // 下注阶段时，服务器发送过来的玩家金额是下注之前的，并不是及时的
                        this.game.resetSelfMoney(betPoint);
                    }
                    this.game.playerMgr.updateTotalBets(gamerInfo.userPos, gamerInfo.totalBets, gamerInfo.winCount);
                }
            });
            this.game.playerMgr.updateTablePlayer();
        }

        if (data.gameInfo) {
            // 是否显示牌
            if (data.state === GameStatus.Betting || data.state === GameStatus.CardDisplaying) {
                let gameInfos: BrnnBullHandle[] = [];
                data.gameInfo.forEach((gameInfo) => {
                    if (+gameInfo.betPoint > 0 && gameInfo.areaPos < Area.BANKER) {
                        this.game.setTotalAreaMoney(gameInfo.areaPos, gameInfo.betPoint, true);
                    }
                    gameInfos.push(gameInfo)
                });
                if (data.state === GameStatus.CardDisplaying) {
                    this.game.showAllCards(gameInfos);
                }
            }

            //显示等待提示
            if (User.instance.where == undefined && data.state > GameStatus.Betting) {
                this.game.showWaitTips();
            }
            User.instance.where = undefined;
        }
    }

    /**
    * 发牌
    * @param data
    */
    handleSendCard(data: { gameInfo: BrnnBullHandle[] }) {
        this.game.flySendCard(data.gameInfo);
    }

    /**
     * 丢筹码
     * @param data
     */
    handleBetBroadcast(data: { userPos: number, areaPos: number, betPoint: string }) {
        this.game.setTotalAreaMoney(data.areaPos, data.betPoint);
        let player = this.game.playerMgr.getPlayerByServerPos(data.userPos);
        if (player) {
            if (player.isMe) {
                this.game.setSelfAreaMoney(data.areaPos, data.betPoint);
                this.game.setAllowBet();
            } else {
                this.game.flyCoin(data.areaPos, data.betPoint, player.getPlayerPos());
            }
            player.doBeting(data.betPoint, !player.isMe);
        } else {
            this.game.flyCoin(data.areaPos, data.betPoint);
        }
    }

    /**
     * 结算信息
     * @param data
     */
    handleShowUserInfo(data: { showUserInfo: UserPersonInfo[] }) {
        this.game.showStatisticsAnim(data.showUserInfo);
    }

    /**
     * 上庄
     * @param data
     */
    handleChangeBankBroadcast(data: { rPos: number, chgInfo: number }) {
        if (data.chgInfo) {
            let player = this.game.playerMgr.getPlayerByServerPos(this.game.currBankerPos);
            // console.log("之前的庄家是 = " + this.game.currBankerPos);
            if (player && player.isMe) {
                if (data.chgInfo === BANK.BANK_MONEY_NOT_ENOUGH) {
                    // 金额不足
                    util.showTip("亲，你的金币不足了，系统要求您暂时下庄噢。");
                } else if (data.chgInfo === BANK.BANK_THAN_CONTINUOUS_MAX_COUNT) {
                    // 超过连续做庄次数
                    util.showTip(`亲，您已经坐庄满${this.game.MAX_BANK_COUNT}轮了，该让下一个玩家来上庄了。`);
                } else if (data.chgInfo === BANK.BANK_BEFORE_BANKER_QUIT) {
                    // 主动下庄
                    util.showTip("亲，您已成功下庄了。");
                }
            }
        }

        let player = this.game.playerMgr.getPlayerByServerPos(data.rPos);
        if (player && player.isMe) {
            util.showTip("亲，你是庄家了噢。");
        }
        this.game.setBankerUI(data.rPos, 0);
    }

    /**
     * 上庄列表
     * @param data
     */
    handleBankList(data: { continousCount: number, bankList: { uid: number, userPos: number }[] }) {
        this.game.showBanker(data.bankList, data.continousCount);
    }

    /**
     * 走势图
     * @param data
     */
    handleGameHistory(data: { history: { EAST: number, WEST: number, NORTH: number, SOUTH: number }[] }) {
        if (data.history) {
            this.game.showHistory(data.history);
        } else {
            util.showTip("亲，当前没有走势图噢。");
        }
    }

    /**
     * 我的战绩
     * @param data
     */
    handleGamerHistory(data: { history: { uid: number, startDate: string, winPoint: string, tax: string }[] }) {
        if (data.history) {
            this.game.showMyBill(data.history);
        } else {
            util.showTip("亲，当前没有战绩噢。");
        }
    }

    /**
     * 取消下注
     * @param data
     */
    handleCleanGamerInfo(data: { userPos: number, gameChgInfo: BrnnBullHandle[] }) {
        this.game.setCleanGamerInfo(data.userPos, data.gameChgInfo);
    }

    /**
     * 等待
     * @param data
     */
    handleStartFreeTick(data: { leftTime: number }) {
    }

    handleStartGame = (data: { users?: PlayerInfo[], willChangeRoom: number, gameNo: string }) => {
        this.game.labGameId.string = data.gameNo;
    }

    ///////////////////////////////send/////////////////////////////////

    /**
     * 点击上庄
     */
    sendDoBank() {
        pomelo.notify("game.BRNNHandler.doBank", {});
    }

    /**
     * 下庄
     */
    sendExitBank() {
        pomelo.notify("game.BRNNHandler.exitBank", {});
    }

    /**
     * 获取玩家结算信息
     * @param list
     */
    sendShowUserInfo(list: number[]) {
        pomelo.notify("game.BRNNHandler.needShowUserInfo", { userPosList: list });
    }

    /**
     * 下注
     * @param pos
     * @param point
     */
    sendDoBet(pos: number, point: string) {
        pomelo.notify("game.BRNNHandler.doBet", { areaPos: pos, betPoint: point });
    }

    /**
     * 获取走势图
     */
    sendGameHistory() {
        pomelo.notify("game.BRNNHandler.gameHistory", {});
    }

    /**
     * 获取近8局的成绩
     */
    sendGamerHistory() {
        pomelo.notify("game.BRNNHandler.gamerHistory", {});
    }

    /**
     * 获取上庄列表
     */
    sendBankList() {
        pomelo.notify("game.BRNNHandler.bankList", {});
    }

    /**
     * 取消下注
     */
    sendCancelBet() {
        pomelo.notify("game.BRNNHandler.cleanGameBetOnDstStatus", {});
    }
}
