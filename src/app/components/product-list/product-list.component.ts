import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CartItem } from 'src/app/common/cart-item';
import { Product } from 'src/app/common/product';
import { CartService } from 'src/app/services/cart.service';
import { ProductService } from 'src/app/services/product.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  currentCategoryId: number = 1;
  previousCategoryId: number = 1;
  searchMode: boolean = false;
  //new properties for pagination
  thePageNumber: number = 1;
  thePageSize: number = 5;
  theTotalElements: number = 0;
  previousKeyword!:string;

  constructor(
    private productService: ProductService,
    private theCartService:CartService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(() => {
      this.listProduct();
    });
  }

  listProduct() {
    this.searchMode = this.route.snapshot.paramMap.has('keyword');
    if (this.searchMode) {
      this.handleSearchProduct();
    } else {
      this.handleListProduct();
    }
  }

  handleSearchProduct() {
    const theKeyword: string = this.route.snapshot.paramMap.get('keyword')!;
    //if we have different keyword from previous then set pageNumber to 1
    if(this.previousKeyword != theKeyword){
      this.thePageNumber= 1;
    }
    this.previousKeyword=theKeyword;

    //now search for product using keyword
    this.productService.searchProductListPaginate(this.thePageNumber-1,
                                                  this.thePageSize,
                                                  theKeyword)
                                                  .subscribe(this.processResult());
  }

  handleListProduct() {
    const hasCategoryId: boolean = this.route.snapshot.paramMap.has('id'); //check if param has id or not
    if (hasCategoryId) {
      //get the category id and convert into number
      this.currentCategoryId = +this.route.snapshot.paramMap.get('id')!;
    } else {
      this.currentCategoryId = 1;
    }

    //check if we have different category than previous
    //if wee have different category than the previous the set it back to 1
    if (this.previousCategoryId != this.currentCategoryId) {
      this.thePageNumber = 1;
    }

    this.previousCategoryId = this.currentCategoryId;

    this.productService
      .getProductListPaginate(
        this.thePageNumber - 1, //psges are 0 based in backend
        this.thePageSize,
        this.currentCategoryId
      )
      .subscribe(this.processResult());
  }
  processResult() {
    return (data: any) => {
      this.products = data._embedded.products;
      this.thePageNumber = data.page.number + 1;
      this.thePageSize = data.page.size;
      this.theTotalElements = data.page.totalElements;
    };
  }

  updatePageSize(pageSize:number){
    this.thePageSize=pageSize;
    this.thePageNumber=1;
    this.listProduct();
  }

  addToCart(theProduct:Product){
    console.log(`Adding to cart : ${theProduct.name},${theProduct.unitPrice}`);
    const theCartItem = new CartItem(theProduct);
    this.theCartService.addToCart(theCartItem);
  }

}
