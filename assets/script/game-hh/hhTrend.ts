import { Shape, SHAPE_NAME, Area } from "./hhGame";
import { WinLoseRecord } from "./hhMsg"
import { instantiate } from "../common/util";

const { ccclass, property } = cc._decorator;

const ROW_COUNT = 6;

@ccclass
export default class HHTrend extends cc.Component {
    @property(cc.Label)
    private blackPercent: cc.Label = undefined;

    @property(cc.ProgressBar)
    private blackPro: cc.ProgressBar = undefined;

    @property(cc.Node)
    private blackBar: cc.Node = undefined;

    @property(cc.Label)
    private redPercent: cc.Label = undefined;

    @property(cc.ProgressBar)
    private redPro: cc.ProgressBar = undefined;

    @property(cc.Node)
    private redBar: cc.Node = undefined;

    @property(cc.Node)
    private nodeTitle: cc.Node = undefined;

    @property(cc.Node)
    private circleList: cc.Node = undefined;

    @property(cc.Node)
    private shapeList: cc.Node = undefined;

    @property([cc.SpriteFrame])
    private sfCircle: cc.SpriteFrame[] = [];

    @property([cc.SpriteFrame])
    private sfZpCircle: cc.SpriteFrame[] = []; // 珠盘圆圈

    @property([cc.SpriteFrame])
    private sfHollowCircle: cc.SpriteFrame[] = []; // 大路圆圈

    @property([cc.SpriteFrame])
    private sfSmallHollowCircle: cc.SpriteFrame[] = []; // 大眼仔路圆圈

    @property([cc.SpriteFrame])
    private sfSolidCircle: cc.SpriteFrame[] = []; // 小路圆圈

    @property([cc.SpriteFrame])
    private sfhalfCircle: cc.SpriteFrame[] = []; // 小强路圆圈

    @property([cc.SpriteFrame])
    private sfShapeBg: cc.SpriteFrame[] = [];

    @property(cc.Label)
    private labRed: cc.Label = undefined;

    @property(cc.Label)
    private labBlack: cc.Label = undefined;

    @property(cc.Label)
    private labAll: cc.Label = undefined;

    // 珠盘
    @property(cc.ScrollView)
    private viewZhupan: cc.ScrollView = undefined;

    @property(cc.Node)
    private listZhupan: cc.Node = undefined;

    @property(cc.Prefab)
    private preZhupan: cc.Prefab = undefined;

    // 大路
    @property(cc.ScrollView)
    private viewDalu: cc.ScrollView = undefined;

    @property(cc.Node)
    private listDalu: cc.Node = undefined;

    @property(cc.Prefab)
    private preDalu: cc.Prefab = undefined;

    // 大眼仔路
    @property(cc.ScrollView)
    private viewDyz: cc.ScrollView = undefined;

    @property(cc.Node)
    private listDyz: cc.Node = undefined;

    @property(cc.Prefab)
    private preDyz: cc.Prefab = undefined;

    // 小路
    @property(cc.ScrollView)
    private viewXl: cc.ScrollView = undefined;

    @property(cc.Node)
    private listXl: cc.Node = undefined;

    @property(cc.Prefab)
    private preXl: cc.Prefab = undefined;

    // 小强路
    @property(cc.ScrollView)
    private viewXql: cc.ScrollView = undefined;

    @property(cc.Node)
    private listXql: cc.Node = undefined;

    @property(cc.Prefab)
    private preXql: cc.Prefab = undefined;

    // 探路
    @property([cc.SpriteFrame])
    private sfNextXl: cc.SpriteFrame[] = [];

    @property([cc.SpriteFrame])
    private sfNextXql: cc.SpriteFrame[] = [];

    @property([cc.Sprite])
    private nextDyz: cc.Sprite[] = [];
    @property([cc.Sprite])
    private nextXl: cc.Sprite[] = [];
    @property([cc.Sprite])
    private nextXql: cc.Sprite[] = [];

    @property
    private maxRecordNum: number = 20;

    private blinkTime = 2;

    private records: WinLoseRecord[] = [];

    private isNeedBlink = false;
    private isBlinking = false;
    isTouchNext = true;

    show() {
        this.node.active = true;
        this.isNeedBlink = false;
        this.scheduleOnce(() => {
            let hhRecords: number[] = [];
            for (let idx = 0; idx < this.records.length; idx++) {
                const element = this.records[idx];
                hhRecords.push(!!element.redWin ? Area.AreaRed : Area.AreaBlack);
            }
            this.updateCardRecords(hhRecords, false);
        }, 0.1);
    }

    hide() {
        this.isNeedBlink = false;
        this.node.active = false;
    }

    onClickNext(event: any, nextArea: string) {
        if (this.isBlinking || !this.isTouchNext) return;
        this.isNeedBlink = true;

        let hhRecords: number[] = [];
        for (let idx = 0; idx < this.records.length; idx++) {
            const element = this.records[idx];
            hhRecords.push(!!element.redWin ? Area.AreaRed : Area.AreaBlack);
        }
        let addRecords = hhRecords.concat();
        addRecords.push(+nextArea)
        this.updateCardRecords(addRecords, false);

        this.scheduleOnce(() => {
            this.isBlinking = false;
            this.isNeedBlink = false;
            this.updateCardRecords(hhRecords, false);
        }, this.blinkTime);
    }

    setRecord(records: WinLoseRecord[], isStation = false) {
        this.isNeedBlink = !isStation;
        this.records = records;
        this.updateRecord();

        let hhRecords: number[] = [];
        for (let idx = 0; idx < this.records.length; idx++) {
            const element = this.records[idx];
            hhRecords.push(!!element.redWin ? Area.AreaRed : Area.AreaBlack);
        }
        this.updateCardRecords(hhRecords, true);
    }

    updateRecord() {
        let recordsLength = this.records.length;
        let lastRecords = (recordsLength > this.maxRecordNum) ? this.records.slice(recordsLength - this.maxRecordNum, recordsLength) : this.records.concat();
        lastRecords.reverse();

        // 红黑输赢比例
        let redWinCount = 0;
        let circles = this.circleList.children;
        let shapes = this.shapeList.children;
        for (let idx = 0; idx < lastRecords.length; idx++) {
            // 红黑输赢
            let record = lastRecords[idx]; // 输赢、牌路是倒序，牌型是正序
            let nodeCircle = circles[idx];
            nodeCircle.active = true;
            let sprite = nodeCircle.getComponent(cc.Sprite);
            if (!!record.redWin) {
                sprite.spriteFrame = this.sfCircle[1];
                redWinCount++;
            } else {
                sprite.spriteFrame = this.sfCircle[0];
            }

            // 牌型
            record = lastRecords[lastRecords.length - 1 - idx];
            let labColor: cc.Color;
            let shapeBg: cc.SpriteFrame;
            if (record.winShape < Shape.ShapePairSmall) {
                // labColor = cc.hexToColor("#b38f43");
                shapeBg = this.sfShapeBg[0];
            } else {
                // labColor = cc.hexToColor("#693d23");
                shapeBg = this.sfShapeBg[1];
            }
            labColor = cc.hexToColor("#FFFFFF");
            if (labColor && shapeBg) {
                let shape = shapes[idx];
                shape.active = true;
                let newSpri = shape.getComponentInChildren(cc.Sprite);
                newSpri.node.active = false;
                let lab = shape.getComponentInChildren(cc.Label);
                lab.node.active = true;
                let sprite = shape.getComponent(cc.Sprite);
                lab.string = SHAPE_NAME[record.winShape];
                lab.node.color = labColor;
                sprite.spriteFrame = shapeBg;

                if (idx === lastRecords.length - 1) {
                    newSpri.node.active = true;
                }
            }
        }

        let redPer = Math.floor(redWinCount / lastRecords.length * 100);
        this.redPercent.string = `${redPer}%`;
        this.redPro.progress = redPer / 100;
        this.blackPercent.string = `${100 - redPer}%`;
        this.blackPro.progress = (100 - redPer) / 100;

        let minPro = 0.3;
        let maxPro = 0.7;
        let redPro = this.redPro.progress;
        let blackPro = this.blackPro.progress;
        this.redPro.progress = (redPro > minPro) ? (redPro < maxPro ? redPro : maxPro) : minPro;
        this.blackPro.progress = (blackPro > minPro) ? (blackPro < maxPro ? blackPro : maxPro) : minPro;
        let redWidth = this.redBar.width;
        let blackWidth = this.blackBar.width;
        this.redPercent.node.setPositionX(-redWidth + 15);
        this.blackPercent.node.setPositionX(blackWidth - 15);
        this.nodeTitle.setPositionX(blackWidth + 20);
        let redWinNum = 0;
        for (let idx = 0; idx < this.records.length; idx++) {
            const element = this.records[idx];
            if (!!element.redWin) {
                redWinNum++;
            }
        }
        this.labRed.string = redWinNum.toString();
        this.labBlack.string = (this.records.length - redWinNum).toString();
        this.labAll.string = this.records.length.toString();
    }

    /**
     * 根据数据更新牌路
     * @param hhRecords
     */
    updateCardRecords(hhRecords: number[], isUpdateNext: boolean) {
        if (!hhRecords || hhRecords.length === 0) {
            return;
        }
        this.zhupanRecords(hhRecords);

        let dot1Arr = new Array<Dot>();
        let num = 0;
        //按记录先整理为一维数组
        for (let i = 0; i < hhRecords.length; i++) {
            num++;
            dot1Arr.push(new Dot(hhRecords[i], 0, num));
        }
        //二维
        let twoArrRecords = this.oneChgTwoArr(dot1Arr);
        this.drawCardRecords(twoArrRecords, this.listDalu, this.preDalu, 32, 17, this.sfHollowCircle, false, num);
        this.viewDalu.scrollToRight();

        // 三小路
        this.dayanzaiRecords(twoArrRecords);
        this.xiaoluRecords(twoArrRecords);
        this.xiaoqiangRecords(twoArrRecords);

        // 探路
        if (isUpdateNext) {
            for (let i = Area.AreaBlack; i <= Area.AreaRed; i++) {
                let recs = hhRecords.concat();
                recs.push(i);

                let num = 0;
                let dot1Arr = new Array<Dot>();
                for (let i = 0; i < recs.length; i++) {
                    num++;
                    dot1Arr.push(new Dot(recs[i], 0, num));
                }
                let twoArr = this.oneChgTwoArr(dot1Arr);

                let oneArr1 = this.getSmallLuOneArr(twoArr, 1);
                if (oneArr1 && oneArr1[oneArr1.length - 1]) {
                    this.nextDyz[i].node.active = true;
                    this.nextDyz[i].spriteFrame = this.sfHollowCircle[oneArr1[oneArr1.length - 1].type];
                } else {
                    this.nextDyz[i].node.active = false;
                }
                let oneArr2 = this.getSmallLuOneArr(twoArr, 2);
                if (oneArr2 && oneArr2[oneArr2.length - 1]) {
                    this.nextXl[i].node.active = true;
                    this.nextXl[i].spriteFrame = this.sfNextXl[oneArr2[oneArr2.length - 1].type];
                } else {
                    this.nextXl[i].node.active = false;
                }
                let oneArr3 = this.getSmallLuOneArr(twoArr, 3);
                if (oneArr3 && oneArr3[oneArr3.length - 1]) {
                    this.nextXql[i].node.active = true;
                    this.nextXql[i].spriteFrame = this.sfNextXql[oneArr3[oneArr3.length - 1].type];
                } else {
                    this.nextXql[i].node.active = false;
                }
            }
        }
    }



    /**
 * 珠盘
 * @param records
 */
    private zhupanRecords(records: number[]) {
        let currColNum = Math.ceil(records.length / ROW_COUNT);
        let minShowCol = 10;
        this.listZhupan.width = ((currColNum > minShowCol) ? currColNum : minShowCol) * 34;
        for (let idx = 0; idx < currColNum; idx++) {
            let trendItem: cc.Node;
            let childrenNum = this.listZhupan.childrenCount;
            if (childrenNum < idx + 1) {
                trendItem = instantiate(this.preZhupan);
                this.listZhupan.addChild(trendItem);
            } else {
                trendItem = this.listZhupan.children[idx];
                trendItem.opacity = 255;
            }
            let nodeCircles = trendItem.children;
            for (let circleIdx = 0; circleIdx < nodeCircles.length; circleIdx++) {
                let nodeCircle = nodeCircles[circleIdx];
                nodeCircle.stopAllActions();
                let currNum = idx * ROW_COUNT + circleIdx
                const area = records[currNum];
                if (currNum < records.length) {
                    nodeCircle.opacity = 255;
                    let sprite = nodeCircle.getComponent(cc.Sprite);
                    sprite.spriteFrame = this.sfZpCircle[area];
                    if ((currNum === records.length - 1) && this.isNeedBlink) {
                        this.isBlinking = true;
                        nodeCircle.runAction(cc.sequence(cc.fadeTo(0.4, 20), cc.fadeTo(0.4, 255), cc.fadeTo(0.4, 20), cc.fadeTo(0.4, 255), cc.fadeTo(0.4, 20), cc.fadeTo(0.4, 255), cc.callFunc(() => {
                            nodeCircle.opacity = 255;
                            this.isBlinking = false;
                        })));
                    }
                } else {
                    nodeCircle.opacity = 0;
                }
            }
        }
        for (let idx = 0; idx < this.listZhupan.childrenCount; idx++) {
            if (idx + 1 > currColNum) {
                let trendItem = this.listZhupan.children[idx];
                trendItem.opacity = 0;
            }
        }
        this.viewZhupan.scrollToRight();
    }

    /**
     * 路牌
     * @param twoArrRecords // 二维数据
     * @param list // 需要显示的列表
     * @param preItem // 单项预制体
     * @param minShowColNum // 最小显示列数
     * @param oneWidth // 一列的宽度
     * @param sfArr // 空心或实心圆圈
     * @param isTwoRow // 是否一列显示两列数据
     * @param total // 总数
     */
    private drawCardRecords(twoArrRecords: Dot[][], list: cc.Node, preItem: cc.Prefab,
        minShowColNum: number, oneWidth: number, sfArr: cc.SpriteFrame[], isTwoRow: boolean, total: number) {
        let maxColNum = twoArrRecords[0].length;
        for (let idx = 0; idx < twoArrRecords.length; idx++) {
            const colNum = twoArrRecords[idx].length;
            maxColNum = colNum > maxColNum ? colNum : maxColNum;
        }
        let maxShowCol = isTwoRow ? Math.ceil(maxColNum / 2) : maxColNum;
        list.width = ((maxShowCol > minShowColNum) ? maxShowCol : minShowColNum) * oneWidth;

        for (let colIdx = 0; colIdx < maxColNum; colIdx++) {
            for (let rowIdx = 0; rowIdx < ROW_COUNT; rowIdx++) {
                let trendItem: cc.Node;
                let childrenNum = list.childrenCount;
                if (childrenNum < colIdx + 1) {
                    trendItem = instantiate(preItem);
                    list.addChild(trendItem);
                } else {
                    trendItem = list.children[colIdx];
                    trendItem.opacity = 255;
                }
                let nodeCircles = trendItem.children;
                let nodeCircle = nodeCircles[rowIdx];
                nodeCircle.stopAllActions();
                let lab = nodeCircle.getComponentInChildren(cc.Label);
                if (lab) lab.node.active = false;
                const dot = twoArrRecords[rowIdx][colIdx];
                if (dot) {
                    nodeCircle.opacity = 255;
                    let sprite = nodeCircle.getComponent(cc.Sprite);
                    sprite.spriteFrame = sfArr[dot.type];
                    if (dot.sort === total && this.isNeedBlink) {
                        nodeCircle.runAction(cc.sequence(cc.fadeTo(0.4, 20), cc.fadeTo(0.4, 255), cc.fadeTo(0.4, 20), cc.fadeTo(0.4, 255), cc.fadeTo(0.4, 20), cc.fadeTo(0.4, 255), cc.callFunc(() => {
                            nodeCircle.opacity = 255;
                        })));
                    }
                } else {
                    nodeCircle.opacity = 0;
                }
            }
        }

        for (let idx = 0; idx < list.childrenCount; idx++) {
            if (idx + 1 > maxColNum) {
                let trendItem = list.children[idx];
                trendItem.opacity = 0;
            }
        }
    }

    /**
 * 大眼仔路
 * @param twoArrRecords
 * @param comBeforeCol
 */
    private dayanzaiRecords(twoArrRecords: Dot[][]) {
        let oneArr = this.getSmallLuOneArr(twoArrRecords, 1);
        twoArrRecords = this.oneChgTwoArr(oneArr);
        this.drawCardRecords(twoArrRecords, this.listDyz, this.preDyz, 16, 17, this.sfSmallHollowCircle, true, oneArr.length);
        this.viewDyz.scrollToRight();
    }

    /**
     * 小路
     * @param twoArrRecords
     */
    private xiaoluRecords(twoArrRecords: Dot[][]) {
        let oneArr = this.getSmallLuOneArr(twoArrRecords, 2);
        twoArrRecords = this.oneChgTwoArr(oneArr);
        this.drawCardRecords(twoArrRecords, this.listXl, this.preXl, 16, 17, this.sfSolidCircle, true, oneArr.length);
        this.viewXl.scrollToRight();
    }

    /**
     * 小强路
     * @param twoArrRecords
     */
    private xiaoqiangRecords(twoArrRecords: Dot[][]) {
        let oneArr = this.getSmallLuOneArr(twoArrRecords, 3);
        twoArrRecords = this.oneChgTwoArr(oneArr);
        this.drawCardRecords(twoArrRecords, this.listXql, this.preXql, 16, 17, this.sfhalfCircle, true, oneArr.length);
        this.viewXql.scrollToRight();
    }

    /**
         * 所有小路的一维数组
         * @param twoArrRecords
         * @param comBeforeCol
         */
    private getSmallLuOneArr(twoArrRecords: Dot[][], comBeforeCol: number): Dot[] {
        let maxColNum = twoArrRecords[0].length;
        for (let idx = 0; idx < twoArrRecords.length; idx++) {
            const colNum = twoArrRecords[idx].length;
            maxColNum = colNum > maxColNum ? colNum : maxColNum;
        }

        // 将大路图的显示二维转化为数据二维
        for (let colIdx = 0; colIdx < maxColNum; colIdx++) {
            for (let rowIdx = 0; rowIdx < ROW_COUNT; rowIdx++) {
                const currDot = twoArrRecords[rowIdx][colIdx];
                if (currDot) {
                    if (rowIdx !== 0) {
                        // 若是有向右的，则将该区域所有向右的都变为该列向下
                        if (currDot.direction === 1) {
                            let rightRow = rowIdx;
                            // 通过排序号来判断向右的是否都是相同区域
                            let areaSort = currDot.sort;
                            for (let rightCol = colIdx + 1; rightCol < maxColNum; rightCol++) {
                                let rightDot = twoArrRecords[rowIdx][rightCol];
                                areaSort++;
                                if (rightDot) {
                                    if (rightDot.sort === areaSort) {
                                        rightRow++
                                        twoArrRecords[rowIdx][rightCol] = undefined;
                                        if (!twoArrRecords[rightRow]) {
                                            twoArrRecords[rightRow] = [];
                                        }
                                        twoArrRecords[rightRow][colIdx] = rightDot;
                                    } else {
                                        break;
                                    }
                                } else {
                                    break;
                                }
                            }
                        }
                        let beforeRowDot = twoArrRecords[rowIdx - 1][colIdx];
                        if (beforeRowDot.sort + 1 !== currDot.sort) {
                            continue;
                        }
                    }
                }
            }
        }
        let maxRowNum = twoArrRecords.length;

        let oneArr: Dot[] = [];
        let lastDot: Dot;
        for (let colIdx = 0; colIdx < maxColNum; colIdx++) {
            for (let rowIdx = 0; rowIdx < maxRowNum; rowIdx++) {
                const currDot = twoArrRecords[rowIdx][colIdx];
                if (currDot) {
                    // 从第二列第二行开始记录
                    if (colIdx > comBeforeCol || (colIdx === comBeforeCol && rowIdx > 0)) {
                        let beforeRow: number;
                        let beforeCol: number;
                        let beforeDot1: Dot;
                        let beforeDot2: Dot;
                        if (rowIdx === 0) {
                            // 若是第一行,则此局和上一局不在一列
                            for (let i = 0; i < maxRowNum; i++) {
                                const tempDot = twoArrRecords[i][colIdx - 1];
                                if (tempDot && (tempDot.sort === currDot.sort - 1)) {
                                    beforeRow = i;
                                    beforeDot1 = tempDot;
                                    break;
                                }
                            }
                            beforeCol = colIdx - comBeforeCol - 1;
                            beforeDot2 = twoArrRecords[beforeRow][beforeCol];
                        } else {
                            if (lastDot) {
                                if (currDot.sort < lastDot.sort) continue;
                            }

                            beforeRow = rowIdx - 1;
                            beforeDot1 = twoArrRecords[beforeRow][colIdx];
                            beforeCol = colIdx - comBeforeCol;
                            beforeDot2 = twoArrRecords[beforeRow][beforeCol];
                        }
                        // 如果横向前一列有值
                        let compareType1: number;
                        if (beforeDot2) {
                            // 如果横向前一列的下一个值不在一列
                            let beforeDot2After: Dot;
                            if (!twoArrRecords[beforeRow + 1] || !twoArrRecords[beforeRow + 1][beforeCol]) {
                                beforeDot2After = twoArrRecords[0][beforeCol + 1];
                            } else {
                                beforeDot2After = twoArrRecords[beforeRow + 1][beforeCol];
                            }
                            compareType1 = beforeDot2.type === beforeDot2After.type ? Area.AreaRed : Area.AreaBlack;
                        }
                        let type = currDot.type === beforeDot1.type ? Area.AreaRed : Area.AreaBlack;
                        if (compareType1 !== undefined) {
                            type = compareType1 === type ? Area.AreaRed : Area.AreaBlack;
                        }

                        oneArr.push(new Dot(type, 0, oneArr.length + 1));
                        lastDot = currDot;
                    }
                }
            }
        }
        return oneArr;
    }

    /**
     * 将一维转为二维数组
     * @param oneArrRecords
     */
    private oneChgTwoArr(oneArrRecords: Dot[]): Dot[][] {
        let COL = 0;
        let row = 0;
        let col = 0;
        let twoArr = [];
        for (let i = 0; i < ROW_COUNT; i++) {
            twoArr.push(new Array<Dot>());
        }
        for (let i = 0; i < oneArrRecords.length; i++) {
            let dot = oneArrRecords[i];
            // 上一个没有
            if (i === 0) {
                twoArr[0][COL] = dot;
                continue;
            }
            //上一个不一样
            if (oneArrRecords[i].type !== oneArrRecords[i - 1].type) {
                row = 0;
                COL++;
                col = COL;
            } else {//一样
                //向下
                if (oneArrRecords[i - 1].direction === 0) {
                    //不能放
                    if (row + 1 >= ROW_COUNT || twoArr[row + 1][col] != undefined) {
                        dot.direction = 1;
                        oneArrRecords[i - 1].direction = 1;
                        col++;
                    } else {
                        row++;
                    }
                } else {//向右
                    dot.direction = 1;
                    col++;
                }
            }
            twoArr[row][col] = dot;
        }
        return twoArr;
    }

}

class Dot {
    constructor(public type: number, public direction: number, public sort: number) {
    }
}