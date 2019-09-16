import { MatchInfo } from "./lobbyIface";
import StageRes from "./stageRes";
import BaseLobbyUi from "./baseLobbyUi";
import { GameId } from "../game-share/game";
import { showTip, showLoading, hideLoading } from '../common/util';
import { ErrCodes } from '../common/code';
import g from "../g";
import Lobby from "./lobby";
import { User } from "../common/user";
import * as util from "../common/util";
import ItemNames from "../common/itemNames";
const { ccclass, property } = cc._decorator;

@ccclass
export default class Stage extends BaseLobbyUi {
    @property({ type: cc.Node, override: true })
    nodeLeft: cc.Node = undefined;

    @property({ type: cc.Node, override: true })
    nodeRight: cc.Node = undefined;


    @property(cc.Label)
    labNoTips: cc.Label = undefined;

    @property(cc.ScrollView)
    stageLists: cc.ScrollView = undefined;

    @property(cc.Layout)
    stageContent: cc.Layout = undefined;

    @property(cc.Node)
    nodeTop: cc.Node = undefined;

    @property(cc.Node)
    nodeTitle: cc.Node = undefined;

    @property(cc.Prefab)
    preStage: cc.Prefab = undefined;

    @property([cc.SpriteFrame])
    sfTitle: cc.SpriteFrame[] = [];

    private _stageRes: StageRes;
    private gameId: GameId;

    get stageRes() {
        if (!this._stageRes) {
            this._stageRes = util.instantiate(this.preStage).getComponent(StageRes);
        }
        return this._stageRes;
    }

    onLoad() {
        super.onLoad();
        this.nodeTop.active = false;
        this.labNoTips.node.active = false;
    }

    async beforeShow(gameID: GameId) {
        this.gameId = gameID;
        showLoading("加载房间列表");
        let ok = await this.createList();
        hideLoading();
        return ok;
    }

    show() {
        super.show();
        let duration = 0.5;
        this.nodeTop.active = true;
        this.nodeTop.opacity = 0;
        this.nodeTop.runAction(cc.fadeIn(duration));

        let sfTitle = this.sfTitle;
        let sf = sfTitle[0];
        if (this.gameId === GameId.JH) {
            sf = sfTitle[0];
        } else if (this.gameId === GameId.QZNN) {
            sf = sfTitle[1];
        } else if (this.gameId === GameId.ERMJ) {
            sf = sfTitle[2];
        } else if (this.gameId === GameId.BRNN) {
            sf = sfTitle[3];
        } else if (this.gameId === GameId.DDZ) {
            sf = sfTitle[4];
        } else if (this.gameId === GameId.BY) {
            sf = sfTitle[5];
        } else if (this.gameId === GameId.PDK) {
            sf = sfTitle[6];
        } else if (this.gameId === GameId.JDNN) {
            sf = sfTitle[7];
        } else if (this.gameId === GameId.DZPK) {
            sf = sfTitle[8];
        } else if(this.gameId === GameId.QHB) {
            sf = sfTitle[9];
        }
        this.nodeTitle.getComponent(cc.Sprite).spriteFrame = sf;
    }

    hide() {
        super.hide();
        this.nodeTop.active = false;
    }

    async createList() {
        let matches = g.saveGameRoomList[this.gameId];
        if (!matches) {
            matches = await Stage.getMatchList(this.gameId);
            if (!matches) return;
            g.saveGameRoomList[this.gameId] = matches;
        }
        return new Promise((resolve: (ok: boolean) => void) => {
            this.labNoTips.node.active = false;
            this.labNoTips.node.active = !matches || matches.length === 0;

            let lobby = cc.find("lobby");
            let listView = this.stageLists;
            listView.node.active = true;
            listView.content.removeAllChildren();
            if (matches.length === 1) {
                this.stageContent.paddingLeft = 388;
                listView.node.x = 0;
            } else if (matches.length === 2) {
                this.stageContent.paddingLeft = 100;
                listView.node.x = 130;
                this.stageContent.spacingX = 100
            }
            else if (matches.length === 3) {
                this.stageContent.paddingLeft = 10;
                listView.node.x = 80;
                this.stageContent.spacingX = 80
            } else if (matches.length === 4) {
                this.stageContent.paddingLeft = 10;
                listView.node.x = 10;
                this.stageContent.spacingX = 20;
            }

            if (this.gameId === GameId.BY) {
                this.stageContent.paddingLeft = 10;
                listView.node.x = 10;
                this.stageContent.spacingX = 0;
            }

            for (let idx = 0; idx < matches.length; idx++) {
                let matchInfo = matches[idx];
                //生成场次按钮
                let stage = this.stageRes.getStageModel(matchInfo, this.gameId, idx + 1);
                if (!stage) {
                    continue;
                }
                stage.setPosition(0, -120);
                listView.content.addChild(stage);

                if (this.gameId === GameId.DDZ && cc.sys.localStorage.getItem(ItemNames.guideState) !== '2' && !idx) {
                    cc.sys.localStorage.setItem(ItemNames.guideState, 2);
                    let dzArrow = stage.getChildByName('xsydGame');
                    if (dzArrow)
                        dzArrow.active = true;
                }

                // let btn = stage.getComponent(cc.Button);
                let btn = stage.addComponent(cc.Button);
                (btn as cc.Button).transition = cc.Button.Transition.SCALE;
                (btn as cc.Button).zoomScale = 1.05
                let handler = new cc.Component.EventHandler();
                handler.target = lobby;
                handler.component = cc.js.getClassName(Lobby);
                handler.handler = "onClickState";
                handler.customEventData = JSON.stringify({ ...matchInfo, rid: this.gameId });
                btn.clickEvents.push(handler);
            }
            resolve(true);
        });
    }

    static getMatchList(gameId: GameId) {
        return new Promise((resolve: (ok: MatchInfo[]) => void) => {
            window.pomelo.request("lobby.matchHandler.getMatchList", { gid: gameId }, (data: {
                code: number;
                rType: number;
                matches: MatchInfo[];
            }) => {
                if (!data || data.code !== 200) {
                    let errStr;
                    if (data.code === 1004 || 400) {
                        errStr = "游戏暂未开放";
                    } else {
                        errStr = ErrCodes.getErrStr(data.code, "获取房间列表失败");
                    }
                    showTip(errStr);
                    resolve(undefined);
                    return;
                }

                let matches = data.matches;
                matches.sort((a, b) => {
                    if (a.idx === b.idx) {
                        if (a.allInMaxMoney !== undefined && b.allInMaxMoney !== undefined) {
                            return +a.allInMaxMoney - (+b.allInMaxMoney);
                        } else if (a.fanMaxLimit !== undefined && b.fanMaxLimit !== undefined) {
                            return a.fanMaxLimit - b.fanMaxLimit;
                        } else if (a.jokerAs !== undefined && b.jokerAs !== undefined) {
                            return a.jokerAs - b.jokerAs;
                        }
                        else {
                            return 1;
                        }
                    } else {
                        return a.idx - b.idx;
                    }
                });
                resolve(matches);
            });
        });
    }
}
