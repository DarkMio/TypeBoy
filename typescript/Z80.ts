import {MemoryManager} from "./MemoryManager";

class Z80 {
    state: CPUState;
    register: Register;
    clock: Clock;
    memory: MemoryManager;
    constructor() {
        this.reset();
    }

    reset() { // cleanup and init
        this.state = new CPUState();
        this.register = this.state.register;
        this.clock = this.state.clock;
        this.memory = new MemoryManager();
    }

    ADD_E() { // Add E to A, Result in A: ADD A, E
        this.register.a += this.register.e;
        this.register.f = 0;
        if(!(this.register.a & 255)) { // check if register A is zero (without overflow)
            this.register.f |= 0x80; // if so, set flag
        }
        if(this.register.a > 255) { // check if register A is overflowed
            this.register.f |= 0x10; // set carry flag
        }
        this.register.a &= 255;
        this.register.clock.m = 1;  // 1 M-time taken
    }

    CMP_B() {
        var i = this.register.a;  // copy register over
        i -= this.register.b;     // subtract register B
        this.register.f |= 0x40;  // subtraction flag
        if(!(i & 255)) { // check if register A is zero
            this.register.f |= 0x80; // zero flag
        }
        if(i < 0) { // check for underflow
            this.register.f |= 0x10; // register underflowed :(
        }
        this.register.clock.m = 1;
    }

    NOP() { // Do nothing, but take one tick.
        this.register.clock.m = 1;
    }

    PUSH_B_C() { // push registers B and C to the stack (PUSH BC)
        this.register.sp--;
        this.memory.writeByte(this.register.sp, this.register.b); // write b to the stack pointer
        this.register.sp--;
        this.memory.writeByte(this.register.sp, this.register.c); // write C to the stack pointer
        this.register.clock.m = 3;  // took 3 times;
    }

    POP_H_L() { // Pop into registers H / L off the stack (POP HL)
        this.register.l = this.memory.readByte(this.register.sp); // read byte at stack pointer
        this.register.sp++; // count stack pointer up
        this.register.h = this.memory.readByte(this.register.sp); // read byte at stack pointer
        this.register.sp++; // count stack point up
        this.register.clock.m = 3;
    }

    LD_A_mm() { // Read a byte from absolute location into A (LD A, addr)
        var addr = this.memory.readWord(this.register.pc);  // Get instruction from program counter
        this.register.pc += 2;                              // advance the PC (for two byte)
        this.register.a = this.memory.readByte(addr);       // read from the address
        this.register.clock.m = 4;                          // this operation took 4M times
    }
}


class CPUState {
    clock: Clock;
    register: Register;
    constructor() {
        this.clock = new Clock();
        this.register = new Register();
    }
}

class Clock {
    m: number;
    t = () => { return this.m * 4};
    constructor() {
        this.m = 0;
        // this.t = 0;
    }
}

class Register {
    a: number;  // 8-bit Register
    b: number;  // 8-bit Register
    c: number;  // 8-bit Register
    d: number;  // 8-bit Register
    e: number;  // 8-bit Register
    h: number;  // 8-bit Register
    l: number;  // 8-bit Register
    f: number;  // CPU Flags
    pc: number; // 16-bit Register, Program Counter
    sp: number; // 16-bit Register, Stack Pointer
    clock: Clock; // Clock of last instruction
    constructor() {
        this.a = 0;
        this.b = 0;
        this.c = 0;
        this.d = 0;
        this.e = 0;
        this.h = 0;
        this.l = 0;
        this.f = 0;
        this.pc = 0;
        this.sp= 0;
        this.clock = new Clock();
    }
}