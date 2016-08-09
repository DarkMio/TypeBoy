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
    private checkZero(i: number): number {
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
    private checkOverflow(i: number): number {
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
    private checkUnderflow(i: number): void {
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
    private adjustRegister(registerName:string): void {
        this.register[registerName] = this.register[registerName] & 255;
    }

    /**
     * Lets the instruction clock tick i times.
     * @param i
     */
    private tick(i: number): void {
        this.register.clock.m = i;
    }

    /**
     * Adds any other register to register A.
     * @param registerName
     */
    private addAny(registerName:string): void {
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
    private compareAny(registerName:string): void {
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
    private pushAny(firstRegister: string, secondRegister:string): void {
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
    private popAny(firstRegister: string, secondRegister:string): void {
        this.register[firstRegister] = this.memory.readByte(this.register.sp);
        this.register.sp++;
        this.register[secondRegister] = this.memory.readByte(this.register.sp);
        this.register.sp++;
        this.tick(3);
    }

    /**
     * Overwrites the value from the sender to the receiver
     * @param registerReceiver
     * @param registerSender
     */
    private loadToFrom(registerReceiver: string, registerSender:string): void {
        this.register[registerReceiver] = this.register[registerSender];
        this.tick(1);
    }

    /**
     * Loads a byte from the current program counter and writes it into the register
     * @param registerName
     */
    private loadReadInto(registerName:string): void {
        this.register[registerName] = this.memory.readByte(this.register.pc);
        this.register.pc++;
        this.tick(2);
    }

    /**
     * Loads from any address into the given register name
     * @param address
     * @param registerName
     */
    private loadByteAnyInto(address : number, registerName :string): void {
        // write into registerName from the memory address
        this.register[registerName] = this.memory.readByte(address);
        // takes two ticks (or 8 cycles)
        this.tick(2);
    }

    private loadByteAnyCombinedInto(firstRegister : string, secondRegister : string, targetRegister : string) {
        var address = (this.register[firstRegister] << 8) + this.register[secondRegister];
        this.loadByteAnyInto(address, targetRegister);

    }

    /**
     * Loads a byte into the register from the combined address value from H and L
     * @param registerName
     */
    private loadHLinto(registerName :string): void {
        // make a 16bit address from register H and L
        var address = (this.register.h << 8) + this.register.l;
        // then write it into the register
        this.loadByteAnyInto(address, registerName);
    }

    /**
     * Loads a byte into the given register from the current program counter
     * @param registerName
     */
    private loadPCinto(registerName :string): void {
        this.loadByteAnyInto(this.register.pc, registerName)
    }

    private writeByteAnyInto(address : number, registerName :string): void {
        this.memory.writeByte(address, this.register[registerName]);
        this.tick(2);
    }


    private writeAnyCombinedFrom(firstRegister: string, secondRegister: string, sourceRegister: string): void {
        // combine the firstRegister value + secondRegister value to a 16bit number
        var address = (this.register[firstRegister] << 8) + this.register[secondRegister];
        // then write the source into that resulting address
        this.writeByteAnyInto(address, sourceRegister);
    }

    private writeHLfrom(registerName :string): void {
        this.writeAnyCombinedFrom('h', 'l', registerName)
    }

    private writePCfrom(registerName :string): void {
        this.writeByteAnyInto(this.register.pc, registerName);
        this.register.pc++;
    }



    /**
     * PUBLIC API
     */

    /* Overwrite from -> to register (was: LDrr_AA) */
    // into A register
    LD_A_A(): void {
        this.loadToFrom("a", "a");
    }
    LD_A_B(): void {
        this.loadToFrom("a", "b");
    }
    LD_A_C(): void {
        this.loadToFrom("a", "c");
    }
    LD_A_D(): void {
        this.loadToFrom("a", "d");
    }
    LD_A_E(): void {
        this.loadToFrom("a", "e");
    }
    LD_A_H(): void {
        this.loadToFrom("a", "h");
    }
    LD_A_L(): void {
        this.loadToFrom("a", "l");
    }
    // into B register
    LD_B_A(): void {
        this.loadToFrom("b", "a");
    }
    LD_B_B(): void {
        this.loadToFrom("b", "b");
    }
    LD_B_C(): void {
        this.loadToFrom("b", "c");
    }
    LD_B_D(): void {
        this.loadToFrom("b", "d");
    }
    LD_B_E(): void {
        this.loadToFrom("b", "e");
    }
    LD_B_H(): void {
        this.loadToFrom("b", "h");
    }
    LD_B_L(): void {
        this.loadToFrom("b", "l");
    }
    // into C register
    LD_C_A(): void {
        this.loadToFrom("c", "a");
    }
    LD_C_B(): void {
        this.loadToFrom("c", "b");
    }
    LD_C_C(): void {
        this.loadToFrom("c", "c");
    }
    LD_C_D(): void {
        this.loadToFrom("c", "d");
    }
    LD_C_E(): void {
        this.loadToFrom("c", "e");
    }
    LD_C_H(): void {
        this.loadToFrom("c", "h");
    }
    LD_C_L(): void {
        this.loadToFrom("c", "l");
    }
    // into D register
    LD_D_A(): void {
        this.loadToFrom("d", "a");
    }
    LD_D_B(): void {
        this.loadToFrom("d", "b");
    }
    LD_D_C(): void {
        this.loadToFrom("d", "c");
    }
    LD_D_D(): void {
        this.loadToFrom("d", "d");
    }
    LD_D_E(): void {
        this.loadToFrom("d", "e");
    }
    LD_D_H(): void {
        this.loadToFrom("d", "h");
    }
    LD_D_L(): void {
        this.loadToFrom("d", "l");
    }
    // into E register
    LD_E_A(): void {
        this.loadToFrom("e", "a");
    }
    LD_E_B(): void {
        this.loadToFrom("e", "b");
    }
    LD_E_C(): void {
        this.loadToFrom("e", "c");
    }
    LD_E_D(): void {
        this.loadToFrom("e", "d");
    }
    LD_E_E(): void {
        this.loadToFrom("e", "e");
    }
    LD_E_H(): void {
        this.loadToFrom("e", "h");
    }
    LD_E_L(): void {
        this.loadToFrom("e", "l");
    }
    // into H register
    LD_H_A(): void {
        this.loadToFrom("h", "a");
    }
    LD_H_B(): void {
        this.loadToFrom("h", "b");
    }
    LD_H_C(): void {
        this.loadToFrom("h", "c");
    }
    LD_H_D(): void {
        this.loadToFrom("h", "d");
    }
    LD_H_E(): void {
        this.loadToFrom("h", "e");
    }
    LD_H_H(): void {
        this.loadToFrom("h", "h");
    }
    LD_H_L(): void {
        this.loadToFrom("h", "l");
    }
    // into L register
    LD_L_A(): void {
        this.loadToFrom("l", "a");
    }
    LD_L_B(): void {
        this.loadToFrom("l", "b");
    }
    LD_L_C(): void {
        this.loadToFrom("l", "c");
    }
    LD_L_D(): void {
        this.loadToFrom("l", "d");
    }
    LD_L_E(): void {
        this.loadToFrom("l", "e");
    }
    LD_L_H(): void {
        this.loadToFrom("l", "h");
    }
    LD_L_L(): void {
        this.loadToFrom("l", "l");
    }

    /* Load value of HL address into register (was: LDrHLm_a) */
    LD_A_HL_read(): void {
        this.loadHLinto("a");
    }
    LD_B_HL_read(): void {
        this.loadHLinto("b");
    }
    LD_C_HL_read(): void {
        this.loadHLinto("C");
    }
    LD_D_HL_read(): void {
        this.loadHLinto("d");
    }
    LD_E_HL_read(): void {
        this.loadHLinto("e");
    }
    LD_H_HL_read(): void {
        this.loadHLinto("h");
    }
    LD_L_HL_read(): void {
        this.loadHLinto("l");
    }

    /* Write value of register into memory of combined HL address (was: LDHLmr_a) */
    LD_HL_A_write(): void {
        this.writeHLfrom("a");
    }
    LD_HL_B_write(): void {
        this.writeHLfrom("b");
    }
    LD_HL_C_write(): void {
        this.writeHLfrom("c");
    }
    LD_HL_D_write(): void {
        this.writeHLfrom("d");
    }
    LD_HL_E_write(): void {
        this.writeHLfrom("e");
    }
    LD_HL_H_write(): void {
        this.writeHLfrom("h");
    }
    LD_HL_L_write(): void {
        this.writeHLfrom("l");
    }

    /* Load a value of PC address into the register (was: LDrn_b) */
    LD_A_next(): void {
        this.loadPCinto("a");
    }
    LD_B_next(): void {
        this.loadPCinto("b");
    }
    LD_C_next(): void {
        this.loadPCinto("c");
    }
    LD_D_next(): void {
        this.loadPCinto("d");
    }
    LD_E_next(): void {
        this.loadPCinto("e");
    }
    LD_H_next(): void {
        this.loadPCinto("h");
    }
    LD_L_next(): void {
        this.loadPCinto("l");
    }

    /* Write a value of the pc-address into the address of HL (was: LDHLmn) */
    LD_HL_N(): void { // this one is kinda nasty.
        var address = (this.register.h << 8) + this.register.l;
        this.memory.writeByte(address, this.memory.readByte(this.register.pc));
        this.tick(3);
    }

    /* Write the value of register A into the combined address of MN (Was: LDBCmA) */
    LD_BC_A(): void {
        this.writeAnyCombinedFrom('b', 'c', 'a');
    }

    LD_DE_A(): void {
        this.writeAnyCombinedFrom('d', 'e', 'a');
    }

    /* Write register A into the address of address that PC points to (was: LDmmA)*/
    LD_NN_A(): void {
        var address = this.memory.readWord(this.register.pc);
        this.memory.writeByte(address, this.register.a);
    }

    /* Load any combined registers into a target register (was: LDABCm) */
    LD_A_BC(): void {
        this.loadByteAnyCombinedInto('b', 'c', 'a');
    }

    LD_A_DE(): void {
        this.loadByteAnyCombinedInto('d', 'e', 'a');
    }

    /* Load the address pointer pointing from PC into A */
    LD_A_NN(): void {
        this.loadByteAnyInto(this.memory.readWord(this.register.pc), 'a');
        this.tick(2);
    }

    NOP(): void { // do nothing but take one instruction.
        this.tick(1);
    }


}