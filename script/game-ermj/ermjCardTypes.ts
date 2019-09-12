import MahjongRes from "../game-share/mahjongRes";
import PopActionBox from "../lobby/popActionBox"
import { PlayerSeat } from "./ermj";
import * as util from "../common/util";
const { ccclass, property } = cc._decorator;

@ccclass
export default class ermjCardTypes extends PopActionBox {
    @property(cc.ScrollView)
    private svList: cc.ScrollView = undefined;

    @property(cc.Node)
    private svItem: cc.Node = undefined;

    @property(cc.Prefab)
    private preMjRes: cc.Prefab = undefined;

    private allInfoArr: Array<{ desc: string, paiData: Array<number> }> = [
        { desc: "大四喜（88番）", paiData: [41, 41, 41, 43, 43, 43, 45, 45, 45, 47, 47, 47, 12, 12] },
        { desc: "大三元（88番）", paiData: [51, 51, 51, 53, 53, 53, 55, 55, 55, 11, 11, 13, 13, 13] },
        { desc: "九莲宝灯（88番）", paiData: [11, 11, 11, 12, 13, 14, 15, 16, 17, 18, 19, 19, 19, 19] },
        { desc: "四杠（88番）", paiData: [11, 11, 11, 11, 13, 13, 13, 13, 14, 14, 14, 14, 15, 15, 15, 15, 17, 17] },
        { desc: "连七对（88番）", paiData: [11, 11, 12, 12, 13, 13, 14, 14, 15, 15, 16, 16, 17, 17] },
        { desc: "百万石（88番）", paiData: [15, 15, 16, 16, 16, 17, 17, 17, 18, 18, 18, 19, 19, 19] },

        { desc: "小四喜（64番）", paiData: [41, 41, 41, 43, 43, 43, 45, 45, 45, 47, 47, 12, 12, 12] },
        { desc: "小三元（64番）", paiData: [51, 51, 51, 53, 53, 53, 55, 55, 11, 11, 11, 13, 13, 13] },
        { desc: "字一色（64番）", paiData: [41, 41, 41, 43, 43, 43, 45, 45, 45, 51, 51, 51, 53, 53] },
        { desc: "四暗刻（64番）", paiData: [11, 11, 11, 13, 13, 13, 14, 14, 14, 15, 15, 15, 41, 41] },
        { desc: "一色双龙会（64番）", paiData: [11, 11, 12, 12, 13, 13, 15, 15, 17, 17, 18, 18, 19, 19] },

        { desc: "一色四同顺（48番）", paiData: [11, 11, 11, 11, 12, 12, 12, 12, 13, 13, 13, 13, 14, 14] },
        { desc: "一色四节高（48番）", paiData: [13, 13, 13, 14, 14, 14, 15, 15, 15, 16, 16, 16, 19, 19] },

        { desc: "一色四步高（32番）", paiData: [11, 12, 13, 13, 14, 15, 15, 16, 17, 17, 18, 19, 41, 41] },
        { desc: "三杠（32番）", paiData: [12, 12, 12, 12, 16, 16, 16, 16, 18, 18, 18, 18, 19, 19, 19, 41, 41] },
        { desc: "混幺九（32番）", paiData: [11, 11, 11, 19, 19, 19, 41, 41, 41, 43, 43, 43, 45, 45] },

        { desc: "七对（24番）", paiData: [11, 11, 13, 13, 15, 15, 16, 16, 18, 18, 19, 19, 41, 41] },
        { desc: "清一色（24番）", paiData: [11, 11, 11, 12, 13, 14, 15, 15, 15, 16, 16, 16, 18, 18] },
        { desc: "一色三同顺（24番）", paiData: [11, 11, 11, 12, 12, 12, 13, 13, 13, 16, 16, 16, 18, 18] },
        { desc: "一色三节高（24番）", paiData: [11, 11, 11, 12, 12, 12, 13, 13, 13, 16, 16, 16, 18, 18] },

        { desc: "青龙（16番）", paiData: [11, 12, 13, 14, 15, 16, 17, 18, 19, 41, 41, 41, 43, 43] },
        { desc: "一色三步高（16番）", paiData: [11, 12, 13, 13, 14, 15, 15, 16, 17, 18, 18, 18, 41, 41] },
        { desc: "三暗刻（16番）", paiData: [11, 11, 11, 13, 13, 13, 14, 14, 14, 16, 17, 18, 41, 41] },

        { desc: "大于5（12番）", paiData: [16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19] },
        { desc: "小于5（12番）", paiData: [11, 11, 11, 11, 12, 12, 12, 12, 13, 13, 13, 13, 14, 14] },
        { desc: "三风刻（12番）", paiData: [41, 41, 41, 43, 43, 43, 45, 45, 45, 51, 51, 51, 53, 53] },

        { desc: "碰碰和（6番）", paiData: [11, 11, 11, 12, 12, 12, 13, 13, 13, 14, 14, 14, 15, 15] },
        { desc: "混一色（6番）", paiData: [11, 11, 11, 13, 13, 13, 14, 14, 14, 41, 41, 41, 51, 51] },
        { desc: "双箭刻（6番）", paiData: [11, 12, 13, 15, 16, 17, 41, 41, 51, 51, 51, 55, 55, 55] },

        { desc: "全带幺（4番）", paiData: [11, 12, 13, 17, 17, 18, 18, 19, 19, 41, 41, 41, 43, 43] },

        { desc: "箭刻（2番）", paiData: [11, 12, 13, 14, 15, 16, 16, 17, 18, 41, 41, 51, 51, 51] },
        { desc: "平和（2番）", paiData: [11, 12, 13, 13, 14, 15, 16, 17, 18, 17, 18, 19, 16, 16] },
        { desc: "四归一（2番）", paiData: [11, 11, 11, 11, 12, 13, 14, 15, 16, 18, 18, 18, 41, 41] },
        { desc: "双暗刻（2番）", paiData: [11, 11, 11, 12, 12, 12, 13, 14, 15, 16, 17, 18, 41, 41] },
        { desc: "断幺（2番）", paiData: [12, 12, 12, 14, 14, 14, 15, 16, 17, 17, 17, 17, 18, 18] },

        { desc: "二五八将（1番）", paiData: [11, 11, 11, 12, 12, 13, 14, 15, 16, 16, 16, 41, 41, 41] },
        { desc: "幺九头（1番）", paiData: [11, 11, 13, 14, 15, 16, 16, 16, 18, 18, 18, 41, 41, 41] },
        { desc: "一般高（1番）", paiData: [11, 11, 12, 12, 13, 13, 16, 16, 16, 16, 17, 18, 41, 41] },
        { desc: "连六（1番）", paiData: [11, 12, 13, 14, 15, 16, 18, 18, 18, 41, 41, 41, 43, 43] },
        { desc: "老少副（1番）", paiData: [11, 12, 13, 17, 18, 19, 14, 14, 14, 16, 16, 16, 41, 41] },
        { desc: "幺九刻（1番）", paiData: [11, 11, 11, 12, 13, 14, 15, 16, 17, 17, 18, 19, 41, 41] },

    ];
    private mahjongRes: MahjongRes;

    private page = 0;

    onLoad() {
        super.onLoad();
        this.svList.node.active = false;
        this.mahjongRes = util.instantiate(this.preMjRes).getComponent(MahjongRes);
    }

    protected start() {
        this.openAnim(() => {
            this.svList.node.active = true;
            this.load();
        });
    }

    open() {
        this.node.scale = 1;
        this.svList.node.opacity = 0;
        this.openAnim(() => {
            this.svList.node.opacity = 255;
        });
    }

    scroll(ev: any, et: cc.ScrollView.EventType) {
        if (cc.ScrollView.EventType.SCROLL_TO_BOTTOM === et) {
            this.load();
        }
    }

    load() {
        let content = this.svList.content;
        for (let ofs = 0; ofs < this.allInfoArr.length; ofs++) {
            let idx = this.page * 5 + ofs;
            let allInfo = this.allInfoArr[idx];
            if (!allInfo) {
                break;
            }

            let item = util.instantiate(this.svItem);
            item.active = true;
            content.addChild(item);
            let labDesc = item.getChildByName("fan").getComponent(cc.Label);
            labDesc.string = `${idx + 1}、${allInfo.desc}`;

            let itemSv = item.getChildByName("paiSv").getComponent(cc.ScrollView);
            let itemSvContent = itemSv.content;
            for (let paiIdx = 0; paiIdx < allInfo.paiData.length; paiIdx++) {
                let pai = allInfo.paiData[paiIdx];
                let model = this.mahjongRes.getDiscardModel(PlayerSeat.SEAT_SELF, pai);
                model.y = 3;
                itemSvContent.addChild(model);
            }
        }
        this.page++;
    }

    protected closeAction(cb?: Function, isDestroy = true) {
        this.node.scale = 0;
    }
}
