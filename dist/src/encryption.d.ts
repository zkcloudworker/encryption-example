import { Field, Group } from "o1js";
export { CypherText };
interface CypherTextObject {
    cipherText: Field[];
    publicKey: Group;
}
declare class CypherText {
    static stringify(cipherText: CypherTextObject): string;
    static parse(jsonStr: string): CypherTextObject;
    static encrypt(message: string, publicId: string): string;
    static decrypt(cipherText: string, privateKey: string): string;
    static initialize(): Promise<void>;
}
