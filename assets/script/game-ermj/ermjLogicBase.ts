export default class LogicBase {
    constructor() { }
    removeDataFromArr(arr: number[], data: number, count: number) {
        let countTemp = 0;
        for (let i = 0; i < arr.length;) {
            if (arr[i] === data) {
                if (countTemp < count) {
                    arr.splice(i, 1);
                    countTemp++;
                } else {
                    break;
                }
            } else {
                i++;
            }
        }
    }

    GetNumInArr(arr: number[], data: number) {
        let num = 0;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] == data) {
                num++;
            }
        }
        return num;
    }
}