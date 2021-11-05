import { FormControl, ValidationErrors } from "@angular/forms";

export class ShopkaroValidators {
    //whitespace validation 
    static notOnlyWhitespace(control:FormControl):ValidationErrors{
        //check if string only has white space
        if((control.value != null) && (control.value.trim().length === 0 )){
            //invalid , return error Object
            return {'notOnlyWhitespace':true};
        }
        else{
            //valid return null
            return null;
        }
    }
}
