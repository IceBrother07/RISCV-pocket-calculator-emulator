import { MMIODevice } from "./system_interface";
export const ROMSize=1024*1024*4//4MB

export class ROMDevice implements MMIODevice{
    private rom =new Uint32Array(ROMSize/4)
    private cnt=0;
    read(address: number){
        return this.rom[address & ((ROMSize/4)-1)];
    }
    write(address:number,value: number){
        //cant write to rom
    }
    load(data: Uint32Array){
        for(let i=0;i<(ROMSize/4);i++){
            if(i>=data.length){
                this.rom[i]=0xffffffff;
            }
            else {this.rom[i]=data[i];this.cnt++}
        }
    }
    add(data: Uint32Array){
        var len=this.cnt+data.length;
        var j=0;
        for(let i=this.cnt;i<len;i++){
            
            this.rom[i]=data[j];
            this.cnt++;
            j++;
        }
    }
    clear(){
        this.rom=new Uint32Array(ROMSize/4);
    }
}