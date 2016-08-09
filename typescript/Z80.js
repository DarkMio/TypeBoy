"use strict";
var MemoryManager_1 = require("./MemoryManager");
var RegisterFunctions_1 = require("./RegisterFunctions");
var Z80 = (function () {
    function Z80() {
        this.reset();
    }
    Z80.prototype.reset = function () {
        this.state = new CPUState();
        this.register = this.state.register;
        this.clock = this.state.clock;
        this.memory = new MemoryManager_1.MemoryManager();
        this.functions = new RegisterFunctions_1.RegisterFunctions(this.register, this.memory);
    };
    Z80.prototype.ADD_E = function () {
        this.register.a += this.register.e;
        this.register.f = 0;
        if (!(this.register.a & 255)) {
            this.register.f |= 0x80; // if so, set flag
        }
        if (this.register.a > 255) {
            this.register.f |= 0x10; // set carry flag
        }
        this.register.a &= 255;
        this.register.clock.m = 1; // 1 M-time taken
    };
    Z80.prototype.CMP_B = function () {
        var i = this.register.a; // copy register over
        i -= this.register.b; // subtract register B
        this.register.f |= 0x40; // subtraction flag
        if (!(i & 255)) {
            this.register.f |= 0x80; // zero flag
        }
        if (i < 0) {
            this.register.f |= 0x10; // register underflowed :(
        }
        this.register.clock.m = 1;
    };
    Z80.prototype.NOP = function () {
        this.register.clock.m = 1;
    };
    Z80.prototype.PUSH_B_C = function () {
        this.register.sp--;
        this.memory.writeByte(this.register.sp, this.register.b); // write b to the stack pointer
        this.register.sp--;
        this.memory.writeByte(this.register.sp, this.register.c); // write C to the stack pointer
        this.register.clock.m = 3; // took 3 times;
    };
    Z80.prototype.POP_H_L = function () {
        this.register.l = this.memory.readByte(this.register.sp); // read byte at stack pointer
        this.register.sp++; // count stack pointer up
        this.register.h = this.memory.readByte(this.register.sp); // read byte at stack pointer
        this.register.sp++; // count stack point up
        this.register.clock.m = 3;
    };
    /**
     * Needs implementation
     */
    Z80.prototype.LD_A_mm = function () {
        var addr = this.memory.readWord(this.register.pc); // Get instruction from program counter
        this.register.pc += 2; // advance the PC (for two byte)
        this.register.a = this.memory.readByte(addr); // read from the address
        this.register.clock.m = 4; // this operation took 4M times
    };
    return Z80;
}());
var CPUState = (function () {
    function CPUState() {
        this.clock = new Clock();
        this.register = new Register();
    }
    return CPUState;
}());
var Clock = (function () {
    function Clock() {
        var _this = this;
        this.t = function () { return _this.m * 4; };
        this.m = 0;
        // this.t = 0;
    }
    return Clock;
}());
var Register = (function () {
    function Register() {
        this.a = 0;
        this.b = 0;
        this.c = 0;
        this.d = 0;
        this.e = 0;
        this.h = 0;
        this.l = 0;
        this.f = 0;
        this.pc = 0;
        this.sp = 0;
        this.clock = new Clock();
    }
    return Register;
}());
exports.Register = Register;
//# sourceMappingURL=Z80.js.map