import GameMsg from "../game-share/gameMsg";
import QHBGame from "./qhbGame";
import { add, showTip, sub } from "../common/util";
import { PlayerInfo } from "./qhbPlayerMgr";

let pomelo = window.pomelo;
const {ccclass, property} = cc._decorator;

export enum GameStatus {
    FREE,
    GRAB,
    BALANCE,
    END,
}

export interface redBagInfo {
    pos: number,
    money: string,
    boomNo: number,
}

export interface resultPlayerInfo {
    pos: number,
    isWinner: number,
    isBoom: number,
    grabMoney: string,
    chgMoney:string,
    totalSendMoney: string,
    noBoomCnt: number,
    isSending: number,
    isMaxHB: number,
    payForMaster?: string,
    payForMasterSubTax?: string,
    lastMoney?: string,
}

export interface gameInfo {
    status: number,
    leftTime: number,
    curHongBao: redBagInfo,
    userInfo: PlayerInfo[],
    hongbaoList: redBagInfo[]
}

@ccclass
export default class QHBMsg extends GameMsg {
    loadGameHandler = "game.QHBHandler.loadGameInfo";
    notifyCurrentGame = "qhb_loadGameInfo";
    protected game: QHBGame;

    protected addExtraListeners(): void {
        pomelo.on("userMoney", this.handleUserMoney.bind(this));
        pomelo.on("qhb_changeStatus", this.updateGameStatus.bind(this));
        pomelo.on("startFreeTick", this.startFreeTick.bind(this));
        pomelo.on("qhb_curHongBaoInfo", this.setCurRedBagInfo.bind(this));
        pomelo.on("qhb_baoHongBao", this.refreshRedBagList.bind(this));
        pomelo.on("qhb_grabHongBao", this.refreshGrabRedBagPlayerList.bind(this));
        pomelo.on("qhb_doBalance", this.gameResult.bind(this));
    }

    protected removeExtraListeners(): void {
        pomelo.off("userMoney");
        pomelo.off("qhb_changeStatus");
        pomelo.off("startFreeTick");
        pomelo.off("qhb_curHongBaoInfo");
        pomelo.off("qhb_baoHongBao");
        pomelo.off("qhb_grabHongBao");
        pomelo.off("qhb_doBalance");
    }

    private handleUserMoney = (data: { money: string }) => {
        // cc.log("玩家金币变化", data);
        // 玩家在发红包队列中时，已经扣掉的金币，服务器并没有数据库结算，而当他抢的时候又会返回，此时特殊处理
        let me = this.game.playerMgr.me;
        if (this.game.isWaitingList) {
            if (this.game.autoSendMoney) { // 处理玩家抢了红包推出游戏再进当局没有结束autoSendMoney为空报错的情况
                me.balance = sub(data.money, this.game.autoSendMoney).toNumber();
            }
        } else {
            me.balance = add(data.money, 0).toNumber();
        }
        me.updateBets(0, me.balance, true);
    }

    handleStartGame = (data: { gameNo: string }) => {
        // cc.log("游戏开始", data);
        this.game.labGameId.string = data.gameNo;
    }

    /**
    * 开局
    */
    private startFreeTick() {
        // cc.log("----------startFreeTick------------- ");
        this.game.switchRedBag();
    }

    /**
    * 设置当前红包信息
    */
    private setCurRedBagInfo(data: { status: number, leftTime: number, curHB: redBagInfo, hongBaoList: redBagInfo[]}) {
        // cc.log("设置当前红包信息", data);
        this.game.setCurRedBagInfo(data);
        this.game.setTimer(data.leftTime);

        if (this.game.autoGrab) {
            let curMoney = data.curHB.money;
            // let curBoomNo = data.curHB.boomNo;
            let b1 = this.game.checkCanGrab(curMoney)
            if (b1) { // && this.game.checkRedBagCanGrab(curMoney, curBoomNo)
                let pos = this.game.playerMgr.getMePos();
                this.sendGrabRedBag(pos);
            } else {
                showTip("亲，金币不足自动抢已取消~");
                this.game.cancelAutoGrab();
            }
        }

        if (this.game.autoSend && !this.game.isWaitingList) {
            if (!this.game.checkMoneyEnoughAuto(this.game.autoSendMoney)) {
                this.game.cancelAutoSend();
                showTip("金额不足，自动发红包已取消～");
                return;
            }
            this.sendPackRedBag(this.game.autoSendMoney, this.game.autoSendBoomNo);
        }
    }

    /**
    * 刷新抢中红包玩家列表
    */
    private refreshGrabRedBagPlayerList(data: PlayerInfo) {
        // cc.log("刷新抢中红包玩家列表", data);
        this.game.refreshGrabPlayerList(data);
    }

    /**
    * 刷新待发红包列表
    */
    private refreshRedBagList(data: { pos: number, hongBao: redBagInfo }) {
        // cc.log("刷新待发红包列表", data);
        // 收到最新的一个红包信息，添加进入红包待发红包列表
        this.game.redBagList.push(data.hongBao);
        this.game.refreshWaitingRedBagList(true, data.hongBao);
        if (data.hongBao.pos === this.game.playerMgr.getMePos()) {
            this.game.isWaitingList = true;
            let me = this.game.playerMgr.getMySelf();
            let chgMoney = `-${this.game.autoSendMoney}`;
            me.refreshMoney(+chgMoney);
            this.game.redBagWaitingAni(true, this.game.checkMyWaitingRound())
        }
    }

    /**
    * 更新游戏状态
    */
    private updateGameStatus(data: { status: number, leftTime: number}) {
        // cc.log("更新游戏状态", data);
        this.game.changeState(data.status);
    }

    /**
    * 游戏结算
    */
    private gameResult(data: { status: number, leftTime: number, userInfo: resultPlayerInfo[] }) {
        // cc.log("游戏结算", data);
        if (data.userInfo) {
            this.game.gameResult(data.userInfo);
            data.userInfo.forEach((info) => {
                // 同步下注额
                this.game.playerMgr.updateTotalBets(info.pos, +info.totalSendMoney, info.noBoomCnt);
            })
        }
    }

    /**
    * 断线重连
    */

    protected handleCurrentGameInfo(data: gameInfo) {
        // cc.log("-------------------handleCurrentGameInfo------------------------", data);
        super.handleCurrentGameInfo(data);
        this.updateGameStatus(data);
        if (data.curHongBao) {
            let rb = data.curHongBao;
            this.game.bankerPos = rb.pos;
            this.game.curRedBagInfo = rb;
            let p = this.game.playerMgr.getInfoByPos(rb.pos);
            let redBag = this.game.getCurRedBagByOrder(0);
            redBag.setRedBagInfo(p, rb);
        }
        if (data.hongbaoList) {
            this.game.redBagList = data.hongbaoList;
        }
        if (data.userInfo) {
            data.userInfo.forEach((userInfo) => {
                if (userInfo.isGrabbed) {
                    this.game.refreshGrabPlayerList(userInfo);
                }
                // 同步下注额
                this.game.playerMgr.updateTotalBets(userInfo.pos, userInfo.totalSendMoney, userInfo.noBoomCnt);
            })
        }
    }


    /**
    * 包红包
    */
    sendPackRedBag(money: string, boomNo: number) {
        pomelo.notify("game.QHBHandler.baoHongBao", { money: money, boomNo: boomNo });
    }

    /**
    * 抢红包
    */
    sendGrabRedBag(pos: number) {
        pomelo.notify("game.QHBHandler.grabHongBao", {pos: pos});
    }
}
