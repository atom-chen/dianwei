import g from "../g";
import * as util from "../common/util";
import ItemNames from "../common/itemNames";


const TOUCH_WIDTH = 200;

const enum TOUCH_FLAG {
    ZERO,
    ONE,
    TWO,
    THREE,
}

const PLAYER_CODE = "111";
const DEV_CODE = "123321";

const { ccclass, property } = cc._decorator;

@ccclass
export default class DebugPanel extends cc.Component {
    @property(cc.Prefab)
    preDebug: cc.Prefab = undefined;

    @property(cc.EditBox)
    private nodeEb: cc.EditBox = undefined;

    @property(cc.Node)
    private playerMenu: cc.Node = undefined;

    @property(cc.Node)
    private devMenu: cc.Node = undefined;

    private debugNums = [0, 0, 0, 0];
    private debugTime = 0;

    initDebug() {
        this.nodeEb.node.active = false;
        this.playerMenu.active = false;
        this.devMenu.active = false;

        this.node.on(cc.Node.EventType.TOUCH_START, (event: cc.Event.EventTouch) => {
            let currPos = event.getLocation();
            let size = cc.winSize;
            if (currPos.y < TOUCH_WIDTH) {
                if (currPos.x < TOUCH_WIDTH) {
                    cc.info("touch left ang");
                    this.debugClicked(1);
                }
                if (currPos.x > size.width - TOUCH_WIDTH) {
                    cc.info("touch right ang");
                    this.debugClicked(2);
                }
            }
            if (currPos.y > size.height - TOUCH_WIDTH) {
                if (currPos.x < TOUCH_WIDTH) {
                    cc.info("touch left up");
                    this.debugClicked(0);
                }
                if (currPos.x > size.width - TOUCH_WIDTH) {
                    cc.info("touch right up");
                    this.debugClicked(3);
                }
            }
        });
        (<any>this.node)["_touchListener"].setSwallowTouches(false);
    }

    private debugClicked(idx: number) {
        for (let i = 0; i < idx; i++) {
            if (this.debugNums[i] !== TOUCH_FLAG.TWO) {
                this.debugNums = [0, 0, 0, 0];
                return
            }
        }
        this.debugNums[idx]++;
        if (this.debugNums[idx] === TOUCH_FLAG.ONE) {
            this.debugTime = Date.now();
        } else if (this.debugNums[idx] === TOUCH_FLAG.TWO) {
            if (Date.now() - this.debugTime > 1000) {
                this.debugNums = [0, 0, 0, 0];
                return
            }
            if (idx === TOUCH_FLAG.THREE) {
                this.debugNums = [0, 0, 0, 0];

                this.nodeEb.node.active = true;
            }
        }
    }
    private onEndEdit() {
        this.nodeEb.node.active = false;
        // 玩家看到的界面
        if (this.nodeEb.string === PLAYER_CODE) {
            this.playerMenu.active = true;
        }
        // 开发者看到的界面
        if (this.nodeEb.string === DEV_CODE) {
            this.devMenu.active = true;
        }
    }

    private onClickOpenDebug() {
        let ui = util.instantiate(this.preDebug);
        this.node.addChild(ui, 1000);
    }

    private onClickPass() {
        cc.sys.localStorage.setItem(ItemNames.devFlag, "1");
    }

    private onClickCopy() {
        util.setClipboard(g.debugInfo);
    }

    private onClickClose() {
        this.nodeEb.node.active = false;
        this.playerMenu.active = false;
        this.devMenu.active = false;
    }
}
