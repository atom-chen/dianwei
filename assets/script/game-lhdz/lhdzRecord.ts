const { ccclass, property } = cc._decorator;

@ccclass
export default class LhdzRecord extends cc.Component {
    @property(cc.Node)
    private nodeCircleMgr: cc.Node = undefined;

    @property([cc.SpriteFrame])
    private sfCircle: cc.SpriteFrame[] = [];

    private records: number[] = [];

    onLoad() {
        this.records = [];
        this.updateRecord();
    }

    setRecord(records: number[]) {
        this.records = records;
        this.updateRecord();
    }

    updateRecord() {
        let circleArr = this.nodeCircleMgr.children;

        let recordsLength = this.records.length;
        // 主界面的胜负记录是有限的
        let lastRecords = (recordsLength > circleArr.length) ? this.records.slice(recordsLength - circleArr.length, recordsLength) : this.records.concat();
        lastRecords.reverse();

        // 牌型记录比胜负记录少，所以取末尾的胜负记录来显示牌型记录
        let shapeNum = 0;
        for (let idx = 0; idx < lastRecords.length; idx++) {
            let record = lastRecords[idx];

            // 记录输赢
            let circle = circleArr[idx];
            circle.active = true;
            let sprite = circle.getComponent(cc.Sprite);
            sprite.spriteFrame = this.sfCircle[record];
        }
    }

    clearRecord() {
        this.nodeCircleMgr.children.forEach(el => {
            el.active = false;
        });
    }
}
