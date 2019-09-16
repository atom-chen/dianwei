import * as ErmjType from "./ermj";
import ErmjGame from "./ermjGame";
import GameLogic from "./ermjGameLogic";
import TingHuPai from "./ermjTingHuPai";

import * as util from "../common/util";
import { Gender } from "../common/user";

interface HuDescInfo {
    typeArr: number[],             // 描述类型(赢)
    typeArrLose: number[],          // 描述类型(输)
    isZimo: boolean,                    // 自摸
    zimoReverseNum: number,             // 被自摸
    isHu: boolean,                      // 接炮
    huReverseNum: number,               // 点炮
    huSort: number,                     // 胡牌顺序
    isCha: boolean,                      // 查大叫
    chaReverseNum: number,               // 被查大叫
}

const { ccclass, property } = cc._decorator;

@ccclass
export default class ErmjResult extends cc.Component {

    @property(cc.Node)
    private suc: cc.Node = undefined;
    @property(cc.Node)
    private fai: cc.Node = undefined;

    @property(cc.Node)
    private fan: cc.Node = undefined;
    @property(cc.Label)
    private money: cc.Label = undefined;

    @property(cc.Node)
    private nodeResults: cc.Node = undefined;

    @property(cc.Label)
    prepareTime: cc.Label = undefined;

    @property(cc.Node)
    private paiYou: cc.Node = undefined;
    @property(cc.Node)
    private benJia: cc.Node = undefined;

    times: string[];
    game: ErmjGame;
    private _prepareEndTime: number;
    private _gameLogic: GameLogic;
    private _tingHuPai: TingHuPai;

    // 保存结算需要的数据
    private _changeScoreArr: { type: number[], changeScore: ErmjType.ChangeScore[] }[] = [];
    private _taxScoreArr: { rPos: number, tax: string }[] = [];
    private _saveGangDataArr: { [rPos: number]: ErmjType.PGangInfo[] } = [];
    private _savePlayerInfoArr: ErmjType.PlayerInfo[] = [];

    // 整理数据
    private _huDescInfoArr: HuDescInfo[] = [];
    private _resultScoreArr: number[] = [];
    private _resultTaxArr: number[] = [];
    private _resultHold: { [rPos: number]: ErmjType.GameResult };
    private _huPlayerNum: number;

    private richTextCol: string;
    private readonly PLAY_NUM = 2;
     readonly HU_DESC_ARR: { [huType: number]: string } = {
        //88番
        [ErmjType.HU_TYPE_ER.HUPAI_DA_SI_XI]: '大四喜',
        [ErmjType.HU_TYPE_ER.HUPAI_DA_SAN_YUAN]: '大三元',
        [ErmjType.HU_TYPE_ER.HUPAI_JIU_LIAN_BAO_DENG]: '九莲宝灯',
        [ErmjType.HU_TYPE_ER.HUPAI_SI_GANG]: '四杠',
        [ErmjType.HU_TYPE_ER.HUPAI_LIAN_QI_DUI]: '连七对',
        [ErmjType.HU_TYPE_ER.HUPAI_TIAN_HE]: '天和',
        [ErmjType.HU_TYPE_ER.HUPAI_DI_HE]: '地和',
        [ErmjType.HU_TYPE_ER.HUPAI_REN_HE]: '人和',
        [ErmjType.HU_TYPE_ER.HUPAI_BAI_WAN_DAN]: '百万石',
        //64番
        [ErmjType.HU_TYPE_ER.HUPAI_XIAO_SI_XI]: '小四喜',
        [ErmjType.HU_TYPE_ER.HUPAI_XIAO_SAN_YUAN]: '小三元',
        [ErmjType.HU_TYPE_ER.HUPAI_ZI_YI_SE]: '字一色',
        [ErmjType.HU_TYPE_ER.HUPAI_SI_AN_KE]: '四暗刻',
        [ErmjType.HU_TYPE_ER.HUPAI_YI_SE_SHUANG_LONG_HUI]: '一色双龙会',
        //48番
        [ErmjType.HU_TYPE_ER.HUPAI_YI_SE_SI_TONG_SHUN]: '一色四同顺',
        [ErmjType.HU_TYPE_ER.HUPAI_YI_SE_SI_JIE_GAO]: '一色四节高',
        //32番
        [ErmjType.HU_TYPE_ER.HUPAI_YI_SE_SI_BU_GAO]: '一色四步高',
        [ErmjType.HU_TYPE_ER.HUPAI_SAN_GANG]: '三杠',
        [ErmjType.HU_TYPE_ER.HUPAI_HUN_YAO_JIU]: '混幺九',
        //24番
        [ErmjType.HU_TYPE_ER.HUPAI_QI_DUI]: '七对',
        [ErmjType.HU_TYPE_ER.HUPAI_QING_YI_SE]: '清一色',
        [ErmjType.HU_TYPE_ER.HUPAI_YI_SE_SAN_TONG_SHUN]: '一色三同顺',
        [ErmjType.HU_TYPE_ER.HUPAI_YI_SE_SAN_JIE_GAO]: '一色三节高',
        //16番
        [ErmjType.HU_TYPE_ER.HUPAI_QING_LONG]: '青龙',
        [ErmjType.HU_TYPE_ER.HUPAI_YI_SE_SAN_BU_GAO]: '一色三步高',
        [ErmjType.HU_TYPE_ER.HUPAI_SAN_AN_KE]: '三暗刻',
        [ErmjType.HU_TYPE_ER.HUPAI_TIAN_TING]: '天听',
        //12番
        [ErmjType.HU_TYPE_ER.HUPAI_DA_YU_WU]: '大于5',
        [ErmjType.HU_TYPE_ER.HUPAI_XIAO_YU_WU]: '小于5',
        [ErmjType.HU_TYPE_ER.HUPAI_SAN_FENG_KE]: '三风刻',
        //8番
        [ErmjType.HU_TYPE_ER.HUPAI_MIAO_SHOU_HUI_CHUN]: '妙手回春',
        [ErmjType.HU_TYPE_ER.HUPAI_HAI_DI_LAO_YUE]: '海底捞月',
        [ErmjType.HU_TYPE_ER.HUPAI_GANG_SHANG_KAI_HUA]: '杠上开花',
        [ErmjType.HU_TYPE_ER.HUPAI_QIANG_GANG_HE]: '抢杠和',
        //6番
        [ErmjType.HU_TYPE_ER.HUPAI_PENG_PENG_HE]: '碰碰和',
        [ErmjType.HU_TYPE_ER.HUPAI_HUN_YI_SE]: '混一色',
        [ErmjType.HU_TYPE_ER.HUPAI_QUAN_QIU_REN]: '全求人',
        [ErmjType.HU_TYPE_ER.HUPAI_SHUANG_AN_GANG]: '双暗杠',
        [ErmjType.HU_TYPE_ER.HUPAI_SHUANG_JIAN_KE]: '双箭刻',
        //4番
        [ErmjType.HU_TYPE_ER.HUPAI_QUAN_DAI_YAO]: '全带幺',
        [ErmjType.HU_TYPE_ER.HUPAI_BU_QIU_REN]: '不求人',
        [ErmjType.HU_TYPE_ER.HUPAI_SHUANG_MING_GANG]: '双明杠',
        [ErmjType.HU_TYPE_ER.HUPAI_HE_JUE_ZHANG]: '和绝张',
        [ErmjType.HU_TYPE_ER.HUPAI_LI_ZHI]: '立直',
        //2番
        [ErmjType.HU_TYPE_ER.HUPAI_JIAN_KE]: '箭刻',
        [ErmjType.HU_TYPE_ER.HUPAI_QUAN_FENG_KE]: '圈风刻',
        [ErmjType.HU_TYPE_ER.HUPAI_MEN_FENG_KE]: '门风刻',
        [ErmjType.HU_TYPE_ER.HUPAI_MEN_QIAN_QIANG]: '门前清',
        [ErmjType.HU_TYPE_ER.HUPAI_PING_HE]: '平和',
        [ErmjType.HU_TYPE_ER.HUPAI_SI_GUI]: '四归一',
        [ErmjType.HU_TYPE_ER.HUPAI_SHUANG_AN_KE]: '双暗刻',
        [ErmjType.HU_TYPE_ER.HUPAI_AN_GANG]: '暗杠',
        [ErmjType.HU_TYPE_ER.HUPAI_DUAN_YAO]: '断幺',
        //1番
        [ErmjType.HU_TYPE_ER.HUPAI_ER_WU_BA_JIANG]: '二五八将',
        [ErmjType.HU_TYPE_ER.HUPAI_YAO_JIU_TOU]: '幺九头',
        [ErmjType.HU_TYPE_ER.HUPAI_BAO_TING]: '报听',
        [ErmjType.HU_TYPE_ER.HUPAI_YI_BAN_GAO]: '一般高',
        [ErmjType.HU_TYPE_ER.HUPAI_LIAN_LIU]: '连六',
        [ErmjType.HU_TYPE_ER.HUPAI_LAO_SHAO_FU]: '老少副',
        [ErmjType.HU_TYPE_ER.HUPAI_YAO_JIU_KE]: '幺九刻',
        [ErmjType.HU_TYPE_ER.HUPAI_MING_GANG]: '明杠',
        [ErmjType.HU_TYPE_ER.HUPAI_BIAN_ZHANG]: '边张',
        [ErmjType.HU_TYPE_ER.HUPAI_KAN_ZHANG]: '坎张',
        [ErmjType.HU_TYPE_ER.HUPAI_DAN_DIAO_JIANG]: '单调将',
        [ErmjType.HU_TYPE_ER.HUPAI_ZI_MO]: '自摸',
    }

    onLoad() {
        this._gameLogic = new GameLogic();
        this._tingHuPai = new TingHuPai();

        this.suc.getChildByName('win_settlement_05').runAction(cc.repeatForever(cc.rotateBy(1, 60)));
        this.fai.getChildByName('loss_settlement_05').runAction(cc.repeatForever(cc.rotateBy(1, 60)));
    }

    show(results: ErmjType.GameResult[], roomID?: string) {

        this.paiYou.active = true;
        this.benJia.active = false;

        this.node.active = true;
        this.node.opacity = 0;
        this.node.runAction(cc.fadeTo(1, 255));

        this._resultHold = [];
        results.forEach((v) => {
            this._resultHold[v.rPos] = v;
        });

        for (let r of results) {
            let isMe = this.game.playerMgr.me.serverPos === r.rPos;
            
            let rNode = this.nodeResults.children[+isMe]
            // rNode.active = isMe;
            
            this.updateHold(rNode.getChildByName('pai'), r.rPos);
            let fans = rNode.getChildByName('fans');
            if (+r.chgMoney > 0) {
                fans.active = true;
                fans.removeAllChildren();
                let total = 0;
                for (const t of this._changeScoreArr[0].type) {
                    let fanDes = cc.instantiate(this.fan);
                    let labs = fanDes.getComponentsInChildren(cc.Label);
                    labs[0].string = this.HU_DESC_ARR[t];
                    labs[1].string = ErmjType.TypeFan[t] + '番';
                    labs[1].node.active = true;
                    fans.addChild(fanDes);
                    total += ErmjType.TypeFan[t];
                }

                let labs = rNode.getComponentsInChildren(cc.Label);
                labs[1].string = total + '番';
                labs[1].node.active = true;
                let hu = rNode.getComponentInChildren(cc.Sprite);
                hu.node.active = true;
                labs[2].string = '+' + r.chgMoney;
                labs[4].string = this.times[0] + '倍';
                
                if (isMe) {
                    labs[4].string = this.times[1] + '倍';

                    this.suc.active = true;
                    this.fai.active = false;
                }

            } else {
                fans.active = false;

                let labs = rNode.getComponentsInChildren(cc.Label);
                labs[1].node.active = false;
                let hu = rNode.getComponentInChildren(cc.Sprite);
                hu.node.active = false;
                labs[2].string = r.chgMoney;
                labs[4].string = '';
                
                if (+r.chgMoney < 0) {
                    if (isMe) {

                        this.suc.active = false;
                        this.fai.active = true;
                        this.fai.getChildByName('shibai').active = true;
                        this.fai.getChildByName('liuju').active = false;
                    }
                } else {
                    if (isMe) {

                        this.suc.active = false;
                        this.fai.active = true;
                        this.fai.getChildByName('shibai').active = false;
                        this.fai.getChildByName('liuju').active = true;
                    }
                }
            }
        }

    }

    toggle() {
        for (const n of [...this.nodeResults.children, this.paiYou, this.benJia]) {
            n.active = !n.active;
        }
    }

    hide() {
        this.resetData();
        this.node.active = false;
    }

    resetData() {
        if (!this.node.active) {
            return;
        }
        this._changeScoreArr = [];
        this._saveGangDataArr = [];
        this._savePlayerInfoArr = [];
        this._taxScoreArr = [];
    }

    set changeScoreData(data: { type: number[], changeScore: ErmjType.ChangeScore[] }[]) {
        this._changeScoreArr = data;
    }

    get changeScoreData(): { type: number[], changeScore: ErmjType.ChangeScore[] }[] {
        return this._changeScoreArr;
    }

    addChangeScore(data: { type: number[], changeScore: ErmjType.ChangeScore[] }) {
        this._changeScoreArr.push(data);
    }

    set taxScoreData(data: { rPos: number, tax: string }[]) {
        this._taxScoreArr = data;
    }

    addTaxScore(data: { rPos: number, tax: string }) {
        this._taxScoreArr.push(data);
    }

    set playerInfoData(data: ErmjType.PlayerInfo[]) {
        this._savePlayerInfoArr = data;
    }

    // 修改杠数据 (抢杠胡数据)
    updateGangData(pos: number) {
        let gangDataArr = this._saveGangDataArr[pos];
        let lastGangData = gangDataArr[gangDataArr.length - 1];
        if (ErmjType.GangType.GANG_TYPE_ADD === lastGangData.type)
            lastGangData.type = ErmjType.GangType.GANG_TYPE_PENG;
    }

    /**
     * 保存碰杠数据
     * @param pos 
     * @param gangInfo 
     */
    saveGangData(pos: number, gangInfo: ErmjType.PGangInfo) {
        if (this._saveGangDataArr[pos] === undefined)
            this._saveGangDataArr[pos] = [];
        if (ErmjType.GangType.GANG_TYPE_ADD === gangInfo.type) {
            let gangDataArr = this._saveGangDataArr[pos];
            if (gangDataArr.length > 0) {
                // 杠是由碰得来的
                for (let index = 0; index < gangDataArr.length; index++) {
                    let gangData = gangDataArr[index];
                    if ((gangData.type === ErmjType.GangType.GANG_TYPE_PENG) && (gangData.pai === gangInfo.pai)) {
                        let idx = this._saveGangDataArr[pos].indexOf(gangData);
                        if (idx > -1)
                            this._saveGangDataArr[pos].splice(idx, 1);
                        break;
                    }
                }
            }
        }
        this._saveGangDataArr[pos].push(gangInfo);
    }

    /**
     * 保存玩家数据
     */
    savePlayerData() {
        this._savePlayerInfoArr = [];
        for (let posIdx = 0; posIdx < this.game.playerMgr.getPlayerCount(); posIdx++) {
            let playerInfo = this.game.playerMgr.getPlayerByServerPos(posIdx);
            if (playerInfo) {
                let saveInfo: ErmjType.PlayerInfo = {
                    isMale: playerInfo.isMale,
                    avatar: playerInfo.avatar,
                    location: playerInfo.location,
                    name: playerInfo.name,
                    isMe: playerInfo.isMe,
                    isDealer: playerInfo.isDealer,
                }
                this._savePlayerInfoArr[posIdx] = saveInfo;
            }
        }
    }

    arrangeHuDescInfo() {
        let playerHuInfoArr: HuDescInfo[] = [];
        for (let index = 0; index < this.PLAY_NUM; index++) {
            let info: HuDescInfo = {
                typeArr: [], typeArrLose: [], isZimo: false, zimoReverseNum: 0,
                isHu: false, huReverseNum: 0, huSort: 0, isCha: false, chaReverseNum: 0
            }
            playerHuInfoArr.push(info);
        }

        // 把描述信息按座位号存下来
        let huPlayerNum = 0;
        this._changeScoreArr.forEach((info, i) => {
            let winRPos = 0;
            let firstType = info.type[0];
            // 退杠情况，除了退杠外其余的一组数据中都只有一个得分者
            if (0) {
                info.changeScore.forEach(scoreInfo => {
                    if (scoreInfo.changeScore > 0)
                        playerHuInfoArr[scoreInfo.rPos].typeArr.push(firstType);
                });
            } else {
                if (firstType >= ErmjType.HU_TYPE_ER.HUPAI_HU_PAI) {
                    let isZimo = false;
                    let isCha = false;
                    info.type.forEach(typeIdx => {
                        if (typeIdx === ErmjType.HU_TYPE_ER.HUPAI_ZI_MO) {
                            isZimo = true;
                        }
                        if (0) {
                            isCha = true;
                        }
                    });
                    if (!isCha) {
                        huPlayerNum += 1;
                    }
                    info.changeScore.forEach(scoreInfo => {
                        if (scoreInfo.changeScore > 0) {
                            winRPos = scoreInfo.rPos;
                            if (isZimo)
                                playerHuInfoArr[scoreInfo.rPos].isZimo = true;
                            else if (isCha)
                                playerHuInfoArr[scoreInfo.rPos].isCha = true;
                            else
                                playerHuInfoArr[scoreInfo.rPos].isHu = true;
                        } else {
                            if (isZimo)
                                playerHuInfoArr[scoreInfo.rPos].zimoReverseNum += 1;
                            else if (isCha)
                                playerHuInfoArr[scoreInfo.rPos].chaReverseNum += 1;
                            else
                                playerHuInfoArr[scoreInfo.rPos].huReverseNum += 1;
                        }
                    });
                    playerHuInfoArr[winRPos].huSort = huPlayerNum;
                } else {
                    info.changeScore.forEach(scoreInfo => {
                        if (scoreInfo.changeScore > 0)
                            winRPos = scoreInfo.rPos;
                    });
                }
                info.type.forEach(typeIdx => {
                    playerHuInfoArr[winRPos].typeArr.push(typeIdx);
                });

                // 记录输的状态
                let losePlayerArr: number[] = [];
                info.changeScore.forEach(scoreInfo => {
                    if (scoreInfo.changeScore < 0)
                        losePlayerArr.push(scoreInfo.rPos);
                });
                losePlayerArr.forEach((s) => {
                    info.type.forEach(typeIdx => {
                        playerHuInfoArr[s].typeArrLose.push(typeIdx);
                    });
                });

            }
        });
        this._huPlayerNum = huPlayerNum;
        this._huDescInfoArr = playerHuInfoArr;
    }

    arrangeScoreInfo() {
        let scoreArr = [0, 0, 0, 0];
        this._changeScoreArr.forEach((changeScoreInfo) => {
            changeScoreInfo.changeScore.forEach((scoreInfo) => {
                scoreArr[scoreInfo.rPos] = util.add(scoreArr[scoreInfo.rPos], scoreInfo.changeScore).toNumber();
            });
        });
        this._resultScoreArr = scoreArr;

        let taxArr = [0, 0, 0, 0];
        this._taxScoreArr.forEach((info) => {
            taxArr[info.rPos] = util.add(taxArr[info.rPos], info.tax).toNumber();
        });
        this._resultTaxArr = taxArr;
    }

    updatePanel(panel: cc.Node, rPos: number) {
        panel.active = true;
        let bg = panel.getChildByName("bg").getComponent(cc.Sprite);
        let player = this._savePlayerInfoArr[rPos];


        this.updateUser(panel.getChildByName("userInfo"), rPos);
        this.updateHuDesc(panel.getChildByName("huInfo"), rPos);
        this.updateHold(panel.getChildByName("pai"), rPos);
        this.updateScore(panel.getChildByName("scoreInfo"), rPos);
    }

    updateUser(userPanel: cc.Node, rPos: number) {
        let playerInfo = this._savePlayerInfoArr[rPos]
        let avatar = userPanel.getChildByName("avatar").getComponent(cc.Sprite);
        let dealer = userPanel.getChildByName("d");
        let loc = userPanel.getChildByName("loc").getComponent(cc.Label);

        avatar.spriteFrame = util.getAvatar(playerInfo.isMale, playerInfo.avatar);
        dealer.active = playerInfo.isDealer;
        loc.string = util.parseLocation(playerInfo.location);
    }

    updateHold(paiPanel: cc.Node, rPos: number) {

        const SEAT = 2; //碰杠、手牌的展示和上方玩家的展示相同

        let gangPanel = paiPanel.getChildByName("gang");
        let holdPanel = paiPanel.getChildByName("hold");
        let huPanel = paiPanel.getChildByName("hu");
        gangPanel.removeAllChildren();
        holdPanel.removeAllChildren();
        huPanel.removeAllChildren();
        gangPanel.width = 0;
        holdPanel.width = 0;
        huPanel.width = 0;

        let gangValArr = this._saveGangDataArr[rPos];
        if (gangValArr && gangValArr.length > 0) {
            for (let idx = 0; idx < gangValArr.length; idx++) {
                let info = gangValArr[idx];
                let model = this.game.mahjongRes.getGangModel(SEAT, info.pai, info.type);
                gangPanel.addChild(model);
            }
        }

        let resultHold = this._resultHold[rPos];
        let handlePaiArr = resultHold.handlePai;
        handlePaiArr.sort((a, b) => { return a - b });
        for (let idx = 0; idx < handlePaiArr.length; idx++) {
            let paiVal = handlePaiArr[idx];
            let model = this.game.mahjongRes.getDiscardModel(SEAT, paiVal);
            model.y = 0;
            holdPanel.addChild(model);
        }

        if (0 != resultHold.huPai) {
            let model = this.game.mahjongRes.getDiscardModel(SEAT, resultHold.huPai);
            model.setPosition(10, 0);
            huPanel.addChild(model);
        }
    }

    updateHuDesc(descPanel: cc.Node, rPos: number) {
        let lb_desc = descPanel.getChildByName("desc").getComponent(cc.RichText);
        let lb_fan = descPanel.getChildByName("lb_fan").getComponent(cc.Label);
        let lb_chadajiao = descPanel.getChildByName("lb_chadajiao").getComponent(cc.Label);
        let huBox = descPanel.getChildByName("hu");

        // 显示描述过程
        let descInfo = this._huDescInfoArr[rPos];
        let typeArr = descInfo.typeArr.concat();
        let newTypeArr: string[] = [];
        for (let index = 0; index < descInfo.typeArr.length; index++) {
            let element = typeArr[index];
            if (element !== undefined) {
                let sameNum = 0;
                for (let index1 = 0; index1 < typeArr.length; index1++) {
                    let tempElement = typeArr[index1];
                    if (tempElement === element) {
                        sameNum += 1;
                        typeArr[index1] = undefined;
                    }
                }
                newTypeArr.push(`${element}:${sameNum}`);
            }
        }

        this.setRichCol("#ffffff");
        let text = "";
        if (newTypeArr.length > 0) {
            newTypeArr.sort();
            for (let index = 0; index < newTypeArr.length; index++) {
                let element = newTypeArr[index];
                let segmentationIdx = element.indexOf(":");
                let typeVal = +element.substr(0, segmentationIdx);
                let typeNum = +element.substr(segmentationIdx + 1);

                text += this.getRichTextStr(this.HU_DESC_ARR[typeVal]);
                text += this.getRichTextStr("  ");
            }
        }

        if (descInfo.huReverseNum > 0) {
            this.setRichCol("#8ecef5");
            text += this.getRichTextStr(`点炮  `);

        }
        if (descInfo.zimoReverseNum > 0) {
            this.setRichCol("#8ecef5");
            text += this.getRichTextStr(`被自摸  `);
        }
        lb_desc.string = text;

        if (descInfo.isZimo || descInfo.isHu || descInfo.isCha) {
            huBox.active = false;
            lb_chadajiao.node.active = false;
            let zimo = huBox.getChildByName("zimo");
            let hu = huBox.getChildByName("hu");
            let times = huBox.getChildByName("times");

            if (descInfo.isCha) {
                lb_chadajiao.node.active = true;

                lb_chadajiao.node.color = cc.Color.YELLOW;
                lb_chadajiao.string = "查大叫";
            } else {
                huBox.active = true;

                if (descInfo.isZimo) {
                    hu.active = false;
                } else {
                    zimo.active = false;
                }
                let huPlayer = times.getComponentInChildren(cc.Label);
                if (descInfo.huSort > 0)
                    huPlayer.string = "" + descInfo.huSort;
            }

            // 计算番数
            let fanInfo = this.GetHuFanScore(descInfo.typeArr);
            lb_fan.string = fanInfo + "番";
        } else {
            huBox.active = false;
            lb_chadajiao.node.active = false;
            lb_fan.node.active = false;
            if (this._huPlayerNum < this.PLAY_NUM) {
                lb_chadajiao.node.active = true;
                if (descInfo.chaReverseNum > 0) {
                    lb_chadajiao.node.color = cc.Color.GREEN;
                    lb_chadajiao.string = "赔叫";
                } else {
                    let isJiao = this.isCheckJiao(rPos);
                    if (isJiao) {
                        lb_chadajiao.node.color = cc.Color.YELLOW;
                        lb_chadajiao.string = "未胡";
                    } else {
                        lb_chadajiao.node.color = cc.Color.GREEN;
                        lb_chadajiao.string = "未听";
                    }
                }
            } else {
                lb_chadajiao.node.active = true;
                lb_chadajiao.node.color = cc.Color.YELLOW;
                lb_chadajiao.string = "未胡";
            }
        }
    }

    updateScore(scorePanel: cc.Node, rPos: number) {
        let scoreArr = this._resultScoreArr;
        let taxScoreArr = this._resultTaxArr;

        let shuiBox = scorePanel.getChildByName("shui");
        let goldBox = scorePanel.getChildByName("gold");
        let goldIcon1 = shuiBox.getChildByName("goldIcon").getComponent(cc.Sprite);
        let goldIcon2 = goldBox.getChildByName("goldIcon").getComponent(cc.Sprite);

        if (taxScoreArr[rPos] > 0) {
            shuiBox.active = true;
            goldBox.active = false;
            let lb_score = shuiBox.getChildByName("lb_score").getComponent(cc.Label);
            let r = util.mul(scoreArr[rPos], 1)
            let currScore = util.sub(r, taxScoreArr[rPos]).toNumber();
            if (currScore <= 0) {
                // 把退杠的钱补回来
                shuiBox.active = false;
                currScore = util.add(currScore, taxScoreArr[rPos]).toNumber();
            }
            lb_score.string = "" + currScore;
            lb_score.node.color = cc.Color.YELLOW;
        } else {
            goldBox.active = true;
            shuiBox.active = false;
            let lb_score = goldBox.getChildByName("lb_score").getComponent(cc.Label);
            let totalScore = util.mul(scoreArr[rPos], 1).toNumber();
            lb_score.string = "" + totalScore;
            if (totalScore >= 0)
                lb_score.node.color = cc.Color.YELLOW;
            else
                lb_score.node.color = cc.Color.GREEN;
        }

    }

    setRichCol(color: string) {
        this.richTextCol = color;
    }
    getRichTextStr(desc: string) {
        return `<color=${this.richTextCol}>${desc}</color>`;
    }

    private isCheckJiao(rPos: number): boolean {
        let handlePaiArr = this._resultHold[rPos].handlePai;
        let holdsStrArr: string[] = [];
        for (let index = 0; index < handlePaiArr.length; index++) {
            let paiVal = handlePaiArr[index];
            holdsStrArr.push(paiVal.toString());
        }
        let listens = this._tingHuPai.GetListens(holdsStrArr);
        if (listens.length > 0)
            return true;
        return false;
    }

    GetHuFanScore(arr: number[]) {
        let fan = 0;
        for (const type of arr) {
            fan += ErmjType.TypeFan[type]
        }
        return fan;
    }

    showTicker(timer: number) {
        this.prepareTime.node.active = true;
        this._prepareEndTime = Date.now() + timer;
        let t = Math.round(timer / 1000);
        this.prepareTime.string = t.toString();
        this.unschedule(this.countdownPre);
        this.schedule(this.countdownPre, 1, t, 1);
    }

    private countdownPre() {
        let now = Date.now();
        if (!this.prepareTime || !this.prepareTime.isValid || now >= this._prepareEndTime) {
            this.unschedule(this.countdownPre);
            return;
        }
        let t = Math.round((this._prepareEndTime - now) / 1000);
        this.prepareTime.string = t.toString();

    }
    onClickBack() {
        window.pomelo.request("lobby.lobbyHandler.leaveGame", {}, () => { });
    }

    onClickShare() {
        this.hide();
        this.game.changeRoom();
    }

    onClickNext() {
        this.hide();
        this.game.doPrepare();
    }
}
