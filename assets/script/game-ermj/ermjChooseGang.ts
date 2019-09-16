import ErmjGame from "./ermjGame";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ErmjChooseGang extends cc.Component {
    @property(cc.Node)
    spriBg: cc.Node = undefined;

    @property([cc.Button])
    private btnOptArr: cc.Button[] = [];

    game: ErmjGame;

    private _spriArr: cc.Sprite[] = [];
    onLoad() {
        this.btnOptArr.forEach((btn, idx) => {
            let spri = btn.getComponentInChildren(cc.Sprite);
            this._spriArr[idx] = spri;
        });
    }

    show(gangValArr: number[]) {
        this.node.active = true;
        this.spriBg.width = 110 + gangValArr.length * 75;
        for (let btnIdx = 0; btnIdx < this.btnOptArr.length; btnIdx++) {
            let btn = this.btnOptArr[btnIdx];
            if(btnIdx < gangValArr.length){
                btn.node.active = true;
                let paiVal = gangValArr[btnIdx];
                this._spriArr[btnIdx].spriteFrame = this.game.mahjongRes.getPaiSpriteFrame(paiVal);
                this.setEventHandler(btn, paiVal);
            } else {
                btn.node.active = false;
            }
        }
    }

    hide() {
        this.node.active = false;
    }

    setEventHandler(btn: cc.Button, paiVal:number) {
        let game = cc.find("game");
        let handler = new cc.Component.EventHandler();
        handler.target = game;
        handler.component = "ermjGame";
        handler.handler = "onClickGang";
        handler.customEventData = paiVal.toString();
        btn.clickEvents = [];
        btn.clickEvents.push(handler);
    }
}
