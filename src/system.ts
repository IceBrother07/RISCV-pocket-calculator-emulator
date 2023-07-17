import { RAMDevice } from "./SystemInterface/ram";
import { ROMDevice } from "./SystemInterface/rom";
import { SystemInterface } from "./SystemInterface/system_interface";
import { toHexString } from "./util";
import {InstructionFetch} from "./pipeline/instruction_Fetch"
import { Decode } from "./pipeline/instruction_Decode";
import { Register32 } from "./register32";
import { Execute } from "./pipeline/execute";
import { MemoryAccess } from "./pipeline/memory_access";
import { WriteBack } from "./pipeline/write_back";



enum State{
    InstructionFetch,
    Decode,
    Execute,
    MemoryAccess,
    WriteBack
}

class RVI32System{
    state=State.InstructionFetch;
    rom=new ROMDevice;
    ram=new RAMDevice;
    regFile=Array.from({length:32},()=>new Register32());

    bus=new SystemInterface(this.rom,this.ram);
    readbus(){
        this.bus=new SystemInterface(this.rom,this.ram);
    }

    IF=new InstructionFetch({
        bus:this.bus,
        shouldStall:()=>this.state!=State.InstructionFetch,
    });
    DE= new Decode({
        shouldStall:()=>this.state!=State.Decode,
        getInstructionIn:()=>this.IF.getInstructionOut(),
        regFile:this.regFile
    });

    EX=new Execute({
        shouldStall:()  =>this.state != State.Execute,
        getDecodedValuesIn:()=>this.DE.getDecodedValuesOut()
    });
    MEM=new MemoryAccess({
        shouldStall:()  =>this.state!= State.MemoryAccess,
        getExecutionValuesIn:()=>this.EX.getExecutionValuesOut()
    })
    WB=new WriteBack({
        shouldStall:()  =>this.state!= State.WriteBack,
        regFile:this.regFile,
        getMemoryAccessValuesIn:()=>this.MEM.getMemoryAccessValuesOut(),
    })
    compute(){
        this.IF.compute();
        this.DE.compute();
        this.EX.compute();
        this.MEM.compute();
        this.WB.compute();

    }
    latchNext(){
        this.IF.latchNext();
        this.DE.latchNext();
        this.EX.latchNext(); 
        this.MEM.latchNext();
        this.WB.latchNext();
    }
    cycle(){
        let cnt=0;
        this.compute();
        this.latchNext();
        switch(this.state){
            case State.InstructionFetch:{
                this.state=State.Decode;
                break;
            }
            case State.Decode:{
                this.state=State.Execute;
                break;
            }
            case State.Execute:{
                this.state=State.MemoryAccess;
                break;
            }
            case State.MemoryAccess:{
                this.state=State.WriteBack;
                break
            }
            case State.WriteBack:{
                this.state=State.InstructionFetch;
                break
            }
        }
        if(this.EX.getExecutionValuesOut()&& this.state==State.InstructionFetch)
            console.log("res="+this.EX.getExecutionValuesOut().aluResult);
    }
}
export default RVI32System;
/*
const rv=new RVI32System();
//imm[11:0] rs1 000 rd 0010011 ADDI
//0000000 rs2 rs1 000 rd 0110011 ADD
//0100000 rs2 rs1 000 rd 0110011 SUB
//0000000 rs2 rs1 101 rd 0110011 SRL
// 0b0000000_00010_00001_101_00011_0110011// SRL r2,r1 to r3
rv.rom.load(new Uint32Array());
rv.regFile[1].value=9;//M
rv.regFile[2].value=5;//q
rv.regFile[3].value=0b00000000;//q[-1]
rv.regFile[4].value=0b00000000;//A
for(let cnt=0;cnt<8;cnt++){
    rv.rom.add(new Uint32Array([
        0b000000000001_00010_111_00101_0010011,//ANDI r2=Q mask=0b1 to r5
        0b000000000001_00101_001_00101_0010011,//shift left by 1
        0b0000000_00011_00101_000_00101_0110011//ADD r3 to r5 -> q[0]q[-1]
    ]));

    for(let i=0;i<5*3;i++)
        rv.cycle();
    console.log(rv.regFile[5].value.toString(2).padStart(32,'0'))
    if((rv.regFile[5].value & 0b11)==0b10){
        rv.rom.add(new Uint32Array([
            0b0100000_00001_00100_000_00100_0110011// r4-r1=A-M
        ]))
        for(let i=0;i<5;i++)
            rv.cycle();
    }
    else  if((rv.regFile[5].value & 0b11)==0b01){
        rv.rom.add(new Uint32Array([
            0b0000000_00001_00100_000_00100_0110011,// r4+r1=A+M
        ]))
        for(let i=0;i<5;i++)
            rv.cycle();
    }
    console.log("A="+rv.regFile[4].value);
    rv.rom.add(new Uint32Array([
        0b000000000001_00100_111_00111_0010011,// first bit from A to r7
        0b000000000001_00100_101_00100_0010011,// shift right A

        0b000000000001_00010_111_00110_0010011,//first bit from Q to r6
        0b000000000001_00010_101_00010_0010011,//shift right Q

    ]))
    for(let i=0;i<5*4;i++)
        rv.cycle();
    console.log("A="+rv.regFile[4].value);
    console.log((rv.regFile[7].value<<7).toString(2)+"wtf")
    rv.regFile[7].value=(rv.regFile[7].value<<7)
    console.log(rv.regFile[7].value+"wtf2")
    rv.rom.add(new Uint32Array([
    
        //0b000000000111_00111_001_00111_0010011,//shift left by 7 r7
        0b0000000_00010_00111_000_00010_0110011//add r7 to Q
    
        ]))
        for(let i=0;i<5*1;i++)
            rv.cycle();
    
    console.log(rv.regFile[6].value)
    rv.regFile[3].value=rv.regFile[6].value;
    console.log(rv.regFile[3].value)
}
console.log(rv.regFile[4].value)
console.log(rv.regFile[2].value)


rv.regFile[1].value=5;
rv.regFile[2].value=7;
rv.regFile[3].value=0b00000000_00000000_00000000_00000001;
rv.regFile[4].value=0b00000000_00000000_00000000_00000000;
rv.regFile[7].value=0b0;
rv.rom.load(new Uint32Array())
for(let i=0;i<16;i++){
    rv.rom.add(new Uint32Array([
        0b0000000_00001_00011_111_00101_0110011,//AND r1,r3 to r5

    ]));
    for(let i=0;i<5*1;i++)
            rv.cycle();
    if(rv.regFile[5].value==rv.regFile[3].value)
    {
        rv.rom.add(new Uint32Array([
            0b0000000_00100_00010_001_00110_0110011,// r2<<r4 to r6
            0b0000000_00110_00111_000_00111_0110011// r7=r7+r6
        ]));
        for(let i=0;i<5*2;i++)
            rv.cycle();
    }
    rv.rom.add(new Uint32Array([
        0b000000000001_00100_000_00100_0010011,//add 1 to r4
        0b000000000001_00011_001_00011_0010011//r3<<1

    ]));
    for(let i=0;i<5*2;i++)
        rv.cycle();
}
console.log(rv.regFile[5].value)*/



