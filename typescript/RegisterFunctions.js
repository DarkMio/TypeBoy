"use strict";
var RegisterFunctions = (function () {
    function RegisterFunctions(register, memory) {
        this.register = register;
        this.memory = memory;
    }
    /**
     * Checks if the given value is 8-bit zero.
     * @param i
     * @returns {number} Adjusted 8bit register value
     */
    RegisterFunctions.prototype.checkZero = function (i) {
        if (!(i & 255)) {
            this.register.f |= 0x80; // 1000 0000 set the zero flag
            return 0;
        }
        return i & 255;
    };
    /**
     * Checks if the given value is 8-bit overflowed
     * @param i
     * @returns {number} Adjusted 8bit register value
     */
    RegisterFunctions.prototype.checkOverflow = function (i) {
        if (!(i > 255)) {
            this.register.f |= 0x10; // 0001 0000 is the carry flag
        }
        return i & 255;
    };
    /**
     * Checks if the given value is 8bit underflowed
     * @param i
     * @returns (number) Adjusted 8bit register value
     */
    RegisterFunctions.prototype.checkUnderflow = function (i) {
        if (i < 0) {
            this.register.f |= 0x10; // 0001 0000 is the carry flag
        }
    };
    /** Clears CPU flags completely out */
    RegisterFunctions.prototype.clearFlags = function () {
        this.register.f = 0;
    };
    /**
     * Cleans up the numerical value of a given register name back to a 8bit value
     * @param registerName
     */
    RegisterFunctions.prototype.adjustRegister = function (registerName) {
        this.register[registerName] = this.register[registerName] & 255;
    };
    /**
     * Lets the instruction clock tick i times.
     * @param i
     */
    RegisterFunctions.prototype.tick = function (i) {
        this.register.clock.m = i;
    };
    /**
     * Adds any other register to register A.
     * @param registerName
     */
    RegisterFunctions.prototype.addAny = function (registerName) {
        this.register.a += this.register[registerName];
        this.clearFlags();
        this.checkZero(this.register.a);
        this.checkOverflow(this.register.a);
        this.adjustRegister("a");
        this.tick(1);
    };
    /**
     * Compares other register to register A.
     * @param registerName
     */
    RegisterFunctions.prototype.compareAny = function (registerName) {
        var i = this.register.a; // make a local copy
        i -= this.register[registerName]; // subtract the other register
        this.register.f |= 0x40; // set the subtraction flag
        this.checkZero(this.register.a);
        this.checkUnderflow(this.register.a);
        this.tick(1);
    };
    /**
     * Pushes two registers in order to the stack (PUSH M N)
     * @param firstRegister
     * @param secondRegister
     */
    RegisterFunctions.prototype.pushAny = function (firstRegister, secondRegister) {
        this.register.sp--;
        // write first register to the position of the stack pointer:
        this.memory.writeByte(this.register.sp, this.register[firstRegister]);
        this.register.sp--;
        // write second register to the position of the (updated) stack pointer:
        this.memory.writeByte(this.register.sp, this.register[secondRegister]);
        this.tick(3);
    };
    /**
     * Pop two registers off the stack (POP M N)
     * @param firstRegister
     * @param secondRegister
     */
    RegisterFunctions.prototype.popAny = function (firstRegister, secondRegister) {
        this.register[firstRegister] = this.memory.readByte(this.register.sp);
        this.register.sp++;
        this.register[secondRegister] = this.memory.readByte(this.register.sp);
        this.register.sp++;
        this.tick(3);
    };
    /**
     * Overwrites the value from the sender to the receiver
     * @param registerReceiver
     * @param registerSender
     */
    RegisterFunctions.prototype.loadToFrom = function (registerReceiver, registerSender) {
        this.register[registerReceiver] = this.register[registerSender];
        this.tick(1);
    };
    /**
     * Loads a byte from the current program counter and writes it into the register
     * @param registerName
     */
    RegisterFunctions.prototype.loadReadInto = function (registerName) {
        this.register[registerName] = this.memory.readByte(this.register.pc);
        this.register.pc++;
        this.tick(2);
    };
    /**
     * Loads from any address into the given register name
     * @param address
     * @param registerName
     */
    RegisterFunctions.prototype.loadByteAnyInto = function (address, registerName) {
        // write into registerName from the memory address
        this.register[registerName] = this.memory.readByte(address);
        // takes two ticks (or 8 cycles)
        this.tick(2);
    };
    /**
     * Loads a byte into the register from the combined address value from H and L
     * @param registerName
     */
    RegisterFunctions.prototype.loadHLinto = function (registerName) {
        // make a 16bit address from register H and L
        var address = (this.register.h << 8) + this.register.l;
        // then write it into the register
        this.loadByteAnyInto(address, registerName);
    };
    /**
     * Loads a byte into the given register from the current program counter
     * @param registerName
     */
    RegisterFunctions.prototype.loadPCinto = function (registerName) {
        this.loadByteAnyInto(this.register.pc, registerName);
    };
    RegisterFunctions.prototype.writeByteAnyInto = function (address, registerName) {
        this.memory.writeByte(address, this.register[registerName]);
        this.tick(2);
    };
    RegisterFunctions.prototype.writeHLfrom = function (registerName) {
        // make a 16bit address from register H and L
        var address = (this.register.h << 8) + this.register.l;
        // then write that from the register into the memory
        this.writeByteAnyInto(address, registerName);
    };
    RegisterFunctions.prototype.writePCfrom = function (registerName) {
        this.writeByteAnyInto(this.register.pc, this.register[registerName]);
        this.register.pc++;
    };
    /**
     * PUBLIC API
     */
    /* Overwrite from -> to register (was: LDrr_AA) */
    // into A register
    RegisterFunctions.prototype.LD_A_A = function () {
        this.loadToFrom("a", "a");
    };
    RegisterFunctions.prototype.LD_A_B = function () {
        this.loadToFrom("a", "b");
    };
    RegisterFunctions.prototype.LD_A_C = function () {
        this.loadToFrom("a", "c");
    };
    RegisterFunctions.prototype.LD_A_D = function () {
        this.loadToFrom("a", "d");
    };
    RegisterFunctions.prototype.LD_A_E = function () {
        this.loadToFrom("a", "e");
    };
    RegisterFunctions.prototype.LD_A_H = function () {
        this.loadToFrom("a", "h");
    };
    RegisterFunctions.prototype.LD_A_L = function () {
        this.loadToFrom("a", "l");
    };
    // into B register
    RegisterFunctions.prototype.LD_B_A = function () {
        this.loadToFrom("b", "a");
    };
    RegisterFunctions.prototype.LD_B_B = function () {
        this.loadToFrom("b", "b");
    };
    RegisterFunctions.prototype.LD_B_C = function () {
        this.loadToFrom("b", "c");
    };
    RegisterFunctions.prototype.LD_B_D = function () {
        this.loadToFrom("b", "d");
    };
    RegisterFunctions.prototype.LD_B_E = function () {
        this.loadToFrom("b", "e");
    };
    RegisterFunctions.prototype.LD_B_H = function () {
        this.loadToFrom("b", "h");
    };
    RegisterFunctions.prototype.LD_B_L = function () {
        this.loadToFrom("b", "l");
    };
    // into C register
    RegisterFunctions.prototype.LD_C_A = function () {
        this.loadToFrom("c", "a");
    };
    RegisterFunctions.prototype.LD_C_B = function () {
        this.loadToFrom("c", "b");
    };
    RegisterFunctions.prototype.LD_C_C = function () {
        this.loadToFrom("c", "c");
    };
    RegisterFunctions.prototype.LD_C_D = function () {
        this.loadToFrom("c", "d");
    };
    RegisterFunctions.prototype.LD_C_E = function () {
        this.loadToFrom("c", "e");
    };
    RegisterFunctions.prototype.LD_C_H = function () {
        this.loadToFrom("c", "h");
    };
    RegisterFunctions.prototype.LD_C_L = function () {
        this.loadToFrom("c", "l");
    };
    // into D register
    RegisterFunctions.prototype.LD_D_A = function () {
        this.loadToFrom("d", "a");
    };
    RegisterFunctions.prototype.LD_D_B = function () {
        this.loadToFrom("d", "b");
    };
    RegisterFunctions.prototype.LD_D_C = function () {
        this.loadToFrom("d", "c");
    };
    RegisterFunctions.prototype.LD_D_D = function () {
        this.loadToFrom("d", "d");
    };
    RegisterFunctions.prototype.LD_D_E = function () {
        this.loadToFrom("d", "e");
    };
    RegisterFunctions.prototype.LD_D_H = function () {
        this.loadToFrom("d", "h");
    };
    RegisterFunctions.prototype.LD_D_L = function () {
        this.loadToFrom("d", "l");
    };
    // into E register
    RegisterFunctions.prototype.LD_E_A = function () {
        this.loadToFrom("e", "a");
    };
    RegisterFunctions.prototype.LD_E_B = function () {
        this.loadToFrom("e", "b");
    };
    RegisterFunctions.prototype.LD_E_C = function () {
        this.loadToFrom("e", "c");
    };
    RegisterFunctions.prototype.LD_E_D = function () {
        this.loadToFrom("e", "d");
    };
    RegisterFunctions.prototype.LD_E_E = function () {
        this.loadToFrom("e", "e");
    };
    RegisterFunctions.prototype.LD_E_H = function () {
        this.loadToFrom("e", "h");
    };
    RegisterFunctions.prototype.LD_E_L = function () {
        this.loadToFrom("e", "l");
    };
    // into H register
    RegisterFunctions.prototype.LD_H_A = function () {
        this.loadToFrom("h", "a");
    };
    RegisterFunctions.prototype.LD_H_B = function () {
        this.loadToFrom("h", "b");
    };
    RegisterFunctions.prototype.LD_H_C = function () {
        this.loadToFrom("h", "c");
    };
    RegisterFunctions.prototype.LD_H_D = function () {
        this.loadToFrom("h", "d");
    };
    RegisterFunctions.prototype.LD_H_E = function () {
        this.loadToFrom("h", "e");
    };
    RegisterFunctions.prototype.LD_H_H = function () {
        this.loadToFrom("h", "h");
    };
    RegisterFunctions.prototype.LD_H_L = function () {
        this.loadToFrom("h", "l");
    };
    // into L register
    RegisterFunctions.prototype.LD_L_A = function () {
        this.loadToFrom("l", "a");
    };
    RegisterFunctions.prototype.LD_L_B = function () {
        this.loadToFrom("l", "b");
    };
    RegisterFunctions.prototype.LD_L_C = function () {
        this.loadToFrom("l", "c");
    };
    RegisterFunctions.prototype.LD_L_D = function () {
        this.loadToFrom("l", "d");
    };
    RegisterFunctions.prototype.LD_L_E = function () {
        this.loadToFrom("l", "e");
    };
    RegisterFunctions.prototype.LD_L_H = function () {
        this.loadToFrom("l", "h");
    };
    RegisterFunctions.prototype.LD_L_L = function () {
        this.loadToFrom("l", "l");
    };
    /* Load value of HL address into register (was: LDrHLm_a) */
    RegisterFunctions.prototype.LD_A_HL_read = function () {
        this.loadHLinto("a");
    };
    RegisterFunctions.prototype.LD_B_HL_read = function () {
        this.loadHLinto("b");
    };
    RegisterFunctions.prototype.LD_C_HL_read = function () {
        this.loadHLinto("C");
    };
    RegisterFunctions.prototype.LD_D_HL_read = function () {
        this.loadHLinto("d");
    };
    RegisterFunctions.prototype.LD_E_HL_read = function () {
        this.loadHLinto("e");
    };
    RegisterFunctions.prototype.LD_H_HL_read = function () {
        this.loadHLinto("h");
    };
    RegisterFunctions.prototype.LD_L_HL_read = function () {
        this.loadHLinto("l");
    };
    /* Write value of register into memory of combined HL address (was: LDHLmr_a) */
    RegisterFunctions.prototype.LD_HL_A_write = function () {
        this.writeHLfrom("a");
    };
    RegisterFunctions.prototype.LD_HL_B_write = function () {
        this.writeHLfrom("b");
    };
    RegisterFunctions.prototype.LD_HL_C_write = function () {
        this.writeHLfrom("c");
    };
    RegisterFunctions.prototype.LD_HL_D_write = function () {
        this.writeHLfrom("d");
    };
    RegisterFunctions.prototype.LD_HL_E_write = function () {
        this.writeHLfrom("e");
    };
    RegisterFunctions.prototype.LD_HL_H_write = function () {
        this.writeHLfrom("h");
    };
    RegisterFunctions.prototype.LD_HL_L_write = function () {
        this.writeHLfrom("l");
    };
    /* Load a value of PC address into the register (was: LDrn_b) */
    RegisterFunctions.prototype.LD_A_next = function () {
        this.loadPCinto("a");
    };
    RegisterFunctions.prototype.LD_B_next = function () {
        this.loadPCinto("b");
    };
    RegisterFunctions.prototype.LD_C_next = function () {
        this.loadPCinto("c");
    };
    RegisterFunctions.prototype.LD_D_next = function () {
        this.loadPCinto("d");
    };
    RegisterFunctions.prototype.LD_E_next = function () {
        this.loadPCinto("e");
    };
    RegisterFunctions.prototype.LD_H_next = function () {
        this.loadPCinto("h");
    };
    RegisterFunctions.prototype.LD_L_next = function () {
        this.loadPCinto("l");
    };
    RegisterFunctions.prototype.NOP = function () {
        this.tick(1);
    };
    return RegisterFunctions;
}());
exports.RegisterFunctions = RegisterFunctions;
//# sourceMappingURL=RegisterFunctions.js.map