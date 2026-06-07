/** Publiczne API modułu produktów. */
export { default as ProductsPage, dynamic as productsPageDynamic } from "./page";
export { default as NewProductPage } from "./new-product-page";
export { default as EditProductPage } from "./edit-product-page";
export { ProductForm } from "./product-form";
export { ProductsList } from "./products-list";
export { DeleteProductButton } from "./delete-product-button";
export {
	listAdminProducts,
	getAdminProduct,
	listCategoryOptions,
	createAdminProduct,
	updateAdminProduct,
	deleteAdminProduct,
	type AdminProductRow,
	type AdminProductDetail,
	type ProductFormValues,
	type CategoryOption,
	type ConfigOption,
	listGlobalConfigOptions,
} from "./store";
export { saveProductAction, deleteProductAction, uploadImagesAction } from "./actions";
