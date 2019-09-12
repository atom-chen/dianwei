import { CardPoint } from "../game-share/dpPokerAlgorithm";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PdkRecordCard extends cc.Component {
    @property([cc.Label])
    private labNumArr: cc.Label[] = [];

    @property(cc.Color)
    private labBoomColor: cc.Color = undefined;

    @property(cc.Color)
    private labNormalColor: cc.Color = undefined;

    @property(cc.Color)
    private labEndColor: cc.Color = undefined;

    private NOR_NUM = 4; // 正常牌总数
    private POINT_A_NUM = 3;
    private POINT_2_NUM = 1;

    private isPlayAction: boolean = false;

    onLoad() {
        this.node.opacity = 0;
    }

    start() {
        this.resetNum();
    }

    resetNum() {
        let length = this.labNumArr.length;
        for (let idx = 0; idx < length; idx++) {
            let lab = this.labNumArr[idx];
            lab.node.color = this.labNormalColor;
            if (idx < (length - 2)) {
                lab.string = this.NOR_NUM.toString();
                lab.node.color = this.labBoomColor;
            } else if (idx === (length - 2)) {
                lab.string = this.POINT_A_NUM.toString();
            } else if (idx === (length - 1)) {
                lab.string = this.POINT_2_NUM.toString();
            }
        }
    }

    /**
     * 保存已出的牌
     * @param cardData
     */
    saveDiscardNum(cardData: number[]) {
        for (let data of cardData) {
            this.setPointNum(data);
        }
    }

    private setPointNum(cardData: number) {
        let point = cardData & 0xff;
        let lab: cc.Label;
        let length = this.labNumArr.length;
        if (point < CardPoint.POINT_2) {
            lab = this.labNumArr[point - 3];
        } else if (point === CardPoint.POINT_2) {
            lab = this.labNumArr[length - 1];
        }

        if (lab) {
            let currNum = +lab.string;
            currNum = (currNum - 1) > 0 ? currNum - 1 : 0;
            lab.string = currNum.toString();
            let col = (currNum > 0) ? this.labNormalColor : this.labEndColor;
            lab.node.color = col;
        }
    }

    show() {
        if (this.isPlayAction || this.node.opacity > 0) {
            return;
        }
        this.isPlayAction = true;
        this.node.opacity = 255;

        this.node.stopAllActions();
        this.node.scaleX = 0;
        this.node.runAction(cc.sequence(
            cc.scaleTo(0.2, 1, 1).easing(cc.easeBackOut()),
            cc.callFunc(() => {
                this.isPlayAction = false;
            })
        ));
    }

    hide() {
        if (this.isPlayAction || this.node.opacity === 0) {
            return;
        }
        this.isPlayAction = true;

        this.node.stopAllActions();
        this.node.scaleX = 1;
        this.node.runAction(cc.sequence(
            cc.scaleTo(0.2, 0, 1).easing(cc.easeBackIn()),
            cc.callFunc(() => {
                this.node.opacity = 0;
                this.isPlayAction = false;
            })
        ));
    }

    click() {
        if (this.isPlayAction) {
            return;
        }

        if (this.node.opacity > 0) {
            this.hide();
        } else {
            this.show();
        }
    }
}
