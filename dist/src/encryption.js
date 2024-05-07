"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CypherText = void 0;
const o1js_1 = require("o1js");
class CypherText {
    static stringify(cipherText) {
        return JSON.stringify(cipherText);
    }
    static parse(jsonStr) {
        let obj = JSON.parse(jsonStr);
        return {
            publicKey: new o1js_1.Group(obj.publicKey),
            cipherText: (obj.cipherText || []).map((t) => (0, o1js_1.Field)(t))
        };
    }
    static encrypt(message, publicId) {
        try {
            let fields = o1js_1.Encoding.stringToFields(message);
            let encripted = o1js_1.Encryption.encrypt(fields, o1js_1.PublicKey.fromBase58(publicId));
            return CypherText.stringify(encripted);
        }
        catch (err) {
            throw Error(`Could not encrypt message='${message}' using key='${publicId}'.`
                + ` Error ${err}`);
        }
    }
    static decrypt(cipherText, privateKey) {
        try {
            let fields = o1js_1.Encryption.decrypt(CypherText.parse(cipherText), o1js_1.PrivateKey.fromBase58(privateKey));
            let decrypted = o1js_1.Encoding.stringFromFields(fields);
            return decrypted;
        }
        catch (err) {
            throw Error(`Could not decrypt cipher='${cipherText}'.`
                + ` Error ${err}`);
        }
    }
    static async initialize() {
        await (0, o1js_1.initializeBindings)();
    }
}
exports.CypherText = CypherText;
