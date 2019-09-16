import DDZGame, { State } from "./ddzGame";
import { CARD_TYPE } from "./ddzCardTools";

import GameMsg from "../game-share/gameMsg";
import * as util from "../common/util";

enum GameStatus {
    STATUS_FREE, //空闲阶段
    STATUS_DEAL_CARD, // 发牌阶段
    STATUS_JIAO_DIZHU, //叫地主
    STATUS_ADD_MULT, //加倍
    STATUS_PLAY_CARD, //出牌
    STATUS_RESULT, //结算阶段
    STATUS_END //结束
}

enum JiaoStatus {
    BUJIAO = 0,
    JIAO_ONE,
    JIAO_TWO,
    JIAO_THREE,
    JIAO_NULL
}


export interface UserResult {
    rPos: number,
    chgScore: number,
    totalMulti: number,
    remainCards: number[],
    tax: number,
}

export interface ResultShowInfo {
    ur: UserResult,
    isDealer: boolean,
    loc: string,
    isMe: boolean,
    isRight: boolean,
    isAddMul: boolean,
    remainCards: number[],
}

interface DdzUser {
    rPos: number,
    JiaoStatus?: number,
    AddStatus: number,
    handleCards?: number[],
    chgMoney?: number,
    remainCount: number,
    totalMulti: number,
    location?: string;
    gender?: number;
    money?: string;
    hosted: number;
}

interface GameEnd {
    phase: number,    //游戏阶段
    leftTime: number,   //阶段倒计时
    optPos?: number,    //当前阶段操作pos
    cardsCounter?: number[],
    first?: number,
    lastCards?: number[],
    lastPos?: number,
    users: DdzUser[],
    ddzCards: number[],
    ddzPos: number,
}

let pomelo = window.pomelo;
export default class DdzMsg extends GameMsg {
    loadGameHandler = "game.DZZHandler.loadCurrentGameInfo";
    notifyCurrentGame = "ddzLoadGameInfo";

    protected game: DDZGame;

    protected addExtraListeners(): void {
        pomelo.on("ddzSendCard", this.handleSendCard.bind(this));
        pomelo.on("ddzUserEnterJiaoFen", this.handleUserEnterJiaoFen.bind(this));
        pomelo.on("ddzBroadcastJiaoFen", this.handleBroadcastJiaoFen.bind(this));
        pomelo.on("ddzBroadcastDiZhu", this.handleBroadcastDiZhu.bind(this));
        pomelo.on("ddzEnterAddMulti", this.handleEnterAddMulti.bind(this));
        pomelo.on("ddzBroadcastAddMulti", this.handleBroadcastAddMulti.bind(this));
        pomelo.on("ddzUserEnterPlayCards", this.handleUserEnterPlayCards.bind(this));
        pomelo.on("ddzBroUserPlayCards", this.handleBroUserPlayCards.bind(this));
        pomelo.on("ddzBroUserNotPlay", this.handleBroUserNotPlay.bind(this));
        pomelo.on("ddzBroEnterResult", this.handleBroEnterResult.bind(this));
        pomelo.on("ddzAllUserNotJiaoFen", this.handleAllUserNotJiaoFen.bind(this));
        pomelo.on("DDZBroHostedInfo", this.handleBroHostedInfo.bind(this));
    }
    protected removeExtraListeners(): void {
        pomelo.off("ddzSendCard");
        pomelo.off("ddzUserEnterJiaoFen");
        pomelo.off("ddzBroadcastJiaoFen");
        pomelo.off("ddzBroadcastDiZhu");
        pomelo.off("ddzEnterAddMulti");
        pomelo.off("ddzBroadcastAddMulti");
        pomelo.off("ddzUserEnterPlayCards");
        pomelo.off("ddzBroUserPlayCards");
        pomelo.off("ddzBroUserNotPlay");
        pomelo.off("ddzBroEnterResult");
        pomelo.off("ddzAllUserNotJiaoFen");
        pomelo.off("DDZBroHostedInfo");
    }

    ///////////////////////////////response/////////////////////////////////
    /**
     * 发牌
     * @param data
     */
    handleSendCard(data: { handleCards: number[] }) {
        this.game.initHolds(data.handleCards);
        this.game.playerMgr.setRemainCard();

        this.game.sendCardsAnimation();
        this.game.delayShowBtnHosted();

        this.game.changeState(State.Start);
    }

    /**
     * 轮到玩家叫分
     * @param data
     */
    handleUserEnterJiaoFen(data: { leftTime: number, rPos: number }) {
        this.game.turnPlayerScore(data.leftTime, data.rPos);
    }

    /**
     * 玩家叫分
     * @param data
     */
    handleBroadcastJiaoFen(data: { point: number, rPos: number }) {
        this.game.showPlayerScore(data.point, data.rPos);
    }

    /**
     * 通知地主消息
     * @param data
     */
    handleBroadcastDiZhu(data: { rPos: number, cards: number[] }) {
        this.game.showDealer(data.rPos, data.cards);
        this.game.playerMgr.endJiaoFen();
    }

    /**
     * 选择加倍
     * @param data
     */
    handleEnterAddMulti(data: { leftTime: number }) {
        this.game.waitPlayerAdd(data.leftTime);
    }

    /**
     * 通知玩家是否加倍
     * @param data
     */
    handleBroadcastAddMulti(data: { rPos: number, add: number }) {
        this.game.showPlayerAdd(data.rPos, data.add);
    }

    /**
     * 轮到玩家出牌
     */
    handleUserEnterPlayCards(data: { leftTime: number, rPos: number, first: number }) {
        this.game.turnPlayerPlay(data.leftTime, data.rPos, data.first);
    }

    /**
     * 通知用户出牌
     * @param data
     */
    handleBroUserPlayCards(data: { rPos: number, cards: number[], shape: CARD_TYPE }) {
        this.game.showPlayerDiscard(data.rPos, data.cards, data.shape);
    }

    /**
     * 通知玩家不出
     * @param data
     */
    handleBroUserNotPlay(data: { rPos: number }) {
        this.game.showPlayerNoPlay(data.rPos);
    }

    /**
     * 结算
     * @param data
     */
    async handleBroEnterResult(data: { ur: UserResult[], bombNum: number, spring: number }) {
        this.game.isGaming = false;
        this.game.hideDealerCards();
        // 保存玩家信息
        let resultInfo: ResultShowInfo[] = [];
        for (const uResult of data.ur) {
            let player = this.game.playerMgr.getPlayerByServerPos(uResult.rPos);
            let isDealer = player.isDealer;
            let loc = player.location;
            let isMe = player.isMe;
            let addMul = player.addMul;
            let remainCards: number[];

            if (!isMe) {
                player.setSirenAnim(false);
                player.hideRemain();
                player.cleanCards();
                if (uResult.remainCards) {
                    remainCards = uResult.remainCards;
                } else {
                    remainCards = player.lastCards;
                }
            }

            let money = util.add(player.balance, uResult.chgScore);
            player.updateMoney(money.toString());

            let info: ResultShowInfo = {
                ur: uResult,
                isDealer: isDealer,
                loc: loc,
                isMe: isMe,
                isRight: player.isRightPlayer,
                isAddMul: (addMul === 2) ? true : false,
                remainCards: remainCards,
            }
            resultInfo.push(info);
        }

        // 春天加倍情况
        if (data.spring !== 1) {
            await this.game.playSpringAnim();
        }
        this.game.resultPanel.show(resultInfo, data.bombNum, data.spring);

        this.game.audioMgr.stopMusic();
    }

    /**
     * 所有玩家都不叫
     */
    handleAllUserNotJiaoFen() {
        util.showTip("当前无玩家叫分，本局重新发牌");
        this.game.initRound();
        this.game.playerMgr.initEnable();
    }

    /**
     * 断线重连
     * @param gameEndInfo
     */
    protected handleCurrentGameInfo(gameEndInfo: GameEnd) {
        super.handleCurrentGameInfo(gameEndInfo);

        let currScore = 0;
        for (const userInfo of gameEndInfo.users) {
            // 记录玩家在各个状态时的情况
            let player = this.game.playerMgr.getPlayerByServerPos(userInfo.rPos);
            if (!player) {
                break;
            }
            if (gameEndInfo.phase === GameStatus.STATUS_JIAO_DIZHU) {
                if (userInfo.JiaoStatus) {
                    player.showScoreStatus(userInfo.JiaoStatus);
                    if (currScore < userInfo.JiaoStatus && userInfo.JiaoStatus !== JiaoStatus.JIAO_NULL) {
                        currScore = userInfo.JiaoStatus;
                    }
                }
            } else if (gameEndInfo.phase > GameStatus.STATUS_JIAO_DIZHU) {
                // 叫分之后有地主信息、倍数
                if (gameEndInfo.ddzPos === userInfo.rPos) {
                    player.setDealer(true, false);
                }

                if (gameEndInfo.phase === GameStatus.STATUS_ADD_MULT) {
                    // 地主不用显示加倍
                    if (userInfo.AddStatus) {
                        player.showMulStatus(userInfo.AddStatus);
                    } else if (!player.isDealer && player.isMe) {
                        this.game.setAddMulPanel(true);
                    } else {
                        player.setWaitTime(gameEndInfo.leftTime);
                    }
                }
                if (player.isMe && userInfo.totalMulti) {
                    this.game.labMul.string = userInfo.totalMulti.toString();
                }
            }
            // 加载自己的手牌
            if (player.isMe) {
                this.game.initHolds(userInfo.handleCards);
                this.game.meHosted(userInfo.hosted === 1);
            } else {
                player.setAuto(userInfo.hosted === 1);
            }
            player.setCurrCardNum(userInfo.remainCount);

            // 玩家个人信息
            player.gender = userInfo.gender;
            player.updateLocation(userInfo.location);
            player.balance = +userInfo.money;
            player.updateBalance();
        }

        // 游戏状态
        if (gameEndInfo.phase === GameStatus.STATUS_JIAO_DIZHU) {
            if (gameEndInfo.optPos !== undefined) {
                this.game.currScore = currScore;
                this.game.turnPlayerScore(gameEndInfo.leftTime, gameEndInfo.optPos)
            }
        } else if (gameEndInfo.phase > GameStatus.STATUS_JIAO_DIZHU) {
            if (gameEndInfo.lastPos !== undefined && gameEndInfo.lastCards !== undefined) {
                this.game.showPlayerDiscard(gameEndInfo.lastPos, gameEndInfo.lastCards);
            }
            if (gameEndInfo.optPos !== undefined) {
                this.game.turnPlayerPlay(gameEndInfo.leftTime, gameEndInfo.optPos, gameEndInfo.first);
            }

            this.game.setDealerCards(gameEndInfo.ddzCards);
            // 记录已出的牌还包括自己手牌
            if (gameEndInfo.cardsCounter) {
                this.game.recordCardPanel.saveDiscardNum(gameEndInfo.cardsCounter);
            }
        }

        this.game.changeState(State.Start);
    }

    handleBroHostedInfo(data: { rPos: number, state: number }) {
        cc.log("handleBroHostedInfo");
        let player = this.game.playerMgr.getPlayerByServerPos(data.rPos);
        if (player.isMe) {
            this.game.meHosted(data.state === 1);
        } else {
            player.setAuto(data.state === 1);
        }
    }
    ///////////////////////////////send/////////////////////////////////
    sendJiaoFen(score: number) {
        pomelo.notify("game.DZZHandler.JiaoFen", { point: score });
    }

    sendAddMulti(mul: number) {
        pomelo.notify("game.DZZHandler.addMulti", { add: mul });
    }

    sendPlayCards(cardType: CARD_TYPE, cardsData: number[]) {
        pomelo.notify("game.DZZHandler.playCards", { cards: cardsData, shape: cardType });
    }

    sendNotPlay() {
        pomelo.notify("game.DZZHandler.NotPlay", {});
    }

    sendHosted() {
        pomelo.notify("game.DZZHandler.hostedChg", {});
    }
}
