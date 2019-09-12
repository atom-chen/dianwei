import { Area } from "./lhdzGame";

import { instantiate } from "../common/util";

const { ccclass, property } = cc._decorator;

const ROW_COUNT = 6;

@ccclass
export default class LhdzTrend extends cc.Component {
    @property(cc.Label)
    private longPercent: cc.Label = undefined;

    @property(cc.Label)
    private huPercent: cc.Label = undefined;

    @property(cc.Node)
    private circleList: cc.Node = undefined;

    @property([cc.SpriteFrame])
    private sfCircle: cc.SpriteFrame[] = [];

    @property([cc.SpriteFrame])
    private sfFontCircle: cc.SpriteFrame[] = [];

    @property([cc.SpriteFrame])
    private sfHollowCircle: cc.SpriteFrame[] = [];

    @property([cc.SpriteFrame])
    private sfSmallHollowCircle: cc.SpriteFrame[] = [];

    @property([cc.SpriteFrame])
    private sfSolidCircle: cc.SpriteFrame[] = [];

    @property([cc.SpriteFrame])
    private sfhalfCircle: cc.SpriteFrame[] = [];

    @property(cc.Label)
    private lab_longWin: cc.Label = undefined;

    @property(cc.Label)
    private lab_huWin: cc.Label = undefined;

    @property(cc.Label)
    private lab_peaceWin: cc.Label = undefined;

    @property(cc.Label)
    private lab_total: cc.Label = undefined;

    @property(cc.Node)
    private nodeTitle: cc.Node = undefined;

    @property(cc.ProgressBar)
    private longPro: cc.ProgressBar = undefined;

    @property(cc.ProgressBar)
    private huPro: cc.ProgressBar = undefined;

    @property(cc.Node)
    private longBar: cc.Node = undefined;

    @property(cc.Node)
    private huBar: cc.Node = undefined;

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
    @property([cc.Sprite])
    private nextDyz: cc.Sprite[] = [];
    @property([cc.Sprite])
    private nextXl: cc.Sprite[] = [];
    @property([cc.Sprite])
    private nextXql: cc.Sprite[] = [];

    @property
    private maxRecordNum: number = 20;

    private blinkTime = 2;

    private records: number[] = [];
    private isNeedBlink = false;
    private isBlinking = false;
    isTouchNext = true;

    show() {
        this.node.active = true;
        this.isNeedBlink = false;
        this.scheduleOnce(() => {
            this.updateCardRecords(this.records, false);
        }, 0.1);
    }

    hide() {
        this.isNeedBlink = false;
        this.node.active = false;
    }

    onClickNext(event: any, nextArea: string) {
        if (this.isBlinking || !this.isTouchNext) return;
        this.isNeedBlink = true;

        let lastRecords = this.records.concat();
        lastRecords.push(+nextArea)
        this.updateCardRecords(lastRecords, false);

        this.scheduleOnce(() => {
            this.isBlinking = false;
            this.isNeedBlink = false;
            this.updateCardRecords(this.records, false);
        }, this.blinkTime);
    }

    setRecord(records: number[], isStation = false) {
        this.isNeedBlink = !isStation;
        this.records = records;
        this.updateRecord();
        this.updateCardRecords(this.records, true);
    }

    updateRecord() {
        let recordsLength = this.records.length;
        let lastRecords = (recordsLength > this.maxRecordNum) ? this.records.slice(recordsLength - this.maxRecordNum, recordsLength) : this.records.concat();
        lastRecords.reverse();

        // 龙虎输赢比例
        let longCount = 0;
        let huCount = 0;
        let peaceCount = 0;
        let lhTotal = 0;
        let circles = this.circleList.children;
        for (let idx = 0; idx < lastRecords.length; idx++) {
            // 龙虎输赢
            let winArea = lastRecords[idx]; // 输赢、牌路是倒序，牌型是正序
            let nodeCircle = circles[idx];
            nodeCircle.active = true;
            let sprite = nodeCircle.getComponent(cc.Sprite);
            sprite.spriteFrame = this.sfCircle[winArea];
            if (winArea < Area.Peace) {
                lhTotal += 1;
                if (winArea === Area.Dragon) {
                    longCount += 1;
                } else if (winArea === Area.Tiger) {
                    huCount += 1;
                }
            } else {
                peaceCount += 1;
            }
        }

        // 最新20局
        let redPer = Math.floor(longCount / lhTotal * 100);
        this.longPercent.string = `${redPer}%`;
        this.longPro.progress = redPer / 100;
        this.huPercent.string = `${100 - redPer}%`;
        this.huPro.progress = (100 - redPer) / 100;

        let minPro = 0.3;
        let maxPro = 0.7;
        let longPro = this.longPro.progress;
        let huPro = this.huPro.progress;
        this.longPro.progress = (longPro > minPro) ? (longPro < maxPro ? longPro : maxPro) : minPro;
        this.huPro.progress = (huPro > minPro) ? (huPro < maxPro ? huPro : maxPro) : minPro;
        let longWidth = this.longBar.width;
        let huWidth = this.huBar.width;
        this.longPercent.node.setPositionX(longWidth - 15);
        this.huPercent.node.setPositionX(-huWidth + 15);
        this.nodeTitle.setPositionX(longWidth + 40);

        // 所有局数
        let allCount: number[] = [];
        for (let index = Area.Dragon; index <= Area.Peace; index++) {
            allCount[index] = 0;
        }
        for (let idx = 0; idx < this.records.length; idx++) {
            const area = this.records[idx];
            allCount[area]++;
        }
        this.lab_longWin.string = allCount[Area.Dragon].toString();
        this.lab_huWin.string = allCount[Area.Tiger].toString();
        this.lab_peaceWin.string = allCount[Area.Peace].toString();
        this.lab_total.string = this.records.length.toString();
    }

    /**
     * 根据数据更新牌路
     * @param records
     */
    updateCardRecords(records: number[], isUpdateNext: boolean) {
        if (!records || records.length === 0) {
            return;
        }
        cc.log("---------------updateTrend--------------------------------------------------");
        this.zhupanRecords(records);

        let num = 0;
        let dot1Arr = new Array<Dot>();
        //按记录先整理为一维数组
        for (let i = 0; i < records.length; i++) {
            //第一个是和
            if (i === 0 && records[i] === Area.Peace) {
                dot1Arr.push(new Dot(records[i], this.getPeaceCount(records, i) + 1, 0, num));
            } else {
                if (records[i] !== Area.Peace) {
                    num++;
                    dot1Arr.push(new Dot(records[i], this.getPeaceCount(records, i), 0, num));
                }
            }
        }
        //二维
        let twoArrRecords = this.oneChgTwoArr(dot1Arr);
        this.drawCardRecords(twoArrRecords, this.listDalu, this.preDalu, 22, 21, this.sfHollowCircle, false, num);
        this.viewDalu.scrollToRight();

        // 三小路
        this.dayanzaiRecords(twoArrRecords);
        this.xiaoluRecords(twoArrRecords);
        this.xiaoqiangRecords(twoArrRecords);

        // 探路
        if (isUpdateNext) {
            for (let i = Area.Dragon; i <= Area.Tiger; i++) {
                let recs = records.concat();
                recs.push(i);

                let num = 0;
                let dot1Arr = new Array<Dot>();
                for (let i = 0; i < recs.length; i++) {
                    if (i === 0 && recs[i] === Area.Peace) {
                        dot1Arr.push(new Dot(recs[i], this.getPeaceCount(recs, i) + 1, 0, num));
                    } else {
                        if (recs[i] !== Area.Peace) {
                            num++;
                            dot1Arr.push(new Dot(recs[i], this.getPeaceCount(recs, i), 0, num));
                        }
                    }
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
                    this.nextXl[i].spriteFrame = this.sfSolidCircle[oneArr2[oneArr2.length - 1].type];
                } else {
                    this.nextXl[i].node.active = false;
                }
                let oneArr3 = this.getSmallLuOneArr(twoArr, 3);
                if (oneArr3 && oneArr3[oneArr3.length - 1]) {
                    this.nextXql[i].node.active = true;
                    this.nextXql[i].spriteFrame = this.sfhalfCircle[oneArr3[oneArr3.length - 1].type];
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
        let minShowCol = 8;
        this.listZhupan.width = ((currColNum > minShowCol) ? currColNum : minShowCol) * 42;
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
                    sprite.spriteFrame = this.sfFontCircle[area];
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
                    if (dot.heCount > 0 && lab) {
                        lab.node.active = true;
                        lab.string = dot.heCount.toString();
                    }
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
        this.drawCardRecords(twoArrRecords, this.listDyz, this.preDyz, 11, 21, this.sfSmallHollowCircle, true, oneArr.length);
        this.viewDyz.scrollToRight();
    }

    /**
     * 小路
     * @param twoArrRecords
     */
    private xiaoluRecords(twoArrRecords: Dot[][]) {
        let oneArr = this.getSmallLuOneArr(twoArrRecords, 2);
        twoArrRecords = this.oneChgTwoArr(oneArr);
        this.drawCardRecords(twoArrRecords, this.listXl, this.preXl, 11, 21, this.sfSolidCircle, true, oneArr.length);
        this.viewXl.scrollToRight();
    }

    /**
     * 小强路
     * @param twoArrRecords
     */
    private xiaoqiangRecords(twoArrRecords: Dot[][]) {
        let oneArr = this.getSmallLuOneArr(twoArrRecords, 3);
        twoArrRecords = this.oneChgTwoArr(oneArr);
        this.drawCardRecords(twoArrRecords, this.listXql, this.preXql, 11, 21, this.sfhalfCircle, true, oneArr.length);
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
                    // cc.log("------colIdx = " + colIdx + "     rowIdx = " + rowIdx);
                    // cc.log(currDot);
                    // 从第二列第二行开始记录
                    if (colIdx > comBeforeCol || (colIdx === comBeforeCol && rowIdx > 0)) {
                        let beforeRow: number;
                        let beforeCol: number;
                        let beforeDot1: Dot;
                        let beforeDot2: Dot;
                        if (rowIdx === 0) {
                            // cc.log("row1");
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
                            // cc.log("row2");
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
                            compareType1 = beforeDot2.type === beforeDot2After.type ? Area.Tiger : Area.Dragon;
                        }
                        let type = currDot.type === beforeDot1.type ? Area.Tiger : Area.Dragon;
                        if (compareType1 !== undefined) {
                            type = compareType1 === type ? Area.Tiger : Area.Dragon;
                        }

                        oneArr.push(new Dot(type, 0, 0, oneArr.length + 1));
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

    private getPeaceCount(data: number[], curIdx: number) {
        let count = 0;
        for (let i = curIdx + 1; i < data.length; i++) {
            if (data[i] === Area.Peace) {
                count++;
            } else {
                break;
            }
        }
        return count;
    }

    clearTrend() {
        this.listDalu.removeAllChildren();
        this.listDyz.removeAllChildren();
        this.listXl.removeAllChildren();
        this.listXql.removeAllChildren();
        this.listZhupan.removeAllChildren();
        this.circleList.children.forEach(el => {
            el.active = false;
        });
        this.longPro.progress = 0.5;
        this.huPro.progress = 0.5;

        this.longPercent.string = `50%`;
        this.huPercent.string = `50%`;

        let longWidth = this.longBar.width;
        let huWidth = this.huBar.width;
        this.longPercent.node.setPositionX(longWidth - 15);
        this.huPercent.node.setPositionX(-huWidth + 15);
        this.nodeTitle.setPositionX(longWidth + 40);
    }
}

class Dot {
    constructor(public type: number, public heCount: number, public direction: number, public sort: number) {
    }
}