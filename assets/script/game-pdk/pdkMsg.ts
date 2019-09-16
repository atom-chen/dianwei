import PdkGame, { State } from "./pdkGame";
import { CARD_TYPE } from "./pdkCardTools";

import GameMsg from "../game-share/gameMsg";
import * as util from "../common/util";

enum GameStatus {
    STATUS_FREE, //空闲阶段
    STATUS_DEAL_CARD, // 发牌阶段
    STATUS_PLAY_CARD, //出牌
    STATUS_RESULT, //结算阶段
    STATUS_END //结束
}

export interface UserResult {
    pos: number,
    money: string,
    remainCards: number[],
    isClosed: boolean,
}

export interface ResultShowInfo {
    ur: UserResult,
    loc: string,
    minScore: string,
    isMe: boolean,
    isRight: boolean,
    guan: string,
    remainCards: number[],
}

interface GameInfo {
    userInfo: UserInfo[],
    leftTime: number,
    plCarPos: number,
    befPos?: number,
    beforeCards?: number[],
    handCards: number[],
    status: number,
    first?: number,
    alPlayCards?: number[],
    isShow: number,
}

interface UserInfo {
    pos: number,
    money: string,
    remainCount?: number,
    gender?: number,
    hosted?: number,
    location?: string,
    boomMoney?: string,
}

const CLOSED_DOUBLE = 2;

let pomelo = window.pomelo;
export default class PdkMsg extends GameMsg {
    loadGameHandler = "game.PDKHandler.loadGameInfo";
    notifyCurrentGame = "pdkLoadGameInfo";

    protected game: PdkGame;

    protected addExtraListeners(): void {
        pomelo.on("pdkNotifyDealData", this.handleDealData.bind(this));
        pomelo.on("pdkNoticeUsersStartCards", this.handleUsersStartCards.bind(this));
        pomelo.on("pdkNoticeUsersPlayCards", this.handleUsersPlayCards.bind(this));
        pomelo.on("pdkNoticeUsersNotPlay", this.handleUsersNotPlay.bind(this));
        pomelo.on("pdkNoticeBoomGetMoney", this.handleBoomGetMoney.bind(this));
        pomelo.on("pdkNoticeUserAuto", this.handleUserAuto.bind(this));
        pomelo.on("pdkNoticeUserReslut", this.handleUserReslut.bind(this));

        // pomelo.on("pdkNoticeGameId", this.handleGameId.bind(this));

    }
    protected removeExtraListeners(): void {
        pomelo.off("pdkNotifyDealData");
        pomelo.off("pdkNoticeUsersStartCards");
        pomelo.off("pdkNoticeUsersPlayCards");
        pomelo.off("pdkNoticeUsersNotPlay");
        pomelo.off("pdkNoticeBoomGetMoney");
        pomelo.off("pdkNoticeUserAuto");
        pomelo.off("pdkNoticeUserReslut");

        pomelo.off("pdkNoticeGameId");
    }


    handleGameId(data: { gameId: number }) {
        // this.game.lab_roomId.string = `gameId=${data.gameId}`;
    }


    ///////////////////////////////response/////////////////////////////////
    /**
     * 发牌
     * @param data
     */
    handleDealData(data: { firstPos: number, handleCards: number[] }) {
        this.game.sendCard(data.handleCards);
        this.game.turnPlayerPlay(data.firstPos);
    }

    /**
     * 轮到玩家出牌
     * @param data
     */
    handleUsersStartCards(data: { leftTime: number, rPos: number, first: number }) {
        this.game.turnPlayerPlay(data.rPos, data.first, data.leftTime);
    }

    /**
     * 出牌
     * @param data
     */
    handleUsersPlayCards(data: { rPos: number, cards: number[], shape: CARD_TYPE }) {
        this.game.showPlayerDiscard(data.rPos, data.cards, data.shape);
    }

    /**
     * 不出
     * @param data
     */
    handleUsersNotPlay(data: { rPos: number }) {
        this.game.showPlayerNoPlay(data.rPos);
    }

    /**
     * 结算
     * @param data
     */
    async handleUserReslut(data: { pdkReslut: UserResult[], payForPos: number }) {
        let resultInfo: ResultShowInfo[] = [];
        let proAll: Promise<{}>[] = [];
        for (const uResult of data.pdkReslut) {
            let player = this.game.playerMgr.getPlayerByServerPos(uResult.pos);
            if (!player) continue;
            let isMe = player.isMe;
            let loc = player.location;
            let guanStatus: string;
            let remainCards: number[];

            // 被关、反关、包赔
            if (!!uResult.isClosed) {
                if (player.isFirst) {
                    guanStatus = "fg";
                } else {
                    guanStatus = "bg";
                }
            }
            if (data.payForPos === uResult.pos) {
                guanStatus = "bp";
            }

            // 刷新界面、展示余牌
            if (!isMe) {
                player.setSirenAnim(false);
                player.hideRemain();
                player.hideAllStatus();
                if (!uResult.remainCards)
                    remainCards = player.lastCards;
            } else {
                if (guanStatus !== undefined) {
                    this.game.setPayAnim(guanStatus);
                }
                // 双关
                let closedNum = 0;
                for (const ur of data.pdkReslut) {
                    let player = this.game.playerMgr.getPlayerByServerPos(ur.pos);
                    let isMe = player.isMe;
                    if (!isMe && !!ur.isClosed) closedNum += 1;
                }
                if (closedNum === CLOSED_DOUBLE) {
                    this.game.setPayAnim("sg");
                }
            }
            if (uResult.remainCards) {
                remainCards = uResult.remainCards;
                proAll.push(player.playEndAnim(uResult.isClosed));
            }

            let money = util.add(player.balance, uResult.money);
            player.updateMoney(money.toString());

            let info: ResultShowInfo = {
                ur: uResult,
                loc: loc,
                minScore: this.game.baseScore.toString(),
                isMe: isMe,
                isRight: player.isRightPlayer,
                guan: guanStatus,
                remainCards: remainCards,
            }
            resultInfo.push(info);
        }

        // 提前亮牌
        for (let idx = 0; idx < data.pdkReslut.length; idx++) {
            const ur = data.pdkReslut[idx];
            if (!ur.remainCards) break;
            if (idx === data.pdkReslut.length - 1) {
                proAll.push(this.game.showAdvanceTips());
            }
        }

        await Promise.all(proAll);
        this.game.resultPanel.show(resultInfo);
    }

    /**
     * 炸弹奖励
     * @param data
     */
    handleBoomGetMoney(data: { boom: { pos: number, boomMoney: string }[] }) {
        this.updateMoney(data.boom);
        for (let i = 0; i < data.boom.length; i++) {
            const offMoney = data.boom[i];
            let player = this.game.playerMgr.getPlayerByServerPos(offMoney.pos);
            if (!player) continue;
            if (+offMoney.boomMoney >= 0) {
                player.showGetAndLost({ get: offMoney.boomMoney });
            } else {
                player.showGetAndLost({ lost: offMoney.boomMoney });
            }
        }
    }

    /**
     * 托管
     * @param data
     */
    handleUserAuto(data: { rPos: number, isAuto: number }) {
        let player = this.game.playerMgr.getPlayerByServerPos(data.rPos);
        if (player.isMe) {
            this.game.meHosted(!!data.isAuto);
        } else {
            player.setAuto(!!data.isAuto);
        }
    }

    /**
     * 断线重连
     * @param gameInfo
     */
    protected handleCurrentGameInfo(gameInfo: GameInfo) {
        super.handleCurrentGameInfo(gameInfo);
        cc.log("------------handleCurrentGameInfo--------------");
        if (gameInfo.handCards) {
            // 加载自己的手牌
            this.game.initHolds(gameInfo.handCards);
        }
        for (const userInfo of gameInfo.userInfo) {
            let player = this.game.playerMgr.getPlayerByServerPos(userInfo.pos);
            if (player.isMe) {
                this.game.meHosted(!!userInfo.hosted);
            } else {
                player.setAuto(!!userInfo.hosted);
            }
            player.setCurrCardNum(userInfo.remainCount);

            // 玩家个人信息
            player.gender = userInfo.gender;
            player.updateLocation(userInfo.location);
            player.balance = util.add(userInfo.money, 0).toNumber();
            player.updateBalance();
        }
        this.updateMoney(gameInfo.userInfo);

        this.game.returnGame = true;
        this.game.hideHold(!gameInfo.isShow);
        // 上手牌
        if (gameInfo.befPos > -1) {
            this.game.showPlayerDiscard(gameInfo.befPos, gameInfo.beforeCards);
        }
        if (gameInfo.plCarPos > -1) {
            this.game.turnPlayerPlay(gameInfo.plCarPos, gameInfo.first, gameInfo.leftTime);
        }

        // 记牌器
        if (gameInfo.alPlayCards) {
            this.game.recordCardPanel.saveDiscardNum(gameInfo.alPlayCards);
        }
    }

    ///////////////////////////////send/////////////////////////////////
    sendPlayCards(cardType: CARD_TYPE, cardsData: number[]) {
        pomelo.notify("game.PDKHandler.userPlay", { cards: cardsData });
    }

    sendNotPlay() {
        pomelo.notify("game.PDKHandler.notPlay", {});
    }

    sendHosted() {
        pomelo.notify("game.PDKHandler.userAuto", {});
    }

    private updateMoney(data: any[]) {
        for (let i = 0; i < data.length; i++) {
            const offMoney = data[i];
            let player = this.game.playerMgr.getPlayerByServerPos(offMoney.pos);
            if (!player) continue;
            if (player.balance !== undefined && offMoney.boomMoney !== undefined) {
                player.balance = util.add(player.balance, offMoney.boomMoney).toNumber();
                player.updateBalance();
            }
        }
    }
}
