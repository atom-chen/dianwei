import * as util from "../common/util";

const { ccclass, property } = cc._decorator;

export interface Mail {
    _id: string;
    bRead: boolean;
    content: string;
    from: string;
    sendTime: number;
    title: string;
}

@ccclass
export class MailMsg extends cc.Component {
    @property(cc.Node)
    spriMailPrompt: cc.Node = undefined;

    private _mails: Mail[];
    get mails() {
        if (!this._mails) {
            this._mails = new Array();
        }
        return this._mails;
    }

    onLoad() {
        this.checkNewMails();
    }

    onHasNewMail() {
        if(this.spriMailPrompt){
            this.spriMailPrompt.active = true;
        }
    }

    checkNewMails() {
        window.pomelo.request("lobby.mailHandler.checkNew", {}, (data: { code: number, hasNew: boolean }) => {
            if (data.code === 200 && !!data.hasNew)
                this.spriMailPrompt.active = true;
            else
                this.spriMailPrompt.active = false;
        })
    }

    pullMails(p: number, callback: Function) {
        window.pomelo.request("lobby.mailHandler.getMails", { page: p }, (data: { code: number, mails: Mail[] }) => {
            if (data.code === 200) {
                if (data.mails) {
                    if (!p) this._mails = [];

                    // data.mails.sort((a, b) => {
                    //     return +a.bRead - +b.bRead;
                    // })
                    this._mails = this.mails.concat(data.mails);

                    callback(data.mails)
                }
            } else {
                util.showTip("拉取邮件失败！");
                return;
            }
        })
    }

    changeMailRead(id: string, read: boolean) {
        for (let idx = 0; idx < this.mails.length; idx++) {
            let info = this.mails[idx];
            if (info._id === id) {
                info.bRead = read;
                break;
            }
        }
        this.checkUnRead();
    }

    checkUnRead() {
        let isHaveUnRead = this.mails.some((value) => {
            return !value.bRead
        });

        if (isHaveUnRead)
            this.spriMailPrompt.active = true;
        else
            this.spriMailPrompt.active = false;
    }

    clearAllMails() {
        return new Promise((resolve: (isS: boolean) => void) => {
            if (!this.mails || this.mails.length === 0)
                resolve(false);

            let ids = this.mails.map((value) => {
                return value._id;
            })

            util.showLoading("");
            window.pomelo.request("lobby.mailHandler.delete", { ids: ids }, (data: { code: number }) => {
                util.hideLoading();
                if (data.code === 200) {
                    this._mails = [];
                    this.checkUnRead();

                    util.showTip("删除成功！");
                    resolve(true);
                } else {
                    util.showTip("处理完毕！");
                    resolve(false);
                }
            });
        });
    }

    delReadMails() {
        return new Promise((resolve: (isSuccess: boolean) => void) => {
            if (!this.mails || this.mails.length === 0)
                resolve(false);

            let ids = this.mails.map((value) => {
                if (value.bRead)
                    return value._id;
                return null;
            })

            let realIds = ids.filter((value) => {
                return value
            });

            if (realIds.length === 0)
                resolve(false);

            util.showLoading("");
            window.pomelo.request("lobby.mailHandler.delete", { ids: realIds }, (data: { code: number }) => {
                util.hideLoading();
                if (data.code === 200) {
                    this._mails = this.mails.filter((value) => {
                        return !value.bRead;
                    });
                    util.showTip("删除成功！");
                    resolve(true);
                }
                else {
                    util.showTip("处理完毕！");
                    resolve(false);
                }
            });
        });
    }

    delMailInfo(mailInfo: Mail) {
        return new Promise((resolve: (ret: boolean) => void, reject) => {
            if (mailInfo === undefined)
                resolve(false);

            util.showLoading("");
            window.pomelo.request("lobby.mailHandler.delete", { ids: [mailInfo._id] }, (data: { code: number }) => {
                util.hideLoading();
                if (data.code === 200) {
                    for (let idx = 0; idx < this.mails.length; idx++) {
                        let info = this.mails[idx];
                        if (info._id === mailInfo._id) {
                            this.mails.splice(idx, 1);
                            break;
                        }
                    }

                    util.showTip("删除成功！");
                    resolve(true);
                }
                else {
                    util.showTip("处理完毕！");
                    resolve(false);
                }
            })
        });
    }
}
