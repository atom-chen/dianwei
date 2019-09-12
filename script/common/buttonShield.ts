const { ccclass, property } = cc._decorator;

@ccclass
export default class ButtonShield extends cc.Component {
    private intervalTime: number = 1;

    private _button:cc.Button = undefined;

    start() {
        let btn = this.node.getComponent(cc.Button);
        if (!btn) return
        this._button = btn;
        this._button.interactable = true;
        if (btn.clickEvents.filter(e => e.handler === 'changeAvailableState').length === 0) {
            let handler = new cc.Component.EventHandler();
            handler.target = this.node;
            handler.component = cc.js.getClassName(this);
            handler.handler = "changeAvailableState";
            btn.clickEvents.push(handler);
        }
    }

    changeAvailableState() {
        if (this._button.interactable) {
            this._button.interactable = false;
            this.scheduleOnce(() => {
                this._button.interactable = true;
            }, this.intervalTime);
        }
    }
}
