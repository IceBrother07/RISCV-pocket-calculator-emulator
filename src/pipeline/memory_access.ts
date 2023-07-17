import { MemoryMap, SystemInterface } from "../SystemInterface/system_interface";
import { Register32 } from "../register32";
import { DecodedValues, Execute } from "./execute";
import { PipelineStage } from "./pipeline_stage";


export interface MemoryAccessParams{
    shouldStall:()=>boolean;
    getExecutionValuesIn:()=>ReturnType<Execute['getExecutionValuesOut']>;
}

export class MemoryAccess extends PipelineStage{
    private shouldStall:MemoryAccessParams['shouldStall'];
    private getExecutionValuesIn:MemoryAccessParams['getExecutionValuesIn'];
    private aluResults=0;
    private aluResultsNext=0;
    private rd=0;
    private rdNext=0;

    private isAluOperation=false;
    private isAluOperationNext=false;

    constructor(params:MemoryAccessParams){
        super();
        this.shouldStall=params.shouldStall;
        this.getExecutionValuesIn=params.getExecutionValuesIn;

    }

    compute() {
        if(!this.shouldStall()){
            const {aluResult,rd,isAluOperation}=this.getExecutionValuesIn();
            this.aluResultsNext=aluResult;
            this.rdNext=rd;
            this.isAluOperationNext=isAluOperation;
            
        }
    }
    latchNext() {
        this.aluResults=this.aluResultsNext;
        this.rd=this.rdNext;
        this.isAluOperation=this.isAluOperationNext;
  
    }
    getMemoryAccessValuesOut(){
        return {
            aluResult:this.aluResults,
            rd:this.rd,
            isAluOperation:this.isAluOperation
        }
    }

}