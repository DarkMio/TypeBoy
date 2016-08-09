import {Register} from "./Z80"
import {MemoryManager} from "./MemoryManager";


export class RegisterFunctions {
    register: Register;
    memory: MemoryManager;

    constructor(register: Register, memory: MemoryManager) {
        this.register = register;
        this.memory = memory;
    }

    /**
     * Checks if the given value is 8-bit zero.
     * @param i
     * @returns {number} Adjusted 8bit register value
     */
    private checkZero(i: number) {
        if (!(i & 255)) {              // byte mask the 8 bit register, if there is nothing, then
            this.register.f |= 0x80;  // 1000 0000 set the zero flag
            return 0;
        }
        return i & 255;
    }

    /**
     * Checks if the given value is 8-bit overflowed
     * @param i
     * @returns {number} Adjusted 8bit register value
     */
    private checkOverflow(i: number) {
        if (!(i > 255)) {              // if the 8 bit register is over 255, it overflowed
            this.register.f |= 0x10;  // 0001 0000 is the carry flag
        }
        return i & 255;
    }

    /**
     * Checks if the given value is 8bit underflowed
     * @param i
     * @returns (number) Adjusted 8bit register value
     */
    private checkUnderflow(i: number) {
        if (i < 0) {                   // simple: registers are unsigned, if it's below zero, it underflowed.
            this.register.f |= 0x10;  // 0001 0000 is the carry flag
        }
    }

    /** Clears CPU flags completely out */
    private clearFlags() {
        this.register.f = 0;
    }

    /**
     * Cleans up the numerical value of a given register name back to a 8bit value
     * @param registerName
     */
    private adjustRegister(registerName: string) {
        this.register[registerName] = this.register[registerName] & 255;
    }

    /**
     * Lets the instruction clock tick i times.
     * @param i
     */
    private tick(i: number) {
        this.register.clock.m = i;
    }

    /**
     * Adds any other register to register A.
     * @param registerName
     */
    private addAny(registerName: string) {
        this.register.a += this.register[registerName];
        this.clearFlags();
        this.checkZero(this.register.a);
        this.checkOverflow(this.register.a);
        this.adjustRegister("a");
        this.tick(1);
    }

    /**
     * Compares other register to register A.
     * @param registerName
     */
    private compareAny(registerName: string) {
        var i = this.register.a;           // make a local copy
        i -= this.register[registerName];  // subtract the other register
        this.register.f |= 0x40;           // set the subtraction flag
        this.checkZero(this.register.a);
        this.checkUnderflow(this.register.a);
        this.tick(1);
    }

    /**
     * Pushes two registers in order to the stack (PUSH M N)
     * @param firstRegister
     * @param secondRegister
     */
    private pushAny(firstRegister: string, secondRegister: string) {
        this.register.sp--;
        // write first register to the position of the stack pointer:
        this.memory.writeByte(this.register.sp, this.register[firstRegister]);
        this.register.sp--;
        // write second register to the position of the (updated) stack pointer:
        this.memory.writeByte(this.register.sp, this.register[secondRegister]);
        this.tick(3);
    }

    /**
     * Pop two registers off the stack (POP M N)
     * @param firstRegister
     * @param secondRegister
     */
    private popAny(firstRegister: string, secondRegister: string) {
        this.register[firstRegister] = this.memory.readByte(this.register.sp);
        this.register.sp++;
        this.register[secondRegister] = this.memory.readByte(this.register.sp);
        this.register.sp++;
        this.tick(3);
    }

    private loadToFrom(registerReceiver: string, registerSender: string) {
        this.register[registerReceiver] = this.register[registerSender];
        this.tick(1);
    }

    private loadReadInto(registerName: string) {
        this.register[registerName] = this.memory.readByte(this.register.pc);
        this.register.pc++;
        this.tick(2);
    }


    /**
     * PUBLIC API
     */

    /* Overwrite from -> to register */
    // into A register
    LD_A_A() {
        this.loadToFrom("a", "a");
    }
    LD_A_B() {
        this.loadToFrom("a", "b");
    }
    LD_A_C() {
        this.loadToFrom("a", "c");
    }
    LD_A_D() {
        this.loadToFrom("a", "d");
    }
    LD_A_E() {
        this.loadToFrom("a", "e");
    }
    LD_A_H() {
        this.loadToFrom("a", "h");
    }
    LD_A_L() {
        this.loadToFrom("a", "l");
    }
    // into B register
    LD_B_A() {
        this.loadToFrom("b", "a");
    }
    LD_B_B() {
        this.loadToFrom("b", "b");
    }
    LD_B_C() {
        this.loadToFrom("b", "c");
    }
    LD_B_D() {
        this.loadToFrom("b", "d");
    }
    LD_B_E() {
        this.loadToFrom("b", "e");
    }
    LD_B_H() {
        this.loadToFrom("b", "h");
    }
    LD_B_L() {
        this.loadToFrom("b", "l");
    }
    // into C register
    LD_C_A() {
        this.loadToFrom("c", "a");
    }
    LD_C_B() {
        this.loadToFrom("c", "b");
    }
    LD_C_C() {
        this.loadToFrom("c", "c");
    }
    LD_C_D() {
        this.loadToFrom("c", "d");
    }
    LD_C_E() {
        this.loadToFrom("c", "e");
    }
    LD_C_H() {
        this.loadToFrom("c", "h");
    }
    LD_C_L() {
        this.loadToFrom("c", "l");
    }
    // into D register
    LD_D_A() {
        this.loadToFrom("d", "a");
    }
    LD_D_B() {
        this.loadToFrom("d", "b");
    }
    LD_D_C() {
        this.loadToFrom("d", "c");
    }
    LD_D_D() {
        this.loadToFrom("d", "d");
    }
    LD_D_E() {
        this.loadToFrom("d", "e");
    }
    LD_D_H() {
        this.loadToFrom("d", "h");
    }
    LD_D_L() {
        this.loadToFrom("d", "l");
    }
    // into E register
    LD_E_A() {
        this.loadToFrom("e", "a");
    }
    LD_E_B() {
        this.loadToFrom("e", "b");
    }
    LD_E_C() {
        this.loadToFrom("e", "c");
    }
    LD_E_D() {
        this.loadToFrom("e", "d");
    }
    LD_E_E() {
        this.loadToFrom("e", "e");
    }
    LD_E_H() {
        this.loadToFrom("e", "h");
    }
    LD_E_L() {
        this.loadToFrom("e", "l");
    }
    // into H register
    LD_H_A() {
        this.loadToFrom("h", "a");
    }
    LD_H_B() {
        this.loadToFrom("h", "b");
    }
    LD_H_C() {
        this.loadToFrom("h", "c");
    }
    LD_H_D() {
        this.loadToFrom("h", "d");
    }
    LD_H_E() {
        this.loadToFrom("h", "e");
    }
    LD_H_H() {
        this.loadToFrom("h", "h");
    }
    LD_H_L() {
        this.loadToFrom("h", "l");
    }
    // into L register
    LD_L_A() {
        this.loadToFrom("l", "a");
    }
    LD_L_B() {
        this.loadToFrom("l", "b");
    }
    LD_L_C() {
        this.loadToFrom("l", "c");
    }
    LD_L_D() {
        this.loadToFrom("l", "d");
    }
    LD_L_E() {
        this.loadToFrom("l", "e");
    }
    LD_L_H() {
        this.loadToFrom("l", "h");
    }
    LD_L_L() {
        this.loadToFrom("l", "l");
    }



    NOP() { // do nothing but take one instruction.
        this.tick(1);
    }


}