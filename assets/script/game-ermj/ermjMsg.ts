import ErmjGame, { State } from "./ermjGame";
import * as ErmjType from "./ermj";
import { PlayerStates } from "./ermjPlayer";
import GameLogic from "./ermjGameLogic";

import GameMsg from "../game-share/gameMsg";
import * as util from "../common/util";

let pomelo = window.pomelo;

export type jiaBeiInfo = {
    pai: number,
    paiPos: number,
}
type usersData = {
    rPos: number;
    isTing?: number;
    menFeng: number;
    queType?: number;
    deskPai: number[];
    jiaBeiPais: number[];
    jiaBeiPaiPos: number[];
    paoIndex?: number[];
    pgInfos: ErmjType.PGangInfo[];
    userState?: number;
    huPai?: number;
    location?: string;
    avatar?: number;
    gender?: number;
    money?: string;
    select3Pai?: number[];
    hasSelected?: number;
    hasDingQue?: number;
    handlePai: number[];
    chgMoney?: string;
}

type stationData = {
    gameStatus: number;
    leftTime: number;
    bankerStation?: number;
    handlePai: number[];
    nextHandlePai: number[];
    quanFeng: number;
    curOptrPos?: number;
    curInPai?: number;
    lastOutPai?: number;
    lastOutPairPos?: number;
    users: usersData[];
    pghInfo?: { chi: number, peng: number, gang: number, hu: number };
    scores?: { type: number[], changeScore: ErmjType.ChangeScore[] }[];
    remainPaiCount?: number;
    huType: number[];
}

export default class ErmjMsg extends GameMsg {
    loadGameHandler = "game.ERMJHandler.loadGameInfo";
    notifyCurrentGame = "ERMJLoadGameInfo";

    protected game: ErmjGame;
    private _gameLogic: GameLogic = new GameLogic();

    protected addExtraListeners(): void {
        pomelo.on("ERMJNotifyUserWaitOutPai", this.handleWaitOutPai.bind(this));
        pomelo.on("ERMJNotifyChiPengGangHu", this.handlePengGangHu.bind(this));
        pomelo.on("XZGameStatus", this.handleGameStatus.bind(this));
        pomelo.on("ERMJSendPai", this.handleSendPai.bind(this));
        pomelo.on("ERMJNotifyUserOutCard", this.handleOutCard.bind(this));
        pomelo.on("XZNotifyUserChangeScore", this.handleChangeScore.bind(this));
        pomelo.on("XZUserTax", this.handleUserTax.bind(this));
        pomelo.on("ERMJNotifyUserUpPai", this.handleUpPai.bind(this));
        pomelo.on("ERMJNotifyUserGangPai", this.handleGangCard.bind(this));
        pomelo.on("ERMJNotifyUserHu", this.handleHu.bind(this));
        pomelo.on("ERMJNotifyUserPengPai", this.handlePengCard.bind(this));
        pomelo.on("ERMJNotifyUserChiPai", this.handleChiCard.bind(this));
        pomelo.on("ERMJGameResult", this.handleGameResult.bind(this));
        pomelo.on("ERMJNotifyUserAuto", this.handleUserAuto.bind(this));
        pomelo.on("ERMJNotifyTingNextHandlePais", this.handleTingNextHandlePais.bind(this));
        pomelo.on("ERMJNotifyFangHuCount", this.handleFangHuCount.bind(this));
    }
    protected removeExtraListeners(): void {
        pomelo.off("ERMJNotifyFangHuCount");
        pomelo.off("ERMJNotifyUserWaitOutPai");
        pomelo.off("ERMJNotifyChiPengGangHu");
        pomelo.off("XZGameStatus");
        pomelo.off("ERMJSendPai");
        pomelo.off("ERMJNotifyUserOutCard");
        pomelo.off("XZNotifyUserChangeScore");
        pomelo.off("XZUserTax");
        pomelo.off("ERMJNotifyUserUpPai");
        pomelo.off("ERMJNotifyUserGangPai");
        pomelo.off("ERMJNotifyUserHu");
        pomelo.off("ERMJNotifyUserPengPai");
        pomelo.off("ERMJNotifyUserChiPai");
        pomelo.off("ERMJGameResult");
        pomelo.off("ERMJNotifyUserAuto");
        pomelo.off("ERMJNotifyTingNextHandlePais");
    }

    ///////////////////////////////response/////////////////////////////////
    /**
     * 游戏状态
     */
    handleGameStatus(data: { status: number, leftTime: number }) {
        // 根据不同状态做不同的事
        switch (data.status) {
            case ErmjType.GameStatus.GAME_WAIT:
                break;
            case ErmjType.GameStatus.GAME_SEND_CARD:
                this.game.changeState(State.state_send_card, data.leftTime);
                break;
            case ErmjType.GameStatus.GAME_WAIT_USER_OUT_CARD:
                this.game.changeState(State.state_wait_user_out_card, data.leftTime);
                break;
            case ErmjType.GameStatus.GAME_CHI_PENG_GANG_HU:
                this.game.changeState(State.state_chi_peng_gang_hu, data.leftTime);
                break;
            case ErmjType.GameStatus.GAME_ROUND_RESULT:
                this.game.changeState(State.state_round_result, data.leftTime);
                break;
            default:
                break;
        }
    }

    /**
     * 发牌
     */
    handleSendPai(data: { bankerPos: number, handlePai: number[], quanFeng: number, menFeng: number }) {
        cc.log("==================================begin");
        this.game.playerMgr.setPlayerDealer(data.bankerPos);
        this.game.startGame(data.handlePai);
        this.game.mjResult.savePlayerData();
        this.game.setQuanMen(data.quanFeng, data.menFeng);
        this.game.mjTimer.setRemainPaiTotal(37);
    }

    /**
     * 报听后看对方牌
     */
    handleTingNextHandlePais(data: { nextPais: number[] }) {
        this.game.playerMgr.getPlayerBySeat(1).setHoldPais(data.nextPais);
    }

    /**
     * 轮到谁操作
     */
    handleWaitOutPai(data: { curOptrPos: number, lastOutPai: number, lastOutPairPos: number, leftTime: number }) {
        this.game.setWaitOutPai(data.curOptrPos, data.leftTime);
    }

    /**
     * 玩家摸牌
     */
    handleUpPai(data: { uprPos: number, upPai: number }) {
        this.game.setPlayerDraw(data.uprPos, data.upPai);
    }

    /**
     * 玩家托管
     */
    handleUserAuto(data: { isAuto: number }) {

    }

    /**
     * 玩家出牌
     */
    handleOutCard(data: { rPos: number, pai: number, isTing: number }) {
        let player = this.game.playerMgr.getPlayerByServerPos(data.rPos);
        if (player) {
            player.setDiscard(data.pai, data.isTing);
            this.game.audioMgr.playDraw(player.isMale, data.pai);
        }

        let lastDiscardInfo: ErmjType.SaveDiscardInfo = {
            outPos: data.rPos,
            outPaiVal: [data.pai]
        };
        this.game.lastDiscardInfo = lastDiscardInfo;
        if (player.isMe) {
            if (this.game.isTrusteeship == 1 ) {
                this.game.isTrusteeship = 3;
            } else {
                this.game.isTrusteeship = 2;
            }
        }
    }

    /**
     * 过胡加倍
     */
    handleFangHuCount(data: { rPos: number, fangHuCount: number, pai: number }) {
        let player = this.game.playerMgr.getPlayerByServerPos(data.rPos);
        this.game.double(!player.isMe);

        let doubledPlayer = this.game.playerMgr.getPlayerByServerPos(this.game.lastDiscardPos);
        doubledPlayer.doubled([{ paiPos: data.rPos, pai: data.pai }]);
        this.game.audioMgr.playDouble(player.isMale);
    }

    /**
     * 进行碰、杠、胡 操作
     */
    handlePengGangHu(data: { chi: number, peng: number, gang: number, hu: number, leftTime: number }) {
        let optArr: number[] = new Array();
        let isTingPai = false
        if (data.hu === ErmjType.BooleanType.BOOLEAN_YES) {
            optArr.push(ErmjType.OptType.OPT_HU);
            isTingPai = this.game.playerMgr.me.nodeBaoTing.active;     // 自己已听牌并且此轮有胡时显示翻倍
        }
        if (data.peng === ErmjType.BooleanType.BOOLEAN_YES)
            optArr.push(ErmjType.OptType.OPT_PENG);
        if (data.gang === ErmjType.BooleanType.BOOLEAN_YES)
            optArr.push(ErmjType.OptType.OPT_GANG);
        if (data.chi === ErmjType.BooleanType.BOOLEAN_YES)
            optArr.push(ErmjType.OptType.OPT_CHI);

        let isAuto = this.game.getIsAutoDraw();
        if (optArr.length > 0 && !isAuto && this.game.isGaming) {
            this.game.mjOptPanel.show(optArr, isTingPai);
            this.game.mjTimer.setGameTicker(data.leftTime);

            this.game.coverPanel.active = true;
            this.game.baoTingPanel.hide();
        } else if (isAuto) {
            if (data.hu === ErmjType.BooleanType.BOOLEAN_YES) {
                this.sendHu();
            } else {
                this.sendPass();
            }
        }
    }

    handleChangeScore(data: { type: number[], changeScore: ErmjType.ChangeScore[] }) {
        this.game.mjResult.addChangeScore(data);

        let changeScoreArr = data.changeScore;
        let winRPos = 0;
        let changeScore;
        for (let index = 0; index < changeScoreArr.length; index++) {
            let changeScoreInfo = changeScoreArr[index];
            let rPos = changeScoreInfo.rPos;
            let score = changeScoreInfo.changeScore
            changeScore = changeScoreInfo.changeScore;
            let player = this.game.playerMgr.getPlayerByServerPos(rPos);

            let resultScore = util.mul(score, 1).toNumber();
            player.showResultScore(resultScore);
            if (player.balance !== undefined) {
                player.balance = util.add(player.balance, resultScore).toNumber();
                player.updateBalance();
            }
            if (score > 0)
                winRPos = rPos;
        }

        let types = data.type;
        types.forEach((t) => {

            // 抢杠胡
            if (t === ErmjType.HU_TYPE_ER.HUPAI_QIANG_GANG_HE) {
                changeScoreArr.forEach(scoreInfo => {
                    if (scoreInfo.changeScore < 0) {
                        let player = this.game.playerMgr.getPlayerByServerPos(scoreInfo.rPos);
                        player.setQiangGangHu();
                        this.game.mjResult.updateGangData(scoreInfo.rPos);
                    }
                });
            }

            // 动画
            if (t === ErmjType.HU_TYPE_ER.HUPAI_GANG_SHANG_KAI_HUA) {
                // 杠上开花
                this.game.playAnimGskh();
            } else if (t === ErmjType.HU_TYPE_ER.HUPAI_QIANG_GANG_HE) {
                // 抢杠胡
                this.game.playAnimQgh();
            }
        });

        // 播放胡音效
        let isZimo = false;
        types.forEach((t) => {
            if (t === ErmjType.HU_TYPE_EX.HUPAI_ZI_MO) {
                isZimo = true;
            }
        });

        let player = this.game.playerMgr.getPlayerByServerPos(winRPos);
        let fanInfo = this.game.mjResult.GetHuFanScore(types);
        if (changeScore != 0){
            if (fanInfo >= 53) {
                this.game.audioMgr.playHu(player.isMale, isZimo, true);
            } else {
                this.game.audioMgr.playHu(player.isMale, isZimo, false);
            }
        }
    }

    /**
     * 扣税
     */
    handleUserTax(data: { rPos: number, tax: string }) {
        this.game.mjResult.addTaxScore(data);

        let player = this.game.playerMgr.getPlayerByServerPos(data.rPos);
        if (player) {
            player.showTax(data.tax);
            if (player.balance) {
                player.balance = util.sub(player.balance, data.tax).toNumber();
                player.updateBalance();
            }
        }
    }

    /**
     * 玩家进行碰操作
     */
    handlePengCard(data: { rPos: number, info: ErmjType.PGangInfo }) {
        this.game.mjResult.saveGangData(data.rPos, data.info);

        let player = this.game.playerMgr.getPlayerByServerPos(data.rPos);
        if (player) {
            player.setPGangPai(data.info.pai, ErmjType.GangType.GANG_TYPE_PENG);
            this.game.audioMgr.playPeng(player.isMale);
            this.game.playAnimPeng(player.getEffOptPos());
        }

        let lastOutPaiInfo = this.game.lastDiscardInfo;
        let outPlayer = this.game.playerMgr.getPlayerByServerPos(lastOutPaiInfo.outPos);
        if (outPlayer) {
            outPlayer.removeFromDiscard();
        }
    }

    /**
     * 玩家进行吃操作
     */
    handleChiCard(data: { rPos: number, info: ErmjType.PGangInfo }) {
        this.game.mjResult.saveGangData(data.rPos, data.info);

        let player = this.game.playerMgr.getPlayerByServerPos(data.rPos);
        if (player) {
            player.setPGangPai(data.info.pai, ErmjType.GangType.GANG_TYPE_CHI, data.info.chiPai);
            this.game.audioMgr.playChi(player.isMale);
            this.game.playAnimChi(player.getEffOptPos());
        }

        let lastOutPaiInfo = this.game.lastDiscardInfo;
        let outPlayer = this.game.playerMgr.getPlayerByServerPos(lastOutPaiInfo.outPos);
        if (outPlayer) {
            outPlayer.removeFromDiscard();
        }
    }

    /**
     * 玩家进行杠操作
     */
    handleGangCard(data: { rPos: number, info: ErmjType.PGangInfo }) {
        this.game.mjResult.saveGangData(data.rPos, data.info);

        // 保存数据
        let player = this.game.playerMgr.getPlayerByServerPos(data.rPos);
        if (player) {
            this.game.audioMgr.playGang(player.isMale);
            player.setPGangPai(data.info.pai, data.info.type);
        }

        // 点杠才有
        if (data.info.type === ErmjType.GangType.GANG_TYPE_SHINE) {
            let lastOutPaiInfo = this.game.lastDiscardInfo;
            let outPlayer = this.game.playerMgr.getPlayerByServerPos(lastOutPaiInfo.outPos);
            if (outPlayer) {
                outPlayer.removeFromDiscard();
            }
        }

        this.game.playAnimGang(player.getEffOptPos());
    }

    /**
     * 胡
     */
    handleHu(data: { rPoss: number, huPai: number }) {
        [data.rPoss].forEach(rPos => {
            let isZm = false;
            if (this.game.currOptPlayer === undefined) {
                isZm = true;
            } else if (this.game.currOptPlayer === rPos) {
                isZm = true;
            }
            let player = this.game.playerMgr.getPlayerByServerPos(rPos);
            player.setPlayerHu(data.huPai, isZm);

            if (!isZm) {
                let pos = this.game.lastDiscardPos;
                let outPlayer = this.game.playerMgr.getPlayerByServerPos(pos);
                outPlayer.setDiscardHuStatus(data.huPai);
            }
        });
        this.game.audioMgr.playComHu();

    }

    /**
     * 游戏结算
     */
    handleGameResult(data: { leftTime: number, huType: number[], results: ErmjType.GameResult[] }) {
        let changeScore = [];
        for (const r of data.results) {
            changeScore.push({ rPos: r.rPos, changeScore: +r.chgMoney })
        }
        this.handleChangeScore({
            type: data.huType || [],
            changeScore
        });

        for (let idx = 0; idx < this.game.playerMgr.playerCount; idx++) {
            let player = this.game.playerMgr.getPlayerByServerPos(idx)
            if (player) {
                player.clearWaitingTimer();
            }
        }

        this.game.setSelfHu();
        this.game.btnNew.active = false;
        this.game.mjTimer.setGameTicker(0);

        this.game.mjResult.prepareTime.node.active = false;
        this.game.mjResult.times = [this.game.oppDoubleCount.string, this.game.doubleCount.string];
        setTimeout(() => {
            this.game.mjResult.show(data.results, this.game.id);
            this.game.playerMgr.clearAllLeavePlayer();
        }, 2000);
    }

    protected handleCurrentGameInfo(data: stationData) {
        if (!this.game.isGaming) {
            return;
        }
        super.handleCurrentGameInfo(data);

        // 获取状态
        let isGamingStatus = false;// 是否在正常游戏中
        let isEndStatus = false;
        let isOutPaiStatus = false;
        let isOptStatus = false;
        switch (data.gameStatus) {
            case ErmjType.GameStatus.GAME_WAIT:
                console.log("当前状态 : 等待开始");
                return;
            case ErmjType.GameStatus.GAME_SEND_CARD:
                console.log("当前状态 : 发牌");
                break;
            case ErmjType.GameStatus.GAME_WAIT_USER_OUT_CARD:
                console.log("当前状态 : 出牌");
                isGamingStatus = true;
                isOutPaiStatus = true;
                break;
            case ErmjType.GameStatus.GAME_CHI_PENG_GANG_HU:
                console.log("当前状态 : 操作");
                isGamingStatus = true;
                isOptStatus = true;
                break;
            case ErmjType.GameStatus.GAME_ROUND_RESULT:
                console.log("当前状态 : 结算");
                isGamingStatus = true;
                isEndStatus = true;
                break;
            default:
                break;
        }

        // 把已离开玩家的信息还原到游戏中
        if (data.users) {
            for (let rPos = 0; rPos < data.users.length; rPos++) {
                let serverPlayer = this.game.playerMgr.getPlayerByServerPos(rPos);
                let realSeat = rPos - this.game.playerMgr.seatOffset;
                if (realSeat < 0) {
                    realSeat += data.users.length;
                }
                let clientPlayer = this.game.playerMgr.getPlayerBySeat(realSeat);
                if (!serverPlayer) {
                    // 玩家已离开
                    clientPlayer.init(this.game);
                    clientPlayer.serverPos = rPos;
                    clientPlayer.setLeave(true);
                    this.game.playerMgr.serverPlayers[rPos] = clientPlayer;
                }
            }
        }


        // 判断是否该自己操作
        let isTurnSelf = false;
        let currOptPlayer = undefined;
        if (data.curOptrPos !== undefined) {
            currOptPlayer = this.game.playerMgr.getPlayerByServerPos(data.curOptrPos);
            if (currOptPlayer && currOptPlayer.isMe) {
                isTurnSelf = true;
            }
        }

        // 不会变化的数据
        this.game.mjTimer.setGameTicker(data.leftTime);
        if (data.lastOutPairPos !== undefined) {
            let lastDiscardInfo: ErmjType.SaveDiscardInfo = {
                outPos: data.lastOutPairPos,
                outPaiVal: [data.lastOutPai]
            };
            this.game.lastDiscardInfo = lastDiscardInfo;
        }
        if (data.bankerStation !== undefined) {
            this.game.playerMgr.setPlayerDealer(data.bankerStation);
            if (data.remainPaiCount !== undefined)
                this.game.mjTimer.setRemainPaiTotal(data.remainPaiCount);
            if (data.scores !== undefined) {
                this.game.mjResult.changeScoreData = data.scores.concat();
                data.scores.forEach((changeScoreInfo: { type: number[], changeScore: ErmjType.ChangeScore[] }) => {
                    changeScoreInfo.changeScore.forEach(scoreInfo => {
                        let player = this.game.playerMgr.getPlayerByServerPos(scoreInfo.rPos);
                        if (player && player.balance) {
                            let changeScore = util.mul(scoreInfo.changeScore, this.game.baseScore);
                            player.balance = util.add(player.balance, changeScore).toNumber();
                            player.updateBalance();
                        }
                    });
                });
            }
        }

        // 玩家手牌信息
        let holdsValArr = data.handlePai;
        // 按客户端座位排序
        if (data.users) {
            data.users.sort((userA, userB) => {
                let realSeatA = userA.rPos - this.game.playerMgr.seatOffset;
                if (realSeatA < 0) {
                    realSeatA += data.users.length;
                }
                let realSeatB = userB.rPos - this.game.playerMgr.seatOffset;
                if (realSeatB < 0) {
                    realSeatB += data.users.length;
                }
                return realSeatA - realSeatB;
            });
            let savePlayerInfoArr = [];
            for (let seatIdx = 0; seatIdx < data.users.length; seatIdx++) {
                let userInfo = data.users[seatIdx];
                let player = this.game.playerMgr.getPlayerByServerPos(userInfo.rPos);
                let isSelf = player.isMe;
                if (userInfo) {
                    let saveInfo: ErmjType.PlayerInfo = {
                        isMale: player.isMale,
                        avatar: userInfo.avatar,
                        location: userInfo.location,
                        name: player ? player.playerName : "",
                        isMe: isSelf,
                        isDealer: data.bankerStation === userInfo.rPos,
                    }
                    savePlayerInfoArr[userInfo.rPos] = saveInfo;

                    // 金币房玩家离开
                    player.gender = userInfo.gender;
                    player.updateLocation(userInfo.location);
                    player.updateHead(userInfo.avatar);
                    player.balance = +userInfo.money;
                    player.updateBalance();
                    // 玩家重复进入消息会使balance为空
                }


                if (isSelf) {
                    // 显示自己牌
                    this.game.startGame(holdsValArr);
                    this.game.setQuanMen(data.quanFeng, userInfo.menFeng);
                }

                if (isGamingStatus) {
                    if (userInfo.isTing) {
                        player.baoTing();
                        if (isSelf) {
                            this.game.nodeBaoTingCover.active = true;
                        }
                    }

                    if (userInfo.queType !== undefined) {
                        let seat = player.seat;
                        this.game.mjTimer.setSuit(seat, userInfo.queType);
                        player.startGame();
                    }
                    if (userInfo.deskPai) {
                        player.quickSetPlayerDiscard(userInfo.deskPai, userInfo.paoIndex, (userInfo.rPos === data.lastOutPairPos));
                    }

                    // 从碰杠数据算出剩余手牌个数
                    if (userInfo.pgInfos) {
                        let pgInfos = userInfo.pgInfos;
                        if (pgInfos.length > 0) {
                            pgInfos.forEach(pgInfo => {
                                this.game.mjResult.saveGangData(userInfo.rPos, pgInfo);
                                player.quickSetPengGang(pgInfo.pai, pgInfo.type);
                            });
                        }
                    }

                    if (!isSelf) {
                        player.setHoldPais(data.nextHandlePai);
                    }

                    if (userInfo.userState !== undefined && userInfo.userState === ErmjType.UserState.USER_STATE_HU_PAI) {
                        // 从分数变化中算出是否自摸
                        let isZimo = false;
                        if (data.scores) {
                            let scores = data.scores;
                            scores.forEach(scoreInfo => {
                                if (scoreInfo.type[0] >= ErmjType.HU_TYPE_EX.HUPAI_HU_PAI) {
                                    let isZimoType = false;
                                    scoreInfo.type.forEach(typeIdx => {
                                        if (typeIdx === ErmjType.HU_TYPE_EX.HUPAI_ZI_MO) {
                                            isZimoType = true;
                                        }
                                    });
                                    if (isZimoType) {
                                        scoreInfo.changeScore.forEach(changeScoreInfo => {
                                            if ((changeScoreInfo.rPos === userInfo.rPos) && (changeScoreInfo.changeScore > 0)) {
                                                isZimo = true;
                                            }
                                        });
                                    }
                                }
                            });
                        }
                        player.quickSetPlayerHu(userInfo.huPai, isZimo);
                    }
                }
            }

            for (const u of data.users) {
                if (u.jiaBeiPaiPos) {
                    for (let i = 0; i < u.jiaBeiPaiPos.length; i++) {
                        let doubledPlayer = this.game.playerMgr.getPlayerByServerPos(u.jiaBeiPaiPos[i]);
                        doubledPlayer.doubled([{
                            paiPos: u.rPos,
                            pai: u.jiaBeiPais[i],
                        }]);

                    }
                    for (const jiaBei of u.jiaBeiPaiPos) {
                        this.game.double(u.rPos !== this.game.playerMgr.me.serverPos);
                    }
                }

                this.game.playerMgr.getPlayerByServerPos(u.rPos).tipJiaos();
            }

            this.game.mjResult.playerInfoData = savePlayerInfoArr;
        } else {
            this.game.startGame(holdsValArr);
        }

        if (isGamingStatus) {
            // 减去庄家多的一张牌
            this.game.playerMgr.getPlayerByServerPos(data.bankerStation).setPaiRemainNum(1);
        }

        // 结算
        if (isEndStatus) {
            let changeScore = [];
            for (const r of data.users) {
                changeScore.push({ rPos: r.rPos, changeScore: +r.chgMoney })
            }
            this.handleChangeScore({
                type: data.huType || [],
                changeScore
            });

            let results: ErmjType.GameResult[] = [];
            for (let index = 0; index < data.users.length; index++) {
                let userInfo = data.users[index];
                let handlePai = userInfo.handlePai;

                let resultInfo: ErmjType.GameResult = { handlePai: handlePai.concat(), rPos: userInfo.rPos, huPai: 0, chgMoney: userInfo.chgMoney };
                if (userInfo.userState !== undefined && userInfo.userState === ErmjType.UserState.USER_STATE_HU_PAI)
                    resultInfo.huPai = userInfo.huPai;
                results.push(resultInfo);
            }
            this.game.mjResult.show(results);
        }

        // 玩家操作
        if ((isOutPaiStatus || isOptStatus) && currOptPlayer) {
            if (data.curInPai) {
                currOptPlayer.addHoldsPai(data.curInPai);
            }

            if (isOptStatus) {
                cc.log("isOptStatus1");
                this.handlePengGangHu({ ...data.pghInfo, leftTime: data.leftTime });
                let lastOutPlayer = this.game.playerMgr.getPlayerByServerPos(data.lastOutPairPos);
                if (lastOutPlayer) {
                    this.game.mjTimer.setWait(data.leftTime, lastOutPlayer.seat);
                }
            } else {
                cc.log("isOptStatus2");
                this.game.setWaitOutPai(data.curOptrPos, data.leftTime);
                this.game.mjTimer.setWait(data.leftTime, currOptPlayer.seat);
            }
        }

        this.game.updateUI();
    }

    ///////////////////////////////send/////////////////////////////////
    /**
     * 打牌
     * @param paiVal
     */
    sendOutPai(paiVal: number, ting = 0) {
        pomelo.notify("game.ERMJHandler.userOutPai", { pai: paiVal, tingPai: ting });
        if (this.game.isTrusteeship === 2) {
            this.game.isTrusteeship = 0;
        } else {
            this.game.isTrusteeship = 1;
        }
    }
    sendPeng() {
        pomelo.notify("game.ERMJHandler.userPeng", {});
    }
    sendGang(gangVal: number) {
        cc.log("send gang = " + gangVal);
        pomelo.notify("game.ERMJHandler.userGang", { pai: gangVal });
    }
    sendChi(chiVal: number) {
        cc.log("send chi = " + chiVal);
        pomelo.notify("game.ERMJHandler.userChi", { pai: chiVal });
    }
    sendHu() {
        if (this.game.isGaming) {
            pomelo.notify("game.ERMJHandler.userHu", {});
            this.game.setSelfHu();
        }
    }
    sendPass() {
        pomelo.notify("game.ERMJHandler.userPass", {});
    }

}
