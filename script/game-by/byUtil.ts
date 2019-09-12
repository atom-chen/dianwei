/**
 * v1和v0的夹角，象限转换
 */
export function getQuadrantDegree(v0: cc.Vec2, v1: cc.Vec2): number {
    if (v0 == undefined) return 0
    let y = (v1.y - v0.y)
    let x = (v1.x - v0.x)
    let rad = Math.atan(y / x)
    let degree = rad2Deg(rad)
    //一四象限
    if (x >= 0) {
        return -degree
    } else {
        //二三象限
        return (-degree - 180)
    }
}
/**
 * v1和v0的夹角
 */
export function getDegree(v0: cc.Vec2, v1: cc.Vec2) {
    let y = (v1.y - v0.y);
    let x = (v1.x - v0.x);
    let rad = Math.atan(y / x);
    let degree = rad2Deg(rad);
    return degree;
}
/**
 * 弧度转角度
 */
export function rad2Deg(rad: number) {
    return (rad * 180 / Math.PI)
}
/**
 * 角度转弧度
 */
export function deg2Rad(deg: number) {
    return deg * Math.PI / 180
}

export function getFishKindType(type: number) {
    return type / 10
}

/**
 * 一个玩家创建30个瞄准线的点
 */
export function createDotLine(sp: cc.Node, dotArr: cc.Node[]) {
    for (var i = 0; i < 20; i++) {
        let pot = cc.instantiate(sp);
        dotArr.push(pot);
        sp.parent.addChild(pot, -1);
    }
}
/**
 * 隐藏瞄准线
 */
export function hideDotLine(dotArr: cc.Node[]) {
    dotArr.forEach(dot => { dot.active = false })
}
/**
 * 绘制锁定状态时的瞄准线
 * @param v0 炮台位置
 * @param v1 瞄准点位置
 * @param dotArr
 */
export function drawDotLine(v0: cc.Vec2, v1: cc.Vec2, dotArr: cc.Node[]) {
    let gap = 50//间隙
    let distance = cc.pDistance(v1, v0)
    let count = distance / gap
    let gapx = (v1.x - v0.x) / count
    let gapy = (v1.y - v0.y) / count
    let curx = 0
    let cury = 0
    for (let i = 0; i < dotArr.length; i++) {
        if (i < 3) {
            continue
        } else if (i > count) {
            if (dotArr[i].active) {
                dotArr[i].active = false
            } else {
                return
            }
        } else {
            dotArr[i].active = true
            curx = v0.x + gapx * i
            cury = v0.y + gapy * i
            dotArr[i].x = curx
            dotArr[i].y = cury
        }
    }
}

let defsMax = {
    fishId: { max: 0x1fff, bitwise: 13 },
    bulletId: { max: 0x3fff, bitwise: 14 },
    massId: { max: 0x1f, bitwise: 5 },
    ratio: { max: 0x1f, bitwise: 5 },
    angle: { max: 0xff, bitwise: 8 },
    sign: { max: 0x1, bitwise: 1 },
    rPos: { max: 0x3, bitwise: 2 }
}
/**
 * 处理发子弹消息
 */
export function dealFireMsg(angle: number, ratio: number, bulletId: number): number {
    //|sign|angle|ratio|bulletid|
    if (angle < -180) {
        angle = 360 + angle
    }
    angle = Math.round(angle)
    if (ratio < 0 || ratio > defsMax.ratio.max) console.error('ratio超出范围了！！！！！')
    if (angle < -defsMax.angle.max || ratio > defsMax.angle.max) console.error('angle超出范围了！！！！！')
    if (bulletId < 0 || ratio > defsMax.bulletId.max) console.error('bulletId超出范围了！！！！！')

    let sign = angle < 0 ? 1 : 0
    sign = sign << (defsMax.bulletId.bitwise + defsMax.ratio.bitwise + defsMax.angle.bitwise)
    angle = (Math.abs(angle) & defsMax.angle.max) << (defsMax.bulletId.bitwise + defsMax.ratio.bitwise)
    ratio = (ratio & defsMax.ratio.max) << defsMax.bulletId.bitwise
    bulletId = (bulletId & defsMax.bulletId.max) << 0
    return sign | angle | ratio | bulletId
}
/**
 * 处理击中消息
 */
export function dealHitMsg(massId: number, fishId: number, bulletId: number): number {
    //|massid|fishid|bulletid|
    if (massId < 0 || massId > defsMax.massId.max) console.error('massId超出范围了！！！！！');
    if (fishId < 0 || fishId > defsMax.fishId.max) console.error('fishid超出范围了！！！！！');
    if (bulletId < 0 || bulletId > defsMax.bulletId.max) console.error('bulletId超出范围了！！！！！');

    massId = (massId & defsMax.massId.max) << (defsMax.fishId.bitwise + defsMax.bulletId.bitwise);
    fishId = (fishId & defsMax.fishId.max) << defsMax.bulletId.bitwise;
    bulletId = (bulletId & defsMax.bulletId.max) << 0;
    return massId | fishId | bulletId;
}

export function resolveFireMsg(data: number) {
    // sign|angle|rpos|ratio
    let sign = (data >> (defsMax.angle.bitwise + defsMax.rPos.bitwise + defsMax.ratio.bitwise)) & defsMax.sign.max;
    let xangle = (data >> (defsMax.rPos.bitwise + defsMax.ratio.bitwise)) & defsMax.angle.max;
    if (sign) xangle = -xangle;
    let xrPos = (data >> (defsMax.ratio.bitwise)) & defsMax.rPos.max;
    let xratio = (data >> 0) & defsMax.ratio.max;
    let info = {
        angle: xangle,
        rPos: xrPos,
        ratio: xratio
    }
    return info
}