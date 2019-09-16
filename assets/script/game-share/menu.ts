import Game from "./game";
import * as util from "../common/util";
import Confirm from "../common/confirm";
import GameHelp from "./gameHelp";
import { Setting } from "../lobby/setting";
import SlideBox from "./slideBox";
import PopActionBox from '../lobby/popActionBox'
const { ccclass, property } = cc._decorator;

const typeName = "cardTypes";

@ccclass
export default class Menu extends cc.Component {

    @property(cc.Button)
    protected btnBack: cc.Button = undefined;

    @property(cc.Button)
    protected btnList: cc.Button = undefined;

    @property(cc.Button)
    protected btnSetting: cc.Button = undefined;

    @property(cc.Button)
    protected btnChangeDesk: cc.Button = undefined;

    @property(cc.Button)
    protected btnHelp: cc.Button = undefined;

    @property(cc.Button)
    protected btnCards: cc.Button = undefined;

    @property(cc.Sprite)
    protected bg: cc.Sprite = undefined;

    @property(cc.Prefab)
    private gameHelp: cc.Prefab = undefined;

    @property(cc.Prefab)
    private setting: cc.Prefab = undefined;

    @property
    private disableChat: boolean = false;

    private game: Game;
    private _bgPlayingAnim: boolean;
    private _chatPlayerAnim: boolean;
    private _chatPos: cc.Vec2;

    init(game: Game) {
        this.game = game;
    }

    onEnable() {
        // init logic
        this.bg.node.active = false;
        this.btnBack.node.active = true;
        this.btnList.node.active = true;
    }
    onBackClick() {
        let str: string | undefined;
        let me = this.game.playerMgr.me;
        if (this.game.isGaming && me && !me.isLooker) {
            str = "亲，退出后会被托管至本局结束，确定要退出吗？";
        }
        if (str) {
            let confirm = util.showConfirm(str, "确定", "取消");
            confirm.okFunc = function () {
                util.showLoading("正在退出...");
                window.pomelo.request("lobby.lobbyHandler.leaveGame", undefined, function () {
                    confirm.close();
                });
            };
        } else {
            util.showLoading("正在退出...");
            window.pomelo.request("lobby.lobbyHandler.leaveGame", undefined, () => { });
        }
    }
    private onListClick() {
        if (this._bgPlayingAnim) {
            return;
        }
        this._bgPlayingAnim = true;
        let node = this.bg.node;
        if (node.active) {
            node.runAction(cc.sequence(cc.fadeOut(0.2), cc.callFunc(() => {
                node.active = false;
                this._bgPlayingAnim = false;
            })));
        } else {
            node.active = true;
            node.runAction(cc.sequence(cc.fadeIn(0.2), cc.callFunc(() => {
                this._bgPlayingAnim = false;
            })));
        }
    }
    private onSettingClick() {
        let node = util.instantiate(this.setting);
        let canvas = cc.find("Canvas");
        canvas.addChild(node);
        node.active = true;
        node.setPosition(0, 0);
        let setting = node.getComponent(Setting);
        setting.hideReLogin();
        setting.setGame(this.game);
    }
    private onChangeClick() {
        this.game.changeRoom();
        this.onListClick();
    }
    private onHelpClick() {
        let node = util.instantiate(this.gameHelp);
        let canvas = cc.find("Canvas");
        canvas.addChild(node);
        node.active = true;
        node.setPosition(0, 0);
        let gameHelp: GameHelp = node.getComponent(GameHelp);
        gameHelp.showContent(this.game.helpDesc);
    }

    private seeingCard = false;
    private onCardsClick() {
        if (this.seeingCard) {
            return;
        }
        if (!this.game.cardTypesBox) {
            util.showTip("无牌型");
            return
        };
        this.seeingCard = true;
        let canvas = cc.find("Canvas");
        let node = canvas.getChildByName(typeName);
        if (!node) {
            util.showLoading("加载牌型");
            node = util.instantiate(this.game.cardTypesBox);
            node.name = typeName;
            canvas.addChild(node);
            node.active = true;
            node.once("open", () => {
                util.hideLoading();
                this.seeingCard = false;
            });
        } else {
            node.scale = 1;
            this.seeingCard = false;
            let box: any = node.getComponent(SlideBox)
            if (box)
                box.openBox()

        }
    }

    //按钮状态
    updateBtnState() {
        //按钮可点状态
        let me = this.game.playerMgr.me;
        if (me) {
            if (me.isLooker) {
                this.btnChangeDesk.node.opacity = 255;
                this.btnChangeDesk.interactable = true;
                return;
            }
        }
        if (this.game.isGaming) {
            this.btnChangeDesk.node.opacity = 55;
            this.btnChangeDesk.interactable = false;
        } else {
            this.btnChangeDesk.node.opacity = 255;
            this.btnChangeDesk.interactable = true;
        }
    }

    hideChangeBtn() {
        this.btnChangeDesk.node.opacity = 55;
        this.btnChangeDesk.interactable = false;
    }
}
