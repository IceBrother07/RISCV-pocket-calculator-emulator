import { MemoryMap, SystemInterface } from "../SystemInterface/system_interface";
import { Register32 } from "../register32";
import { MemoryAccess } from "./memory_access";
import { PipelineStage } from "./pipeline_stage";


export interface WriteBackParams{
    shouldStall:()=>boolean;
    getMemoryAccessValuesIn:()=>ReturnType<MemoryAccess['getMemoryAccessValuesOut']>;
    regFile:Array<Register32>;
}

export class WriteBack extends PipelineStage{
    private shouldStall:WriteBackParams['shouldStall'];
    private getMemoryAccessValuesIn:WriteBackParams['getMemoryAccessValuesIn'];
    private regFile:WriteBackParams['regFile'];

    constructor(params:WriteBackParams){
        super();
        this.shouldStall=params.shouldStall;
        this.getMemoryAccessValuesIn=params.getMemoryAccessValuesIn;
        this.regFile=params.regFile;
    }

    compute() {
        if(!this.shouldStall()){
            const {aluResult,rd,isAluOperation}=this.getMemoryAccessValuesIn();
            if(isAluOperation){
                this.regFile[rd].value=aluResult;
            }
            
        }
    }
    latchNext() {
  
    }

}