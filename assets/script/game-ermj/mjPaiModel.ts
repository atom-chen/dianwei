import ermjHoldPlayer from "./ermjHoldPlayer";
import MahjongRes from "../game-share/mahjongRes";
import ERMJGame from "./ermjGame";
import * as util from "../common/util";
const { ccclass, property } = cc._decorator;

export interface TingPaiData {
    tingPai: number;        //要听的牌
    baseFan: number;        //胡牌番数
    RemainingNum: number;   //听牌剩余个数
}


@ccclass
export default class MjPaiModel extends cc.Component {
    @property(cc.Sprite)
    private spriPai: cc.Sprite = undefined;

    @property(cc.Node)
    private nodeCover: cc.Node = undefined;

    @property(cc.Node)
    private nodeJiao: cc.Node = undefined;

    private game: ERMJGame;
    private touchNode: cc.Node;
    private holdMgr: ermjHoldPlayer;
    private mahjongRes: MahjongRes;

    private readonly MOVE_DIS: number = 30;
    private readonly MAX_SLIDE_TIME: number = 20000;

    private _movePaiModel: cc.Node;
    private _fixedY: number; // 保持牌Y坐标不变
    private _clickDownTime: number = 0;
    private _mouseDownPosY: number;
    private _isSelected: boolean = false; // 是否已被选中
    private _isTouchSelf: boolean;
    private _isAllowTouch: boolean;

    private _paiIndex: number;  // 显示的排序值
    private _paiVal: number;    // 牌的初始值
    private _paiRank: number;    // 牌的点数
    private _paiSuit: number;   // 牌的类型

    private _isHaveJiao: boolean = false; // 打此张后是否有叫
    private _tingPaiDataArr: TingPaiData[] = []; // 有叫则可听哪些牌

    onLoad() {
        this.touchNode = cc.find("Canvas/touchNode");
        this.touchNode.on(cc.Node.EventType.TOUCH_START, this.clickDownPai.bind(this));
        this.touchNode.on(cc.Node.EventType.TOUCH_MOVE, this.clickMovePai.bind(this));
        this.touchNode.on(cc.Node.EventType.TOUCH_END, this.clickUpPai.bind(this));
    }

    init(hold: ermjHoldPlayer, g: ERMJGame) {
        this.holdMgr = hold;
        this.game = g;
        this.mahjongRes = this.game.mahjongRes;
        this._fixedY = this.node.y;
        this.createMoveModel();
    }

    createMoveModel() {
        this._movePaiModel = new cc.Node();
        this.node.parent.addChild(this._movePaiModel);
        this._movePaiModel.opacity = 0;
        this._movePaiModel.setLocalZOrder(1);

        let sprite = this._movePaiModel.addComponent(cc.Sprite);
        sprite.spriteFrame = this.node.getComponent(cc.Sprite).spriteFrame;

        let paiNode = util.instantiate(this.node.getChildByName("tile"));
        paiNode.name = "pai";
        this._movePaiModel.addChild(paiNode);
    }

    getMovePos() {
        return this._movePaiModel.position;
    }

    clickDownPai(event: cc.Event.EventMouse): void {
        if (!this._isAllowTouch || !this.node || !this.node.active)
            return

        let loc = this.node.convertToNodeSpace(event.getLocation());
        let rect = cc.rect(0, 0, this.node.width, this.node.height);
        if (cc.rectContainsPoint(rect, loc)) {
            this._isTouchSelf = true;
            this._clickDownTime = new Date().getTime();

            this._mouseDownPosY = event.getLocationY();
            this._movePaiModel.setPosition(this.node.x, this.node.y);
        }
    }

    clickMovePai(event: cc.Event.EventMouse): void {
        if (this._isTouchSelf) {
            this.node.opacity = 150;
            let model = this._movePaiModel;
            model.opacity = 255;
            model.setPosition(cc.pAdd(model.getPosition(), event.getDelta()));
            if (event.getLocationY() < 0) {
                this.setSelectedStatus(false);
            }
        }
    }

    clickUpPai(event: cc.Event.EventMouse): void {
        if (!this._isTouchSelf) {
            return
        }
        event.stopPropagation();
        this._isTouchSelf = false;
        this._movePaiModel.opacity = 0;

        // 判断是否滑动出牌
        let currTime = new Date().getTime();
        let gapTime = currTime - this._clickDownTime;
        let gapPosY = event.getLocationY() - this._mouseDownPosY;
        let isOutPai = false;
        if ((gapTime < this.MAX_SLIDE_TIME) && (Math.abs(gapPosY) > this.MOVE_DIS)) {
            isOutPai = true;
        } else {
            // 是否第二次点击，是则出牌
            if (!this._isSelected) {
                isOutPai = false;
            } else {
                isOutPai = true;
            }
        }
        if (isOutPai) {
            this.holdMgr.clientOutPai(this);
        } else {
            this.setSelectedStatus(true);
            this.holdMgr.clickSelfPai(this);
        }
    }

    resetStatus() {
        this._isAllowTouch = true;
        this._isHaveJiao = false;
        this.setSelectedStatus(false);
        this.setCoverVisible(false);
        this.setJiaoShow(false);
    }

    /**
     * 设置选中状态
     * @param isChoose 
     */
    setSelectedStatus(isChoose: boolean, isFadeOut = false): void {
        this._isSelected = isChoose;
        this.node.stopAllActions();
        this.node.rotation = 0;
        this.node.y = this._isSelected ? (this._fixedY + this.MOVE_DIS) : this._fixedY;
        this.node.opacity = 255;
        if (!this._isSelected) {
            this._clickDownTime = 0;

            this._isTouchSelf = false;
            this._movePaiModel.opacity = 0;
        } else if (isFadeOut) {
            this.node.active = false;
        }
    }

    /**
     * 是否显示遮罩
     * @param visible 
     */
    setCoverVisible(visible: boolean): void {
        this.nodeCover.active = visible;
        this._isAllowTouch = !visible;
    }

    setCanClick(can: boolean) {
        this._isAllowTouch = can;
    }

    /**
     * 是否有叫
     * @param isShow 
     */
    setJiaoShow(isShow: boolean, tingDataArr?: TingPaiData[]) {
        this.nodeJiao.active = isShow;

        this._isHaveJiao = isShow;
        this.nodeJiao.stopAllActions();
        if (this._isHaveJiao) {
            let time = 0.5;
            this.nodeJiao.y = 83;
            this.nodeJiao.runAction(cc.repeatForever(cc.sequence(cc.moveBy(time, cc.p(0, 5)), cc.moveBy(time, cc.p(0, -5)))));
        }
        if (tingDataArr !== undefined)
            this._tingPaiDataArr = tingDataArr;
    }

    getTingPaiData(): TingPaiData[] {
        return this._tingPaiDataArr;
    }

    setNormalY() {
        this.node.y = this._fixedY;
    }

    get isHaveJiao(): boolean {
        return this._isHaveJiao;
    }

    get isSelected(): boolean {
        return this._isSelected;
    }

    get paiSuit(): number {
        this._paiSuit = this.getPaiSuit(this._paiVal);
        return this._paiSuit;
    }

    set paiIndex(idx: number) {
        this._paiIndex = idx;
    }
    get paiIndex(): number {
        return this._paiIndex;
    }

    set paiVal(val: number) {
        if (val === undefined) return;
        this._paiVal = val;
        this.setPaiRankShow(this._paiVal);

        this._paiRank = this.getPaiRank(this._paiVal);
    }
    get paiVal(): number {
        return this._paiVal;
    }

    set paiRank(dian: number) {
        this._paiRank = dian;
    }
    get paiRank(): number {
        return this._paiRank;
    }

    setPaiRankShow(val: number) {
        let sf = this.mahjongRes.getPaiSpriteFrame(val);
        this.spriPai.spriteFrame = sf;
        this._movePaiModel.getChildByName("pai").getComponent(cc.Sprite).spriteFrame = sf;
    }

    getPaiRank(val: number) {
        return val % 10;
    }

    getPaiSuit(val: number) {
        return Math.floor(val / 10);
    }

    onDestroy() {
        this._movePaiModel.destroy();
        this.touchNode.off(cc.Node.EventType.TOUCH_START, this.clickDownPai);
        this.touchNode.off(cc.Node.EventType.TOUCH_MOVE, this.clickMovePai);
        this.touchNode.off(cc.Node.EventType.TOUCH_END, this.clickUpPai);
    }
}
