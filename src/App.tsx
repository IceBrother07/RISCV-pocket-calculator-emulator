import { Button, Container, styled } from '@mui/material';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import React, { useState } from 'react';
import { GridOperationButton } from './GridOperationButton';
import { GridDigitButton } from './GridDigitButton';
import RVI32System from './system';
import {untwos} from './util'

const OutputContainer=styled('div')(({theme})=>({
  width: "100%",
  textAllign: "right",
  heigth: "2em",
  padding: theme.spacing(2),
  fontSize: "3em",
  overflow: "hidden"
}))
const CalculatorBase= styled(Paper)(({theme})=>({
  padding: theme.spacing(2),
  marginTop: theme.spacing(4),
  borderRadius:15
}))
function App() {
  const [currentValue,setCurrentValue]=useState("0");
  const [operation,setOperation]=useState("");
  const [prevValue,setPrevValue]=useState("");
  const [overwrite,setOverwrite]=useState(true);
  var rv=new RVI32System();


  const calculate=()=>{
    if(!prevValue||!operation)return currentValue;
    const curr=parseFloat(currentValue)
    const prev=parseFloat(prevValue)

    let result;
    switch(operation){
      case "+":{
        rv.regFile[1].value=curr;
        rv.regFile[2].value=prev;
        rv.rom.load(new Uint32Array([
          0b0000000_00001_00010_000_00100_0110011 //add r1,r2 to r4
        ]));
        for(let i=0;i<5;i++)
          rv.cycle();
        result=rv.regFile[4].value;
        console.log(result)
        break;
      }
      case "-":{
        rv.regFile[1].value=curr;
        rv.regFile[2].value=prev;
        rv.rom.load(new Uint32Array([
          0b0100000_00001_00010_000_00100_0110011 //sub r1,r2 to r4
        ]));
        for(let i=0;i<5;i++)
          rv.cycle();
        result=rv.regFile[4].value;
        console.log(result)
        break;
      }
      case "*":{
        if(prev>curr){
          rv.regFile[1].value=prev;//M
          rv.regFile[2].value=curr;//Q
        }
        else{
          rv.regFile[1].value=curr;//M
          rv.regFile[2].value=prev;//Q
        }
        rv.regFile[3].value=0b00000000;//q[-1]
        rv.regFile[4].value=0b000000000;//A
        for(let cnt=0;cnt<4;cnt++){
            rv.rom.add(new Uint32Array([
                0b000000000011_00010_111_00101_0010011,//ANDI r2=Q mask=0b11 to r5
                0b000000000001_00101_001_00101_0010011,//shift left r5 by 1
                0b0000000_00011_00101_000_00101_0110011//ADD r3 to r5 -> q[1]q[0]q[-1]
            ]));
        
            for(let i=0;i<5*3;i++)
                rv.cycle();
            console.log(rv.regFile[5].value.toString(2).padStart(32,'0'))
            if((rv.regFile[5].value & 0b111)==0b110||(rv.regFile[5].value & 0b111)==0b101){
                rv.rom.add(new Uint32Array([
                    0b000111111111_00100_111_00100_0010011,
                    0b0100000_00001_00100_000_00100_0110011,// r4-r1=A-M
                    0b000111111111_00100_111_00100_0010011,
                ]))
                for(let i=0;i<5*3;i++)
                    rv.cycle();
            }
            else  if((rv.regFile[5].value & 0b111)==0b010||(rv.regFile[5].value & 0b111)==0b001){
                rv.rom.add(new Uint32Array([
                    0b000111111111_00100_111_00100_0010011,
                    0b0000000_00001_00100_000_00100_0110011,// r4+r1=A+M
                    0b000111111111_00100_111_00100_0010011,

                ]))
                for(let i=0;i<5*3;i++)
                    rv.cycle();
            }
            else  if((rv.regFile[5].value & 0b111)==0b011){
              rv.rom.add(new Uint32Array([
                  0b000111111111_00100_111_00100_0010011,
                  0b0000000_00001_00001_000_01010_0110011,// r1+r1=2M to r10
                  0b000111111111_00100_111_00100_0010011,
                  0b0000000_01010_00100_000_00100_0110011,// r4+r10=A+2M
                  0b000111111111_00100_111_00100_0010011,

              ]))
              for(let i=0;i<5*5;i++)
                  rv.cycle();
            }
            else  if((rv.regFile[5].value & 0b111)==0b100){
              rv.rom.add(new Uint32Array([
                0b000111111111_00100_111_00100_0010011,

                  0b0000000_00001_00001_000_01010_0110011,// r1+r1=2M to r10
                  0b000111111111_00100_111_00100_0010011,

                  0b0100000_01010_00100_000_00100_0110011,// r4-r10=A-2M
                  0b000111111111_00100_111_00100_0010011,

              ]))
              for(let i=0;i<5*5;i++)
                  rv.cycle();
            }
              console.log("A="+rv.regFile[4].value);
              rv.rom.add(new Uint32Array([
                  0b000111111111_00100_111_00100_0010011,//mask of 9 bits 
                  0b000000000011_00100_111_00111_0010011,// last 2 bit from A to r7
                  0b000100000000_00100_111_01011_0010011,// first bit from A to r11
                  0b000000000010_00100_101_00100_0010011,// shift right 2 bits right A

                  0b0000000_00100_01011_000_00100_0110011,//add r11 to A on A[8]
                  0b000000000001_01011_101_01011_0010011,//shift right r11
                  0b0000000_00100_01011_000_00100_0110011,//add r11 to A on A[7]
          
                  0b000000000010_00010_111_01100_0010011,//second last bit from Q to r12
                  0b000000000001_01100_101_01100_0010011,//shift r12
                  0b000000000010_00010_101_00010_0010011,   //shift 2bits right Q
                  0b000111111111_00100_111_00100_0010011,
        
            ]))
            for(let i=0;i<5*11;i++)
              rv.cycle();
            console.log("A="+rv.regFile[4].value);
            console.log((rv.regFile[7].value<<6).toString(2)+"wtf")
            rv.regFile[7].value=(rv.regFile[7].value<<6)
            console.log(rv.regFile[7].value+"wtf2")
            rv.rom.add(new Uint32Array([
                //0b000000000111_00111_001_00111_0010011,//shift left by 7 r7
                0b0000000_00010_00111_000_00010_0110011//add r7 to Q
                ]))
            for(let i=0;i<5*1;i++)
              rv.cycle();
            rv.regFile[3].value=rv.regFile[12].value;
            console.log("A="+rv.regFile[4].value.toString(2))
            console.log("Q="+rv.regFile[2].value.toString(2))
          }
          rv.rom.add(new Uint32Array([
            0b000000001000_00100_001_00100_0010011,//shift left by A r8
            0b0000000_00100_00010_000_00010_0110011//add Q to A
            ]))
        for(let i=0;i<5*2;i++)
          rv.cycle();
        console.log(rv.regFile[2].value+"value")
        result=rv.regFile[2].value;
        console.log(result)
        break;
      
      }
      case "/":{
        rv.regFile[1].value=prev;
        rv.regFile[2].value=curr;
        rv.regFile[16].value=curr//M orig
        rv.regFile[3].value=0//A
        rv.regFile[15].value=0//CNT2
        rv.regFile[14].value=0//CNT1
        rv.regFile[13].value=0//Q'
        rv.rom.load(new Uint32Array)
        rv.rom.add(new Uint32Array([
            0b000010000000_00010_111_00100_0010011,// m[7] to r4
        ]))
        for(let i=0;i<5*1;i++)
            rv.cycle();
        while(rv.regFile[4].value==0){
            console.log("Q="+rv.regFile[1].value.toString(2))
            console.log("M="+rv.regFile[2].value.toString(2))
            console.log("A="+rv.regFile[3].value.toString(2))
            console.log("CNT1="+rv.regFile[14].value.toString(2))
            console.log("m7="+rv.regFile[4].value)
            rv.rom.add(new Uint32Array([
                0b000010000000_00001_111_00101_0010011,//first bit from r1=Q to r5
                0b000000000111_00101_101_00101_0010011,//shift right r5 by 7
        
                0b000000000001_00011_001_00011_0010011,//shift left r3=A by 1
                0b0000000_00101_00011_000_00011_0110011,//add r5 to A
        
                0b000000000001_00001_001_00001_0010011,//shift left Q=r1 by 1
                0b000000000001_00010_001_00010_0010011,//shift left M=r2 by 1
                0b000010000000_00010_111_00100_0010011,// m[7] to r4
        
                0b000000000001_01110_000_01110_0010011,//add 1 to CNT1=r14
        
                0b000111000000_00011_111_00110_0010011,// A[8]A[7]A[6] to r6
                0b000000000110_00110_101_00110_0010011,//shift right by 6 r6
        
                0b000011111111_00001_111_00001_0010011,
                    0b000011111111_00010_111_00010_0010011,
                    0b000011111111_00011_111_00011_0010011,
        
            ]))
            for(let i=0;i<5*13;i++)
                rv.cycle();
        }
        console.log(rv.regFile[6].value.toString(2).padStart(32,'0'))
        
        while(rv.regFile[15].value<8){
            console.log("loop")
            console.log("Q="+rv.regFile[1].value.toString(2))
            console.log("A="+rv.regFile[3].value.toString(2))
            console.log("M="+rv.regFile[2].value.toString(2))
            console.log("A[8-6]="+rv.regFile[6].value.toString(2))
            if((rv.regFile[6].value&0b111)==0b001||(rv.regFile[6].value&0b111)==0b010||(rv.regFile[6].value&0b111)==0b011){
                rv.rom.add(new Uint32Array([
                    0b000010000000_00001_111_00101_0010011,//first bit from r1=Q to r5
                    0b000000000111_00101_101_00101_0010011,//shift right r5 by 7
        
                    0b000000000001_00011_001_00011_0010011,//shift left r3=A by 1
                    0b0000000_00101_00011_000_00011_0110011,//add r5 to A
        
                    0b000000000001_00001_001_00001_0010011,//shift left Q=r1 by 1
                    0b000000000001_00001_000_00001_0010011,//add q[0]=1
        
                    0b000000000001_01101_001_01101_0010011,//shift left Q'=r1 by 1
                    //0b000000000001_01101_000_01101_0010011,//add q'[0]=0
        
                    0b0100000_00010_00011_000_00011_0110011,//A-M
        
        
                    0b000011111111_00001_111_00001_0010011,
                    0b000011111111_00010_111_00010_0010011,
                    0b000111111111_00011_111_00011_0010011,
        
                ]))
                for(let i=0;i<5*11;i++)
                    rv.cycle();
                console.log("A-M")
            }else if((rv.regFile[6].value&0b111)==0b110||(rv.regFile[6].value&0b111)==0b100||(rv.regFile[6].value&0b111)==0b101){
                rv.rom.add(new Uint32Array([
                    0b000010000000_00001_111_00101_0010011,//first bit from r1=Q to r5
                    0b000000000111_00101_101_00101_0010011,//shift right r5 by 7
        
                    0b000000000001_00011_001_00011_0010011,//shift left r3=A by 1
                    0b0000000_00101_00011_000_00011_0110011,//add r5 to A
        
                    0b000000000001_00001_001_00001_0010011,//shift left Q=r1 by 1
        
                    0b000000000001_01101_001_01101_0010011,//shift left Q'=r1 by 1
                    0b000000000001_01101_000_01101_0010011,//add q'[0]=1
        
                    0b000011111111_00001_111_00001_0010011,
                    0b000011111111_00010_111_00010_0010011,
                    0b000111111111_00011_111_00011_0010011,
        
                    0b0000000_00010_00011_000_00011_0110011,//AM
                    0b000111111111_00011_111_00011_0010011,
        
        
        
        
                ]))
                for(let i=0;i<5*12;i++)
                    rv.cycle();
                console.log("A+M")
            }else{
                rv.rom.add(new Uint32Array([
                    0b000010000000_00001_111_00101_0010011,//first bit from r1=Q to r5
                    0b000000000111_00101_101_00101_0010011,//shift right r5 by 7
        
                    0b000000000001_00011_001_00011_0010011,//shift left r3=A by 1
                    0b0000000_00101_00011_000_00011_0110011,//add r5 to A
        
                    0b000000000001_00001_001_00001_0010011,//shift left Q=r1 by 1
        
                    0b000000000001_01101_001_01101_0010011,//shift left Q'=r1 by 1
        
        
                    0b000011111111_00001_111_00001_0010011,
                    0b000011111111_00010_111_00010_0010011,
                    0b000111111111_00011_111_00011_0010011,
        
                ]))
                for(let i=0;i<5*9;i++)
                    rv.cycle();
                console.log("skip")
            }
            rv.rom.add(new Uint32Array([
         
                0b000000000001_01111_000_01111_0010011,//add 1 to cnt2=r[15]
                0b000100000000_00001_111_00111_0010011,//A[8] to r7
        
                0b000111000000_00011_111_00110_0010011,// A[8]A[7]A[6] to r6
                0b000000000110_00110_101_00110_0010011,//shift right by 6 r6
        
                0b000011111111_00001_111_00001_0010011,
                    0b000011111111_00010_111_00010_0010011,
                    0b000111111111_00011_111_00011_0010011,
        
            ]))
            for(let i=0;i<5*7;i++)
                rv.cycle();
        }
        if(!rv.regFile[7].value){
            rv.rom.add(new Uint32Array([
                0b0000000_00010_00011_000_00011_0110011,//A+M
                0b000111111111_00011_111_00011_0010011,
                0b000000000001_01101_000_01101_0010011//q'=q'+1
        
            ]))
            for(let i=0;i<5*3;i++)
                rv.cycle();
        }
        
        rv.regFile[12].value=0b1;
        while(rv.regFile[14].value){
            console.log("loop2"+rv.regFile[14].value.toString(2))
            rv.rom.add(new Uint32Array([
                0b000111111111_00011_111_00011_0010011,
                0b000000000001_00011_101_00011_0010011,//shift right r3=A by 1
                0b000011111111_00011_111_00011_0010011,//a[8]=0
                0b0100000_01100_01110_000_01110_0110011,//sub 1 to CNT1=r14
        
            ]))
            for(let i=0;i<5*4;i++)
                rv.cycle();
        }
        rv.rom.add(new Uint32Array([
            0b0100000_01101_00001_000_00001_0110011,//Q=Q-Q'
        
        ]))
        for(let i=0;i<5*1;i++)
            rv.cycle();
        if(rv.regFile[3].value>=rv.regFile[16].value){
            rv.rom.add(new Uint32Array([
                0b000000000001_00001_000_00001_0010011,
                0b0100000_10000_00011_000_00011_0110011
        
            ]))
            console.log("why")
            for(let i=0;i<5*2;i++)
                rv.cycle();}
        console.log("Q-result="+rv.regFile[1].value)
        console.log("A-rest="+rv.regFile[3].value)
        console.log("old="+rv.regFile[16].value)
        result=rv.regFile[1].value;
        console.log(result)
        break;
      }

    }
    return result;
  }
  const equals=()=>{
    const val=calculate();
    setCurrentValue(`${val}`)
    setPrevValue("")
    setOperation("")
    setOverwrite(true)
  }

  const clear=()=>{
    setPrevValue("")
    setOperation("")
    setCurrentValue("0")
    setOverwrite(true)
  }

  const del=()=>{
    setCurrentValue("0")
    setOverwrite(true)
  }

  const selectOperation=(operation:string)=>{
    setPrevValue(currentValue)
    setOperation(operation)
    setOverwrite(true)
  }

  const setDigit=(digit:string)=>{
    if(currentValue[0]==="0" && digit ==="0")return;
    if(currentValue.includes(".") && digit==".") return;
    if(overwrite && digit !== "."){
      setCurrentValue(digit)
    }
    else{setCurrentValue(`${currentValue}${digit}`);}
    setOverwrite(false);
  }
  return (
    <Container maxWidth="sm">
      <CalculatorBase elevation={3}>
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <OutputContainer>
              {currentValue}
            </OutputContainer>
          </Grid>

          <Grid item container columnSpacing={1}>
            <GridOperationButton
            operation={"AC"}
            selectOperation={clear}
            selectedOperation={operation}
            />
            <GridOperationButton
            operation={"C"}
            selectOperation={del}
            selectedOperation={operation}
            />
            <GridOperationButton
            operation={"+"}
            selectOperation={selectOperation}
            selectedOperation={operation}
            />
            <GridOperationButton
            operation={"-"}
            selectOperation={selectOperation}
            selectedOperation={operation}
            />

          </Grid>
          <Grid item container columnSpacing={1}>
            <GridDigitButton digit={"7"} enterDigit={setDigit} />
            <GridDigitButton digit={"8"} enterDigit={setDigit} />
            <GridDigitButton digit={"9"} enterDigit={setDigit} />
            <GridOperationButton
            operation={"*"}
            selectOperation={selectOperation}
            selectedOperation={operation}
            />
            </Grid>

            <Grid item container columnSpacing={1}>
            <GridDigitButton digit={"4"} enterDigit={setDigit} />
            <GridDigitButton digit={"5"} enterDigit={setDigit} />
            <GridDigitButton digit={"6"} enterDigit={setDigit} />
            <GridOperationButton
            operation={"/"}
            selectOperation={selectOperation}
            selectedOperation={operation}
            />
            </Grid>
            <Grid item container columnSpacing={1}>
            <GridDigitButton digit={"1"} enterDigit={setDigit} />
            <GridDigitButton digit={"2"} enterDigit={setDigit} />
            <GridDigitButton digit={"3"} enterDigit={setDigit} />
          </Grid>
          <Grid item container columnSpacing={1}>
            <GridDigitButton digit={"0"} enterDigit={setDigit} xs={6}/>
            <Grid item xs={3}>
              <Button fullWidth variant='contained' onClick={equals}>
                =
              </Button>
            </Grid>
            </Grid>
        </Grid>
        </CalculatorBase>
    </Container>
  );
}

export default App;
