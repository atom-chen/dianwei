import { toUTF8Array } from "../common/util";

declare let aesjs: any;

class AES {
    private key = [102, 119, 126, 29, 97, 18, 76, 113, 89, 141, 91, 9, 189, 172, 156, 160];
    iv: number[];

    private pkcs5Padding(src: number[]): number[] {
        let blockSize = 16;
        let padNum = blockSize - src.length % blockSize;
        let padBuffer: number[] = [];
    
        for (let i = 0; i < padNum; ++i) {
            padBuffer.push(padNum);
        }
    
        return src.concat(padBuffer);
    }

    private create(content: number[], iv: number[]): string {
        // An example 128-bit key (16 bytes * 8 bits/byte = 128 bits)
        let key = [102, 119, 126, 29, 97, 18, 76, 113, 89, 141, 91, 9, 189, 172, 156, 160];

        let textBytes = content;

        let aesCbc = new aesjs.ModeOfOperation.cbc(key, iv);
        let encryptedBytes = aesCbc.encrypt(textBytes);

        // To print or store the binary data, you may convert it to hex
        let encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
        return encryptedHex;
    }

    encryptCBC(content: string) {
        let dataArr = toUTF8Array(content);
        dataArr = this.pkcs5Padding(dataArr);
        let result = this.create(dataArr, this.iv);
        return result;
    }

    private pkcs5UnPadding(src: number[]): number[] {
        let blockSize = 16;
        if (!src || src.length === 0 || src.length % blockSize !== 0) {
            return undefined;
        }
    
        let paddNum = src[src.length - 1];
        return src.slice(0, src.length - paddNum);
    }

    decryptCBC(content: string): string {
        // When ready to decrypt the hex string, convert it back to bytes
        let encryptedBytes = aesjs.utils.hex.toBytes(content);
    
        // The cipher-block chaining mode of operation maintains internal
        // state, so to decrypt a new instance must be instantiated.
        let aesCbc = new aesjs.ModeOfOperation.cbc(this.key, this.iv);
        let decryptedBytes = aesCbc.decrypt(encryptedBytes);
        decryptedBytes = this.pkcs5UnPadding(decryptedBytes);
        // Convert our bytes back into text
        let decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);
        // "TextMustBe16Byte"
        return decryptedText;
    }
}

let aes = new AES();
export default aes;