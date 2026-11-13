import ProductsView from "./view";

export const metadata = {
  title: "Products",
};

export default async function ProductsPage({ searchParams }) {
  return <ProductsView initial={await searchParams} />;
}
