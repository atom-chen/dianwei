import * as util from "../common/util";
import { ErrCodes } from "../common/code";

const { ccclass, property } = cc._decorator;

interface CardPayInfo {
    Name: string;
    Desciption: string;
    CardMainType: string;
    CardSubType: string;
    NeedNo: boolean;
    NeedPwd: boolean;
    NeedMoney: boolean;
    OptionTypesUnpack: string[];
    ValuesUnpack: number[];
}

@ccclass
export default class CardList extends cc.Component {

    @property(cc.Node)
    private type: cc.Node = undefined;

    @property(cc.EditBox)
    private cardNum: cc.EditBox = undefined;

    @property(cc.EditBox)
    private cardPwd: cc.EditBox = undefined;

    @property(cc.Node)
    private money: cc.Node = undefined;

    @property(cc.Node)
    private typeParent: cc.Node = undefined;

    @property(cc.Node)
    private moneyParent: cc.Node = undefined;

    @property([cc.SpriteFrame])
    private typeFrames: cc.SpriteFrame[] = [];


    private typeNames = ['电信', '联通', '移动', '易充纵游卡'];
    private _cardPayInfo: any;

    protected onLoad() {
        this.type.active = false;
        this.money.active = false;
    }

    removeTogs(node: cc.Node) {
        for (let i = node.childrenCount - 1; i > -1; i--) {
            let child = node.children[i]
            if (child.active)
                child.removeFromParent();
        }
    }

    setCardPayInfo(cardTypeInfo: string) {
        this.removeTogs(this.typeParent);
        this._cardPayInfo = cardTypeInfo;

        let first;
        for (const mainTypeKey in this._cardPayInfo) {
            for (const subTypeKey in this._cardPayInfo[mainTypeKey]) {
                let subTypeTog = cc.instantiate(this.type);
                this.typeParent.addChild(subTypeTog);

                if (!first) first = subTypeTog;

                subTypeTog.y = 0;
                subTypeTog.active = true;
                subTypeTog.getComponent(cc.Toggle).checkEvents[0].customEventData = mainTypeKey + ',' + subTypeKey;

                subTypeTog.children[0].children[0].getComponent(cc.Sprite).spriteFrame = this.typeFrames[this.typeNames.indexOf(subTypeKey)];
            }
        }

        first.getComponent(cc.Toggle).check();
    }

    onCheckType(tog: cc.Toggle, data: string) {
        this.removeTogs(this.moneyParent);

        let keys = data.split(',');

        let values: number[] = [];
        for (const card of this._cardPayInfo[keys[0]][keys[1]] as CardPayInfo[]) {
            values = values.concat(card.ValuesUnpack)
        }
        values.sort((a: number, b: number) => {
            return a - b;
        });
        if (values[0] === 1) {
            values.splice(0, 1);
        }

        let first;
        for (const value of values) {
            let moneyTog = cc.instantiate(this.money);
            this.moneyParent.addChild(moneyTog);

            if (!first) first = moneyTog;

            moneyTog.active = true;
            moneyTog.getComponent(cc.Toggle).checkEvents[0].customEventData = value + '';
            for (const lab of moneyTog.getComponentsInChildren(cc.Label)) {
                lab.string = value + '元';
            }
        }

        first.getComponent(cc.Toggle).check();
    }

    getCheckedTog(parent: cc.Node) {
        for (const node of parent.children) {
            let tog = node.getComponent(cc.Toggle);
            if (tog.isChecked) {
                return tog;
            }
        }
    }

    onClickOK() {
        if (!this.cardNum.string || !this.cardPwd.string) {
            util.showTip("请输入卡号卡密");
            return;
        }

        let price = this.getCheckedTog(this.moneyParent).checkEvents[0].customEventData;
        let types = this.getCheckedTog(this.typeParent).checkEvents[0].customEventData.split(',');

        util.showLoading("请稍等");
        let deviceType = cc.sys.os === cc.sys.OS_IOS ? "ios" : "android";
        window.pomelo.request("lobby.billHandler.recharge", {
            billPrice: price,
            payType: this.node.name,
            deviceType: deviceType,
            cardNumber: this.cardNum.string,
            cardPwd: this.cardPwd.string,
            cardMainType: types[0],
            cardSubType: types[1]
        }, (data: {
            code: number;
            url?: string;
            errorCode?: number;
        }) => {
                util.hideLoading();
                if (data.code !== 200) {
                    util.showTip(ErrCodes.getErrStr(data.code, "充值失败"));
                    return;
                }
                if (data.url) {
                    let url = data.url;
                    util.goToUrl(url);
                } else if (data.errorCode !== 200) {
                    util.showTip("充值失败，第三方错误");
                }
            });
    }
}
