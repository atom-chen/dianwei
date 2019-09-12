import { WinLoseRecord } from "./hhMsg"
import { Shape, SHAPE_NAME } from "./hhGame";

const { ccclass, property } = cc._decorator;

@ccclass
export default class HHRecord extends cc.Component {
    @property(cc.Node)
    private nodeCircleMgr: cc.Node = undefined;

    @property(cc.Node)
    private nodeShapeMgr: cc.Node = undefined;

    @property([cc.SpriteFrame])
    private sfCircle: cc.SpriteFrame[] = [];

    @property([cc.SpriteFrame])
    private sfShapeBg: cc.SpriteFrame[] = [];

    private records: WinLoseRecord[] = [];

    onLoad() {
        this.records = [];
        this.updateRecord();
    }

    setRecord(records: WinLoseRecord[]) {
        this.records = records;
        this.updateRecord();
    }

    updateRecord() {
        let circleArr = this.nodeCircleMgr.children;
        let shapeArr = this.nodeShapeMgr.children;

        let recordsLength = this.records.length;
        // 主界面的胜负记录是有限的
        let lastRecords = (recordsLength > circleArr.length) ? this.records.slice(recordsLength - circleArr.length, recordsLength) : this.records.concat();
        lastRecords.reverse();

        // 牌型记录比胜负记录少，所以取末尾的胜负记录来显示牌型记录
        let shapeNum = 0;
        for (let idx = 0; idx < lastRecords.length; idx++) {
            let record = lastRecords[idx];

            // 记录红黑输赢
            let circle = circleArr[idx];
            circle.active = true;
            let sprite = circle.getComponent(cc.Sprite);
            sprite.spriteFrame = (record.redWin === 1) ? this.sfCircle[1] : this.sfCircle[0];

            // 记录牌型
            if (idx < shapeArr.length) {
                let labColor: cc.Color;
                let shapeBg: cc.SpriteFrame;
                if (record.winShape < Shape.ShapePairSmall) {
                    // labColor = cc.hexToColor("#b38f43");
                    shapeBg = this.sfShapeBg[0];
                } else {
                    // labColor = cc.hexToColor("#693d23");
                    shapeBg = this.sfShapeBg[1];
                }
                labColor = cc.hexToColor("#FFFFFF")
                if (labColor && shapeBg) {
                    let shape = shapeArr[shapeNum];
                    shape.active = true;
                    let lab = shape.getComponentInChildren(cc.Label);
                    let sprite = shape.getComponent(cc.Sprite);
                    lab.string = SHAPE_NAME[record.winShape];
                    lab.node.color = labColor;
                    sprite.spriteFrame = shapeBg;
                    shapeNum += 1;

                    shape.stopAllActions();
                    shape.setScale(1, 1);
                    if (idx === 0) {
                        shape.runAction(cc.sequence(
                            cc.scaleTo(0.8, 1.2, 1.2).easing(cc.easeBackOut()),
                            cc.scaleTo(0.2, 1, 1),
                        ));
                    }
                }
            }
        }
    }
}