import { MemoryMap, SystemInterface } from "../SystemInterface/system_interface";
import { Register32 } from "../register32";
import { twos, untwos } from "../util";
import { PipelineStage } from "./pipeline_stage";


export interface ExecuteParams{
    shouldStall:()=>boolean;
    getDecodedValuesIn:()=>DecodedValues;
}

export type DecodedValues={
    instruction:number;
    opcode:number;
    rd:number;
    funct3:number;
    rs1:number;
    rs2:number;
    imm11_0:number;
    funct7:number;
    shamt:number;
}
export enum ALUOperation{
    ADD =0b000,
    SLL =0b001,//shift left logical
    SLT =0b010,//set less than
    SLTU=0b011,//sset less than unsigned
    XOR =0b100,
    SRL =0b101,//shift right logical
    OR  =0b110,
    AND =0b111,
}
export class Execute extends PipelineStage{
    private shouldStall:ExecuteParams['shouldStall'];
    private getDecodedValuesIn:ExecuteParams['getDecodedValuesIn'];

    private aluResult=new Register32(0);
    private aluResultNext=new Register32(0);

    private rd=0;
    private rdNext=0;

    private isAluOperation=false;
    private isAluOperationNext=false;

    constructor(params:ExecuteParams){
        super();
        this.shouldStall=params.shouldStall;
        this.getDecodedValuesIn=params.getDecodedValuesIn;
    }

    compute() {
        if(!this.shouldStall()){
            const decoded=this.getDecodedValuesIn();

            this.rdNext=decoded.rd;
        
            const isRegisterOp=Boolean((decoded.opcode>>5)&1);
            const isAlternate=Boolean((decoded.imm11_0>>10)&1);

            const imm32=twos((decoded.imm11_0<<20)>>20);//sign extension

            this.isAluOperationNext=(decoded.opcode & 0b1011111)===0b0010011;

            switch(decoded.funct3){
                case ALUOperation.ADD:{
                    if(isRegisterOp){
                        if(isAlternate){
                            this.aluResultNext.value=decoded.rs1-decoded.rs2;
                        }
                        else this.aluResultNext.value=decoded.rs1+decoded.rs2;
                    }
                    else{
                        this.aluResultNext.value=decoded.rs1+imm32;
                    }
                    break;
                }
                case ALUOperation.SLL:{
                    if(isRegisterOp){
                            this.aluResultNext.value=twos(decoded.rs1<<decoded.rs2);
                    }
                    else this.aluResultNext.value=twos(decoded.rs1<<decoded.shamt);
                    break;
                    
                }
                case ALUOperation.SLT:{
                    if(isRegisterOp){
                            this.aluResultNext.value=Number(untwos(decoded.rs1)<untwos(decoded.rs2));
                    } 
                    else this.aluResultNext.value=Number(untwos(decoded.rs1)<untwos(imm32));
                    break;
                    
                }
                case ALUOperation.SLTU:{
                    if(isRegisterOp){
                            this.aluResultNext.value=Number(decoded.rs1 < decoded.rs2);
                    }
                    else this.aluResultNext.value=Number(decoded.rs1 < imm32);

                    break;
                    
                }
                case ALUOperation.XOR:{
                    if(isRegisterOp){
                            this.aluResultNext.value=twos(decoded.rs1^ decoded.rs2);
                    }else this.aluResultNext.value=twos(decoded.rs1^ imm32);
                    
                    break;
                    
                }
                case ALUOperation.SRL:{
                    if(isRegisterOp){
                            this.aluResultNext.value=twos(decoded.rs1>>decoded.rs2);
                    }else this.aluResultNext.value=twos(decoded.rs1>>imm32);
                
                    break;
                    
                }
                case ALUOperation.OR:{
                    if(isRegisterOp){
                            this.aluResultNext.value=twos(decoded.rs1 | decoded.rs2);
                    }else this.aluResultNext.value=twos(decoded.rs1 | imm32);
;
                    break;
                    
                }
                case ALUOperation.AND:{
                    if(isRegisterOp){
                            this.aluResultNext.value=twos(decoded.rs1 & decoded.rs2);
                    }
                    else this.aluResultNext.value=twos(decoded.rs1 & imm32);
                    break;
                    
                }
                

            }

        }
    }
    latchNext() {
        this.aluResult.value=this.aluResultNext.value;
        this.isAluOperation=this.isAluOperationNext;
        this.rd=this.rdNext;
    }
    getExecutionValuesOut(){
        return {
            aluResult:this.aluResult.value,
            rd:this.rd,
            isAluOperation:this.isAluOperation,
        }
    }
}
