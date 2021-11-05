import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormGroupName, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Country } from 'src/app/common/country';
import { Order } from 'src/app/common/order';
import { OrderItem } from 'src/app/common/order-item';
import { Purchase } from 'src/app/common/purchase';
import { ShopkaroValidators } from 'src/app/common/shopkaro-validators';
import { State } from 'src/app/common/state';
import { CartService } from 'src/app/services/cart.service';
import { CheckoutService } from 'src/app/services/checkout.service';
import { ShopkaroService } from 'src/app/services/shopkaro.service';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {

  checkoutFormGroup:FormGroup;
  totalQuantity:number=0;
  totalPrice:number=0;

  creditCardYears:number[]=[];
  creditCardMonths:number[]=[];

  countries:Country[] = [];

  shippingAddressStates:State[] = [];
  billingAddressStates:State[]=[];

  constructor(private formBuilder:FormBuilder,
              private cartService:CartService,
              private shopKaroService:ShopkaroService,
              private checkoutService:CheckoutService,
              private router :Router ) { }

  ngOnInit(): void {
    this.reviewCartDetails();
    this.checkoutFormGroup = this.formBuilder.group({

      customer:this.formBuilder.group({
        firstName:new FormControl('',[Validators.required,
                                      Validators.minLength(2),
                                      ShopkaroValidators.notOnlyWhitespace]),

        lastName:new FormControl('',[Validators.required,
                                    Validators.minLength(2),
                                    ShopkaroValidators.notOnlyWhitespace]),

        email:new FormControl('',[Validators.required, 
                                  Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')])
      }),


      shippingAddress:this.formBuilder.group({
        street:new FormControl('',[Validators.required,
                                  Validators.minLength(2),
                                  ShopkaroValidators.notOnlyWhitespace]),

        city:new FormControl('',[Validators.required,
                                Validators.minLength(2),
                                ShopkaroValidators.notOnlyWhitespace]),

        state:new FormControl('',[Validators.required]),

        country:new FormControl('',[Validators.required]),

        zipCode:new FormControl('',[Validators.required,
                                    Validators.minLength(5),
                                    ShopkaroValidators.notOnlyWhitespace,
                                    Validators.pattern('[0-9]{5}')]),
      }),



      billingAddress:this.formBuilder.group({
        street:new FormControl('',[Validators.required,
                                    Validators.minLength(2),
                                    ShopkaroValidators.notOnlyWhitespace]),

        city:new FormControl('',[Validators.required,
                                Validators.minLength(2),
                                ShopkaroValidators.notOnlyWhitespace]),

        state:new FormControl('',[Validators.required]),

        country:new FormControl('',[Validators.required]),

        zipCode:new FormControl('',[Validators.required,
                            Validators.minLength(5),
                            ShopkaroValidators.notOnlyWhitespace,
                            Validators.pattern('[0-9]{5}')]),
        }),

      creditCard :this.formBuilder.group({
        cardType:new FormControl('',[Validators.required]),

        nameOnCard:new FormControl('',[Validators.required,
                                      Validators.minLength(2),
                                      ShopkaroValidators.notOnlyWhitespace,
                                      ]),


        cardNumber:new FormControl('',[Validators.required,
                                      Validators.pattern('[0-9]{16}')]),

                                      
        securityCode:new FormControl('',[Validators.required,
                                         Validators.pattern('[0-9]{3}')]),

        expirationMonth:new FormControl('',[Validators.required]),

        expirationYear:new FormControl('',[Validators.required])
      })
    });

    
    const startMonth :number = new Date().getMonth()+1;
    console.log("StartMonth : "+startMonth);

    this.shopKaroService.getCreditCardMonths(startMonth).subscribe(
      data =>{
        console.log("Retrieved credit card months :"+JSON.stringify(data));
        this.creditCardMonths = data;
      }
    );


    this.shopKaroService.getCreditCardYears().subscribe(
      data => {
        console.log("Retrieved credit card years :" +JSON.stringify(data));
        this.creditCardYears = data ;

      }
    )

    //populate the countries

    this.shopKaroService.getCountries().subscribe(
      data =>{
        console.log("Retrieving countries : "+JSON.stringify(data));
        this.countries=data;
      }
    )
    
  }
  reviewCartDetails() {
    //subscribe to cartService.totalQuantity

    this.cartService.totalQuantity.subscribe(
      totalQuantity => this.totalQuantity = totalQuantity
    );

    //subscribe to cartService.totalPrice
    this.cartService.totalPrice.subscribe(
      totalPrice => this.totalPrice = totalPrice
    );

  }
  

  onSubmit(){
    console.log("Handling the submit button....");
    if(this.checkoutFormGroup.invalid){
      this.checkoutFormGroup.markAllAsTouched();
      return;
    }
    //set up order 
    let order = new Order();
    order.totalPrice = this.totalPrice;
    order.totalQuantity = this.totalQuantity;
    
    //get cart item 
    const cartItems = this.cartService.cartItems;
    //create orderItem from cartItem
    // long way 
    // let orderItems: OrderItem[] = [];
    // for(let i =0 ; i < cartItems.length ; i++){
    //   orderItems[i] = new OrderItem(cartItems[i]);
    // }
    // short way 
    let orderItems :OrderItem[]  =cartItems.map(tempCartItem => new OrderItem(tempCartItem));

    //set up purchase 
    let purchase = new Purchase();

    //populate purchase -customer
    purchase.customer = this.checkoutFormGroup.controls['customer'].value;

    //populate purchase - shipping address 
    purchase.shippingAddress = this.checkoutFormGroup.controls['shippingAddress'].value;
    const shippingState :State = JSON.parse(JSON.stringify(purchase.shippingAddress.state));
    const shippingCountry :Country = JSON.parse(JSON.stringify(purchase.shippingAddress.country));
    purchase.shippingAddress.state = shippingState.name;
    purchase.shippingAddress.country = shippingCountry.name;

    //populate purchase - billing address

    purchase.billingAddress = this.checkoutFormGroup.controls['billingAddress'].value;
    const billingState :State = JSON.parse(JSON.stringify(purchase.billingAddress.state));
    const billingCountry :Country = JSON.parse(JSON.stringify(purchase.billingAddress.country));
    purchase.billingAddress.state = billingState.name;
    purchase.billingAddress.country = billingCountry.name;
    //populate purchase - order and order items
    purchase.order = order ; 
    purchase.orderItems = orderItems;
    //call REST API via the CheckoutService
    this.checkoutService.placeOrder(purchase).subscribe(
      {
        next:response => {
          alert(`Your order has been received.\nOrder tracking number : ${response.orderTrackingNumber}`);
          //reset cart
          this.resetCart();
        },
        error: err => {
          alert(`there was an error :${err.message}`);
        } 
      }
    );

  }
  resetCart() {
    //reset cart data price
    this.cartService.cartItems = [];
    this.cartService.totalPrice.next(0);
    this.cartService.totalQuantity.next(0);
    //reset form data
    this.checkoutFormGroup.reset();

    //navigate back to products page
    this.router.navigateByUrl("/products");
  }

  copyShippingAddressToBillingAddress(event){
    if(event.target.checked){
      this.checkoutFormGroup.controls['billingAddress']
                                    .setValue(this.checkoutFormGroup.controls['shippingAddress'].value);

      this.billingAddressStates = this.shippingAddressStates;
    }
    else{
      this.checkoutFormGroup.controls['billingAddress'].reset();
      this.billingAddressStates=[];
    }

  }

  handleMonthsAndYears(){
    const creditCardFormGroup = this.checkoutFormGroup.get('creditCard');
    const currentYear:number = new Date().getFullYear();
    const selectedYear :number = Number(creditCardFormGroup.value.expirationYear);

    let startMonth:number;
    if(currentYear === selectedYear){
      startMonth = new Date().getMonth()+1;
    }

    else{
      startMonth = 1 ;
    }

    this.shopKaroService.getCreditCardMonths(startMonth).subscribe(
      data =>{
        console.log("Retrieved  credit card months : "+JSON.stringify(data));
        this.creditCardMonths = data;
      }
    )
  }


  //get states method
  getStates(formGroupName:string){

    const formGroup = this.checkoutFormGroup.get(formGroupName);
    const countryCode = formGroup.value.country.code;
    const countryName = formGroup.value.country.name;

    console.log(`${formGroupName} country code : ${countryCode}`);
    console.log(`${formGroupName} country name : ${countryName}`);
    this.shopKaroService.getStates(countryCode).subscribe(
      
      data =>{
        if(formGroupName === 'shippingAddress'){
          this.shippingAddressStates = data;
        }
        else{
          this.billingAddressStates = data;
        }

        //select first state as default
        formGroup.get('state').setValue(data[0]);
        
      }
    );

  }


  get firstName(){return this.checkoutFormGroup.get('customer.firstName');}
  get lastName(){return this.checkoutFormGroup.get('customer.lastName');}
  get email(){return this.checkoutFormGroup.get('customer.email');}

  get shippingAddressStreet(){return this.checkoutFormGroup.get('shippingAddress.street');}
  get shippingAddressCity(){return this.checkoutFormGroup.get('shippingAddress.city');}
  get shippingAddressState(){return this.checkoutFormGroup.get('shippingAddress.state');}
  get shippingAddressCountry(){return this.checkoutFormGroup.get('shippingAddress.country');}
  get shippingAddressZipCode(){return this.checkoutFormGroup.get('shippingAddress.zipCode');}

  get billingAddressStreet(){return this.checkoutFormGroup.get('billingAddress.street');}
  get billingAddressCity(){return this.checkoutFormGroup.get('billingAddress.city');}
  get billingAddressState(){return this.checkoutFormGroup.get('billingAddress.state');}
  get billingAddressCountry(){return this.checkoutFormGroup.get('billingAddress.country');}
  get billingAddressZipCode(){return this.checkoutFormGroup.get('billingAddress.zipCode');}

 //cardType nameOnCard cardNumber securityCode expirationMonth expirationYear
  get creditCardCardType(){ return this.checkoutFormGroup.get('creditCard.cardType');}
  get creditCardNameOnCard(){ return this.checkoutFormGroup.get('creditCard.nameOnCard');}
  get creditCardCardNumber(){ return this.checkoutFormGroup.get('creditCard.cardNumber');}
  get creditCardSecurityCode(){ return this.checkoutFormGroup.get('creditCard.securityCode');}
  get creditCardExpirationMonth(){ return this.checkoutFormGroup.get('creditCard.expirationMonth');}
  get creditCardExpirationYear(){ return this.checkoutFormGroup.get('creditCard.expirationYear');}


}
