export class Register32{
    private _value: number;
    constructor(value = 0){this._value=value;}

    get value(){return this._value;}
    set value(v:number){
        if(v<0){this._value=(~(-v)+1) & 0xffffffff}//flip bits +1
        else this._value=v;
        
    }
}