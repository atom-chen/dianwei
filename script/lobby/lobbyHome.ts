import BaseLobbyUi from "./baseLobbyUi";
import Lobby from './lobby';
import { GameId } from "../game-share/game";
import { setClipboard, showTip } from "../common/util";
import { User } from "../common/user";
import QRCode from "./qRCode";
import g from "../g";
import ItemNames from "../common/itemNames";

const HIDE_GAME_NUM = 6;
const VIEW_TURN_INTERVAL = 5;
const { ccclass, property } = cc._decorator;

@ccclass
export default class LobbyHome extends BaseLobbyUi {
    @property(cc.ScrollView)
    private svGame: cc.ScrollView = undefined;

    @property(cc.Node)
    private nodeGames: cc.Node = undefined;

    @property(cc.PageView)
    private pageView: cc.PageView = undefined;

    @property(cc.Node)
    private nodePopularize: cc.Node = undefined;// 全民代理

    @property(cc.Node)
    private nodeGoToOffical: cc.Node = undefined;//保存地址，修复游戏

    @property(cc.Node)
    private nodeEvents: cc.Node = undefined; // 联运活动

    @property(cc.Node)
    private nodeArrowL: cc.Node = undefined;

    @property(cc.Node)
    private nodeArrowR: cc.Node = undefined;

    @property(cc.Scrollbar)
    private scrollMain: cc.Scrollbar = undefined;

    @property(QRCode)
    private qRCode: QRCode = undefined;

    private _lobby: Lobby;
    private _turnView: boolean = true;
    private _turnTime: number = 0;


    onLoad() {
        super.onLoad();
        this.initGameList();

        let x = this.svGame.getScrollOffset().x;
        let max = this.svGame.getMaxScrollOffset().x;
        this.nodeArrowL.active = x > 0;
        this.nodeArrowR.active = x < -max;

        this.pageView.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart);
        this.pageView.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd);
        this.pageView.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd);
    }

    onTouchStart = (event: cc.Event.EventTouch) => {
        this._turnView = false;
    }

    onTouchEnd = (event: cc.Event.EventTouch) => {
        this._turnView = true;
    }

    init(lobby: Lobby) {
        this._lobby = lobby;
    }

    private _scrollToIndex = 0;
    start() {
        this.show();

        let nodePages = this.pageView.getPages();
        this.schedule(() => {
            if (!this._turnView) {
                this._turnTime = 0;
                return;
            };

            this._turnTime += 1;
            if (this._turnTime % VIEW_TURN_INTERVAL === 0) {
                let nextPageIdx = this.pageView.getCurrentPageIndex() + 1;
                if (nextPageIdx >= nodePages.length) {
                    nextPageIdx = 0;
                }
                this.pageView.scrollToPage(nextPageIdx, 2);
                this._scrollToIndex = nextPageIdx;
            }
        }, 1);

        if (User.instance.shieldStatus.channelApprentice) {
            this.pageView.removePage(this.nodePopularize);
        }

        this.showOrHideEventPage(g.eventsActive);
    }

    setQRContent() {
        this.qRCode.setContent(g.serviceCfg.web);
    }

    onDisable() {
        this.pageView.scrollToPage(this._scrollToIndex, 0);
    }

    private initGameList() {
        if (!g.saveGameList) {
            return;
        }

        for (const node of this.nodeGames.children) {
            node.active = false;
            cc.log(node.name)
            let wait = node.getChildByName("wait");
            if (wait) {
                wait.active = false;
            }
        }

        let games = g.saveGameList;
        games.sort((a, b) => { return a.idx - b.idx });
        for (let idx = 0; idx < games.length; idx++) {
            let gid = games[idx].gid;
            let node = this.nodeGames.getChildByName(gid);
            if (node) {
                node.active = true;
                node.setSiblingIndex(idx);
                if (!games[idx].active) {
                    // 敬请期待
                    node.getComponent(cc.Button).interactable = false;
                    node.color = cc.hexToColor("#706F6F");
                    node.opacity = 200;
                    let anim = node.getChildByName(gid);
                    if (anim) {
                        // anim.active = false;
                        let anicom = anim.getComponent(cc.Animation);
                        anicom.playOnLoad = false;
                        anicom.pause();
                        anim.opacity = 180;
                    }
                    let wait = node.getChildByName("wait");
                    if (wait) {
                        wait.active = true;
                    }
                }
            }
        }
        // 低于6个游戏就不用滑动
        if (this.nodeGames.childrenCount <= HIDE_GAME_NUM) {
            this.svGame.enabled = false;
        }
        //引导
        if (!cc.sys.localStorage.getItem(ItemNames.guideState)) {
            cc.sys.localStorage.setItem(ItemNames.guideState, 1);
            let dzNode = this.nodeGames.getChildByName(GameId.DDZ);
            let dzArrow = dzNode.getChildByName('xsydGame');
            dzArrow.active = true;
        }
    }

    showOrHideEventPage(isShow: boolean) {
        if (isShow) {
            let content = this.pageView.node.getChildByName("view").getChildByName("content");
            let child = content.getChildByName("ad4")
            if (child) this.pageView.removePage(child);
            this.nodeEvents.removeFromParent(false);
            this.nodeEvents.active = true;
            this.pageView.addPage(this.nodeEvents);
        }
    }
    //后台配置以/结尾则组合channel，如http://baidu.com/；如果不是则不组合，如http://baidu.com/index.html
    private onClickCopy() {
        if (setClipboard(g.serviceCfg.web)) showTip("官网地址复制成功!");
    }

    private onClickGotoOfficial() {
        cc.sys.openURL(`${g.serviceCfg.web}?_intro=1`);
    }

    private onClickPopularize() {
        this._lobby.onClickPopularize();
    }

    private onClickWelfare() {
        this._lobby.onClickWelfare();
    }

    private async onClickGame(event: any, data: GameId) {
        if (data === GameId.DDZ) {
            event.target.getChildByName('xsydGame').active = false;
        }
        this._lobby.showGameStage(data);
    }

    private toActiveL: boolean;
    private toActiveR: boolean;
    private onScrollList(s: cc.ScrollView) {
        let now = s.getScrollOffset();
        let max = s.getMaxScrollOffset();
        if (this.toActiveL !== undefined && this.toActiveL !== now.x < 0) {
            this.nodeArrowL.stopAllActions();
        }
        if (this.toActiveR !== undefined && this.toActiveR !== now.x > -max.x) {
            this.nodeArrowR.stopAllActions();
        }
        this.toActiveL = now.x < 0;
        this.toActiveR = now.x > -max.x;
        this.switchArrow(this.nodeArrowL, this.toActiveL);
        this.switchArrow(this.nodeArrowR, this.toActiveR);
    }
    private onClickLArrow() {
        this.svGame.scrollToLeft(0.1);
        this.switchArrow(this.nodeArrowL, false);
        this.switchArrow(this.nodeArrowR, true);
    }
    private onClickRArrow() {
        this.svGame.scrollToRight(0.1);
        this.switchArrow(this.nodeArrowL, true);
        this.switchArrow(this.nodeArrowR, false);
    }
    private switchArrow(arrow: cc.Node, active: boolean) {
        if (active) {
            arrow.active = true;
        }
        arrow.runAction(cc.sequence(
            cc.fadeTo(0.2, active ? 255 : 0),
            cc.callFunc(() => {
                if (!active) {
                    arrow.active = false;
                }
            })
        ));
    }
}
