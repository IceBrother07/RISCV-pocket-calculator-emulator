export const toHexString = (n: number,l=8)=> n.toString(16).padStart(l,'0');
export const toBinString = (n: number,l=32)=> n.toString(2).padStart(l,'0')

export const twos=(v:number)=>{
    if(v<0){
        return (~(-v)+1) & 0xffffffff}//flip bits +1
    else return v;
};

export const untwos=(v:number)=>{
    if(v>=80000000)
        return ~~v//flip twice bits
    else return v;
};