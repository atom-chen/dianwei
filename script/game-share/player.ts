import { Gender } from "../common/user";
import * as util from "../common/util";
import Game from "./game";
const { ccclass, property } = cc._decorator;

export enum PlayerStates {
    UNREADY,
    READY,
    STARTED,
    RESULT,
    END,
    OFFLINE,
}

@ccclass
export default abstract class Player extends cc.Component {
    // ui
    @property(cc.Sprite)
    protected spriteAvatar: cc.Sprite = undefined;

    @property(cc.Sprite)
    protected spriteDealer: cc.Sprite = undefined;

    @property(cc.Label)
    protected lblLocation: cc.Label = undefined;

    @property(cc.Sprite)
    protected spriteBalanceIcon: cc.Sprite = undefined;

    @property(cc.Label)
    protected lblBalance: cc.Label = undefined;

    @property(cc.Label)
    protected lblGrabs: cc.Label = undefined;

    @property(cc.Node)
    protected nodeNoGrab: cc.Node = undefined;

    @property(cc.Label)
    protected lblBets: cc.Label = undefined;



    //data
    game: Game;
    serverPos: number;//服务器端玩家的次序
    uid = 0;//user id
    playerName?: string;//名字
    gender?: Gender;//性别
    seat: number;
    /**
     * 是不是男人
     *
     * @readonly
     * @memberof Player
     */
    get isMale() {
        return this.gender === Gender.MALE;
    }
    location?: string;//地理位置
    avatar: number;//头像
    protected money?: number;//金币
    get gameMoney() {
        return this.money;
    }
    get balance() {
        return this.money;
    }
    set balance(value: number | undefined) {
        if (typeof value !== "number" || isNaN(value)) {
            return;
        }
        this.money = value;
    }
    isDealer: boolean;//庄家
    /**
     * 是否为自己
     *
     * @readonly
     * @memberof Player
     */
    get isMe() {
        return this.seat === 0;
    };
    /**
     * 是否为空座位
     *
     * @readonly
     * @memberof Player
     */
    get isEmpty() {
        return !this || !this.uid;
    }

    //obj
    x = 0;
    y = 0;
    state: number;//玩家状态
    /**
     * 准备好了
     *
     * @readonly
     * @memberof Player
     */
    get isReady() {
        return this.state === PlayerStates.READY;
    }
    /**
     * 是否为旁观者
     *
     * @readonly
     * @memberof Player
     */
    get isLooker() {
        if (this.state && this.state !== PlayerStates.UNREADY) {
            return false;
        }
        return true;
    }

    onLoad() {
        // init logic
        this.x = this.node.x;
        this.y = this.node.y;


    }

    init(game: Game) {
        this.game = game;
        this.uid = 0;
        this.money = undefined;
        this.state = PlayerStates.UNREADY;
        this.show();
    }

    updateName(name: string = "") {
        this.playerName = name;
        if (this.lblLocation) {
            this.lblLocation.string = name;
        }
    }

    updateLocation(location: string = "") {
        this.location = util.parseLocation(location);
        if (this.lblLocation) {
            if (this.location) {
                this.lblLocation.string = this.location;
            } else {
                this.lblLocation.string = "--";
            }
        }
    }

    hide() {
        this.node.active = false;
    }

    show() {
        this.node.active = true;
    }
    //入场动画
    enterAni(doAnim = true) {
        this.show();
        if (doAnim) {
            let destX = 2 * this.x;
            let destY = 2 * this.y;
            this.node.stopAllActions();
            this.show();
            this.node.setPosition(destX, destY);
            this.node.runAction(cc.moveTo(0.3, this.x, this.y).easing(cc.easeQuadraticActionOut()));
        }
    }
    leaveHideOthers() { }
    //离场动画
    leaveAni() {
        let destX = 2 * this.x;
        let destY = 2 * this.y;
        this.node.stopAllActions();
        this.node.runAction(cc.sequence(cc.moveTo(0.3, destX, destY), cc.callFunc(this.hide, this), cc.moveTo(0, this.x, this.y)));
    }

    clear() {
        this.init(this.game);
        this.updateLocation();
        this.updateHead(-1);
        this.changeState(PlayerStates.UNREADY);
    }

    updateId(id: number) {
        this.uid = id;
    }


    updateBalance() {
        if (this.lblBalance && this.lblBalance.isValid) {
            if (this.balance !== undefined) {
                this.lblBalance.string = util.toCNMoney(this.balance.toString());
            } else {
                this.lblBalance.string = "--";
            }
        }
        if (this.spriteBalanceIcon) {
            this.spriteBalanceIcon.node.active = true;
        }
    }

    updateMoney(money?: number | string) {
        if (money === undefined) {
            this.money = undefined;
        } else if (!isNaN(+money)) {
            this.money = +money;
        }
        this.updateBalance();
    }

    updateHead(ava: number): void {
        if (this.avatar !== ava) {
            this.avatar = ava;
            if (!this.spriteAvatar) {
                return;
            }
            let node = this.spriteAvatar.node;
            node.stopAllActions();
            node.runAction(cc.sequence(
                cc.fadeOut(0.2),
                cc.callFunc(() => {
                    this.spriteAvatar.spriteFrame = util.getAvatar(this.isMale, this.avatar);
                    let opacity = this.isLooker ? 127 : 255;
                    node.runAction(cc.fadeTo(0.2, opacity));
                })
            ))
        }
    }

    updateLookerView() {
        if (this.isLooker) {
            this.node.opacity = 125;
        } else {
            this.node.opacity = 255;
        }
    }

    abstract changeState(state: PlayerStates): void;

    release() {
        this.node.destroy(); // 由于 player 是每次new playerMgr 都会重新生成的，所以销毁掉
    }


    //向上飘字
    showGetAndLost(data: { get?: string; lost?: string }) {
        let container = new cc.Node();
        container.name = "container";
        let toBox = this.spriteAvatar.node.parent;
        let comp = container.addComponent(cc.Layout);
        comp.type = cc.Layout.Type.VERTICAL;
        comp.resizeMode = cc.Layout.ResizeMode.CONTAINER;
        comp.spacingY = - 30;
        let lost = data.lost;
        let get = data.get;
        if (lost && !get) {
            let labelTax = util.instantiate(this.game.prefabLabelTax);
            let label = labelTax.getComponentInChildren(cc.Label);
            if (label) {
                label.string = lost;
            }
            container.addChild(labelTax);
            labelTax.x = 0;
        }
        if (get) {
            let labelWin = util.instantiate(this.game.prefabLabelWin);
            let label = labelWin.getComponentInChildren(cc.Label);
            if (label) {
                label.string = get;
            }
            container.addChild(labelWin);
            labelWin.x = 0;
        }
        toBox.addChild(container);
        container.runAction(cc.sequence(
            cc.moveBy(1.5, 0, 50).easing(cc.easeQuadraticActionOut()),
            cc.fadeOut(1),
            cc.callFunc(container.destroy.bind(container))
        ));
        this.updateBalance();
        return new Promise(resolve => {
            this.scheduleOnce(resolve, 0.5);
        });
    }
}
