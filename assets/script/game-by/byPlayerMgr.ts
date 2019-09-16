import BYGame from "./byGame";
import PlayerMgr from "../game-share/playerMgr";
import BYPlayer from "./byPlayer";
import { massive } from "./massive";
import * as util from "../common/util";
interface userInfo {
    money: string,
    avatar: number,
    gender: number,
    pos: number,
    location: string,
}


const { ccclass, property } = cc._decorator;

@ccclass
export default class BYPlayerMgr extends PlayerMgr<BYPlayer>  {
    playerCount = 4;

    public mySeat: number = undefined;    // 自己在当前游戏中的位置

    constructor(protected game: BYGame) {
        super(game);
    }

    clearCards() { }

    get me() {
        return this.playerArr[this.mySeat];
    }

    // 游戏中时  其他user的进入时的处理
    setPlayerEnter(data: any, reCome = false, ani = false) {
        cc.warn("setplayer enter ", data);
        this.playerCount = 4;
        let seat = this.toGameLocation(data.pos);
        let realSeat = data.pos - this.seatOffset;
        if (realSeat < 0) {
            realSeat += this.playerCount;
        }
        let p = this.getPlayerBySeat(seat);
        if (!p) {
            cc.warn("setplayer enter p is null ");
            return;
        }

        p.init(this.game);
        p.updateId(1);
        p.changeLevelLable(1);
        p.showOrHideGun(true);
        p.changeCoinLabelById(parseFloat(data.money));
        p.changeLocation(data.location);
        p.changeGunSp(1);
        //-------------------------------
        p.serverPos = data.pos;
        this.serverPlayers[data.pos] = p;
    }

    // 处理自己的信息
    handleMyInfo(seat: number) {
        if (seat == 0 || seat == 1) {
            this.isRotate = false;
        } else {
            seat -= 2;
            this.isRotate = true;
        }
        if (this.isRotate) {
            this.game.dieLayer.rotation = 180;
            this.game.fishLayer.rotation = 180;
        }
        this.mySeat = seat;
        this.game.byAnimMgr.showThisIsGun(seat);
        for (let i = 0; i < 4; i++) {
            let p = this.getPlayerBySeat(i);
            if (p) {
                p.showOrHideGun(false);
                p.showWaitJoin();
            }
        }
        this.game.initMyTouchPos();
        let p = this.getPlayerBySeat(seat);
        if (p) {
            p.showMyGunBt();
        }
    }

    // 处理进入房间时  所有USER的信息
    handleUserInfo(users: userInfo[]) {

        for (let i = 0; i < users.length; i++) {
            let user = users[i];
            let seat = this.toGameLocation(user.pos);//is rpos
            let p = this.getPlayerBySeat(seat);
            if (p) {
                p.changeLocation(user.location);
                p.showOrHideGun(true);
            }
            p.emptySeat.active = false;
        }

    }

    // 把服务器中的位置  变成在本地游戏中的真实位置
    toGameLocation(rpos: number) {
        if (this.isRotate) {
            if (rpos < 2) {
                return rpos + 2;
            } else {
                return rpos - 2;
            }
        } else {
            return rpos;
        }
    }

    initPlayerIsLock() {
        this.playerArr.forEach(p => {
            if (p) {
                p.isLock = 0;
            }
        });
    }

    initPlayerIsAuto() {
        this.playerArr.forEach(p => {
            if (p) {
                p.isAuto = 0;
            }
        });
    }

    playerAimCircleRotate() {
        this.playerArr.forEach(p => {
            if (p) {
                p.aimCircleRotate();
            }
        });
    }




}
