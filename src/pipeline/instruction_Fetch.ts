import { MemoryMap, SystemInterface } from "../SystemInterface/system_interface";
import { Register32 } from "../register32";
import { PipelineStage } from "./pipeline_stage";

export interface InstructionFetchParams{
    bus: SystemInterface;
    shouldStall:()=>boolean;
}

export class InstructionFetch extends PipelineStage{
    private instruction = new Register32(0);
    private pc = new Register32(MemoryMap.ProgramROMStart);//program counter
    private pcNext = new Register32(MemoryMap.ProgramROMStart);
    private instructionNext=new Register32(0);
    private bus:InstructionFetchParams['bus'];
    private shouldStall:InstructionFetchParams['shouldStall'];

    constructor(params:InstructionFetchParams){
        super();
        this.bus=params.bus
        this.shouldStall=params.shouldStall;
    }

    compute() {
        if(!this.shouldStall()){
            this.instructionNext.value=this.bus.read(this.pc.value);//if not stall read
            this.pcNext.value+=4;//4 bytes per 32 int
        }
    }
    latchNext() {
        this.instruction.value=this.instructionNext.value;
        this.pc.value=this.pcNext.value;
    }
    getInstructionOut(){
        return this.instruction.value;
    }
}